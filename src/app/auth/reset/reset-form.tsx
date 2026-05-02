"use client";

import { useActionState } from "react";
import { SketchField } from "@/components/sketch/field";
import { SketchNotice } from "@/components/sketch/notice";
import { resetAction, type ResetState } from "./actions";

const initialState: ResetState = { ok: false };

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <SketchField
        label="新密码"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        hint="至少 8 位，包含字母和数字"
        error={state.fieldErrors?.newPassword}
        testid="field-newPassword"
      />

      {state.message && (
        state.ok ? (
          <SketchNotice tone="success" testid="reset-success" animate>
            {state.message}
          </SketchNotice>
        ) : (
          <SketchNotice tone="error" testid="form-error" animate>
            {state.message}
          </SketchNotice>
        )
      )}

      <button
        type="submit"
        disabled={pending || state.ok}
        data-testid="submit-reset"
        className="rt-btn rt-btn-primary w-full"
      >
        {pending ? "保存中…" : state.ok ? "已完成 ✓" : "保存新密码"}
      </button>
    </form>
  );
}
