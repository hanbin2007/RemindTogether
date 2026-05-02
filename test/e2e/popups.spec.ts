import { test, expect } from "@playwright/test";
import { uniqueEmail, getPrisma } from "./helpers/db";
import { setConfigForTest, seedUser, seedGroupWithOwner } from "./helpers/seed";

test.describe("Popup triggers @local", () => {
  test.beforeAll(async () => {
    await setConfigForTest("auth.requireEmailVerification", false);
  });

  test("/app/private + 加 opens new-reminder popup", async ({ page }) => {
    const email = uniqueEmail("popup-r");
    await page.goto("/auth/signup");
    await page.getByTestId("field-displayName").fill("用户");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill("Pa55word!");
    await page.getByTestId("submit-signup").click();
    await page.waitForURL(/\/app$/);

    await page.goto("/app/private");
    await page.getByTestId("private-new").click();
    await expect(page.getByTestId("create-reminder-form")).toBeVisible();
  });

  test("/app/groups/[id] 加给大家的事 opens new-reminder popup", async ({
    page,
  }) => {
    const email = uniqueEmail("popup-grp-add");
    await seedUser({
      email,
      password: "Pa55word!",
      displayName: "群员",
      emailVerified: true,
    });
    const user = await getPrisma().user.findUnique({ where: { email } });
    const group = await getPrisma().group.create({
      data: {
        name: "测试小群",
        ownerId: user!.id,
        members: { create: { userId: user!.id, role: "OWNER" } },
      },
    });

    await page.goto("/auth/login");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill("Pa55word!");
    await page.getByTestId("submit-login").click();
    await page.waitForURL(/\/app$/);

    await page.goto(`/app/groups/${group.id}`);
    await page.getByTestId("group-add-cta").click();
    await expect(page.getByTestId("create-reminder-form")).toBeVisible();
  });

  test("/app/groups + 建群 opens new-group popup", async ({ page }) => {
    const email = uniqueEmail("popup-g");
    await page.goto("/auth/signup");
    await page.getByTestId("field-displayName").fill("用户");
    await page.getByTestId("field-email").fill(email);
    await page.getByTestId("field-password").fill("Pa55word!");
    await page.getByTestId("submit-signup").click();
    await page.waitForURL(/\/app$/);

    await page.goto("/app/groups");
    await page.getByTestId("groups-new").click();
    await expect(page.getByTestId("create-group-form")).toBeVisible();
  });
});
