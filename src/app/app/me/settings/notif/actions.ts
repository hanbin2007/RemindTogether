"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import {
  HF_L2_NOTIF_SOUNDS,
  type HfL2NotifSoundKey,
} from "@/components/hf/screens/HfL2Notif";

const VALID_SOUNDS = new Set<HfL2NotifSoundKey>(
  HF_L2_NOTIF_SOUNDS.map((s) => s.key),
);

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function updateNotifPrefsAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const userId = session.user.id;
  const dndOn = formData.get("dndOn") === "on";
  const dndStartRaw = String(formData.get("dndStart") ?? "");
  const dndEndRaw = String(formData.get("dndEnd") ?? "");
  const soundRaw = String(formData.get("sound") ?? "default");
  const skipDuringDnd = formData.get("pokeSkipDuringDnd") === "on";

  // dnd window: clear both fields when toggled off, otherwise validate
  // HH:MM and persist. Empty / invalid inputs also clear.
  const dndStart =
    dndOn && HHMM.test(dndStartRaw) ? dndStartRaw : null;
  const dndEnd =
    dndOn && HHMM.test(dndEndRaw) ? dndEndRaw : null;

  const sound: HfL2NotifSoundKey = VALID_SOUNDS.has(
    soundRaw as HfL2NotifSoundKey,
  )
    ? (soundRaw as HfL2NotifSoundKey)
    : "default";

  await prisma.user.update({
    where: { id: userId },
    data: {
      dndStart,
      dndEnd,
      notificationSound: sound,
    },
  });

  // Map "勿扰时段不通知" toggle onto PokeSetting.doNotDisturb. (The
  // global poke DND check uses both dndStart/End AND PokeSetting.DND;
  // letting the user wire the latter via this dedicated checkbox keeps
  // it explicit.)
  await prisma.pokeSetting.upsert({
    where: { userId },
    create: { userId, doNotDisturb: skipDuringDnd },
    update: { doNotDisturb: skipDuringDnd },
  });

  revalidatePath("/app/me/settings/notif");
  revalidatePath("/app/me");
}
