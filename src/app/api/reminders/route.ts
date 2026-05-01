import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import {
  createReminder,
  createReminderInputSchema,
  listReminders,
  listScopeSchema,
} from "@/services/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const scope = listScopeSchema.parse(
      req.nextUrl.searchParams.get("scope") ?? "today",
    );
    const data = await listReminders(principal, scope);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const body = createReminderInputSchema.parse(await req.json());
    const data = await createReminder(principal, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
