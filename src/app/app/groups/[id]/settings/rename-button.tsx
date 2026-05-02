"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * "改名" ghost button from the cover row (HfL2GroupSettings line 510).
 * Inline edit in a prompt — keeps the surface tiny + design-faithful.
 */
export function RenameButton({
  groupId,
  currentName,
}: {
  groupId: string;
  currentName: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const onRename = () => {
    const next = window.prompt("新名字", currentName);
    if (!next || next.trim() === "" || next === currentName) return;
    start(async () => {
      const r = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: next.trim() }),
      });
      if (!r.ok) {
        setErr("改名失败");
        return;
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      className="hf-btn ghost"
      style={{ padding: "4px 10px", fontSize: 12 }}
      onClick={onRename}
      disabled={pending}
      data-testid="settings-rename"
    >
      {pending ? "改…" : err ?? "改名"}
    </button>
  );
}
