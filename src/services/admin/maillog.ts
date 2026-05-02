import { Prisma, type MailCategory } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const listMailLogQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z
    .enum(["EMAIL_VERIFICATION", "PASSWORD_RESET", "GROUP_INVITE", "OTHER"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z
    .string()
    .datetime()
    .optional()
    .transform((s) => (s ? new Date(s) : undefined)),
});
export type ListMailLogQuery = z.infer<typeof listMailLogQuerySchema>;

export async function listMailLog(query: ListMailLogQuery) {
  const where: Prisma.MailLogWhereInput = {};
  if (query.category) where.category = query.category as MailCategory;
  if (query.q) where.toAddress = { contains: query.q, mode: "insensitive" };
  if (query.before) where.createdAt = { lt: query.before };
  return prisma.mailLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: query.limit,
  });
}
