import { test, expect } from "@playwright/test";
import { loginAsFreshUser, type ApiSession } from "./helpers/api-login";
import { getPrisma } from "./helpers/db";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "DB-touching tests run against the local dev server only");

// Realtime tests need WebSocket-friendly browsers; chromium is enough.
test.skip(({ browserName }) => browserName === "webkit", "Run on chromium only");

const BASE = "http://127.0.0.1:3000";

test.describe("Phase 4 · realtime broadcast @local", () => {
  let alice: ApiSession;
  let bob: ApiSession;

  test.beforeEach(async ({ browser }) => {
    alice = await loginAsFreshUser(browser, "rt-alice", BASE);
    bob = await loginAsFreshUser(browser, "rt-bob", BASE);
  });
  test.afterEach(async () => {
    await alice?.close();
    await bob?.close();
  });

  test("group member sees `reminder:created` in realtime when another member posts", async () => {
    // Alice creates a group, Bob joins via invite (so Bob's NEXT socket
    // connection picks up the group room membership).
    const groupRes = await alice.request.post("/api/groups", {
      data: { name: "实时小组" },
    });
    const group = (await groupRes.json()).data;

    const inviteRes = await alice.request.post(
      `/api/groups/${group.id}/invites`,
    );
    const invite = (await inviteRes.json()).data;
    await bob.request.post(
      `/api/groups/${group.id}/join?token=${invite.token}`,
    );

    // Sanity-check: Bob is a member
    const ms = await getPrisma().groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: bob.userId } },
    });
    expect(ms?.leftAt).toBeNull();

    // Bob opens the realtime debug panel — connecting the socket and
    // joining group:<id> based on current memberships.
    const bobPage = await bob.context.newPage();
    await bobPage.goto("/app/realtime");
    await expect(bobPage.getByTestId("rt-status")).toHaveAttribute(
      "data-rt-status",
      "connected",
      { timeout: 10_000 },
    );
    // Initial event count should be zero.
    await expect(bobPage.getByTestId("rt-event-count")).toHaveText(
      "received: 0",
    );

    // Alice creates a group reminder via API — this triggers
    // broadcast(group:<id>, "reminder:created", ...) on the server.
    const r = await alice.request.post("/api/reminders", {
      data: {
        title: "团跑 5km",
        visibility: "GROUP",
        groupId: group.id,
      },
    });
    expect(r.status()).toBe(201);

    // Bob's panel should pick up the event.
    await expect(
      bobPage.getByTestId("rt-row-reminder:created").first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(bobPage.getByTestId("rt-event-count")).toContainText(
      "received: 1",
    );
  });

  test("two members both see complete + claim events on the same reminder", async () => {
    const group = (
      await (
        await alice.request.post("/api/groups", {
          data: { name: "实时 2" },
        })
      ).json()
    ).data;
    const invite = (
      await (await alice.request.post(`/api/groups/${group.id}/invites`)).json()
    ).data;
    await bob.request.post(`/api/groups/${group.id}/join?token=${invite.token}`);

    // Pre-create a reminder before either side opens a panel — that way
    // both panel connections see the same baseline.
    const reminder = (
      await (
        await alice.request.post("/api/reminders", {
          data: {
            title: "讨论计划",
            visibility: "GROUP",
            groupId: group.id,
          },
        })
      ).json()
    ).data;

    const alicePage = await alice.context.newPage();
    const bobPage = await bob.context.newPage();
    await Promise.all([
      alicePage.goto("/app/realtime"),
      bobPage.goto("/app/realtime"),
    ]);
    for (const pg of [alicePage, bobPage]) {
      await expect(pg.getByTestId("rt-status")).toHaveAttribute(
        "data-rt-status",
        "connected",
        { timeout: 10_000 },
      );
    }

    // Bob claims → both should see reminder:claimed
    const claim = await bob.request.post(
      `/api/reminders/${reminder.id}/claim`,
    );
    expect(claim.status()).toBe(201);
    for (const pg of [alicePage, bobPage]) {
      await expect(
        pg.getByTestId("rt-row-reminder:claimed").first(),
      ).toBeVisible({ timeout: 10_000 });
    }

    // Bob completes → both should see reminder:completed
    const done = await bob.request.post(
      `/api/reminders/${reminder.id}/complete`,
    );
    expect(done.status()).toBe(201);
    for (const pg of [alicePage, bobPage]) {
      await expect(
        pg.getByTestId("rt-row-reminder:completed").first(),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("non-members do NOT receive the group's events", async () => {
    // Bob is NOT in alice's group. He opens the realtime panel and
    // should never see reminder:created from a group he isn't in.
    const group = (
      await (
        await alice.request.post("/api/groups", {
          data: { name: "私群" },
        })
      ).json()
    ).data;

    const bobPage = await bob.context.newPage();
    await bobPage.goto("/app/realtime");
    await expect(bobPage.getByTestId("rt-status")).toHaveAttribute(
      "data-rt-status",
      "connected",
      { timeout: 10_000 },
    );

    await alice.request.post("/api/reminders", {
      data: {
        title: "alone",
        visibility: "GROUP",
        groupId: group.id,
      },
    });

    // Wait a bit, then assert no event landed on Bob's panel
    await bobPage.waitForTimeout(1500);
    await expect(bobPage.getByTestId("rt-event-count")).toHaveText(
      "received: 0",
    );
  });
});
