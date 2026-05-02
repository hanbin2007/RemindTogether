import { describe, it, expect } from "vitest";
import { newToken } from "@/lib/random";

describe("newToken", () => {
  it("returns a base64url string of expected length", () => {
    const t = newToken();
    // 32 bytes → 43 chars (no padding) in base64url
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(t.length).toBeGreaterThanOrEqual(42);
    expect(t.length).toBeLessThanOrEqual(44);
  });

  it("supports custom byte lengths", () => {
    expect(newToken(16)).toHaveLength(22); // 16 bytes → 22 base64url chars (no padding)
    expect(newToken(24).length).toBeGreaterThanOrEqual(31);
  });

  it("produces unique tokens across many calls", () => {
    const set = new Set<string>();
    for (let i = 0; i < 256; i++) set.add(newToken());
    expect(set.size).toBe(256);
  });
});
