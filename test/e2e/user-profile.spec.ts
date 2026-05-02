import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./helpers/db";
import { setConfigForTest } from "./helpers/seed";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "User profile page requires local dev DB");

async function signupViaUI(
  page: import("@playwright/test").Page,
  opts: { email: string; password: string; displayName: string },
) {
  await page.goto("/auth/signup");
  await page.getByTestId("field-displayName").fill(opts.displayName);
  await page.getByTestId("field-email").fill(opts.email);
  await page.getByTestId("field-password").fill(opts.password);
  await page.getByTestId("submit-signup").click();
  await page.waitForURL(/\/app$/);
}

test.describe("人物档案页 · /app/users/[id] @local", () => {
  test.beforeAll(async () => {
    await setConfigForTest("auth.requireEmailVerification", false);
  });

  test("group 内成员通过搜索点开档案页，看到共同群", async ({ browser }) => {
    const aEmail = uniqueEmail("up-a");
    const bEmail = uniqueEmail("up-b");

    const aCtx = await browser.newContext();
    const aPage = await aCtx.newPage();
    await signupViaUI(aPage, {
      email: aEmail,
      password: "Pa55word!",
      displayName: "Alice寻寻",
    });

    const g = await aPage.request.post("/api/groups", {
      data: { name: "搜人群" },
    });
    const groupId = (await g.json()).data.id;
    const inv = await aPage.request.post(`/api/groups/${groupId}/invites`);
    const token = (await inv.json()).data.token;

    const bCtx = await browser.newContext();
    const bPage = await bCtx.newPage();
    await signupViaUI(bPage, {
      email: bEmail,
      password: "Pa55word!",
      displayName: "Bob顶顶",
    });
    const aliceId = await aPage.evaluate(async () => {
      const r = await fetch("/api/me/profile");
      const j = await r.json();
      return j.data?.id ?? null;
    });

    await bPage.request.post(
      `/api/groups/${groupId}/join?token=${encodeURIComponent(token)}`,
    );

    // Search Alice from B's side.
    await bPage.goto(`/app/search?q=${encodeURIComponent("Alice寻寻")}`);
    const personHit = bPage.getByTestId(`search-result-person-${aliceId}`);
    await expect(personHit).toBeVisible();
    await personHit.click();
    await expect(bPage).toHaveURL(new RegExp(`/app/users/${aliceId}`));
    await expect(bPage.getByTestId("user-profile-name")).toContainText(
      "Alice寻寻",
    );
    await expect(
      bPage.getByTestId(`user-profile-group-${groupId}`),
    ).toContainText("搜人群");

    await aCtx.close();
    await bCtx.close();
  });

  test("陌生人档案页 → 404", async ({ browser }) => {
    const cEmail = uniqueEmail("up-c");
    const dEmail = uniqueEmail("up-d");

    const cCtx = await browser.newContext();
    const cPage = await cCtx.newPage();
    await signupViaUI(cPage, {
      email: cEmail,
      password: "Pa55word!",
      displayName: "C",
    });

    const dCtx = await browser.newContext();
    const dPage = await dCtx.newPage();
    await signupViaUI(dPage, {
      email: dEmail,
      password: "Pa55word!",
      displayName: "D",
    });
    const dId = await dPage.evaluate(async () => {
      const r = await fetch("/api/me/profile");
      const j = await r.json();
      return j.data?.id ?? null;
    });

    // C visits D directly — they share nothing → 404.
    const resp = await cPage.goto(`/app/users/${dId}`);
    expect(resp?.status()).toBe(404);

    await cCtx.close();
    await dCtx.close();
  });

  test("访问自己 → 跳到 /app/me", async ({ page }) => {
    const email = uniqueEmail("up-self");
    await signupViaUI(page, {
      email,
      password: "Pa55word!",
      displayName: "Selfy",
    });
    const myId = await page.evaluate(async () => {
      const r = await fetch("/api/me/profile");
      const j = await r.json();
      return j.data?.id ?? null;
    });
    await page.goto(`/app/users/${myId}`);
    await page.waitForURL(/\/app\/me/);
  });
});
