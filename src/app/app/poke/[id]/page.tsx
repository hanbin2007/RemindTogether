import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { avatarSlot } from "@/components/sketch/avatar";
import { HfL2Poked } from "@/components/hf/screens/HfL2Poked";

export const dynamic = "force-dynamic";

const TONE_HINT: Record<string, string> = {
  ALMOST: "差一点点",
  THINKING: "想到你了",
  NO_RUSH: "不急慢慢来",
};

function timeLabel(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Full-screen "you got poked" view — renders the literal-port HfL2Poked.
 * No PageShell: the design owns its own poke-soft full-bg layout.
 * Reached from push notification or /app/me/notifications.
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
  const sentAt = poke.sentAt;
  const sentLabel = timeLabel(sentAt);

  return (
    <HfL2Poked
      poke={{
        id: poke.id,
        fromName: poke.from.displayName,
        fromSlot: avatarSlot(poke.from.id),
        tone,
        message: poke.message,
        sentLabel,
        nowLabel: sentLabel,
        groupName: poke.reminder?.group?.name ?? null,
        reminder: poke.reminder
          ? {
              id: poke.reminder.id,
              title: poke.reminder.title,
              originalTime: poke.reminder.dueAt
                ? timeLabel(new Date(poke.reminder.dueAt))
                : null,
            }
          : null,
      }}
    />
  );
}
