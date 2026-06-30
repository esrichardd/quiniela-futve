import { ArrowRight, CircleCheck, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { Orb } from "./orb";

export default async function CtaSection() {
  const t = await getTranslations("home");
  const common = await getTranslations("common");

  return (
    <section className="relative overflow-hidden px-4 py-24">
      <Orb className="landing-orb-cta" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="landing-cta-panel relative overflow-hidden rounded-3xl px-8 py-14 text-center md:px-16 md:py-20">
          <div
            aria-hidden="true"
            className="landing-cta-top-line absolute inset-x-0 top-0 h-px"
          />
          <div
            aria-hidden="true"
            className="landing-cta-brand-corner pointer-events-none absolute left-0 top-0 size-40"
          />
          <div
            aria-hidden="true"
            className="landing-cta-gold-corner pointer-events-none absolute bottom-0 right-0 size-40"
          />

          <div className="landing-icon-badge landing-icon-badge-glow-lg mx-auto mb-6 size-16 rounded-2xl">
            <Trophy aria-hidden="true" className="size-8" strokeWidth={1.5} />
          </div>

          <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl lg:text-5xl">
            {t.rich("cta.title", {
              grad: (chunks) => (
                <span className="landing-text-gradient">{chunks}</span>
              ),
            })}
          </h2>
          <p className="mx-auto mb-10 max-w-md text-lg leading-relaxed text-muted-foreground">
            {t("cta.sub")}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="landing-btn-glow flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
            >
              {t("cta.btn1")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/login"
              className="landing-glass-card landing-glass-card-hover landing-bright-border w-full rounded-xl px-8 py-4 text-center text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
            >
              {common("actions.signIn")}
            </Link>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-subtle-text">
            <CircleCheck aria-hidden="true" className="size-3.5 text-brand" />
            {t("cta.trust")}
          </p>
        </div>
      </div>
    </section>
  );
}
