import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/server/db/client";
import {
  matches,
  poolMatchPredictionScores,
  poolMatchPredictions,
  poolMatchdayPerfectBonuses,
  poolPredictionRules,
} from "@/server/db/schema";

export type MatchScoringRow = Readonly<{
  poolMatchPredictionId: string;
  poolId: string;
  poolMembershipId: string;
  predictionMode: string;
  resultPoints: number | null;
  exactScorePoints: number | null;
  predictedResult: string | null;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
}>;

export type MatchPredictionScoreInput = Readonly<{
  id: string;
  poolMatchPredictionId: string;
  pointsEarned: number;
  wasExactScore: boolean;
}>;

export type MatchdayBonusCandidateRow = Readonly<{
  poolId: string;
  competitionSeasonId: string;
  poolMembershipId: string;
  matchId: string;
  perfectMatchdayBonusPoints: number | null;
  wasExactScore: boolean | null;
}>;

export type MatchdayBonusInput = Readonly<{
  id: string;
  poolId: string;
  competitionSeasonId: string;
  poolMembershipId: string;
  matchdayId: string;
  pointsAwarded: number;
}>;

/**
 * All predictions submitted for a match, joined with the scoring mode and
 * point values of the pool each prediction belongs to. A single match can
 * be predicted across many pools sharing the same competition season, each
 * with its own scoring configuration.
 */
export async function listScoringRowsForMatch(
  matchId: string,
): Promise<ReadonlyArray<MatchScoringRow>> {
  return db
    .select({
      poolMatchPredictionId: poolMatchPredictions.id,
      poolId: poolMatchPredictions.poolId,
      poolMembershipId: poolMatchPredictions.poolMembershipId,
      predictionMode: poolPredictionRules.mode,
      resultPoints: poolPredictionRules.resultPoints,
      exactScorePoints: poolPredictionRules.exactScorePoints,
      predictedResult: poolMatchPredictions.predictedResult,
      predictedHomeScore: poolMatchPredictions.predictedHomeScore,
      predictedAwayScore: poolMatchPredictions.predictedAwayScore,
    })
    .from(poolMatchPredictions)
    .innerJoin(
      poolPredictionRules,
      eq(poolPredictionRules.poolId, poolMatchPredictions.poolId),
    )
    .where(eq(poolMatchPredictions.matchId, matchId));
}

function buildScoreUpsertQuery(input: MatchPredictionScoreInput) {
  return db
    .insert(poolMatchPredictionScores)
    .values({
      id: input.id,
      poolMatchPredictionId: input.poolMatchPredictionId,
      pointsEarned: input.pointsEarned,
      wasExactScore: input.wasExactScore,
    })
    .onConflictDoUpdate({
      target: [poolMatchPredictionScores.poolMatchPredictionId],
      set: {
        pointsEarned: input.pointsEarned,
        wasExactScore: input.wasExactScore,
        updatedAt: new Date(),
      },
    });
}

/**
 * Upserts every calculated score in one atomic round trip. A result
 * correction calls this again with freshly calculated values, so the
 * `onConflictDoUpdate` overwrite makes recomputation idempotent instead of
 * cumulative.
 */
export async function upsertMatchPredictionScores(
  inputs: ReadonlyArray<MatchPredictionScoreInput>,
): Promise<void> {
  if (inputs.length === 0) return;
  const [first, ...rest] = inputs.map(buildScoreUpsertQuery);
  if (rest.length === 0) {
    await first;
    return;
  }
  await db.batch([first, ...rest]);
}

/** Computable matches for a matchday's perfect bonus: `finished`, excluding `cancelled`. */
export async function listComputableMatchIdsForMatchday(
  matchdayId: string,
): Promise<ReadonlyArray<string>> {
  const rows = await db
    .select({ id: matches.id })
    .from(matches)
    .where(and(eq(matches.matchdayId, matchdayId), eq(matches.status, "finished")));
  return rows.map((row) => row.id);
}

/**
 * Distinct pool ids that currently have a perfect matchday bonus row for a
 * matchday. Read before `replaceMatchdayBonuses` when a correction removes
 * every computable match (e.g. a match is un-finished): the replace call
 * deletes those rows, so the affected pools' ranking cache would otherwise
 * be impossible to invalidate afterwards.
 */
export async function listPoolIdsWithBonusesForMatchday(
  matchdayId: string,
): Promise<ReadonlyArray<string>> {
  const rows = await db
    .selectDistinct({ poolId: poolMatchdayPerfectBonuses.poolId })
    .from(poolMatchdayPerfectBonuses)
    .where(eq(poolMatchdayPerfectBonuses.matchdayId, matchdayId));
  return rows.map((row) => row.poolId);
}

/**
 * Prediction rows for the computable matches of a matchday, restricted to
 * pools using the `mixed` mode (the only mode with a perfect matchday
 * bonus configured). Used to determine, per membership, whether every
 * computable match was scored as an exact match.
 */
export async function listMatchdayBonusCandidateRows(
  computableMatchIds: ReadonlyArray<string>,
): Promise<ReadonlyArray<MatchdayBonusCandidateRow>> {
  if (computableMatchIds.length === 0) return [];
  return db
    .select({
      poolId: poolMatchPredictions.poolId,
      competitionSeasonId: poolMatchPredictions.competitionSeasonId,
      poolMembershipId: poolMatchPredictions.poolMembershipId,
      matchId: poolMatchPredictions.matchId,
      perfectMatchdayBonusPoints: poolPredictionRules.perfectMatchdayBonusPoints,
      wasExactScore: poolMatchPredictionScores.wasExactScore,
    })
    .from(poolMatchPredictions)
    .innerJoin(
      poolPredictionRules,
      and(
        eq(poolPredictionRules.poolId, poolMatchPredictions.poolId),
        eq(poolPredictionRules.mode, "mixed"),
      ),
    )
    .leftJoin(
      poolMatchPredictionScores,
      eq(poolMatchPredictionScores.poolMatchPredictionId, poolMatchPredictions.id),
    )
    .where(inArray(poolMatchPredictions.matchId, computableMatchIds));
}

/**
 * Replaces every perfect matchday bonus row for a matchday with the
 * currently-earned set. Deleting first (in the same atomic batch as the
 * inserts) keeps recomputation idempotent: a membership that no longer
 * qualifies after a correction loses its bonus instead of keeping a stale
 * row.
 */
export async function replaceMatchdayBonuses(
  matchdayId: string,
  records: ReadonlyArray<MatchdayBonusInput>,
): Promise<void> {
  const deleteQuery = db
    .delete(poolMatchdayPerfectBonuses)
    .where(eq(poolMatchdayPerfectBonuses.matchdayId, matchdayId));

  if (records.length === 0) {
    await deleteQuery;
    return;
  }

  const insertQueries = records.map((record) =>
    db.insert(poolMatchdayPerfectBonuses).values({
      id: record.id,
      poolId: record.poolId,
      competitionSeasonId: record.competitionSeasonId,
      poolMembershipId: record.poolMembershipId,
      matchdayId: record.matchdayId,
      pointsAwarded: record.pointsAwarded,
    }),
  );

  await db.batch([deleteQuery, ...insertQueries]);
}
