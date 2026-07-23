export const seasonStatuses = ["draft", "active", "finished"] as const;
export const matchdayStatuses = ["draft", "published", "finished"] as const;
export const matchStatuses = [
  "scheduled",
  "postponed",
  "in_progress",
  "finished",
  "cancelled",
] as const;

export const MAX_CATALOG_NAME_LENGTH = 120;
export const MAX_TEAM_SHORT_NAME_LENGTH = 40;
export const MAX_MATCHDAY_NUMBER = 999;
