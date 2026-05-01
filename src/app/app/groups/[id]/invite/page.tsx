import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getGroup } from "@/services/groups";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { AppShell } from "@/components/sketch/app-shell";
import { Icon } from "@/components/sketch/icon";
import { InviteIssue } from "./invite-issue";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
  const { id } = await params;
  let group;
  try {
    group = await getGroup(principal, id);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    throw e;
  }

  return (
    <AppShell
      meta={`${group.coverEmoji ?? "📌"} ${group.name} · ${group.memberCount} 人`}
      greeting="叫上他们"
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="groups"
    >
      <div className="flex items-center mb-2">
        <Link
          href={`/app/groups/${id}`}
          className="rt-btn rt-btn-ghost"
          style={{ padding: "4px 8px", fontSize: 14 }}
        >
          ‹
        </Link>
      </div>

      <p className="rt-h-body mb-3">加进来，今天起的提醒他们都看得见</p>

      <InviteIssue groupId={id} groupName={group.name} />

      {/* via apps */}
      <div className="flex gap-2.5 mt-4 justify-between">
        {[
          { l: "微信", ic: "chat" as const },
          { l: "通讯录", ic: "phone" as const },
          { l: "AirDrop", ic: "wifi" as const },
          { l: "邮件", ic: "mail" as const },
        ].map((a, i) => (
          <div key={a.l} className="text-center flex-1">
            <div
              className="rt-box mx-auto flex items-center justify-center"
              style={{
                width: 50,
                height: 50,
                transform: i % 2 === 0 ? "rotate(2deg)" : "rotate(-2deg)",
              }}
            >
              <Icon name={a.ic} size={22} />
            </div>
            <p className="rt-h-meta mt-1">{a.l}</p>
          </div>
        ))}
      </div>

      {/* nearby */}
      <div className="rt-box rt-box-dashed p-3 mt-4 flex gap-2.5 items-center">
        <span className="inline-flex flex-shrink-0">
          <Icon name="wifi" size={22} />
        </span>
        <div className="flex-1">
          <p className="rt-h-row">附近的人</p>
          <p className="rt-h-meta">把手机靠近朋友自动加入</p>
        </div>
        <span className="rt-chip rt-chip-done">在找</span>
      </div>
    </AppShell>
  );
}
