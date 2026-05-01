import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./helpers/db";
import { setConfigForTest } from "./helpers/seed";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "L2 screens require the local dev DB");

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

test.describe("Phase 9 · L2 sub-screens @local", () => {
  test.beforeAll(async () => {
    await setConfigForTest("auth.requireEmailVerification", false);
  });

  test("/app/onboard renders the welcome onboarding screen", async ({
    page,
  }) => {
    const email = uniqueEmail("onboard");
    await signup(page, {
      email,
      password: "Pa55word!",
      displayName: "新人",
    });

    await page.goto("/app/onboard");
    await expect(page.getByTestId("onboard-page")).toBeVisible();
    await expect(page.getByTestId("onboard-title")).toContainText("惦记");
    await expect(page.getByTestId("onboard-cta")).toBeVisible();
  });

  test("/app/me/streak renders the streak celebration page", async ({
    page,
  }) => {
    const email = uniqueEmail("streak");
    await signup(page, {
      email,
      password: "Pa55word!",
      displayName: "连胜",
    });

    await page.goto("/app/me/streak");
    await expect(page.getByTestId("streak-page")).toBeVisible();
    await expect(page.getByTestId("streak-title")).toBeVisible();
    // 7-day grid is rendered.
    await expect(page.getByTestId("streak-7day-0")).toBeVisible();
    await expect(page.getByTestId("streak-7day-6")).toBeVisible();
  });

  test("/app/celebrate renders the after-complete celebration overlay", async ({
    page,
  }) => {
    const email = uniqueEmail("celebrate");
    await signup(page, {
      email,
      password: "Pa55word!",
      displayName: "庆祝",
    });

    await page.goto("/app/celebrate?prev=4");
    await expect(page.getByTestId("celebrate-page")).toBeVisible();
    await expect(page.getByTestId("celebrate-title")).toContainText("收下");
    await expect(page.getByTestId("celebrate-share")).toBeVisible();
    await expect(page.getByTestId("celebrate-close")).toBeVisible();
  });

  test("/app/reminders/new renders the create form (HfCreate)", async ({
    page,
  }) => {
    const email = uniqueEmail("create-form");
    await signup(page, {
      email,
      password: "Pa55word!",
      displayName: "创建",
    });

    await page.goto("/app/reminders/new");
    await expect(page.getByTestId("create-reminder-form")).toBeVisible();
    await expect(page.getByTestId("create-title")).toBeVisible();
    await expect(page.getByTestId("create-vis-PRIVATE")).toBeVisible();
    await expect(page.getByTestId("create-vis-GROUP")).toBeVisible();

    // Submit a private reminder.
    await page.getByTestId("create-title").fill("写日记");
    await page.getByTestId("create-submit").click();
    await page.waitForURL(/\/app\/reminders\/[a-z0-9-]+$/);
    await expect(page.getByTestId("reminder-title")).toContainText("写日记");
  });

  test("/app/groups/new renders the new-group form", async ({ page }) => {
    const email = uniqueEmail("new-group");
    await signup(page, {
      email,
      password: "Pa55word!",
      displayName: "群主",
    });

    await page.goto("/app/groups/new");
    await expect(page.getByTestId("create-group-form")).toBeVisible();
    await expect(page.getByTestId("create-group-name")).toBeVisible();
  });
});
