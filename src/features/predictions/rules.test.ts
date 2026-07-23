import { describe, expect, it } from "vitest";

import {
  derivePredictedResult,
  isPredictionEditable,
  isValidPredictedScore,
  normalizePredictionPayload,
  resolvePredictionLockReason,
} from "./rules";

describe("derivePredictedResult", () => {
  it("derives home when the home score is higher", () => {
    expect(derivePredictedResult(2, 1)).toBe("home");
  });

  it("derives away when the away score is higher", () => {
    expect(derivePredictedResult(0, 3)).toBe("away");
  });

  it("derives draw when both scores are equal", () => {
    expect(derivePredictedResult(1, 1)).toBe("draw");
  });
});

describe("isValidPredictedScore", () => {
  it("accepts integers within 0 and 99", () => {
    expect(isValidPredictedScore(0)).toBe(true);
    expect(isValidPredictedScore(99)).toBe(true);
    expect(isValidPredictedScore(45)).toBe(true);
  });

  it("rejects negative values", () => {
    expect(isValidPredictedScore(-1)).toBe(false);
  });

  it("rejects values above 99", () => {
    expect(isValidPredictedScore(100)).toBe(false);
  });

  it("rejects non-integer values", () => {
    expect(isValidPredictedScore(1.5)).toBe(false);
  });
});

describe("isPredictionEditable", () => {
  const startsAt = new Date("2026-08-01T18:00:00.000Z");

  it("is editable one second before kickoff", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(isPredictionEditable("published", "scheduled", startsAt, now)).toBe(true);
  });

  it("is locked exactly at kickoff", () => {
    expect(isPredictionEditable("published", "scheduled", startsAt, startsAt)).toBe(false);
  });

  it("is locked after kickoff", () => {
    const now = new Date(startsAt.getTime() + 1000);
    expect(isPredictionEditable("published", "scheduled", startsAt, now)).toBe(false);
  });

  it("is locked when the matchday is draft", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(isPredictionEditable("draft", "scheduled", startsAt, now)).toBe(false);
  });

  it("is locked when the matchday is finished", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(isPredictionEditable("finished", "scheduled", startsAt, now)).toBe(false);
  });

  it("is locked when the match is cancelled", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(isPredictionEditable("published", "cancelled", startsAt, now)).toBe(false);
  });

  it("is locked when the match is finished", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(isPredictionEditable("published", "finished", startsAt, now)).toBe(false);
  });

  it("is locked when the match is in progress", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(isPredictionEditable("published", "in_progress", startsAt, now)).toBe(false);
  });

  it("is editable when the match is scheduled and in the future", () => {
    const now = new Date(startsAt.getTime() - 60_000);
    expect(isPredictionEditable("published", "scheduled", startsAt, now)).toBe(true);
  });

  it("is editable when the match is postponed to a future kickoff", () => {
    const now = new Date(startsAt.getTime() - 60_000);
    expect(isPredictionEditable("published", "postponed", startsAt, now)).toBe(true);
  });
});

describe("resolvePredictionLockReason", () => {
  const startsAt = new Date("2026-08-01T18:00:00.000Z");

  it("returns null when the prediction is editable", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(resolvePredictionLockReason("published", "scheduled", startsAt, now)).toBeNull();
  });

  it("identifies an unpublished matchday", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(resolvePredictionLockReason("draft", "scheduled", startsAt, now)).toBe(
      "matchday_not_published",
    );
  });

  it("identifies a finished matchday", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(resolvePredictionLockReason("finished", "scheduled", startsAt, now)).toBe(
      "matchday_finished",
    );
  });

  it("identifies a match in progress", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(resolvePredictionLockReason("published", "in_progress", startsAt, now)).toBe(
      "match_in_progress",
    );
  });

  it("identifies a finished match", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(resolvePredictionLockReason("published", "finished", startsAt, now)).toBe(
      "match_finished",
    );
  });

  it("identifies a cancelled match", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(resolvePredictionLockReason("published", "cancelled", startsAt, now)).toBe(
      "match_cancelled",
    );
  });

  it("identifies a match that already started", () => {
    const now = new Date(startsAt.getTime() + 1000);
    expect(resolvePredictionLockReason("published", "scheduled", startsAt, now)).toBe(
      "match_started",
    );
  });
});

describe("normalizePredictionPayload", () => {
  it("normalizes a result payload for simple mode", () => {
    expect(
      normalizePredictionPayload("simple", { kind: "result", result: "home" }),
    ).toEqual({
      predictedResult: "home",
      predictedHomeScore: null,
      predictedAwayScore: null,
    });
  });

  it("rejects a score payload for simple mode", () => {
    expect(
      normalizePredictionPayload("simple", { kind: "score", homeScore: 1, awayScore: 0 }),
    ).toBeNull();
  });

  it("normalizes a score payload for score mode", () => {
    expect(
      normalizePredictionPayload("score", { kind: "score", homeScore: 2, awayScore: 2 }),
    ).toEqual({
      predictedResult: null,
      predictedHomeScore: 2,
      predictedAwayScore: 2,
    });
  });

  it("normalizes a score payload for mixed mode", () => {
    expect(
      normalizePredictionPayload("mixed", { kind: "score", homeScore: 3, awayScore: 1 }),
    ).toEqual({
      predictedResult: null,
      predictedHomeScore: 3,
      predictedAwayScore: 1,
    });
  });

  it("rejects a result payload for score mode", () => {
    expect(
      normalizePredictionPayload("score", { kind: "result", result: "draw" }),
    ).toBeNull();
  });

  it("rejects a result payload for mixed mode", () => {
    expect(
      normalizePredictionPayload("mixed", { kind: "result", result: "away" }),
    ).toBeNull();
  });

  it("rejects out-of-range scores", () => {
    expect(
      normalizePredictionPayload("score", { kind: "score", homeScore: 100, awayScore: 0 }),
    ).toBeNull();
  });

  it("rejects negative scores", () => {
    expect(
      normalizePredictionPayload("score", { kind: "score", homeScore: -1, awayScore: 0 }),
    ).toBeNull();
  });
});
