"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePrincipal } from "@/lib/auth/guards";
import { markPokeRead } from "@/services/pokes";

const idSchema = z.object({ id: z.string().uuid() });

export async function markReadAction(formData: FormData): Promise<void> {
  const principal = await requirePrincipal();
  const { id } = idSchema.parse({ id: formData.get("id") });
  await markPokeRead(principal, id);
  revalidatePath("/app/me/notifications");
  revalidatePath("/app/me");
}
