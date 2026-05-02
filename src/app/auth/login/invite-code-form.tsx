"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Extracts the invite token from any of these inputs:
 *   - bare token (URL-safe base64)
 *   - "/invite/<token>"
 *   - "https://example.com/invite/<token>"
 *   - "https://example.com/invite/<token>?foo=bar"
 *
 * Returns null when nothing usable is found. Tokens are URL-safe base64
 * so they are 1-128 chars of [A-Za-z0-9_-]; we use that as the validation
 * pattern without needing the full server-side decoder.
 */
export function extractInviteToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/(?:\/invite\/)?([A-Za-z0-9_-]{8,128})(?:[/?#]|$)/);
  return m ? m[1] : null;
}

export function InviteCodeForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = extractInviteToken(value);
    if (!token) {
      setError("看起来不像邀请码或邀请链接");
      return;
    }
    setError(null);
    router.push(`/invite/${token}`);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="invite-code-toggle"
        className="text-rt-ink-soft hover:text-rt-ink underline-offset-4 hover:underline transition-colors"
      >
        有邀请码？
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      data-testid="invite-code-form"
      className="space-y-2"
    >
      <label
        htmlFor="invite-code"
        className="font-[family-name:var(--font-caveat)] text-sm text-rt-ink-soft"
      >
        粘贴邀请链接 / 邀请码
      </label>
      <div className="flex gap-2">
        <input
          id="invite-code"
          name="inviteCode"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://… 或一串邀请码"
          autoComplete="off"
          data-testid="invite-code-input"
          className="rt-input flex-1 text-sm"
        />
        <button
          type="submit"
          data-testid="invite-code-submit"
          className="rt-btn"
        >
          去
        </button>
      </div>
      {error && (
        <div
          data-testid="invite-code-error"
          className="text-rt-poke text-sm font-[family-name:var(--font-kalam)]"
        >
          {error}
        </div>
      )}
    </form>
  );
}
