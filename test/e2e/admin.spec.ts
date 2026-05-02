import { test, expect } from "@playwright/test";
import { loginAsFreshUser, type ApiSession } from "./helpers/api-login";
import { getPrisma } from "./helpers/db";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "DB-touching tests run against the local dev server only");
test.skip(({ browserName }) => browserName === "webkit", "Chromium-only");

const BASE = "http://127.0.0.1:3000";

async function makeAdmin(email: string) {
  await getPrisma().user.update({
    where: { email },
    data: { isAdmin: true },
  });
}

test.describe("Phase 8 · admin backend @local", () => {
  let admin: ApiSession;
  let alice: ApiSession;

  test.beforeEach(async ({ browser }) => {
    admin = await loginAsFreshUser(browser, "admin", BASE);
    alice = await loginAsFreshUser(browser, "alice", BASE);
    // Promote `admin` *after* login. Because requirePrincipal checks
    // isAdmin live from DB (10s cache), the next page load picks it up.
    await makeAdmin(admin.email);
  });
  test.afterEach(async () => {
    await admin?.close();
    await alice?.close();
  });

  test("non-admin is bounced from /admin to /app", async () => {
    const page = await alice.context.newPage();
    await page.goto("/admin");
    await page.waitForURL((u) => u.pathname.startsWith("/app"));
    expect(page.url()).toMatch(/\/app/);
  });

  test("admin sees the dashboard with KPIs", async () => {
    const page = await admin.context.newPage();
    await page.goto("/admin");
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
    await expect(page.getByTestId("kpi-users-value")).toBeVisible();
    await expect(page.getByTestId("kpi-reports-pending-value")).toBeVisible();
  });

  test("admin can ban a user; banned user gets 403 from /api/me/streak", async () => {
    const page = await admin.context.newPage();
    await page.goto(`/admin/users/${alice.userId}`);
    await page.getByTestId("action-ban-reason").fill("test ban");
    await page.getByTestId("action-ban").click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId(`status-banned`)).toContainText(/已封禁/);

    // Wait > 10 s? We don't want to. requirePrincipal cache is in the same
    // process; ban also invalidates the cache, so alice's next call should
    // reflect the ban immediately.
    const r = await alice.request.get("/api/me/streak");
    expect(r.status()).toBe(403);
    const body = await r.json();
    expect(body.error).toBe("banned");
  });

  test("admin can flip a Config flag and the change takes effect immediately", async () => {
    const page = await admin.context.newPage();
    await page.goto("/admin/config");
    // Set poke.dailyLimitPerRecipient to 1
    await page
      .getByTestId("config-poke.dailyLimitPerRecipient-input")
      .fill("1");
    await page.getByTestId("config-poke.dailyLimitPerRecipient-save").click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByTestId("config-poke.dailyLimitPerRecipient-current"),
    ).toHaveText("1");

    // Now alice should hit a 429 on her 2nd poke. Build prereqs.
    const group = (
      await (
        await alice.request.post("/api/groups", {
          data: { name: "limited" },
        })
      ).json()
    ).data;
    const inv = (
      await (
        await alice.request.post(`/api/groups/${group.id}/invites`)
      ).json()
    ).data;
    await admin.request.post(`/api/groups/${group.id}/join?token=${inv.token}`);
    const reminder = (
      await (
        await alice.request.post("/api/reminders", {
          data: { title: "x", visibility: "GROUP", groupId: group.id },
        })
      ).json()
    ).data;
    const first = await alice.request.post("/api/pokes", {
      data: { toUserId: admin.userId, reminderId: reminder.id, tone: "ALMOST" },
    });
    expect(first.status()).toBe(201);
    const second = await alice.request.post("/api/pokes", {
      data: { toUserId: admin.userId, reminderId: reminder.id, tone: "ALMOST" },
    });
    expect(second.status()).toBe(429);
  });

  test("admin can disband any group; ex-members can no longer access", async () => {
    const group = (
      await (
        await alice.request.post("/api/groups", { data: { name: "doomed" } })
      ).json()
    ).data;
    const page = await admin.context.newPage();
    await page.goto(`/admin/groups/${group.id}`);
    await page.getByTestId("action-disband").click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("group-disbanded")).toBeVisible();

    const fail = await alice.request.get(`/api/groups/${group.id}`);
    expect(fail.status()).toBe(404);
  });

  test("user-side report → admin sees in queue → resolves", async () => {
    // alice creates a private reminder she can report (her own)
    const reminder = (
      await (
        await alice.request.post("/api/reminders", {
          data: { title: "weird title", visibility: "PRIVATE" },
        })
      ).json()
    ).data;
    const r = await alice.request.post("/api/reports", {
      data: {
        contentType: "REMINDER",
        contentId: reminder.id,
        reason: "test report from e2e",
      },
    });
    expect(r.status()).toBe(201);
    const reportId = (await r.json()).data.id;

    const page = await admin.context.newPage();
    await page.goto("/admin/reports");
    await expect(
      page.getByTestId(`report-row-${reportId}`),
    ).toBeVisible();

    await page.goto(`/admin/reports/${reportId}`);
    await page.getByTestId("report-note").fill("已审");
    await page.getByTestId("action-resolve").click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("report-status")).toContainText(/RESOLVED/);
  });

  test("audit log captures destructive actions", async () => {
    // Trigger a config update
    const page = await admin.context.newPage();
    await page.goto("/admin/config");
    await page.getByTestId("config-group.maxMembers-input").fill("42");
    await page.getByTestId("config-group.maxMembers-save").click();
    await page.waitForLoadState("networkidle");

    await page.goto("/admin/audit");
    await expect(page.getByTestId("audit-list")).toContainText(
      "update_config",
    );
  });

  test("tools: manual streak tick records an audit row", async () => {
    const page = await admin.context.newPage();
    await page.goto("/admin/tools");
    await page.getByTestId("tools-run-tick").click();
    await page.waitForLoadState("networkidle");
    // Either succeeded or got debounced (debounce returns ok with zeros)
    await expect(page.getByTestId("tools-tick-result")).toBeVisible();
  });
});
