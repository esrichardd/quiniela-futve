import { describe, expect, it } from "vitest";

import { PREDICTION_LOCK_BUFFER_MINUTES } from "./constants";
import {
  derivePredictedResult,
  getPredictionClosesAt,
  isPredictionEditable,
  isPredictionRevealed,
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

describe("getPredictionClosesAt", () => {
  it("is exactly the configured buffer before kickoff", () => {
    const startsAt = new Date("2026-08-01T18:00:00.000Z");
    expect(getPredictionClosesAt(startsAt).getTime()).toBe(
      startsAt.getTime() - PREDICTION_LOCK_BUFFER_MINUTES * 60_000,
    );
  });
});

describe("isPredictionEditable", () => {
  const startsAt = new Date("2026-08-01T18:00:00.000Z");
  const closesAt = getPredictionClosesAt(startsAt);
  // A comfortably "open" instant, well before the closing buffer even
  // starts to apply.
  const wellBeforeClosing = new Date(closesAt.getTime() - 60_000);

  it("is editable one second before the closing instant", () => {
    const now = new Date(closesAt.getTime() - 1000);
    expect(isPredictionEditable("published", "scheduled", startsAt, now)).toBe(true);
  });

  it("is locked exactly at the closing instant, one hour before kickoff", () => {
    expect(isPredictionEditable("published", "scheduled", startsAt, closesAt)).toBe(false);
  });

  it("is locked after the closing instant even though kickoff has not happened yet", () => {
    const now = new Date(closesAt.getTime() + 1000);
    expect(now.getTime()).toBeLessThan(startsAt.getTime());
    expect(isPredictionEditable("published", "scheduled", startsAt, now)).toBe(false);
  });

  it("is locked exactly at kickoff", () => {
    expect(isPredictionEditable("published", "scheduled", startsAt, startsAt)).toBe(false);
  });

  it("is locked after kickoff", () => {
    const now = new Date(startsAt.getTime() + 1000);
    expect(isPredictionEditable("published", "scheduled", startsAt, now)).toBe(false);
  });

  it("is locked when the matchday is draft", () => {
    expect(
      isPredictionEditable("draft", "scheduled", startsAt, wellBeforeClosing),
    ).toBe(false);
  });

  it("is locked when the matchday is finished", () => {
    expect(
      isPredictionEditable("finished", "scheduled", startsAt, wellBeforeClosing),
    ).toBe(false);
  });

  it("is locked when the match is cancelled", () => {
    expect(
      isPredictionEditable("published", "cancelled", startsAt, wellBeforeClosing),
    ).toBe(false);
  });

  it("is locked when the match is finished", () => {
    expect(
      isPredictionEditable("published", "finished", startsAt, wellBeforeClosing),
    ).toBe(false);
  });

  it("is locked when the match is in progress", () => {
    expect(
      isPredictionEditable("published", "in_progress", startsAt, wellBeforeClosing),
    ).toBe(false);
  });

  it("is editable when the match is scheduled and well before the closing instant", () => {
    expect(
      isPredictionEditable("published", "scheduled", startsAt, wellBeforeClosing),
    ).toBe(true);
  });

  it("is editable when the match is postponed to a future kickoff, before the closing instant", () => {
    expect(
      isPredictionEditable("published", "postponed", startsAt, wellBeforeClosing),
    ).toBe(true);
  });
});

describe("isPredictionRevealed", () => {
  const startsAt = new Date("2026-08-01T18:00:00.000Z");
  const closesAt = getPredictionClosesAt(startsAt);

  it("is not revealed one second before the closing instant", () => {
    const now = new Date(closesAt.getTime() - 1000);
    expect(isPredictionRevealed(startsAt, now)).toBe(false);
  });

  it("is revealed exactly at the closing instant, before kickoff", () => {
    expect(isPredictionRevealed(startsAt, closesAt)).toBe(true);
  });

  it("is revealed after the closing instant even though kickoff has not happened yet", () => {
    const now = new Date(closesAt.getTime() + 1000);
    expect(now.getTime()).toBeLessThan(startsAt.getTime());
    expect(isPredictionRevealed(startsAt, now)).toBe(true);
  });

  it("is revealed after kickoff", () => {
    const now = new Date(startsAt.getTime() + 1000);
    expect(isPredictionRevealed(startsAt, now)).toBe(true);
  });

  it("matches the boolean negation of isPredictionEditable's time check for a scheduled, published match", () => {
    const beforeClosing = new Date(closesAt.getTime() - 60_000);
    const afterClosing = new Date(closesAt.getTime() + 60_000);
    expect(isPredictionRevealed(startsAt, beforeClosing)).toBe(
      !isPredictionEditable("published", "scheduled", startsAt, beforeClosing),
    );
    expect(isPredictionRevealed(startsAt, afterClosing)).toBe(
      !isPredictionEditable("published", "scheduled", startsAt, afterClosing),
    );
  });
});

describe("resolvePredictionLockReason", () => {
  const startsAt = new Date("2026-08-01T18:00:00.000Z");
  const closesAt = getPredictionClosesAt(startsAt);
  const wellBeforeClosing = new Date(closesAt.getTime() - 60_000);

  it("returns null when the prediction is editable", () => {
    expect(
      resolvePredictionLockReason("published", "scheduled", startsAt, wellBeforeClosing),
    ).toBeNull();
  });

  it("identifies an unpublished matchday", () => {
    expect(
      resolvePredictionLockReason("draft", "scheduled", startsAt, wellBeforeClosing),
    ).toBe("matchday_not_published");
  });

  it("identifies a finished matchday", () => {
    expect(
      resolvePredictionLockReason("finished", "scheduled", startsAt, wellBeforeClosing),
    ).toBe("matchday_finished");
  });

  it("identifies a match in progress", () => {
    expect(
      resolvePredictionLockReason("published", "in_progress", startsAt, wellBeforeClosing),
    ).toBe("match_in_progress");
  });

  it("identifies a finished match", () => {
    expect(
      resolvePredictionLockReason("published", "finished", startsAt, wellBeforeClosing),
    ).toBe("match_finished");
  });

  it("identifies a cancelled match", () => {
    expect(
      resolvePredictionLockReason("published", "cancelled", startsAt, wellBeforeClosing),
    ).toBe("match_cancelled");
  });

  it("identifies a closed prediction window right at the closing instant", () => {
    expect(resolvePredictionLockReason("published", "scheduled", startsAt, closesAt)).toBe(
      "prediction_window_closed",
    );
  });

  it("identifies a closed prediction window before kickoff has actually happened", () => {
    const now = new Date(closesAt.getTime() + 1000);
    expect(now.getTime()).toBeLessThan(startsAt.getTime());
    expect(resolvePredictionLockReason("published", "scheduled", startsAt, now)).toBe(
      "prediction_window_closed",
    );
  });

  it("identifies a closed prediction window after kickoff", () => {
    const now = new Date(startsAt.getTime() + 1000);
    expect(resolvePredictionLockReason("published", "scheduled", startsAt, now)).toBe(
      "prediction_window_closed",
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
