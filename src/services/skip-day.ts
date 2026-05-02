/**
 * Soft skip-day flow for HfL2SkipDay. Different from `skipReminderDay`
 * (which marks a single reminder SKIPPED): this is the "整天放过自己"
 * path where the user uses a shield card if available, optionally
 * leaves a mood note, and the streak engine treats today as PROTECTED.
 *
 * Wraps `useShieldToday` so the streak preservation logic stays in one
 * place. Mood is recorded on the StreakDay row via a side payload — we
 * store it in the row's notes-via-StreakDay, but since the schema
 * doesn't have notes on StreakDay, we shove it into AdminLog as a
 * lightweight diary for now (will move to a proper SkipDay table when
 * we add weekly recap features).
 */
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Principal } from "@/lib/auth/principal";
import { useShieldToday } from "@/services/shield";

export const skipDayInputSchema = z.object({
  mood: z.string().trim().max(140).optional(),
});
export type SkipDayInput = z.infer<typeof skipDayInputSchema>;

export interface SkipDayResult {
  applied: boolean;
  reason?: "already_done" | "already_protected";
  cardsLeft: number;
  mood: string | null;
}

export async function skipDayWithShield(
  principal: Principal,
  input: SkipDayInput,
): Promise<SkipDayResult> {
  const r = await useShieldToday(principal);
  let mood: string | null = null;
  if (r.applied && input.mood && input.mood.length > 0) {
    mood = input.mood;
    // Persist the note. Until SkipDay/Diary lands, attach the note to
    // the user's most recent StreakDay (the one we just created as
    // PROTECTED). We piggyback on the existing column-less notes path
    // by writing a one-row AdminLog-style entry — keeps schema stable.
    // Phase 11 will add a real SkipDay table.
    await prisma.adminLog.create({
      data: {
        adminId: principal.id, // user's own row; not a real admin action
        action: "self.skip_day_mood",
        targetType: "user",
        targetId: principal.id,
        payload: { mood },
      },
    });
  }
  return { ...r, mood };
}

/** How many shield cards are left. Used by the SkipDay sheet preview. */
export async function previewSkipDay(
  principal: Principal,
): Promise<{ cardsLeft: number; cap: number }> {
  const card = await prisma.shieldCard.findUnique({
    where: { userId: principal.id },
  });
  // Cap is in Config; but the SkipDay sheet just needs the simple "you
  // have N left" — fetch the cap from Config for the [N/cap] display.
  const { getConfigInt, ConfigKey } = await import("@/services/config");
  const cap = await getConfigInt(ConfigKey.ShieldCardMaxHeld);
  return { cardsLeft: card?.count ?? 0, cap };
}
