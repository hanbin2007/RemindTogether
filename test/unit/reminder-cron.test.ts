import { describe, it, expect } from "vitest";
import { nextOccurrence } from "@/services/reminder-cron";

describe("nextOccurrence", () => {
  it("computes next FREQ=DAILY occurrence after now", () => {
    const start = new Date("2026-05-02T07:00:00Z");
    // Daily rule starting 2026-05-01T07:00Z, every day
    const rule =
      "DTSTART:20260501T070000Z\nRRULE:FREQ=DAILY";
    const next = nextOccurrence(rule, start);
    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe("2026-05-03T07:00:00.000Z");
  });

  it("computes next FREQ=WEEKLY", () => {
    const start = new Date("2026-05-02T07:00:00Z"); // Saturday
    const rule = "DTSTART:20260427T070000Z\nRRULE:FREQ=WEEKLY"; // Mondays
    const next = nextOccurrence(rule, start);
    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe("2026-05-04T07:00:00.000Z");
  });

  it("returns null on malformed RRULE", () => {
    expect(nextOccurrence("not a rule", new Date())).toBeNull();
  });

  it("returns null when COUNT is exhausted", () => {
    // COUNT=1 — only one occurrence ever, on the start date.
    const rule = "DTSTART:20260501T070000Z\nRRULE:FREQ=DAILY;COUNT=1";
    const after = new Date("2026-05-01T07:00:01Z");
    expect(nextOccurrence(rule, after)).toBeNull();
  });

  it("strict 'after' semantics — returns occurrence strictly after the input", () => {
    const start = new Date("2026-05-02T07:00:00Z");
    const rule = "DTSTART:20260502T070000Z\nRRULE:FREQ=DAILY";
    const next = nextOccurrence(rule, start);
    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe("2026-05-03T07:00:00.000Z");
  });
});
