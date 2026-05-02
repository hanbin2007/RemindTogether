"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import {
  adminDisbandGroup,
  adminRemoveMember,
  adminTransferOwner,
} from "@/services/admin/groups";

const groupIdSchema = z.object({ groupId: z.string().uuid() });
const removeSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function disbandAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { groupId } = groupIdSchema.parse({
    groupId: formData.get("groupId"),
  });
  await adminDisbandGroup(admin, groupId);
  revalidatePath(`/admin/groups/${groupId}`);
  revalidatePath("/admin/groups");
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { groupId, userId } = removeSchema.parse({
    groupId: formData.get("groupId"),
    userId: formData.get("userId"),
  });
  await adminRemoveMember(admin, groupId, userId);
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function transferOwnerAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const { groupId, userId } = removeSchema.parse({
    groupId: formData.get("groupId"),
    userId: formData.get("newOwnerId"),
  });
  await adminTransferOwner(admin, groupId, userId);
  revalidatePath(`/admin/groups/${groupId}`);
}
