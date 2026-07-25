import { derivePredictedResult } from "@/features/predictions/rules";
import type { NormalizedPrediction } from "@/features/predictions/rules";
import type { PredictionMode } from "@/features/pools/types";

export type OfficialMatchResult = Readonly<{
  homeScore: number;
  awayScore: number;
}>;

export type MatchPredictionRulesPoints = Readonly<{
  resultPoints: number | null;
  exactScorePoints: number | null;
}>;

export type MatchPredictionPointsResult = Readonly<{
  pointsEarned: number;
  wasExactScore: boolean;
}>;

/**
 * Calculates the points a single prediction earned for its official match
 * result, according to the pool's scoring mode.
 *
 * - `simple`: awards `resultPoints` when the predicted result matches the
 *   result derived from the official score, otherwise 0.
 * - `score`: awards `exactScorePoints` only on an exact score match,
 *   otherwise 0. Guessing the winner without the exact score earns nothing.
 * - `mixed`: an exact score awards `exactScorePoints` (never combined with
 *   `resultPoints`). Otherwise, if the result derived from the predicted
 *   score matches the official result, awards `resultPoints`. Otherwise 0.
 */
export function calculateMatchPredictionPoints(
  mode: PredictionMode,
  rules: MatchPredictionRulesPoints,
  prediction: NormalizedPrediction,
  officialResult: OfficialMatchResult,
): MatchPredictionPointsResult {
  const actualResult = derivePredictedResult(
    officialResult.homeScore,
    officialResult.awayScore,
  );

  if (prediction.predictedResult !== null) {
    const matched = prediction.predictedResult === actualResult;
    return { pointsEarned: matched ? (rules.resultPoints ?? 0) : 0, wasExactScore: false };
  }

  const isExact =
    prediction.predictedHomeScore === officialResult.homeScore &&
    prediction.predictedAwayScore === officialResult.awayScore;

  if (mode === "score") {
    return {
      pointsEarned: isExact ? (rules.exactScorePoints ?? 0) : 0,
      wasExactScore: isExact,
    };
  }

  if (isExact) {
    return { pointsEarned: rules.exactScorePoints ?? 0, wasExactScore: true };
  }

  const derivedFromPrediction = derivePredictedResult(
    prediction.predictedHomeScore,
    prediction.predictedAwayScore,
  );
  const matched = derivedFromPrediction === actualResult;
  return { pointsEarned: matched ? (rules.resultPoints ?? 0) : 0, wasExactScore: false };
}

/**
 * A matchday is perfect for a membership only when there is at least one
 * computable match and every computable match was an exact score. An empty
 * list (no computable matches) never counts as perfect, even if the
 * matchday closed because every match was cancelled.
 */
export function isPerfectMatchday(matchResults: ReadonlyArray<boolean>): boolean {
  return matchResults.length > 0 && matchResults.every(Boolean);
}
