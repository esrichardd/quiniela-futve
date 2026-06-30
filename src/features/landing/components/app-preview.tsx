import { getTranslations } from "next-intl/server";

import { featureItems } from "../data";
import MatchCard from "./match-card";
import { Orb } from "./orb";
import { SectionLabel } from "./section-label";

export default async function AppPreview() {
  const t = await getTranslations("home");

  return (
    <section id="preview" className="relative overflow-hidden px-4 py-14 md:py-20">
      <Orb className="landing-orb-preview" drift />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-8 text-center md:mb-12">
          <div className="mb-3">
            <SectionLabel>{t("preview.sectionLabel")}</SectionLabel>
          </div>
          <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
            {t("preview.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
            {t("preview.sub")}
          </p>
        </div>

        <div className="flex flex-col items-center gap-7 lg:flex-row lg:gap-14">
          <div className="grid w-full max-w-xs flex-1 grid-cols-2 gap-3 lg:max-w-none lg:grid-cols-1 lg:gap-5">
            {featureItems.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="landing-glass-card landing-glass-card-hover flex min-h-20 items-center gap-3 rounded-2xl p-3 lg:min-h-0 lg:items-start lg:gap-4 lg:p-4"
              >
                <div className="landing-icon-badge size-8 flex-shrink-0 rounded-xl lg:mt-0.5 lg:size-9">
                  <Icon aria-hidden="true" className="size-4" />
                </div>
                <span className="text-xs font-semibold leading-snug text-foreground lg:text-sm lg:font-medium lg:leading-relaxed">
                  {t(`features.${key}`)}
                </span>
              </div>
            ))}

            <div
              className="landing-glass-card landing-bright-border flex min-h-20 items-center gap-3 rounded-2xl p-3 lg:mt-2 lg:min-h-0 lg:px-4 lg:py-3"
            >
              <div
                aria-hidden="true"
                className="landing-preview-plus flex size-8 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground lg:size-9 lg:text-base"
              >
                +
              </div>
              <div>
                <div className="text-xs font-bold leading-snug text-foreground lg:text-sm">{t("preview.statTitle")}</div>
                <div className="text-[11px] leading-tight text-muted-foreground lg:text-xs">{t("preview.statSub")}</div>
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
