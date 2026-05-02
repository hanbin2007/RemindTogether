/**
 * Server-side data fetch + thin wrapper around `<HfCreate />` (the
 * design's HfCreate is a bottom sheet over a dimmed "今天" backdrop).
 * The sheet body is `<CreateReminderForm>`. Most in-app users now
 * reach this flow via the `<NewReminderTrigger>` popup — this route
 * stays in place for direct URL hits / deep-link share fallback.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { HfCreate } from "@/components/hf/screens/HfCreate";
import { CreateReminderForm } from "./create-form";

export const dynamic = "force-dynamic";

const WEEKDAY = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

function todayMeta(d: Date): string {
  return `${WEEKDAY[d.getDay()]} · ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

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
      isDisbanded: false,
      members: { some: { userId: principal.id, leftAt: null } },
    },
    select: { id: true, name: true, coverEmoji: true },
    orderBy: { createdAt: "asc" },
  });

  const initialMembers = groupId
    ? await prisma.groupMember
        .findMany({
          where: { groupId, leftAt: null },
          include: { user: { select: { id: true, displayName: true } } },
          take: 50,
        })
        .then((rows) =>
          rows
            .filter((m) => m.userId !== principal.id)
            .map((m) => ({
              userId: m.userId,
              displayName: m.user.displayName,
            })),
        )
    : [];

  // Pick a sensible peek context: when arriving from a group page, peek
  // that group; otherwise show today as the design does.
  const peekTitle =
    groupId && groups.find((g) => g.id === groupId)?.name
      ? `#${groups.find((g) => g.id === groupId)!.name}`
      : "今天";

  return (
    <HfCreate peekMeta={todayMeta(new Date())} peekTitle={peekTitle}>
      <div style={{ position: "relative" }}>
        <Link
          href={groupId ? `/app/groups/${groupId}` : "/app"}
          className="hf-btn ghost"
          style={{
            position: "absolute",
            left: 8,
            top: -34,
            padding: "4px 10px",
            fontSize: 14,
            background: "var(--paper)",
          }}
          aria-label="返回"
          data-testid="newreminder-back"
        >
          ‹ 返回
        </Link>
        <CreateReminderForm
          groups={groups}
          initialGroupId={groupId ?? null}
          initialMembers={initialMembers}
        />
      </div>
    </HfCreate>
  );
}
