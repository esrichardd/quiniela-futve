import type { MatchdayStatus, MatchStatus, SeasonStatus } from "./types";

const matchTransitions: Readonly<Record<MatchStatus, ReadonlyArray<MatchStatus>>> = {
  scheduled: ["postponed", "in_progress", "finished", "cancelled"],
  postponed: ["scheduled", "in_progress", "finished", "cancelled"],
  in_progress: ["postponed", "finished", "cancelled"],
  finished: ["finished"],
  cancelled: ["scheduled", "postponed"],
};

export function normalizeCatalogCode(value: string): string {
  return value.trim().toLowerCase();
}

export function canTransitionSeason(
  current: SeasonStatus,
  next: SeasonStatus,
): boolean {
  return (
    current === next ||
    (current === "draft" && next === "active") ||
    (current === "active" && next === "finished")
  );
}

export function canTransitionMatchday(
  current: MatchdayStatus,
  next: MatchdayStatus,
): boolean {
  return (
    current === next ||
    (current === "draft" && next === "published") ||
    (current === "published" && next === "finished")
  );
}

export function canTransitionMatch(
  current: MatchStatus,
  next: MatchStatus,
): boolean {
  return matchTransitions[current].includes(next);
}

export function matchdayCanFinish(
  statuses: ReadonlyArray<MatchStatus>,
): boolean {
  return (
    statuses.length > 0 &&
    statuses.every((status) => status === "finished" || status === "cancelled")
  );
}
