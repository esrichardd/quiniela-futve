import "server-only";

import { randomUUID } from "node:crypto";

import type {
  AdminCompetition,
  AdminMatch,
  AdminSeasonDetail,
  MatchdayStatus,
  MatchStatus,
  PoolMatch,
  PoolMatchday,
  PoolMatchdaysView,
  SeasonStatus,
} from "@/features/competition-catalog/types";
import {
  canTransitionMatch,
  canTransitionMatchday,
  canTransitionSeason,
  matchdayCanFinish,
  normalizeCatalogCode,
} from "@/features/competition-catalog/rules";
import { assertPlatformAdmin, PoolMembershipRequiredError } from "@/server/auth/permissions";
import { requireVerifiedAppUser } from "@/server/auth/session";
import { invalidateCompetitionCatalog } from "@/server/cache/competition-catalog";
import {
  addTeamToSeasonRecord,
  createMatchdayRecord,
  createMatchRecord,
  createSeasonRecord,
  createTeamAndAddToSeasonRecord,
  getCompetitionSeasonRecord,
  getMatchdayRecord,
  getMatchRecord,
  isUniqueViolation,
  listAdminCompetitionSeasonRows,
  listCompetitionRecords,
  listMatchdayRecords,
  listMatchRecords,
  listMatchStatusesForMatchday,
  listPoolCatalogRowsForUser,
  listSeasonTeamRecords,
  listTeamsOutsideSeason,
  updateMatchdayStatusRecord,
  updateMatchRecord,
  updateSeasonStatusRecord,
} from "@/server/dal/competition-catalog";

export class CatalogNotFoundError extends Error {
  constructor() {
    super("Catalog entity was not found.");
    this.name = "CatalogNotFoundError";
  }
}

export class CatalogConflictError extends Error {
  constructor() {
    super("Catalog entity conflicts with existing data.");
    this.name = "CatalogConflictError";
  }
}

export class CatalogTransitionError extends Error {
  constructor() {
    super("Catalog state transition is invalid.");
    this.name = "CatalogTransitionError";
  }
}

async function requireAdminActor(): Promise<string> {
  const appUser = await requireVerifiedAppUser();
  assertPlatformAdmin(appUser.profile.globalRole);
  return appUser.id;
}

export async function listAdminCompetitions(): Promise<
  ReadonlyArray<AdminCompetition>
> {
  await requireAdminActor();
  const [competitions, seasons] = await Promise.all([
    listCompetitionRecords(),
    listAdminCompetitionSeasonRows(),
  ]);
  return competitions.map((competition) => ({
    ...competition,
    seasons: seasons
      .filter((season) => season.competitionId === competition.id)
      .map((season) => ({
        id: season.id,
        code: season.code,
        name: season.name,
        status: parseSeasonStatus(season.status),
        startsOn: season.startsOn,
        endsOn: season.endsOn,
      })),
  }));
}

export async function getAdminSeasonDetail(
  seasonId: string,
): Promise<AdminSeasonDetail> {
  await requireAdminActor();
  const season = await getCompetitionSeasonRecord(seasonId);
  if (!season) throw new CatalogNotFoundError();

  const [seasonTeamRows, availableTeams, matchdayRows, matchRows] =
    await Promise.all([
      listSeasonTeamRecords(seasonId),
      listTeamsOutsideSeason(seasonId),
      listMatchdayRecords(seasonId),
      listMatchRecords(seasonId),
    ]);

  return {
    id: season.id,
    competitionId: season.competitionId,
    competitionName: season.competitionName,
    code: season.code,
    name: season.name,
    startsOn: season.startsOn,
    endsOn: season.endsOn,
    status: parseSeasonStatus(season.status),
    teams: seasonTeamRows,
    availableTeams,
    matchdays: matchdayRows.map((matchday) => ({
      id: matchday.id,
      number: matchday.number,
      name: matchday.name,
      status: parseMatchdayStatus(matchday.status),
      matches: matchRows
        .filter((match) => match.matchdayId === matchday.id)
        .map(mapAdminMatch),
    })),
  };
}

