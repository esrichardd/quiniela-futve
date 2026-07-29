import {
  BarChart3,
  BookOpenCheck,
  CalendarRange,
  MailCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import LocalDateTime from "@/components/local-date-time";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { AdminDashboardMetrics } from "@/server/services/admin-dashboard";

type AdminOverviewProps = Readonly<{
  locale: Locale;
  metrics: AdminDashboardMetrics;
}>;

const cardClass =
  "rounded-2xl border border-border bg-card p-5 shadow-soft";

export default async function AdminOverview({
  locale,
  metrics,
}: AdminOverviewProps) {
  const t = await getTranslations("admin");
  const numberFormatter = new Intl.NumberFormat(locale);

  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand">{t("eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/admin/competitions"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold shadow-soft hover:border-brand/40 hover:bg-brand/5"
        >
          <CalendarRange aria-hidden="true" className="size-4 text-brand" />
          {t("actions.competitions")}
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Users aria-hidden="true" className="size-5" />}
          label={t("metrics.registeredUsers")}
          value={numberFormatter.format(metrics.registeredUsers)}
        />
        <MetricCard
          icon={<MailCheck aria-hidden="true" className="size-5" />}
          label={t("metrics.verifiedUsers")}
          value={numberFormatter.format(metrics.verifiedUsers)}
        />
        <MetricCard
          icon={<BookOpenCheck aria-hidden="true" className="size-5" />}
          label={t("metrics.createdPools")}
          value={numberFormatter.format(metrics.createdPools)}
        />
        <MetricCard
          icon={<UsersRound aria-hidden="true" className="size-5" />}
          label={t("metrics.totalMemberships")}
          value={numberFormatter.format(metrics.totalMemberships)}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <article className={cardClass}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <BarChart3 aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h2 className="font-bold">{t("breakdown.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("breakdown.subtitle")}
              </p>
            </div>
          </div>

          {metrics.poolModeBreakdown.length > 0 ? (
            <ul className="mt-6 space-y-3">
              {metrics.poolModeBreakdown.map((item) => (
                <li
                  key={item.mode}
                  className="flex items-center justify-between gap-4 rounded-xl bg-muted px-4 py-3"
                >
                  <span className="text-sm font-semibold">
                    {t(`modes.${item.mode}`)}
                  </span>
                  <span className="text-lg font-bold">
                    {numberFormatter.format(item.count)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              {t("breakdown.empty")}
            </p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border p-3">
              <dt className="text-muted-foreground">{t("metrics.competitions")}</dt>
              <dd className="mt-1 text-lg font-bold">
                {numberFormatter.format(metrics.competitionCount)}
              </dd>
            </div>
            <div className="rounded-xl border border-border p-3">
              <dt className="text-muted-foreground">{t("metrics.seasons")}</dt>
              <dd className="mt-1 text-lg font-bold">
                {numberFormatter.format(metrics.seasonCount)}
              </dd>
            </div>
          </dl>
        </article>

        <article className={cardClass}>
          <div>
            <h2 className="font-bold">{t("pools.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("pools.subtitle")}
            </p>
          </div>

          {metrics.pools.length > 0 ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="pb-3 pr-4 font-semibold">{t("pools.name")}</th>
                    <th className="pb-3 pr-4 font-semibold">{t("pools.competition")}</th>
                    <th className="pb-3 pr-4 font-semibold">{t("pools.type")}</th>
                    <th className="pb-3 pr-4 text-right font-semibold">{t("pools.members")}</th>
                    <th className="pb-3 text-right font-semibold">{t("pools.created")}</th>
                    <th className="pb-3 pl-4 text-right font-semibold">{t("pools.details")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {metrics.pools.map((pool) => (
                    <tr key={pool.id}>
                      <td className="py-3 pr-4 align-top">
                        <p className="font-semibold">{pool.name}</p>
                        <p className="text-xs text-muted-foreground">{pool.seasonName}</p>
                      </td>
                      <td className="py-3 pr-4 align-top text-muted-foreground">
                        {pool.competitionName}
                      </td>
                      <td className="py-3 pr-4 align-top font-medium">
                        {t(`modes.${pool.predictionMode}`)}
                      </td>
                      <td className="py-3 pr-4 text-right align-top font-bold">
                        {numberFormatter.format(pool.memberCount)}
                      </td>
                      <td className="py-3 text-right align-top text-muted-foreground">
                        <LocalDateTime
                          iso={pool.createdAt.toISOString()}
                          locale={locale}
                          dateStyle="medium"
                        />
                      </td>
                      <td className="py-3 pl-4 text-right align-top">
                        <Link
                          href={`/admin/pools/${pool.id}`}
                          className="font-semibold text-brand hover:underline"
                        >
                          {t("pools.viewDetails")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              {t("pools.empty")}
            </p>
          )}
        </article>
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  note,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
}>) {
  return (
    <article className={cardClass}>
      <div className="flex items-center gap-3 text-brand">
        {icon}
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
      {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
    </article>
  );
}
