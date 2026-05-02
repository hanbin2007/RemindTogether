import { NextResponse, type NextRequest } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { globalSearch } from "@/services/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const q = new URL(req.url).searchParams.get("q") ?? "";
    const data = await globalSearch(principal, q);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
