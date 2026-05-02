import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { getPokeQuota } from "@/services/pokes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  to_user_id: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const { to_user_id } = querySchema.parse({
      to_user_id: req.nextUrl.searchParams.get("to_user_id"),
    });
    const data = await getPokeQuota(principal, to_user_id);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
