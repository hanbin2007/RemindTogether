"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePrincipal } from "@/lib/auth/guards";
import {
  completeReminder,
  createReminder,
  createReminderInputSchema,
  deleteReminder,
  skipReminderDay,
} from "@/services/reminders";

export interface CreateState {
  ok: boolean;
  fieldError?: string;
}

const createSchema = createReminderInputSchema;

export async function createReminderAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const principal = await requirePrincipal();
  const raw = {
    title: String(formData.get("title") ?? ""),
    description: (formData.get("description") as string) || undefined,
    visibility: "PRIVATE" as const,
  };
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      fieldError: parsed.error.issues[0]?.message ?? "格式不对",
    };
  }
  await createReminder(principal, parsed.data);
  revalidatePath("/app");
  revalidatePath("/app/private");
  return { ok: true };
}

const idSchema = z.object({ id: z.string().uuid() });

export async function completeAction(formData: FormData): Promise<void> {
  const principal = await requirePrincipal();
  const { id } = idSchema.parse({ id: formData.get("id") });
  await completeReminder(principal, id);
  revalidatePath("/app");
  revalidatePath("/app/private");
  revalidatePath(`/app/reminders/${id}`);
}

export async function skipAction(formData: FormData): Promise<void> {
  const principal = await requirePrincipal();
  const { id } = idSchema.parse({ id: formData.get("id") });
  await skipReminderDay(principal, id);
  revalidatePath("/app");
}

export async function deleteAction(formData: FormData): Promise<void> {
  const principal = await requirePrincipal();
  const { id } = idSchema.parse({ id: formData.get("id") });
  await deleteReminder(principal, id);
  revalidatePath("/app");
  revalidatePath("/app/private");
}
