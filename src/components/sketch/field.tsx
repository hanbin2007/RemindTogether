"use client";

import { useId } from "react";

interface SketchFieldProps {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
  error?: string;
  testid?: string;
}

/**
 * Form field wrapped in the sketch style. Label is handwritten, input
 * has the wobbly border-radius. Errors animate in with a soft nudge so
 * the user notices without it feeling angry.
 */
export function SketchField({
  label,
  name,
  type = "text",
  autoComplete,
  required,
  defaultValue,
  hint,
  error,
  testid,
}: SketchFieldProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block font-[family-name:var(--font-caveat)] text-[18px] font-semibold text-rt-ink leading-none"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        data-testid={testid}
        aria-invalid={error ? "true" : undefined}
        className="rt-input"
      />
      {error ? (
        <p
          data-testid={testid ? `${testid}-error` : undefined}
          className="rt-nudge font-[family-name:var(--font-kalam)] text-[13px] text-[color:var(--rt-poke)]"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="font-[family-name:var(--font-kalam)] text-[13px] text-rt-ink-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
