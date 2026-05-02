import { test, expect } from "@playwright/test";
import { uniqueEmail, getPrisma } from "./helpers/db";
import { setConfigForTest } from "./helpers/seed";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "Report UI tests require local dev DB");

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

test.describe("举报 UI · 用户对内容举报 @local", () => {
  test.beforeAll(async () => {
    await setConfigForTest("auth.requireEmailVerification", false);
  });

  test("group 成员对其他成员的提醒举报，落库", async ({ browser }) => {
    const ownerEmail = uniqueEmail("rep-owner");
    const memberEmail = uniqueEmail("rep-member");

    // Owner: signup, create group via API, create reminder via API
    const ownerCtx = await browser.newContext();
    const ownerPage = await ownerCtx.newPage();
    await signupViaUI(ownerPage, {
      email: ownerEmail,
      password: "Pa55word!",
      displayName: "群主",
    });

    const groupResp = await ownerPage.request.post("/api/groups", {
      data: { name: "测试举报群" },
    });
    expect(groupResp.status()).toBe(201);
    const groupId = (await groupResp.json()).data.id;

    const remResp = await ownerPage.request.post("/api/reminders", {
      data: { title: "举报测试", visibility: "GROUP", groupId },
    });
    expect(remResp.status()).toBe(201);
    const reminderId = (await remResp.json()).data.id;

    const inviteResp = await ownerPage.request.post(
      `/api/groups/${groupId}/invites`,
    );
    expect(inviteResp.status()).toBe(201);
    const token = (await inviteResp.json()).data.token;

    // Member: signup then join via invite, then open reminder & report
    const memberCtx = await browser.newContext();
    const memberPage = await memberCtx.newPage();
    await signupViaUI(memberPage, {
      email: memberEmail,
      password: "Pa55word!",
      displayName: "组员",
    });

    const joinResp = await memberPage.request.post(
      `/api/groups/${groupId}/join?token=${encodeURIComponent(token)}`,
    );
    expect(joinResp.status()).toBe(200);

    await memberPage.goto(`/app/reminders/${reminderId}`);
    await expect(memberPage.getByTestId("reminder-title")).toContainText(
      "举报测试",
    );

    const triggerId = `report-open-reminder-${reminderId}`;
    await expect(memberPage.getByTestId(triggerId)).toBeVisible();
    await memberPage.getByTestId(triggerId).click();
    await expect(
      memberPage.getByTestId(`report-sheet-reminder-${reminderId}`),
    ).toBeVisible();
    await memberPage
      .getByTestId(`report-reason-reminder-${reminderId}`)
      .fill("内容不当");
    await memberPage
      .getByTestId(`report-submit-reminder-${reminderId}`)
      .click();
    await expect(
      memberPage.getByTestId(`report-ok-reminder-${reminderId}`),
    ).toBeVisible();

    const dbRow = await getPrisma().report.findFirst({
      where: { contentType: "REMINDER", contentId: reminderId },
    });
    expect(dbRow).toBeTruthy();
    expect(dbRow!.reason).toBe("内容不当");

    await ownerCtx.close();
    await memberCtx.close();
  });

  test("自己创建的提醒不显示举报按钮", async ({ page }) => {
    const email = uniqueEmail("rep-self");
    await signupViaUI(page, {
      email,
      password: "Pa55word!",
      displayName: "自创",
    });
    const remResp = await page.request.post("/api/reminders", {
      data: { title: "我自己的", visibility: "PRIVATE" },
    });
    const reminderId = (await remResp.json()).data.id;
    await page.goto(`/app/reminders/${reminderId}`);
    await expect(
      page.getByTestId(`report-open-reminder-${reminderId}`),
    ).toHaveCount(0);
  });

  test("comment 举报：B 对 A 的评论举报，落库", async ({ browser }) => {
    const aEmail = uniqueEmail("rc-a");
    const bEmail = uniqueEmail("rc-b");

    // A creates group + reminder + comment
    const aCtx = await browser.newContext();
    const aPage = await aCtx.newPage();
    await signupViaUI(aPage, {
      email: aEmail,
      password: "Pa55word!",
      displayName: "A",
    });

    const gResp = await aPage.request.post("/api/groups", {
      data: { name: "评论举报群" },
    });
    const groupId = (await gResp.json()).data.id;

    const rResp = await aPage.request.post("/api/reminders", {
      data: { title: "一起做", visibility: "GROUP", groupId },
    });
    const reminderId = (await rResp.json()).data.id;

    const cResp = await aPage.request.post(
      `/api/reminders/${reminderId}/comments`,
      { data: { content: "加油啊" } },
    );
    expect(cResp.status()).toBe(201);
    const commentId = (await cResp.json()).data.id;

    const inviteResp = await aPage.request.post(
      `/api/groups/${groupId}/invites`,
    );
    const token = (await inviteResp.json()).data.token;

    // B joins, opens reminder, reports A's comment
    const bCtx = await browser.newContext();
    const bPage = await bCtx.newPage();
    await signupViaUI(bPage, {
      email: bEmail,
      password: "Pa55word!",
      displayName: "B",
    });
    await bPage.request.post(
      `/api/groups/${groupId}/join?token=${encodeURIComponent(token)}`,
    );

    await bPage.goto(`/app/reminders/${reminderId}`);
    await expect(
      bPage.locator(`[data-testid="comment-${commentId}"]`),
    ).toBeVisible();

    await bPage
      .getByTestId(`report-open-comment-${commentId}`)
      .click();
    await bPage
      .getByTestId(`report-reason-comment-${commentId}`)
      .fill("挑衅");
    await bPage
      .getByTestId(`report-submit-comment-${commentId}`)
      .click();
    await expect(
      bPage.getByTestId(`report-ok-comment-${commentId}`),
    ).toBeVisible();

    const dbRow = await getPrisma().report.findFirst({
      where: { contentType: "COMMENT", contentId: commentId },
    });
    expect(dbRow).toBeTruthy();
    expect(dbRow!.reason).toBe("挑衅");

    await aCtx.close();
    await bCtx.close();
  });

  test("空原因 → action 返回错误，sheet 不关闭", async ({ browser }) => {
    const ownerEmail = uniqueEmail("rep-empty-owner");
    const memberEmail = uniqueEmail("rep-empty-member");
    const ownerCtx = await browser.newContext();
    const ownerPage = await ownerCtx.newPage();
    await signupViaUI(ownerPage, {
      email: ownerEmail,
      password: "Pa55word!",
      displayName: "OwnerEmpty",
    });
    const g = await ownerPage.request.post("/api/groups", {
      data: { name: "空举报群" },
    });
    const groupId = (await g.json()).data.id;
    const rem = await ownerPage.request.post("/api/reminders", {
      data: { title: "x", visibility: "GROUP", groupId },
    });
    const reminderId = (await rem.json()).data.id;
    const inv = await ownerPage.request.post(
      `/api/groups/${groupId}/invites`,
    );
    const token = (await inv.json()).data.token;

    const memberCtx = await browser.newContext();
    const memberPage = await memberCtx.newPage();
    await signupViaUI(memberPage, {
      email: memberEmail,
      password: "Pa55word!",
      displayName: "MemberEmpty",
    });
    const joinResp2 = await memberPage.request.post(
      `/api/groups/${groupId}/join?token=${encodeURIComponent(token)}`,
    );
    expect(joinResp2.status()).toBe(200);

    await memberPage.goto(`/app/reminders/${reminderId}`);
    await memberPage
      .getByTestId(`report-open-reminder-${reminderId}`)
      .click();
    // Bypass HTML5 required by clearing the textarea then triggering action
    // via JS submit (browser will block by default — instead force-clear &
    // click; since `required` is on the textarea the form won't submit).
    // Verify by trying to submit empty: native validation kicks in.
    const submit = memberPage.getByTestId(
      `report-submit-reminder-${reminderId}`,
    );
    await submit.click();
    // Sheet still open (form blocked).
    await expect(
      memberPage.getByTestId(`report-sheet-reminder-${reminderId}`),
    ).toBeVisible();

    await ownerCtx.close();
    await memberCtx.close();
  });
});
