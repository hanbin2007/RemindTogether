"use client";

import { useActionState } from "react";
import { SketchField } from "@/components/sketch/field";
import { SketchNotice } from "@/components/sketch/notice";
import { forgotAction, type ForgotState } from "./actions";

const initialState: ForgotState = { ok: false };

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <SketchField
        label="邮箱"
        name="email"
        type="email"
        autoComplete="email"
        required
        testid="field-email"
      />

      {state.message && (
        state.ok ? (
          <SketchNotice tone="success" testid="forgot-success" animate>
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
        disabled={pending}
        data-testid="submit-forgot"
        className="rt-btn rt-btn-primary w-full"
      >
        {pending ? "发送中…" : "发送重设链接"}
      </button>
    </form>
  );
}
