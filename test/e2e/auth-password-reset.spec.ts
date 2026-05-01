import { test, expect } from "@playwright/test";
import {
  extractTokenFromBody,
  findLatestMail,
  uniqueEmail,
} from "./helpers/db";
import { seedUser } from "./helpers/seed";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "DB-touching tests run against the local dev server only");

test.describe("Phase 2 · forgot password @local", () => {
  test("forgot → mail link → reset → can login with new password", async ({
    page,
  }) => {
    const email = uniqueEmail("forgot");
    const oldPw = "OldPa55word!";
    const newPw = "NewSecret99";

    await seedUser({
      email,
      password: oldPw,
      displayName: "Forgot",
      emailVerified: true,
    });

    // Step 1: request a reset email
    await page.goto("/auth/forgot");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("submit-forgot").click();
    await expect(page.getByTestId("forgot-success")).toBeVisible();

    // Step 2: read the reset link from the DB
    const mail = await findLatestMail(email, "PASSWORD_RESET");
    expect(mail).not.toBeNull();
    const token = extractTokenFromBody(mail!.body, "/auth/reset");
    expect(token).not.toBeNull();

    // Step 3: visit reset page, set new password
    await page.goto(`/auth/reset?token=${token}`);
    await page.getByTestId("field-newPassword").fill(newPw);
    await page.getByTestId("submit-reset").click();
    await expect(page.getByTestId("reset-success")).toBeVisible();

    // Step 4: old password rejected
    await page.goto("/auth/login");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill(oldPw);
    await page.getByTestId("submit-login").click();
    await expect(page.getByTestId("form-error")).toContainText("邮箱或密码不对");

    // Step 5: new password works (form clears on action error, refill both)
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill(newPw);
    await page.getByTestId("submit-login").click();
    await page.waitForURL(/\/app$/);
    await expect(page.getByTestId("app-greeting")).toContainText("Forgot");
  });

  test("reset link with bad token shows an error", async ({ page }) => {
    await page.goto("/auth/reset?token=does-not-exist");
    await page.getByTestId("field-newPassword").fill("Whatever12");
    await page.getByTestId("submit-reset").click();
    await expect(page.getByTestId("form-error")).toBeVisible();
  });
});
