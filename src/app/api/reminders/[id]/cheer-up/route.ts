import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { cheerUp } from "@/services/cheers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  toUserId: z.string().uuid(),
  groupId: z.string().uuid(),
  message: z.string().max(140).optional(),
});

// id param is the reminder context for telemetry, but the body carries
// the actual target (toUserId/groupId). We accept the param for symmetry
// with the URL the UI builds even though we don't read it server-side.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    await params; // touch to satisfy Next.js
    const raw = (await req.json()) as unknown;
    const input = bodySchema.parse(raw);
    const data = await cheerUp(principal, input);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
