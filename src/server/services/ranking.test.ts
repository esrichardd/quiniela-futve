import { beforeEach, describe, expect, it, vi } from "vitest";

const rankingCacheMocks = vi.hoisted(() => ({
  getCachedRankingRows: vi.fn(),
}));

const poolsDalMocks = vi.hoisted(() => ({
  getPoolMembershipCore: vi.fn(),
  parsePoolRole: (value: string) => value,
}));

const sessionMocks = vi.hoisted(() => ({
  requireVerifiedAppUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/auth/session", () => ({
  requireVerifiedAppUser: sessionMocks.requireVerifiedAppUser,
}));

vi.mock("@/server/cache/ranking", () => rankingCacheMocks);

vi.mock("@/server/dal/pools", () => poolsDalMocks);

import { getPoolRanking } from "@/server/services/ranking";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";

const poolId = "00000000-0000-4000-8000-000000000001";
const appUser = { id: "user-1" };

describe("getPoolRanking", () => {
  beforeEach(() => {
    poolsDalMocks.getPoolMembershipCore.mockReset();
    rankingCacheMocks.getCachedRankingRows.mockReset();
    sessionMocks.requireVerifiedAppUser.mockReset();
    sessionMocks.requireVerifiedAppUser.mockResolvedValue(appUser);
  });

  it("propagates authentication failures without touching the DAL", async () => {
    sessionMocks.requireVerifiedAppUser.mockRejectedValue(new Error("no session"));

    await expect(getPoolRanking(poolId)).rejects.toThrow("no session");
    expect(poolsDalMocks.getPoolMembershipCore).not.toHaveBeenCalled();
  });

  it("rejects a non-member with PoolMembershipRequiredError, same as an inexistent pool", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue(null);

    await expect(getPoolRanking(poolId)).rejects.toBeInstanceOf(
      PoolMembershipRequiredError,
    );
    expect(rankingCacheMocks.getCachedRankingRows).not.toHaveBeenCalled();
  });

  it("always resolves membership using the session's user id", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue(null);

    await expect(getPoolRanking(poolId)).rejects.toBeInstanceOf(
      PoolMembershipRequiredError,
    );
    expect(poolsDalMocks.getPoolMembershipCore).toHaveBeenCalledWith(
      poolId,
      appUser.id,
    );
  });

  it("includes a membership with no calculated score yet at 0 points, not excluded", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue({
      poolName: "Quiniela",
      poolMembershipId: "membership-1",
    });
    rankingCacheMocks.getCachedRankingRows.mockResolvedValue([
      { poolMembershipId: "membership-1", displayName: "Ana", role: "player", totalPoints: 0 },
    ]);

    const view = await getPoolRanking(poolId);

    expect(view.entries).toEqual([
      {
        poolMembershipId: "membership-1",
        displayName: "Ana",
        role: "player",
        totalPoints: 0,
        rank: 1,
        isCurrentUser: true,
      },
    ]);
  });

  it("orders entries by totalPoints descending and marks the current user's row", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue({
      poolName: "Quiniela",
      poolMembershipId: "membership-2",
    });
    rankingCacheMocks.getCachedRankingRows.mockResolvedValue([
      { poolMembershipId: "membership-1", displayName: "Ana", role: "pool_admin", totalPoints: 10 },
      { poolMembershipId: "membership-2", displayName: "Beto", role: "player", totalPoints: 30 },
      { poolMembershipId: "membership-3", displayName: "Cari", role: "player", totalPoints: 20 },
    ]);

    const view = await getPoolRanking(poolId);

    expect(view.poolId).toBe(poolId);
    expect(view.poolName).toBe("Quiniela");
    expect(view.entries.map((entry) => entry.poolMembershipId)).toEqual([
      "membership-2",
      "membership-3",
      "membership-1",
    ]);
    expect(view.entries.map((entry) => entry.rank)).toEqual([1, 2, 3]);
    expect(view.entries.find((entry) => entry.poolMembershipId === "membership-2")?.isCurrentUser).toBe(
      true,
    );
    expect(
      view.entries.filter((entry) => entry.poolMembershipId !== "membership-2"),
    ).toSatisfy((others: Array<{ isCurrentUser: boolean }>) =>
      others.every((entry) => entry.isCurrentUser === false),
    );
  });

  it("gives tied memberships the same rank and skips the following rank", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue({
      poolName: "Quiniela",
      poolMembershipId: "membership-3",
    });
    rankingCacheMocks.getCachedRankingRows.mockResolvedValue([
      { poolMembershipId: "membership-1", displayName: "Ana", role: "player", totalPoints: 20 },
      { poolMembershipId: "membership-2", displayName: "Beto", role: "player", totalPoints: 20 },
      { poolMembershipId: "membership-3", displayName: "Cari", role: "player", totalPoints: 10 },
    ]);

    const view = await getPoolRanking(poolId);

    expect(view.entries.map((entry) => entry.rank)).toEqual([1, 1, 3]);
  });

  it("exposes every member's displayName and totalPoints, unlike the personal predictions read", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue({
      poolName: "Quiniela",
      poolMembershipId: "membership-2",
    });
    rankingCacheMocks.getCachedRankingRows.mockResolvedValue([
      { poolMembershipId: "membership-1", displayName: "Ana", role: "pool_admin", totalPoints: 10 },
      { poolMembershipId: "membership-2", displayName: "Beto", role: "player", totalPoints: 5 },
    ]);

    const view = await getPoolRanking(poolId);

    expect(view.entries).toHaveLength(2);
    expect(view.entries.map((entry) => entry.displayName).sort()).toEqual(["Ana", "Beto"]);
    expect(view.entries.map((entry) => entry.totalPoints).sort((a, b) => a - b)).toEqual([
      5, 10,
    ]);
  });
});
