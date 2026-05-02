import { describe, it, expect } from "vitest";
import {
  hashPassword,
  passwordSchema,
  verifyPassword,
} from "@/lib/password";

describe("password lib", () => {
  describe("passwordSchema", () => {
    it.each([
      ["short1a", "密码至少 8 位"],
      ["1234567890", "密码必须包含至少一个字母"],
      ["abcdefghij", "密码必须包含至少一个数字"],
    ])("rejects %s", (input, expected) => {
      const r = passwordSchema.safeParse(input);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.message === expected)).toBe(true);
      }
    });

    it.each(["password1", "Tr0ub4dor", "AaaBbb22", "a1bbbbbb"])(
      "accepts %s",
      (input) => {
        expect(passwordSchema.safeParse(input).success).toBe(true);
      },
    );
  });

  describe("hashPassword / verifyPassword", () => {
    it("hashes deterministically per call (different salts) but verifies", async () => {
      const pw = "AaBbCc11";
      const a = await hashPassword(pw);
      const b = await hashPassword(pw);
      expect(a).not.toBe(b);
      expect(a.startsWith("$2")).toBe(true);
      expect(await verifyPassword(pw, a)).toBe(true);
      expect(await verifyPassword(pw, b)).toBe(true);
    });

    it("rejects wrong password", async () => {
      const h = await hashPassword("AaBbCc11");
      expect(await verifyPassword("wrong-AaBbCc11", h)).toBe(false);
    });

    it("returns false on empty hash", async () => {
      expect(await verifyPassword("anything", "")).toBe(false);
    });

    it("handles inputs over 72 bytes (bcrypt limit) without crashing", async () => {
      const big = "a".repeat(50) + "1".repeat(50); // 100 chars > 72 bytes
      const h = await hashPassword(big);
      expect(await verifyPassword(big, h)).toBe(true);
      // The clamp means a different prefix > 72 bytes still verifies if the
      // first 72 bytes match — that's an inherent bcrypt property and we
      // accept it.
    });
  });
});
