/**
 * Direct port of HfL2GroupSettings (design/project/hf-screens-L2.jsx
 * lines 484-578). The JSX below is a copy of that file with three
 * mechanical replacements:
 *
 *   - <Phone> wrapper            removed (we don't render bezels)
 *   - <window.HF.Icon ...>       → <HF.Icon ... />
 *   - <window.HF.Av ...>         → <HF.Av ... />
 *
 * Hardcoded sample data is replaced with real data fetched server-side.
 * Class names + inline styles + structure are otherwise unchanged so the
 * pixel-level fidelity matches the artboard.
 */
import "@/app/hifi-sketch.css";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getGroup } from "@/services/groups";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { HF } from "@/components/sketch/hf";
import { avatarSlot } from "@/components/sketch/avatar";
import { GroupRulesToggles } from "./rules-toggles";
import { RenameButton } from "./rename-button";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "群主",
  MEMBER: "成员",
};

export default async function GroupSettingsPage({
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
  let detail;
  try {
    detail = await getGroup(principal, id);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    throw e;
  }
  const isOwner = detail.ownerId === session.user.id;

  const members = await prisma.groupMember.findMany({
    where: { groupId: id, leftAt: null },
    include: { user: { select: { id: true, displayName: true } } },
    orderBy: { joinedAt: "asc" },
    take: 50,
  });

  const daysSinceCreated = Math.max(
    1,
    Math.floor((Date.now() - detail.createdAt.getTime()) / 86_400_000),
  );

  return (
    // Outer container — replaces the design's <Phone> bezels with a
    // simple max-width column so the inner JSX renders identically on
    // mobile and desktop.
    <div
      className="hf min-h-screen"
      style={{
        background: "var(--paper)",
        maxWidth: "36rem",
        margin: "0 auto",
      }}
    >
      <div style={{ height: "100%", overflow: "hidden", background: "var(--paper)" }}>
        {/* nav bar */}
        <div
          style={{
            padding: "12px 14px 8px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderBottom: "1.5px solid var(--line)",
          }}
        >
          <Link
            href={`/app/groups/${id}`}
            style={{ fontFamily: "var(--hand-2)", fontSize: 18 }}
            data-testid="settings-back"
          >
            ‹
          </Link>
          <div style={{ flex: 1 }}>
            <div className="h-meta">小群</div>
            <div className="h-row" style={{ fontSize: 16 }}>
              {detail.name}
            </div>
          </div>
          <HF.Icon name="dots" size={18} />
        </div>

        <div style={{ padding: "12px 14px", overflow: "hidden" }}>
          {/* cover */}
          <div
            className="hf-box thick"
            style={{
              padding: "14px 12px",
              background: "var(--ok-soft)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transform: "rotate(-0.5deg)",
            }}
            data-testid="settings-cover"
          >
            <div style={{ fontSize: 32, transform: "rotate(-6deg)" }}>
              {detail.coverEmoji ?? "📌"}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h-row" style={{ fontSize: 15 }}>
                {detail.name}
              </div>
              <div className="h-meta">
                {detail.memberCount} 人 · 共建 {daysSinceCreated} 天
              </div>
            </div>
            {isOwner && (
              <RenameButton groupId={detail.id} currentName={detail.name} />
            )}
          </div>

          {/* members */}
          <div
            className="h-meta"
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>成员 · {members.length}</span>
            <Link
              href={`/app/groups/${detail.id}/invite`}
              style={{ color: "var(--claim)" }}
              data-testid="settings-invite-link"
            >
              + 邀请
            </Link>
          </div>
          <div
            className="hf-box"
            style={{ marginTop: 4, padding: "4px 10px" }}
            data-testid="settings-members"
          >
            {members.map((m, i, a) => (
              <div
                key={m.userId}
                className="hf-row"
                style={{
                  padding: "6px 0",
                  borderBottom:
                    i === a.length - 1
                      ? "none"
                      : "1.3px dashed var(--ink-faint)",
                }}
                data-testid={`settings-member-${m.userId}`}
              >
                <HF.Av
                  name={m.user.displayName}
                  size={28}
                  i={avatarSlot(m.userId)}
                />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 14 }}>
                    {m.user.displayName}
                  </div>
                </div>
                <span className="hf-chip dim" style={{ fontSize: 11 }}>
                  {ROLE_LABEL[m.role] ?? "成员"}
                </span>
              </div>
            ))}
          </div>

          {/* rules */}
          <div className="h-meta" style={{ marginTop: 12 }}>
            群规则
          </div>
          <GroupRulesToggles groupId={detail.id} canEdit={isOwner} />

          {/* danger */}
          {isOwner ? (
            <form
              action={`/app/groups/${detail.id}/disband`}
              method="get"
              className="hf-box dashed"
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderColor: "var(--poke)",
              }}
            >
              <button
                type="submit"
                data-testid="settings-disband"
                className="block w-full text-left"
              >
                <div
                  className="h-row"
                  style={{ fontSize: 14, color: "var(--poke)" }}
                >
                  解散小群
                </div>
                <div className="h-meta">所有数据会保留作回顾</div>
              </button>
            </form>
          ) : (
            <form
              action={`/api/groups/${detail.id}/leave`}
              method="post"
              className="hf-box dashed"
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderColor: "var(--poke)",
              }}
            >
              <button
                type="submit"
                data-testid="settings-leave"
                className="block w-full text-left"
              >
                <div
                  className="h-row"
                  style={{ fontSize: 14, color: "var(--poke)" }}
                >
                  退出小群
                </div>
                <div className="h-meta">你的打卡记录会保留</div>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
