export const poolCurrencies = ["USD", "COP", "VES"] as const;
export const poolRoles = ["pool_admin", "player"] as const;
export const prizeModels = [
  "winner_takes_all",
  "first_place",
  "top_three",
] as const;
export const predictionModes = ["simple", "score", "mixed"] as const;

export const DEFAULT_POOL_CURRENCY = "USD";
export const DEFAULT_PERFECT_MATCHDAY_BONUS_POINTS = 5;
export const INVITATION_CODE_LENGTH = 6;
export const INVITATION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MAX_INVITATION_CODE_ATTEMPTS = 5;
export const POOL_LIST_PAGE_SIZE = 24;
export const POOL_MEMBER_PAGE_SIZE = 25;
