import { z } from "zod";

import { poolCurrencies } from "@/features/pools/constants";
import {
  isPrizeCompatibleWithFinancialConfiguration,
  isValidDecimalAmount,
  isValidPercentage,
  isValidPoolDescription,
  isValidPoolName,
  isValidPredictionPoints,
  isValidPredictionRules,
  isValidPrizeConfiguration,
} from "@/features/pools/validation-rules";

const decimalAmountSchema = z
  .string()
  .trim()
  .refine(isValidDecimalAmount);

const percentageSchema = z
  .string()
  .trim()
  .refine(isValidPercentage);

const positivePointsSchema = z.number().refine(isValidPredictionPoints);

const participationFeeSchema = z.discriminatedUnion("enabled", [
  z.object({ enabled: z.literal(false) }),
  z.object({ enabled: z.literal(true), amount: decimalAmountSchema }),
]);

const prizeSchema = z
  .discriminatedUnion("model", [
    z.object({ model: z.literal("winner_takes_all") }),
    z.object({
      model: z.literal("first_place"),
      distribution: z.discriminatedUnion("mode", [
        z.object({
          mode: z.literal("percentage"),
          percentage: percentageSchema,
        }),
        z.object({ mode: z.literal("fixed"), amount: decimalAmountSchema }),
      ]),
    }),
    z.object({
      model: z.literal("top_three"),
      distribution: z.discriminatedUnion("mode", [
        z.object({
          mode: z.literal("percentage"),
          first: percentageSchema,
          second: percentageSchema,
          third: percentageSchema,
        }),
        z.object({
          mode: z.literal("fixed"),
          first: decimalAmountSchema,
          second: decimalAmountSchema,
          third: decimalAmountSchema,
        }),
      ]),
    }),
  ])
  .superRefine((prize, context) => {
    if (!isValidPrizeConfiguration(prize)) {
      context.addIssue({ code: "custom", path: ["distribution"] });
    }
  });

const predictionSchema = z
  .discriminatedUnion("mode", [
    z.object({
      mode: z.literal("simple"),
      resultPoints: positivePointsSchema,
    }),
    z.object({
      mode: z.literal("score"),
      exactScorePoints: positivePointsSchema,
    }),
    z.object({
      mode: z.literal("mixed"),
      resultPoints: positivePointsSchema,
      exactScorePoints: positivePointsSchema,
      perfectMatchdayBonusPoints: positivePointsSchema,
    }),
  ])
  .superRefine((prediction, context) => {
    if (!isValidPredictionRules(prediction)) {
      context.addIssue({ code: "custom", path: ["exactScorePoints"] });
    }
  });

export const createPoolSchema = z
  .object({
    creationToken: z.string().uuid(),
    competitionId: z.string().uuid(),
    name: z.string().trim().refine(isValidPoolName),
    description: z.string().trim().refine(isValidPoolDescription).optional(),
    financial: z.object({
      currency: z.enum(poolCurrencies),
      participationFee: participationFeeSchema,
    }),
    prize: prizeSchema,
    prediction: predictionSchema,
  })
  .superRefine((input, context) => {
    if (
      !isPrizeCompatibleWithFinancialConfiguration(
        input.prize,
        input.financial,
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["financial", "participationFee"],
      });
    }
  });

export const invitationCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NP-Z2-9]{6}$/);

export const joinPoolSchema = z.object({
  code: invitationCodeSchema,
  locale: z.enum(["es", "en"]),
});
