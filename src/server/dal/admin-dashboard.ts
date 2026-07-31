import "server-only";

import { alias } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/server/db/client";
import {
  competitions,
  competitionSeasons,
  matchdays,
  matches,
  poolMemberships,
  poolMatchPredictions,
  poolPredictionRules,
  poolPrizeConfigurations,
  pools,
  userAuditEvents,
  userProfiles,
} from "@/server/db/schema";

export type AdminPoolSummary = Readonly<{
  id: string;
  name: string;
  competitionName: string;
  seasonName: string;
  predictionMode: string;
  memberCount: number;
  createdAt: Date;
}>;

export type AdminDomainMetrics = Readonly<{
  registeredUsers: number;
  verifiedUsers: number;
  createdPools: number;
  totalMemberships: number;
  competitionCount: number;
  seasonCount: number;
  poolModeBreakdown: ReadonlyArray<Readonly<{ mode: string; count: number }>>;
  pools: ReadonlyArray<AdminPoolSummary>;
}>;

export async function getAdminDomainMetrics(): Promise<AdminDomainMetrics> {
  const [
    registeredUsers,
    createdPools,
    totalMemberships,
    competitionCount,
    seasonCount,
    verifiedUsers,
    poolModeBreakdown,
    poolSummaries,
  ] = await Promise.all([
    countRows(userProfiles),
    countRows(pools),
    countRows(poolMemberships),
    countRows(competitions),
    countRows(competitionSeasons),
    countVerifiedUsers(),
    db
      .select({
        mode: poolPredictionRules.mode,
        count: sql<number>`count(*)::integer`,
      })
      .from(poolPredictionRules)
      .groupBy(poolPredictionRules.mode)
      .orderBy(asc(poolPredictionRules.mode)),
    db
      .select({
        id: pools.id,
        name: pools.name,
        competitionName: competitions.name,
        seasonName: competitionSeasons.name,
        predictionMode: poolPredictionRules.mode,
        memberCount: sql<number>`count(${poolMemberships.id})::integer`,
        createdAt: pools.createdAt,
      })
      .from(pools)
      .innerJoin(
        competitionSeasons,
        eq(pools.competitionSeasonId, competitionSeasons.id),
      )
      .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
      .innerJoin(
        poolPredictionRules,
        eq(poolPredictionRules.poolId, pools.id),
      )
      .leftJoin(poolMemberships, eq(poolMemberships.poolId, pools.id))
      .groupBy(
        pools.id,
        pools.name,
        competitions.name,
        competitionSeasons.name,
        poolPredictionRules.mode,
        pools.createdAt,
      )
      .orderBy(desc(pools.createdAt), desc(pools.id)),
  ]);

  return {
    registeredUsers,
    verifiedUsers,
    createdPools,
    totalMemberships,
    competitionCount,
    seasonCount,
    poolModeBreakdown,
    pools: poolSummaries,
  };
}

export type AdminPoolMember = Readonly<{
  id: string;
  displayName: string | null;
  email: string | null;
  role: string;
  joinedAt: Date;
}>;

export type AdminPoolDetails = Readonly<{
  id: string;
  name: string;
  description: string | null;
  competitionName: string;
  seasonName: string;
  predictionMode: string;
  prizeModel: string;
  createdAt: Date;
  creator: Readonly<{
    displayName: string | null;
    email: string | null;
  }>;
  members: ReadonlyArray<AdminPoolMember>;
  matchdays: ReadonlyArray<AdminMatchdayProgress>;
}>;

export type AdminMatchdayProgress = Readonly<{
  id: string;
  number: number;
  name: string | null;
  status: string;
  matchCount: number;
  submittedMemberCount: number;
}>;

