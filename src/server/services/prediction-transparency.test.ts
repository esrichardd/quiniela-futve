import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PredictionTransparencyRow } from "@/server/dal/prediction-transparency";

const dalMocks = vi.hoisted(() => ({
  listPredictionTransparencyRowsForPool: vi.fn(),
}));

const poolsDalMocks = vi.hoisted(() => ({
  getPoolMembershipCore: vi.fn(),
}));

const sessionMocks = vi.hoisted(() => ({
  requireVerifiedAppUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/auth/session", () => ({
  requireVerifiedAppUser: sessionMocks.requireVerifiedAppUser,
}));

vi.mock("@/server/dal/pools", () => poolsDalMocks);

vi.mock("@/server/dal/prediction-transparency", () => dalMocks);

vi.mock("@/server/dal/predictions", () => ({
  parseMatchStatus: (value: string) => value,
}));

import { getPoolPredictionTransparency } from "@/server/services/prediction-transparency";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";

const poolId = "00000000-0000-4000-8000-000000000001";
const appUser = { id: "user-1" };
const matchId = "match-1";
const matchdayId = "matchday-1";

// Fixed reference instant. Predictions close 60 minutes before `startsAt`.
const now = new Date("2026-08-01T20:00:00.000Z");
const NOT_REVEALED_STARTS_AT = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2h: closes in 1h
const REVEALED_NOT_PLAYED_STARTS_AT = new Date(now.getTime() + 30 * 60 * 1000); // +30m: closed 30m ago
const FINISHED_STARTS_AT = new Date(now.getTime() - 3 * 60 * 60 * 1000); // -3h: long closed

function baseRow(overrides: Partial<PredictionTransparencyRow>): PredictionTransparencyRow {
  return {
    poolId,
    poolName: "Quiniela de prueba",
    competitionName: "Liga de Prueba",
    seasonName: "Temporada de Prueba 2026",
    predictionMode: "mixed",
    poolMembershipId: "membership-1",
    displayName: "Ana",
    matchdayId,
    matchdayNumber: 1,
    matchdayName: null,
    matchdayStatus: "published",
    matchId,
    homeTeamName: "Local FC",
    homeTeamShortName: "LOC",
    awayTeamName: "Away FC",
    awayTeamShortName: "AWA",
    startsAt: REVEALED_NOT_PLAYED_STARTS_AT,
    matchStatus: "scheduled",
    homeScore: null,
    awayScore: null,
    predictedResult: null,
    predictedHomeScore: null,
    predictedAwayScore: null,
    pointsEarned: null,
    wasExactScore: null,
    perfectMatchdayBonusPoints: null,
    ...overrides,
  };
}

