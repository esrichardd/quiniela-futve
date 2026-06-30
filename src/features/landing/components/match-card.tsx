import { getTranslations } from "next-intl/server";

import { MATCHDAY, matches, ranking } from "../data";
import { FixtureRow } from "./fixture-row";
import { LiveBadge } from "./live-badge";
import { RankingRow } from "./ranking-row";

type MatchCardProps = Readonly<{
  variant?: "full" | "compact";
}>;

export default async function MatchCard({ variant = "full" }: MatchCardProps) {
  const t = await getTranslations("home");
  const compact = variant === "compact";
  const rankingRows = ranking.slice(0, compact ? 4 : 3);

  return (
    <div
      className={`landing-glass-card relative overflow-hidden rounded-2xl ${
        compact ? "landing-card-shadow-compact" : "landing-card-shadow-full"
      }`}
    >
      <div
        aria-hidden="true"
        className="landing-brand-hairline absolute inset-x-0 top-0 h-px"
      />

      <div
        className={`landing-border-bottom flex items-center justify-between ${
          compact ? "px-4 py-3" : "px-4 pb-3 pt-4"
        }`}
      >
        <span className="text-sm font-semibold text-foreground">
          {t("matchCard.matchday", { value: MATCHDAY })}
        </span>
        <LiveBadge label={t("matchCard.live")} compact={compact} />
      </div>

      <div className={compact ? "space-y-1.5 px-3 py-2.5" : "space-y-2 px-4 py-3"}>
        {matches.map((match) => (
          <FixtureRow key={match.home} match={match} compact={compact} />
        ))}
      </div>

      <div className={`flex items-center gap-1.5 ${compact ? "px-3 pb-2" : "px-4 pb-1"}`}>
        <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
        <span className={`font-medium text-brand ${compact ? "text-[11px]" : "text-xs"}`}>
          {t("matchCard.yourPrediction")}
        </span>
      </div>

      <div className={compact ? "px-3 pb-4" : "px-4 pb-4"}>
        <div className="landing-muted-panel overflow-hidden rounded-xl">
          <div className="landing-border-bottom px-3 pb-1.5 pt-2.5">
            <span className="text-subtle-text text-[10px] font-bold uppercase tracking-widest">
              {t("matchCard.ranking")}
            </span>
          </div>
          {rankingRows.map((entry, i) => (
            <RankingRow
              key={entry.name}
              entry={entry}
              isLast={i === rankingRows.length - 1}
              compact={compact}
              pointsLabel={t("matchCard.points", { value: entry.pts })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
