import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { createReport, createReportInputSchema } from "@/services/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const body = createReportInputSchema.parse(await req.json());
    const data = await createReport(principal, body);
    return NextResponse.json(
      { data: { id: data.id, status: data.status } },
      { status: 201 },
    );
  } catch (e) {
    return handleApiError(e);
  }
}
