"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePrincipal } from "@/lib/auth/guards";
import { cheerUp } from "@/services/cheers";

const schema = z.object({
  toUserId: z.string().uuid(),
  groupId: z.string().uuid(),
});

export interface CheerState {
  ok: boolean;
  message?: string;
  remaining?: number;
}

export async function cheerUpAction(
  _prev: CheerState,
  formData: FormData,
): Promise<CheerState> {
  try {
    const principal = await requirePrincipal();
    const input = schema.parse({
      toUserId: formData.get("toUserId"),
      groupId: formData.get("groupId"),
    });
    const r = await cheerUp(principal, input);
    revalidatePath(`/app/groups/${input.groupId}`);
    return { ok: true, remaining: r.remaining };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
