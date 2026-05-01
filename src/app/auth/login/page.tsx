import Link from "next/link";
import { AuthShell } from "@/components/sketch/auth-shell";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="欢迎回来"
      subtitle="登录后继续打卡。"
      testid="login-card"
      footer={
        <div className="flex items-center justify-between">
          <Link
            href="/auth/forgot"
            className="text-rt-ink-soft hover:text-rt-ink transition-colors"
            data-testid="link-forgot"
          >
            忘记密码？
          </Link>
          <Link
            href="/auth/signup"
            className="rt-squig font-[family-name:var(--font-caveat)] font-bold text-rt-ink"
            data-testid="link-signup"
          >
            注册新账号
          </Link>
        </div>
      }
    >
      <LoginForm redirectTo={redirectTo ?? null} />
    </AuthShell>
  );
}
