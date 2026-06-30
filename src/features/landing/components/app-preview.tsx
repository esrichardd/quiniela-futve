import { getTranslations } from "next-intl/server";

import { featureItems } from "../data";
import MatchCard from "./match-card";
import { Orb } from "./orb";
import { SectionLabel } from "./section-label";

export default async function AppPreview() {
  const t = await getTranslations("home");

  return (
    <section id="preview" className="relative overflow-hidden px-4 py-20">
      <Orb className="landing-orb-preview" drift />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <div className="mb-3">
            <SectionLabel>{t("preview.sectionLabel")}</SectionLabel>
          </div>
          <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
            {t("preview.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
            {t("preview.sub")}
          </p>
        </div>

        <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-14">
          <div className="flex-1 space-y-5">
            {featureItems.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="landing-glass-card landing-glass-card-hover flex items-start gap-4 rounded-2xl p-4"
              >
                <div className="landing-icon-badge mt-0.5 size-9 flex-shrink-0 rounded-xl">
                  <Icon aria-hidden="true" className="size-4" />
                </div>
                <span className="text-sm font-medium leading-relaxed text-foreground">
                  {t(`features.${key}`)}
                </span>
              </div>
            ))}

            <div
              className="landing-glass-card landing-bright-border mt-2 flex items-center gap-3 rounded-2xl px-4 py-3"
            >
              <div
                aria-hidden="true"
                className="landing-preview-plus flex size-9 flex-shrink-0 items-center justify-center rounded-xl text-base font-bold text-primary-foreground"
              >
                +
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">{t("preview.statTitle")}</div>
                <div className="text-xs text-muted-foreground">{t("preview.statSub")}</div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xs flex-shrink-0">
            <MatchCard variant="compact" />
          </div>
        </div>
      </div>
    </section>
  );
}
