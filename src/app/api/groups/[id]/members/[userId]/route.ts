import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { removeMember } from "@/services/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id, userId } = await ctx.params;
    await removeMember(principal, id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
