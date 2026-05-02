"use client";

/**
 * Tiny celebration: a check-draw centered over a fan of pastel sparkles.
 * Used inline next to a reminder when the user marks it done. The whole
 * burst self-cleans in ~700 ms so it never blocks subsequent actions.
 */
export function Sparkles({ tone = "done" }: { tone?: "done" | "poke" }) {
  const colour = tone === "poke" ? "var(--rt-poke)" : "var(--rt-done)";
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      data-testid="sparkles"
    >
      <svg viewBox="-24 -24 48 48" className="h-12 w-12">
        {[
          [0, -16, 0, 0],
          [12, -10, 30, 60],
          [16, 4, 60, 120],
          [10, 14, -30, 180],
          [-10, 14, 30, 240],
          [-16, 4, -60, 300],
          [-12, -10, -30, 360],
        ].map(([x, y, rot, delay], i) => (
          <g
            key={i}
            transform={`translate(${x} ${y})`}
            className="rt-sparkle"
            style={
              {
                "--rt-sparkle-rot": `${rot}deg`,
                "--rt-sparkle-delay": `${delay}ms`,
              } as React.CSSProperties
            }
          >
            <path
              d="M0 -3 L1 -1 L3 0 L1 1 L0 3 L-1 1 L-3 0 L-1 -1 Z"
              fill={colour}
            />
          </g>
        ))}
        <g transform="translate(0 0)">
          <circle r="9" fill={tone === "poke" ? "var(--rt-poke-soft)" : "var(--rt-done-soft, #e6f3e6)"} />
          <path
            className="rt-check-path"
            d="M-5 0 L-1 4 L5 -3"
            fill="none"
            stroke={colour}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </span>
  );
}