export async function createSeason(input: {
  competitionId: string;
  name: string;
  code: string;
  startsOn: string | null;
  endsOn: string | null;
}): Promise<string> {
  const actorUserId = await requireAdminActor();
  const id = randomUUID();
  try {
    await createSeasonRecord({
      id,
      competitionId: input.competitionId,
      name: input.name.trim(),
      code: normalizeCatalogCode(input.code),
      startsOn: input.startsOn,
      endsOn: input.endsOn,
      actorUserId,
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new CatalogConflictError();
    throw error;
  }
  invalidateCompetitionCatalog();
  return id;
}

export async function updateSeasonStatus(input: {
  seasonId: string;
  status: SeasonStatus;
}): Promise<void> {
  const actorUserId = await requireAdminActor();
  const season = await getCompetitionSeasonRecord(input.seasonId);
  if (!season) throw new CatalogNotFoundError();
  const current = parseSeasonStatus(season.status);
  if (!canTransitionSeason(current, input.status)) {
    throw new CatalogTransitionError();
  }
  if (!(await updateSeasonStatusRecord({
    seasonId: input.seasonId,
    currentStatus: current,
    status: input.status,
    actorUserId,
  }))) {
    throw new CatalogConflictError();
  }
  invalidateCompetitionCatalog();
}

export async function createTeam(input: {
  seasonId: string;
  name: string;
  shortName: string | null;
  code: string;
}): Promise<void> {
  const actorUserId = await requireAdminActor();
  await requireMutableSeason(input.seasonId);
  try {
    await createTeamAndAddToSeasonRecord({
      teamId: randomUUID(),
      seasonId: input.seasonId,
      name: input.name.trim(),
      shortName: input.shortName?.trim() || null,
      code: normalizeCatalogCode(input.code),
      actorUserId,
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new CatalogConflictError();
    throw error;
  }
}

export async function addTeamToSeason(input: {
  seasonId: string;
  teamId: string;
}): Promise<void> {
  const actorUserId = await requireAdminActor();
  await requireMutableSeason(input.seasonId);
  if (!(await addTeamToSeasonRecord({ ...input, actorUserId }))) {
    throw new CatalogConflictError();
  }
}

export async function createMatchday(input: {
  seasonId: string;
  number: number;
  name: string | null;
}): Promise<void> {
  const actorUserId = await requireAdminActor();
  await requireMutableSeason(input.seasonId);
  try {
    await createMatchdayRecord({
      id: randomUUID(),
      seasonId: input.seasonId,
      number: input.number,
      name: input.name?.trim() || null,
      actorUserId,
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new CatalogConflictError();
    throw error;
  }
}

export async function transitionMatchday(input: {
  seasonId: string;
  matchdayId: string;
  status: "published" | "finished";
}): Promise<void> {
  const actorUserId = await requireAdminActor();
  const matchday = await getMatchdayRecord(input.seasonId, input.matchdayId);
  if (!matchday) throw new CatalogNotFoundError();
  const current = parseMatchdayStatus(matchday.status);
  if (!canTransitionMatchday(current, input.status)) {
    throw new CatalogTransitionError();
  }
  const statuses = (await listMatchStatusesForMatchday(input.matchdayId)).map(
    parseMatchStatus,
  );
  if (
    (input.status === "published" && statuses.length === 0) ||
    (input.status === "finished" && !matchdayCanFinish(statuses))
  ) {
    throw new CatalogTransitionError();
  }
  if (!(await updateMatchdayStatusRecord({
    matchdayId: input.matchdayId,
    currentStatus: current,
    status: input.status,
    actorUserId,
  }))) {
    throw new CatalogConflictError();
  }
}

export async function createMatch(input: {
  seasonId: string;
  matchdayId: string;
  homeTeamId: string;
  awayTeamId: string;
  startsAt: string;
}): Promise<void> {
  const actorUserId = await requireAdminActor();
  const matchday = await getMatchdayRecord(input.seasonId, input.matchdayId);
  if (!matchday) throw new CatalogNotFoundError();
  if (parseMatchdayStatus(matchday.status) !== "draft") {
    throw new CatalogTransitionError();
  }
  try {
    await createMatchRecord({
      id: randomUUID(),
      seasonId: input.seasonId,
      matchdayId: input.matchdayId,
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      startsAt: new Date(input.startsAt),
      actorUserId,
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new CatalogConflictError();
    throw error;
  }
}

export async function updateMatch(input: {
  seasonId: string;
  matchId: string;
  status: MatchStatus;
  startsAt: string;
  homeScore: number | null;
  awayScore: number | null;
}): Promise<void> {
  const actorUserId = await requireAdminActor();
  const match = await getMatchRecord(input.seasonId, input.matchId);
  if (!match) throw new CatalogNotFoundError();
  const current = parseMatchStatus(match.status);
  if (!canTransitionMatch(current, input.status)) {
    throw new CatalogTransitionError();
  }
  const startsAt = new Date(input.startsAt);
  const action =
    input.status === "finished"
      ? current === "finished"
        ? "match.result_corrected"
        : "match.result_recorded"
      : startsAt.getTime() !== match.startsAt.getTime()
        ? "match.schedule_changed"
        : "match.status_changed";
  if (!(await updateMatchRecord({
    matchId: input.matchId,
    currentStatus: current,
    status: input.status,
    startsAt,
    homeScore: input.homeScore,
    awayScore: input.awayScore,
    actorUserId,
    action,
  }))) {
    throw new CatalogConflictError();
  }
}

export async function getCurrentUserPoolMatchdays(
  poolId: string,
  selectedMatchdayId?: string,
): Promise<PoolMatchdaysView> {
  const appUser = await requireVerifiedAppUser();
  const rows = await listPoolCatalogRowsForUser(poolId, appUser.id);
  const core = rows[0];
  if (!core) throw new PoolMembershipRequiredError();

  const grouped = new Map<string, PoolMatchday>();
  for (const row of rows) {
    if (
      !row.matchdayId ||
      row.matchdayNumber === null ||
      (row.matchdayStatus !== "published" && row.matchdayStatus !== "finished")
    ) continue;
    const current = grouped.get(row.matchdayId);
    const match = mapPoolMatch(row);
    if (current) {
      if (match) {
        grouped.set(row.matchdayId, { ...current, matches: [...current.matches, match] });
      }
    } else {
      grouped.set(row.matchdayId, {
        id: row.matchdayId,
        number: row.matchdayNumber,
        name: row.matchdayName,
        status: row.matchdayStatus,
        matches: match ? [match] : [],
      });
    }
  }
  const visibleMatchdays = [...grouped.values()];
  const selected = selectedMatchdayId && grouped.has(selectedMatchdayId)
    ? selectedMatchdayId
    : visibleMatchdays[0]?.id ?? null;
  return {
    poolId: core.poolId,
    poolName: core.poolName,
    competitionName: core.competitionName,
    seasonName: core.seasonName,
    selectedMatchdayId: selected,
    matchdays: visibleMatchdays,
  };
}

async function requireMutableSeason(seasonId: string): Promise<void> {
  const season = await getCompetitionSeasonRecord(seasonId);
  if (!season) throw new CatalogNotFoundError();
  if (parseSeasonStatus(season.status) === "finished") {
    throw new CatalogTransitionError();
  }
}

function mapAdminMatch(record: Awaited<ReturnType<typeof listMatchRecords>>[number]): AdminMatch {
  return {
    ...record,
    startsAt: record.startsAt.toISOString(),
    status: parseMatchStatus(record.status),
  };
}

function mapPoolMatch(
  row: Awaited<ReturnType<typeof listPoolCatalogRowsForUser>>[number],
): PoolMatch | null {
  if (!row.matchId || !row.homeTeamName || !row.awayTeamName || !row.startsAt || !row.matchStatus) {
    return null;
  }
  const base = {
    id: row.matchId,
    homeTeamName: row.homeTeamName,
    awayTeamName: row.awayTeamName,
    startsAt: row.startsAt.toISOString(),
  };
  const status = parseMatchStatus(row.matchStatus);
  if (status === "finished") {
    if (row.homeScore === null || row.awayScore === null) {
      throw new Error("Finished match result is incomplete.");
    }
    return { ...base, status, homeScore: row.homeScore, awayScore: row.awayScore };
  }
  return { ...base, status };
}

function parseSeasonStatus(value: string): SeasonStatus {
  if (value === "draft" || value === "active" || value === "finished") return value;
  throw new Error("Invalid season status persisted in the database.");
}

function parseMatchdayStatus(value: string): MatchdayStatus {
  if (value === "draft" || value === "published" || value === "finished") return value;
  throw new Error("Invalid matchday status persisted in the database.");
}

function parseMatchStatus(value: string): MatchStatus {
  if (
    value === "scheduled" ||
    value === "postponed" ||
    value === "in_progress" ||
    value === "finished" ||
    value === "cancelled"
  ) return value;
  throw new Error("Invalid match status persisted in the database.");
}
