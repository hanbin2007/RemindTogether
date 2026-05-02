import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { moveReminderToGroup } from "@/services/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ groupId: z.string().uuid() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const principal = await requirePrincipal();
    const { id } = await params;
    const { groupId } = bodySchema.parse(await req.json());
    const data = await moveReminderToGroup(principal, id, groupId);
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
