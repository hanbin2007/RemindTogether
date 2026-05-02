import { Prisma, type Tag } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/principal";

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/u, "颜色需是 #RRGGBB 形式");

export const createTagInputSchema = z.object({
  name: z.string().trim().min(1).max(20, "标签最多 20 字"),
  iconName: z.string().trim().min(1).max(40),
  color: colorSchema,
});
export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const updateTagInputSchema = createTagInputSchema.partial();
export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

export async function listTags(principal: Principal): Promise<Tag[]> {
  return prisma.tag.findMany({
    where: { userId: principal.id },
    orderBy: { name: "asc" },
  });
}

export async function createTag(
  principal: Principal,
  input: CreateTagInput,
): Promise<Tag> {
  try {
    return await prisma.tag.create({
      data: { ...input, userId: principal.id },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new ConflictError("tag_name_taken", "已经有同名的标签了");
    }
    throw e;
  }
}

export async function updateTag(
  principal: Principal,
  id: string,
  input: UpdateTagInput,
): Promise<Tag> {
  if (Object.keys(input).length === 0) {
    throw new BadRequestError("empty_update", "什么都没改");
  }
  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing || existing.userId !== principal.id) {
    throw new NotFoundError("tag");
  }
  try {
    return await prisma.tag.update({ where: { id }, data: input });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new ConflictError("tag_name_taken", "已经有同名的标签了");
    }
    throw e;
  }
}

export async function deleteTag(
  principal: Principal,
  id: string,
): Promise<void> {
  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing || existing.userId !== principal.id) {
    throw new NotFoundError("tag");
  }
  await prisma.tag.delete({ where: { id } });
}
