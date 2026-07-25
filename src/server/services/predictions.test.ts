import { beforeEach, describe, expect, it, vi } from "vitest";

const dalMocks = vi.hoisted(() => ({
  listPoolMatchPredictionRowsForUser: vi.fn(),
  getPredictionWriteMembershipContext: vi.fn(),
  getPredictionWriteMatchContext: vi.fn(),
  upsertPoolMatchPredictionRecords: vi.fn(),
}));

const sessionMocks = vi.hoisted(() => ({
  requireVerifiedAppUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/auth/session", () => ({
  requireVerifiedAppUser: sessionMocks.requireVerifiedAppUser,
}));

vi.mock("@/server/dal/predictions", () => ({
  ...dalMocks,
  parseMatchdayStatus: (value: string) => value,
  parseMatchStatus: (value: string) => value,
  parsePredictionMode: (value: string) => value,
}));

import {
  getCurrentUserPoolPredictions,
  savePredictions,
} from "@/server/services/predictions";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";

const poolId = "00000000-0000-4000-8000-000000000001";
const matchId = "00000000-0000-4000-8000-000000000002";
const otherMatchId = "00000000-0000-4000-8000-000000000003";
const appUser = { id: "user-1" };

// Comfortably beyond PREDICTION_LOCK_BUFFER_MINUTES (60) before kickoff,
// so these contexts represent a match whose prediction window is open.
const OPEN_STARTS_AT_OFFSET_MS = 2 * 60 * 60 * 1000;

const futureContext = {
  matchdayStatus: "published",
  matchStatus: "scheduled",
  startsAt: new Date(Date.now() + OPEN_STARTS_AT_OFFSET_MS),
};

