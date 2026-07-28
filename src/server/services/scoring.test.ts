import { beforeEach, describe, expect, it, vi } from "vitest";

const dalMocks = vi.hoisted(() => ({
  listScoringRowsForMatch: vi.fn(),
  upsertMatchPredictionScores: vi.fn(),
  listComputableMatchIdsForMatchday: vi.fn(),
  listMatchdayBonusCandidateRows: vi.fn(),
  listPoolIdsWithBonusesForMatchday: vi.fn(),
  replaceMatchdayBonuses: vi.fn(),
}));

const cacheMocks = vi.hoisted(() => ({
  invalidatePoolRanking: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/dal/predictions", () => ({
  parsePredictionMode: (value: string) => value,
}));

vi.mock("@/server/dal/scoring", () => dalMocks);

vi.mock("@/server/cache/ranking", () => cacheMocks);

import {
  recomputeMatchPredictionPoints,
  recomputeMatchdayBonuses,
} from "@/server/services/scoring";

const matchId = "00000000-0000-4000-8000-000000000010";
const matchdayId = "00000000-0000-4000-8000-000000000020";

describe("recomputeMatchPredictionPoints", () => {
  beforeEach(() => {
    dalMocks.listScoringRowsForMatch.mockReset();
    dalMocks.upsertMatchPredictionScores.mockReset();
    cacheMocks.invalidatePoolRanking.mockReset();
  });

  it("does nothing when no predictions exist for the match", async () => {
    dalMocks.listScoringRowsForMatch.mockResolvedValue([]);

    await recomputeMatchPredictionPoints(matchId, { homeScore: 1, awayScore: 0 });

    expect(dalMocks.upsertMatchPredictionScores).not.toHaveBeenCalled();
    expect(cacheMocks.invalidatePoolRanking).not.toHaveBeenCalled();
  });

  it("computes points per prediction according to each pool's mode", async () => {
    dalMocks.listScoringRowsForMatch.mockResolvedValue([
      {
        poolMatchPredictionId: "prediction-simple",
        poolId: "pool-1",
        poolMembershipId: "membership-1",
        predictionMode: "simple",
        resultPoints: 1,
        exactScorePoints: null,
        predictedResult: "home",
        predictedHomeScore: null,
        predictedAwayScore: null,
      },
      {
        poolMatchPredictionId: "prediction-mixed-exact",
        poolId: "pool-2",
        poolMembershipId: "membership-2",
        predictionMode: "mixed",
        resultPoints: 1,
        exactScorePoints: 3,
        predictedResult: null,
        predictedHomeScore: 2,
        predictedAwayScore: 0,
      },
      {
        poolMatchPredictionId: "prediction-score-wrong",
        poolId: "pool-3",
        poolMembershipId: "membership-3",
        predictionMode: "score",
        resultPoints: null,
        exactScorePoints: 3,
        predictedResult: null,
        predictedHomeScore: 0,
        predictedAwayScore: 0,
      },
    ]);
    dalMocks.upsertMatchPredictionScores.mockResolvedValue(undefined);

    await recomputeMatchPredictionPoints(matchId, { homeScore: 2, awayScore: 0 });

    expect(dalMocks.upsertMatchPredictionScores).toHaveBeenCalledTimes(1);
    const [inputs] = dalMocks.upsertMatchPredictionScores.mock.calls[0];
    expect(inputs).toEqual([
      expect.objectContaining({
        poolMatchPredictionId: "prediction-simple",
        pointsEarned: 1,
        wasExactScore: false,
      }),
      expect.objectContaining({
        poolMatchPredictionId: "prediction-mixed-exact",
        pointsEarned: 3,
        wasExactScore: true,
      }),
      expect.objectContaining({
        poolMatchPredictionId: "prediction-score-wrong",
        pointsEarned: 0,
        wasExactScore: false,
      }),
    ]);

    // The same match can be predicted across several pools; every one of
    // them needs its cached ranking invalidated.
    expect(cacheMocks.invalidatePoolRanking).toHaveBeenCalledTimes(3);
    expect(cacheMocks.invalidatePoolRanking).toHaveBeenCalledWith("pool-1");
    expect(cacheMocks.invalidatePoolRanking).toHaveBeenCalledWith("pool-2");
    expect(cacheMocks.invalidatePoolRanking).toHaveBeenCalledWith("pool-3");
  });

  it("invalidates a pool's ranking only once even with several predictions in it", async () => {
    dalMocks.listScoringRowsForMatch.mockResolvedValue([
      {
        poolMatchPredictionId: "prediction-1",
        poolId: "pool-1",
        poolMembershipId: "membership-1",
        predictionMode: "simple",
        resultPoints: 1,
        exactScorePoints: null,
        predictedResult: "home",
        predictedHomeScore: null,
        predictedAwayScore: null,
      },
      {
        poolMatchPredictionId: "prediction-2",
        poolId: "pool-1",
        poolMembershipId: "membership-2",
        predictionMode: "simple",
        resultPoints: 1,
        exactScorePoints: null,
        predictedResult: "away",
        predictedHomeScore: null,
        predictedAwayScore: null,
      },
    ]);
    dalMocks.upsertMatchPredictionScores.mockResolvedValue(undefined);

    await recomputeMatchPredictionPoints(matchId, { homeScore: 1, awayScore: 0 });

    expect(cacheMocks.invalidatePoolRanking).toHaveBeenCalledTimes(1);
    expect(cacheMocks.invalidatePoolRanking).toHaveBeenCalledWith("pool-1");
  });

  it("recomputes without accumulating when a result is corrected", async () => {
    const row = {
      poolMatchPredictionId: "prediction-1",
      poolId: "pool-1",
      poolMembershipId: "membership-1",
      predictionMode: "score",
      resultPoints: null,
      exactScorePoints: 3,
      predictedResult: null,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    };
    dalMocks.listScoringRowsForMatch.mockResolvedValue([row]);
    dalMocks.upsertMatchPredictionScores.mockResolvedValue(undefined);

    // Original result: an exact match earns the full exact score points.
    await recomputeMatchPredictionPoints(matchId, { homeScore: 2, awayScore: 1 });
    const [firstInputs] = dalMocks.upsertMatchPredictionScores.mock.calls[0];
    expect(firstInputs[0]).toEqual(
      expect.objectContaining({ pointsEarned: 3, wasExactScore: true }),
    );

    // Correction: the same prediction is no longer exact, so it must drop to 0,
    // not add on top of the previous 3 points.
    await recomputeMatchPredictionPoints(matchId, { homeScore: 3, awayScore: 1 });
    const [secondInputs] = dalMocks.upsertMatchPredictionScores.mock.calls[1];
    expect(secondInputs[0]).toEqual(
      expect.objectContaining({ pointsEarned: 0, wasExactScore: false }),
    );
  });
});

