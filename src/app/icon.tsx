import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

/**
 * High resolution site icon, generated from the same brand mark as the social
 * images so the three never drift.
 *
 * `favicon.ico` already carries 16–256px variants for browser tabs; this
 * exists for Google, which recommends a favicon larger than 48px and picks
 * the best candidate among the declared `<link rel="icon">` tags.
 *
 * The badge is full bleed rather than a rounded square: search surfaces crop
 * the icon into their own shape, so baking in a radius only wastes pixels.
 */

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

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #5a0d1a 0%, #7c1225 58%, #a8720a 100%)",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg height="384" viewBox="0 0 32 32" width="384">
          <path d="M16 3A13 13 0 0 1 28.2 11.6H3.8A13 13 0 0 1 16 3Z" fill="#fcd116" />
          <path
            d="M3.8 11.6H28.2A13.7 13.7 0 0 1 28.2 20.4H3.8A13.7 13.7 0 0 1 3.8 11.6Z"
            fill="#003893"
          />
          <path
            d="M3.8 20.4H28.2A13 13 0 0 1 16 29A13 13 0 0 1 3.8 20.4Z"
            fill="#ce1126"
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
              d={starPath}
              fill="#ffffff"
              key={`${x}-${y}`}
              transform={`translate(${x} ${y}) scale(1.08)`}
            />
          ))}
          <circle
            cx="16"
            cy="16"
            fill="none"
            r="13"
            stroke="rgba(255,255,255,0.94)"
            strokeWidth="2.4"
          />
        </svg>
      </div>
    ),
    size,
  );
}
