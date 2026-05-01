import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { Avatar, avatarSlot } from "@/components/sketch/avatar";
import { Icon } from "@/components/sketch/icon";

export const dynamic = "force-dynamic";

const TONE_HINT: Record<string, string> = {
  ALMOST: "差一点点",
  THINKING: "想到你了",
  NO_RUSH: "不急慢慢来",
};

/**
 * Full-screen "you got poked" view — mirrors HfL2Poked. Reached from
 * push notification or /app/me/notifications.
 */
export default async function PokedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const { id } = await params;

  const poke = await prisma.poke.findUnique({
    where: { id },
    include: {
      from: { select: { id: true, displayName: true } },
      reminder: {
        select: {
          id: true,
          title: true,
          status: true,
          dueAt: true,
          group: { select: { name: true } },
        },
      },
    },
  });
  if (!poke || poke.toId !== session.user.id) notFound();

  const tone = TONE_HINT[poke.tone] ?? "想到你了";
  const sentTime = poke.sentAt;
  const sentLabel = `${String(sentTime.getHours()).padStart(2, "0")}:${String(sentTime.getMinutes()).padStart(2, "0")}`;

  return (
    <div
      data-testid="poked-page"
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--rt-poke-soft)" }}
    >
      <div className="px-5 pt-7 max-w-md mx-auto relative">
        <Link
          href="/app/me/notifications"
          data-testid="poked-back"
          className="rt-h-meta inline-flex items-center gap-1 absolute top-5 left-5"
        >
          ‹
        </Link>

        <p className="rt-h-meta text-center mt-1">
          {sentLabel} · {poke.reminder?.group?.name ? `来自 ${poke.reminder.group.name}` : "私人"}
        </p>
        <div className="text-center mt-1.5">
          <span
            className="rt-chip rt-chip-poke"
            style={{ fontSize: 12 }}
          >
            <Icon name="wave" size={11} /> 朋友拍了拍你
          </span>
        </div>

        <div className="px-1 mt-3.5">
          <div
            className="rt-box rt-box-thick rt-tilt-r p-4"
            style={{ background: "var(--rt-paper)" }}
          >
            <div className="flex items-center gap-2.5">
              <Avatar
                name={poke.from.displayName}
                i={avatarSlot(poke.from.id)}
                size={42}
              />
              <div className="flex-1 min-w-0">
                <p className="rt-h-row" style={{ fontSize: 16 }}>
                  {poke.from.displayName} 拍了拍你
                </p>
                <p className="rt-h-meta">
                  {poke.reminder?.title
                    ? `「${poke.reminder.title}」 ${tone}`
                    : tone}
                </p>
              </div>
            </div>

            {poke.message && (
              <div
                className="rt-box mt-3 p-3"
                style={{
                  background: "var(--rt-paper-2)",
                  transform: "rotate(-1deg)",
                  fontFamily: "var(--font-kalam), Kalam, sans-serif",
                  fontSize: 17,
                  lineHeight: 1.5,
                }}
                data-testid="poked-message"
              >
                "{poke.message}"
              </div>
            )}

            {poke.reminder && (
              <div
                className="rt-box rt-box-dashed mt-3 px-3 py-2.5"
                style={{
                  background: "var(--rt-paper)",
                  borderColor: "var(--rt-ink-faint)",
                }}
              >
                <p className="rt-h-meta">是这件 ↓</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rt-check flex-shrink-0" />
                  <div className="flex-1">
                    <p className="rt-h-row" style={{ fontSize: 15 }}>
                      {poke.reminder.title}
                    </p>
                    {poke.reminder.dueAt && (
                      <p className="rt-h-meta">
                        原定 {String(new Date(poke.reminder.dueAt).getHours()).padStart(2, "0")}:
                        {String(new Date(poke.reminder.dueAt).getMinutes()).padStart(2, "0")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <p
            className="rt-h-meta text-center mt-4"
            style={{
              fontFamily: "var(--font-kalam), Kalam, sans-serif",
              fontSize: 14,
            }}
          >
            没压力 — 选一个就好
          </p>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {poke.reminder ? (
              <Link
                href={`/app/reminders/${poke.reminder.id}`}
                data-testid="poked-go"
                className="rt-btn rt-btn-primary"
                style={{ padding: "12px 0", fontSize: 14 }}
              >
                <Icon name="check" size={14} /> 我马上去
              </Link>
            ) : (
              <Link
                href="/app"
                data-testid="poked-ack"
                className="rt-btn rt-btn-primary"
                style={{ padding: "12px 0", fontSize: 14 }}
              >
                <Icon name="check" size={14} /> 收下
              </Link>
            )}
            {poke.reminder && (
              <Link
                href={`/app/reminders/${poke.reminder.id}`}
                data-testid="poked-reschedule"
                className="rt-btn"
                style={{ padding: "12px 0", fontSize: 14 }}
              >
                <Icon name="clock" size={14} /> 改约时间
              </Link>
            )}
            <Link
              href={`/app/reminders/${poke.reminder?.id ?? ""}`}
              data-testid="poked-poke-back"
              className="rt-btn rt-btn-ghost"
              style={{ padding: "10px 0", fontSize: 13 }}
            >
              <Icon name="wave" size={13} /> 拍回去 一起做
            </Link>
            <Link
              href="/app"
              data-testid="poked-skip"
              className="rt-btn rt-btn-ghost"
              style={{ padding: "10px 0", fontSize: 13 }}
            >
              <Icon name="shield" size={13} /> 今天先跳
            </Link>
          </div>

          <p
            className="rt-h-meta text-center mt-3.5 italic"
            style={{ fontStyle: "italic" }}
          >
            ← 滑掉就当没看见
          </p>
        </div>
      </div>
    </div>
  );
}
