import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { getGroupFriction } from "@/services/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id } = await params;
    const data = await getGroupFriction(principal, id);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
