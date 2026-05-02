/**
 * Direct port of HfPoke (design/project/hf-screens-B.jsx lines 196-310).
 * The design is a dedicated full-screen view, so we render it as
 * /app/reminders/[id]/poke?to=<userId>. Routed-to from the "拍拍 ta"
 * button on reminder detail's 指派给 row.
 *
 * Mechanical replacements only:
 *   - <Phone> wrapper                  → page chrome
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - <Av ...>                          → <HF.Av ... />
 *   - hardcoded "阿莫" / 12 days / 88px → real recipient + pokeContext
 *   - hardcoded reminder list           → real group reminders behind ta
 *   - hardcoded "在线" green dot        → kept as static (no presence yet)
 *
 * Inner JSX (className + inline styles + structure) preserved verbatim.
 */
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getReminder } from "@/services/reminders";
import { getPokeContext } from "@/services/pokes";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { avatarSlot } from "@/components/sketch/avatar";
import { HfPoke } from "@/components/hf/screens/HfPoke";

export const dynamic = "force-dynamic";

export default async function PokePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ to?: string }>;
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
  const sp = await searchParams;

  let reminder;
  try {
    reminder = await getReminder(principal, id);
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof NotFoundError) notFound();
    throw e;
  }

  // Pick the target — explicit ?to=, else the assignee, else the first
  // claim, else the creator (for private reminders not pokeable yet).
  const targetId =
    sp.to ??
    reminder.assigneeId ??
    reminder.claims.find((c) => c.userId !== principal.id)?.userId ??
    (reminder.creatorId !== principal.id ? reminder.creatorId : null);
  if (!targetId) notFound();

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, displayName: true },
  });
  if (!target) notFound();

  const sender = await prisma.user.findUnique({
    where: { id: principal.id },
    select: { id: true, displayName: true },
  });
  if (!sender) notFound();

  const ctx = await getPokeContext(principal, target.id);

  // Other group reminders the target is assigned to (or has claimed) —
  // for the "关于哪件事" picker.
  const otherReminders = reminder.groupId
    ? await prisma.reminder.findMany({
        where: {
          groupId: reminder.groupId,
          isDeleted: false,
          status: { not: "DONE" },
          OR: [
            { assigneeId: target.id },
            { claims: { some: { userId: target.id } } },
          ],
          NOT: { id: reminder.id },
        },
        select: {
          id: true,
          title: true,
          dueAt: true,
          group: { select: { name: true } },
        },
        take: 4,
      })
    : [];

  const allRemindersForPicker = [
    {
      id: reminder.id,
      title: reminder.title,
      groupName: reminder.group?.name ?? "私人",
      late: "现在", // TBD: compute from dueAt
    },
    ...otherReminders.map((r) => ({
      id: r.id,
      title: r.title,
      groupName: r.group?.name ?? "私人",
      late: r.dueAt
        ? new Date(r.dueAt).getTime() < Date.now()
          ? "已晚"
          : "等会做"
        : "等会做",
    })),
  ];

  return (
    <HfPoke
      reminderId={reminder.id}
      backHref={`/app/reminders/${reminder.id}`}
      remaining={ctx.remaining}
      target={{
        id: target.id,
        displayName: target.displayName,
        slot: avatarSlot(target.id),
      }}
      sender={{
        displayName: sender.displayName,
        slot: avatarSlot(sender.id),
      }}
      lastSentAt={ctx.lastSentAt?.toISOString() ?? null}
      reminders={allRemindersForPicker}
      groupName={reminder.group?.name ?? null}
    />
  );
}

void Link;
