import { NextResponse, type NextRequest } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import {
  countUnread,
  listActivity,
  markAllActivityRead,
  markActivityRead,
} from "@/services/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const unreadOnly = url.searchParams.get("unread") === "true";
    const [items, unread] = await Promise.all([
      listActivity(principal, { limit, unreadOnly }),
      countUnread(principal),
    ]);
    return NextResponse.json({ data: { items, unread } });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const body = (await req.json().catch(() => ({}))) as {
      ids?: string[];
      all?: boolean;
    };
    if (body.all) {
      const n = await markAllActivityRead(principal);
      return NextResponse.json({ data: { marked: n } });
    }
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const n = await markActivityRead(principal, body.ids);
      return NextResponse.json({ data: { marked: n } });
    }
    return NextResponse.json(
      { error: { code: "no_ids", message: "传 ids[] 或 all:true" } },
      { status: 400 },
    );
  } catch (e) {
    return handleApiError(e);
  }
}
