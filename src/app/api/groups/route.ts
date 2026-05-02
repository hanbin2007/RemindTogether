import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import {
  createGroup,
  createGroupInputSchema,
  listMyGroups,
} from "@/services/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const principal = await requirePrincipal();
    const groups = await listMyGroups(principal);
    return NextResponse.json({ data: groups });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const body = createGroupInputSchema.parse(await req.json());
    const group = await createGroup(principal, body);
    return NextResponse.json({ data: group }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
