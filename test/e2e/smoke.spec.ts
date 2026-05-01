import { test, expect } from "@playwright/test";

test.describe("Phase 1 smoke @smoke", () => {
  test("homepage renders the project hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("hero-tagline")).toContainText(/REMIND/);
    await expect(page.getByTestId("hero-title")).toContainText("鼓励");
    await expect(page.getByTestId("hero-title")).toContainText("而非催促");
    await expect(page.getByTestId("hero-subtitle")).toContainText("互相打气");
    await expect(page.getByTestId("cta-signup")).toBeVisible();
    await expect(page.getByTestId("cta-login")).toBeVisible();
    await expect(page).toHaveTitle(/RemindTogether/);
  });

  test("/api/health returns ok JSON", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBe(true);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("remindtogether");
    expect(typeof body.time).toBe("string");
  });

  test("Socket.io endpoint responds (handshake reachable)", async ({
    request,
  }) => {
    // GET on the engine.io polling endpoint should yield a 200 with an
    // open packet (`0{"sid":...}`) — confirming the Socket.io server is
    // mounted on the same Node process as the Next.js handler.
    const res = await request.get("/socket.io/?EIO=4&transport=polling");
    expect(res.status()).toBe(200);
    const body = await res.text();
    // Engine.io v4 "open" packet starts with '0' followed by JSON.
    expect(body.startsWith("0")).toBe(true);
    const json = JSON.parse(body.slice(1));
    expect(typeof json.sid).toBe("string");
    expect(json.sid.length).toBeGreaterThan(0);
    expect(json.upgrades).toContain("websocket");
  });
});
