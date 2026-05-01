import {
  Prisma,
  type Claim,
  type Comment,
  type Completion,
  type Reaction,
  type Reminder,
  type ReminderTag,
  type Tag,
  type User,
} from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/guards";
import { assertActiveGroupMember } from "@/services/groups";
import { broadcast, groupRoom, RtEvent } from "@/lib/socket/broadcast";

// -----------------------------------------------------------------------------
// schemas
// -----------------------------------------------------------------------------

const isoDate = z
  .string()
  .datetime({ message: "时间必须是 ISO 8601" })
  .transform((s) => new Date(s));

export const reminderVisibilityValues = ["PRIVATE", "GROUP"] as const;

export const createReminderInputSchema = z
  .object({
    title: z.string().trim().min(1, "标题不能为空").max(140),
    description: z
      .string()
      .trim()
      .max(2000, "描述太长，最多 2000 字")
      .optional(),
    visibility: z.enum(reminderVisibilityValues),
    groupId: z.string().uuid().optional(),
    dueAt: isoDate.optional(),
    repeatRule: z.string().max(200).optional(),
    tagIds: z.array(z.string().uuid()).max(8).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.visibility === "GROUP" && !val.groupId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["groupId"],
        message: "群组提醒必须指定 groupId",
      });
    }
    if (val.visibility === "PRIVATE" && val.groupId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["groupId"],
        message: "私人提醒不能带 groupId",
      });
    }
  });
export type CreateReminderInput = z.infer<typeof createReminderInputSchema>;

export const updateReminderInputSchema = z
  .object({
    title: z.string().trim().min(1).max(140).optional(),
    description: z.string().trim().max(2000).optional(),
    dueAt: isoDate.nullable().optional(),
    repeatRule: z.string().max(200).nullable().optional(),
    isPinned: z.boolean().optional(),
    tagIds: z.array(z.string().uuid()).max(8).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "什么都没改" });
export type UpdateReminderInput = z.infer<typeof updateReminderInputSchema>;

export const listScopeSchema = z.union([
  z.literal("today"),
  z.literal("private"),
  z
    .string()
    .regex(/^group:[0-9a-fA-F-]{36}$/u, "scope 必须是 today/private/group:UUID"),
]);
export type ListScope = z.infer<typeof listScopeSchema>;

export const completeReminderInputSchema = z.object({
  mediaUrl: z.string().url().max(1024).nullish(),
  note: z.string().trim().max(500).nullish(),
});
export type CompleteReminderInput = z.infer<typeof completeReminderInputSchema>;

export const addCommentInputSchema = z.object({
  content: z.string().trim().min(1, "评论不能为空").max(500, "评论最多 500 字"),
});
export type AddCommentInput = z.infer<typeof addCommentInputSchema>;

export const addReactionInputSchema = z.object({
  emoji: z
    .string()
    .trim()
    .min(1)
    .max(10, "emoji 太长 — 一两个字符就够"),
});
export type AddReactionInput = z.infer<typeof addReactionInputSchema>;

// -----------------------------------------------------------------------------
// authorization helpers
// -----------------------------------------------------------------------------

interface AccessOpts {
  /** Whether the caller must be allowed to *write* the reminder. */
  write?: boolean;
}

/**
 * Load a reminder and verify the caller has access. Returns the row plus
 * a tiny capability set. Throws NotFoundError for missing/deleted, and
 * ForbiddenError for permission denials.
 */
export async function assertReminderAccess(
  principal: Principal,
  reminderId: string,
  opts: AccessOpts = {},
): Promise<{
  reminder: Reminder;
  isCreator: boolean;
  isGroupOwner: boolean;
  canWriteContent: boolean;
}> {
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
  });
  if (!reminder || reminder.isDeleted) throw new NotFoundError("reminder");

  if (reminder.visibility === "PRIVATE") {
    if (reminder.creatorId !== principal.id) {
      throw new ForbiddenError("not_owner");
    }
    return {
      reminder,
      isCreator: true,
      isGroupOwner: false,
      canWriteContent: true,
    };
  }

  // GROUP — caller must be an active group member
  if (!reminder.groupId) {
    // Should not happen given schema, but guard anyway
    throw new BadRequestError("group_reminder_missing_group");
  }
  const ms = await assertActiveGroupMember(principal.id, reminder.groupId);
  const isCreator = reminder.creatorId === principal.id;
  const isGroupOwner = ms.role === "OWNER";
  const canWriteContent = isCreator || isGroupOwner;
  if (opts.write && !canWriteContent) {
    throw new ForbiddenError("not_creator_or_owner");
  }
  return { reminder, isCreator, isGroupOwner, canWriteContent };
}

// -----------------------------------------------------------------------------
// CRUD
// -----------------------------------------------------------------------------

