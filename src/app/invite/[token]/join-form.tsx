"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SketchNotice } from "@/components/sketch/notice";
import { joinGroupAction, type JoinState } from "./actions";

const initial: JoinState = { ok: false };

export function JoinForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    joinGroupAction.bind(null, token),
    initial,
  );

  useEffect(() => {
    if (state.ok) {
      router.push("/app");
    }
  }, [state.ok, router]);

  return (
    <form action={action} className="space-y-2">
      {state.message && (
        <SketchNotice tone="error" testid="join-error" animate>
          {state.message}
        </SketchNotice>
      )}
      <button
        type="submit"
        disabled={pending || state.ok}
        data-testid="join-button"
        className="hf-btn primary"
        style={{ width: "100%", padding: "10px 0" }}
      >
        {state.ok ? "已加入，正在进入主页…" : pending ? "加入中…" : "加入小群"}
      </button>
    </form>
  );
}
