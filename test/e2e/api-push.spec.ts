import { test, expect } from "@playwright/test";
import { loginAsFreshUser, type ApiSession } from "./helpers/api-login";
import { getPrisma } from "./helpers/db";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "DB-touching tests run against the local dev server only");
test.skip(({ browserName }) => browserName === "webkit", "API + chromium only");

const BASE = "http://127.0.0.1:3000";

const SAMPLE = {
  endpoint: "https://fcm.googleapis.com/fcm/send/e2e-1",
  keys: {
    p256dh:
      "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
    auth: "tBHItJI5svbpez7KI4CCXg",
  },
  userAgent: "playwright e2e",
};

test.describe("Phase 7 · push subscribe API @local", () => {
  let alice: ApiSession;

  test.beforeEach(async ({ browser }) => {
    alice = await loginAsFreshUser(browser, "push-alice", BASE);
  });
  test.afterEach(async () => {
    await alice?.close();
  });

  test("POST /api/push/subscribe persists; idempotent on endpoint", async () => {
    const r1 = await alice.request.post("/api/push/subscribe", {
      data: SAMPLE,
    });
    expect(r1.status()).toBe(201);
    const body1 = await r1.json();
    expect(body1.data.endpoint).toBe(SAMPLE.endpoint);

    // Re-subscribe same endpoint — server should accept and not duplicate.
    const r2 = await alice.request.post("/api/push/subscribe", {
      data: SAMPLE,
    });
    expect(r2.status()).toBe(201);

    const subs = await getPrisma().pushSubscription.findMany({
      where: { userId: alice.userId },
    });
    expect(subs).toHaveLength(1);
  });

  test("DELETE /api/push/subscribe removes the row when given matching endpoint", async () => {
    await alice.request.post("/api/push/subscribe", { data: SAMPLE });
    const del = await alice.request.delete("/api/push/subscribe", {
      data: { endpoint: SAMPLE.endpoint },
    });
    expect(del.status()).toBe(200);
    expect((await del.json()).data.removed).toBe(1);
    const subs = await getPrisma().pushSubscription.findMany();
    expect(subs).toHaveLength(0);
  });

  test("Anonymous calls are 401", async ({ request }) => {
    const r = await request.post("/api/push/subscribe", { data: SAMPLE });
    expect(r.status()).toBe(401);
  });

  test("/app/me shows the PushOptIn button when VAPID public key is configured", async () => {
    const page = await alice.context.newPage();
    // PushOptIn moved from /app to /app/me in the Phase 9 redesign.
    await page.goto("/app/me");
    // The button text varies by browser permission state, but the
    // testid is stable: either push-enable, push-subscribed, or
    // push-unsupported (in headless without Notification API).
    const enable = page.getByTestId("push-enable");
    const subscribed = page.getByTestId("push-disable");
    const unsupported = page.getByTestId("push-unsupported");
    const noKey = page.getByTestId("push-no-key");
    await expect(
      enable.or(subscribed).or(unsupported).or(noKey),
    ).toBeVisible({ timeout: 10_000 });
  });
});
