import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";

import type { CompetitionOption } from "@/features/pools/types";
import { listActiveCompetitions } from "@/server/dal/competitions";

export const COMPETITION_CATALOG_CACHE_TAG = "competition-catalog";
export const COMPETITION_CATALOG_REVALIDATE_SECONDS = 60 * 60;

export const getCachedActiveCompetitions = unstable_cache(
  async (): Promise<ReadonlyArray<CompetitionOption>> =>
    listActiveCompetitions(),
  ["active-competition-catalog-v1"],
  {
    tags: [COMPETITION_CATALOG_CACHE_TAG],
    revalidate: COMPETITION_CATALOG_REVALIDATE_SECONDS,
  },
);

export function invalidateCompetitionCatalog(): void {
  revalidateTag(COMPETITION_CATALOG_CACHE_TAG, { expire: 0 });
}
