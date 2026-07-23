import "server-only";

import { unstable_cache } from "next/cache";

import type { SeasonOption } from "@/features/competition-catalog/types";
import {
  COMPETITION_CATALOG_CACHE_TAG,
  COMPETITION_CATALOG_REVALIDATE_SECONDS,
} from "@/server/cache/competition-catalog";
import { listActiveSeasonRecords } from "@/server/dal/competition-catalog";

export const getCachedActiveSeasonOptions = unstable_cache(
  async (): Promise<ReadonlyArray<SeasonOption>> =>
    (await listActiveSeasonRecords()).map((season) => ({
      id: season.id,
      competitionId: season.competitionId,
      competitionName: season.competitionName,
      code: season.code,
      name: season.name,
    })),
  ["active-competition-season-catalog-v1"],
  {
    tags: [COMPETITION_CATALOG_CACHE_TAG],
    revalidate: COMPETITION_CATALOG_REVALIDATE_SECONDS,
  },
);
