import { NextResponse, type NextRequest } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { getPokeContext } from "@/services/pokes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const to = new URL(req.url).searchParams.get("to") ?? "";
    if (!to) {
      return NextResponse.json(
        { error: { code: "no_to", message: "缺少 ?to=userId" } },
        { status: 400 },
      );
    }
    const data = await getPokeContext(principal, to);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
