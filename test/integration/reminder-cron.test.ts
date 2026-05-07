// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { tickReminders } from "@/services/reminder-cron";
import { createUser } from "@/services/auth/users";
import { createGroup } from "@/services/groups";
import { createReminder } from "@/services/reminders";
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

describe("reminder cron · tickReminders (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("fires REMINDER_DUE notification when an active reminder's dueAt is past", async () => {
    const u = await mk("a");
    const past = new Date(Date.now() - 60_000);
    await createReminder(p(u), {
      title: "已到点",
      visibility: "PRIVATE",
      dueAt: past,
    });
    const result = await tickReminders();
    expect(result.notified).toBe(1);
    const notifs = await prisma.notification.findMany({
      where: { userId: u.id, type: "REMINDER_DUE" },
    });
    expect(notifs.length).toBe(1);
    expect((notifs[0].payload as { kind: string }).kind).toBe("REMINDER_DUE");
  });

  it("does not fire for reminders whose dueAt is still in the future", async () => {
    const u = await mk("b");
    const future = new Date(Date.now() + 60_000);
    await createReminder(p(u), {
      title: "未来",
      visibility: "PRIVATE",
      dueAt: future,
    });
    const result = await tickReminders();
    expect(result.notified).toBe(0);
    const notifs = await prisma.notification.count({
      where: { userId: u.id, type: "REMINDER_DUE" },
    });
    expect(notifs).toBe(0);
  });

  it("dedupes: running tick twice does not double-fire for the same dueAt", async () => {
    const u = await mk("c");
    const past = new Date(Date.now() - 60_000);
    await createReminder(p(u), {
      title: "去重测试",
      visibility: "PRIVATE",
      dueAt: past,
    });
    await tickReminders();
    await tickReminders();
    const count = await prisma.notification.count({
      where: { userId: u.id, type: "REMINDER_DUE" },
    });
    expect(count).toBe(1);
  });

  it("RRULE: rolls dueAt forward and re-fires on next tick after the new dueAt", async () => {
    const u = await mk("d");
    // Round to seconds — RRULE strings carry second-precision DTSTART, so
    // rolling forward strips any ms drift; we mirror that here so the
    // expected next dueAt computes exactly.
    const t0 = new Date(Math.floor((Date.now() - 5_000) / 1000) * 1000);
    const r = await createReminder(p(u), {
      title: "每日重复",
      visibility: "PRIVATE",
      dueAt: t0,
      repeatRule: `DTSTART:${t0
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d+/, "")}\nRRULE:FREQ=DAILY`,
    });
    const tick1 = await tickReminders();
    expect(tick1.notified).toBe(1);
    expect(tick1.rolled).toBe(1);
    // dueAt rolled forward to t0 + 1 day
    const fresh = await prisma.reminder.findUniqueOrThrow({
      where: { id: r.id },
      select: { dueAt: true, lastDueNotifiedAt: true, status: true },
    });
    expect(fresh.dueAt).not.toBeNull();
    const expected = new Date(t0.getTime() + 24 * 60 * 60 * 1000);
    expect(fresh.dueAt!.getTime()).toBe(expected.getTime());
    expect(fresh.lastDueNotifiedAt!.getTime()).toBe(t0.getTime());
    expect(fresh.status).toBe("ACTIVE");

    // Fast-forward to "tomorrow already happened" by simulating with `now`.
    const future = new Date(expected.getTime() + 1_000);
    const tick2 = await tickReminders(future);
    expect(tick2.notified).toBe(1); // second occurrence fires
    const total = await prisma.notification.count({
      where: { userId: u.id, type: "REMINDER_DUE" },
    });
    expect(total).toBe(2);
  });

  it("group reminder with assignee notifies both creator and assignee", async () => {
    const owner = await mk("ow");
    const member = await mk("mb");
    const group = await createGroup(p(owner), { name: "g" });
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: member.id, role: "MEMBER" },
    });
    const past = new Date(Date.now() - 60_000);
    await createReminder(p(owner), {
      title: "分配给小美",
      visibility: "GROUP",
      groupId: group.id,
      assigneeId: member.id,
      dueAt: past,
    });
    await tickReminders();
    const ownerN = await prisma.notification.count({
      where: { userId: owner.id, type: "REMINDER_DUE" },
    });
    const memberN = await prisma.notification.count({
      where: { userId: member.id, type: "REMINDER_DUE" },
    });
    expect(ownerN).toBe(1);
    expect(memberN).toBe(1);
  });

  it("skips DONE / SKIPPED / deleted reminders even with a past dueAt", async () => {
    const u = await mk("e");
    const past = new Date(Date.now() - 60_000);
    const done = await createReminder(p(u), {
      title: "已完成",
      visibility: "PRIVATE",
      dueAt: past,
    });
    await prisma.reminder.update({
      where: { id: done.id },
      data: { status: "DONE" },
    });
    const skipped = await createReminder(p(u), {
      title: "已跳",
      visibility: "PRIVATE",
      dueAt: past,
    });
    await prisma.reminder.update({
      where: { id: skipped.id },
      data: { status: "SKIPPED" },
    });
    const deleted = await createReminder(p(u), {
      title: "已删",
      visibility: "PRIVATE",
      dueAt: past,
    });
    await prisma.reminder.update({
      where: { id: deleted.id },
      data: { isDeleted: true },
    });

    const result = await tickReminders();
    expect(result.notified).toBe(0);
  });

  it("never fires for reminders without a dueAt", async () => {
    const u = await mk("f");
    await createReminder(p(u), {
      title: "无截止",
      visibility: "PRIVATE",
    });
    const result = await tickReminders();
    expect(result.notified).toBe(0);
  });

  it("malformed RRULE: still notifies, does not roll, does not crash", async () => {
    const u = await mk("g");
    const past = new Date(Date.now() - 60_000);
    await createReminder(p(u), {
      title: "坏 RRULE",
      visibility: "PRIVATE",
      dueAt: past,
      repeatRule: "this is not a rrule",
    });
    const result = await tickReminders();
    expect(result.notified).toBe(1);
    expect(result.rolled).toBe(0);
  });
});
