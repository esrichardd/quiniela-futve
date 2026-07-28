import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RankingRowRecord } from "@/server/dal/ranking";

type CacheOptions = Readonly<{
  tags?: ReadonlyArray<string>;
  revalidate?: number | false;
}>;

/**
 * A minimal in-memory stand-in for Next's real cache store, keyed by the
 * `keyParts` + call arguments (mirroring how `unstable_cache` really works:
 * the cache is keyed by identity of key/args, not by the JS closure, which
 * is exactly why the real `getCachedRankingRows` implementation can create
 * a fresh `unstable_cache(...)` wrapper on every call and still hit the
 * same entry for the same `poolId`).
 */
const cacheState = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const tagsByKey = new Map<string, Set<string>>();

  return {
    listRankingRowsForPool: vi.fn(),
    reset(): void {
      store.clear();
      tagsByKey.clear();
    },
    get(key: string): unknown {
      return store.get(key);
    },
    has(key: string): boolean {
      return store.has(key);
    },
    set(key: string, value: unknown, tags: ReadonlyArray<string>): void {
      store.set(key, value);
      tagsByKey.set(key, new Set(tags));
    },
    revalidateTag(tag: string): void {
      for (const [key, tags] of tagsByKey) {
        if (tags.has(tag)) store.delete(key);
      }
    },
  };
});

vi.mock("server-only", () => ({}));

vi.mock("@/server/dal/ranking", () => ({
  listRankingRowsForPool: cacheState.listRankingRowsForPool,
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn((tag: string) => cacheState.revalidateTag(tag)),
  unstable_cache: (
    load: (id: string) => Promise<ReadonlyArray<RankingRowRecord>>,
    keyParts: ReadonlyArray<string>,
    options: CacheOptions,
  ) => {
    return async (id: string): Promise<ReadonlyArray<RankingRowRecord>> => {
      const key = JSON.stringify([keyParts, id]);
      if (cacheState.has(key)) {
        return cacheState.get(key) as ReadonlyArray<RankingRowRecord>;
      }
      const value = await load(id);
      cacheState.set(key, value, options.tags ?? []);
      return value;
    };
  },
}));

import {
  getCachedRankingRows,
  invalidatePoolRanking,
  poolRankingCacheTag,
} from "@/server/cache/ranking";

const poolId = "00000000-0000-4000-8000-000000000001";
const otherPoolId = "00000000-0000-4000-8000-000000000002";

const firstRows: ReadonlyArray<RankingRowRecord> = [
  { poolMembershipId: "membership-1", displayName: "Ana", role: "player", totalPoints: 10 },
];

const updatedRows: ReadonlyArray<RankingRowRecord> = [
  { poolMembershipId: "membership-1", displayName: "Ana", role: "player", totalPoints: 13 },
];

describe("pool ranking cache", () => {
  beforeEach(() => {
    cacheState.reset();
    cacheState.listRankingRowsForPool.mockReset();
  });

  it("reuses the cached rows across reads for the same pool", async () => {
    cacheState.listRankingRowsForPool.mockResolvedValue(firstRows);

    const first = await getCachedRankingRows(poolId);
    const second = await getCachedRankingRows(poolId);

    expect(first).toEqual(firstRows);
    expect(second).toEqual(firstRows);
    expect(cacheState.listRankingRowsForPool).toHaveBeenCalledTimes(1);
  });

  it("keeps separate cache entries per pool", async () => {
    cacheState.listRankingRowsForPool.mockImplementation((id: string) =>
      Promise.resolve(id === poolId ? firstRows : []),
    );

    await getCachedRankingRows(poolId);
    await getCachedRankingRows(otherPoolId);

    expect(cacheState.listRankingRowsForPool).toHaveBeenCalledTimes(2);
    expect(cacheState.listRankingRowsForPool).toHaveBeenNthCalledWith(1, poolId);
    expect(cacheState.listRankingRowsForPool).toHaveBeenNthCalledWith(2, otherPoolId);
  });

  it("loads fresh rows after invalidating the pool's tag, without affecting other pools", async () => {
    cacheState.listRankingRowsForPool.mockResolvedValue(firstRows);
    await getCachedRankingRows(poolId);
    await getCachedRankingRows(otherPoolId);

    invalidatePoolRanking(poolId);
    cacheState.listRankingRowsForPool.mockResolvedValue(updatedRows);

    await expect(getCachedRankingRows(poolId)).resolves.toEqual(updatedRows);
    // The other pool's cache entry was untouched by the invalidation above.
    await expect(getCachedRankingRows(otherPoolId)).resolves.toEqual(firstRows);
  });

  it("tags each pool's cache entry with its own pool-scoped tag", () => {
    expect(poolRankingCacheTag(poolId)).toBe(`pool-ranking-${poolId}`);
    expect(poolRankingCacheTag(otherPoolId)).toBe(`pool-ranking-${otherPoolId}`);
  });
});