async function attachTagsTransactional(
  tx: Prisma.TransactionClient,
  reminderId: string,
  userId: string,
  tagIds: string[],
): Promise<void> {
  if (tagIds.length === 0) return;
  // Make sure all tag ids exist and belong to the user. Tags are
  // user-scoped per the schema (Tag.userId + @@unique([userId, name])).
  const owned = await tx.tag.findMany({
    where: { id: { in: tagIds }, userId },
    select: { id: true },
  });
  if (owned.length !== tagIds.length) {
    throw new BadRequestError(
      "invalid_tag",
      "至少有一个标签不存在或不属于你",
    );
  }
  await tx.reminderTag.createMany({
    data: tagIds.map((tagId) => ({ reminderId, tagId })),
    skipDuplicates: true,
  });
}

export interface ReminderWithRelations extends Reminder {
  creator: Pick<User, "id" | "displayName" | "avatarUrl">;
  tags: (ReminderTag & { tag: Tag })[];
  claims: (Claim & { user: Pick<User, "id" | "displayName" | "avatarUrl"> })[];
  completions: Completion[];
  _count: { comments: number; reactions: number };
}

const reminderInclude = {
  creator: {
    select: { id: true, displayName: true, avatarUrl: true },
  },
  tags: { include: { tag: true } },
  claims: {
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  },
  completions: {
    take: 5,
    orderBy: { completedAt: "desc" as const },
  },
  _count: { select: { comments: true, reactions: true } },
} satisfies Prisma.ReminderInclude;

export async function createReminder(
  principal: Principal,
  input: CreateReminderInput,
): Promise<ReminderWithRelations> {
  if (input.visibility === "GROUP") {
    await assertActiveGroupMember(principal.id, input.groupId!);
  }

  const reminder = await prisma.$transaction(async (tx) => {
    const created = await tx.reminder.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        creatorId: principal.id,
        groupId: input.visibility === "GROUP" ? input.groupId! : null,
        visibility: input.visibility,
        dueAt: input.dueAt ?? null,
        repeatRule: input.repeatRule ?? null,
      },
    });
    if (input.tagIds && input.tagIds.length > 0) {
      await attachTagsTransactional(
        tx,
        created.id,
        principal.id,
        input.tagIds,
      );
    }
    return tx.reminder.findUniqueOrThrow({
      where: { id: created.id },
      include: reminderInclude,
    });
  });

  if (reminder.visibility === "GROUP" && reminder.groupId) {
    await broadcast(groupRoom(reminder.groupId), RtEvent.ReminderCreated, {
      reminder,
      by: principal.id,
    });
  }
  return reminder;
}

export async function getReminder(
  principal: Principal,
  id: string,
): Promise<ReminderWithRelations> {
  const { reminder } = await assertReminderAccess(principal, id);
  return prisma.reminder.findUniqueOrThrow({
    where: { id: reminder.id },
    include: reminderInclude,
  });
}

export async function updateReminder(
  principal: Principal,
  id: string,
  input: UpdateReminderInput,
): Promise<ReminderWithRelations> {
  const { reminder } = await assertReminderAccess(principal, id, { write: true });
  const updated = await prisma.$transaction(async (tx) => {
    await tx.reminder.update({
      where: { id: reminder.id },
      data: {
        title: input.title,
        description: input.description,
        dueAt: input.dueAt,
        repeatRule: input.repeatRule,
        isPinned: input.isPinned,
      },
    });
    if (input.tagIds) {
      await tx.reminderTag.deleteMany({ where: { reminderId: reminder.id } });
      if (input.tagIds.length > 0) {
        await attachTagsTransactional(
          tx,
          reminder.id,
          principal.id,
          input.tagIds,
        );
      }
    }
    return tx.reminder.findUniqueOrThrow({
      where: { id: reminder.id },
      include: reminderInclude,
    });
  });

  if (updated.visibility === "GROUP" && updated.groupId) {
    await broadcast(groupRoom(updated.groupId), RtEvent.ReminderUpdated, {
      reminderId: updated.id,
      changes: input,
      by: principal.id,
    });
  }
  return updated;
}

export async function deleteReminder(
  principal: Principal,
  id: string,
): Promise<void> {
  const { reminder } = await assertReminderAccess(principal, id, { write: true });
  await prisma.reminder.update({
    where: { id: reminder.id },
    data: { isDeleted: true },
  });
  if (reminder.visibility === "GROUP" && reminder.groupId) {
    await broadcast(groupRoom(reminder.groupId), RtEvent.ReminderDeleted, {
      reminderId: reminder.id,
      by: principal.id,
    });
  }
}

// -----------------------------------------------------------------------------
// list / scope
// -----------------------------------------------------------------------------

