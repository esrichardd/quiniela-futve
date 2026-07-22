import type {
  FinancialConfigurationInput,
  PrizeConfigurationInput,
} from "@/features/pools/types";
import { toScaledInteger } from "@/features/pools/schemas";

export type NormalizedFinancialConfiguration = Readonly<{
  currency: FinancialConfigurationInput["currency"];
  participationFeeMinor: bigint | null;
}>;

export type NormalizedPrizeConfiguration =
  | Readonly<{ model: "winner_takes_all"; calculationMode: "pooled" }>
  | Readonly<{
      model: "first_place";
      calculationMode: "percentage";
      allocations: readonly [{ position: 1; value: bigint }];
    }>
  | Readonly<{
      model: "first_place";
      calculationMode: "fixed";
      allocations: readonly [{ position: 1; value: bigint }];
    }>
  | Readonly<{
      model: "top_three";
      calculationMode: "percentage" | "fixed";
      allocations: readonly [
        { position: 1; value: bigint },
        { position: 2; value: bigint },
        { position: 3; value: bigint },
      ];
    }>;

export function normalizeFinancialConfiguration(
  financial: FinancialConfigurationInput,
): NormalizedFinancialConfiguration {
  return {
    currency: financial.currency,
    participationFeeMinor: financial.participationFee.enabled
      ? toScaledInteger(financial.participationFee.amount, 2)
      : null,
  };
}

export function normalizePrizeConfiguration(
  prize: PrizeConfigurationInput,
): NormalizedPrizeConfiguration {
  if (prize.model === "winner_takes_all") {
    return { model: "winner_takes_all", calculationMode: "pooled" };
  }

  if (prize.model === "first_place") {
    return {
      model: "first_place",
      calculationMode: prize.distribution.mode,
      allocations: [
        {
          position: 1,
          value:
            prize.distribution.mode === "percentage"
              ? toScaledInteger(prize.distribution.percentage, 2)
              : toScaledInteger(prize.distribution.amount, 2),
        },
      ],
    };
  }

  return {
    model: "top_three",
    calculationMode: prize.distribution.mode,
    allocations: [
      { position: 1, value: toScaledInteger(prize.distribution.first, 2) },
      { position: 2, value: toScaledInteger(prize.distribution.second, 2) },
      { position: 3, value: toScaledInteger(prize.distribution.third, 2) },
    ],
  };
}

export function calculatePooledAmount(
  participationFeeMinor: bigint | null,
  memberCount: number,
): bigint {
  return (participationFeeMinor ?? BigInt(0)) * BigInt(memberCount);
}

export function calculatePercentageAmount(
  pooledAmountMinor: bigint,
  percentageBasisPoints: bigint,
): bigint {
  return (pooledAmountMinor * percentageBasisPoints) / BigInt(10_000);
}
