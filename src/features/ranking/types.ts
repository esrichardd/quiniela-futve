import type { PoolRole } from "@/features/pools/types";

/**
 * A single row of a pool's standings table. Unlike `PredictionMatch` /
 * `PredictionMatchday` (strictly personal to the authenticated member),
 * this DTO is shared: every member of the pool can see every other
 * member's `displayName` and `totalPoints`, because the ranking is a
 * feature of the pool as a whole, not of an individual membership.
 */
export type RankingEntry = Readonly<{
  poolMembershipId: string;
  displayName: string | null;
  role: PoolRole;
  totalPoints: number;
  /** Standard competition ranking ("1224"): tied totals share a rank, and
   * the next distinct total skips the number of tied entries. */
  rank: number;
  /** Whether this row belongs to the currently authenticated member, so
   * the UI can highlight it. */
  isCurrentUser: boolean;
}>;

export type PoolRankingView = Readonly<{
  poolId: string;
  poolName: string;
  entries: ReadonlyArray<RankingEntry>;
}>;
