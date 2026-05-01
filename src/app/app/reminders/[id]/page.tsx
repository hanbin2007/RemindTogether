import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getReminder } from "@/services/reminders";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { AppShell } from "@/components/sketch/app-shell";
import { CommentForm } from "./comment-form";
import { ReactionBar } from "./reaction-bar";
import { PokeComposer } from "./poke-composer";
import {
  completeFromDetailAction,
  toggleClaimAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ReminderDetailPage({
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
  let reminder;
  try {
    reminder = await getReminder(principal, id);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    throw e;
  }

  // For group reminders we also need the comment list and the list of
  // group members other than the principal so the poke composer can
  // target someone.
  const [comments, reactions, groupMembers] = await Promise.all([
    prisma.comment.findMany({
      where: { reminderId: id, isDeleted: false },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, displayName: true } } },
      take: 100,
    }),
    prisma.reaction.findMany({
      where: { reminderId: id },
      select: { emoji: true, userId: true },
    }),
    reminder.groupId
      ? prisma.groupMember.findMany({
          where: { groupId: reminder.groupId, leftAt: null },
          include: {
            user: { select: { id: true, displayName: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const reactionCounts: Record<string, number> = {};
  for (const r of reactions) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
  }

  const myClaim = reminder.claims.find(
    (c) => c.userId === session.user!.id,
  );

  const pokeCandidates =
    reminder.visibility === "GROUP"
      ? groupMembers
          .filter((m) => m.userId !== session.user!.id)
          .map((m) => ({ id: m.userId, displayName: m.user.displayName }))
      : reminder.creatorId !== session.user.id
        ? [
            {
              id: reminder.creatorId,
              displayName: reminder.creator.displayName,
            },
          ]
        : [];

  const isCreator = reminder.creatorId === session.user.id;
  const backHref =
    reminder.groupId ? `/app/groups/${reminder.groupId}` : "/app/private";

  return (
    <AppShell
      greeting={reminder.title}
      email={session.user.email ?? ""}
      isAdmin={session.user.isAdmin}
      current="other"
    >
      <Link
        href={backHref}
        className="rt-squig text-rt-ink-soft text-sm mb-4 inline-block"
        data-testid="reminder-back"
      >
        ← 返回
      </Link>

      <div
        className="rt-fade-up rt-box p-5 mb-5"
        style={{ borderRadius: "14px 8px 12px 6px / 6px 12px 8px 14px" }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute">
          {reminder.visibility === "GROUP"
            ? `群 · ${reminder.group?.name ?? ""}`
            : "私人提醒"}
          {" · "}
          {reminder.status}
        </p>
        {reminder.description && (
          <p
            className="mt-3 font-[family-name:var(--font-kalam)] text-rt-ink-soft text-[15px] leading-relaxed whitespace-pre-wrap"
            data-testid="reminder-description"
          >
            {reminder.description}
          </p>
        )}
        <p className="mt-3 font-[family-name:var(--font-kalam)] text-rt-ink-mute text-sm">
          创建：{reminder.creator.displayName}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {reminder.status !== "DONE" && (
            <form action={completeFromDetailAction}>
              <input type="hidden" name="id" value={reminder.id} />
              <button
                type="submit"
                data-testid="reminder-complete"
                className="rt-btn rt-btn-primary"
              >
                ✓ 完成
              </button>
            </form>
          )}
          {reminder.visibility === "GROUP" && !isCreator && (
            <form action={toggleClaimAction}>
              <input type="hidden" name="id" value={reminder.id} />
              <input
                type="hidden"
                name="action"
                value={myClaim ? "unclaim" : "claim"}
              />
              <button
                type="submit"
                data-testid="reminder-claim"
                className="rt-btn"
              >
                {myClaim ? "取消认领" : "我帮 ta 做"}
              </button>
            </form>
          )}
        </div>
      </div>

      {reminder.claims.length > 0 && (
        <div className="mb-5" data-testid="claims-list">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute mb-2">
            CLAIMED · 认领
          </p>
          <ul className="flex flex-wrap gap-2">
            {reminder.claims.map((c) => (
              <li
                key={c.id}
                data-testid={`claim-${c.userId}`}
                className="rt-box-tight bg-[color:var(--rt-claim-soft,#dde6f4)] px-3 py-1 text-sm font-[family-name:var(--font-caveat)]"
                style={{
                  borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px",
                }}
              >
                {c.user.displayName}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute mb-2">
          REACT · 反应
        </p>
        <ReactionBar reminderId={reminder.id} counts={reactionCounts} />
      </div>

      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute mb-2">
          POKE · 拍拍
        </p>
        <PokeComposer reminderId={reminder.id} candidates={pokeCandidates} />
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute mb-2">
          COMMENTS · 评论（{comments.length}）
        </p>
        <ul className="space-y-2 mb-3" data-testid="comment-list">
          {comments.length === 0 ? (
            <li className="font-[family-name:var(--font-kalam)] text-rt-ink-mute text-sm italic">
              还没人留言。
            </li>
          ) : (
            comments.map((c) => (
              <li
                key={c.id}
                data-testid={`comment-${c.id}`}
                className="rt-rise rt-box-tight bg-rt-paper-2 px-3 py-2"
                style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
              >
                <p className="font-[family-name:var(--font-caveat)] font-semibold text-rt-ink text-base">
                  {c.user.displayName}
                </p>
                <p className="font-[family-name:var(--font-kalam)] text-rt-ink-soft text-sm whitespace-pre-wrap">
                  {c.content}
                </p>
              </li>
            ))
          )}
        </ul>
        <CommentForm reminderId={reminder.id} />
      </div>
    </AppShell>
  );
}
