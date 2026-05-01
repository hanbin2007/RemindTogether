"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { runStreakTickNow } from "@/services/admin/tools";

interface State {
  ok: boolean;
  message?: string;
  scanned?: number;
  closed?: number;
}

export async function runStreakTickAction(
  _prev: State,
): Promise<State> {
  const admin = await requireAdmin();
  try {
    const r = await runStreakTickNow(admin);
    revalidatePath("/admin/tools");
    return { ok: true, scanned: r.scanned, closed: r.closed };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
