import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/hf";
import {
  HfL2Notif,
  type HfL2NotifSoundKey,
} from "@/components/hf/screens/HfL2Notif";
import { updateNotifPrefsAction } from "./actions";

export const dynamic = "force-dynamic";

const VALID_SOUNDS = new Set<HfL2NotifSoundKey>([
  "default",
  "bird",
  "wood",
  "vibrate",
  "silent",
]);

export default async function NotifPrefsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [user, pokeSetting] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        dndStart: true,
        dndEnd: true,
        notificationSound: true,
      },
    }),
    prisma.pokeSetting.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  const soundKey: HfL2NotifSoundKey = VALID_SOUNDS.has(
    user.notificationSound as HfL2NotifSoundKey,
  )
    ? (user.notificationSound as HfL2NotifSoundKey)
    : "default";

  return (
    <PageShell isAdmin={session.user.isAdmin} tabActive={4}>
      <HfL2Notif
        backHref="/app/me"
        dnd={{ start: user.dndStart, end: user.dndEnd }}
        // schema doesn't store per-day DND yet — the UI defaults to the
        // design's Mon-Fri pattern so the layout reads correctly.
        dndDays={[true, true, true, true, true, false, false]}
        sound={soundKey}
        pokePrefs={{
          fullScreen: true,
          vibrateOnly: false,
          skipDuringDnd: pokeSetting?.doNotDisturb ?? false,
          capPerDay: false,
        }}
        capPerDayValue={5}
        formAction={updateNotifPrefsAction}
      />
    </PageShell>
  );
}
