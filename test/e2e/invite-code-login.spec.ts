import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./helpers/db";
import { setConfigForTest, seedUser, seedInvite } from "./helpers/seed";
import { getPrisma } from "./helpers/db";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "Login invite-code form requires local dev DB");

test.describe("登录页 · 邀请码入口 @local", () => {
  test.beforeAll(async () => {
    await setConfigForTest("auth.requireEmailVerification", false);
  });

  test("登录页默认收起，点击展开后能看到输入框", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByTestId("invite-code-toggle")).toBeVisible();
    await expect(page.getByTestId("invite-code-input")).toHaveCount(0);
    await page.getByTestId("invite-code-toggle").click();
    await expect(page.getByTestId("invite-code-input")).toBeVisible();
  });

  test("空白输入显示错误提示，不跳转", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByTestId("invite-code-toggle").click();
    await page.getByTestId("invite-code-input").fill("xxx");
    await page.getByTestId("invite-code-submit").click();
    await expect(page.getByTestId("invite-code-error")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("贴一个有效 token，跳到 /invite/<token>", async ({ page }) => {
    // Seed a real group + invite so the destination page renders normally.
    const owner = await seedUser({
      email: uniqueEmail("invite-owner"),
      password: "Pa55word!",
      displayName: "owner",
      emailVerified: true,
    });
    const group = await getPrisma().group.create({
      data: {
        name: "邀请码测试群",
        ownerId: owner.id,
        members: { create: { userId: owner.id, role: "OWNER" } },
      },
    });
    const { token } = await seedInvite(group.id, owner.id);

    await page.goto("/auth/login");
    await page.getByTestId("invite-code-toggle").click();
    await page.getByTestId("invite-code-input").fill(token);
    await page.getByTestId("invite-code-submit").click();
    await page.waitForURL(new RegExp(`/invite/${token}`));
  });

  test("贴整段 invite URL 也行", async ({ page }) => {
    const owner = await seedUser({
      email: uniqueEmail("invite-url-owner"),
      password: "Pa55word!",
      displayName: "owner-url",
      emailVerified: true,
    });
    const group = await getPrisma().group.create({
      data: {
        name: "URL 群",
        ownerId: owner.id,
        members: { create: { userId: owner.id, role: "OWNER" } },
      },
    });
    const { token } = await seedInvite(group.id, owner.id);
    const fullUrl = `https://rt.origenclub.cn/invite/${token}`;

    await page.goto("/auth/login");
    await page.getByTestId("invite-code-toggle").click();
    await page.getByTestId("invite-code-input").fill(fullUrl);
    await page.getByTestId("invite-code-submit").click();
    await page.waitForURL(new RegExp(`/invite/${token}`));
  });
});