describe("savePredictions", () => {
  beforeEach(() => {
    dalMocks.listPoolMatchPredictionRowsForUser.mockReset();
    dalMocks.getPredictionWriteMembershipContext.mockReset();
    dalMocks.getPredictionWriteMatchContext.mockReset();
    dalMocks.upsertPoolMatchPredictionRecords.mockReset();
    sessionMocks.requireVerifiedAppUser.mockReset();
    sessionMocks.requireVerifiedAppUser.mockResolvedValue(appUser);
  });

  it("propagates authentication failures without touching the DAL", async () => {
    sessionMocks.requireVerifiedAppUser.mockRejectedValue(new Error("no session"));

    await expect(
      savePredictions(poolId, [{ matchId, payload: { kind: "result", result: "home" } }]),
    ).rejects.toThrow("no session");
    expect(dalMocks.getPredictionWriteMembershipContext).not.toHaveBeenCalled();
  });

  it("rejects a non-member with PoolMembershipRequiredError", async () => {
    dalMocks.getPredictionWriteMembershipContext.mockResolvedValue(null);

    await expect(
      savePredictions(poolId, [{ matchId, payload: { kind: "result", result: "home" } }]),
    ).rejects.toBeInstanceOf(PoolMembershipRequiredError);
    expect(dalMocks.getPredictionWriteMatchContext).not.toHaveBeenCalled();
  });

  it("always resolves the membership using the session's user id", async () => {
    dalMocks.getPredictionWriteMembershipContext.mockResolvedValue(null);

    await expect(
      savePredictions(poolId, [{ matchId, payload: { kind: "result", result: "home" } }]),
    ).rejects.toBeInstanceOf(PoolMembershipRequiredError);
    expect(dalMocks.getPredictionWriteMembershipContext).toHaveBeenCalledWith(
      poolId,
      appUser.id,
    );
  });

  it("marks a match from another season as match_unavailable without blocking the rest of the batch", async () => {
    dalMocks.getPredictionWriteMembershipContext.mockResolvedValue({
      poolMembershipId: "membership-1",
      competitionSeasonId: "season-1",
      predictionMode: "simple",
    });
    dalMocks.getPredictionWriteMatchContext.mockImplementation((id: string) =>
      Promise.resolve(id === matchId ? null : futureContext),
    );
    dalMocks.upsertPoolMatchPredictionRecords.mockResolvedValue(undefined);

    const outcomes = await savePredictions(poolId, [
      { matchId, payload: { kind: "result", result: "home" } },
      { matchId: otherMatchId, payload: { kind: "result", result: "away" } },
    ]);

    expect(outcomes[matchId]).toEqual({ status: "error", error: "match_unavailable" });
    expect(outcomes[otherMatchId]).toEqual({ status: "saved" });
    expect(dalMocks.upsertPoolMatchPredictionRecords).toHaveBeenCalledWith([
      expect.objectContaining({ matchId: otherMatchId }),
    ]);
  });

  it("marks a closed match as prediction_locked while a later match stays editable", async () => {
    dalMocks.getPredictionWriteMembershipContext.mockResolvedValue({
      poolMembershipId: "membership-1",
      competitionSeasonId: "season-1",
      predictionMode: "simple",
    });
    dalMocks.getPredictionWriteMatchContext.mockImplementation((id: string) =>
      Promise.resolve(
        id === matchId
          ? { matchdayStatus: "published", matchStatus: "finished", startsAt: new Date(0) }
          : futureContext,
      ),
    );
    dalMocks.upsertPoolMatchPredictionRecords.mockResolvedValue(undefined);

    const outcomes = await savePredictions(poolId, [
      { matchId, payload: { kind: "result", result: "home" } },
      { matchId: otherMatchId, payload: { kind: "result", result: "away" } },
    ]);

    expect(outcomes[matchId]).toEqual({ status: "error", error: "prediction_locked" });
    expect(outcomes[otherMatchId]).toEqual({ status: "saved" });
  });

  it("marks a manipulated mode as prediction_mode_mismatch", async () => {
    dalMocks.getPredictionWriteMembershipContext.mockResolvedValue({
      poolMembershipId: "membership-1",
      competitionSeasonId: "season-1",
      predictionMode: "simple",
    });
    dalMocks.getPredictionWriteMatchContext.mockResolvedValue(futureContext);

    const outcomes = await savePredictions(poolId, [
      { matchId, payload: { kind: "score", homeScore: 1, awayScore: 0 } },
    ]);

    expect(outcomes[matchId]).toEqual({
      status: "error",
      error: "prediction_mode_mismatch",
    });
    expect(dalMocks.upsertPoolMatchPredictionRecords).not.toHaveBeenCalled();
  });

  it("saves every valid item atomically in a single call", async () => {
    dalMocks.getPredictionWriteMembershipContext.mockResolvedValue({
      poolMembershipId: "membership-1",
      competitionSeasonId: "season-1",
      predictionMode: "score",
    });
    dalMocks.getPredictionWriteMatchContext.mockResolvedValue(futureContext);
    dalMocks.upsertPoolMatchPredictionRecords.mockResolvedValue(undefined);

    const outcomes = await savePredictions(poolId, [
      { matchId, payload: { kind: "score", homeScore: 2, awayScore: 1 } },
      { matchId: otherMatchId, payload: { kind: "score", homeScore: 0, awayScore: 0 } },
    ]);

    expect(outcomes[matchId]).toEqual({ status: "saved" });
    expect(outcomes[otherMatchId]).toEqual({ status: "saved" });
    expect(dalMocks.upsertPoolMatchPredictionRecords).toHaveBeenCalledTimes(1);
    expect(dalMocks.upsertPoolMatchPredictionRecords).toHaveBeenCalledWith([
      expect.objectContaining({ matchId, predictedHomeScore: 2, predictedAwayScore: 1 }),
      expect.objectContaining({
        matchId: otherMatchId,
        predictedHomeScore: 0,
        predictedAwayScore: 0,
      }),
    ]);
  });

  it("marks all valid items as save_failed when the atomic batch write fails", async () => {
    dalMocks.getPredictionWriteMembershipContext.mockResolvedValue({
      poolMembershipId: "membership-1",
      competitionSeasonId: "season-1",
      predictionMode: "simple",
    });
    dalMocks.getPredictionWriteMatchContext.mockResolvedValue(futureContext);
    dalMocks.upsertPoolMatchPredictionRecords.mockRejectedValue(new Error("db down"));

    const outcomes = await savePredictions(poolId, [
      { matchId, payload: { kind: "result", result: "home" } },
      { matchId: otherMatchId, payload: { kind: "result", result: "away" } },
    ]);

    expect(outcomes[matchId]).toEqual({ status: "error", error: "save_failed" });
    expect(outcomes[otherMatchId]).toEqual({ status: "error", error: "save_failed" });
  });

  it("is safe to retry the same batch", async () => {
    dalMocks.getPredictionWriteMembershipContext.mockResolvedValue({
      poolMembershipId: "membership-1",
      competitionSeasonId: "season-1",
      predictionMode: "simple",
    });
    dalMocks.getPredictionWriteMatchContext.mockResolvedValue(futureContext);
    dalMocks.upsertPoolMatchPredictionRecords.mockResolvedValue(undefined);

    const items = [{ matchId, payload: { kind: "result" as const, result: "home" as const } }];
    const first = await savePredictions(poolId, items);
    const second = await savePredictions(poolId, items);

    expect(first[matchId]).toEqual({ status: "saved" });
    expect(second[matchId]).toEqual({ status: "saved" });
    expect(dalMocks.upsertPoolMatchPredictionRecords).toHaveBeenCalledTimes(2);
  });
});

