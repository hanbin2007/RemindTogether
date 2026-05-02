import { PrismaClient } from "@prisma/client";

let cached: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (cached) return cached;
  cached = new PrismaClient();
  return cached;
}

export async function findLatestMail(
  toAddress: string,
  category: string,
): Promise<{ id: string; body: string; subject: string } | null> {
  const row = await getPrisma().mailLog.findFirst({
    where: { toAddress, category: category as never },
    orderBy: { createdAt: "desc" },
  });
  return row;
}

export function extractTokenFromBody(body: string, path: string): string | null {
  const re = new RegExp(`${path.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\?token=([A-Za-z0-9_-]+)`);
  const m = body.match(re);
  return m ? m[1] : null;
}

export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}
