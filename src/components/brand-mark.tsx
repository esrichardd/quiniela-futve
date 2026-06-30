import type { CSSProperties } from "react";

type BrandMarkProps = Readonly<{
  className?: string;
}>;

const starPoints = [
  [10.2, 16.7],
  [11.9, 15.6],
  [13.8, 15],
  [16, 14.8],
  [18.2, 15],
  [20.1, 15.6],
  [21.8, 16.7],
  [22.8, 18.2],
] as const;

const starPath =
  "M0 -1 0.29 -0.31 1.05 -0.31 0.43 0.12 0.64 0.82 0 0.4 -0.64 0.82 -0.43 0.12 -1.05 -0.31 -0.29 -0.31Z";

const badgeStyle = {
  background:
    "linear-gradient(135deg, var(--c-brand-dim) 0%, var(--c-brand) 58%, var(--c-gold-dim) 100%)",
  boxShadow: "0 0 20px var(--c-brand-a35)",
} satisfies CSSProperties;

const sheenStyle = {
  background:
    "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.16) 50%, transparent 100%)",
} satisfies CSSProperties;

export function BrandMark({ className = "size-8 rounded-lg" }: BrandMarkProps) {
  return (
    <span
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={badgeStyle}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={sheenStyle}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="relative z-10 size-[54%]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 3A13 13 0 0 1 28.2 11.6H3.8A13 13 0 0 1 16 3Z"
          fill="var(--c-flag-yellow)"
        />
        <path
          d="M3.8 11.6H28.2A13.7 13.7 0 0 1 28.2 20.4H3.8A13.7 13.7 0 0 1 3.8 11.6Z"
          fill="var(--c-flag-blue)"
        />
        <path
          d="M3.8 20.4H28.2A13 13 0 0 1 16 29A13 13 0 0 1 3.8 20.4Z"
          fill="var(--c-flag-red)"
        />

        <path
          d="M4.3 11.7c3.7-0.8 7.6-1.2 11.7-1.2s8 0.4 11.7 1.2M4.3 20.3c3.7 0.8 7.6 1.2 11.7 1.2s8-0.4 11.7-1.2"
          fill="none"
          stroke="rgba(255,255,255,0.52)"
          strokeLinecap="round"
          strokeWidth="1.35"
        />

        {starPoints.map(([x, y]) => (
          <path
            key={`${x}-${y}`}
            d={starPath}
            transform={`translate(${x} ${y}) scale(1.08)`}
            fill="var(--c-text-on-brand)"
          />
        ))}

        <circle
          cx="16"
          cy="16"
          r="13"
          fill="none"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="2.4"
        />
        <circle
          cx="16"
          cy="16"
          r="13"
          fill="none"
          stroke="rgba(0,0,0,0.16)"
          strokeWidth="0.6"
        />
      </svg>
    </span>
  );
}
