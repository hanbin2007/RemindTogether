import { describe, it, expect } from "vitest";
import {
  addDaysISO,
  dateOnlyUtc,
  isoFromDateColumn,
  localDateInTz,
  startOfDayInTz,
} from "@/lib/tz";

describe("tz utils", () => {
  describe("localDateInTz", () => {
    it("returns YYYY-MM-DD in the given tz", () => {
      // 2026-05-01 02:30 UTC = 10:30 in Asia/Shanghai
      const d = new Date("2026-05-01T02:30:00Z");
      expect(localDateInTz(d, "Asia/Shanghai")).toBe("2026-05-01");
      expect(localDateInTz(d, "UTC")).toBe("2026-05-01");
      // Same instant in UTC = 22:30 of the previous day in America/New_York
      expect(localDateInTz(d, "America/New_York")).toBe("2026-04-30");
    });

    it("handles instant near tz midnight", () => {
      // 2026-05-01 15:30 UTC = 23:30 of 2026-05-01 in Shanghai
      const before = new Date("2026-05-01T15:30:00Z");
      expect(localDateInTz(before, "Asia/Shanghai")).toBe("2026-05-01");
      // 2026-05-01 16:30 UTC = 00:30 of 2026-05-02 in Shanghai
      const after = new Date("2026-05-01T16:30:00Z");
      expect(localDateInTz(after, "Asia/Shanghai")).toBe("2026-05-02");
    });
  });

  describe("addDaysISO", () => {
    it("adds and subtracts whole days", () => {
      expect(addDaysISO("2026-05-01", 1)).toBe("2026-05-02");
      expect(addDaysISO("2026-05-01", -1)).toBe("2026-04-30");
      expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
      expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28");
    });
  });

  describe("startOfDayInTz", () => {
    it("returns the UTC instant when local-midnight occurs", () => {
      // Asia/Shanghai is UTC+8 year-round, so local midnight 2026-05-02
      // is 2026-05-01 16:00 UTC.
      const utc = startOfDayInTz("2026-05-02", "Asia/Shanghai");
      expect(utc.toISOString()).toBe("2026-05-01T16:00:00.000Z");
    });

    it("handles UTC tz", () => {
      const utc = startOfDayInTz("2026-05-01", "UTC");
      expect(utc.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    });

    it("handles America/New_York DST forward (no 2:30am on the spring-forward day)", () => {
      // 2026-03-08 is 2nd Sunday of March → spring forward in NY (UTC-5 → UTC-4)
      // Local midnight 2026-03-08 in NY is 2026-03-08 05:00 UTC (offset still -5 at midnight).
      const utc = startOfDayInTz("2026-03-08", "America/New_York");
      expect(utc.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    });
  });

  describe("dateOnlyUtc / isoFromDateColumn round-trip", () => {
    it("survives the round trip", () => {
      const iso = "2026-05-01";
      const d = dateOnlyUtc(iso);
      expect(d.toISOString()).toBe("2026-05-01T00:00:00.000Z");
      expect(isoFromDateColumn(d)).toBe(iso);
    });
  });
});
