import { CalendarDays, Plus, Ticket, Trophy, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { formatMinorCurrency } from "@/features/pools/format";
import type { PoolListItem } from "@/features/pools/types";
import { Link } from "@/i18n/navigation";

type DashboardHomeProps = Readonly<{
  locale: string;
  pools: ReadonlyArray<PoolListItem>;
}>;

export default async function DashboardHome({ locale, pools }: DashboardHomeProps) {
  const t = await getTranslations("pools");

  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand">{t("list.eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("list.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("list.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/pools/join"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground shadow-soft hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Ticket aria-hidden="true" className="size-4 text-brand" />
            {t("actions.join")}
          </Link>
          <Link
            href="/pools/create"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-soft hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus aria-hidden="true" className="size-4" />
            {t("actions.create")}
          </Link>
        </div>
      </div>

      {pools.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-soft">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Trophy aria-hidden="true" className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold">{t("list.empty.title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("list.empty.body")}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pools.map((pool) => (
            <article
              key={pool.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand">
                    {pool.competitionName}
                  </p>
                  <h2 className="mt-1 truncate text-xl font-bold">{pool.name}</h2>
                </div>
                <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                  {t(`roles.${pool.role}`)}
                </span>
              </div>

              {pool.description ? (
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {pool.description}
                </p>
              ) : null}

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users aria-hidden="true" className="size-3.5" />
                    {t("list.members")}
                  </dt>
                  <dd className="mt-1 font-bold">{pool.memberCount}</dd>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <dt className="text-xs text-muted-foreground">{t("list.fee")}</dt>
                  <dd className="mt-1 font-bold">
                    {pool.participationFeeMinor === null
                      ? t("financial.free")
                      : formatMinorCurrency(
                          locale,
                          pool.currency,
                          pool.participationFeeMinor,
                        )}
                  </dd>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <dt className="text-xs text-muted-foreground">
                    {t("list.prediction")}
                  </dt>
                  <dd className="mt-1 font-bold">
                    {t(`prediction.modes.${pool.predictionMode}.label`)}
                  </dd>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays aria-hidden="true" className="size-3.5" />
                    {t("list.created")}
                  </dt>
                  <dd className="mt-1 font-bold">
                    {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                      new Date(pool.createdAt),
                    )}
                  </dd>
                </div>
              </dl>

              <Link
                href={`/pools/${pool.id}`}
                className="mt-5 inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("actions.open")}
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
