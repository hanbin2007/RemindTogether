"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import {
  adminIssuePasswordReset,
  adminResendVerification,
  banUser,
  demoteFromAdmin,
  forceVerifyEmail,
  promoteToAdmin,
  unbanUser,
} from "@/services/admin/users";

const idSchema = z.object({ userId: z.string().uuid() });

export async function banAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { userId } = idSchema.parse({ userId: formData.get("userId") });
  const reason = (formData.get("reason") as string) || undefined;
  await banUser(admin, userId, reason);
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function unbanAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { userId } = idSchema.parse({ userId: formData.get("userId") });
  await unbanUser(admin, userId);
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function promoteAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { userId } = idSchema.parse({ userId: formData.get("userId") });
  await promoteToAdmin(admin, userId);
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function demoteAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { userId } = idSchema.parse({ userId: formData.get("userId") });
  await demoteFromAdmin(admin, userId);
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
}

export async function forceVerifyAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { userId } = idSchema.parse({ userId: formData.get("userId") });
  await forceVerifyEmail(admin, userId);
  revalidatePath(`/admin/users/${userId}`);
}

export async function issueResetAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { userId } = idSchema.parse({ userId: formData.get("userId") });
  await adminIssuePasswordReset(admin, userId);
  revalidatePath(`/admin/users/${userId}`);
}

export async function resendVerifyAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { userId } = idSchema.parse({ userId: formData.get("userId") });
  await adminResendVerification(admin, userId);
  revalidatePath(`/admin/users/${userId}`);
}
