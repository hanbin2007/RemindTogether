import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { previewInvite } from "@/services/auth/invites";
import { AuthShell } from "@/components/sketch/auth-shell";
import { SketchNotice } from "@/components/sketch/notice";
import { JoinForm } from "./join-form";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await previewInvite(token);

  if (!preview) {
    return (
      <AuthShell eyebrow="LINK GONE" title="这个邀请不存在">
        <SketchNotice tone="warn" testid="invite-invalid">
          可能链接打错了，或者群已经解散。
        </SketchNotice>
      </AuthShell>
    );
  }

  if (preview.status !== "valid") {
    const title = preview.status === "expired" ? "邀请已过期" : "邀请已使用";
    return (
      <AuthShell eyebrow="LINK STALE" title={title}>
        <SketchNotice tone="warn" testid="invite-stale" animate>
          请让 <strong className="font-[family-name:var(--font-caveat)] text-base">
            {preview.inviterDisplayName}
          </strong>{" "}
          重发一份邀请。
        </SketchNotice>
      </AuthShell>
    );
  }

  const session = await auth();
  if (!session?.user) {
    return (
      <AuthShell
        eyebrow="INVITE"
        title={`「${preview.groupName}」`}
        subtitle={
          <>
            <strong className="font-[family-name:var(--font-caveat)] text-base">
              {preview.inviterDisplayName}
            </strong>{" "}
            邀请你加入。注册或登录后会自动入群。
          </>
        }
      >
        <p
          data-testid="invite-anon-title"
          className="hidden"
          aria-hidden="true"
        >
          {preview.groupName}
        </p>
        <div className="space-y-3">
          <Link
            href={`/auth/signup?invite=${encodeURIComponent(token)}`}
            className="rt-btn rt-btn-primary w-full"
            data-testid="invite-signup-link"
          >
            注册新账号
          </Link>
          <Link
            href={`/auth/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`}
            className="rt-btn w-full"
            data-testid="invite-login-link"
          >
            已经有账号了，去登录
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="INVITE"
      title={`加入「${preview.groupName}」`}
      subtitle={
        <>
          来自{" "}
          <strong className="font-[family-name:var(--font-caveat)] text-base">
            {preview.inviterDisplayName}
          </strong>{" "}
          的邀请。
        </>
      }
    >
      <p
        data-testid="invite-loggedin-title"
        className="hidden"
        aria-hidden="true"
      >
        {preview.groupName}
      </p>
      <JoinForm token={token} />
    </AuthShell>
  );
}
