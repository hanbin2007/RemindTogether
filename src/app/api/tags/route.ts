import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import {
  createTag,
  createTagInputSchema,
  listTags,
} from "@/services/tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const principal = await requirePrincipal();
    const tags = await listTags(principal);
    return NextResponse.json({ data: tags });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const body = createTagInputSchema.parse(await req.json());
    const tag = await createTag(principal, body);
    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
