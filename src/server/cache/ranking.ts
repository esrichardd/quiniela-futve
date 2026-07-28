import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";

import { listRankingRowsForPool, type RankingRowRecord } from "@/server/dal/ranking";

/**
 * One cache entry per pool: the ranking only changes when the scoring
 * services (`recomputeMatchPredictionPoints`, `recomputeMatchdayBonuses`)
 * run, not on every visit to `/ranking`. `revalidate: false` keeps the
 * entry indefinitely until a matching `revalidateTag` call invalidates it.
 */
export function poolRankingCacheTag(poolId: string): string {
  return `pool-ranking-${poolId}`;
}

export async function getCachedRankingRows(
  poolId: string,
): Promise<ReadonlyArray<RankingRowRecord>> {
  return unstable_cache(
    async (id: string) => listRankingRowsForPool(id),
    ["pool-ranking-rows-v1"],
    {
      tags: [poolRankingCacheTag(poolId)],
      revalidate: false,
    },
  )(poolId);
}

export function invalidatePoolRanking(poolId: string): void {
  revalidateTag(poolRankingCacheTag(poolId), { expire: 0 });
}
