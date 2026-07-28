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
  getPredictionWriteMembershipContext,
  listPoolMatchPredictionRowsForMatchday,
  listPoolPredictionHeaderRowsForUser,
  listPredictionWriteMatchContexts,
  parseMatchdayStatus,
  parseMatchStatus,
  parsePredictionMode,
  upsertPoolMatchPredictionRecords,
  type PredictionMatchdayMatchRow,
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
  const headerRows = await listPoolPredictionHeaderRowsForUser(poolId, appUser.id);
  const core = headerRows[0];
  if (!core) throw new PoolMembershipRequiredError();

  const visibleMatchdays: Array<PredictionMatchday> = [];
  for (const row of headerRows) {
    const { matchdayId, matchdayNumber, matchdayStatus } = row;
    if (
      !matchdayId ||
      matchdayNumber === null ||
      (matchdayStatus !== "published" && matchdayStatus !== "finished")
    ) {
      continue;
    }
    visibleMatchdays.push({
      id: matchdayId,
      number: matchdayNumber,
      name: row.matchdayName,
      status: matchdayStatus,
      matches: [],
      perfectMatchdayBonusPoints:
        matchdayStatus === "finished" ? row.perfectMatchdayBonusPoints : null,
    });
  }

  const selected =
    selectedMatchdayId && visibleMatchdays.some((matchday) => matchday.id === selectedMatchdayId)
      ? selectedMatchdayId
      : (visibleMatchdays[0]?.id ?? null);

  const matchdays: ReadonlyArray<PredictionMatchday> = selected
    ? await withSelectedMatchdayMatches(
        visibleMatchdays,
        core.poolMembershipId,
        selected,
        now,
      )
    : visibleMatchdays;

  return {
    poolId: core.poolId,
    poolName: core.poolName,
    competitionName: core.competitionName,
    seasonName: core.seasonName,
    predictionMode: parsePredictionMode(core.predictionMode),
    selectedMatchdayId: selected,
    matchdays,
  };
}

/**
 * Fetches match rows for the selected matchday only (`PERF-N02`) and
 * attaches them to the corresponding entry. Every other matchday keeps its
 * `matches: []` placeholder, matching the UI which only ever renders the
 * selected matchday's matches.
 */
async function withSelectedMatchdayMatches(
  matchdays: ReadonlyArray<PredictionMatchday>,
  poolMembershipId: string,
  selectedMatchdayId: string,
  now: Date,
): Promise<ReadonlyArray<PredictionMatchday>> {
  const matchRows = await listPoolMatchPredictionRowsForMatchday(
    poolMembershipId,
    selectedMatchdayId,
  );
  const matches = matchRows.map((row) => mapPredictionMatch(row, now));

  return matchdays.map((matchday) =>
    matchday.id === selectedMatchdayId ? { ...matchday, matches } : matchday,
  );
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

  const uniqueMatchIds = [...new Set(items.map((item) => item.matchId))];
  const contextRows = await listPredictionWriteMatchContexts(
    uniqueMatchIds,
    membershipContext.competitionSeasonId,
  );
  const contextsByMatchId = new Map(contextRows.map((row) => [row.matchId, row]));

  const outcomes: Record<string, PredictionOutcome> = {};
  const validRecords: Array<UpsertPoolMatchPredictionInput> = [];

  for (const item of items) {
    const matchContext = contextsByMatchId.get(item.matchId);
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

function mapPredictionMatch(row: PredictionMatchdayMatchRow, now: Date): PredictionMatch {
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
    pointsEarned: matchStatus === "finished" ? row.pointsEarned : null,
    wasExactScore: matchStatus === "finished" ? row.wasExactScore : null,
  };
}

function mapCurrentPrediction(row: PredictionMatchdayMatchRow): MatchPrediction | null {
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
