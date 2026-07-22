import "server-only";

import { randomInt, randomUUID } from "node:crypto";

import {
  INVITATION_CODE_ALPHABET,
  INVITATION_CODE_LENGTH,
  MAX_INVITATION_CODE_ATTEMPTS,
} from "@/features/pools/constants";
import {
  calculatePercentageAmount,
  calculatePooledAmount,
  normalizeFinancialConfiguration,
  normalizePrizeConfiguration,
} from "@/features/pools/rules";
import type {
  CompetitionOption,
  CreatePoolInput,
  PoolDetail,
  PoolListItem,
  PoolPredictionDetails,
  PoolPrizeDetails,
} from "@/features/pools/types";
import {
  assertPoolAdmin,
  requirePoolMembership,
} from "@/server/auth/permissions";
import { requireVerifiedAppUser } from "@/server/auth/session";
import {
  isCompetitionActive,
  listActiveCompetitions,
} from "@/server/dal/competitions";
import {
  createPlayerMembershipIfMissing,
  createPoolRecord,
  getInvitationCodeForPool,
  getPoolCoreRecordForUser,
  getPoolIdByCreationToken,
  getPoolIdByInvitationCode,
  isDatabaseConstraintError,
  listPoolAllocationRecords,
  listPoolMemberRecords,
  listPoolRecordsForUser,
  parsePoolCurrency,
  parsePoolRole,
  type PoolAllocationRecord,
  type PoolCoreRecord,
} from "@/server/dal/pools";

const INVITATION_CODE_CONSTRAINT = "pool_invitation_codes_code_unique";
const CREATION_TOKEN_CONSTRAINT = "pools_creator_creation_token_unique";

export class CompetitionUnavailableError extends Error {
  constructor() {
    super("Competition is unavailable.");
    this.name = "CompetitionUnavailableError";
  }
}

export class InvalidInvitationCodeError extends Error {
  constructor() {
    super("Invitation code is invalid.");
    this.name = "InvalidInvitationCodeError";
  }
}

export async function getAvailableCompetitionOptions(): Promise<
  ReadonlyArray<CompetitionOption>
> {
  await requireVerifiedAppUser();
  return listActiveCompetitions();
}

export async function createPool(input: CreatePoolInput): Promise<string> {
  const appUser = await requireVerifiedAppUser();
  const existingPoolId = await getPoolIdByCreationToken(
    appUser.id,
    input.creationToken,
  );

  if (existingPoolId) {
    return existingPoolId;
  }

  if (!(await isCompetitionActive(input.competitionId))) {
    throw new CompetitionUnavailableError();
  }

  const poolId = randomUUID();
  const membershipId = randomUUID();
  const financial = normalizeFinancialConfiguration(input.financial);
  const prize = normalizePrizeConfiguration(input.prize);
  const prediction = normalizePrediction(input.prediction);

  for (let attempt = 0; attempt < MAX_INVITATION_CODE_ATTEMPTS; attempt += 1) {
    try {
      await createPoolRecord({
        poolId,
        membershipId,
        competitionId: input.competitionId,
        creatorUserId: appUser.id,
        creationToken: input.creationToken,
        invitationCode: generateInvitationCode(),
        name: input.name.trim(),
        description: normalizeOptionalText(input.description),
        financial,
        prize,
        prediction,
      });
      return poolId;
    } catch (error) {
      if (isDatabaseConstraintError(error, INVITATION_CODE_CONSTRAINT)) {
        continue;
      }

      if (isDatabaseConstraintError(error, CREATION_TOKEN_CONSTRAINT)) {
        const concurrentPoolId = await getPoolIdByCreationToken(
          appUser.id,
          input.creationToken,
        );
        if (concurrentPoolId) {
          return concurrentPoolId;
        }
      }

      throw error;
    }
  }

  throw new Error("A unique invitation code could not be generated.");
}

export async function joinPool(code: string): Promise<string> {
  const appUser = await requireVerifiedAppUser();
  const poolId = await getPoolIdByInvitationCode(code);

  if (!poolId) {
    throw new InvalidInvitationCodeError();
  }

  await createPlayerMembershipIfMissing({
    id: randomUUID(),
    poolId,
    userId: appUser.id,
  });

  return poolId;
}

export async function listCurrentUserPools(): Promise<
  ReadonlyArray<PoolListItem>
> {
  const appUser = await requireVerifiedAppUser();
  const records = await listPoolRecordsForUser(appUser.id);

  return records.map((record) => ({
    id: record.id,
    name: record.name,
    description: record.description,
    competitionName: record.competitionName,
    role: parsePoolRole(record.role),
    memberCount: record.memberCount,
    currency: parsePoolCurrency(record.currency),
    participationFeeMinor: record.participationFeeMinor?.toString() ?? null,
    predictionMode: parsePredictionMode(record.predictionMode),
    createdAt: record.createdAt.toISOString(),
  }));
}

