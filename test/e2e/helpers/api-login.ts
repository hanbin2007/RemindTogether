import type { Browser, BrowserContext, APIRequestContext } from "@playwright/test";
import { seedUser } from "./seed";
import { uniqueEmail } from "./db";

export interface ApiSession {
  email: string;
  password: string;
  displayName: string;
  userId: string;
  context: BrowserContext;
  request: APIRequestContext;
  baseURL: string;
  close: () => Promise<void>;
}

/**
 * Provision a user directly in the DB (so signup form/copy + verification
 * flag don't matter), then log them in through the live form so the
 * resulting BrowserContext carries a valid session cookie. The `request`
 * field is a fully authenticated APIRequestContext for the test to drive.
 */
export async function loginAsFreshUser(
  browser: Browser,
  prefix: string,
  baseURL: string,
): Promise<ApiSession> {
  const email = uniqueEmail(prefix);
  const password = "Pa55word!";
  const displayName = prefix;
  const user = await seedUser({
    email,
    password,
    displayName,
    emailVerified: true,
  });

  const context = await browser.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  await page.goto("/auth/login");
  await page.getByTestId("field-email").fill(email);
  await page.getByTestId("field-password").fill(password);
  await page.getByTestId("submit-login").click();
  await page.waitForURL(/\/app$/);
  await page.close();

  return {
    email,
    password,
    displayName,
    userId: user.id,
    context,
    request: context.request,
    baseURL,
    close: () => context.close(),
  };
}
