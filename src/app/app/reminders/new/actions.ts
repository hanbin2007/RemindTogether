"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePrincipal } from "@/lib/auth/guards";
import { createReminder } from "@/services/reminders";

export interface CreateFullState {
  ok: boolean;
  fieldError?: string;
  reminderId?: string;
}

const schema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(140),
  visibility: z.enum(["PRIVATE", "GROUP"]),
  groupId: z.string().uuid().optional(),
  dueAt: z.string().datetime().optional(),
});

export async function createReminderFullAction(
  _prev: CreateFullState,
  formData: FormData,
): Promise<CreateFullState> {
  const principal = await requirePrincipal();
  const dueRaw = formData.get("dueAt");
  const dueAt =
    typeof dueRaw === "string" && dueRaw.length > 0
      ? new Date(dueRaw).toISOString()
      : undefined;
  const parsed = schema.safeParse({
    title: formData.get("title") ?? "",
    visibility: formData.get("visibility") ?? "PRIVATE",
    groupId: formData.get("groupId") || undefined,
    dueAt,
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldError: parsed.error.issues[0]?.message ?? "格式不对",
    };
  }
  if (parsed.data.visibility === "GROUP" && !parsed.data.groupId) {
    return { ok: false, fieldError: "共享提醒需要选个群" };
  }
  const r = await createReminder(principal, {
    title: parsed.data.title,
    visibility: parsed.data.visibility,
    groupId: parsed.data.groupId,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
  });
  revalidatePath("/app");
  revalidatePath("/app/private");
  if (parsed.data.groupId) {
    revalidatePath(`/app/groups/${parsed.data.groupId}`);
  }
  return { ok: true, reminderId: r.id };
}
