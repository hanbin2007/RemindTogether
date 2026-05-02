import { NextResponse, type NextRequest } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { getGroupHistory } from "@/services/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id } = await params;
    const weeks = Number(new URL(req.url).searchParams.get("weeks") ?? 8);
    const data = await getGroupHistory(principal, id, { weeks });
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
