import Link from "next/link";
import { AuthShell } from "@/components/sketch/auth-shell";
import { SketchNotice } from "@/components/sketch/notice";
import { ResetForm } from "./reset-form";

export const dynamic = "force-dynamic";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthShell
      eyebrow="RESET"
      title="重设密码"
      subtitle="输入新密码就好啦。"
      testid="reset-card"
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
      {!token ? (
        <SketchNotice tone="error" testid="reset-no-token" animate>
          缺少 token，请确认你点的是邮件里的完整链接。
        </SketchNotice>
      ) : (
        <ResetForm token={token} />
      )}
    </AuthShell>
  );
}
