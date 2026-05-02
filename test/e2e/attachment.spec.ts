import { test, expect } from "@playwright/test";
import { uniqueEmail, getPrisma } from "./helpers/db";
import { setConfigForTest } from "./helpers/seed";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "Attachment upload tests require local dev DB");

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

// Tiny valid PNG (1x1 transparent) — same bytes the integration test uses.
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

test.describe("附件上传 UI · reminder 详情页 @local", () => {
  test.beforeAll(async () => {
    await setConfigForTest("auth.requireEmailVerification", false);
  });

  test("creator 上传 PNG 附件，列表里能看到", async ({ page }) => {
    const email = uniqueEmail("att-creator");
    await signupViaUI(page, {
      email,
      password: "Pa55word!",
      displayName: "上传者",
    });
    const remResp = await page.request.post("/api/reminders", {
      data: { title: "带图任务", visibility: "PRIVATE" },
    });
    const reminderId = (await remResp.json()).data.id;
    await page.goto(`/app/reminders/${reminderId}`);

    await expect(page.getByTestId("attachment-trigger")).toBeVisible();
    await page.getByTestId("attachment-file").setInputFiles({
      name: "tiny.png",
      mimeType: "image/png",
      buffer: PNG_BYTES,
    });

    // After upload, the list rerenders with the new attachment.
    await expect(page.getByTestId("attachment-list")).toBeVisible({
      timeout: 10_000,
    });
    const items = page.locator('[data-testid^="attachment-"]:not([data-testid$="-trigger"]):not([data-testid$="-file"]):not([data-testid$="-error"]):not([data-testid="attachment-list"]):not([data-testid="attachment-upload"])');
    await expect(items.first()).toBeVisible();

    // DB row exists
    const rows = await getPrisma().attachment.findMany({
      where: { reminderId },
    });
    expect(rows.length).toBe(1);
    expect(rows[0].mimeType).toBe("image/png");
  });

  test("非 creator 群成员看不到上传按钮", async ({ browser }) => {
    const ownerEmail = uniqueEmail("att-owner");
    const memberEmail = uniqueEmail("att-member");

    const ownerCtx = await browser.newContext();
    const ownerPage = await ownerCtx.newPage();
    await signupViaUI(ownerPage, {
      email: ownerEmail,
      password: "Pa55word!",
      displayName: "OwnerAtt",
    });
    const g = await ownerPage.request.post("/api/groups", {
      data: { name: "附件群" },
    });
    const groupId = (await g.json()).data.id;
    const r = await ownerPage.request.post("/api/reminders", {
      data: { title: "团事", visibility: "GROUP", groupId },
    });
    const reminderId = (await r.json()).data.id;
    const inv = await ownerPage.request.post(
      `/api/groups/${groupId}/invites`,
    );
    const token = (await inv.json()).data.token;

    const memberCtx = await browser.newContext();
    const memberPage = await memberCtx.newPage();
    await signupViaUI(memberPage, {
      email: memberEmail,
      password: "Pa55word!",
      displayName: "MemberAtt",
    });
    await memberPage.request.post(
      `/api/groups/${groupId}/join?token=${encodeURIComponent(token)}`,
    );

    await memberPage.goto(`/app/reminders/${reminderId}`);
    await expect(memberPage.getByTestId("reminder-title")).toContainText(
      "团事",
    );
    // Member is not creator — uploader hidden.
    await expect(memberPage.getByTestId("attachment-trigger")).toHaveCount(0);

    await ownerCtx.close();
    await memberCtx.close();
  });

  test("不允许的 MIME 上传 → 显示错误，不入库", async ({ page }) => {
    const email = uniqueEmail("att-bad");
    await signupViaUI(page, {
      email,
      password: "Pa55word!",
      displayName: "Bad",
    });
    const r = await page.request.post("/api/reminders", {
      data: { title: "坏文件", visibility: "PRIVATE" },
    });
    const reminderId = (await r.json()).data.id;
    await page.goto(`/app/reminders/${reminderId}`);

    await page.getByTestId("attachment-file").setInputFiles({
      name: "evil.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not allowed"),
    });
    await expect(page.getByTestId("attachment-error")).toBeVisible();
    const rows = await getPrisma().attachment.findMany({
      where: { reminderId },
    });
    expect(rows.length).toBe(0);
  });
});