describe("getPoolPredictionTransparency", () => {
  beforeEach(() => {
    dalMocks.listPredictionTransparencyRowsForPool.mockReset();
    poolsDalMocks.getPoolMembershipCore.mockReset();
    sessionMocks.requireVerifiedAppUser.mockReset();
    sessionMocks.requireVerifiedAppUser.mockResolvedValue(appUser);
  });

  it("propagates authentication failures without touching the DAL", async () => {
    sessionMocks.requireVerifiedAppUser.mockRejectedValue(new Error("no session"));

    await expect(getPoolPredictionTransparency(poolId)).rejects.toThrow("no session");
    expect(poolsDalMocks.getPoolMembershipCore).not.toHaveBeenCalled();
  });

  it("rejects a non-member with PoolMembershipRequiredError, same as an inexistent pool", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue(null);

    await expect(getPoolPredictionTransparency(poolId)).rejects.toBeInstanceOf(
      PoolMembershipRequiredError,
    );
    expect(dalMocks.listPredictionTransparencyRowsForPool).not.toHaveBeenCalled();
  });

  it("always resolves membership using the session's user id", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue(null);

    await expect(getPoolPredictionTransparency(poolId)).rejects.toBeInstanceOf(
      PoolMembershipRequiredError,
    );
    expect(poolsDalMocks.getPoolMembershipCore).toHaveBeenCalledWith(poolId, appUser.id);
  });

  it("throws PoolMembershipRequiredError if the DAL unexpectedly returns no rows despite a verified membership", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue({
      poolName: "Quiniela",
      poolMembershipId: "membership-1",
    });
    dalMocks.listPredictionTransparencyRowsForPool.mockResolvedValue([]);

    await expect(getPoolPredictionTransparency(poolId)).rejects.toBeInstanceOf(
      PoolMembershipRequiredError,
    );
  });

  it("returns an empty, well-formed view when the pool has no visible matchdays yet", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue({
      poolName: "Quiniela de prueba",
      poolMembershipId: "membership-1",
    });
    dalMocks.listPredictionTransparencyRowsForPool.mockResolvedValue([
      baseRow({
        matchdayId: null,
        matchdayNumber: null,
        matchdayName: null,
        matchdayStatus: null,
        matchId: null,
        homeTeamName: null,
        homeTeamShortName: null,
        awayTeamName: null,
        awayTeamShortName: null,
        startsAt: null,
        matchStatus: null,
      }),
    ]);

    const view = await getPoolPredictionTransparency(poolId, undefined, now);

    expect(view.poolName).toBe("Quiniela de prueba");
    expect(view.competitionName).toBe("Liga de Prueba");
    expect(view.matchdays).toEqual([]);
    expect(view.selectedMatchdayId).toBeNull();
  });

  it("hides every member's pick for a match whose prediction window is still open", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue({
      poolName: "Quiniela",
      poolMembershipId: "membership-1",
    });
    dalMocks.listPredictionTransparencyRowsForPool.mockResolvedValue([
      baseRow({
        poolMembershipId: "membership-1",
        displayName: "Ana",
        startsAt: NOT_REVEALED_STARTS_AT,
        predictedResult: "home",
      }),
      baseRow({
        poolMembershipId: "membership-2",
        displayName: "Beto",
        startsAt: NOT_REVEALED_STARTS_AT,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      }),
    ]);

    const view = await getPoolPredictionTransparency(poolId, undefined, now);
    const match = view.matchdays[0].matches[0];

    expect(match.isRevealed).toBe(false);
    expect(match.members).toEqual([]);
  });

  it("reveals picks once the window closes, even before the match is played, without correctness info", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue({
      poolName: "Quiniela",
      poolMembershipId: "membership-1",
    });
    dalMocks.listPredictionTransparencyRowsForPool.mockResolvedValue([
      baseRow({
        poolMembershipId: "membership-1",
        displayName: "Ana",
        startsAt: REVEALED_NOT_PLAYED_STARTS_AT,
        matchStatus: "scheduled",
        predictedResult: "home",
      }),
      baseRow({
        poolMembershipId: "membership-2",
        displayName: "Beto",
        startsAt: REVEALED_NOT_PLAYED_STARTS_AT,
        matchStatus: "scheduled",
        predictedHomeScore: null,
        predictedAwayScore: null,
      }),
    ]);

    const view = await getPoolPredictionTransparency(poolId, undefined, now);
    const match = view.matchdays[0].matches[0];

    expect(match.isRevealed).toBe(true);
    expect(match.members).toHaveLength(2);
    const ana = match.members.find((m) => m.poolMembershipId === "membership-1");
    const beto = match.members.find((m) => m.poolMembershipId === "membership-2");
    expect(ana?.prediction).toEqual({ kind: "result", result: "home" });
    expect(ana?.pointsEarned).toBeNull();
    expect(ana?.wasExactScore).toBeNull();
    // Beto never submitted a prediction, but he still shows up in the list.
    expect(beto?.prediction).toBeNull();
  });

  it("shows per-member correctness once the match is finished, and lists the perfect matchday bonus only when the matchday is finished", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue({
      poolName: "Quiniela",
      poolMembershipId: "membership-1",
    });
    dalMocks.listPredictionTransparencyRowsForPool.mockResolvedValue([
      baseRow({
        poolMembershipId: "membership-1",
        displayName: "Ana",
        matchdayStatus: "finished",
        startsAt: FINISHED_STARTS_AT,
        matchStatus: "finished",
        homeScore: 2,
        awayScore: 1,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        pointsEarned: 3,
        wasExactScore: true,
        perfectMatchdayBonusPoints: 5,
      }),
      baseRow({
        poolMembershipId: "membership-2",
        displayName: "Beto",
        matchdayStatus: "finished",
        startsAt: FINISHED_STARTS_AT,
        matchStatus: "finished",
        homeScore: 2,
        awayScore: 1,
        predictedHomeScore: 0,
        predictedAwayScore: 0,
        pointsEarned: 0,
        wasExactScore: false,
        perfectMatchdayBonusPoints: null,
      }),
    ]);

    const view = await getPoolPredictionTransparency(poolId, undefined, now);
    const matchday = view.matchdays[0];
    const match = matchday.matches[0];

    const ana = match.members.find((m) => m.poolMembershipId === "membership-1");
    const beto = match.members.find((m) => m.poolMembershipId === "membership-2");
    expect(ana?.prediction).toEqual({ kind: "score", homeScore: 2, awayScore: 1 });
    expect(ana?.pointsEarned).toBe(3);
    expect(ana?.wasExactScore).toBe(true);
    expect(beto?.pointsEarned).toBe(0);
    expect(beto?.wasExactScore).toBe(false);

    expect(matchday.status).toBe("finished");
    expect(matchday.perfectMatchdayMembershipIds).toEqual(["membership-1"]);
    expect(match.homeScore).toBe(2);
    expect(match.awayScore).toBe(1);
  });

  it("never lists a perfect matchday bonus while the matchday is still published, even if a row carries one", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue({
      poolName: "Quiniela",
      poolMembershipId: "membership-1",
    });
    dalMocks.listPredictionTransparencyRowsForPool.mockResolvedValue([
      baseRow({
        poolMembershipId: "membership-1",
        matchdayStatus: "published",
        startsAt: FINISHED_STARTS_AT,
        matchStatus: "finished",
        pointsEarned: 3,
        wasExactScore: true,
        // A stray non-null value here should never happen in production
        // (bonuses only exist once the matchday is finished), but the
        // service must not trust it regardless.
        perfectMatchdayBonusPoints: 5,
      }),
    ]);

    const view = await getPoolPredictionTransparency(poolId, undefined, now);

    expect(view.matchdays[0].perfectMatchdayMembershipIds).toEqual([]);
  });

  it("honors a valid selectedMatchdayId and falls back to the first matchday otherwise", async () => {
    poolsDalMocks.getPoolMembershipCore.mockResolvedValue({
      poolName: "Quiniela",
      poolMembershipId: "membership-1",
    });
    dalMocks.listPredictionTransparencyRowsForPool.mockResolvedValue([
      baseRow({ matchdayId: "matchday-1", matchdayNumber: 1, matchId: "match-1" }),
      baseRow({ matchdayId: "matchday-2", matchdayNumber: 2, matchId: "match-2" }),
    ]);

    const defaultView = await getPoolPredictionTransparency(poolId, undefined, now);
    expect(defaultView.selectedMatchdayId).toBe("matchday-1");

    dalMocks.listPredictionTransparencyRowsForPool.mockResolvedValue([
      baseRow({ matchdayId: "matchday-1", matchdayNumber: 1, matchId: "match-1" }),
      baseRow({ matchdayId: "matchday-2", matchdayNumber: 2, matchId: "match-2" }),
    ]);
    const selectedView = await getPoolPredictionTransparency(poolId, "matchday-2", now);
    expect(selectedView.selectedMatchdayId).toBe("matchday-2");

    dalMocks.listPredictionTransparencyRowsForPool.mockResolvedValue([
      baseRow({ matchdayId: "matchday-1", matchdayNumber: 1, matchId: "match-1" }),
    ]);
    const invalidSelectionView = await getPoolPredictionTransparency(
      poolId,
      "does-not-exist",
      now,
    );
    expect(invalidSelectionView.selectedMatchdayId).toBe("matchday-1");
  });
});