export async function getCurrentUserPoolDetail(
  poolId: string,
): Promise<PoolDetail> {
  const appUser = await requireVerifiedAppUser();
  const currentRole = await requirePoolMembership(poolId, appUser.id);
  const core = await getPoolCoreRecordForUser(poolId, appUser.id);

  if (!core) {
    throw new Error("Pool detail could not be resolved.");
  }

  const [allocations, members, invitationCode] = await Promise.all([
    listPoolAllocationRecords(poolId),
    listPoolMemberRecords(poolId),
    currentRole === "pool_admin"
      ? getInvitationCodeForAdmin(poolId, currentRole)
      : Promise.resolve(null),
  ]);
  const currency = parsePoolCurrency(core.currency);
  const memberCount = members.length;
  const pooledAmount = calculatePooledAmount(
    core.participationFeeMinor,
    memberCount,
  );

  return {
    id: core.id,
    name: core.name,
    description: core.description,
    competitionName: core.competitionName,
    currentUserRole: parsePoolRole(core.currentUserRole),
    invitationCode,
    memberCount,
    currency,
    participationFeeMinor: core.participationFeeMinor?.toString() ?? null,
    prize: mapPrizeDetails(core, allocations, pooledAmount),
    prediction: mapPredictionDetails(core),
    members: members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      role: parsePoolRole(member.role),
      joinedAt: member.createdAt.toISOString(),
    })),
    createdAt: core.createdAt.toISOString(),
  };
}

async function getInvitationCodeForAdmin(
  poolId: string,
  role: "pool_admin" | "player",
): Promise<string | null> {
  assertPoolAdmin(role);
  return getInvitationCodeForPool(poolId);
}

function normalizePrediction(
  prediction: CreatePoolInput["prediction"],
) {
  if (prediction.mode === "simple") {
    return {
      mode: "simple" as const,
      resultPoints: prediction.resultPoints,
      exactScorePoints: null,
      perfectMatchdayBonusPoints: null,
    };
  }
  if (prediction.mode === "score") {
    return {
      mode: "score" as const,
      resultPoints: null,
      exactScorePoints: prediction.exactScorePoints,
      perfectMatchdayBonusPoints: null,
    };
  }
  return {
    mode: "mixed" as const,
    resultPoints: prediction.resultPoints,
    exactScorePoints: prediction.exactScorePoints,
    perfectMatchdayBonusPoints: prediction.perfectMatchdayBonusPoints,
  };
}

function mapPrizeDetails(
  core: PoolCoreRecord,
  allocations: ReadonlyArray<PoolAllocationRecord>,
  pooledAmount: bigint,
): PoolPrizeDetails {
  if (core.prizeModel === "winner_takes_all") {
    return {
      model: "winner_takes_all",
      currentAmountMinor: pooledAmount.toString(),
    };
  }

  if (core.prizeModel === "first_place") {
    const allocation = requireAllocation(allocations, 1);
    if (core.prizeCalculationMode === "percentage") {
      return {
        model: "first_place",
        distribution: {
          mode: "percentage",
          percentageBasisPoints: Number(allocation.value),
          currentAmountMinor: calculatePercentageAmount(
            pooledAmount,
            allocation.value,
          ).toString(),
        },
      };
    }
    if (core.prizeCalculationMode === "fixed") {
      return {
        model: "first_place",
        distribution: {
          mode: "fixed",
          amountMinor: allocation.value.toString(),
        },
      };
    }
  }

  if (core.prizeModel === "top_three") {
    const positions = [1, 2, 3] as const;
    if (core.prizeCalculationMode === "percentage") {
      return {
        model: "top_three",
        distribution: {
          mode: "percentage",
          allocations: positions.map((position) => {
            const allocation = requireAllocation(allocations, position);
            return {
              position,
              percentageBasisPoints: Number(allocation.value),
              currentAmountMinor: calculatePercentageAmount(
                pooledAmount,
                allocation.value,
              ).toString(),
            };
          }),
        },
      };
    }
    if (core.prizeCalculationMode === "fixed") {
      return {
        model: "top_three",
        distribution: {
          mode: "fixed",
          allocations: positions.map((position) => ({
            position,
            amountMinor: requireAllocation(allocations, position).value.toString(),
          })),
        },
      };
    }
  }

  throw new Error("Invalid prize configuration persisted in the database.");
}

function mapPredictionDetails(core: PoolCoreRecord): PoolPredictionDetails {
  if (core.predictionMode === "simple" && core.resultPoints !== null) {
    return { mode: "simple", resultPoints: core.resultPoints };
  }
  if (core.predictionMode === "score" && core.exactScorePoints !== null) {
    return { mode: "score", exactScorePoints: core.exactScorePoints };
  }
  if (
    core.predictionMode === "mixed" &&
    core.resultPoints !== null &&
    core.exactScorePoints !== null &&
    core.perfectMatchdayBonusPoints !== null
  ) {
    return {
      mode: "mixed",
      resultPoints: core.resultPoints,
      exactScorePoints: core.exactScorePoints,
      perfectMatchdayBonusPoints: core.perfectMatchdayBonusPoints,
    };
  }
  throw new Error("Invalid prediction rules persisted in the database.");
}

function requireAllocation(
  allocations: ReadonlyArray<PoolAllocationRecord>,
  position: 1 | 2 | 3,
): PoolAllocationRecord {
  const allocation = allocations.find((item) => item.position === position);
  if (!allocation) {
    throw new Error("Prize allocation could not be resolved.");
  }
  return allocation;
}

function generateInvitationCode(): string {
  let code = "";
  for (let index = 0; index < INVITATION_CODE_LENGTH; index += 1) {
    code += INVITATION_CODE_ALPHABET[
      randomInt(INVITATION_CODE_ALPHABET.length)
    ];
  }
  return code;
}

function normalizeOptionalText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parsePredictionMode(value: string): PoolListItem["predictionMode"] {
  if (value === "simple" || value === "score" || value === "mixed") {
    return value;
  }
  throw new Error("Invalid prediction mode persisted in the database.");
}
