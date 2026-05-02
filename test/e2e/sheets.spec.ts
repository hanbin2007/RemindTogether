import { test, expect } from "@playwright/test";
import { uniqueEmail, getPrisma } from "./helpers/db";
import { setConfigForTest } from "./helpers/seed";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "Sheet flows require the local dev DB");

async function signup(
  page: import("@playwright/test").Page,
  opts: { email: string; password: string; displayName: string },
) {
  await page.goto("/auth/signup");
  await page.getByTestId("field-displayName").fill(opts.displayName);
  await page.getByTestId("field-email").fill(opts.email);
  await page.getByTestId("field-password").fill(opts.password);
  await page.getByTestId("submit-signup").click();
  await page.waitForURL(/\/app$/);
}

test.describe("High-priority sheets @local", () => {
  test.beforeAll(async () => {
    await setConfigForTest("auth.requireEmailVerification", false);
  });

  test("Today empty: sun sticker + quick-add chips create reminders", async ({
    page,
  }) => {
    const email = uniqueEmail("empty-flow");
    await signup(page, {
      email,
      password: "Pa55word!",
      displayName: "空态用户",
    });

    // No reminders + no completions yet → empty state visible.
    await expect(page.getByTestId("today-empty")).toBeVisible();
    // Tap a quick chip — should create a reminder + refresh list.
    await page.getByTestId("empty-chip-coffee").click();
    // After refresh the empty state is gone and there's at least one row.
    await expect(
      page.locator("[data-testid^=reminder-row-]").first(),
    ).toContainText("早餐");
  });

  test("Long-press → action sheet shows 5 actions on a private row", async ({
    page,
  }) => {
    const email = uniqueEmail("lp-flow");
    await signup(page, {
      email,
      password: "Pa55word!",
      displayName: "长按用户",
    });
    // Make a private reminder so it has the full action set.
    await page.getByTestId("quick-add-input").fill("看电影");
    await page.getByTestId("quick-add-submit").click();
    const row = page.locator("[data-testid^=reminder-row-]").first();
    await expect(row).toBeVisible();

    // Trigger via the right-click pathway — equivalent to long-press on
    // touch and easier to drive deterministically in headless Chromium.
    await row.click({ button: "right" });
    await expect(page.getByTestId("long-press-sheet")).toBeVisible();

    // Reschedule + Pin + Copy + Delete should all be present (no "share"
    // because the user has no groups yet).
    await expect(page.getByTestId("lp-reschedule")).toBeVisible();
    await expect(page.getByTestId("lp-pin")).toBeVisible();
    await expect(page.getByTestId("lp-copy")).toBeVisible();
    await expect(page.getByTestId("lp-delete")).toBeVisible();
    // Share should NOT exist because no groups yet.
    await expect(page.getByTestId("lp-share")).toHaveCount(0);
  });

  test("Long-press reschedule opens reschedule sheet with state buttons", async ({
    page,
  }) => {
    const email = uniqueEmail("resched-flow");
    await signup(page, {
      email,
      password: "Pa55word!",
      displayName: "改约用户",
    });
    await page.getByTestId("quick-add-input").fill("散步");
    await page.getByTestId("quick-add-submit").click();
    const row = page.locator("[data-testid^=reminder-row-]").first();
    await row.click({ button: "right" });
    await page.getByTestId("lp-reschedule").click();

    await expect(page.getByTestId("reschedule-sheet")).toBeVisible();
    await expect(page.getByTestId("reschedule-state-tired")).toBeVisible();
    await expect(page.getByTestId("reschedule-state-go")).toBeVisible();
    await expect(page.getByTestId("reschedule-suggest-0")).toBeVisible();

    // Pick "想冲" + first suggestion → confirm.
    await page.getByTestId("reschedule-state-go").click();
    await page.getByTestId("reschedule-suggest-0").click();
    await page.getByTestId("reschedule-confirm").click();
    // Sheet closes after success
    await expect(page.getByTestId("reschedule-sheet")).toHaveCount(0, {
      timeout: 3_000,
    });
  });

  test("Reminder detail 今天跳过 opens SkipDay sheet with shield preview", async ({
    page,
  }) => {
    const email = uniqueEmail("skip-flow");
    await signup(page, {
      email,
      password: "Pa55word!",
      displayName: "跳过用户",
    });
    // Top up shield card so the preview shows ≥ 1.
    const u = await getPrisma().user.findUnique({ where: { email } });
    await getPrisma().shieldCard.upsert({
      where: { userId: u!.id },
      update: { count: 3 },
      create: { userId: u!.id, count: 3 },
    });

    await page.getByTestId("quick-add-input").fill("写日记");
    await page.getByTestId("quick-add-submit").click();
    const row = page.locator("[data-testid^=reminder-row-]").first();
    await row.locator("[data-testid$=-link]").click();
    await page.waitForURL(/\/app\/reminders\/[a-z0-9-]+$/);

    await page.getByTestId("reminder-skip").click();
    await expect(page.getByTestId("skip-day-sheet")).toBeVisible();
    await expect(
      page.getByTestId("skip-day-shield-preview"),
    ).toBeVisible();
    await page.getByTestId("skip-day-mood").fill("今天累");
    await page.getByTestId("skip-day-confirm").click();
    // After commit, sheet auto-closes within 1s
    await expect(page.getByTestId("skip-day-sheet")).toHaveCount(0, {
      timeout: 3_000,
    });
  });

  test("Notifications inbox: empty state shows when no activity yet", async ({
    page,
  }) => {
    const email = uniqueEmail("notif-flow");
    await signup(page, {
      email,
      password: "Pa55word!",
      displayName: "通知用户",
    });
    await page.goto("/app/me/notifications");
    await expect(page.getByTestId("inbox-empty")).toBeVisible();
  });
});
