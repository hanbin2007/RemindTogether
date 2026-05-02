import { test, expect } from "@playwright/test";

/**
 * API contract smoke for Phase 3 — exercise the public surface in a
 * read-only way that's safe to run against production. Anonymous users
 * must always be 401'd; the actual authenticated CRUD lives in the
 * @local API tests.
 */
test.describe("Phase 3 · API surface @smoke", () => {
  test.skip(({ browserName }) => browserName === "webkit", "API-only");

  test("anonymous /api/tags GET returns 401", async ({ request }) => {
    const res = await request.get("/api/tags");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  test("anonymous /api/groups GET returns 401", async ({ request }) => {
    const res = await request.get("/api/groups");
    expect(res.status()).toBe(401);
  });

  test("anonymous /api/reminders GET returns 401", async ({ request }) => {
    const res = await request.get("/api/reminders");
    expect(res.status()).toBe(401);
  });

  test("anonymous POST /api/reminders also 401 (auth precedes validation)", async ({
    request,
  }) => {
    const res = await request.post("/api/reminders", {
      data: { title: "should not happen", visibility: "PRIVATE" },
    });
    expect(res.status()).toBe(401);
  });

  test("anonymous fetch of a non-existent reminder returns 401, not 404", async ({
    request,
  }) => {
    const res = await request.get(
      "/api/reminders/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status()).toBe(401);
  });
});
