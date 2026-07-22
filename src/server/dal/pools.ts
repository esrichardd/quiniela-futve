import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import type {
  PoolCurrency,
  PoolRole,
} from "@/features/pools/types";
import type {
  NormalizedFinancialConfiguration,
  NormalizedPrizeConfiguration,
} from "@/features/pools/rules";
import { db } from "@/server/db/client";
import {
  competitions,
  poolFinancialSettings,
  poolInvitationCodes,
  poolMemberships,
  poolPredictionRules,
  poolPrizeAllocations,
  poolPrizeConfigurations,
  pools,
  userProfiles,
} from "@/server/db/schema";

type PredictionInsert =
  | Readonly<{
      mode: "simple";
      resultPoints: number;
      exactScorePoints: null;
      perfectMatchdayBonusPoints: null;
    }>
  | Readonly<{
      mode: "score";
      resultPoints: null;
      exactScorePoints: number;
      perfectMatchdayBonusPoints: null;
    }>
  | Readonly<{
      mode: "mixed";
      resultPoints: number;
      exactScorePoints: number;
      perfectMatchdayBonusPoints: number;
    }>;

export type CreatePoolRecordInput = Readonly<{
  poolId: string;
  membershipId: string;
  competitionId: string;
  creatorUserId: string;
  creationToken: string;
  invitationCode: string;
  name: string;
  description: string | null;
  financial: NormalizedFinancialConfiguration;
  prize: NormalizedPrizeConfiguration;
  prediction: PredictionInsert;
}>;

export type PoolListRecord = Readonly<{
  id: string;
  name: string;
  description: string | null;
  competitionName: string;
  role: string;
  memberCount: number;
  currency: string;
  participationFeeMinor: bigint | null;
  predictionMode: string;
  createdAt: Date;
}>;

export type PoolCoreRecord = Readonly<{
  id: string;
  name: string;
  description: string | null;
  competitionName: string;
  currentUserRole: string;
  currency: string;
  participationFeeMinor: bigint | null;
  prizeModel: string;
  prizeCalculationMode: string;
  predictionMode: string;
  resultPoints: number | null;
  exactScorePoints: number | null;
  perfectMatchdayBonusPoints: number | null;
  createdAt: Date;
}>;

export type PoolAllocationRecord = Readonly<{
  position: number;
  value: bigint;
}>;

export type PoolMemberRecord = Readonly<{
  id: string;
  displayName: string | null;
  role: string;
  createdAt: Date;
}>;

export async function createPoolRecord(
  input: CreatePoolRecordInput,
): Promise<void> {
  const poolQuery = db.insert(pools).values({
    id: input.poolId,
    competitionId: input.competitionId,
    createdByUserId: input.creatorUserId,
    creationToken: input.creationToken,
    name: input.name,
    description: input.description,
  });
  const financialQuery = db.insert(poolFinancialSettings).values({
    poolId: input.poolId,
    currency: input.financial.currency,
    hasParticipationFee: input.financial.participationFeeMinor !== null,
    participationFeeMinor: input.financial.participationFeeMinor,
  });
  const prizeQuery = db.insert(poolPrizeConfigurations).values({
    poolId: input.poolId,
    model: input.prize.model,
    calculationMode: input.prize.calculationMode,
  });
  const predictionQuery = db.insert(poolPredictionRules).values({
    poolId: input.poolId,
    ...input.prediction,
  });
  const membershipQuery = db.insert(poolMemberships).values({
    id: input.membershipId,
    poolId: input.poolId,
    userId: input.creatorUserId,
    role: "pool_admin",
  });
  const invitationQuery = db.insert(poolInvitationCodes).values({
    poolId: input.poolId,
    code: input.invitationCode,
  });

  if (input.prize.model === "winner_takes_all") {
    await db.batch([
      poolQuery,
      financialQuery,
      prizeQuery,
      predictionQuery,
      membershipQuery,
      invitationQuery,
    ]);
    return;
  }

  const allocationsQuery = db.insert(poolPrizeAllocations).values(
    input.prize.allocations.map((allocation) => ({
      poolId: input.poolId,
      prizeModel: input.prize.model,
      calculationMode: input.prize.calculationMode,
      position: allocation.position,
      value: allocation.value,
    })),
  );

  await db.batch([
    poolQuery,
    financialQuery,
    prizeQuery,
    allocationsQuery,
    predictionQuery,
    membershipQuery,
    invitationQuery,
  ]);
}

export async function getPoolIdByCreationToken(
  creatorUserId: string,
  creationToken: string,
): Promise<string | null> {
  const [pool] = await db
    .select({ id: pools.id })
    .from(pools)
    .where(
      and(
        eq(pools.createdByUserId, creatorUserId),
        eq(pools.creationToken, creationToken),
      ),
    )
    .limit(1);

  return pool?.id ?? null;
}

