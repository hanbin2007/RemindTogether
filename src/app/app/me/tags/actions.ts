"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePrincipal } from "@/lib/auth/guards";
import {
  createTag,
  createTagInputSchema,
  deleteTag,
} from "@/services/tags";

export interface TagState {
  ok: boolean;
  message?: string;
}

export async function createTagAction(
  _prev: TagState,
  formData: FormData,
): Promise<TagState> {
  const principal = await requirePrincipal();
  const raw = {
    name: String(formData.get("name") ?? ""),
    iconName: String(formData.get("iconName") ?? "tag"),
    color: String(formData.get("color") ?? "#1a1a1a"),
  };
  const parsed = createTagInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "格式不对",
    };
  }
  try {
    await createTag(principal, parsed.data);
    revalidatePath("/app/me/tags");
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  const principal = await requirePrincipal();
  const id = z.string().uuid().parse(formData.get("id"));
  await deleteTag(principal, id);
  revalidatePath("/app/me/tags");
}
