import { NextResponse, type NextRequest } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { searchGroupMembers } from "@/services/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id } = await params;
    const q = new URL(req.url).searchParams.get("q") ?? "";
    const data = await searchGroupMembers(principal, id, q);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
