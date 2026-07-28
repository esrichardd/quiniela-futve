import "server-only";

import { assignCompetitionRanks } from "@/features/ranking/rules";
import type { PoolRankingView, RankingEntry } from "@/features/ranking/types";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";
import { requireVerifiedAppUser } from "@/server/auth/session";
import { getCachedRankingRows } from "@/server/cache/ranking";
import { getPoolMembershipCore, parsePoolRole } from "@/server/dal/pools";

/**
 * Returns the full standings table of a pool: every member's display name,
 * role, accumulated points, and standard competition rank, plus which row
 * belongs to the caller. Unlike prediction reads, this is intentionally
 * not scoped to the caller's own membership — every member of the pool can
 * see every other member's total, because the ranking is a property of the
 * pool as a whole. It stays private to non-members: a user who is not a
 * member of the pool gets the same `PoolMembershipRequiredError` as for an
 * inexistent pool, never a filtered or partial view.
 */
export async function getPoolRanking(poolId: string): Promise<PoolRankingView> {
  const appUser = await requireVerifiedAppUser();

  const membershipContext = await getPoolMembershipCore(poolId, appUser.id);
  if (!membershipContext) throw new PoolMembershipRequiredError();

  const rows = await getCachedRankingRows(poolId);

  const ranked = assignCompetitionRanks(
    rows.map((row) => ({
      membershipId: row.poolMembershipId,
      totalPoints: row.totalPoints,
    })),
  );

  const rowsByMembershipId = new Map(rows.map((row) => [row.poolMembershipId, row]));

  const entries: ReadonlyArray<RankingEntry> = ranked.map(
    ({ membershipId, totalPoints, rank }) => {
      const row = rowsByMembershipId.get(membershipId);
      if (!row) {
        throw new Error("Ranked membership is missing its source row.");
      }
      return {
        poolMembershipId: membershipId,
        displayName: row.displayName,
        role: parsePoolRole(row.role),
        totalPoints,
        rank,
        isCurrentUser: membershipId === membershipContext.poolMembershipId,
      };
    },
  );

  return {
    poolId,
    poolName: membershipContext.poolName,
    entries,
  };
}