export async function getAdminPoolDetails(
  poolId: string,
): Promise<AdminPoolDetails | null> {
  const memberProfiles = alias(userProfiles, "admin_pool_member_profiles");
  const rows = await db
    .select({
      id: pools.id,
      name: pools.name,
      description: pools.description,
      competitionName: competitions.name,
      seasonName: competitionSeasons.name,
      predictionMode: poolPredictionRules.mode,
      prizeModel: poolPrizeConfigurations.model,
      createdAt: pools.createdAt,
      creatorDisplayName: userProfiles.displayName,
      creatorEmail: userProfiles.email,
      memberId: poolMemberships.id,
      memberDisplayName: memberProfiles.displayName,
      memberEmail: memberProfiles.email,
      memberRole: poolMemberships.role,
      memberJoinedAt: poolMemberships.createdAt,
    })
    .from(pools)
    .innerJoin(
      competitionSeasons,
      eq(pools.competitionSeasonId, competitionSeasons.id),
    )
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .innerJoin(
      poolPredictionRules,
      eq(poolPredictionRules.poolId, pools.id),
    )
    .innerJoin(
      poolPrizeConfigurations,
      eq(poolPrizeConfigurations.poolId, pools.id),
    )
    .innerJoin(userProfiles, eq(pools.createdByUserId, userProfiles.userId))
    .leftJoin(poolMemberships, eq(poolMemberships.poolId, pools.id))
    .leftJoin(memberProfiles, eq(poolMemberships.userId, memberProfiles.userId))
    .where(eq(pools.id, poolId))
    .orderBy(asc(poolMemberships.createdAt), asc(poolMemberships.id));

  const matchdayProgress = await db
    .select({
      id: matchdays.id,
      number: matchdays.number,
      name: matchdays.name,
      status: matchdays.status,
      matchCount: sql<number>`count(distinct ${matches.id})::integer`,
      submittedMemberCount: sql<number>`count(distinct ${poolMatchPredictions.poolMembershipId})::integer`,
    })
    .from(pools)
    .innerJoin(
      matchdays,
      eq(matchdays.competitionSeasonId, pools.competitionSeasonId),
    )
    .leftJoin(matches, eq(matches.matchdayId, matchdays.id))
    .leftJoin(
      poolMatchPredictions,
      and(
        eq(poolMatchPredictions.poolId, pools.id),
        eq(poolMatchPredictions.matchId, matches.id),
      ),
    )
    .where(eq(pools.id, poolId))
    .groupBy(matchdays.id, matchdays.number, matchdays.name, matchdays.status)
    .orderBy(asc(matchdays.number), asc(matchdays.id));

  const firstRow = rows[0];
  if (!firstRow) {
    return null;
  }

  return {
    id: firstRow.id,
    name: firstRow.name,
    description: firstRow.description,
    competitionName: firstRow.competitionName,
    seasonName: firstRow.seasonName,
    predictionMode: firstRow.predictionMode,
    prizeModel: firstRow.prizeModel,
    createdAt: firstRow.createdAt,
    creator: {
      displayName: firstRow.creatorDisplayName,
      email: firstRow.creatorEmail,
    },
    members: rows.flatMap((row) =>
      row.memberId && row.memberJoinedAt
        ? [
            {
              id: row.memberId,
              displayName: row.memberDisplayName,
              email: row.memberEmail,
              role: row.memberRole ?? "player",
              joinedAt: row.memberJoinedAt,
            },
          ]
        : [],
    ),
    matchdays: matchdayProgress,
  };
}

async function countRows(
  table:
    | typeof userProfiles
    | typeof pools
    | typeof poolMemberships
    | typeof competitions
    | typeof competitionSeasons,
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::integer` })
    .from(table);

  return result?.count ?? 0;
}

async function countVerifiedUsers(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::integer` })
    .from(userProfiles)
    .where(sql`
      ${userProfiles.emailVerifiedAt} is not null
      or exists (
        select 1
        from ${userAuditEvents}
        where ${userAuditEvents.targetUserId} = ${userProfiles.userId}
          and ${userAuditEvents.action} = 'user.created'
          and ${userAuditEvents.metadata}->>'emailVerified' = 'true'
      )
    `);

  return result?.count ?? 0;
}
