import { Prisma, type ContentType, type Report } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/principal";

export const contentTypeValues = ["REMINDER", "COMMENT"] as const;

export const createReportInputSchema = z.object({
  contentType: z.enum(contentTypeValues),
  contentId: z.string().uuid(),
  reason: z.string().trim().min(1, "请说明原因").max(500, "原因最多 500 字"),
});
export type CreateReportInput = z.infer<typeof createReportInputSchema>;

/**
 * User-side: file a report against a reminder or comment. The reporter
 * must have access to the content; we don't allow reporting things you
 * can't actually see (prevents probing private rows by id).
 */
export async function createReport(
  principal: Principal,
  rawInput: CreateReportInput,
): Promise<Report> {
  const input = createReportInputSchema.parse(rawInput);
  await assertContentVisibleToReporter(
    principal,
    input.contentType,
    input.contentId,
  );
  return prisma.report.create({
    data: {
      reporterId: principal.id,
      contentType: input.contentType as ContentType,
      contentId: input.contentId,
      reason: input.reason,
    },
  });
}

async function assertContentVisibleToReporter(
  principal: Principal,
  contentType: string,
  contentId: string,
): Promise<void> {
  if (contentType === "REMINDER") {
    const r = await prisma.reminder.findUnique({ where: { id: contentId } });
    if (!r || r.isDeleted) throw new NotFoundError("reminder");
    if (r.visibility === "PRIVATE" && r.creatorId !== principal.id) {
      throw new ForbiddenError("not_visible");
    }
    if (r.visibility === "GROUP" && r.groupId) {
      const ms = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId: r.groupId, userId: principal.id },
        },
      });
      if (!ms || ms.leftAt) throw new ForbiddenError("not_visible");
    }
    return;
  }
  if (contentType === "COMMENT") {
    const c = await prisma.comment.findUnique({
      where: { id: contentId },
      include: {
        reminder: {
          select: {
            visibility: true,
            groupId: true,
            creatorId: true,
            isDeleted: true,
          },
        },
      },
    });
    if (!c || c.isDeleted || c.reminder.isDeleted) {
      throw new NotFoundError("comment");
    }
    const r = c.reminder;
    if (r.visibility === "PRIVATE" && r.creatorId !== principal.id) {
      throw new ForbiddenError("not_visible");
    }
    if (r.visibility === "GROUP" && r.groupId) {
      const ms = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId: r.groupId, userId: principal.id },
        },
      });
      if (!ms || ms.leftAt) throw new ForbiddenError("not_visible");
    }
    return;
  }
  throw new BadRequestError("invalid_content_type");
}

/**
 * Render a small content card next to a Report so admins can decide
 * without clicking through to the full reminder/comment. Tombstones
 * deleted content rather than 404'ing.
 */
export interface ReportContentPreview {
  kind: "reminder" | "comment" | "tombstone";
  title?: string;
  body?: string;
  authorId?: string;
  authorName?: string;
  parentReminderId?: string;
}

export async function previewReportContent(
  contentType: string,
  contentId: string,
): Promise<ReportContentPreview> {
  if (contentType === "REMINDER") {
    const r = await prisma.reminder.findUnique({
      where: { id: contentId },
      include: { creator: { select: { id: true, displayName: true } } },
    });
    if (!r) return { kind: "tombstone" };
    return {
      kind: "reminder",
      title: r.title,
      body: r.description ?? undefined,
      authorId: r.creatorId,
      authorName: r.creator.displayName,
    };
  }
  if (contentType === "COMMENT") {
    const c = await prisma.comment.findUnique({
      where: { id: contentId },
      include: { user: { select: { id: true, displayName: true } } },
    });
    if (!c) return { kind: "tombstone" };
    return {
      kind: "comment",
      body: c.content,
      authorId: c.userId,
      authorName: c.user.displayName,
      parentReminderId: c.reminderId,
    };
  }
  return { kind: "tombstone" };
}
