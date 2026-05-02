"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePrincipal } from "@/lib/auth/guards";
import { env } from "@/lib/env";
import {
  createGroup,
  createGroupInputSchema,
  issueInviteForGroup,
  leaveGroup,
} from "@/services/groups";

export interface CreateGroupState {
  ok: boolean;
  fieldError?: string;
  groupId?: string;
}

export async function createGroupAction(
  _prev: CreateGroupState,
  formData: FormData,
): Promise<CreateGroupState> {
  const principal = await requirePrincipal();
  const raw = {
    name: String(formData.get("name") ?? ""),
    coverEmoji: (formData.get("coverEmoji") as string) || undefined,
  };
  const parsed = createGroupInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      fieldError: parsed.error.issues[0]?.message ?? "群名格式不对",
    };
  }
  const group = await createGroup(principal, parsed.data);
  revalidatePath("/app/groups");
  return { ok: true, groupId: group.id };
}

export interface InviteState {
  ok: boolean;
  url?: string;
  expiresAt?: string;
  message?: string;
}

const groupIdSchema = z.object({ groupId: z.string().uuid() });

export async function issueInviteAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const principal = await requirePrincipal();
  const { groupId } = groupIdSchema.parse({
    groupId: formData.get("groupId"),
  });
  try {
    const r = await issueInviteForGroup(principal, groupId, env.baseUrl);
    return {
      ok: true,
      url: r.url,
      expiresAt: r.expiresAt.toISOString(),
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function leaveGroupAction(formData: FormData): Promise<void> {
  const principal = await requirePrincipal();
  const { groupId } = groupIdSchema.parse({
    groupId: formData.get("groupId"),
  });
  await leaveGroup(principal, groupId);
  revalidatePath("/app/groups");
  redirect("/app/groups");
}
