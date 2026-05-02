import { test, expect } from "@playwright/test";

test.describe("Phase 7 · PWA static assets @smoke", () => {
  test.skip(({ browserName }) => browserName === "webkit", "Run on chromium");

  test("/manifest.webmanifest is served with the correct content-type", async ({
    request,
  }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] ?? "";
    // Next.js serves .webmanifest as application/manifest+json by default
    expect(/manifest\+json|json/.test(ct)).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("RemindTogether");
    expect(body.start_url).toBe("/app");
    expect(Array.isArray(body.icons)).toBe(true);
    expect(body.icons.length).toBeGreaterThan(0);
  });

  test("/sw.js is served and looks like a service worker", async ({
    request,
  }) => {
    const res = await request.get("/sw.js");
    expect(res.status()).toBe(200);
    const txt = await res.text();
    expect(txt).toMatch(/self\.addEventListener\(["']push["']/);
    expect(txt).toMatch(/self\.addEventListener\(["']notificationclick["']/);
  });

  test("/icons/icon.svg is served", async ({ request }) => {
    const res = await request.get("/icons/icon.svg");
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] ?? "";
    expect(ct).toMatch(/svg/);
  });

  test("home page links to the manifest in the document head", async ({
    page,
  }) => {
    await page.goto("/");
    const href = await page
      .locator('link[rel="manifest"]')
      .getAttribute("href");
    expect(href).toMatch(/manifest\.webmanifest/);
  });
});
