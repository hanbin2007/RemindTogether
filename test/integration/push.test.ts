// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  __mockWebPush,
  __restoreWebPush,
  sendPush,
  subscribe,
  unsubscribe,
} from "@/services/push";
import { createUser } from "@/services/auth/users";
import type { Principal } from "@/lib/auth/guards";
import { resetDb, prisma } from "./setup-db";

function p(u: { id: string; email: string }): Principal {
  return { id: u.id, email: u.email, isAdmin: false, emailIsVerified: true };
}

async function mk(name: string) {
  return createUser({
    email: `${name}@example.com`,
    password: "Pa55word!",
    displayName: name,
  });
}

const SAMPLE = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc-1",
  keys: {
    p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
    auth: "tBHItJI5svbpez7KI4CCXg",
  },
  userAgent: "Mozilla/5.0 e2e",
};

describe("push service (integration)", () => {
  beforeEach(async () => {
    await resetDb();
    __restoreWebPush();
  });
  afterEach(() => {
    __restoreWebPush();
  });

  it("subscribe creates a row scoped to the principal", async () => {
    const u = await mk("u");
    const sub = await subscribe(p(u), SAMPLE);
    expect(sub.userId).toBe(u.id);
    expect(sub.endpoint).toBe(SAMPLE.endpoint);
    expect(sub.userAgent).toBe(SAMPLE.userAgent);
    const count = await prisma.pushSubscription.count();
    expect(count).toBe(1);
  });

  it("subscribe is idempotent on endpoint and re-targets the row to the latest user", async () => {
    const u1 = await mk("u1");
    const u2 = await mk("u2");
    await subscribe(p(u1), SAMPLE);
    await subscribe(p(u2), SAMPLE);
    const subs = await prisma.pushSubscription.findMany();
    expect(subs).toHaveLength(1);
    expect(subs[0].userId).toBe(u2.id);
  });

  it("unsubscribe only removes the principal's own row", async () => {
    const u1 = await mk("u1");
    const u2 = await mk("u2");
    await subscribe(p(u1), SAMPLE);
    const r1 = await unsubscribe(p(u2), { endpoint: SAMPLE.endpoint });
    expect(r1.removed).toBe(0); // not theirs
    const r2 = await unsubscribe(p(u1), { endpoint: SAMPLE.endpoint });
    expect(r2.removed).toBe(1);
    expect(await prisma.pushSubscription.count()).toBe(0);
  });

  describe("sendPush", () => {
    it("calls web-push for every subscription of the user and prunes 410 endpoints", async () => {
      const u = await mk("u");
      await subscribe(p(u), SAMPLE);
      await subscribe(p(u), {
        ...SAMPLE,
        endpoint: SAMPLE.endpoint + "-2",
      });

      const calls: string[] = [];
      __mockWebPush(async (sub: { endpoint: string }, _body?: string) => {
        calls.push(sub.endpoint);
        if (sub.endpoint.endsWith("-2")) {
          // simulate Gone
          const err = new Error("gone") as Error & { statusCode: number };
          err.statusCode = 410;
          throw err;
        }
        return { statusCode: 201 };
      });

      const r = await sendPush(u.id, {
        title: "想到你了",
        body: "差一点点",
        url: "/app",
      });
      expect(calls.sort()).toEqual([SAMPLE.endpoint, SAMPLE.endpoint + "-2"].sort());
      expect(r.sent).toBe(1);
      expect(r.pruned).toBe(1);
      const remaining = await prisma.pushSubscription.findMany();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].endpoint).toBe(SAMPLE.endpoint);
    });

    it("transient errors are logged but do NOT prune the subscription", async () => {
      const u = await mk("u");
      await subscribe(p(u), SAMPLE);
      __mockWebPush(async () => {
        const err = new Error("transient") as Error & { statusCode: number };
        err.statusCode = 500;
        throw err;
      });
      const r = await sendPush(u.id, { title: "x", body: "y" });
      expect(r.sent).toBe(0);
      expect(r.pruned).toBe(0);
      expect(await prisma.pushSubscription.count()).toBe(1);
    });

    it("no subscriptions → noop with sent=0", async () => {
      const u = await mk("u");
      const r = await sendPush(u.id, { title: "x", body: "y" });
      expect(r).toEqual({ sent: 0, pruned: 0 });
    });
  });
});
