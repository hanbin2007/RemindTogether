import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { issueInviteForGroup } from "@/services/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const data = await issueInviteForGroup(principal, id, env.baseUrl);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
