import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { getStreakStatus } from "@/services/streaks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const principal = await requirePrincipal();
    const data = await getStreakStatus(principal);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
