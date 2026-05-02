import { test, expect } from "@playwright/test";
import { loginAsFreshUser, type ApiSession } from "./helpers/api-login";
import { getPrisma } from "./helpers/db";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "DB-touching tests run against the local dev server only");
test.skip(({ browserName }) => browserName === "webkit", "API + chromium only");

const BASE = "http://127.0.0.1:3000";

test.describe("Phase 6 · streak API @local", () => {
  let alice: ApiSession;

  test.beforeEach(async ({ browser }) => {
    alice = await loginAsFreshUser(browser, "streak-alice", BASE);
  });
  test.afterEach(async () => {
    await alice?.close();
  });

  test("fresh account: GET /api/me/streak returns 0/PENDING", async () => {
    const res = await alice.request.get("/api/me/streak");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.current).toBe(0);
    expect(body.data.longest).toBe(0);
    expect(body.data.shieldCards).toBe(0);
    expect(body.data.todayStatus).toBe("PENDING");
  });

  test("complete a private reminder → streak 1, todayStatus DONE", async () => {
    const r = await alice.request.post("/api/reminders", {
      data: { title: "完成我", visibility: "PRIVATE" },
    });
    const reminder = (await r.json()).data;
    const c = await alice.request.post(
      `/api/reminders/${reminder.id}/complete`,
    );
    expect(c.status()).toBe(201);

    const status = (
      await (await alice.request.get("/api/me/streak")).json()
    ).data;
    expect(status.current).toBe(1);
    expect(status.todayStatus).toBe("DONE");
  });

  test("skip-today inserts SKIPPED; subsequent streak shows SKIPPED today", async () => {
    const skip = await alice.request.post("/api/me/skip-today");
    expect(skip.status()).toBe(201);
    expect((await skip.json()).data.status).toBe("SKIPPED");

    const status = (
      await (await alice.request.get("/api/me/streak")).json()
    ).data;
    expect(status.todayStatus).toBe("SKIPPED");
  });

  test("skip-today is rejected once a completion has been made today", async () => {
    const r = await alice.request.post("/api/reminders", {
      data: { title: "x", visibility: "PRIVATE" },
    });
    const reminder = (await r.json()).data;
    await alice.request.post(`/api/reminders/${reminder.id}/complete`);

    const skip = await alice.request.post("/api/me/skip-today");
    expect(skip.status()).toBe(400);
    const body = await skip.json();
    expect(body.error).toBe("already_done_today");
  });

  test("streak:milestone is broadcast when the 7th day completes", async () => {
    // Pre-seed 6 prior DONE days for alice via Prisma so the next
    // completion lands on day 7.
    const today = new Date();
    for (let i = 6; i >= 1; i--) {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() - i);
      const iso = day.toISOString().slice(0, 10);
      await getPrisma().streakDay.create({
        data: {
          userId: alice.userId,
          date: new Date(`${iso}T00:00:00Z`),
          status: "DONE",
        },
      });
    }

    // Open the realtime panel BEFORE the completion so the WS is up.
    const page = await alice.context.newPage();
    await page.goto("/app/realtime");
    await expect(page.getByTestId("rt-status")).toHaveAttribute(
      "data-rt-status",
      "connected",
      { timeout: 10_000 },
    );

    const r = await alice.request.post("/api/reminders", {
      data: { title: "day 7", visibility: "PRIVATE" },
    });
    const reminder = (await r.json()).data;
    const c = await alice.request.post(
      `/api/reminders/${reminder.id}/complete`,
    );
    expect(c.status()).toBe(201);

    await expect(
      page.getByTestId("rt-row-streak:milestone").first(),
    ).toBeVisible({ timeout: 10_000 });

    // Confirm via API that we land at 7
    const status = (
      await (await alice.request.get("/api/me/streak")).json()
    ).data;
    expect(status.current).toBe(7);
  });

  test("anonymous calls are 401", async ({ request }) => {
    const a = await request.get("/api/me/streak");
    expect(a.status()).toBe(401);
    const b = await request.post("/api/me/skip-today");
    expect(b.status()).toBe(401);
  });
});
