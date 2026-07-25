import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/server/db/client";
import {
  poolMatchdayPerfectBonuses,
  poolMatchPredictions,
  poolMatchPredictionScores,
  poolMemberships,
  userProfiles,
} from "@/server/db/schema";

export type RankingRowRecord = Readonly<{
  poolMembershipId: string;
  displayName: string | null;
  role: string;
  totalPoints: number;
}>;

/**
 * Every membership of a pool with its accumulated total points: the sum of
 * `pool_match_prediction_scores.points_earned` across all of the
 * membership's predictions, plus the sum of
 * `pool_matchday_perfect_bonuses.points_awarded` across all of its
 * matchdays. Both sums are correlated subqueries (the same pattern already
 * used for `memberCount` in `dal/pools.ts`), so a membership with no
 * calculated score or bonus yet still appears in the result with
 * `totalPoints = 0` instead of being excluded by an inner join.
 *
 * Ordered by `(created_at, id)` ascending so ties keep a deterministic,
 * join-order-based sequence before `assignCompetitionRanks` sorts by
 * points.
 */
export async function listRankingRowsForPool(
  poolId: string,
): Promise<ReadonlyArray<RankingRowRecord>> {
  return db
    .select({
      poolMembershipId: poolMemberships.id,
      displayName: userProfiles.displayName,
      role: poolMemberships.role,
      totalPoints: sql<number>`(
        coalesce((
          select sum(${poolMatchPredictionScores.pointsEarned})::integer
          from ${poolMatchPredictions}
          inner join ${poolMatchPredictionScores}
            on ${poolMatchPredictionScores.poolMatchPredictionId} = ${poolMatchPredictions.id}
          where ${poolMatchPredictions.poolMembershipId} = ${poolMemberships.id}
        ), 0)
        +
        coalesce((
          select sum(${poolMatchdayPerfectBonuses.pointsAwarded})::integer
          from ${poolMatchdayPerfectBonuses}
          where ${poolMatchdayPerfectBonuses.poolMembershipId} = ${poolMemberships.id}
        ), 0)
      )::integer`,
    })
    .from(poolMemberships)
    .innerJoin(userProfiles, eq(poolMemberships.userId, userProfiles.userId))
    .where(eq(poolMemberships.poolId, poolId))
    .orderBy(asc(poolMemberships.createdAt), asc(poolMemberships.id));
}
