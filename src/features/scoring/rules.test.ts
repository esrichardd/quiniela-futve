import { describe, expect, it } from "vitest";

import { calculateMatchPredictionPoints, isPerfectMatchday } from "./rules";

describe("calculateMatchPredictionPoints", () => {
  describe("simple mode", () => {
    const rules = { resultPoints: 1, exactScorePoints: null };

    it("awards resultPoints when the predicted result matches", () => {
      const prediction = {
        predictedResult: "home" as const,
        predictedHomeScore: null,
        predictedAwayScore: null,
      };
      expect(
        calculateMatchPredictionPoints("simple", rules, prediction, {
          homeScore: 2,
          awayScore: 1,
        }),
      ).toEqual({ pointsEarned: 1, wasExactScore: false });
    });

    it("awards 0 when the predicted result does not match", () => {
      const prediction = {
        predictedResult: "away" as const,
        predictedHomeScore: null,
        predictedAwayScore: null,
      };
      expect(
        calculateMatchPredictionPoints("simple", rules, prediction, {
          homeScore: 2,
          awayScore: 1,
        }),
      ).toEqual({ pointsEarned: 0, wasExactScore: false });
    });

    it("handles a predicted draw that matches an actual draw", () => {
      const prediction = {
        predictedResult: "draw" as const,
        predictedHomeScore: null,
        predictedAwayScore: null,
      };
      expect(
        calculateMatchPredictionPoints("simple", rules, prediction, {
          homeScore: 1,
          awayScore: 1,
        }),
      ).toEqual({ pointsEarned: 1, wasExactScore: false });
    });

    it("never reports an exact score in simple mode", () => {
      const prediction = {
        predictedResult: "home" as const,
        predictedHomeScore: null,
        predictedAwayScore: null,
      };
      expect(
        calculateMatchPredictionPoints("simple", rules, prediction, {
          homeScore: 2,
          awayScore: 1,
        }).wasExactScore,
      ).toBe(false);
    });
  });

  describe("score mode", () => {
    const rules = { resultPoints: null, exactScorePoints: 3 };

    it("awards exactScorePoints on an exact match", () => {
      const prediction = {
        predictedResult: null,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      };
      expect(
        calculateMatchPredictionPoints("score", rules, prediction, {
          homeScore: 2,
          awayScore: 1,
        }),
      ).toEqual({ pointsEarned: 3, wasExactScore: true });
    });

    it("awards 0 when only the winner is guessed correctly", () => {
      const prediction = {
        predictedResult: null,
        predictedHomeScore: 3,
        predictedAwayScore: 0,
      };
      expect(
        calculateMatchPredictionPoints("score", rules, prediction, {
          homeScore: 2,
          awayScore: 1,
        }),
      ).toEqual({ pointsEarned: 0, wasExactScore: false });
    });

    it("awards 0 when the prediction is entirely wrong", () => {
      const prediction = {
        predictedResult: null,
        predictedHomeScore: 0,
        predictedAwayScore: 2,
      };
      expect(
        calculateMatchPredictionPoints("score", rules, prediction, {
          homeScore: 2,
          awayScore: 1,
        }),
      ).toEqual({ pointsEarned: 0, wasExactScore: false });
    });

    it("awards exactScorePoints on an exact draw", () => {
      const prediction = {
        predictedResult: null,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
      };
      expect(
        calculateMatchPredictionPoints("score", rules, prediction, {
          homeScore: 1,
          awayScore: 1,
        }),
      ).toEqual({ pointsEarned: 3, wasExactScore: true });
    });
  });

  describe("mixed mode", () => {
    const rules = { resultPoints: 1, exactScorePoints: 3 };

    it("awards exactScorePoints only, never combined with resultPoints", () => {
      const prediction = {
        predictedResult: null,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      };
      expect(
        calculateMatchPredictionPoints("mixed", rules, prediction, {
          homeScore: 2,
          awayScore: 1,
        }),
      ).toEqual({ pointsEarned: 3, wasExactScore: true });
    });

    it("awards resultPoints when only the winner is guessed correctly", () => {
      const prediction = {
        predictedResult: null,
        predictedHomeScore: 3,
        predictedAwayScore: 0,
      };
      expect(
        calculateMatchPredictionPoints("mixed", rules, prediction, {
          homeScore: 2,
          awayScore: 1,
        }),
      ).toEqual({ pointsEarned: 1, wasExactScore: false });
    });

    it("awards resultPoints on a correctly predicted draw with the wrong score", () => {
      const prediction = {
        predictedResult: null,
        predictedHomeScore: 0,
        predictedAwayScore: 0,
      };
      expect(
        calculateMatchPredictionPoints("mixed", rules, prediction, {
          homeScore: 2,
          awayScore: 2,
        }),
      ).toEqual({ pointsEarned: 1, wasExactScore: false });
    });

    it("awards 0 when neither the result nor the score match", () => {
      const prediction = {
        predictedResult: null,
        predictedHomeScore: 0,
        predictedAwayScore: 2,
      };
      expect(
        calculateMatchPredictionPoints("mixed", rules, prediction, {
          homeScore: 2,
          awayScore: 1,
        }),
      ).toEqual({ pointsEarned: 0, wasExactScore: false });
    });
  });
});

describe("isPerfectMatchday", () => {
  it("is false when there are no computable matches", () => {
    expect(isPerfectMatchday([])).toBe(false);
  });

  it("is true when every computable match was exact", () => {
    expect(isPerfectMatchday([true, true, true])).toBe(true);
  });

  it("is true for a single exact match", () => {
    expect(isPerfectMatchday([true])).toBe(true);
  });

  it("is false when at least one computable match was not exact", () => {
    expect(isPerfectMatchday([true, true, false])).toBe(false);
  });

  it("is false when none were exact", () => {
    expect(isPerfectMatchday([false, false])).toBe(false);
  });
});
