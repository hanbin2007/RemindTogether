import { NextResponse, type NextRequest } from "next/server";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";
import { createAttachment } from "@/services/attachments";
import { BadRequestError } from "@/lib/api/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Multipart upload — single file. Form fields:
 *   - file: the binary
 *   - reminderId? / completionId?: target — exactly one required
 */
export async function POST(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new BadRequestError("no_file", "缺少 file 字段");
    }
    const reminderId = (form.get("reminderId") as string | null) ?? undefined;
    const completionId = (form.get("completionId") as string | null) ?? undefined;
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await createAttachment(principal, {
      buffer,
      mimeType: file.type,
      reminderId,
      completionId,
    });
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
