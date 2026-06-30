import type { RankingEntry } from "../data";

type RankingRowProps = Readonly<{
  compact?: boolean;
  entry: RankingEntry;
  isLast: boolean;
  pointsLabel: string;
}>;

export function RankingRow({ compact = false, entry, isLast, pointsLabel }: RankingRowProps) {
  return (
    <div
      className={`landing-match-row flex items-center ${
        compact ? "gap-2.5 px-3 py-1.5" : "gap-3 px-3 py-2.5"
      } ${isLast ? "" : "landing-row-divider"}`}
    >
      <div
        className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold ${
          compact ? "size-5 text-[10px]" : "size-6 text-xs"
        } ${
          entry.gold
            ? "landing-ranking-medal-gold text-primary-foreground"
            : "landing-ranking-medal-default text-muted-foreground"
        }`}
      >
        {entry.pos}
      </div>
      <span
        className={`flex-1 ${compact ? "text-xs" : "text-sm"} ${
          entry.gold ? "text-foreground font-semibold" : "text-muted-foreground font-normal"
        }`}
      >
        {entry.name}
      </span>
      <span
        className={`font-bold tabular-nums ${compact ? "text-xs" : "text-sm"} ${
          entry.gold ? "text-gold" : "text-subtle-text"
        }`}
      >
        {pointsLabel}
      </span>
    </div>
  );
}
