interface NoticeProps {
  tone: "success" | "warn" | "error" | "info";
  children: React.ReactNode;
  testid?: string;
  animate?: boolean;
}

/**
 * Toast/alert in sketch style. Uses the paper colour family so it sits
 * inside an rt-box without clashing.
 */
export function SketchNotice({ tone, children, testid, animate }: NoticeProps) {
  const palette: Record<NoticeProps["tone"], string> = {
    success:
      "border-[color:var(--rt-done)] bg-[color:var(--rt-done-soft,#e6f3e6)] text-[color:var(--rt-done)]",
    warn:
      "border-[color:var(--rt-highlight)] bg-[color:var(--rt-highlight)] text-rt-ink",
    error:
      "border-[color:var(--rt-poke)] bg-[color:var(--rt-poke-soft,#f7e3df)] text-[color:var(--rt-poke)]",
    info: "border-rt-ink bg-rt-paper-2 text-rt-ink",
  };
  return (
    <div
      data-testid={testid}
      className={[
        "rt-box-tight border px-4 py-3 font-[family-name:var(--font-kalam)] text-sm leading-snug",
        palette[tone],
        animate ? "rt-nudge" : "",
      ].join(" ")}
      style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
    >
      {children}
    </div>
  );
}
