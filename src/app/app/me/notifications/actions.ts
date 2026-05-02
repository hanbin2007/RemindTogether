"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePrincipal } from "@/lib/auth/guards";
import { markPokeRead } from "@/services/pokes";
import { markActivityRead, markAllActivityRead } from "@/services/activity";

const idSchema = z.object({ id: z.string().uuid() });

export async function markReadAction(formData: FormData): Promise<void> {
  const principal = await requirePrincipal();
  const { id } = idSchema.parse({ id: formData.get("id") });
  // Try the unified activity table first (Phase 10). Fall back to the
  // legacy poke-only mark for old POKE_RECEIVED rows that never got a
  // matching Notification row.
  const n = await markActivityRead(principal, [id]);
  if (n === 0) {
    await markPokeRead(principal, id).catch(() => {
      /* swallow — id may simply not match either table */
    });
  }
  revalidatePath("/app/me/notifications");
  revalidatePath("/app/me");
}

export async function markAllReadAction(): Promise<void> {
  const principal = await requirePrincipal();
  await markAllActivityRead(principal);
  revalidatePath("/app/me/notifications");
  revalidatePath("/app/me");
}
