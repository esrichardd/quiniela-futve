import { ClipboardList, Trophy, Users, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Orb } from "./orb";
import { SectionLabel } from "./section-label";

const stepIcons: LucideIcon[] = [Users, ClipboardList, Trophy];

export default async function HowItWorks() {
  const t = await getTranslations("home");

  const steps = [
    { number: "01", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
    { number: "02", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
    { number: "03", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
  ];

  return (
    <section id="how-it-works" className="relative overflow-hidden px-4 py-14 md:py-24">
      <div aria-hidden="true" className="landing-section-fade pointer-events-none absolute inset-0" />
      <Orb className="landing-orb-process" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-4 flex justify-center">
          <SectionLabel>{t("howItWorks.sectionLabel")}</SectionLabel>
        </div>

        <h2 className="mb-3 text-balance text-center text-3xl font-bold text-foreground md:text-4xl">
          {t("howItWorks.title")}
        </h2>
        <p className="mx-auto mb-8 max-w-md text-center text-sm text-muted-foreground md:mb-14 md:text-base">
          {t("howItWorks.sub")}
        </p>

        <div className="relative grid gap-4 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden="true"
            className="landing-process-line-primary absolute left-[33%] right-[33%] top-12 hidden h-px md:block"
          />
          <div
            aria-hidden="true"
            className="landing-process-line-secondary absolute left-[66%] right-0 top-12 hidden h-px md:block"
          />

          {steps.map((step, i) => {
            const Icon = stepIcons[i];

            return (
              <div
                key={step.title}
                className="landing-glass-card landing-glass-card-hover group relative rounded-2xl p-5 md:p-6"
              >
                <div
                  aria-hidden="true"
                  className="landing-step-number absolute right-4 top-4 font-mono text-xs font-bold"
                >
                  {step.number}
                </div>

                <div
                  className="landing-icon-badge landing-icon-badge-glow-sm mb-4 size-11 rounded-xl transition-all group-hover:scale-110 md:mb-5 md:size-12"
                >
                  <Icon aria-hidden="true" className="size-5 md:size-6" strokeWidth={1.5} />
                </div>

                <h3 className="mb-2 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
