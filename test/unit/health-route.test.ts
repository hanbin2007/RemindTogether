import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns ok status with service name and ISO timestamp", async () => {
    const res = GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("remindtogether");
    expect(typeof body.time).toBe("string");
    // time must be valid ISO string
    expect(() => new Date(body.time).toISOString()).not.toThrow();
    expect(new Date(body.time).toISOString()).toBe(body.time);
  });

  it("uses no-cache by being marked dynamic", async () => {
    const mod = await import("@/app/api/health/route");
    expect(mod.dynamic).toBe("force-dynamic");
    expect(mod.runtime).toBe("nodejs");
  });
});
