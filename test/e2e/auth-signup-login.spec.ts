import { test, expect } from "@playwright/test";
import {
  extractTokenFromBody,
  findLatestMail,
  getPrisma,
  uniqueEmail,
} from "./helpers/db";
import { seedUser, setConfigForTest } from "./helpers/seed";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "DB-touching tests run against the local dev server only");

test.describe("Phase 2 · signup → login → logout @local", () => {
  test("default flow (verification disabled): signup lands in /app with no banner and no mail", async ({
    page,
  }) => {
    // Ensure flag is OFF for this test.
    await setConfigForTest("auth.requireEmailVerification", false);

    const email = uniqueEmail("signup-default");
    const password = "Pa55word!";
    const displayName = "默认用户";

    await page.goto("/auth/signup");
    await page.getByTestId("field-displayName").fill(displayName);
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill(password);
    await page.getByTestId("submit-signup").click();

    await page.waitForURL(/\/app$/);
    await expect(page.getByTestId("app-greeting")).toContainText(displayName);
    await expect(page.getByTestId("email-not-verified-banner")).toHaveCount(0);

    const u = await getPrisma().user.findUnique({ where: { email } });
    expect(u?.emailVerifiedAt).not.toBeNull();
    const mails = await getPrisma().mailLog.findMany({
      where: { toAddress: email, category: "EMAIL_VERIFICATION" },
    });
    expect(mails).toHaveLength(0);
  });

  test("with verification enabled (admin flips flag): signup shows banner, email link verifies", async ({
    page,
  }) => {
    await setConfigForTest("auth.requireEmailVerification", true);

    const email = uniqueEmail("signup-verify");
    const password = "Pa55word!";
    const displayName = "需验证用户";

    await page.goto("/auth/signup");
    await page.getByTestId("field-displayName").fill(displayName);
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill(password);
    await page.getByTestId("submit-signup").click();

    await page.waitForURL(/\/app$/);
    await expect(page.getByTestId("email-not-verified-banner")).toBeVisible();

    const mail = await findLatestMail(email, "EMAIL_VERIFICATION");
    expect(mail).not.toBeNull();
    const token = extractTokenFromBody(mail!.body, "/auth/verify-email");
    expect(token).not.toBeNull();

    await page.goto(`/auth/verify-email?token=${token}`);
    await expect(page.getByTestId("verify-success")).toBeVisible();

    const u = await getPrisma().user.findUnique({ where: { email } });
    expect(u?.emailVerifiedAt).not.toBeNull();

    // Reset flag for the rest of the suite so cross-test side effects
    // are minimised.
    await setConfigForTest("auth.requireEmailVerification", false);
  });

  test("login rejects a bad password with a friendly message", async ({ page }) => {
    const email = uniqueEmail("login-bad");
    await seedUser({
      email,
      password: "Pa55word!",
      displayName: "U",
      emailVerified: true,
    });

    await page.goto("/auth/login");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill("WrongPassword1");
    await page.getByTestId("submit-login").click();

    await expect(page.getByTestId("form-error")).toContainText("邮箱或密码不对");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("login with correct credentials, then logout, can no longer access /app", async ({
    page,
  }) => {
    const email = uniqueEmail("login-good");
    const password = "Pa55word!";
    await seedUser({
      email,
      password,
      displayName: "Good",
      emailVerified: true,
    });

    await page.goto("/auth/login");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill(password);
    await page.getByTestId("submit-login").click();
    await page.waitForURL(/\/app$/);
    await expect(page.getByTestId("app-greeting")).toContainText("Good");

    // Logout lives on /app/me in the sketch UI
    await page.goto("/app/me");
    await page.getByTestId("logout-button").click();
    await page.waitForURL((u) => !u.pathname.startsWith("/app"));

    await page.goto("/app");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
