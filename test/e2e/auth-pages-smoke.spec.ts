import { test, expect } from "@playwright/test";

/**
 * Auth-surface render smoke. No DB writes — safe to run against prod.
 * (Full sign-up / login / verify / reset / invite journeys live in their
 * own @local specs and need a writable test database.)
 */
test.describe("Phase 2 · auth pages render @smoke", () => {
  test("/auth/signup form is visible and complete", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByTestId("signup-card")).toBeVisible();
    await expect(page.getByTestId("field-displayName")).toBeVisible();
    await expect(page.getByTestId("field-email")).toBeVisible();
    await expect(page.getByTestId("field-password")).toBeVisible();
    await expect(page.getByTestId("submit-signup")).toBeEnabled();
    await expect(page.getByTestId("link-login")).toBeVisible();
  });

  test("/auth/login form is visible and complete", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByTestId("login-card")).toBeVisible();
    await expect(page.getByTestId("field-email")).toBeVisible();
    await expect(page.getByTestId("field-password")).toBeVisible();
    await expect(page.getByTestId("submit-login")).toBeEnabled();
    await expect(page.getByTestId("link-forgot")).toBeVisible();
    await expect(page.getByTestId("link-signup")).toBeVisible();
  });

  test("/auth/forgot form is visible", async ({ page }) => {
    await page.goto("/auth/forgot");
    await expect(page.getByTestId("forgot-card")).toBeVisible();
    await expect(page.getByTestId("field-email")).toBeVisible();
    await expect(page.getByTestId("submit-forgot")).toBeEnabled();
  });

  test("/auth/reset without token shows the missing-token notice", async ({ page }) => {
    await page.goto("/auth/reset");
    await expect(page.getByTestId("reset-card")).toBeVisible();
    await expect(page.getByTestId("reset-no-token")).toBeVisible();
  });

  test("/auth/verify-email without token shows the failure notice", async ({ page }) => {
    await page.goto("/auth/verify-email");
    await expect(page.getByTestId("verify-failure")).toBeVisible();
  });

  test("/app gates unauthenticated users to /auth/login", async ({ page }) => {
    const res = await page.goto("/app");
    // Middleware redirects with 307; we should land on /auth/login regardless
    expect(res?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByTestId("login-card")).toBeVisible();
  });

  test("/invite/[token] with a non-existent token shows invalid notice", async ({
    page,
  }) => {
    await page.goto("/invite/this-token-does-not-exist-12345");
    await expect(page.getByTestId("invite-invalid")).toBeVisible();
  });
});
