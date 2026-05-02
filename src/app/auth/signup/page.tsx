import Link from "next/link";
import { previewInvite } from "@/services/auth/invites";
import { AuthShell } from "@/components/sketch/auth-shell";
import { SketchNotice } from "@/components/sketch/notice";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;

  let invitePreview: Awaited<ReturnType<typeof previewInvite>> | null = null;
  if (invite) {
    invitePreview = await previewInvite(invite);
  }

  return (
    <AuthShell
      eyebrow="JOIN"
      title="创建账号"
      subtitle="一起鼓励，慢慢来。"
      testid="signup-card"
      footer={
        <p className="text-rt-ink-soft">
          已经有账号了？
          <Link
            href="/auth/login"
            className="ml-2 rt-squig font-[family-name:var(--font-caveat)] font-bold text-rt-ink"
            data-testid="link-login"
          >
            去登录
          </Link>
        </p>
      }
    >
      {invitePreview?.status === "valid" && (
        <div className="mb-5">
          <SketchNotice tone="success" testid="invite-banner" animate>
            <strong className="font-[family-name:var(--font-caveat)] text-base">
              {invitePreview.inviterDisplayName}
            </strong>{" "}
            邀请你加入「
            <strong className="font-[family-name:var(--font-caveat)] text-base">
              {invitePreview.groupName}
            </strong>
            」。注册后会自动入群。
          </SketchNotice>
        </div>
      )}
      {invitePreview && invitePreview.status !== "valid" && (
        <div className="mb-5">
          <SketchNotice tone="warn" testid="invite-banner-invalid">
            邀请链接已失效。你可以照常注册，加入群可以稍后让群主重发链接。
          </SketchNotice>
        </div>
      )}
      <SignupForm inviteToken={invite ?? null} />
    </AuthShell>
  );
}
