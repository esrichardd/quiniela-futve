import "server-only";

import { randomUUID } from "node:crypto";

import {
  isPredictionEditable,
  normalizePredictionPayload,
  resolvePredictionLockReason,
} from "@/features/predictions/rules";
import type {
  MatchPrediction,
  PoolPredictionsView,
  PredictionMatch,
  PredictionMatchday,
  PredictionOutcome,
  PredictionPayload,
  PredictionResult,
} from "@/features/predictions/types";
import { PoolMembershipRequiredError } from "@/server/auth/permissions";
import { requireVerifiedAppUser } from "@/server/auth/session";
import {
  getPredictionWriteMatchContext,
  getPredictionWriteMembershipContext,
  listPoolMatchPredictionRowsForUser,
  parseMatchdayStatus,
  parseMatchStatus,
  parsePredictionMode,
  upsertPoolMatchPredictionRecords,
  type PoolMatchPredictionRow,
  type UpsertPoolMatchPredictionInput,
} from "@/server/dal/predictions";

export type PredictionSaveItem = Readonly<{
  matchId: string;
  payload: PredictionPayload;
}>;

export async function getCurrentUserPoolPredictions(
  poolId: string,
  selectedMatchdayId?: string,
  now: Date = new Date(),
): Promise<PoolPredictionsView> {
  const appUser = await requireVerifiedAppUser();
  const rows = await listPoolMatchPredictionRowsForUser(poolId, appUser.id);
  const core = rows[0];
  if (!core) throw new PoolMembershipRequiredError();

  const grouped = new Map<string, PredictionMatchday>();
  for (const row of rows) {
    const { matchdayId, matchdayNumber, matchdayStatus } = row;
    if (
      !matchdayId ||
      matchdayNumber === null ||
      (matchdayStatus !== "published" && matchdayStatus !== "finished")
    ) {
      continue;
    }
    const current = grouped.get(matchdayId);
    const match = mapPredictionMatch(row, now);
    if (current) {
      if (match) {
        grouped.set(matchdayId, {
          ...current,
          matches: [...current.matches, match],
        });
      }
    } else {
      grouped.set(matchdayId, {
        id: matchdayId,
        number: matchdayNumber,
        name: row.matchdayName,
        status: matchdayStatus,
        matches: match ? [match] : [],
      });
    }
  }

  const visibleMatchdays = [...grouped.values()];
  const selected =
    selectedMatchdayId && grouped.has(selectedMatchdayId)
      ? selectedMatchdayId
      : (visibleMatchdays[0]?.id ?? null);

  return {
    poolId: core.poolId,
    poolName: core.poolName,
    competitionName: core.competitionName,
    seasonName: core.seasonName,
    predictionMode: parsePredictionMode(core.predictionMode),
    selectedMatchdayId: selected,
    matchdays: visibleMatchdays,
  };
}

/**
 * Saves every submitted prediction for a pool in one call. Each match is
 * independently re-validated (season, matchday/match status, closing rule,
 * mode match) so one locked or manipulated match never blocks the rest of
 * the batch. Every match that passes validation is then upserted atomically
 * in a single `db.batch(...)` round trip: either all of them are persisted
 * or none are, so a database-level failure never leaves a partial write.
 */
export async function savePredictions(
  poolId: string,
  items: ReadonlyArray<PredictionSaveItem>,
): Promise<Readonly<Record<string, PredictionOutcome>>> {
  const appUser = await requireVerifiedAppUser();

  const membershipContext = await getPredictionWriteMembershipContext(
    poolId,
    appUser.id,
  );
  if (!membershipContext) throw new PoolMembershipRequiredError();

  const mode = parsePredictionMode(membershipContext.predictionMode);
  const now = new Date();

  const outcomes: Record<string, PredictionOutcome> = {};
  const validRecords: Array<UpsertPoolMatchPredictionInput> = [];

  for (const item of items) {
    const matchContext = await getPredictionWriteMatchContext(
      item.matchId,
      membershipContext.competitionSeasonId,
    );
    if (!matchContext) {
      outcomes[item.matchId] = { status: "error", error: "match_unavailable" };
      continue;
    }

    const matchdayStatus = parseMatchdayStatus(matchContext.matchdayStatus);
    const matchStatus = parseMatchStatus(matchContext.matchStatus);
    if (!isPredictionEditable(matchdayStatus, matchStatus, matchContext.startsAt, now)) {
      outcomes[item.matchId] = { status: "error", error: "prediction_locked" };
      continue;
    }

    const normalized = normalizePredictionPayload(mode, item.payload);
    if (!normalized) {
      outcomes[item.matchId] = { status: "error", error: "prediction_mode_mismatch" };
      continue;
    }

    validRecords.push({
      id: randomUUID(),
      poolId,
      competitionSeasonId: membershipContext.competitionSeasonId,
      poolMembershipId: membershipContext.poolMembershipId,
      matchId: item.matchId,
      predictedResult: normalized.predictedResult,
      predictedHomeScore: normalized.predictedHomeScore,
      predictedAwayScore: normalized.predictedAwayScore,
    });
  }

  if (validRecords.length > 0) {
    try {
      await upsertPoolMatchPredictionRecords(validRecords);
      for (const record of validRecords) {
        outcomes[record.matchId] = { status: "saved" };
      }
    } catch {
      for (const record of validRecords) {
        outcomes[record.matchId] = { status: "error", error: "save_failed" };
      }
    }
  }

  return outcomes;
}

function mapPredictionMatch(
  row: PoolMatchPredictionRow,
  now: Date,
): PredictionMatch | null {
  if (
    !row.matchId ||
    !row.homeTeamName ||
    !row.awayTeamName ||
    !row.startsAt ||
    !row.matchStatus ||
    !row.matchdayStatus
  ) {
    return null;
  }

  const matchdayStatus = parseMatchdayStatus(row.matchdayStatus);
  const matchStatus = parseMatchStatus(row.matchStatus);
  const canEdit = isPredictionEditable(
    matchdayStatus,
    matchStatus,
    row.startsAt,
    now,
  );
  const lockReason = canEdit
    ? null
    : resolvePredictionLockReason(matchdayStatus, matchStatus, row.startsAt, now);

  return {
    matchId: row.matchId,
    homeTeamName: row.homeTeamName,
    homeTeamShortName: row.homeTeamShortName,
    awayTeamName: row.awayTeamName,
    awayTeamShortName: row.awayTeamShortName,
    startsAt: row.startsAt.toISOString(),
    matchStatus,
    currentPrediction: mapCurrentPrediction(row),
    canEdit,
    lockReason,
  };
}

function mapCurrentPrediction(row: PoolMatchPredictionRow): MatchPrediction | null {
  if (row.predictedResult) {
    return { kind: "result", result: parsePredictionResult(row.predictedResult) };
  }
  if (row.predictedHomeScore !== null && row.predictedAwayScore !== null) {
    return {
      kind: "score",
      homeScore: row.predictedHomeScore,
      awayScore: row.predictedAwayScore,
    };
  }
  return null;
}

function parsePredictionResult(value: string): PredictionResult {
  if (value === "home" || value === "draw" || value === "away") {
    return value;
  }
  throw new Error("Invalid predicted result persisted in the database.");
}
