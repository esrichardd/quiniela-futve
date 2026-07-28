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
  pools,
  teams,
  userProfiles,
} from "@/server/db/schema";

/**
 * Pool/competition/season header plus the lightweight list of visible
 * matchdays (id, number, name, status) for the tabs — no match or member
 * rows. `getPoolMembershipCore` (used for authorization in the service)
 * only carries `poolName`, not `competitionName`/`seasonName`, so this query
 * carries the full header instead. Always has at least one row when the
 * pool exists, even with zero visible matchdays, thanks to the `leftJoin`.
 */
export type PoolTransparencyMatchdayRow = Readonly<{
  poolId: string;
  poolName: string;
  competitionName: string;
  seasonName: string;
  matchdayId: string | null;
  matchdayNumber: number | null;
  matchdayName: string | null;
  matchdayStatus: string | null;
}>;

/**
 * One row per (match, pool membership) combination for a single matchday,
 * unlike the personal predictions read which is anchored to a single user.
 * This is intentional: the prediction transparency screen shows every
 * member's pick, so the query crosses every match of the selected matchday
 * with every membership of the pool instead of filtering by a `userId`.
 */
export type PredictionTransparencyMatchdayMatchRow = Readonly<{
  poolMembershipId: string;
  displayName: string | null;
  matchId: string;
  homeTeamName: string;
  homeTeamShortName: string | null;
  awayTeamName: string;
  awayTeamShortName: string | null;
  startsAt: Date;
  matchStatus: string;
  matchdayStatus: string;
  homeScore: number | null;
  awayScore: number | null;
  predictedResult: string | null;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  pointsEarned: number | null;
  wasExactScore: boolean | null;
  perfectMatchdayBonusPoints: number | null;
}>;

export async function listVisibleMatchdaysForPool(
  poolId: string,
): Promise<ReadonlyArray<PoolTransparencyMatchdayRow>> {
  return db
    .select({
      poolId: pools.id,
      poolName: pools.name,
      competitionName: competitions.name,
      seasonName: competitionSeasons.name,
      matchdayId: matchdays.id,
      matchdayNumber: matchdays.number,
      matchdayName: matchdays.name,
      matchdayStatus: matchdays.status,
    })
    .from(pools)
    .innerJoin(
      competitionSeasons,
      eq(pools.competitionSeasonId, competitionSeasons.id),
    )
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .leftJoin(
      matchdays,
      and(
        eq(matchdays.competitionSeasonId, competitionSeasons.id),
        inArray(matchdays.status, ["published", "finished"]),
      ),
    )
    .where(eq(pools.id, poolId))
    .orderBy(asc(matchdays.number));
}

/**
 * Full (match × membership) rows for a single matchday, scoped by `poolId`
 * instead of re-deriving it from a join chain: authorization already
 * happened in the service via `getPoolMembershipCore`, and the visible
 * matchday itself was already resolved via
 * {@link listVisibleMatchdaysForPool}.
 */
export async function listPredictionTransparencyRowsForMatchday(
  poolId: string,
  matchdayId: string,
): Promise<ReadonlyArray<PredictionTransparencyMatchdayMatchRow>> {
  const homeTeams = alias(teams, "transparency_home_teams");
  const awayTeams = alias(teams, "transparency_away_teams");

  return db
    .select({
      poolMembershipId: poolMemberships.id,
      displayName: userProfiles.displayName,
      matchId: matches.id,
      homeTeamName: homeTeams.name,
      homeTeamShortName: homeTeams.shortName,
      awayTeamName: awayTeams.name,
      awayTeamShortName: awayTeams.shortName,
      startsAt: matches.startsAt,
      matchStatus: matches.status,
      matchdayStatus: matchdays.status,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      predictedResult: poolMatchPredictions.predictedResult,
      predictedHomeScore: poolMatchPredictions.predictedHomeScore,
      predictedAwayScore: poolMatchPredictions.predictedAwayScore,
      pointsEarned: poolMatchPredictionScores.pointsEarned,
      wasExactScore: poolMatchPredictionScores.wasExactScore,
      perfectMatchdayBonusPoints: poolMatchdayPerfectBonuses.pointsAwarded,
    })
    .from(matches)
    .innerJoin(matchdays, eq(matches.matchdayId, matchdays.id))
    .innerJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
    .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    // Cross join every membership of the pool against every match of this
    // matchday: the join condition only anchors on `poolId`, not on any
    // column of `matches`, by design.
    .innerJoin(poolMemberships, eq(poolMemberships.poolId, poolId))
    .innerJoin(userProfiles, eq(poolMemberships.userId, userProfiles.userId))
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
    .where(eq(matches.matchdayId, matchdayId))
    .orderBy(
      asc(matches.startsAt),
      asc(matches.id),
      asc(poolMemberships.createdAt),
      asc(poolMemberships.id),
    );
}
