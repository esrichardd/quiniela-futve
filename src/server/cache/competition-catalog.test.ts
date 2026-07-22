import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CompetitionOption } from "@/features/pools/types";

type CacheOptions = Readonly<{
  tags?: ReadonlyArray<string>;
  revalidate?: number | false;
}>;

const cacheState = vi.hoisted(() => {
  let clearCache = (): void => undefined;

  return {
    listActiveCompetitions: vi.fn(),
    revalidateTag: vi.fn(() => clearCache()),
    capturedOptions: undefined as CacheOptions | undefined,
    setClearCache(callback: () => void): void {
      clearCache = callback;
    },
    clearCache(): void {
      clearCache();
    },
  };
});

vi.mock("server-only", () => ({}));

vi.mock("@/server/dal/competitions", () => ({
  listActiveCompetitions: cacheState.listActiveCompetitions,
}));

vi.mock("next/cache", () => ({
  revalidateTag: cacheState.revalidateTag,
  unstable_cache: (
    load: () => Promise<ReadonlyArray<CompetitionOption>>,
    _keyParts: ReadonlyArray<string>,
    options: CacheOptions,
  ) => {
    let cachedValue: ReadonlyArray<CompetitionOption> | undefined;

    cacheState.capturedOptions = options;
    cacheState.setClearCache(() => {
      cachedValue = undefined;
    });

    return async (): Promise<ReadonlyArray<CompetitionOption>> => {
      if (!cachedValue) cachedValue = await load();
      return cachedValue;
    };
  },
}));

import {
  COMPETITION_CATALOG_CACHE_TAG,
  COMPETITION_CATALOG_REVALIDATE_SECONDS,
  getCachedActiveCompetitions,
  invalidateCompetitionCatalog,
} from "@/server/cache/competition-catalog";

const firstCatalog: ReadonlyArray<CompetitionOption> = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    code: "futve",
    name: "Liga FUTVE",
  },
];

const updatedCatalog: ReadonlyArray<CompetitionOption> = [
  {
    id: "00000000-0000-4000-8000-000000000002",
    code: "futve-2",
    name: "Liga FUTVE 2",
  },
];

describe("competition catalog cache", () => {
  beforeEach(() => {
    cacheState.clearCache();
    cacheState.listActiveCompetitions.mockReset();
    cacheState.revalidateTag.mockClear();
  });

  it("reuses the active catalog across reads", async () => {
    cacheState.listActiveCompetitions.mockResolvedValue(firstCatalog);

    const firstResult = await getCachedActiveCompetitions();
    const secondResult = await getCachedActiveCompetitions();

    expect(firstResult).toEqual(firstCatalog);
    expect(secondResult).toEqual(firstCatalog);
    expect(cacheState.listActiveCompetitions).toHaveBeenCalledTimes(1);
    expect(cacheState.capturedOptions).toEqual({
      tags: [COMPETITION_CATALOG_CACHE_TAG],
      revalidate: COMPETITION_CATALOG_REVALIDATE_SECONDS,
    });
  });

  it("loads fresh data after immediate tag invalidation", async () => {
    cacheState.listActiveCompetitions.mockResolvedValueOnce(firstCatalog);

    await getCachedActiveCompetitions();
    invalidateCompetitionCatalog();
    cacheState.listActiveCompetitions.mockResolvedValueOnce(updatedCatalog);

    await expect(getCachedActiveCompetitions()).resolves.toEqual(updatedCatalog);
    expect(cacheState.revalidateTag).toHaveBeenCalledWith(
      COMPETITION_CATALOG_CACHE_TAG,
      { expire: 0 },
    );
    expect(cacheState.listActiveCompetitions).toHaveBeenCalledTimes(2);
  });
});
