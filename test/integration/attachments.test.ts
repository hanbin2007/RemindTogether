// @vitest-environment node
import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createUser } from "@/services/auth/users";
import { createGroup } from "@/services/groups";
import { createReminder } from "@/services/reminders";
import { BadRequestError } from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/guards";
import { resetDb, prisma } from "./setup-db";

let tempDir: string;
const originalEnv = process.env.ATTACHMENTS_DIR;

beforeAll(() => {
  tempDir = mkdtempSync(join(tmpdir(), "rt-attachments-test-"));
  process.env.ATTACHMENTS_DIR = tempDir;
});
afterAll(() => {
  process.env.ATTACHMENTS_DIR = originalEnv;
  rmSync(tempDir, { recursive: true, force: true });
});

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

// IMPORTANT: import the service AFTER setting env so STORAGE_ROOT picks it up.
async function loadService() {
  const m = await import("@/services/attachments");
  return m;
}

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

describe("attachment service (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creator uploads a PNG to their own reminder", async () => {
    const { createAttachment } = await loadService();
    const u = await mk("a");
    const r = await createReminder(p(u), {
      title: "x",
      visibility: "PRIVATE",
    });
    const att = await createAttachment(p(u), {
      buffer: PNG_BYTES,
      mimeType: "image/png",
      reminderId: r.id,
    });
    expect(att.mimeType).toBe("image/png");
    expect(att.bytes).toBe(PNG_BYTES.length);
    expect(att.url).toMatch(/^\/uploads\/\d{4}-\d{2}\/[a-f0-9-]+\.png$/);
    expect(att.reminderId).toBe(r.id);
    expect(att.ownerId).toBe(u.id);

    // Disk has the bytes.
    const onDisk = join(
      tempDir,
      att.url.replace(/^\/uploads\//, ""),
    );
    expect(existsSync(onDisk)).toBe(true);
    expect(readFileSync(onDisk).equals(PNG_BYTES)).toBe(true);
  });

  it("rejects unsupported MIME types", async () => {
    const { createAttachment } = await loadService();
    const u = await mk("b");
    const r = await createReminder(p(u), {
      title: "x",
      visibility: "PRIVATE",
    });
    await expect(
      createAttachment(p(u), {
        buffer: Buffer.from("hello"),
        mimeType: "text/plain",
        reminderId: r.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects files over 10MB", async () => {
    const { createAttachment } = await loadService();
    const u = await mk("c");
    const r = await createReminder(p(u), {
      title: "x",
      visibility: "PRIVATE",
    });
    const tooBig = Buffer.alloc(10 * 1024 * 1024 + 1);
    await expect(
      createAttachment(p(u), {
        buffer: tooBig,
        mimeType: "image/png",
        reminderId: r.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects when neither reminderId nor completionId given", async () => {
    const { createAttachment } = await loadService();
    const u = await mk("d");
    await expect(
      createAttachment(p(u), {
        buffer: PNG_BYTES,
        mimeType: "image/png",
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects upload to another user's reminder", async () => {
    const { createAttachment } = await loadService();
    const owner = await mk("owner-att");
    const stranger = await mk("stranger-att");
    const r = await createReminder(p(owner), {
      title: "x",
      visibility: "PRIVATE",
    });
    await expect(
      createAttachment(p(stranger), {
        buffer: PNG_BYTES,
        mimeType: "image/png",
        reminderId: r.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects upload to a deleted reminder", async () => {
    const { createAttachment } = await loadService();
    const u = await mk("e");
    const r = await createReminder(p(u), {
      title: "x",
      visibility: "PRIVATE",
    });
    await prisma.reminder.update({
      where: { id: r.id },
      data: { isDeleted: true },
    });
    await expect(
      createAttachment(p(u), {
        buffer: PNG_BYTES,
        mimeType: "image/png",
        reminderId: r.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("group reminder: only the creator can attach, even members can't", async () => {
    const { createAttachment } = await loadService();
    const owner = await mk("owner-g");
    const member = await mk("member-g");
    const group = await createGroup(p(owner), { name: "g" });
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: member.id, role: "MEMBER" },
    });
    const r = await createReminder(p(owner), {
      title: "团内事",
      visibility: "GROUP",
      groupId: group.id,
    });
    // Member can't attach: createAttachment guards on creator only.
    await expect(
      createAttachment(p(member), {
        buffer: PNG_BYTES,
        mimeType: "image/png",
        reminderId: r.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
    // Creator can.
    const ok = await createAttachment(p(owner), {
      buffer: PNG_BYTES,
      mimeType: "image/png",
      reminderId: r.id,
    });
    expect(ok.reminderId).toBe(r.id);
  });
});
