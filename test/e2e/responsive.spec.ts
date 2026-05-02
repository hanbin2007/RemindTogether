/**
 * Regression tests for the responsive app column width.
 *
 * History: the design's `<Phone>` wrapper is sized via the
 * `--app-max-w` CSS variable in `src/app/hifi-sketch.css`. An earlier
 * pass capped this at 52rem (~832px) so on 1280px+ desktops the app
 * sat in a narrow center column with huge empty gutters on both sides
 * — the user described it as "两边空一大片". This file pins the
 * minimum acceptable column width at common desktop sizes so that a
 * future tweak to those breakpoints can't silently regress it.
 *
 * The thresholds are intentionally loose (≥75% of viewport) — they
 * catch the "narrow column" regression without forcing a particular
 * pixel value, so we can keep tuning the breakpoints without
 * thrashing the test.
 */
import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./helpers/db";
import { setConfigForTest } from "./helpers/seed";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "Responsive checks need the local dev server");

// Only meaningful on a desktop chromium; mobile-safari project has a
// fixed iPhone viewport and would skip every assertion below.
test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Responsive layout checks are desktop-only",
);

const DESKTOP_VIEWPORTS = [
  { name: "laptop-1280", width: 1280, height: 800, minRatio: 0.75 },
  { name: "desktop-1440", width: 1440, height: 900, minRatio: 0.75 },
  { name: "desktop-1920", width: 1920, height: 1080, minRatio: 0.75 },
] as const;

async function signupAndLand(
  page: import("@playwright/test").Page,
  email: string,
) {
  await page.goto("/auth/signup");
  await page.getByTestId("field-displayName").fill("响应式用户");
  await page.getByTestId("field-email").fill(email);
  await page.getByTestId("field-password").fill("Pa55word!");
  await page.getByTestId("submit-signup").click();
  await page.waitForURL(/\/app$/);
  // Make sure the Today screen has actually rendered before measuring,
  // otherwise we'd measure an empty body.
  await expect(page.getByTestId("today-date-meta")).toBeVisible();
}

test.describe("Responsive desktop column width @local", () => {
  test.beforeAll(async () => {
    await setConfigForTest("auth.requireEmailVerification", false);
  });

  for (const vp of DESKTOP_VIEWPORTS) {
    test(`/app fills the viewport at ${vp.name} (≥${Math.round(vp.minRatio * 100)}%)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const email = uniqueEmail(`resp-${vp.name}`);
      await signupAndLand(page, email);

      // The Phone wrapper is the first `.hf` ancestor of the today
      // header; measure its bounding box and compare to viewport width.
      const phone = page
        .locator('.hf:has([data-testid="today-date-meta"])')
        .first();
      await expect(phone).toBeVisible();
      const box = await phone.boundingBox();
      expect(box, "Phone wrapper should have a bounding box").not.toBeNull();
      const ratio = box!.width / vp.width;
      // Helpful failure message: include the actual values so a
      // regression is obvious from the report.
      expect(
        ratio,
        `Phone column width was ${box!.width}px on a ${vp.width}px viewport (ratio=${ratio.toFixed(3)}); expected ≥ ${vp.minRatio}. Likely a --app-max-w regression in src/app/hifi-sketch.css.`,
      ).toBeGreaterThanOrEqual(vp.minRatio);
    });
  }

  test("--app-max-w CSS variable resolves wider than the legacy 52rem cap on 1440px desktop", async ({
    page,
  }) => {
    // Belt-and-braces: read the resolved CSS variable directly. Even
    // if some future page swaps the wrapper, this catches a stale
    // hifi-sketch.css cap regressing back to 52rem (~832px).
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/auth/login");
    const value = await page.evaluate(() => {
      // Force a reflow before reading custom property; some browsers
      // lazy-resolve `min(...)` until layout has run.
      void document.documentElement.offsetWidth;
      const raw = getComputedStyle(document.documentElement).getPropertyValue(
        "--app-max-w",
      );
      // Resolve to a px number by setting it on a probe element.
      const probe = document.createElement("div");
      probe.style.width = raw;
      probe.style.position = "fixed";
      probe.style.left = "-9999px";
      document.body.appendChild(probe);
      const px = probe.getBoundingClientRect().width;
      probe.remove();
      return px;
    });
    expect(
      value,
      `Resolved --app-max-w was ${value}px at 1440px viewport; expected > 832 (the legacy 52rem cap). Check the breakpoints in src/app/hifi-sketch.css.`,
    ).toBeGreaterThan(832);
  });
});
