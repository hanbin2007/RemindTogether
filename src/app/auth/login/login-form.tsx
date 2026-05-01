"use client";

import { useActionState } from "react";
import { SketchField } from "@/components/sketch/field";
import { SketchNotice } from "@/components/sketch/notice";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { ok: false };

export function LoginForm({ redirectTo }: { redirectTo: string | null }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="space-y-4">
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      <SketchField
        label="邮箱"
        name="email"
        type="email"
        autoComplete="email"
        required
        testid="field-email"
      />
      <SketchField
        label="密码"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        testid="field-password"
      />

      {state.message && !state.ok && (
        <SketchNotice tone="error" testid="form-error" animate>
          {state.message}
        </SketchNotice>
      )}

      <button
        type="submit"
        disabled={pending}
        data-testid="submit-login"
        className="rt-btn rt-btn-primary w-full"
      >
        {pending ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