export async function listReminders(
  principal: Principal,
  scope: ListScope,
): Promise<ReminderWithRelations[]> {
  if (scope === "private") {
    return prisma.reminder.findMany({
      where: {
        creatorId: principal.id,
        visibility: "PRIVATE",
        isDeleted: false,
      },
      orderBy: [{ isPinned: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      include: reminderInclude,
    });
  }

  if (scope === "today") {
    const now = new Date();
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const myGroupIds = await prisma.groupMember
      .findMany({
        where: { userId: principal.id, leftAt: null },
        select: { groupId: true },
      })
      .then((rows) => rows.map((r) => r.groupId));

    return prisma.reminder.findMany({
      where: {
        isDeleted: false,
        status: "ACTIVE",
        OR: [
          { creatorId: principal.id, visibility: "PRIVATE" },
          { visibility: "GROUP", groupId: { in: myGroupIds } },
        ],
        AND: [
          {
            OR: [
              { dueAt: null },
              { dueAt: { gte: start, lt: end } },
            ],
          },
        ],
      },
      orderBy: [{ isPinned: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      include: reminderInclude,
    });
  }

  // group:UUID
  const groupId = scope.slice("group:".length);
  await assertActiveGroupMember(principal.id, groupId);
  return prisma.reminder.findMany({
    where: { groupId, isDeleted: false, visibility: "GROUP" },
    orderBy: [{ isPinned: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: reminderInclude,
  });
}

// -----------------------------------------------------------------------------
// completions / skip / claims / comments / reactions
// -----------------------------------------------------------------------------

export async function completeReminder(
  principal: Principal,
  id: string,
  input: CompleteReminderInput = {},
): Promise<Completion> {
  const { reminder } = await assertReminderAccess(principal, id);
  const completion = await prisma.$transaction(async (tx) => {
    const c = await tx.completion.create({
      data: {
        reminderId: reminder.id,
        userId: principal.id,
        mediaUrl: input.mediaUrl ?? null,
        note: input.note ?? null,
      },
    });
    // Non-recurring reminders flip to DONE on first completion.
    if (!reminder.repeatRule && reminder.status === "ACTIVE") {
      await tx.reminder.update({
        where: { id: reminder.id },
        data: { status: "DONE" },
      });
    }
    return c;
  });
  if (reminder.visibility === "GROUP" && reminder.groupId) {
    await broadcast(groupRoom(reminder.groupId), RtEvent.ReminderCompleted, {
      reminderId: reminder.id,
      by: principal.id,
      completion,
    });
  }
  return completion;
}

export async function skipReminderDay(
  principal: Principal,
  id: string,
): Promise<void> {
  const { reminder } = await assertReminderAccess(principal, id);
  // For now, skipping a non-recurring private reminder marks it SKIPPED
  // (Phase 6 will integrate this with the streak engine for recurring
  // reminders). We never throw for already-skipped — idempotent.
  await prisma.reminder.update({
    where: { id: reminder.id },
    data: { status: "SKIPPED" },
  });
}

export async function claimReminder(
  principal: Principal,
  id: string,
): Promise<Claim> {
  const { reminder } = await assertReminderAccess(principal, id);
  if (reminder.visibility !== "GROUP") {
    throw new BadRequestError(
      "claim_only_on_group",
      "私人提醒不需要认领",
    );
  }
  let claim: Claim;
  let isNew = true;
  try {
    claim = await prisma.claim.create({
      data: { reminderId: reminder.id, userId: principal.id },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      claim = await prisma.claim.findUniqueOrThrow({
        where: {
          reminderId_userId: {
            reminderId: reminder.id,
            userId: principal.id,
          },
        },
      });
      isNew = false;
    } else {
      throw e;
    }
  }
  if (isNew && reminder.groupId) {
    await broadcast(groupRoom(reminder.groupId), RtEvent.ReminderClaimed, {
      reminderId: reminder.id,
      by: principal.id,
    });
  }
  return claim;
}

export async function unclaimReminder(
  principal: Principal,
  id: string,
): Promise<void> {
  const { reminder } = await assertReminderAccess(principal, id);
  const result = await prisma.claim.deleteMany({
    where: { reminderId: reminder.id, userId: principal.id },
  });
  if (result.count > 0 && reminder.groupId) {
    await broadcast(groupRoom(reminder.groupId), RtEvent.ReminderUnclaimed, {
      reminderId: reminder.id,
      by: principal.id,
    });
  }
}

export async function addComment(
  principal: Principal,
  id: string,
  input: AddCommentInput,
): Promise<Comment> {
  const { reminder } = await assertReminderAccess(principal, id);
  const comment = await prisma.comment.create({
    data: {
      reminderId: reminder.id,
      userId: principal.id,
      content: input.content,
    },
  });
  if (reminder.visibility === "GROUP" && reminder.groupId) {
    await broadcast(groupRoom(reminder.groupId), RtEvent.CommentNew, {
      reminderId: reminder.id,
      comment,
    });
  }
  return comment;
}

export async function addReaction(
  principal: Principal,
  id: string,
  input: AddReactionInput,
): Promise<Reaction> {
  const { reminder } = await assertReminderAccess(principal, id);
  let reaction: Reaction;
  let isNew = true;
  try {
    reaction = await prisma.reaction.create({
      data: {
        reminderId: reminder.id,
        userId: principal.id,
        emoji: input.emoji,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      reaction = await prisma.reaction.findFirstOrThrow({
        where: {
          reminderId: reminder.id,
          userId: principal.id,
          emoji: input.emoji,
        },
      });
      isNew = false;
    } else {
      throw e;
    }
  }
  if (isNew && reminder.visibility === "GROUP" && reminder.groupId) {
    await broadcast(groupRoom(reminder.groupId), RtEvent.ReactionNew, {
      reminderId: reminder.id,
      reaction,
    });
  }
  return reaction;
}