describe("getCurrentUserPoolPredictions", () => {
  beforeEach(() => {
    dalMocks.listPoolMatchPredictionRowsForUser.mockReset();
    sessionMocks.requireVerifiedAppUser.mockReset();
    sessionMocks.requireVerifiedAppUser.mockResolvedValue(appUser);
  });

  it("throws PoolMembershipRequiredError when the user has no membership", async () => {
    dalMocks.listPoolMatchPredictionRowsForUser.mockResolvedValue([]);

    await expect(getCurrentUserPoolPredictions(poolId)).rejects.toBeInstanceOf(
      PoolMembershipRequiredError,
    );
  });

  it("scopes the read to the authenticated user, never another member", async () => {
    dalMocks.listPoolMatchPredictionRowsForUser.mockResolvedValue([
      {
        poolId,
        poolName: "Quiniela",
        competitionName: "Liga",
        seasonName: "2026",
        predictionMode: "simple",
        poolMembershipId: "membership-1",
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
        predictedResult: null,
        predictedHomeScore: null,
        predictedAwayScore: null,
      },
    ]);

    await getCurrentUserPoolPredictions(poolId);

    expect(dalMocks.listPoolMatchPredictionRowsForUser).toHaveBeenCalledWith(
      poolId,
      appUser.id,
    );
  });

  it("marks a future scheduled match as editable with no prediction yet", async () => {
    const startsAt = new Date(Date.now() + OPEN_STARTS_AT_OFFSET_MS);
    dalMocks.listPoolMatchPredictionRowsForUser.mockResolvedValue([
      {
        poolId,
        poolName: "Quiniela",
        competitionName: "Liga",
        seasonName: "2026",
        predictionMode: "simple",
        poolMembershipId: "membership-1",
        matchdayId: "matchday-1",
        matchdayNumber: 1,
        matchdayName: null,
        matchdayStatus: "published",
        matchId,
        homeTeamName: "Local FC",
        homeTeamShortName: "LOC",
        awayTeamName: "Away FC",
        awayTeamShortName: "AWA",
        startsAt,
        matchStatus: "scheduled",
        predictedResult: null,
        predictedHomeScore: null,
        predictedAwayScore: null,
        pointsEarned: null,
        wasExactScore: null,
        perfectMatchdayBonusPoints: null,
      },
    ]);

    const view = await getCurrentUserPoolPredictions(poolId);

    expect(view.matchdays).toHaveLength(1);
    const match = view.matchdays[0].matches[0];
    expect(match.canEdit).toBe(true);
    expect(match.lockReason).toBeNull();
    expect(match.currentPrediction).toBeNull();
    expect(match.homeTeamShortName).toBe("LOC");
    expect(match.pointsEarned).toBeNull();
    expect(match.wasExactScore).toBeNull();
  });

  it("marks a finished match as read-only, exposes the saved prediction and the points earned", async () => {
    dalMocks.listPoolMatchPredictionRowsForUser.mockResolvedValue([
      {
        poolId,
        poolName: "Quiniela",
        competitionName: "Liga",
        seasonName: "2026",
        predictionMode: "score",
        poolMembershipId: "membership-1",
        matchdayId: "matchday-1",
        matchdayNumber: 1,
        matchdayName: null,
        matchdayStatus: "finished",
        matchId,
        homeTeamName: "Local FC",
        homeTeamShortName: null,
        awayTeamName: "Away FC",
        awayTeamShortName: null,
        startsAt: new Date("2020-01-01T00:00:00.000Z"),
        matchStatus: "finished",
        predictedResult: null,
        predictedHomeScore: 2,
        predictedAwayScore: 2,
        pointsEarned: 3,
        wasExactScore: true,
        perfectMatchdayBonusPoints: null,
      },
    ]);

    const view = await getCurrentUserPoolPredictions(poolId);
    const match = view.matchdays[0].matches[0];

    expect(match.canEdit).toBe(false);
    expect(match.lockReason).toBe("matchday_finished");
    expect(match.currentPrediction).toEqual({
      kind: "score",
      homeScore: 2,
      awayScore: 2,
    });
    expect(match.pointsEarned).toBe(3);
    expect(match.wasExactScore).toBe(true);
  });

  it("exposes the perfect matchday bonus only for a finished matchday, and never another member's", async () => {
    dalMocks.listPoolMatchPredictionRowsForUser.mockResolvedValue([
      {
        poolId,
        poolName: "Quiniela",
        competitionName: "Liga",
        seasonName: "2026",
        predictionMode: "mixed",
        poolMembershipId: "membership-1",
        matchdayId: "matchday-1",
        matchdayNumber: 1,
        matchdayName: null,
        matchdayStatus: "finished",
        matchId,
        homeTeamName: "Local FC",
        homeTeamShortName: null,
        awayTeamName: "Away FC",
        awayTeamShortName: null,
        startsAt: new Date("2020-01-01T00:00:00.000Z"),
        matchStatus: "finished",
        predictedResult: null,
        predictedHomeScore: 2,
        predictedAwayScore: 2,
        pointsEarned: 5,
        wasExactScore: true,
        perfectMatchdayBonusPoints: 10,
      },
    ]);

    const view = await getCurrentUserPoolPredictions(poolId);

    // The DAL query is scoped to poolMemberships.userId = the current user,
    // so any bonus value returned already belongs to their own membership.
    expect(dalMocks.listPoolMatchPredictionRowsForUser).toHaveBeenCalledWith(
      poolId,
      appUser.id,
    );
    expect(view.matchdays[0].perfectMatchdayBonusPoints).toBe(10);
  });

  it("hides the perfect matchday bonus while the matchday is still published", async () => {
    dalMocks.listPoolMatchPredictionRowsForUser.mockResolvedValue([
      {
        poolId,
        poolName: "Quiniela",
        competitionName: "Liga",
        seasonName: "2026",
        predictionMode: "mixed",
        poolMembershipId: "membership-1",
        matchdayId: "matchday-1",
        matchdayNumber: 1,
        matchdayName: null,
        matchdayStatus: "published",
        matchId,
        homeTeamName: "Local FC",
        homeTeamShortName: null,
        awayTeamName: "Away FC",
        awayTeamShortName: null,
        startsAt: new Date(Date.now() + OPEN_STARTS_AT_OFFSET_MS),
        matchStatus: "scheduled",
        predictedResult: null,
        predictedHomeScore: 2,
        predictedAwayScore: 2,
        pointsEarned: null,
        wasExactScore: null,
        perfectMatchdayBonusPoints: null,
      },
    ]);

    const view = await getCurrentUserPoolPredictions(poolId);

    expect(view.matchdays[0].perfectMatchdayBonusPoints).toBeNull();
  });
});
