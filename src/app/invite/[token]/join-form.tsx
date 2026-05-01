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
    <form action={action} className="space-y-4">
      {state.message && (
        <SketchNotice tone="error" testid="join-error" animate>
          {state.message}
        </SketchNotice>
      )}
      <button
        type="submit"
        disabled={pending || state.ok}
        data-testid="join-button"
        className="rt-btn rt-btn-primary w-full"
      >
        {state.ok ? "已加入，正在进入主页…" : pending ? "加入中…" : "加入这个群"}
      </button>
    </form>
  );
}
