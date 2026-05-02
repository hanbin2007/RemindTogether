import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./helpers/db";
import { setConfigForTest } from "./helpers/seed";

test.describe("Popup triggers @local", () => {
  test.beforeAll(async () => {
    await setConfigForTest("auth.requireEmailVerification", false);
  });

  test("/app/private + 加 opens new-reminder popup", async ({ page }) => {
    const email = uniqueEmail("popup-r");
    await page.goto("/auth/signup");
    await page.getByTestId("field-displayName").fill("用户");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill("Pa55word!");
    await page.getByTestId("submit-signup").click();
    await page.waitForURL(/\/app$/);

    await page.goto("/app/private");
    await page.getByTestId("private-new").click();
    await expect(page.getByTestId("create-reminder-form")).toBeVisible();
  });

  test("/app/groups + 建群 opens new-group popup", async ({ page }) => {
    const email = uniqueEmail("popup-g");
    await page.goto("/auth/signup");
    await page.getByTestId("field-displayName").fill("用户");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill("Pa55word!");
    await page.getByTestId("submit-signup").click();
    await page.waitForURL(/\/app$/);

    await page.goto("/app/groups");
    await page.getByTestId("groups-new").click();
    await expect(page.getByTestId("create-group-form")).toBeVisible();
  });
});
