import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type {
  MatchdayStatus,
  MatchStatus,
} from "@/features/competition-catalog/types";
import type { PredictionMode } from "@/features/pools/types";
import { db } from "@/server/db/client";
import {
  competitions,
  competitionSeasons,
  matchdays,
  matches,
  poolMatchPredictions,
  poolMemberships,
  poolPredictionRules,
  pools,
  teams,
} from "@/server/db/schema";

export type PoolMatchPredictionRow = Readonly<{
  poolId: string;
  poolName: string;
  competitionName: string;
  seasonName: string;
  predictionMode: string;
  poolMembershipId: string;
  matchdayId: string | null;
  matchdayNumber: number | null;
  matchdayName: string | null;
  matchdayStatus: string | null;
  matchId: string | null;
  homeTeamName: string | null;
  homeTeamShortName: string | null;
  awayTeamName: string | null;
  awayTeamShortName: string | null;
  startsAt: Date | null;
  matchStatus: string | null;
  predictedResult: string | null;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
}>;

export type PredictionWriteMembershipContext = Readonly<{
  poolMembershipId: string;
  competitionSeasonId: string;
  predictionMode: string;
}>;

export type PredictionWriteMatchContext = Readonly<{
  matchdayStatus: string;
  matchStatus: string;
  startsAt: Date;
}>;

export type UpsertPoolMatchPredictionInput = Readonly<{
  id: string;
  poolId: string;
  competitionSeasonId: string;
  poolMembershipId: string;
  matchId: string;
  predictedResult: string | null;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
}>;

export async function listPoolMatchPredictionRowsForUser(
  poolId: string,
  userId: string,
): Promise<ReadonlyArray<PoolMatchPredictionRow>> {
  const homeTeams = alias(teams, "prediction_home_teams");
  const awayTeams = alias(teams, "prediction_away_teams");

  return db
    .select({
      poolId: pools.id,
      poolName: pools.name,
      competitionName: competitions.name,
      seasonName: competitionSeasons.name,
      predictionMode: poolPredictionRules.mode,
      poolMembershipId: poolMemberships.id,
      matchdayId: matchdays.id,
      matchdayNumber: matchdays.number,
      matchdayName: matchdays.name,
      matchdayStatus: matchdays.status,
      matchId: matches.id,
      homeTeamName: homeTeams.name,
      homeTeamShortName: homeTeams.shortName,
      awayTeamName: awayTeams.name,
      awayTeamShortName: awayTeams.shortName,
      startsAt: matches.startsAt,
      matchStatus: matches.status,
      predictedResult: poolMatchPredictions.predictedResult,
      predictedHomeScore: poolMatchPredictions.predictedHomeScore,
      predictedAwayScore: poolMatchPredictions.predictedAwayScore,
    })
    .from(poolMemberships)
    .innerJoin(pools, eq(poolMemberships.poolId, pools.id))
    .innerJoin(
      competitionSeasons,
      eq(pools.competitionSeasonId, competitionSeasons.id),
    )
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .innerJoin(poolPredictionRules, eq(poolPredictionRules.poolId, pools.id))
    .leftJoin(
      matchdays,
      and(
        eq(matchdays.competitionSeasonId, competitionSeasons.id),
        inArray(matchdays.status, ["published", "finished"]),
      ),
    )
    .leftJoin(matches, eq(matches.matchdayId, matchdays.id))
    .leftJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
    .leftJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .leftJoin(
      poolMatchPredictions,
      and(
        eq(poolMatchPredictions.matchId, matches.id),
        eq(poolMatchPredictions.poolMembershipId, poolMemberships.id),
      ),
    )
    .where(
      and(eq(poolMemberships.poolId, poolId), eq(poolMemberships.userId, userId)),
    )
    .orderBy(asc(matchdays.number), asc(matches.startsAt), asc(matches.id));
}

export async function getPredictionWriteMembershipContext(
  poolId: string,
  userId: string,
): Promise<PredictionWriteMembershipContext | null> {
  const [record] = await db
    .select({
      poolMembershipId: poolMemberships.id,
      competitionSeasonId: pools.competitionSeasonId,
      predictionMode: poolPredictionRules.mode,
    })
    .from(poolMemberships)
    .innerJoin(pools, eq(poolMemberships.poolId, pools.id))
    .innerJoin(poolPredictionRules, eq(poolPredictionRules.poolId, pools.id))
    .where(
      and(eq(poolMemberships.poolId, poolId), eq(poolMemberships.userId, userId)),
    )
    .limit(1);

  return record ?? null;
}

export async function getPredictionWriteMatchContext(
  matchId: string,
  competitionSeasonId: string,
): Promise<PredictionWriteMatchContext | null> {
  const [record] = await db
    .select({
      matchdayStatus: matchdays.status,
      matchStatus: matches.status,
      startsAt: matches.startsAt,
    })
    .from(matches)
    .innerJoin(matchdays, eq(matches.matchdayId, matchdays.id))
    .where(
      and(
        eq(matches.id, matchId),
        eq(matches.competitionSeasonId, competitionSeasonId),
      ),
    )
    .limit(1);

  return record ?? null;
}

function buildUpsertQuery(input: UpsertPoolMatchPredictionInput) {
  return db
    .insert(poolMatchPredictions)
    .values({
      id: input.id,
      poolId: input.poolId,
      competitionSeasonId: input.competitionSeasonId,
      poolMembershipId: input.poolMembershipId,
      matchId: input.matchId,
      predictedResult: input.predictedResult,
      predictedHomeScore: input.predictedHomeScore,
      predictedAwayScore: input.predictedAwayScore,
    })
    .onConflictDoUpdate({
      target: [
        poolMatchPredictions.poolMembershipId,
        poolMatchPredictions.matchId,
      ],
      set: {
        predictedResult: input.predictedResult,
        predictedHomeScore: input.predictedHomeScore,
        predictedAwayScore: input.predictedAwayScore,
        updatedAt: new Date(),
      },
    });
}

/**
 * Upserts every prediction in a single atomic round trip. The `neon-http`
 * driver does not support interactive transactions, but `db.batch(...)`
 * executes multiple statements as one non-interactive Neon transaction, so
 * either all predictions in this call are saved or none are.
 */
export async function upsertPoolMatchPredictionRecords(
  inputs: ReadonlyArray<UpsertPoolMatchPredictionInput>,
): Promise<void> {
  if (inputs.length === 0) return;

  const [first, ...rest] = inputs.map(buildUpsertQuery);
  if (rest.length === 0) {
    await first;
    return;
  }
  await db.batch([first, ...rest]);
}

export function parseMatchdayStatus(value: string): MatchdayStatus {
  if (value === "draft" || value === "published" || value === "finished") {
    return value;
  }
  throw new Error("Invalid matchday status persisted in the database.");
}

export function parseMatchStatus(value: string): MatchStatus {
  if (
    value === "scheduled" ||
    value === "postponed" ||
    value === "in_progress" ||
    value === "finished" ||
    value === "cancelled"
  ) {
    return value;
  }
  throw new Error("Invalid match status persisted in the database.");
}

export function parsePredictionMode(value: string): PredictionMode {
  if (value === "simple" || value === "score" || value === "mixed") {
    return value;
  }
  throw new Error("Invalid prediction mode persisted in the database.");
}