export async function listPoolRecordsForUser(
  userId: string,
): Promise<ReadonlyArray<PoolListRecord>> {
  return db
    .select({
      id: pools.id,
      name: pools.name,
      description: pools.description,
      competitionName: competitions.name,
      role: poolMemberships.role,
      memberCount: sql<number>`(
        select count(*)::integer
        from ${poolMemberships} member_count
        where member_count.pool_id = ${pools.id}
      )`,
      currency: poolFinancialSettings.currency,
      participationFeeMinor: poolFinancialSettings.participationFeeMinor,
      predictionMode: poolPredictionRules.mode,
      createdAt: pools.createdAt,
    })
    .from(poolMemberships)
    .innerJoin(pools, eq(poolMemberships.poolId, pools.id))
    .innerJoin(competitions, eq(pools.competitionId, competitions.id))
    .innerJoin(
      poolFinancialSettings,
      eq(poolFinancialSettings.poolId, pools.id),
    )
    .innerJoin(poolPredictionRules, eq(poolPredictionRules.poolId, pools.id))
    .where(eq(poolMemberships.userId, userId))
    .orderBy(desc(pools.createdAt));
}

export async function getPoolCoreRecordForUser(
  poolId: string,
  userId: string,
): Promise<PoolCoreRecord | null> {
  const [pool] = await db
    .select({
      id: pools.id,
      name: pools.name,
      description: pools.description,
      competitionName: competitions.name,
      currentUserRole: poolMemberships.role,
      currency: poolFinancialSettings.currency,
      participationFeeMinor: poolFinancialSettings.participationFeeMinor,
      prizeModel: poolPrizeConfigurations.model,
      prizeCalculationMode: poolPrizeConfigurations.calculationMode,
      predictionMode: poolPredictionRules.mode,
      resultPoints: poolPredictionRules.resultPoints,
      exactScorePoints: poolPredictionRules.exactScorePoints,
      perfectMatchdayBonusPoints:
        poolPredictionRules.perfectMatchdayBonusPoints,
      createdAt: pools.createdAt,
    })
    .from(poolMemberships)
    .innerJoin(pools, eq(poolMemberships.poolId, pools.id))
    .innerJoin(competitions, eq(pools.competitionId, competitions.id))
    .innerJoin(
      poolFinancialSettings,
      eq(poolFinancialSettings.poolId, pools.id),
    )
    .innerJoin(
      poolPrizeConfigurations,
      eq(poolPrizeConfigurations.poolId, pools.id),
    )
    .innerJoin(poolPredictionRules, eq(poolPredictionRules.poolId, pools.id))
    .where(
      and(eq(poolMemberships.poolId, poolId), eq(poolMemberships.userId, userId)),
    )
    .limit(1);

  return pool ?? null;
}

export async function getInvitationCodeForPool(
  poolId: string,
): Promise<string | null> {
  const [invitation] = await db
    .select({ code: poolInvitationCodes.code })
    .from(poolInvitationCodes)
    .where(eq(poolInvitationCodes.poolId, poolId))
    .limit(1);

  return invitation?.code ?? null;
}

export async function listPoolAllocationRecords(
  poolId: string,
): Promise<ReadonlyArray<PoolAllocationRecord>> {
  return db
    .select({
      position: poolPrizeAllocations.position,
      value: poolPrizeAllocations.value,
    })
    .from(poolPrizeAllocations)
    .where(eq(poolPrizeAllocations.poolId, poolId))
    .orderBy(asc(poolPrizeAllocations.position));
}

export async function listPoolMemberRecords(
  poolId: string,
): Promise<ReadonlyArray<PoolMemberRecord>> {
  return db
    .select({
      id: poolMemberships.id,
      displayName: userProfiles.displayName,
      role: poolMemberships.role,
      createdAt: poolMemberships.createdAt,
    })
    .from(poolMemberships)
    .innerJoin(userProfiles, eq(poolMemberships.userId, userProfiles.userId))
    .where(eq(poolMemberships.poolId, poolId))
    .orderBy(asc(poolMemberships.createdAt));
}

export async function getPoolMembershipRole(
  poolId: string,
  userId: string,
): Promise<PoolRole | null> {
  const [membership] = await db
    .select({ role: poolMemberships.role })
    .from(poolMemberships)
    .where(
      and(eq(poolMemberships.poolId, poolId), eq(poolMemberships.userId, userId)),
    )
    .limit(1);

  return membership ? parsePoolRole(membership.role) : null;
}

export async function getPoolIdByInvitationCode(
  code: string,
): Promise<string | null> {
  const [invitation] = await db
    .select({ poolId: poolInvitationCodes.poolId })
    .from(poolInvitationCodes)
    .where(eq(poolInvitationCodes.code, code))
    .limit(1);

  return invitation?.poolId ?? null;
}

export async function createPlayerMembershipIfMissing(input: {
  id: string;
  poolId: string;
  userId: string;
}): Promise<void> {
  await db
    .insert(poolMemberships)
    .values({ ...input, role: "player" })
    .onConflictDoNothing({
      target: [poolMemberships.poolId, poolMemberships.userId],
    });
}

export function isDatabaseConstraintError(
  error: unknown,
  constraint: string,
): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as Record<string, unknown>;
  return candidate.code === "23505" && candidate.constraint === constraint;
}

export function parsePoolRole(value: string): PoolRole {
  if (value === "pool_admin" || value === "player") {
    return value;
  }
  throw new Error("Invalid pool role persisted in the database.");
}

export function parsePoolCurrency(value: string): PoolCurrency {
  if (value === "USD" || value === "COP" || value === "VES") {
    return value;
  }
  throw new Error("Invalid pool currency persisted in the database.");
}
