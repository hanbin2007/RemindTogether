import Link from "next/link";
import { AuthShell } from "@/components/sketch/auth-shell";
import { SketchNotice } from "@/components/sketch/notice";
import { consumeEmailVerification } from "@/services/auth/email-verification";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let outcome:
    | { kind: "ok" }
    | { kind: "error"; reason: "missing" | "not_found" | "expired" | "used" };

  if (!token) {
    outcome = { kind: "error", reason: "missing" };
  } else {
    const r = await consumeEmailVerification(token);
    outcome = r.ok ? { kind: "ok" } : { kind: "error", reason: r.reason };
  }

  if (outcome.kind === "ok") {
    return (
      <AuthShell eyebrow="EMAIL OK" title="邮箱已验证" testid="verify-card">
        <div className="flex items-center justify-center py-2">
          <svg
            data-testid="verify-success"
            viewBox="0 0 64 64"
            className="h-16 w-16"
            aria-hidden="true"
          >
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="var(--rt-done)"
              strokeWidth="2.4"
            />
            <path
              className="rt-check-path"
              d="M18 33 L28 43 L46 23"
              fill="none"
              stroke="var(--rt-done)"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="mt-4 text-center font-[family-name:var(--font-kalam)] text-rt-ink-soft">
          欢迎正式加入 RemindTogether，慢慢来。
        </p>
        <Link
          href="/app"
          data-testid="go-app"
          className="rt-btn rt-btn-primary w-full mt-6"
        >
          进入主页
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="LINK ISSUE"
      title="链接无效"
      testid="verify-card"
      footer={
        <Link
          href="/auth/login"
          className="rt-squig font-[family-name:var(--font-caveat)] font-bold text-rt-ink"
        >
          去登录
        </Link>
      }
    >
      <SketchNotice tone="error" testid="verify-failure" animate>
        {reasonText(outcome.reason)}
      </SketchNotice>
    </AuthShell>
  );
}

function reasonText(reason: "missing" | "not_found" | "expired" | "used") {
  switch (reason) {
    case "missing":
      return "缺少 token 参数。";
    case "not_found":
      return "我们没找到这个验证链接。";
    case "expired":
      return "链接已过期，请重新发送验证邮件。";
    case "used":
      return "这个链接已经用过了。";
  }
}
