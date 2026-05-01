import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __remindtogether_prisma__: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__remindtogether_prisma__ ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error", "warn"]
        : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__remindtogether_prisma__ = prisma;
}
