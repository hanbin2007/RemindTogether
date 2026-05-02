"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePrincipal } from "@/lib/auth/guards";
import { skipDayWithShield } from "@/services/skip-day";
import { updateReminder } from "@/services/reminders";
import { moveReminderToGroup, deleteReminder } from "@/services/reminders";

export interface SkipDayState {
  ok: boolean;
  message?: string;
  cardsLeft?: number;
  reason?: "already_done" | "already_protected";
}

const skipDaySchema = z.object({ mood: z.string().trim().max(140).optional() });

export async function skipDayAction(
  _prev: SkipDayState,
  formData: FormData,
): Promise<SkipDayState> {
  try {
    const principal = await requirePrincipal();
    const input = skipDaySchema.parse({
      mood: (formData.get("mood") as string) || undefined,
    });
    const r = await skipDayWithShield(principal, input);
    revalidatePath("/app");
    revalidatePath("/app/me");
    revalidatePath("/app/me/streak");
    return {
      ok: r.applied,
      cardsLeft: r.cardsLeft,
      reason: r.reason,
      message: r.applied
        ? "今天先放过自己 — 你的连胜还在 ✓"
        : r.reason === "already_done"
          ? "今天已经完成过，不用再用保护卡。"
          : r.reason === "already_protected"
            ? "今天已经用过保护卡了。"
            : undefined,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

// ---- Reschedule ----

export interface RescheduleState {
  ok: boolean;
  message?: string;
}

const rescheduleSchema = z.object({
  id: z.string().uuid(),
  // ISO datetime
  dueAt: z.string().datetime(),
});

export async function rescheduleAction(
  _prev: RescheduleState,
  formData: FormData,
): Promise<RescheduleState> {
  try {
    const principal = await requirePrincipal();
    const input = rescheduleSchema.parse({
      id: formData.get("id"),
      dueAt: formData.get("dueAt"),
    });
    await updateReminder(principal, input.id, {
      dueAt: new Date(input.dueAt),
    });
    revalidatePath(`/app/reminders/${input.id}`);
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

// ---- Long-press actions ----

export interface LongPressState {
  ok: boolean;
  message?: string;
  redirect?: string;
}

export async function moveToGroupAction(
  _prev: LongPressState,
  formData: FormData,
): Promise<LongPressState> {
  try {
    const principal = await requirePrincipal();
    const id = z.string().uuid().parse(formData.get("id"));
    const groupId = z.string().uuid().parse(formData.get("groupId"));
    await moveReminderToGroup(principal, id, groupId);
    revalidatePath("/app");
    revalidatePath("/app/private");
    revalidatePath(`/app/groups/${groupId}`);
    return { ok: true, redirect: `/app/groups/${groupId}` };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function pinAction(formData: FormData): Promise<void> {
  const principal = await requirePrincipal();
  const id = z.string().uuid().parse(formData.get("id"));
  const isPinned = formData.get("pinned") === "true";
  await updateReminder(principal, id, { isPinned });
  revalidatePath("/app");
  revalidatePath("/app/private");
}

export async function deleteReminderAction(formData: FormData): Promise<void> {
  const principal = await requirePrincipal();
  const id = z.string().uuid().parse(formData.get("id"));
  await deleteReminder(principal, id);
  revalidatePath("/app");
  revalidatePath("/app/private");
}
