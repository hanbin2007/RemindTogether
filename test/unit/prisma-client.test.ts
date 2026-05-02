import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";

describe("prisma client", () => {
  it("singleton is constructable and exposes models", () => {
    expect(prisma).toBeDefined();
    // A spot-check that the generated client knows about our domain models.
    // (This is enough to fail fast if the schema diverges from the client.)
    expect(typeof prisma.user.findFirst).toBe("function");
    expect(typeof prisma.group.findFirst).toBe("function");
    expect(typeof prisma.reminder.findFirst).toBe("function");
    expect(typeof prisma.poke.findFirst).toBe("function");
    expect(typeof prisma.streakDay.findFirst).toBe("function");
    expect(typeof prisma.shieldCard.findFirst).toBe("function");
  });
});
