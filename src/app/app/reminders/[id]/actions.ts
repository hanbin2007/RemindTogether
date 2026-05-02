"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePrincipal } from "@/lib/auth/guards";
import {
  addComment,
  addCommentInputSchema,
  addReaction,
  addReactionInputSchema,
  claimReminder,
  completeReminder,
  unclaimReminder,
} from "@/services/reminders";
import { sendPoke, sendPokeInputSchema } from "@/services/pokes";
import { createReport, createReportInputSchema } from "@/services/reports";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";

const idSchema = z.object({ id: z.string().uuid() });

export interface CommentState {
  ok: boolean;
  message?: string;
}

export async function addCommentAction(
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const principal = await requirePrincipal();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const parsed = addCommentInputSchema.safeParse({
    content: formData.get("content") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "评论格式不对",
    };
  }
  await addComment(principal, id, parsed.data);
  revalidatePath(`/app/reminders/${id}`);
  return { ok: true };
}

export async function addReactionAction(formData: FormData): Promise<void> {
  const principal = await requirePrincipal();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const parsed = addReactionInputSchema.parse({
    emoji: formData.get("emoji"),
  });
  await addReaction(principal, id, parsed);
  revalidatePath(`/app/reminders/${id}`);
}

export async function toggleClaimAction(formData: FormData): Promise<void> {
  const principal = await requirePrincipal();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const action = formData.get("action") as "claim" | "unclaim";
  if (action === "unclaim") {
    await unclaimReminder(principal, id);
  } else {
    await claimReminder(principal, id);
  }
  revalidatePath(`/app/reminders/${id}`);
}

export async function completeFromDetailAction(
  formData: FormData,
): Promise<void> {
  const principal = await requirePrincipal();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const note = (formData.get("note") as string) || undefined;
  await completeReminder(principal, id, note ? { note } : undefined);
  revalidatePath(`/app/reminders/${id}`);
}

export interface PokeState {
  ok: boolean;
  message?: string;
  remaining?: number;
}

export interface ReportState {
  ok: boolean;
  message?: string;
}

export async function reportContentAction(
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const principal = await requirePrincipal();
  const parsed = createReportInputSchema.safeParse({
    contentType: formData.get("contentType"),
    contentId: formData.get("contentId"),
    reason: (formData.get("reason") as string) ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "举报格式不对",
    };
  }
  try {
    await createReport(principal, parsed.data);
    return { ok: true };
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return { ok: false, message: "你看不到这条内容，无法举报" };
    }
    if (e instanceof NotFoundError) {
      return { ok: false, message: "内容不存在或已删除" };
    }
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function sendPokeAction(
  _prev: PokeState,
  formData: FormData,
): Promise<PokeState> {
  const principal = await requirePrincipal();
  const parsed = sendPokeInputSchema.safeParse({
    toUserId: formData.get("toUserId"),
    reminderId: formData.get("reminderId") ?? undefined,
    tone: formData.get("tone"),
    message: (formData.get("message") as string) || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "拍拍格式不对",
    };
  }
  try {
    const r = await sendPoke(principal, parsed.data);
    revalidatePath(`/app/reminders/${parsed.data.reminderId ?? ""}`);
    return { ok: true, remaining: r.quota.remaining };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
