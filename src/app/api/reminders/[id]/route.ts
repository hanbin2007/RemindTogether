import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import {
  deleteReminder,
  getReminder,
  updateReminder,
  updateReminderInputSchema,
} from "@/services/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const data = await getReminder(principal, id);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const body = updateReminderInputSchema.parse(await req.json());
    const data = await updateReminder(principal, id, body);
    return NextResponse.json({ data });
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
    await deleteReminder(principal, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
