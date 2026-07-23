import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { PoolMatchdaysView } from "@/features/competition-catalog/types";
import { Link } from "@/i18n/navigation";

import PoolNavigation from "./pool-navigation";

export default async function PoolMatchdays({
  view,
  locale,
  timeZone,
}: Readonly<{
  view: PoolMatchdaysView;
  locale: string;
  timeZone: string;
}>) {
  const [t, catalog] = await Promise.all([
    getTranslations("pools"),
    getTranslations("competitionCatalog"),
  ]);
  const selected = view.matchdays.find((item) => item.id === view.selectedMatchdayId);
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });

  return (
    <section>
      <p className="text-sm font-bold uppercase tracking-wide text-brand">
        {view.competitionName} · {view.seasonName}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{view.poolName}</h1>
      <PoolNavigation poolId={view.poolId} active="matchdays" />

      {view.matchdays.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-soft">
          <CalendarDays aria-hidden="true" className="mx-auto size-9 text-brand" />
          <h2 className="mt-4 text-lg font-bold">{t("matchdays.emptyTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("matchdays.emptyBody")}</p>
        </div>
      ) : (
        <div className="mt-7 grid gap-6 lg:grid-cols-[15rem_1fr]">
          <nav aria-label={t("matchdays.selectorLabel")} className="flex gap-2 overflow-x-auto lg:flex-col">
            {view.matchdays.map((matchday) => (
              <Link
                key={matchday.id}
                href={`/pools/${view.poolId}/matchdays?matchday=${matchday.id}`}
                aria-current={matchday.id === view.selectedMatchdayId ? "page" : undefined}
                className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-semibold ${
                  matchday.id === view.selectedMatchdayId
                    ? "border-brand bg-brand/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {matchday.name ?? t("matchdays.defaultName", { number: matchday.number })}
              </Link>
            ))}
          </nav>

          {selected ? (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">
                  {selected.name ?? t("matchdays.defaultName", { number: selected.number })}
                </h2>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                  {catalog(`matchdays.status.${selected.status}`)}
                </span>
              </div>
              {selected.matches.length > 0 ? (
                <ul className="mt-5 divide-y divide-border">
                  {selected.matches.map((match) => (
                    <li key={match.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                      <p className="font-semibold sm:text-right">{match.homeTeamName}</p>
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          {match.status === "finished"
                            ? `${match.homeScore} — ${match.awayScore}`
                            : t("matchdays.versus")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatter.format(new Date(match.startsAt))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {catalog(`matches.status.${match.status}`)}
                        </p>
                      </div>
                      <p className="font-semibold">{match.awayTeamName}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-muted-foreground">{t("matchdays.noMatches")}</p>
              )}
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}
