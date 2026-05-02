import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { useShieldToday } from "@/services/shield";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const principal = await requirePrincipal();
    const data = await useShieldToday(principal);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
