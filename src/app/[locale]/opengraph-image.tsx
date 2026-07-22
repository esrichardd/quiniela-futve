import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { defaultLocale, isLocale } from "@/i18n/routing";

export const alt = "Quiniela FUTVE";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type OpenGraphImageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
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

function SocialBrandMark() {
  return (
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #5a0d1a 0%, #7c1225 58%, #a8720a 100%)",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        borderRadius: 22,
        boxShadow: "0 18px 48px rgba(124, 18, 37, 0.42)",
        display: "flex",
        height: 104,
        justifyContent: "center",
        width: 104,
      }}
    >
      <svg height="68" viewBox="0 0 32 32" width="68">
        <path
          d="M16 3A13 13 0 0 1 28.2 11.6H3.8A13 13 0 0 1 16 3Z"
          fill="#fcd116"
        />
        <path
          d="M3.8 11.6H28.2A13.7 13.7 0 0 1 28.2 20.4H3.8A13.7 13.7 0 0 1 3.8 11.6Z"
          fill="#003893"
        />
        <path
          d="M3.8 20.4H28.2A13 13 0 0 1 16 29A13 13 0 0 1 3.8 20.4Z"
          fill="#ce1126"
        />
        <path
          d="M4.3 11.7c3.7-0.8 7.6-1.2 11.7-1.2s8 0.4 11.7 1.2M4.3 20.3c3.7 0.8 7.6 1.2 11.7 1.2s-8-0.4-11.7-1.2"
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
        <circle
          cx="16"
          cy="16"
          fill="none"
          r="13"
          stroke="rgba(0,0,0,0.16)"
          strokeWidth="0.6"
        />
      </svg>
    </div>
  );
}

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
  const { locale: requestedLocale } = await params;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const t = await getTranslations({ locale, namespace: "home" });

  const fixtures = [
    ["Caracas FC", "1", "4", "Dep. Táchira"],
    ["Dep. La Guaira", "1", "1", "Carabobo FC"],
    ["Pto. Cabello", "0", "2", "Metropolitanos"],
  ] as const;

  return new ImageResponse(
    (
      <div
        style={{
          background:
            "radial-gradient(circle at 12% 18%, rgba(124, 18, 37, 0.52) 0%, transparent 36%), radial-gradient(circle at 88% 84%, rgba(168, 114, 10, 0.24) 0%, transparent 30%), #0c0809",
          color: "#f3f3f3",
          display: "flex",
          fontFamily: "sans-serif",
          height: "100%",
          overflow: "hidden",
          padding: "58px 64px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            display: "flex",
            inset: 0,
            maskImage: "linear-gradient(to bottom right, black, transparent 70%)",
            opacity: 0.55,
            position: "absolute",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            width: 670,
          }}
        >
          <div style={{ alignItems: "center", display: "flex" }}>
            <SocialBrandMark />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: 24,
              }}
            >
              <div
                style={{
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: -1,
                display: "flex",
              }}
              >
                Quiniela
                <span style={{ color: "#d9a017", marginLeft: 8 }}>FUTVE</span>
              </div>
              <div
                style={{
                  color: "#b0a6a8",
                  fontSize: 20,
                  marginTop: 6,
                }}
              >
                {t("hero.badge")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 62,
                fontWeight: 850,
                letterSpacing: -2.8,
                lineHeight: 1.04,
                maxWidth: 650,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span>{t("socialImage.predict")}</span>
              <span style={{ display: "flex" }}>
                <span style={{ color: "#d9a017" }}>
                  {t("socialImage.compete")}
                </span>
                <span style={{ marginLeft: 14 }}>{t("socialImage.win")}</span>
              </span>
            </div>
            <div
              style={{
                color: "#b0a6a8",
                fontSize: 23,
                lineHeight: 1.42,
                marginTop: 20,
                maxWidth: 615,
              }}
            >
              {t("metadata.description")}
            </div>
          </div>

          <div style={{ alignItems: "center", display: "flex" }}>
            {[t("features.free"), t("features.private"), t("features.global")].map(
              (feature) => (
                <div
                  key={feature}
                  style={{
                    alignItems: "center",
                    color: "#d8cfd1",
                    display: "flex",
                    fontSize: 17,
                    marginRight: 22,
                  }}
                >
                  <span
                    style={{
                      background: "#d9a017",
                      borderRadius: 999,
                      display: "flex",
                      height: 7,
                      marginRight: 9,
                      width: 7,
                    }}
                  />
                  {feature}
                </div>
              ),
            )}
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            flex: 1,
            justifyContent: "flex-end",
            position: "relative",
          }}
        >
          <div
            style={{
              background: "rgba(35, 20, 26, 0.96)",
              border: "1px solid rgba(255, 255, 255, 0.13)",
              borderRadius: 28,
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.38)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              padding: "26px 24px 24px",
              transform: "rotate(2deg)",
              width: 390,
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 700 }}>
                {t("matchCard.matchday", { value: 12 })}
              </span>
              <span
                style={{
                  alignItems: "center",
                  background: "rgba(239, 68, 68, 0.13)",
                  borderRadius: 999,
                  color: "#ef4444",
                  display: "flex",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "7px 12px",
                }}
              >
                <span
                  style={{
                    background: "#ef4444",
                    borderRadius: 999,
                    display: "flex",
                    height: 7,
                    marginRight: 7,
                    width: 7,
                  }}
                />
                {t("matchCard.live")}
              </span>
            </div>

            {fixtures.map(([home, homeScore, awayScore, away], index) => (
              <div
                key={home}
                style={{
                  alignItems: "center",
                  background:
                    index === 0 ? "rgba(124, 18, 37, 0.32)" : "rgba(255, 255, 255, 0.035)",
                  border:
                    index === 0
                      ? "1px solid rgba(158, 29, 43, 0.55)"
                      : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: 15,
                  display: "flex",
                  fontSize: 15,
                  marginBottom: 10,
                  minHeight: 67,
                  padding: "10px 12px",
                }}
              >
                <span
                  style={{
                    color: index === 0 ? "#f3f3f3" : "#b0a6a8",
                    display: "flex",
                    flex: 1,
                    justifyContent: "flex-end",
                    textAlign: "right",
                  }}
                >
                  {home}
                </span>
                <span
                  style={{
                    alignItems: "center",
                    display: "flex",
                    margin: "0 12px",
                  }}
                >
                  <span
                    style={{
                      alignItems: "center",
                      background: index === 0 ? "#7c1225" : "rgba(255,255,255,0.08)",
                      borderRadius: 9,
                      display: "flex",
                      fontSize: 20,
                      fontWeight: 800,
                      height: 38,
                      justifyContent: "center",
                      width: 38,
                    }}
                  >
                    {homeScore}
                  </span>
                  <span style={{ color: "#777074", margin: "0 7px" }}>–</span>
                  <span
                    style={{
                      alignItems: "center",
                      background: index === 0 ? "#7c1225" : "rgba(255,255,255,0.08)",
                      borderRadius: 9,
                      display: "flex",
                      fontSize: 20,
                      fontWeight: 800,
                      height: 38,
                      justifyContent: "center",
                      width: 38,
                    }}
                  >
                    {awayScore}
                  </span>
                </span>
                <span
                  style={{
                    color: index === 0 ? "#f3f3f3" : "#b0a6a8",
                    display: "flex",
                    flex: 1,
                  }}
                >
                  {away}
                </span>
              </div>
            ))}

            <div
              style={{
                alignItems: "center",
                color: "#d9a017",
                display: "flex",
                fontSize: 16,
                fontWeight: 700,
                marginTop: 8,
              }}
            >
              <span
                style={{
                  background: "#d9a017",
                  borderRadius: 999,
                  display: "flex",
                  height: 8,
                  marginRight: 8,
                  width: 8,
                }}
              />
              {t("matchCard.yourPrediction")}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
