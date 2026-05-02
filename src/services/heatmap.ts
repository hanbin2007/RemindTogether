/**
 * Completion heatmap — 14 days × 4 time slots (morning / noon / evening
 * / night). Powers the dot grid on /app/me's energy card.
 *
 * Slot bucketing is per-user-timezone so the grid lines up with what
 * the user actually experiences. Returns intensity 0..4 per cell.
 */
import { prisma } from "@/lib/prisma";
import type { Principal } from "@/lib/auth/principal";

export interface HeatmapCell {
  /** ISO date (YYYY-MM-DD) in the user's tz. */
  date: string;
  /** 0=morning(0-9) 1=noon(9-13) 2=evening(13-18) 3=night(18-24). */
  slot: 0 | 1 | 2 | 3;
  /** 0..4 — saturated at 4 to keep the rendering simple. */
  intensity: number;
}

export interface HeatmapResult {
  cells: HeatmapCell[];
  totalDone: number;
}

const SLOTS_PER_DAY = 4;

function slotForHour(hour: number): 0 | 1 | 2 | 3 {
  if (hour < 9) return 0;
  if (hour < 13) return 1;
  if (hour < 18) return 2;
  return 3;
}

/**
 * The completion table stores `completedAt` in UTC. We bucket using the
 * user's stored timezone (`User.timezone`, defaults to UTC). For now we
 * use the system Intl machinery — Phase 11 may switch to luxon once we
 * pull it in for RRULE.
 */
function localParts(d: Date, timezone: string): { date: string; hour: number } {
  // Use Intl.DateTimeFormat to split — avoids pulling a tz lib.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(d).map((p) => [p.type, p.value]),
  );
  const hour = Number(parts.hour ?? "0");
  // Date pieces come back YYYY-MM-DD in en-CA.
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, hour };
}

/** All ISO dates in [from, to] in the user's tz, oldest first. */
function dateRange(from: Date, to: Date, timezone: string): string[] {
  const out: string[] = [];
  // Walk day-by-day starting at `from`. We add 24h at a time which is
  // safe for the 14-day window we use here (no DST overflow).
  for (let t = from.getTime(); t <= to.getTime(); t += 24 * 3_600_000) {
    out.push(localParts(new Date(t), timezone).date);
  }
  return out;
}

export async function getHeatmap(
  principal: Principal,
  opts: { days?: number } = {},
): Promise<HeatmapResult> {
  const days = Math.max(1, Math.min(opts.days ?? 14, 30));
  const user = await prisma.user.findUnique({
    where: { id: principal.id },
    select: { timezone: true },
  });
  const tz = user?.timezone ?? "UTC";

  const now = new Date();
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  from.setUTCHours(0, 0, 0, 0);

  const completions = await prisma.completion.findMany({
    where: {
      userId: principal.id,
      completedAt: { gte: from, lte: now },
    },
    select: { completedAt: true },
  });

  // Aggregate (date, slot) → count
  const counts = new Map<string, number>();
  for (const c of completions) {
    const { date, hour } = localParts(c.completedAt, tz);
    const slot = slotForHour(hour);
    const key = `${date}#${slot}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const dates = dateRange(from, now, tz);
  const cells: HeatmapCell[] = [];
  for (const date of dates) {
    for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
      const n = counts.get(`${date}#${slot}`) ?? 0;
      // Saturate at 4 — a single cell having >4 completions is rare and
      // maxing out the visual is fine.
      cells.push({
        date,
        slot: slot as 0 | 1 | 2 | 3,
        intensity: Math.min(n, 4),
      });
    }
  }

  return { cells, totalDone: completions.length };
}
