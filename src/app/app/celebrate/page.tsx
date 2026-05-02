import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getStreakStatus } from "@/services/streaks";
import { HfL2Celebrate } from "@/components/hf/screens/HfL2Celebrate";

export const dynamic = "force-dynamic";

/**
 * Full-screen celebration that shows after a meaningful completion.
 * Renders the literal HfL2Celebrate port. No PageShell because this is
 * a full overlay view.
 *
 * Routed as: /app/celebrate?prev=<streak before bump>
 */
export default async function CelebratePage({
  searchParams,
}: {
  searchParams: Promise<{ prev?: string }>;
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
  const prevStreak = Number(sp.prev ?? 0) || 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [doneToday, streak] = await Promise.all([
    prisma.completion.count({
      where: { userId: principal.id, completedAt: { gte: todayStart } },
    }),
    getStreakStatus(principal),
  ]);

  return (
    <HfL2Celebrate
      prevStreak={prevStreak}
      currentStreak={streak.current}
      shieldCards={streak.shieldCards}
      doneTodayCount={doneToday}
      closeHref="/app"
      shareHref="/app"
    />
  );
}
