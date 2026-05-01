/**
 * IANA timezone helpers. We avoid pulling date-fns-tz so the bundle
 * stays light; Node has a fully-featured Intl tzdb already.
 *
 * All inputs are JS Date (epoch instant) and IANA tz strings (e.g.
 * "Asia/Shanghai"). Output is either a "YYYY-MM-DD" wall-clock date in
 * that tz, or a Date pinned to local midnight in that tz.
 */

const dateFmtCache = new Map<string, Intl.DateTimeFormat>();
function dateFmt(tz: string): Intl.DateTimeFormat {
  let f = dateFmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateFmtCache.set(tz, f);
  }
  return f;
}

const partsFmtCache = new Map<string, Intl.DateTimeFormat>();
function partsFmt(tz: string): Intl.DateTimeFormat {
  let f = partsFmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsFmtCache.set(tz, f);
  }
  return f;
}

/** "YYYY-MM-DD" wall-clock date in `tz` for the given UTC instant. */
export function localDateInTz(date: Date, tz: string): string {
  // en-CA produces "YYYY-MM-DD" by default
  return dateFmt(tz).format(date);
}

/** Add `days` to a "YYYY-MM-DD" string and return a new "YYYY-MM-DD". */
export function addDaysISO(yyyymmdd: string, days: number): string {
  const [y, m, d] = yyyymmdd.split("-").map((s) => Number.parseInt(s, 10));
  // Construct in UTC to avoid host-tz drift; only the ymd matters.
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear().toString().padStart(4, "0");
  const mm = (dt.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = dt.getUTCDate().toString().padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Convert a "YYYY-MM-DD" wall-clock date in `tz` to the UTC Date at
 * 00:00:00 of that local day. Handles DST transitions correctly by
 * iteratively narrowing in on the right UTC instant — naive
 * "sample-at-noon" approaches read the wrong offset on the
 * spring-forward day.
 */
export function startOfDayInTz(yyyymmdd: string, tz: string): Date {
  const [y, m, d] = yyyymmdd.split("-").map((s) => Number.parseInt(s, 10));
  // Initial guess: pretend the local wall clock is UTC. We then keep
  // adjusting `guess` until formatting it in `tz` reports the wall
  // clock we want (00:00:00 on yyyymmdd). Two iterations suffice for
  // any IANA tz; loop bound is paranoia.
  let guess = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      partsFmt(tz)
        .formatToParts(guess)
        .map((p) => [p.type, p.value]),
    );
    const localUtc = Date.UTC(
      Number.parseInt(parts.year, 10),
      Number.parseInt(parts.month, 10) - 1,
      Number.parseInt(parts.day, 10),
      Number.parseInt(parts.hour, 10),
      Number.parseInt(parts.minute, 10),
      Number.parseInt(parts.second, 10),
    );
    const desired = Date.UTC(y, m - 1, d, 0, 0, 0);
    const diff = desired - localUtc;
    if (diff === 0) return guess;
    guess = new Date(guess.getTime() + diff);
  }
  return guess;
}

/** "YYYY-MM-DD" → JS Date at the start of the UTC day (Prisma Date columns). */
export function dateOnlyUtc(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split("-").map((s) => Number.parseInt(s, 10));
  return new Date(Date.UTC(y, m - 1, d));
}

/** "YYYY-MM-DD" string for a given tz date-only Date column value. */
export function isoFromDateColumn(d: Date): string {
  const yy = d.getUTCFullYear().toString().padStart(4, "0");
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = d.getUTCDate().toString().padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
