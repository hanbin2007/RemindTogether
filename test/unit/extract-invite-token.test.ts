import { describe, it, expect } from "vitest";
import { extractInviteToken } from "@/app/auth/login/invite-code-form";

describe("extractInviteToken", () => {
  it("returns token from a bare URL-safe base64 string", () => {
    const t = "abc123_xyz-DEF45678";
    expect(extractInviteToken(t)).toBe(t);
  });

  it("extracts token from /invite/<token> path", () => {
    expect(extractInviteToken("/invite/abc12345_def-X")).toBe(
      "abc12345_def-X",
    );
  });

  it("extracts token from full HTTPS invite URL", () => {
    expect(
      extractInviteToken("https://rt.origenclub.cn/invite/Tk1234567890"),
    ).toBe("Tk1234567890");
  });

  it("extracts token from URL with query string", () => {
    expect(
      extractInviteToken(
        "https://rt.origenclub.cn/invite/Tok_-12345678?utm=foo",
      ),
    ).toBe("Tok_-12345678");
  });

  it("trims surrounding whitespace", () => {
    expect(extractInviteToken("   abcd1234efgh   ")).toBe("abcd1234efgh");
  });

  it("returns null for empty input", () => {
    expect(extractInviteToken("")).toBeNull();
    expect(extractInviteToken("    ")).toBeNull();
  });

  it("returns null for too-short tokens (< 8 chars)", () => {
    expect(extractInviteToken("abc12")).toBeNull();
  });

  it("returns null for tokens with invalid characters", () => {
    expect(extractInviteToken("not a token!! @@@")).toBeNull();
  });

  it("does not pick up trailing slashes", () => {
    expect(extractInviteToken("/invite/AbC123def/")).toBe("AbC123def");
  });
});