describe("recomputeMatchdayBonuses", () => {
  beforeEach(() => {
    dalMocks.listComputableMatchIdsForMatchday.mockReset();
    dalMocks.listMatchdayBonusCandidateRows.mockReset();
    dalMocks.listPoolIdsWithBonusesForMatchday.mockReset();
    dalMocks.replaceMatchdayBonuses.mockReset();
    cacheMocks.invalidatePoolRanking.mockReset();
  });

  it("clears bonuses without querying candidates when there are no computable matches, invalidating the pools that lost their bonus", async () => {
    dalMocks.listComputableMatchIdsForMatchday.mockResolvedValue([]);
    dalMocks.listPoolIdsWithBonusesForMatchday.mockResolvedValue(["pool-1", "pool-2"]);
    dalMocks.replaceMatchdayBonuses.mockResolvedValue(undefined);

    await recomputeMatchdayBonuses(matchdayId);

    expect(dalMocks.listMatchdayBonusCandidateRows).not.toHaveBeenCalled();
    expect(dalMocks.listPoolIdsWithBonusesForMatchday).toHaveBeenCalledWith(matchdayId);
    expect(dalMocks.replaceMatchdayBonuses).toHaveBeenCalledWith(matchdayId, []);
    expect(cacheMocks.invalidatePoolRanking).toHaveBeenCalledTimes(2);
    expect(cacheMocks.invalidatePoolRanking).toHaveBeenCalledWith("pool-1");
    expect(cacheMocks.invalidatePoolRanking).toHaveBeenCalledWith("pool-2");
  });

  it("does nothing to the ranking cache when no computable matches and no pool held a bonus", async () => {
    dalMocks.listComputableMatchIdsForMatchday.mockResolvedValue([]);
    dalMocks.listPoolIdsWithBonusesForMatchday.mockResolvedValue([]);
    dalMocks.replaceMatchdayBonuses.mockResolvedValue(undefined);

    await recomputeMatchdayBonuses(matchdayId);

    expect(cacheMocks.invalidatePoolRanking).not.toHaveBeenCalled();
  });

  it("awards the bonus to a membership with every computable match exact, invalidating that pool's ranking", async () => {
    dalMocks.listComputableMatchIdsForMatchday.mockResolvedValue(["match-1", "match-2"]);
    dalMocks.listMatchdayBonusCandidateRows.mockResolvedValue([
      {
        poolId: "pool-1",
        competitionSeasonId: "season-1",
        poolMembershipId: "membership-1",
        matchId: "match-1",
        perfectMatchdayBonusPoints: 10,
        wasExactScore: true,
      },
      {
        poolId: "pool-1",
        competitionSeasonId: "season-1",
        poolMembershipId: "membership-1",
        matchId: "match-2",
        perfectMatchdayBonusPoints: 10,
        wasExactScore: true,
      },
    ]);
    dalMocks.replaceMatchdayBonuses.mockResolvedValue(undefined);

    await recomputeMatchdayBonuses(matchdayId);

    expect(dalMocks.replaceMatchdayBonuses).toHaveBeenCalledWith(matchdayId, [
      expect.objectContaining({
        poolId: "pool-1",
        competitionSeasonId: "season-1",
        poolMembershipId: "membership-1",
        matchdayId,
        pointsAwarded: 10,
      }),
    ]);
    expect(cacheMocks.invalidatePoolRanking).toHaveBeenCalledTimes(1);
    expect(cacheMocks.invalidatePoolRanking).toHaveBeenCalledWith("pool-1");
  });

  it("does not award the bonus when one computable match was not exact", async () => {
    dalMocks.listComputableMatchIdsForMatchday.mockResolvedValue(["match-1", "match-2"]);
    dalMocks.listMatchdayBonusCandidateRows.mockResolvedValue([
      {
        poolId: "pool-1",
        competitionSeasonId: "season-1",
        poolMembershipId: "membership-1",
        matchId: "match-1",
        perfectMatchdayBonusPoints: 10,
        wasExactScore: true,
      },
      {
        poolId: "pool-1",
        competitionSeasonId: "season-1",
        poolMembershipId: "membership-1",
        matchId: "match-2",
        perfectMatchdayBonusPoints: 10,
        wasExactScore: false,
      },
    ]);
    dalMocks.replaceMatchdayBonuses.mockResolvedValue(undefined);

    await recomputeMatchdayBonuses(matchdayId);

    expect(dalMocks.replaceMatchdayBonuses).toHaveBeenCalledWith(matchdayId, []);
  });

  it("does not award the bonus when the membership has no prediction for a computable match", async () => {
    dalMocks.listComputableMatchIdsForMatchday.mockResolvedValue(["match-1", "match-2"]);
    dalMocks.listMatchdayBonusCandidateRows.mockResolvedValue([
      {
        poolId: "pool-1",
        competitionSeasonId: "season-1",
        poolMembershipId: "membership-1",
        matchId: "match-1",
        perfectMatchdayBonusPoints: 10,
        wasExactScore: true,
      },
      // No row at all for match-2: the membership never predicted it.
    ]);
    dalMocks.replaceMatchdayBonuses.mockResolvedValue(undefined);

    await recomputeMatchdayBonuses(matchdayId);

    expect(dalMocks.replaceMatchdayBonuses).toHaveBeenCalledWith(matchdayId, []);
  });

  it("keeps bonuses independent across memberships, awarding only the perfect one", async () => {
    dalMocks.listComputableMatchIdsForMatchday.mockResolvedValue(["match-1"]);
    dalMocks.listMatchdayBonusCandidateRows.mockResolvedValue([
      {
        poolId: "pool-1",
        competitionSeasonId: "season-1",
        poolMembershipId: "membership-perfect",
        matchId: "match-1",
        perfectMatchdayBonusPoints: 10,
        wasExactScore: true,
      },
      {
        poolId: "pool-1",
        competitionSeasonId: "season-1",
        poolMembershipId: "membership-not-perfect",
        matchId: "match-1",
        perfectMatchdayBonusPoints: 10,
        wasExactScore: false,
      },
    ]);
    dalMocks.replaceMatchdayBonuses.mockResolvedValue(undefined);

    await recomputeMatchdayBonuses(matchdayId);

    const [, records] = dalMocks.replaceMatchdayBonuses.mock.calls[0];
    expect(records).toHaveLength(1);
    expect(records[0]).toEqual(
      expect.objectContaining({ poolMembershipId: "membership-perfect" }),
    );
  });
});
