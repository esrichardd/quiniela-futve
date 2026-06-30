import { ArrowRight, PlayCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { featureItems } from "../data";
import MatchCard from "./match-card";
import { Orb } from "./orb";

export default async function HeroSection() {
  const t = await getTranslations("home");

  return (
    <section className="relative flex items-center overflow-hidden px-4 pb-16 pt-28">
      <Orb className="landing-orb-hero-brand" drift />
      <Orb className="landing-orb-hero-gold" drift />
      <Orb className="landing-orb-hero-subtle" />

      <div
        aria-hidden="true"
        className="landing-hero-grid absolute inset-0 z-0 opacity-[0.025]"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-12">
          <div className="min-w-0 flex-1 text-center lg:text-left">
            <div
              className="landing-glass-card landing-bright-border mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <span
                aria-hidden="true"
                className="landing-animate-pulse-glow landing-brand-dot size-2 rounded-full"
              />
              {t("hero.badge")}
            </div>

            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
              {t.rich("hero.title", {
                grad: (chunks) => <span className="landing-text-gradient">{chunks}</span>,
                accent: (chunks) => (
                  <span className="relative inline-block">
                    <span className="text-foreground">{chunks}</span>
                    <span
                      aria-hidden="true"
                      className="landing-accent-underline absolute inset-x-0 -bottom-1 h-[3px] rounded-full"
                    />
                  </span>
                ),
              })}
            </h1>

            <p className="mx-auto mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground lg:mx-0">
              {t("hero.sub")}
            </p>

            <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/sign-up"
                className="landing-btn-glow flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t("hero.cta1")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <a
                href="#how-it-works"
                className="landing-glass-card landing-glass-card-hover landing-bright-border flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PlayCircle aria-hidden="true" className="size-4 text-brand" />
                {t("hero.cta2")}
              </a>
            </div>

            <ul className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground lg:justify-start">
              {featureItems.map(({ icon: Icon, key }) => (
                <li key={key} className="flex items-center gap-1.5">
                  <Icon aria-hidden="true" className="size-3.5 text-brand" />
                  {t(`features.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-animate-float w-full max-w-sm flex-shrink-0">
            <MatchCard variant="full" />
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="landing-hero-fade pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32"
      />
    </section>
  );
}
