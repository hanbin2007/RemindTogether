import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { BadRequestError, ForbiddenError } from "@/lib/api/errors";
import { requirePrincipal } from "@/lib/auth/guards";
import { joinGroupByToken } from "@/services/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id } = await ctx.params;
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      throw new BadRequestError("missing_token", "缺少 token 参数");
    }
    const r = await joinGroupByToken(principal, token);
    if (!r.ok) {
      // Surface a friendlier error code; the service has already validated
      // the token-to-group mapping internally.
      throw new ForbiddenError(`invite_${r.reason}`);
    }
    if (r.groupId !== id) {
      // The token belongs to a different group than the URL claims.
      throw new ForbiddenError("invite_group_mismatch");
    }
    return NextResponse.json({
      data: { groupId: r.groupId, alreadyMember: r.alreadyMember },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
