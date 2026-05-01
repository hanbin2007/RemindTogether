import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import {
  listInbox,
  listInboxQuerySchema,
  sendPoke,
  sendPokeInputSchema,
} from "@/services/pokes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const body = sendPokeInputSchema.parse(await req.json());
    const data = await sendPoke(principal, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function GET(req: NextRequest) {
  // Convenience: GET /api/pokes also returns the inbox so callers don't
  // have to hit /inbox if they're already on /api/pokes. Default limit 30.
  try {
    const principal = await requirePrincipal();
    const sp = req.nextUrl.searchParams;
    const query = listInboxQuerySchema.parse({
      limit: sp.get("limit") ?? undefined,
      before: sp.get("before") ?? undefined,
      unreadOnly: sp.get("unreadOnly") ?? undefined,
    });
    const data = await listInbox(principal, query);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
