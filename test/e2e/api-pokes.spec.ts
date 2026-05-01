import { test, expect } from "@playwright/test";
import { loginAsFreshUser, type ApiSession } from "./helpers/api-login";
import { getPrisma } from "./helpers/db";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "DB-touching tests run against the local dev server only");

// Realtime + API checks; chromium is enough.
test.skip(({ browserName }) => browserName === "webkit", "API-only");

const BASE = "http://127.0.0.1:3000";

async function setupTwoInGroupWithReminder(
  alice: ApiSession,
  bob: ApiSession,
) {
  const group = (
    await (
      await alice.request.post("/api/groups", {
        data: { name: "戳戳群" },
      })
    ).json()
  ).data;
  const inv = (
    await (await alice.request.post(`/api/groups/${group.id}/invites`)).json()
  ).data;
  await bob.request.post(`/api/groups/${group.id}/join?token=${inv.token}`);
  const reminder = (
    await (
      await alice.request.post("/api/reminders", {
        data: {
          title: "拍我一下",
          visibility: "GROUP",
          groupId: group.id,
        },
      })
    ).json()
  ).data;
  return { group, reminder };
}

test.describe("Phase 5 · pokes API @local", () => {
  let alice: ApiSession;
  let bob: ApiSession;

  test.beforeEach(async ({ browser }) => {
    alice = await loginAsFreshUser(browser, "poke-alice", BASE);
    bob = await loginAsFreshUser(browser, "poke-bob", BASE);
  });
  test.afterEach(async () => {
    await alice?.close();
    await bob?.close();
  });

  test("linked poke is delivered in realtime to the recipient", async () => {
    const { reminder } = await setupTwoInGroupWithReminder(alice, bob);

    // Bob opens the realtime panel before alice pokes.
    const bobPage = await bob.context.newPage();
    await bobPage.goto("/app/realtime");
    await expect(bobPage.getByTestId("rt-status")).toHaveAttribute(
      "data-rt-status",
      "connected",
      { timeout: 10_000 },
    );

    const res = await alice.request.post("/api/pokes", {
      data: {
        toUserId: bob.userId,
        reminderId: reminder.id,
        tone: "ALMOST",
        message: "差一点点",
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.data.poke.fromId).toBe(alice.userId);
    expect(body.data.poke.toId).toBe(bob.userId);
    expect(body.data.quota.remaining).toBe(2);

    await expect(
      bobPage.getByTestId("rt-row-poke:received").first(),
    ).toBeVisible({ timeout: 10_000 });
    // Notification:new also rides along.
    await expect(
      bobPage.getByTestId("rt-row-notification:new").first(),
    ).toBeVisible();
  });

  test("4th poke to the same recipient returns 429", async () => {
    const { reminder } = await setupTwoInGroupWithReminder(alice, bob);
    for (let i = 0; i < 3; i++) {
      const r = await alice.request.post("/api/pokes", {
        data: {
          toUserId: bob.userId,
          reminderId: reminder.id,
          tone: "ALMOST",
        },
      });
      expect(r.status()).toBe(201);
    }
    const fourth = await alice.request.post("/api/pokes", {
      data: {
        toUserId: bob.userId,
        reminderId: reminder.id,
        tone: "THINKING",
      },
    });
    expect(fourth.status()).toBe(429);
    const body = await fourth.json();
    expect(body.error).toBe("poke_quota_exceeded");
  });

  test("self-poke is 400; unlinked poke is 400 by default", async () => {
    const self = await alice.request.post("/api/pokes", {
      data: { toUserId: alice.userId, tone: "THINKING" },
    });
    expect(self.status()).toBe(400);

    const unlinked = await alice.request.post("/api/pokes", {
      data: { toUserId: bob.userId, tone: "THINKING" },
    });
    expect(unlinked.status()).toBe(400);
  });

  test("/api/pokes/quota returns the live counts", async () => {
    const { reminder } = await setupTwoInGroupWithReminder(alice, bob);
    const empty = await alice.request.get(
      `/api/pokes/quota?to_user_id=${bob.userId}`,
    );
    expect(empty.status()).toBe(200);
    expect((await empty.json()).data).toMatchObject({
      used: 0,
      remaining: 3,
      limit: 3,
    });

    await alice.request.post("/api/pokes", {
      data: {
        toUserId: bob.userId,
        reminderId: reminder.id,
        tone: "ALMOST",
      },
    });

    const after = await alice.request.get(
      `/api/pokes/quota?to_user_id=${bob.userId}`,
    );
    expect((await after.json()).data).toMatchObject({
      used: 1,
      remaining: 2,
    });
  });

  test("inbox lists received pokes; mark-read flips readAt", async () => {
    const { reminder } = await setupTwoInGroupWithReminder(alice, bob);
    const sent = (
      await (
        await alice.request.post("/api/pokes", {
          data: {
            toUserId: bob.userId,
            reminderId: reminder.id,
            tone: "ALMOST",
            message: "hi",
          },
        })
      ).json()
    ).data;

    const inbox = await bob.request.get("/api/pokes/inbox");
    expect(inbox.status()).toBe(200);
    const items = (await inbox.json()).data;
    expect(items.map((p: { id: string }) => p.id)).toContain(sent.poke.id);

    const markRead = await bob.request.patch(
      `/api/pokes/${sent.poke.id}/read`,
    );
    expect(markRead.status()).toBe(200);
    expect((await markRead.json()).data.readAt).not.toBeNull();

    // Sender can't mark another user's poke as read
    const trespass = await alice.request.patch(
      `/api/pokes/${sent.poke.id}/read`,
    );
    expect(trespass.status()).toBe(403);

    // unreadOnly filter excludes the now-read poke
    const unreadList = await bob.request.get(
      "/api/pokes/inbox?unreadOnly=true",
    );
    const unread = (await unreadList.json()).data;
    expect(unread.map((p: { id: string }) => p.id)).not.toContain(
      sent.poke.id,
    );
  });

  test("Notification row is created alongside the poke", async () => {
    const { reminder } = await setupTwoInGroupWithReminder(alice, bob);
    await alice.request.post("/api/pokes", {
      data: {
        toUserId: bob.userId,
        reminderId: reminder.id,
        tone: "ALMOST",
      },
    });
    const notif = await getPrisma().notification.findFirstOrThrow({
      where: { userId: bob.userId, type: "POKE_RECEIVED" },
    });
    expect((notif.payload as Record<string, unknown>).reminderId).toBe(
      reminder.id,
    );
  });
});
