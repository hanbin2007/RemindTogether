import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { listInbox, listInboxQuerySchema } from "@/services/pokes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
