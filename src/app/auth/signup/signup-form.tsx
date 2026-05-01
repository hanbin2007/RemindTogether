"use client";

import { useActionState, useEffect, useState } from "react";
import { SketchField } from "@/components/sketch/field";
import { SketchNotice } from "@/components/sketch/notice";
import { signupAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

export function SignupForm({ inviteToken }: { inviteToken: string | null }) {
  const [state, action, pending] = useActionState(signupAction, initialState);
  const [tz, setTz] = useState("");

  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    } catch {
      setTz("UTC");
    }
  }, []);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="timezone" value={tz} />
      {inviteToken ? (
        <input type="hidden" name="inviteToken" value={inviteToken} />
      ) : null}

      <SketchField
        label="显示名"
        name="displayName"
        autoComplete="nickname"
        required
        error={state.fieldErrors?.displayName}
        testid="field-displayName"
      />
      <SketchField
        label="邮箱"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
        testid="field-email"
      />
      <SketchField
        label="密码"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="至少 8 位，包含字母和数字"
        error={state.fieldErrors?.password}
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
        data-testid="submit-signup"
        className="rt-btn rt-btn-primary w-full"
      >
        {pending ? "注册中…" : "创建账号"}
      </button>
    </form>
  );
}
