import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/server/db/client";
import {
  competitions,
  competitionSeasons,
  matchdays,
  matches,
  poolMatchdayPerfectBonuses,
  poolMatchPredictions,
  poolMatchPredictionScores,
  poolMemberships,
  poolPredictionRules,
  pools,
  teams,
  userProfiles,
} from "@/server/db/schema";

/**
 * One row per (matchday, match, pool membership) combination, unlike the
 * personal predictions read which is anchored to a single user. This is
 * intentional: the prediction transparency screen shows every member's
 * pick, so the query crosses every visible match with every membership of
 * the pool instead of filtering by a `userId`.
 */
export type PredictionTransparencyRow = Readonly<{
  poolId: string;
  poolName: string;
  competitionName: string;
  seasonName: string;
  predictionMode: string;
  poolMembershipId: string;
  displayName: string | null;
  // Null when the pool has no published/finished matchday yet: the row
  // still carries the header fields above so the caller can build an
  // empty-but-well-formed view instead of losing pool/competition/season
  // names.
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
  homeScore: number | null;
  awayScore: number | null;
  predictedResult: string | null;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  pointsEarned: number | null;
  wasExactScore: boolean | null;
  perfectMatchdayBonusPoints: number | null;
}>;

export async function listPredictionTransparencyRowsForPool(
  poolId: string,
): Promise<ReadonlyArray<PredictionTransparencyRow>> {
  const homeTeams = alias(teams, "transparency_home_teams");
  const awayTeams = alias(teams, "transparency_away_teams");

  return db
    .select({
      poolId: pools.id,
      poolName: pools.name,
      competitionName: competitions.name,
      seasonName: competitionSeasons.name,
      predictionMode: poolPredictionRules.mode,
      poolMembershipId: poolMemberships.id,
      displayName: userProfiles.displayName,
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
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      predictedResult: poolMatchPredictions.predictedResult,
      predictedHomeScore: poolMatchPredictions.predictedHomeScore,
      predictedAwayScore: poolMatchPredictions.predictedAwayScore,
      pointsEarned: poolMatchPredictionScores.pointsEarned,
      wasExactScore: poolMatchPredictionScores.wasExactScore,
      perfectMatchdayBonusPoints: poolMatchdayPerfectBonuses.pointsAwarded,
    })
    .from(pools)
    .innerJoin(
      competitionSeasons,
      eq(pools.competitionSeasonId, competitionSeasons.id),
    )
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .innerJoin(poolPredictionRules, eq(poolPredictionRules.poolId, pools.id))
    .innerJoin(poolMemberships, eq(poolMemberships.poolId, pools.id))
    .innerJoin(userProfiles, eq(poolMemberships.userId, userProfiles.userId))
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
    .leftJoin(
      poolMatchPredictionScores,
      eq(poolMatchPredictionScores.poolMatchPredictionId, poolMatchPredictions.id),
    )
    .leftJoin(
      poolMatchdayPerfectBonuses,
      and(
        eq(poolMatchdayPerfectBonuses.matchdayId, matchdays.id),
        eq(poolMatchdayPerfectBonuses.poolMembershipId, poolMemberships.id),
      ),
    )
    .where(eq(pools.id, poolId))
    .orderBy(
      asc(matchdays.number),
      asc(matches.startsAt),
      asc(matches.id),
      asc(poolMemberships.createdAt),
      asc(poolMemberships.id),
    );
}
