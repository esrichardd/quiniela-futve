import type { MatchStatus, MatchdayStatus } from "@/features/competition-catalog/types";
import type { PredictionMode } from "@/features/pools/types";

import type { predictionResults } from "./constants";

export type PredictionResult = (typeof predictionResults)[number];

export type PredictionPayload =
  | Readonly<{ kind: "result"; result: PredictionResult }>
  | Readonly<{ kind: "score"; homeScore: number; awayScore: number }>;

export type MatchPrediction =
  | Readonly<{ kind: "result"; result: PredictionResult }>
  | Readonly<{ kind: "score"; homeScore: number; awayScore: number }>;

export type PredictionLockReason =
  | "match_started"
  | "match_in_progress"
  | "match_finished"
  | "match_cancelled"
  | "matchday_not_published"
  | "matchday_finished";

export type PredictionMatch = Readonly<{
  matchId: string;
  homeTeamName: string;
  homeTeamShortName: string | null;
  awayTeamName: string;
  awayTeamShortName: string | null;
  startsAt: string;
  matchStatus: MatchStatus;
  currentPrediction: MatchPrediction | null;
  canEdit: boolean;
  lockReason: PredictionLockReason | null;
}>;

export type PredictionMatchday = Readonly<{
  id: string;
  number: number;
  name: string | null;
  status: Extract<MatchdayStatus, "published" | "finished">;
  matches: ReadonlyArray<PredictionMatch>;
}>;

export type PoolPredictionsView = Readonly<{
  poolId: string;
  poolName: string;
  competitionName: string;
  seasonName: string;
  predictionMode: PredictionMode;
  selectedMatchdayId: string | null;
  matchdays: ReadonlyArray<PredictionMatchday>;
}>;

/** Error for a single match within a batch save. */
export type PredictionItemErrorCode =
  | "match_unavailable"
  | "prediction_locked"
  | "prediction_mode_mismatch"
  | "save_failed";

export type PredictionOutcome =
  | Readonly<{ status: "saved" }>
  | Readonly<{ status: "error"; error: PredictionItemErrorCode }>;

/** Error that prevents the whole batch from being processed. */
export type PredictionBatchErrorCode =
  | "authentication_required"
  | "pool_unavailable"
  | "prediction_invalid"
  | "save_failed";

export type SaveMatchdayPredictionsState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "error"; error: PredictionBatchErrorCode }>
  | Readonly<{
      status: "completed";
      outcomes: Readonly<Record<string, PredictionOutcome>>;
    }>;

export const initialSaveMatchdayPredictionsState: SaveMatchdayPredictionsState = {
  status: "idle",
};
