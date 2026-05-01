"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import {
  adminSoftDeleteReminder,
  adminUndeleteReminder,
} from "@/services/admin/reminders";

const schema = z.object({ reminderId: z.string().uuid() });

export async function adminUndeleteAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { reminderId } = schema.parse({
    reminderId: formData.get("reminderId"),
  });
  await adminUndeleteReminder(admin, reminderId);
  revalidatePath("/admin/reminders");
}

export async function adminSoftDeleteAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { reminderId } = schema.parse({
    reminderId: formData.get("reminderId"),
  });
  await adminSoftDeleteReminder(admin, reminderId);
  revalidatePath("/admin/reminders");
}
