import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { claimReminder, unclaimReminder } from "@/services/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const data = await claimReminder(principal, id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    await unclaimReminder(principal, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
