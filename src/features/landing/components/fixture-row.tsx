import type { Match } from "../data";

type FixtureRowProps = Readonly<{
  compact?: boolean;
  match: Match;
}>;

function Score({
  value,
  highlighted,
  compact,
}: Readonly<{ value: number; highlighted: boolean; compact: boolean }>) {
  return (
    <span
      className={`flex items-center justify-center rounded-lg font-bold ${
        compact ? "size-6 text-xs" : "size-7 text-sm"
      } ${highlighted ? "bg-brand text-primary-foreground" : "landing-score-muted text-foreground"}`}
    >
      {value}
    </span>
  );
}

export function FixtureRow({ compact = false, match }: FixtureRowProps) {
  const nameClass = `flex-1 truncate text-xs ${
    match.highlighted ? "text-foreground font-semibold" : "text-muted-foreground font-normal"
  }`;

  return (
    <div
      className={`landing-match-row flex items-center justify-between text-xs ${
        compact ? "rounded-lg px-2.5 py-2" : "rounded-xl px-3 py-2.5"
      } ${match.highlighted ? "landing-fixture-row-highlight" : "landing-fixture-row-default"}`}
    >
      <span className={`${nameClass} pr-1.5 text-right`}>{match.home}</span>
      <div className={`flex items-center ${compact ? "gap-0.5" : "mx-2 gap-1.5"}`}>
        <Score value={match.homeScore} highlighted={match.highlighted} compact={compact} />
        <span className={`text-subtle-text ${compact ? "px-0.5 text-[10px]" : "text-xs font-medium"}`}>
          {compact ? ":" : "-"}
        </span>
        <Score value={match.awayScore} highlighted={match.highlighted} compact={compact} />
      </div>
      <span className={`${nameClass} pl-1.5 text-left`}>{match.away}</span>
    </div>
  );
}
