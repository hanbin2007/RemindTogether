import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./helpers/db";
import { setConfigForTest } from "./helpers/seed";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "DB-touching tests run against the local dev server only");

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

test.describe("HfL2GroupSettings (1:1 port) @local", () => {
  test.beforeAll(async () => {
    await setConfigForTest("auth.requireEmailVerification", false);
  });

  test("dedicated settings page renders cover + members + rules + danger", async ({
    page,
  }) => {
    const email = uniqueEmail("settings-flow");
    await signup(page, {
      email,
      password: "Pa55word!",
      displayName: "群主",
    });

    // Make a group.
    await page.goto("/app/groups/new");
    await page.getByTestId("create-group-name").fill("读书一起冲");
    await page.getByTestId("create-group-emoji-📚").click();
    await page.getByTestId("create-group-submit").click();
    await page.waitForURL(/\/app\/groups\/[a-z0-9-]+$/);

    // Open settings tab → opens dedicated page.
    await page.getByTestId("group-tab-settings").click();
    await page.getByTestId("group-settings-link").click();
    await page.waitForURL(/\/app\/groups\/[a-z0-9-]+\/settings$/);

    // Cover, members list, rules box, danger zone all rendered.
    await expect(page.getByTestId("settings-cover")).toBeVisible();
    await expect(page.getByTestId("settings-cover")).toContainText("读书一起冲");
    await expect(page.getByTestId("settings-members")).toBeVisible();
    await expect(page.getByTestId("settings-rules")).toBeVisible();
    // 4 rules
    for (const k of [
      "skipNotLose",
      "hideStreakBreaks",
      "allowPokes",
      "weeklyRecap",
    ]) {
      await expect(page.getByTestId(`settings-rule-${k}`)).toBeVisible();
    }
    // Owner sees 解散
    await expect(page.getByTestId("settings-disband")).toBeVisible();

    // Toggle a rule
    const toggle = page.getByTestId("settings-rule-skipNotLose");
    const before = await toggle.getAttribute("data-on");
    await toggle.click();
    await expect(toggle).not.toHaveAttribute("data-on", before ?? "true");
  });
});
