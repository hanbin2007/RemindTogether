import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/sketch/app-shell";
import { Icon } from "@/components/sketch/icon";
import { CreateReminderForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function NewReminderPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
  const sp = await searchParams;
  const groupId = sp.groupId;

  const groups = await prisma.group.findMany({
    where: {
      members: { some: { userId: principal.id, leftAt: null } },
    },
    select: { id: true, name: true, coverEmoji: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <AppShell
      meta={null}
      greeting={undefined}
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="other"
    >
      <div className="flex items-center mb-2">
        <Link
          href={groupId ? `/app/groups/${groupId}` : "/app"}
          className="rt-btn rt-btn-ghost"
          style={{ padding: "4px 8px", fontSize: 14 }}
          aria-label="返回"
        >
          ‹
        </Link>
        <h1 className="rt-h-h2 ml-2">新提醒</h1>
      </div>

      <p className="rt-h-meta mt-1 mb-3">
        试试一句话：
        <span style={{ color: "var(--rt-claim)" }}>
          {" "}明天 8 点 提醒 @朋友 在 #群名
        </span>
      </p>

      <CreateReminderForm groups={groups} initialGroupId={groupId ?? null} />

      <p className="rt-h-meta mt-3 text-center" style={{ fontStyle: "italic" }}>
        @ 选人 · # 选群 · / 时间 · ! 高优先
      </p>

      <div className="mt-3">
        <p className="rt-h-meta mb-1.5">提醒小贴士</p>
        <div className="rt-box rt-box-dashed rt-box-dim p-3 flex gap-2 items-start">
          <span className="inline-flex flex-shrink-0">
            <Icon name="signpost" size={18} />
          </span>
          <p className="rt-h-body" style={{ fontSize: 14 }}>
            私人提醒只有你能看见；分享到群组后大家都能帮你记。
          </p>
        </div>
      </div>
    </AppShell>
  );
}
