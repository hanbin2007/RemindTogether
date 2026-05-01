import { test, expect } from "@playwright/test";
import { getPrisma, uniqueEmail } from "./helpers/db";
import { seedGroupWithOwner, seedInvite, seedUser } from "./helpers/seed";

const isExternal = !!process.env.E2E_BASE_URL;
test.skip(isExternal, "DB-touching tests run against the local dev server only");

async function makeOwnerAndGroup(name = "晨跑小分队") {
  const { owner, group } = await seedGroupWithOwner(name);
  const invite = await seedInvite(group.id, owner.id);
  return { owner, group, invite };
}

test.describe("Phase 2 · group invite @local", () => {
  test("logged-out user clicks invite → signs up → automatically joins", async ({
    page,
  }) => {
    const { group, invite } = await makeOwnerAndGroup();

    await page.goto(`/invite/${invite.token}`);
    await expect(page.getByTestId("invite-anon-title")).toContainText(group.name);
    await expect(page.getByTestId("invite-signup-link")).toBeVisible();

    await page.getByTestId("invite-signup-link").click();
    await expect(page).toHaveURL(/\/auth\/signup/);
    await expect(page.getByTestId("invite-banner")).toContainText(group.name);

    const newbieEmail = uniqueEmail("newbie");
    await page.getByTestId("field-displayName").fill("Newbie");
    await page.getByTestId("field-email").fill(newbieEmail);
    await page.getByTestId("field-password").fill("NewbiePa55!");
    await page.getByTestId("submit-signup").click();
    await page.waitForURL(/\/app$/);
    await expect(page.getByTestId("app-greeting")).toContainText("Newbie");

    const newbie = await getPrisma().user.findUnique({ where: { email: newbieEmail } });
    expect(newbie).not.toBeNull();
    const member = await getPrisma().groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: newbie!.id } },
    });
    expect(member?.role).toBe("MEMBER");
    const tokenAfter = await getPrisma().inviteToken.findUnique({
      where: { token: invite.token },
    });
    expect(tokenAfter?.usedAt).not.toBeNull();
    expect(tokenAfter?.usedByUserId).toBe(newbie!.id);
  });

  test("logged-in user clicks invite → confirm → joins → lands in /app", async ({
    page,
  }) => {
    const { group, invite } = await makeOwnerAndGroup("读书会");

    const memberEmail = uniqueEmail("member");
    const memberPwd = "MemberPa55!";
    const member = await seedUser({
      email: memberEmail,
      password: memberPwd,
      displayName: "Member",
      emailVerified: true,
    });

    await page.goto("/auth/login");
    await page.getByTestId("field-email").fill(memberEmail);
    await page.getByTestId("field-password").fill(memberPwd);
    await page.getByTestId("submit-login").click();
    await page.waitForURL(/\/app$/);

    await page.goto(`/invite/${invite.token}`);
    await expect(page.getByTestId("invite-loggedin-title")).toContainText(
      group.name,
    );
    await page.getByTestId("join-button").click();

    await page.waitForURL(/\/app$/);
    const ms = await getPrisma().groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: member.id } },
    });
    expect(ms?.role).toBe("MEMBER");
  });

  test("expired invite shows a stale notice", async ({ page }) => {
    const { invite } = await makeOwnerAndGroup();
    await getPrisma().inviteToken.update({
      where: { token: invite.token },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await page.goto(`/invite/${invite.token}`);
    await expect(page.getByTestId("invite-stale")).toBeVisible();
  });
});
