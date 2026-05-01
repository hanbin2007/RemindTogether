"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePrincipal } from "@/lib/auth/guards";
import { createReminder, createReminderInputSchema } from "@/services/reminders";

export interface CreateState {
  ok: boolean;
  fieldError?: string;
}

export async function createGroupReminderAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const principal = await requirePrincipal();
  const groupId = z.string().uuid().parse(formData.get("groupId"));
  const raw = {
    title: String(formData.get("title") ?? ""),
    visibility: "GROUP" as const,
    groupId,
  };
  const parsed = createReminderInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      fieldError: parsed.error.issues[0]?.message ?? "格式不对",
    };
  }
  await createReminder(principal, parsed.data);
  revalidatePath(`/app/groups/${groupId}`);
  return { ok: true };
}
