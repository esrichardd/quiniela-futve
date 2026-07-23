import { z } from "zod";

import { predictionResults } from "./constants";

const predictionItemSchema = z.discriminatedUnion("kind", [
  z.object({
    matchId: z.string().uuid(),
    kind: z.literal("result"),
    result: z.enum(predictionResults),
  }),
  z.object({
    matchId: z.string().uuid(),
    kind: z.literal("score"),
    homeScore: z.number().int().min(0).max(99),
    awayScore: z.number().int().min(0).max(99),
  }),
]);

export const saveMatchdayPredictionsActionSchema = z.object({
  poolId: z.string().uuid(),
  locale: z.enum(["es", "en"]),
  predictions: z.array(predictionItemSchema).min(1).max(200),
});

export type SaveMatchdayPredictionsActionInput = z.infer<
  typeof saveMatchdayPredictionsActionSchema
>;
