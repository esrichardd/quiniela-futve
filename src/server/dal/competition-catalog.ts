import "server-only";

import { randomUUID } from "node:crypto";

import { and, asc, eq, inArray, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type {
  MatchdayStatus,
  MatchStatus,
  SeasonStatus,
} from "@/features/competition-catalog/types";
import { db } from "@/server/db/client";
import {
  competitionCatalogAuditEvents,
  competitions,
  competitionSeasons,
  matchdays,
  matches,
  poolMemberships,
  pools,
  seasonTeams,
  teams,
} from "@/server/db/schema";

export type CompetitionSeasonRecord = Readonly<{
  id: string;
  competitionId: string;
  competitionName: string;
  code: string;
  name: string;
  startsOn: string | null;
  endsOn: string | null;
  status: string;
}>;

export type AdminCompetitionSeasonRow = CompetitionSeasonRecord &
  Readonly<{
    competitionCode: string;
    competitionIsActive: boolean;
  }>;

export type TeamRecord = Readonly<{
  id: string;
  code: string;
  name: string;
  shortName: string | null;
}>;

export type MatchdayRecord = Readonly<{
  id: string;
  number: number;
  name: string | null;
  status: string;
}>;

export type MatchRecord = Readonly<{
  id: string;
  matchdayId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  startsAt: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
}>;

export type PoolCatalogRow = Readonly<{
  poolId: string;
  poolName: string;
  competitionName: string;
  seasonName: string;
  matchdayId: string | null;
  matchdayNumber: number | null;
  matchdayName: string | null;
  matchdayStatus: string | null;
  matchId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  startsAt: Date | null;
  matchStatus: string | null;
  homeScore: number | null;
  awayScore: number | null;
}>;

type AuditInput = Readonly<{
  actorUserId: string;
  action:
    | "season.created"
    | "season.status_changed"
    | "team.created"
    | "season_team.added"
    | "matchday.created"
    | "matchday.published"
    | "matchday.finished"
    | "match.created"
    | "match.schedule_changed"
    | "match.status_changed"
    | "match.result_recorded"
    | "match.result_corrected";
  entityType: "season" | "team" | "season_team" | "matchday" | "match";
  entityId: string;
  metadata?: Record<string, unknown>;
}>;

function auditValues(input: AuditInput) {
  return {
    id: randomUUID(),
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ?? {},
  };
}

export async function listAdminCompetitionSeasonRows(): Promise<
  ReadonlyArray<AdminCompetitionSeasonRow>
> {
  return db
    .select({
      id: competitionSeasons.id,
      competitionId: competitions.id,
      competitionName: competitions.name,
      competitionCode: competitions.code,
      competitionIsActive: competitions.isActive,
      code: competitionSeasons.code,
      name: competitionSeasons.name,
      startsOn: competitionSeasons.startsOn,
      endsOn: competitionSeasons.endsOn,
      status: competitionSeasons.status,
    })
    .from(competitionSeasons)
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .orderBy(asc(competitions.name), asc(competitionSeasons.startsOn), asc(competitionSeasons.name));
}

export async function listCompetitionRecords(): Promise<
  ReadonlyArray<{
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  }>
> {
  return db
    .select({
      id: competitions.id,
      code: competitions.code,
      name: competitions.name,
      isActive: competitions.isActive,
    })
    .from(competitions)
    .orderBy(asc(competitions.name));
}

export async function listActiveSeasonRecords(): Promise<
  ReadonlyArray<CompetitionSeasonRecord>
> {
  return db
    .select({
      id: competitionSeasons.id,
      competitionId: competitionSeasons.competitionId,
      competitionName: competitions.name,
      code: competitionSeasons.code,
      name: competitionSeasons.name,
      startsOn: competitionSeasons.startsOn,
      endsOn: competitionSeasons.endsOn,
      status: competitionSeasons.status,
    })
    .from(competitionSeasons)
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .where(
      and(
        eq(competitionSeasons.status, "active"),
        eq(competitions.isActive, true),
      ),
    )
    .orderBy(asc(competitions.name), asc(competitionSeasons.name));
}

export async function getCompetitionSeasonRecord(
  seasonId: string,
): Promise<CompetitionSeasonRecord | null> {
  const [record] = await db
    .select({
      id: competitionSeasons.id,
      competitionId: competitionSeasons.competitionId,
      competitionName: competitions.name,
      code: competitionSeasons.code,
      name: competitionSeasons.name,
      startsOn: competitionSeasons.startsOn,
      endsOn: competitionSeasons.endsOn,
      status: competitionSeasons.status,
    })
    .from(competitionSeasons)
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .where(eq(competitionSeasons.id, seasonId))
    .limit(1);

  return record ?? null;
}

export async function isCompetitionSeasonActive(
  seasonId: string,
): Promise<boolean> {
  const [record] = await db
    .select({ id: competitionSeasons.id })
    .from(competitionSeasons)
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .where(
      and(
        eq(competitionSeasons.id, seasonId),
        eq(competitionSeasons.status, "active"),
        eq(competitions.isActive, true),
      ),
    )
    .limit(1);
  return Boolean(record);
}

export async function listSeasonTeamRecords(
  seasonId: string,
): Promise<ReadonlyArray<TeamRecord>> {
  return db
    .select({
      id: teams.id,
      code: teams.code,
      name: teams.name,
      shortName: teams.shortName,
    })
    .from(seasonTeams)
    .innerJoin(teams, eq(seasonTeams.teamId, teams.id))
    .where(eq(seasonTeams.competitionSeasonId, seasonId))
    .orderBy(asc(teams.name));
}

export async function listTeamsOutsideSeason(
  seasonId: string,
): Promise<ReadonlyArray<TeamRecord>> {
  return db
    .select({
      id: teams.id,
      code: teams.code,
      name: teams.name,
      shortName: teams.shortName,
    })
    .from(teams)
    .where(
      notExists(
        db
          .select({ teamId: seasonTeams.teamId })
          .from(seasonTeams)
          .where(
            and(
              eq(seasonTeams.competitionSeasonId, seasonId),
              eq(seasonTeams.teamId, teams.id),
            ),
          ),
      ),
    )
    .orderBy(asc(teams.name));
}

export async function listMatchdayRecords(
  seasonId: string,
): Promise<ReadonlyArray<MatchdayRecord>> {
  return db
    .select({
      id: matchdays.id,
      number: matchdays.number,
      name: matchdays.name,
      status: matchdays.status,
    })
    .from(matchdays)
    .where(eq(matchdays.competitionSeasonId, seasonId))
    .orderBy(asc(matchdays.number));
}

export async function listMatchRecords(
  seasonId: string,
): Promise<ReadonlyArray<MatchRecord>> {
  const homeTeams = alias(teams, "home_teams");
  const awayTeams = alias(teams, "away_teams");

  return db
    .select({
      id: matches.id,
      matchdayId: matches.matchdayId,
      homeTeamId: matches.homeTeamId,
      homeTeamName: homeTeams.name,
      awayTeamId: matches.awayTeamId,
      awayTeamName: awayTeams.name,
      startsAt: matches.startsAt,
      status: matches.status,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
    })
    .from(matches)
    .innerJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
    .innerJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .where(eq(matches.competitionSeasonId, seasonId))
    .orderBy(asc(matches.startsAt), asc(matches.id));
}

export async function getMatchdayRecord(
  seasonId: string,
  matchdayId: string,
): Promise<MatchdayRecord | null> {
  const [record] = await db
    .select({
      id: matchdays.id,
      number: matchdays.number,
      name: matchdays.name,
      status: matchdays.status,
    })
    .from(matchdays)
    .where(
      and(
        eq(matchdays.id, matchdayId),
        eq(matchdays.competitionSeasonId, seasonId),
      ),
    )
    .limit(1);
  return record ?? null;
}

export async function getMatchRecord(
  seasonId: string,
  matchId: string,
): Promise<
  | Readonly<{
      id: string;
      status: string;
      startsAt: Date;
      homeScore: number | null;
      awayScore: number | null;
    }>
  | null
> {
  const [record] = await db
    .select({
      id: matches.id,
      status: matches.status,
      startsAt: matches.startsAt,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
    })
    .from(matches)
    .where(
      and(
        eq(matches.id, matchId),
        eq(matches.competitionSeasonId, seasonId),
      ),
    )
    .limit(1);
  return record ?? null;
}

export async function listMatchStatusesForMatchday(
  matchdayId: string,
): Promise<ReadonlyArray<string>> {
  const rows = await db
    .select({ status: matches.status })
    .from(matches)
    .where(eq(matches.matchdayId, matchdayId));
  return rows.map((row) => row.status);
}

export async function createSeasonRecord(input: {
  id: string;
  competitionId: string;
  name: string;
  code: string;
  startsOn: string | null;
  endsOn: string | null;
  actorUserId: string;
}): Promise<void> {
  await db.batch([
    db.insert(competitionSeasons).values({
      id: input.id,
      competitionId: input.competitionId,
      name: input.name,
      code: input.code,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
    }),
    db.insert(competitionCatalogAuditEvents).values(
      auditValues({
        actorUserId: input.actorUserId,
        action: "season.created",
        entityType: "season",
        entityId: input.id,
        metadata: { competitionId: input.competitionId },
      }),
    ),
  ]);
}

export async function updateSeasonStatusRecord(input: {
  seasonId: string;
  currentStatus: SeasonStatus;
  status: SeasonStatus;
  actorUserId: string;
}): Promise<boolean> {
  const rows = await db
    .update(competitionSeasons)
    .set({ status: input.status, updatedAt: new Date() })
    .where(
      and(
        eq(competitionSeasons.id, input.seasonId),
        eq(competitionSeasons.status, input.currentStatus),
      ),
    )
    .returning({ id: competitionSeasons.id });
  if (rows.length === 0) return false;
  await db.insert(competitionCatalogAuditEvents).values(
    auditValues({
      actorUserId: input.actorUserId,
      action: "season.status_changed",
      entityType: "season",
      entityId: input.seasonId,
      metadata: { previousStatus: input.currentStatus, status: input.status },
    }),
  );
  return true;
}

export async function createTeamAndAddToSeasonRecord(input: {
  teamId: string;
  seasonId: string;
  name: string;
  shortName: string | null;
  code: string;
  actorUserId: string;
}): Promise<void> {
  await db.batch([
    db.insert(teams).values({
      id: input.teamId,
      name: input.name,
      shortName: input.shortName,
      code: input.code,
    }),
    db.insert(seasonTeams).values({
      competitionSeasonId: input.seasonId,
      teamId: input.teamId,
    }),
    db.insert(competitionCatalogAuditEvents).values(
      auditValues({
        actorUserId: input.actorUserId,
        action: "team.created",
        entityType: "team",
        entityId: input.teamId,
      }),
    ),
    db.insert(competitionCatalogAuditEvents).values(
      auditValues({
        actorUserId: input.actorUserId,
        action: "season_team.added",
        entityType: "season_team",
        entityId: input.teamId,
        metadata: { seasonId: input.seasonId },
      }),
    ),
  ]);
}

export async function addTeamToSeasonRecord(input: {
  seasonId: string;
  teamId: string;
  actorUserId: string;
}): Promise<boolean> {
  const inserted = await db
    .insert(seasonTeams)
    .values({
      competitionSeasonId: input.seasonId,
      teamId: input.teamId,
    })
    .onConflictDoNothing()
    .returning({ teamId: seasonTeams.teamId });
  if (inserted.length === 0) return false;
  await db.insert(competitionCatalogAuditEvents).values(
    auditValues({
      actorUserId: input.actorUserId,
      action: "season_team.added",
      entityType: "season_team",
      entityId: input.teamId,
      metadata: { seasonId: input.seasonId },
    }),
  );
  return true;
}

export async function createMatchdayRecord(input: {
  id: string;
  seasonId: string;
  number: number;
  name: string | null;
  actorUserId: string;
}): Promise<void> {
  await db.batch([
    db.insert(matchdays).values({
      id: input.id,
      competitionSeasonId: input.seasonId,
      number: input.number,
      name: input.name,
    }),
    db.insert(competitionCatalogAuditEvents).values(
      auditValues({
        actorUserId: input.actorUserId,
        action: "matchday.created",
        entityType: "matchday",
        entityId: input.id,
        metadata: { seasonId: input.seasonId },
      }),
    ),
  ]);
}

export async function updateMatchdayStatusRecord(input: {
  matchdayId: string;
  currentStatus: MatchdayStatus;
  status: MatchdayStatus;
  actorUserId: string;
}): Promise<boolean> {
  const updated = await db
    .update(matchdays)
    .set({ status: input.status, updatedAt: new Date() })
    .where(
      and(
        eq(matchdays.id, input.matchdayId),
        eq(matchdays.status, input.currentStatus),
      ),
    )
    .returning({ id: matchdays.id });
  if (updated.length === 0) return false;
  await db.insert(competitionCatalogAuditEvents).values(
    auditValues({
      actorUserId: input.actorUserId,
      action:
        input.status === "published"
          ? "matchday.published"
          : "matchday.finished",
      entityType: "matchday",
      entityId: input.matchdayId,
      metadata: { previousStatus: input.currentStatus },
    }),
  );
  return true;
}

export async function createMatchRecord(input: {
  id: string;
  seasonId: string;
  matchdayId: string;
  homeTeamId: string;
  awayTeamId: string;
  startsAt: Date;
  actorUserId: string;
}): Promise<void> {
  await db.batch([
    db.insert(matches).values({
      id: input.id,
      competitionSeasonId: input.seasonId,
      matchdayId: input.matchdayId,
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      startsAt: input.startsAt,
    }),
    db.insert(competitionCatalogAuditEvents).values(
      auditValues({
        actorUserId: input.actorUserId,
        action: "match.created",
        entityType: "match",
        entityId: input.id,
        metadata: { matchdayId: input.matchdayId, seasonId: input.seasonId },
      }),
    ),
  ]);
}

export async function updateMatchRecord(input: {
  matchId: string;
  currentStatus: MatchStatus;
  status: MatchStatus;
  startsAt: Date;
  homeScore: number | null;
  awayScore: number | null;
  actorUserId: string;
  action: AuditInput["action"];
}): Promise<boolean> {
  const updated = await db
    .update(matches)
    .set({
      status: input.status,
      startsAt: input.startsAt,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(matches.id, input.matchId),
        eq(matches.status, input.currentStatus),
      ),
    )
    .returning({ id: matches.id });
  if (updated.length === 0) return false;
  await db.insert(competitionCatalogAuditEvents).values(
    auditValues({
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: "match",
      entityId: input.matchId,
      metadata: { previousStatus: input.currentStatus, status: input.status },
    }),
  );
  return true;
}

export async function listPoolCatalogRowsForUser(
  poolId: string,
  userId: string,
): Promise<ReadonlyArray<PoolCatalogRow>> {
  const homeTeams = alias(teams, "pool_home_teams");
  const awayTeams = alias(teams, "pool_away_teams");

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
      matchId: matches.id,
      homeTeamName: homeTeams.name,
      awayTeamName: awayTeams.name,
      startsAt: matches.startsAt,
      matchStatus: matches.status,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
    })
    .from(poolMemberships)
    .innerJoin(pools, eq(poolMemberships.poolId, pools.id))
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
    .leftJoin(matches, eq(matches.matchdayId, matchdays.id))
    .leftJoin(homeTeams, eq(matches.homeTeamId, homeTeams.id))
    .leftJoin(awayTeams, eq(matches.awayTeamId, awayTeams.id))
    .where(
      and(eq(poolMemberships.poolId, poolId), eq(poolMemberships.userId, userId)),
    )
    .orderBy(asc(matchdays.number), asc(matches.startsAt), asc(matches.id));
}

export function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      (error as Record<string, unknown>).code === "23505",
  );
}
