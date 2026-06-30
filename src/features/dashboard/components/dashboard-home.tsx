import { CalendarDays, Construction, Trophy } from "lucide-react";

import { Link } from "@/i18n/navigation";

import LogoutButton from "./logout-button";

type DashboardHomeProps = Readonly<{
  homeLabel: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  statusTitle: string;
  statusBody: string;
  primaryStatLabel: string;
  primaryStatValue: string;
  secondaryStatLabel: string;
  secondaryStatValue: string;
}>;

export default function DashboardHome({
  homeLabel,
  eyebrow,
  title,
  subtitle,
  statusTitle,
  statusBody,
  primaryStatLabel,
  primaryStatValue,
  secondaryStatLabel,
  secondaryStatValue,
}: DashboardHomeProps) {
  return (
    <main className="min-h-dvh bg-background px-4 py-6 text-foreground">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-3">
          <Link
            href="/"
            aria-label={homeLabel}
            className="inline-flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground shadow-soft">
              Q
            </span>
            <span className="truncate text-base font-bold tracking-tight">
              Quiniela <span className="text-brand">FUTVE</span>
            </span>
          </Link>

          <LogoutButton />
        </header>

        <section className="flex flex-1 items-center py-10">
          <div className="grid w-full items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-brand/5 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Construction aria-hidden="true" className="size-3.5 text-brand" />
                {eyebrow}
              </div>

              <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {subtitle}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-brand/10 text-brand shadow-soft">
                  <Trophy aria-hidden="true" className="size-6" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    {statusTitle}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {statusBody}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-brand/5 p-4">
                  <CalendarDays aria-hidden="true" className="mb-3 size-5 text-brand" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {primaryStatLabel}
                  </p>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {primaryStatValue}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-brand/5 p-4">
                  <Trophy aria-hidden="true" className="mb-3 size-5 text-brand" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {secondaryStatLabel}
                  </p>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {secondaryStatValue}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
