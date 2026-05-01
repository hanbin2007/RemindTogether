import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import {
  completeReminder,
  completeReminderInputSchema,
} from "@/services/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const body =
      req.headers.get("content-length") === "0"
        ? {}
        : completeReminderInputSchema.parse(await req.json().catch(() => ({})));
    const data = await completeReminder(
      principal,
      id,
      completeReminderInputSchema.parse(body),
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
