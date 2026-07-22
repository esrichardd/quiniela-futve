import type {
  poolCurrencies,
  poolRoles,
  predictionModes,
  prizeModels,
} from "@/features/pools/constants";

export type PoolCurrency = (typeof poolCurrencies)[number];
export type PoolRole = (typeof poolRoles)[number];
export type PrizeModel = (typeof prizeModels)[number];
export type PredictionMode = (typeof predictionModes)[number];

export type ParticipationFeeInput =
  | Readonly<{ enabled: false }>
  | Readonly<{ enabled: true; amount: string }>;

export type FinancialConfigurationInput = Readonly<{
  currency: PoolCurrency;
  participationFee: ParticipationFeeInput;
}>;

export type PrizeConfigurationInput =
  | Readonly<{ model: "winner_takes_all" }>
  | Readonly<{
      model: "first_place";
      distribution:
        | Readonly<{ mode: "percentage"; percentage: string }>
        | Readonly<{ mode: "fixed"; amount: string }>;
    }>
  | Readonly<{
      model: "top_three";
      distribution:
        | Readonly<{
            mode: "percentage";
            first: string;
            second: string;
            third: string;
          }>
        | Readonly<{
            mode: "fixed";
            first: string;
            second: string;
            third: string;
          }>;
    }>;

export type PredictionRulesInput =
  | Readonly<{ mode: "simple"; resultPoints: number }>
  | Readonly<{ mode: "score"; exactScorePoints: number }>
  | Readonly<{
      mode: "mixed";
      resultPoints: number;
      exactScorePoints: number;
      perfectMatchdayBonusPoints: number;
    }>;

export type CreatePoolInput = Readonly<{
  creationToken: string;
  competitionId: string;
  name: string;
  description?: string;
  financial: FinancialConfigurationInput;
  prize: PrizeConfigurationInput;
  prediction: PredictionRulesInput;
}>;

export type PoolActionErrorCode =
  | "authentication_required"
  | "competition_unavailable"
  | "creation_failed"
  | "invalid_configuration"
  | "invalid_invitation_code"
  | "join_failed";

export type PoolActionState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "error"; error: PoolActionErrorCode }>;

export const initialPoolActionState: PoolActionState = { status: "idle" };

export type CompetitionOption = Readonly<{
  id: string;
  code: string;
  name: string;
}>;

export type PoolListItem = Readonly<{
  id: string;
  name: string;
  description: string | null;
  competitionName: string;
  role: PoolRole;
  memberCount: number;
  currency: PoolCurrency;
  participationFeeMinor: string | null;
  predictionMode: PredictionMode;
  createdAt: string;
}>;

export type PoolListPage = Readonly<{
  items: ReadonlyArray<PoolListItem>;
  isFirstPage: boolean;
  nextCursor: string | null;
}>;

export type PoolMember = Readonly<{
  id: string;
  displayName: string | null;
  role: PoolRole;
  joinedAt: string;
}>;

export type PoolPrizeDetails =
  | Readonly<{
      model: "winner_takes_all";
      currentAmountMinor: string;
    }>
  | Readonly<{
      model: "first_place";
      distribution:
        | Readonly<{
            mode: "percentage";
            percentageBasisPoints: number;
            currentAmountMinor: string;
          }>
        | Readonly<{ mode: "fixed"; amountMinor: string }>;
    }>
  | Readonly<{
      model: "top_three";
      distribution:
        | Readonly<{
            mode: "percentage";
            allocations: ReadonlyArray<{
              position: 1 | 2 | 3;
              percentageBasisPoints: number;
              currentAmountMinor: string;
            }>;
          }>
        | Readonly<{
            mode: "fixed";
            allocations: ReadonlyArray<{
              position: 1 | 2 | 3;
              amountMinor: string;
            }>;
          }>;
    }>;

export type PoolPredictionDetails =
  | Readonly<{ mode: "simple"; resultPoints: number }>
  | Readonly<{ mode: "score"; exactScorePoints: number }>
  | Readonly<{
      mode: "mixed";
      resultPoints: number;
      exactScorePoints: number;
      perfectMatchdayBonusPoints: number;
    }>;

export type PoolDetail = Readonly<{
  id: string;
  name: string;
  description: string | null;
  competitionName: string;
  currentUserRole: PoolRole;
  invitationCode: string | null;
  memberCount: number;
  currency: PoolCurrency;
  participationFeeMinor: string | null;
  prize: PoolPrizeDetails;
  prediction: PoolPredictionDetails;
  members: ReadonlyArray<PoolMember>;
  membersPageIsFirst: boolean;
  membersNextCursor: string | null;
  createdAt: string;
}>;
