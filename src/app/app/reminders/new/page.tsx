/**
 * Page wrapper for the create-reminder flow. Literal port of HfCreate
 * (design/project/hf-screens-B.jsx lines 7-77) — includes the dimmed
 * faux-today background + dim overlay + bottom sheet.
 *
 * The sheet itself is `<CreateReminderForm>`; this file just paints
 * the design's outer chrome.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { Phone } from "@/components/hf";
import { CreateReminderForm } from "./create-form";

export const dynamic = "force-dynamic";

const WEEKDAY = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

function formatDateMeta(d: Date): string {
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

  const meta = formatDateMeta(new Date());

  return (
    <Phone>
      <div
        style={{
          minHeight: "100dvh",
          position: "relative",
          background: "var(--paper)",
        }}
      >
        {/* dimmed today behind — design lines 11-17 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "16px 18px",
            opacity: 0.45,
            pointerEvents: "none",
          }}
        >
          <div className="h-meta">{meta}</div>
          <div className="h-display">今天</div>
          <div className="hf-box" style={{ marginTop: 14, height: 76 }} />
          <div className="hf-box" style={{ marginTop: 10, height: 140 }} />
          <div className="hf-box" style={{ marginTop: 10, height: 140 }} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(26,26,26,0.18)",
            pointerEvents: "none",
          }}
        />

        {/* back chevron — top-left, above dim */}
        <Link
          href={groupId ? `/app/groups/${groupId}` : "/app"}
          aria-label="返回"
          data-testid="newreminder-back"
          className="hf-btn ghost"
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            padding: "4px 8px",
            fontSize: 14,
            zIndex: 5,
          }}
        >
          ‹
        </Link>

        {/* sheet — design lines 21-73; absolute pinned to bottom */}
        <div
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            bottom: 6,
            zIndex: 5,
          }}
        >
          <CreateReminderForm
            groups={groups}
            initialGroupId={groupId ?? null}
            initialMembers={initialMembers}
          />
        </div>
      </div>
    </Phone>
  );
}
