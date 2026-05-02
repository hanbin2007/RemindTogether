/**
 * Hand-drawn letter avatar — one warm pastel cycled per index, ink stroke,
 * Caveat letter init. Mirrors design/project/hf-shared.jsx `<Av>` /
 * `<AvStack>`. Cap intentionally small (7 colors) so the same person ends
 * up consistent across the app: pass `i={hashOfId % 7}`.
 */
import type { CSSProperties, ReactNode } from "react";

const BG = [
  "var(--rt-av-0)",
  "var(--rt-av-1)",
  "var(--rt-av-2)",
  "var(--rt-av-3)",
  "var(--rt-av-4)",
  "var(--rt-av-5)",
  "var(--rt-av-6)",
];

interface Props {
  name?: string | null;
  size?: number;
  /** Color slot 0-6. Pass a deterministic hash for stable color per user. */
  i?: number;
  /** Outline color (used inside AvStack for paper cut-out look). */
  ring?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Avatar({
  name,
  size = 32,
  i = 0,
  ring,
  className,
  style,
  children,
}: Props) {
  const initial = (name ?? "?").trim().slice(0, 1).toUpperCase();
  const s: CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.46),
    background: BG[i % BG.length],
    ...(ring ? { outline: `2px solid ${ring}` } : null),
    ...style,
  };
  return (
    <div className={`rt-av ${className ?? ""}`} style={s}>
      {children ?? initial}
    </div>
  );
}

interface StackProps {
  people: Array<{ name?: string | null; i?: number }>;
  max?: number;
  size?: number;
  ring?: string;
}

export function AvatarStack({
  people,
  max = 4,
  size = 26,
  ring = "var(--rt-paper)",
}: StackProps) {
  const rest = Math.max(people.length - max, 0);
  return (
    <div className="flex">
      {people.slice(0, max).map((p, idx) => (
        <div
          key={idx}
          style={{ marginLeft: idx === 0 ? 0 : -10 }}
        >
          <Avatar name={p.name} i={p.i ?? idx} size={size} ring={ring} />
        </div>
      ))}
      {rest > 0 && (
        <div
          className="rt-av"
          style={{
            width: size,
            height: size,
            fontSize: 11,
            marginLeft: -10,
            background: "var(--rt-paper)",
            color: "var(--rt-ink-soft)",
            outline: `2px solid ${ring}`,
          }}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}

/** Stable color slot for a user id — keep the same person consistent. */
export function avatarSlot(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 7;
}
