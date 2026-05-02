import { NextResponse, type NextRequest } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { getHeatmap } from "@/services/heatmap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const url = new URL(req.url);
    const days = Number(url.searchParams.get("days") ?? 14);
    const data = await getHeatmap(principal, { days });
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
