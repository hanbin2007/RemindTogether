/**
 * Local-disk attachment store. Phase 11 will swap for S3 — keep the
 * service interface stable so the route doesn't change.
 *
 * Layout:
 *   ATTACHMENTS_DIR/yyyy-mm/<uuid>.<ext>
 *
 * The DB stores the relative URL `/uploads/yyyy-mm/<uuid>.<ext>` so a
 * static file route (or nginx alias) can serve it.
 */
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Principal } from "@/lib/auth/principal";
import { BadRequestError } from "@/lib/api/errors";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/ogg",
  "audio/webm",
  "audio/wav",
]);

const STORAGE_ROOT =
  process.env.ATTACHMENTS_DIR ||
  join(process.cwd(), "public", "uploads");
const PUBLIC_PREFIX = "/uploads";

function extFor(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "audio/mpeg":
      return "mp3";
    case "audio/ogg":
      return "ogg";
    case "audio/webm":
      return "weba";
    case "audio/wav":
      return "wav";
    default:
      return "bin";
  }
}

export interface CreateAttachmentInput {
  buffer: Buffer;
  mimeType: string;
  reminderId?: string;
  completionId?: string;
}

export async function createAttachment(
  principal: Principal,
  input: CreateAttachmentInput,
) {
  if (input.buffer.length > MAX_BYTES) {
    throw new BadRequestError(
      "file_too_large",
      `文件超过 ${Math.round(MAX_BYTES / 1024 / 1024)}MB`,
    );
  }
  if (!ALLOWED.has(input.mimeType)) {
    throw new BadRequestError("mime_not_allowed", "暂不支持这种文件");
  }
  if (!input.reminderId && !input.completionId) {
    throw new BadRequestError(
      "no_owner_target",
      "上传需要绑定到提醒或完成记录",
    );
  }

  // Verify caller can write to the target.
  if (input.reminderId) {
    const r = await prisma.reminder.findUnique({
      where: { id: input.reminderId },
      select: { creatorId: true, isDeleted: true },
    });
    if (!r || r.isDeleted || r.creatorId !== principal.id) {
      throw new BadRequestError("invalid_reminder", "这条提醒不属于你");
    }
  }
  if (input.completionId) {
    const c = await prisma.completion.findUnique({
      where: { id: input.completionId },
      select: { userId: true },
    });
    if (!c || c.userId !== principal.id) {
      throw new BadRequestError("invalid_completion", "这条完成不属于你");
    }
  }

  // Disk write: yyyy-mm bucket directory.
  const id = randomUUID();
  const ext = extFor(input.mimeType);
  const now = new Date();
  const bucket = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const dir = join(STORAGE_ROOT, bucket);
  await mkdir(dir, { recursive: true });
  const fileName = `${id}.${ext}`;
  await writeFile(join(dir, fileName), input.buffer);
  const url = `${PUBLIC_PREFIX}/${bucket}/${fileName}`;

  // DB row.
  const data: Prisma.AttachmentCreateInput = {
    id,
    url,
    mimeType: input.mimeType,
    bytes: input.buffer.length,
    owner: { connect: { id: principal.id } },
    ...(input.reminderId
      ? { reminder: { connect: { id: input.reminderId } } }
      : {}),
    ...(input.completionId
      ? { completion: { connect: { id: input.completionId } } }
      : {}),
  };
  const row = await prisma.attachment.create({ data });

  // If this attachment goes to a Completion, also patch the legacy
  // `mediaUrl` shortcut on Completion (the column predates Attachment).
  if (input.completionId && /^image\//.test(input.mimeType)) {
    await prisma.completion
      .update({
        where: { id: input.completionId },
        data: { mediaUrl: url },
      })
      .catch(() => {
        /* ignore — Completion.mediaUrl is a convenience cache */
      });
  }
  return row;
}
