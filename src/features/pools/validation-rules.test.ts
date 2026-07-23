import { describe, expect, it } from "vitest";

import { createPoolSchema } from "@/features/pools/schemas";
import type { CreatePoolInput } from "@/features/pools/types";
import {
  isPrizeCompatibleWithFinancialConfiguration,
  isValidDecimalAmount,
  isValidFinancialConfiguration,
  isValidPercentage,
  isValidPoolDescription,
  isValidPoolName,
  isValidPredictionRules,
  isValidPrizeConfiguration,
} from "@/features/pools/validation-rules";

const validConfiguration: CreatePoolInput = {
  creationToken: "00000000-0000-4000-8000-000000000010",
  competitionSeasonId: "00000000-0000-4000-8000-000000000001",
  name: "Quiniela de prueba",
  description: "Configuración válida",
  financial: {
    currency: "USD",
    participationFee: { enabled: true, amount: "10.50" },
  },
  prize: {
    model: "top_three",
    distribution: {
      mode: "percentage",
      first: "50",
      second: "30",
      third: "20",
    },
  },
  prediction: {
    mode: "mixed",
    resultPoints: 1,
    exactScorePoints: 3,
    perfectMatchdayBonusPoints: 5,
  },
};

describe("pool client validation rules", () => {
  it("validates general fields at their boundaries", () => {
    expect(isValidPoolName("abc")).toBe(true);
    expect(isValidPoolName("ab")).toBe(false);
    expect(isValidPoolName("x".repeat(100))).toBe(true);
    expect(isValidPoolName("x".repeat(101))).toBe(false);
    expect(isValidPoolDescription("x".repeat(500))).toBe(true);
    expect(isValidPoolDescription("x".repeat(501))).toBe(false);
  });

  it("validates monetary amounts without floating-point comparisons", () => {
    expect(isValidDecimalAmount("0.01")).toBe(true);
    expect(isValidDecimalAmount("9999999999999.99")).toBe(true);
    expect(isValidDecimalAmount("0")).toBe(false);
    expect(isValidDecimalAmount("1.001")).toBe(false);
    expect(isValidDecimalAmount("10000000000000")).toBe(false);
    expect(isValidDecimalAmount("-1")).toBe(false);
    expect(isValidFinancialConfiguration(validConfiguration.financial)).toBe(
      true,
    );
  });

  it("validates percentages and top-three totals", () => {
    expect(isValidPercentage("0.01")).toBe(true);
    expect(isValidPercentage("100")).toBe(true);
    expect(isValidPercentage("0")).toBe(false);
    expect(isValidPercentage("100.01")).toBe(false);
    expect(isValidPrizeConfiguration(validConfiguration.prize)).toBe(true);
    expect(
      isValidPrizeConfiguration({
        model: "top_three",
        distribution: {
          mode: "percentage",
          first: "50.01",
          second: "30",
          third: "20",
        },
      }),
    ).toBe(false);
  });

  it("requires descending fixed prizes", () => {
    expect(
      isValidPrizeConfiguration({
        model: "top_three",
        distribution: {
          mode: "fixed",
          first: "100",
          second: "50",
          third: "25",
        },
      }),
    ).toBe(true);
    expect(
      isValidPrizeConfiguration({
        model: "top_three",
        distribution: {
          mode: "fixed",
          first: "25",
          second: "50",
          third: "10",
        },
      }),
    ).toBe(false);
  });

  it("requires a fee for pooled and percentage prizes", () => {
    const freeFinancial = {
      currency: "USD",
      participationFee: { enabled: false },
    } as const;

    expect(
      isPrizeCompatibleWithFinancialConfiguration(
        { model: "winner_takes_all" },
        freeFinancial,
      ),
    ).toBe(false);
    expect(
      isPrizeCompatibleWithFinancialConfiguration(
        {
          model: "first_place",
          distribution: { mode: "percentage", percentage: "50" },
        },
        freeFinancial,
      ),
    ).toBe(false);
    expect(
      isPrizeCompatibleWithFinancialConfiguration(
        {
          model: "first_place",
          distribution: { mode: "fixed", amount: "10" },
        },
        freeFinancial,
      ),
    ).toBe(true);
  });

  it("validates integer scoring and mixed-mode ordering", () => {
    expect(isValidPredictionRules(validConfiguration.prediction)).toBe(true);
    expect(
      isValidPredictionRules({ mode: "simple", resultPoints: 32_768 }),
    ).toBe(false);
    expect(
      isValidPredictionRules({ mode: "score", exactScorePoints: 1.5 }),
    ).toBe(false);
    expect(
      isValidPredictionRules({
        mode: "mixed",
        resultPoints: 3,
        exactScorePoints: 3,
        perfectMatchdayBonusPoints: 5,
      }),
    ).toBe(false);
  });
});

describe("authoritative create pool schema", () => {
  it("accepts the valid configuration", () => {
    expect(createPoolSchema.safeParse(validConfiguration).success).toBe(true);
  });

  it("rejects manipulated identifiers and cross-field rules", () => {
    expect(
      createPoolSchema.safeParse({
        ...validConfiguration,
        competitionSeasonId: "not-a-uuid",
      }).success,
    ).toBe(false);
    expect(
      createPoolSchema.safeParse({
        ...validConfiguration,
        financial: {
          currency: "USD",
          participationFee: { enabled: false },
        },
      }).success,
    ).toBe(false);
    expect(
      createPoolSchema.safeParse({
        ...validConfiguration,
        prize: {
          model: "top_three",
          distribution: {
            mode: "fixed",
            first: "invalid",
            second: "20",
            third: "10",
          },
        },
      }).success,
    ).toBe(false);
    expect(
      createPoolSchema.safeParse({
        ...validConfiguration,
        prediction: {
          mode: "mixed",
          resultPoints: 5,
          exactScorePoints: 3,
          perfectMatchdayBonusPoints: 1,
        },
      }).success,
    ).toBe(false);
  });
});
