import type { MatchStatus, MatchdayStatus } from "@/features/competition-catalog/types";
import type { PredictionMode } from "@/features/pools/types";

import {
  MAX_PREDICTED_SCORE,
  MIN_PREDICTED_SCORE,
  PREDICTION_LOCK_BUFFER_MINUTES,
} from "./constants";
import type {
  PredictionLockReason,
  PredictionPayload,
  PredictionResult,
} from "./types";

export type NormalizedPrediction =
  | Readonly<{
      predictedResult: PredictionResult;
      predictedHomeScore: null;
      predictedAwayScore: null;
    }>
  | Readonly<{
      predictedResult: null;
      predictedHomeScore: number;
      predictedAwayScore: number;
    }>;

export function derivePredictedResult(
  homeScore: number,
  awayScore: number,
): PredictionResult {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}

export function isValidPredictedScore(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_PREDICTED_SCORE &&
    value <= MAX_PREDICTED_SCORE
  );
}

/**
 * The instant predictions stop being editable for a match: kickoff minus
 * `PREDICTION_LOCK_BUFFER_MINUTES`. Exported so the closing rule and its
 * lock reason share a single definition, and so a future informational
 * countdown in the UI can reuse it.
 */
export function getPredictionClosesAt(startsAt: Date): Date {
  return new Date(startsAt.getTime() - PREDICTION_LOCK_BUFFER_MINUTES * 60_000);
}

/**
 * Authoritative closing rule. A prediction can only be created or updated
 * when the matchday is published, the match is scheduled or postponed, and
 * the current time is strictly before the prediction closing instant
 * (kickoff minus the configured buffer, not kickoff itself).
 */
export function isPredictionEditable(
  matchdayStatus: MatchdayStatus,
  matchStatus: MatchStatus,
  startsAt: Date,
  now: Date,
): boolean {
  if (matchdayStatus !== "published") return false;
  if (matchStatus !== "scheduled" && matchStatus !== "postponed") return false;
  return now.getTime() < getPredictionClosesAt(startsAt).getTime();
}

/**
 * Whether a match's predictions can be revealed to every member of the
 * pool (not just their author), for the pool prediction transparency
 * screen. Deliberately reuses the same instant as `isPredictionEditable`:
 * a prediction becomes visible to everyone at the exact moment nobody can
 * submit or change it anymore, so revealing it can never help anyone game
 * their own pick. This holds regardless of the match's or matchday's
 * status, since once the closing instant has passed the window is closed
 * either way.
 */
export function isPredictionRevealed(startsAt: Date, now: Date): boolean {
  return now.getTime() >= getPredictionClosesAt(startsAt).getTime();
}

/**
 * Explains why a prediction is locked. Returns null when it is editable.
 * Order reflects the most specific, most useful reason to surface first.
 */
export function resolvePredictionLockReason(
  matchdayStatus: MatchdayStatus,
  matchStatus: MatchStatus,
  startsAt: Date,
  now: Date,
): PredictionLockReason | null {
  if (matchdayStatus === "draft") return "matchday_not_published";
  if (matchdayStatus === "finished") return "matchday_finished";
  if (matchStatus === "in_progress") return "match_in_progress";
  if (matchStatus === "finished") return "match_finished";
  if (matchStatus === "cancelled") return "match_cancelled";
  if (now.getTime() >= getPredictionClosesAt(startsAt).getTime()) {
    return "prediction_window_closed";
  }
  return null;
}

/**
 * Normalizes a client payload into the database representation required by
 * the pool's prediction mode. Returns null when the payload kind does not
 * match the mode (a manipulated request), so the caller can reject it as a
 * mode mismatch instead of silently coercing it.
 */
export function normalizePredictionPayload(
  mode: PredictionMode,
  payload: PredictionPayload,
): NormalizedPrediction | null {
  if (mode === "simple") {
    if (payload.kind !== "result") return null;
    return {
      predictedResult: payload.result,
      predictedHomeScore: null,
      predictedAwayScore: null,
    };
  }

  if (payload.kind !== "score") return null;
  if (
    !isValidPredictedScore(payload.homeScore) ||
    !isValidPredictedScore(payload.awayScore)
  ) {
    return null;
  }
  return {
    predictedResult: null,
    predictedHomeScore: payload.homeScore,
    predictedAwayScore: payload.awayScore,
  };
}
