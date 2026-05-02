"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/ogg,audio/webm,audio/wav";
const MAX_BYTES = 10 * 1024 * 1024; // mirrors services/attachments.ts

interface Props {
  reminderId: string;
}

export function AttachmentUpload({ reminderId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(`文件超过 ${Math.round(MAX_BYTES / 1024 / 1024)}MB`);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("reminderId", reminderId);
      const r = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const msg =
          (body?.error?.message as string | undefined) ?? "上传失败";
        setError(msg);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
      // reset value so the same file can be re-picked after an error
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div data-testid="attachment-upload">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onFile}
        disabled={pending}
        data-testid="attachment-file"
        style={{ display: "none" }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="hf-btn ghost"
        data-testid="attachment-trigger"
        style={{ fontSize: 13, padding: "4px 10px" }}
      >
        {pending ? "上传中…" : "📎 添加附件"}
      </button>
      {error && (
        <div
          data-testid="attachment-error"
          className="h-meta"
          style={{ color: "var(--poke)", marginTop: 4 }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
