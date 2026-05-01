import { Prisma, type Report } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/principal";
import { AdminAction, recordAdminAction } from "./audit";

export const listReportsQuerySchema = z.object({
  status: z.enum(["PENDING", "RESOLVED", "DISMISSED"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z
    .string()
    .datetime()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined)),
});
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

export async function listReports(query: ListReportsQuery) {
  const where: Prisma.ReportWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.before) where.createdAt = { lt: query.before };
  return prisma.report.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: query.limit,
    include: {
      reporter: { select: { id: true, displayName: true, email: true } },
      resolver: { select: { id: true, displayName: true, email: true } },
    },
  });
}

export async function getReport(reportId: string): Promise<Report> {
  const r = await prisma.report.findUnique({ where: { id: reportId } });
  if (!r) throw new NotFoundError("report");
  return r;
}

const adminNoteSchema = z.string().trim().max(500).optional();

export async function resolveReport(
  admin: Principal,
  reportId: string,
  note?: string,
): Promise<Report> {
  const parsedNote = adminNoteSchema.parse(note);
  const r = await prisma.report.findUnique({ where: { id: reportId } });
  if (!r) throw new NotFoundError("report");
  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "RESOLVED",
      resolvedById: admin.id,
      resolvedAt: new Date(),
      adminNote: parsedNote ?? null,
    },
  });
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.ResolveReport,
    targetType: "report",
    targetId: reportId,
    payload: { note: parsedNote ?? null },
  });
  return updated;
}

export async function dismissReport(
  admin: Principal,
  reportId: string,
  note?: string,
): Promise<Report> {
  const parsedNote = adminNoteSchema.parse(note);
  const r = await prisma.report.findUnique({ where: { id: reportId } });
  if (!r) throw new NotFoundError("report");
  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "DISMISSED",
      resolvedById: admin.id,
      resolvedAt: new Date(),
      adminNote: parsedNote ?? null,
    },
  });
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.DismissReport,
    targetType: "report",
    targetId: reportId,
    payload: { note: parsedNote ?? null },
  });
  return updated;
}
