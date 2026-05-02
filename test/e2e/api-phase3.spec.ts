import { test, expect } from "@playwright/test";
import { loginAsFreshUser, type ApiSession } from "./helpers/api-login";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "DB-touching tests run against the local dev server only");

// We only need one browser project for these API-level tests; the API
// layer doesn't differ across UA. Skip mobile-safari project to keep
// runtime lean.
test.skip(({ browserName }) => browserName === "webkit", "API-only tests");

const BASE = "http://127.0.0.1:3000";

test.describe("Phase 3 · CRUD APIs @local", () => {
  let alice: ApiSession;
  let bob: ApiSession;

  test.beforeEach(async ({ browser }) => {
    alice = await loginAsFreshUser(browser, "alice", BASE);
    bob = await loginAsFreshUser(browser, "bob", BASE);
  });
  test.afterEach(async () => {
    await alice?.close();
    await bob?.close();
  });

  test("private reminder is not visible to other users", async () => {
    const create = await alice.request.post("/api/reminders", {
      data: {
        title: "alice 私人",
        visibility: "PRIVATE",
      },
    });
    expect(create.status()).toBe(201);
    const aliceR = (await create.json()).data;

    // Bob's private list does not contain alice's private reminder
    const bobPriv = await bob.request.get("/api/reminders?scope=private");
    expect(bobPriv.status()).toBe(200);
    const bobList = (await bobPriv.json()).data;
    expect(bobList.find((r: { id: string }) => r.id === aliceR.id)).toBeUndefined();

    // Bob fetching it directly is 403
    const direct = await bob.request.get(`/api/reminders/${aliceR.id}`);
    expect(direct.status()).toBe(403);
  });

  test("group flow: invite → join → group reminder visible to both → claim flow", async () => {
    // alice creates a group
    const groupRes = await alice.request.post("/api/groups", {
      data: { name: "晨跑小分队", coverEmoji: "🏃" },
    });
    expect(groupRes.status()).toBe(201);
    const group = (await groupRes.json()).data;

    // alice issues an invite
    const inviteRes = await alice.request.post(
      `/api/groups/${group.id}/invites`,
    );
    expect(inviteRes.status()).toBe(201);
    const invite = (await inviteRes.json()).data;

    // bob joins via the token
    const joinRes = await bob.request.post(
      `/api/groups/${group.id}/join?token=${invite.token}`,
    );
    expect(joinRes.status()).toBe(200);

    // bob now sees the group in his groups list
    const bobGroups = await bob.request.get("/api/groups");
    const bobGroupIds = (await bobGroups.json()).data.map(
      (g: { id: string }) => g.id,
    );
    expect(bobGroupIds).toContain(group.id);

    // alice creates a group reminder; bob can see it
    const r = await alice.request.post("/api/reminders", {
      data: {
        title: "团跑 5k",
        visibility: "GROUP",
        groupId: group.id,
      },
    });
    expect(r.status()).toBe(201);
    const reminder = (await r.json()).data;

    const bobScope = await bob.request.get(
      `/api/reminders?scope=group:${group.id}`,
    );
    expect(bobScope.status()).toBe(200);
    const bobReminders = (await bobScope.json()).data;
    expect(bobReminders.map((r: { id: string }) => r.id)).toContain(
      reminder.id,
    );

    // bob claims the reminder
    const claim = await bob.request.post(
      `/api/reminders/${reminder.id}/claim`,
    );
    expect(claim.status()).toBe(201);

    // alice fetching the reminder sees the claim
    const detail = await alice.request.get(`/api/reminders/${reminder.id}`);
    const detailBody = (await detail.json()).data;
    expect(detailBody.claims).toHaveLength(1);
    expect(detailBody.claims[0].user.id).toBe(bob.userId);

    // bob completes it; alice sees status DONE on next fetch
    const complete = await bob.request.post(
      `/api/reminders/${reminder.id}/complete`,
      { data: { note: "搞定" } },
    );
    expect(complete.status()).toBe(201);
    const after = await alice.request.get(`/api/reminders/${reminder.id}`);
    expect((await after.json()).data.status).toBe("DONE");
  });

  test("non-members cannot read or write a group's reminders", async () => {
    const groupRes = await alice.request.post("/api/groups", {
      data: { name: "私群" },
    });
    const group = (await groupRes.json()).data;
    const r = await alice.request.post("/api/reminders", {
      data: { title: "alone", visibility: "GROUP", groupId: group.id },
    });
    const reminder = (await r.json()).data;

    expect(
      (await bob.request.get(`/api/reminders/${reminder.id}`)).status(),
    ).toBe(403);
    expect(
      (await bob.request.get(`/api/reminders?scope=group:${group.id}`)).status(),
    ).toBe(403);
    expect(
      (
        await bob.request.post(`/api/reminders/${reminder.id}/claim`)
      ).status(),
    ).toBe(403);
  });

  test("comments and reactions: members can post, idempotent reactions", async () => {
    const groupRes = await alice.request.post("/api/groups", {
      data: { name: "聊天" },
    });
    const group = (await groupRes.json()).data;
    const inv = (
      await (await alice.request.post(`/api/groups/${group.id}/invites`)).json()
    ).data;
    await bob.request.post(`/api/groups/${group.id}/join?token=${inv.token}`);

    const r = (
      await (
        await alice.request.post("/api/reminders", {
          data: { title: "讨论", visibility: "GROUP", groupId: group.id },
        })
      ).json()
    ).data;

    const c = await bob.request.post(`/api/reminders/${r.id}/comments`, {
      data: { content: "支持" },
    });
    expect(c.status()).toBe(201);

    const re1 = await bob.request.post(`/api/reminders/${r.id}/reactions`, {
      data: { emoji: "👍" },
    });
    expect(re1.status()).toBe(201);
    const re1Body = (await re1.json()).data;
    const re2 = await bob.request.post(`/api/reminders/${r.id}/reactions`, {
      data: { emoji: "👍" },
    });
    expect(re2.status()).toBe(201);
    const re2Body = (await re2.json()).data;
    expect(re2Body.id).toBe(re1Body.id); // idempotent
  });

  test("update + soft delete + tags", async () => {
    // alice creates a tag, then a reminder using it
    const tagRes = await alice.request.post("/api/tags", {
      data: { name: "学习", iconName: "book", color: "#3366cc" },
    });
    expect(tagRes.status()).toBe(201);
    const tag = (await tagRes.json()).data;

    const r = (
      await (
        await alice.request.post("/api/reminders", {
          data: {
            title: "看书",
            visibility: "PRIVATE",
            tagIds: [tag.id],
          },
        })
      ).json()
    ).data;

    expect(r.tags.map((t: { tag: { id: string } }) => t.tag.id)).toEqual([
      tag.id,
    ]);

    // patch title
    const patch = await alice.request.patch(`/api/reminders/${r.id}`, {
      data: { title: "深读 1 小时" },
    });
    expect(patch.status()).toBe(200);
    expect((await patch.json()).data.title).toBe("深读 1 小时");

    // delete soft
    const del = await alice.request.delete(`/api/reminders/${r.id}`);
    expect(del.status()).toBe(200);
    const after = await alice.request.get(`/api/reminders/${r.id}`);
    expect(after.status()).toBe(404);
  });

  test("validation errors come back as 422 with zod issues", async () => {
    const bad = await alice.request.post("/api/reminders", {
      data: { title: "", visibility: "PRIVATE" },
    });
    expect(bad.status()).toBe(422);
    const body = await bad.json();
    expect(body.error).toBe("validation");
    expect(Array.isArray(body.issues)).toBe(true);
  });

  test("/api/tags surface: list / create / patch / delete + per-user isolation", async () => {
    const aTag = (
      await (
        await alice.request.post("/api/tags", {
          data: { name: "alice-tag", iconName: "x", color: "#abcdef" },
        })
      ).json()
    ).data;
    const bTag = (
      await (
        await bob.request.post("/api/tags", {
          data: { name: "bob-tag", iconName: "y", color: "#fedcba" },
        })
      ).json()
    ).data;

    const aliceList = (await (await alice.request.get("/api/tags")).json())
      .data;
    expect(aliceList.map((t: { id: string }) => t.id)).toEqual([aTag.id]);

    // bob can't update alice's tag
    const cross = await bob.request.patch(`/api/tags/${aTag.id}`, {
      data: { color: "#000000" },
    });
    expect(cross.status()).toBe(404);

    // alice can patch + delete her own
    const patched = await alice.request.patch(`/api/tags/${aTag.id}`, {
      data: { color: "#111111" },
    });
    expect(patched.status()).toBe(200);
    const del = await alice.request.delete(`/api/tags/${aTag.id}`);
    expect(del.status()).toBe(200);

    // bob's tag is unaffected
    const bobList = (await (await bob.request.get("/api/tags")).json()).data;
    expect(bobList.map((t: { id: string }) => t.id)).toEqual([bTag.id]);
  });

  test("groups: owner can disband; members cannot", async () => {
    const g = (
      await (
        await alice.request.post("/api/groups", { data: { name: "短命群" } })
      ).json()
    ).data;
    const inv = (
      await (await alice.request.post(`/api/groups/${g.id}/invites`)).json()
    ).data;
    await bob.request.post(`/api/groups/${g.id}/join?token=${inv.token}`);

    const bobDel = await bob.request.delete(`/api/groups/${g.id}`);
    expect(bobDel.status()).toBe(403);

    const aliceDel = await alice.request.delete(`/api/groups/${g.id}`);
    expect(aliceDel.status()).toBe(200);

    // After disband, neither user sees the group anymore
    const aliceGroups = (await (await alice.request.get("/api/groups")).json())
      .data;
    expect(aliceGroups.map((g: { id: string }) => g.id)).not.toContain(g.id);
  });
});
