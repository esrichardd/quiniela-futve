import { Shield, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";

import PoolNavigation from "@/features/pools/components/pool-navigation";
import type { PoolRankingView } from "@/features/ranking/types";

export default async function PoolRanking({
  view,
  locale,
}: Readonly<{
  view: PoolRankingView;
  locale: string;
}>) {
  const [t, poolsT] = await Promise.all([
    getTranslations("ranking"),
    getTranslations("pools"),
  ]);
  const numberFormatter = new Intl.NumberFormat(locale);

  return (
    <section>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{view.poolName}</h1>
      <PoolNavigation poolId={view.poolId} active="ranking" />

      {view.entries.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-soft">
          <Trophy aria-hidden="true" className="mx-auto size-9 text-brand" />
          <h2 className="mt-4 text-lg font-bold">{t("empty.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("empty.body")}</p>
        </div>
      ) : (
        <div className="mt-7 overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t("title")}</caption>
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-3">
                  {t("table.rank")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("table.member")}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t("table.points")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {view.entries.map((entry) => (
                <tr
                  key={entry.poolMembershipId}
                  className={entry.isCurrentUser ? "bg-brand/10" : undefined}
                >
                  <td className="px-4 py-3 font-bold text-foreground">
                    {numberFormatter.format(entry.rank)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {entry.displayName ?? poolsT("detail.unnamedMember")}
                      </span>
                      {entry.role === "pool_admin" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                          <Shield aria-hidden="true" className="size-3 text-brand" />
                          {poolsT("roles.pool_admin")}
                        </span>
                      ) : null}
                      {entry.isCurrentUser ? (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                          {t("you")}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    {numberFormatter.format(entry.totalPoints)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
