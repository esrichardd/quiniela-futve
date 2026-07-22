import { poolCurrencies } from "@/features/pools/constants";
import type {
  FinancialConfigurationInput,
  PredictionRulesInput,
  PrizeConfigurationInput,
} from "@/features/pools/types";

const DECIMAL_AMOUNT_PATTERN = /^\d{1,13}(?:\.\d{1,2})?$/;
const PERCENTAGE_PATTERN = /^\d{1,3}(?:\.\d{1,2})?$/;
const MAX_PERCENTAGE_BASIS_POINTS = BigInt(10_000);
const MAX_PREDICTION_POINTS = 32_767;

export function isValidPoolName(value: string): boolean {
  const length = value.trim().length;
  return length >= 3 && length <= 100;
}

export function isValidPoolDescription(value: string | undefined): boolean {
  return (value?.trim().length ?? 0) <= 500;
}

export function isValidDecimalAmount(value: string): boolean {
  const normalizedValue = value.trim();
  return (
    DECIMAL_AMOUNT_PATTERN.test(normalizedValue) &&
    toScaledInteger(normalizedValue, 2) > BigInt(0)
  );
}

export function isValidPercentage(value: string): boolean {
  const normalizedValue = value.trim();
  if (!PERCENTAGE_PATTERN.test(normalizedValue)) return false;

  const basisPoints = toScaledInteger(normalizedValue, 2);
  return basisPoints > BigInt(0) && basisPoints <= MAX_PERCENTAGE_BASIS_POINTS;
}

export function isValidPredictionPoints(value: number): boolean {
  return (
    Number.isInteger(value) && value > 0 && value <= MAX_PREDICTION_POINTS
  );
}

export function isValidFinancialConfiguration(
  financial: FinancialConfigurationInput,
): boolean {
  const hasValidCurrency = poolCurrencies.some(
    (currency) => currency === financial.currency,
  );

  return (
    hasValidCurrency &&
    (!financial.participationFee.enabled ||
      isValidDecimalAmount(financial.participationFee.amount))
  );
}

export function isValidPrizeConfiguration(
  prize: PrizeConfigurationInput,
): boolean {
  if (prize.model === "winner_takes_all") return true;

  if (prize.model === "first_place") {
    const { distribution } = prize;
    return distribution.mode === "percentage"
      ? isValidPercentage(distribution.percentage)
      : isValidDecimalAmount(distribution.amount);
  }

  const { distribution } = prize;
  const values = [
    distribution.first,
    distribution.second,
    distribution.third,
  ];

  if (distribution.mode === "percentage") {
    return (
      values.every(isValidPercentage) &&
      values.reduce(
        (total, value) => total + toScaledInteger(value, 2),
        BigInt(0),
      ) <= MAX_PERCENTAGE_BASIS_POINTS
    );
  }

  if (!values.every(isValidDecimalAmount)) return false;

  const [first, second, third] = values.map((value) =>
    toScaledInteger(value, 2),
  );
  return first >= second && second >= third;
}

export function isPrizeCompatibleWithFinancialConfiguration(
  prize: PrizeConfigurationInput,
  financial: FinancialConfigurationInput,
): boolean {
  return !requiresParticipationFee(prize) || financial.participationFee.enabled;
}

export function isValidPredictionRules(
  prediction: PredictionRulesInput,
): boolean {
  if (prediction.mode === "simple") {
    return isValidPredictionPoints(prediction.resultPoints);
  }

  if (prediction.mode === "score") {
    return isValidPredictionPoints(prediction.exactScorePoints);
  }

  return (
    isValidPredictionPoints(prediction.resultPoints) &&
    isValidPredictionPoints(prediction.exactScorePoints) &&
    isValidPredictionPoints(prediction.perfectMatchdayBonusPoints) &&
    prediction.exactScorePoints > prediction.resultPoints
  );
}

export function requiresParticipationFee(
  prize: PrizeConfigurationInput,
): boolean {
  if (prize.model === "winner_takes_all") return true;
  return prize.distribution.mode === "percentage";
}

export function toScaledInteger(value: string, scale: number): bigint {
  const [whole = "0", fraction = ""] = value.trim().split(".");
  const paddedFraction = fraction.padEnd(scale, "0").slice(0, scale);
  return BigInt(`${whole}${paddedFraction}`);
}
