import { z } from "zod";

import { poolCurrencies } from "@/features/pools/constants";

const decimalAmountSchema = z
  .string()
  .trim()
  .regex(/^\d{1,13}(?:\.\d{1,2})?$/)
  .refine((value) => toScaledInteger(value, 2) > BigInt(0));

const percentageSchema = z
  .string()
  .trim()
  .regex(/^\d{1,3}(?:\.\d{1,2})?$/)
  .refine((value) => {
    const basisPoints = toScaledInteger(value, 2);
    return basisPoints > BigInt(0) && basisPoints <= BigInt(10_000);
  });

const positivePointsSchema = z.number().int().positive().max(32_767);

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
    if (prize.model !== "top_three") {
      return;
    }

    const { distribution } = prize;

    if (distribution.mode === "percentage") {
      const total =
        toScaledInteger(distribution.first, 2) +
        toScaledInteger(distribution.second, 2) +
        toScaledInteger(distribution.third, 2);

      if (total > BigInt(10_000)) {
        context.addIssue({ code: "custom", path: ["distribution"] });
      }
      return;
    }

    const first = toScaledInteger(distribution.first, 2);
    const second = toScaledInteger(distribution.second, 2);
    const third = toScaledInteger(distribution.third, 2);

    if (first < second || second < third) {
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
    if (
      prediction.mode === "mixed" &&
      prediction.exactScorePoints <= prediction.resultPoints
    ) {
      context.addIssue({ code: "custom", path: ["exactScorePoints"] });
    }
  });

export const createPoolSchema = z
  .object({
    creationToken: z.string().uuid(),
    competitionId: z.string().uuid(),
    name: z.string().trim().min(3).max(100),
    description: z.string().trim().max(500).optional(),
    financial: z.object({
      currency: z.enum(poolCurrencies),
      participationFee: participationFeeSchema,
    }),
    prize: prizeSchema,
    prediction: predictionSchema,
  })
  .superRefine((input, context) => {
    const requiresFee =
      input.prize.model === "winner_takes_all"
        ? true
        : input.prize.distribution.mode === "percentage";

    if (requiresFee && !input.financial.participationFee.enabled) {
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

export function toScaledInteger(value: string, scale: number): bigint {
  const [whole = "0", fraction = ""] = value.trim().split(".");
  const paddedFraction = fraction.padEnd(scale, "0").slice(0, scale);
  return BigInt(`${whole}${paddedFraction}`);
}
