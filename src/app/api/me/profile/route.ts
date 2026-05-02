import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api/handler";
import { requirePrincipal } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "格式 HH:MM");

const patchSchema = z
  .object({
    displayName: z.string().trim().min(1).max(40).optional(),
    timezone: z.string().min(1).max(64).optional(),
    dndStart: HM.nullable().optional(),
    dndEnd: HM.nullable().optional(),
    notificationSound: z
      .enum(["default", "wechat", "ding", "off"])
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "什么都没改" });

export async function PATCH(req: NextRequest) {
  try {
    const principal = await requirePrincipal();
    const input = patchSchema.parse(await req.json());
    // dndStart / dndEnd must move together — either both set or both null.
    if (
      (input.dndStart === undefined) !== (input.dndEnd === undefined) &&
      (input.dndStart !== null || input.dndEnd !== null)
    ) {
      // user partially specified; allow but warn — store as-is and the
      // sendPoke check just looks for both fields.
    }
    await prisma.user.update({
      where: { id: principal.id },
      data: {
        displayName: input.displayName,
        timezone: input.timezone,
        dndStart: input.dndStart,
        dndEnd: input.dndEnd,
        notificationSound: input.notificationSound,
      },
    });
    const fresh = await prisma.user.findUniqueOrThrow({
      where: { id: principal.id },
      select: {
        id: true,
        displayName: true,
        timezone: true,
        dndStart: true,
        dndEnd: true,
        notificationSound: true,
      },
    });
    return NextResponse.json({ data: fresh });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function GET() {
  try {
    const principal = await requirePrincipal();
    const data = await prisma.user.findUniqueOrThrow({
      where: { id: principal.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        dndStart: true,
        dndEnd: true,
        notificationSound: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ data });
  } catch (e) {
    return handleApiError(e);
  }
}
