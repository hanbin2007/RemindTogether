import Link from "next/link";
import { AuthShell } from "@/components/sketch/auth-shell";
import { ForgotForm } from "./forgot-form";

export const dynamic = "force-dynamic";

export default function ForgotPage() {
  return (
    <AuthShell
      eyebrow="RECOVER"
      title="忘记密码"
      subtitle="填写注册邮箱，我们发一个重设链接给你。"
      testid="forgot-card"
      footer={
        <Link
          href="/auth/login"
          className="rt-squig font-[family-name:var(--font-caveat)] font-bold text-rt-ink"
          data-testid="link-login"
        >
          返回登录
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
