import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getStreakStatus } from "@/services/streaks";
import { HfL2StreakBig } from "@/components/hf/screens/HfL2StreakBig";

export const dynamic = "force-dynamic";

/**
 * Big streak celebration page — renders the literal-port HfL2StreakBig.
 * No PageShell: the design has its own gradient bg + back chevron.
 *
 * - For 7+ day streaks: full celebration with trophy + 7-day grid
 * - Otherwise: encouraging "还差 N 天" framing with the recent day grid
 */
export default async function StreakPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  const principal = {
    id: session.user.id,
    email: session.user.email ?? "",
    isAdmin: session.user.isAdmin,
    emailIsVerified: session.user.emailIsVerified,
  };
  const streak = await getStreakStatus(principal);

  const reachedWeek = streak.current >= 7;
  const milestoneDays = reachedWeek ? 30 : 7;
  const remaining = milestoneDays - streak.current;

  return (
    <HfL2StreakBig
      currentStreak={streak.current}
      longest={streak.longest}
      shieldCards={streak.shieldCards}
      shieldCardCap={streak.shieldCardCap}
      recent={streak.recent}
      nextMilestone={{ days: milestoneDays, remaining }}
    />
  );
}
