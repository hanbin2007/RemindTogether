// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  createTag,
  createTagInputSchema,
  deleteTag,
  listTags,
  updateTag,
} from "@/services/tags";
import { ConflictError, NotFoundError, BadRequestError } from "@/lib/api/errors";
import { createUser } from "@/services/auth/users";
import type { Principal } from "@/lib/auth/guards";
import { resetDb, prisma } from "./setup-db";

function asPrincipal(u: {
  id: string;
  email: string;
  isAdmin: boolean;
}): Principal {
  return {
    id: u.id,
    email: u.email,
    isAdmin: u.isAdmin,
    emailIsVerified: true,
  };
}

describe("tag service (integration)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("createTag persists scoped to the principal", async () => {
    const u = await createUser({
      email: "tag@example.com",
      password: "AaBbCc11",
      displayName: "T",
    });
    const tag = await createTag(asPrincipal(u), {
      name: "学习",
      iconName: "book",
      color: "#3366cc",
    });
    expect(tag.userId).toBe(u.id);
    expect(tag.name).toBe("学习");
  });

  it("rejects invalid hex colors via Zod", () => {
    expect(
      createTagInputSchema.safeParse({
        name: "x",
        iconName: "y",
        color: "red",
      }).success,
    ).toBe(false);
    expect(
      createTagInputSchema.safeParse({
        name: "x",
        iconName: "y",
        color: "#abc",
      }).success,
    ).toBe(false);
    expect(
      createTagInputSchema.safeParse({
        name: "x",
        iconName: "y",
        color: "#aabbcc",
      }).success,
    ).toBe(true);
  });

  it("conflicts on duplicate name within the same user", async () => {
    const u = await createUser({
      email: "tag2@example.com",
      password: "AaBbCc11",
      displayName: "T",
    });
    await createTag(asPrincipal(u), {
      name: "健身",
      iconName: "dumbbell",
      color: "#cc0000",
    });
    await expect(
      createTag(asPrincipal(u), {
        name: "健身",
        iconName: "x",
        color: "#000000",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("listTags only returns the principal's own tags", async () => {
    const a = await createUser({
      email: "ta@example.com",
      password: "AaBbCc11",
      displayName: "A",
    });
    const b = await createUser({
      email: "tb@example.com",
      password: "AaBbCc11",
      displayName: "B",
    });
    await createTag(asPrincipal(a), {
      name: "a-tag",
      iconName: "x",
      color: "#111111",
    });
    await createTag(asPrincipal(b), {
      name: "b-tag",
      iconName: "x",
      color: "#222222",
    });
    const aTags = await listTags(asPrincipal(a));
    expect(aTags.map((t) => t.name)).toEqual(["a-tag"]);
    const bTags = await listTags(asPrincipal(b));
    expect(bTags.map((t) => t.name)).toEqual(["b-tag"]);
  });

  it("updateTag — only owner can patch; otherwise 404", async () => {
    const a = await createUser({
      email: "ua@example.com",
      password: "AaBbCc11",
      displayName: "A",
    });
    const b = await createUser({
      email: "ub@example.com",
      password: "AaBbCc11",
      displayName: "B",
    });
    const aTag = await createTag(asPrincipal(a), {
      name: "n1",
      iconName: "i",
      color: "#aaaaaa",
    });
    const updated = await updateTag(asPrincipal(a), aTag.id, {
      color: "#bbbbbb",
    });
    expect(updated.color).toBe("#bbbbbb");

    await expect(
      updateTag(asPrincipal(b), aTag.id, { color: "#cccccc" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updateTag — empty body is a 400", async () => {
    const u = await createUser({
      email: "uu@example.com",
      password: "AaBbCc11",
      displayName: "U",
    });
    const tag = await createTag(asPrincipal(u), {
      name: "x",
      iconName: "i",
      color: "#aaaaaa",
    });
    await expect(updateTag(asPrincipal(u), tag.id, {})).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it("deleteTag — only owner can delete; otherwise 404", async () => {
    const a = await createUser({
      email: "da@example.com",
      password: "AaBbCc11",
      displayName: "A",
    });
    const b = await createUser({
      email: "db@example.com",
      password: "AaBbCc11",
      displayName: "B",
    });
    const aTag = await createTag(asPrincipal(a), {
      name: "x",
      iconName: "i",
      color: "#aaaaaa",
    });
    await expect(
      deleteTag(asPrincipal(b), aTag.id),
    ).rejects.toBeInstanceOf(NotFoundError);
    await deleteTag(asPrincipal(a), aTag.id);
    expect(await prisma.tag.findUnique({ where: { id: aTag.id } })).toBeNull();
  });
});
