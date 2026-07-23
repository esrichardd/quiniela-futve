import { z } from "zod";

import {
  matchStatuses,
  MAX_CATALOG_NAME_LENGTH,
  MAX_MATCHDAY_NUMBER,
  MAX_TEAM_SHORT_NAME_LENGTH,
  seasonStatuses,
} from "./constants";

const uuidSchema = z.string().uuid();
const codeSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const optionalDateSchema = z.union([z.literal(""), z.iso.date()]).transform((value) => value || null);
const optionalNameSchema = z
  .string()
  .trim()
  .max(MAX_CATALOG_NAME_LENGTH)
  .transform((value) => value || null);

export const createSeasonSchema = z
  .object({
    competitionId: uuidSchema,
    name: z.string().trim().min(1).max(MAX_CATALOG_NAME_LENGTH),
    code: codeSchema,
    startsOn: optionalDateSchema,
    endsOn: optionalDateSchema,
  })
  .refine(
    (value) => !value.startsOn || !value.endsOn || value.endsOn >= value.startsOn,
    { path: ["endsOn"] },
  );

export const updateSeasonStatusSchema = z.object({
  seasonId: uuidSchema,
  status: z.enum(seasonStatuses),
});

export const createTeamSchema = z.object({
  seasonId: uuidSchema,
  name: z.string().trim().min(1).max(MAX_CATALOG_NAME_LENGTH),
  shortName: z
    .string()
    .trim()
    .max(MAX_TEAM_SHORT_NAME_LENGTH)
    .transform((value) => value || null),
  code: codeSchema,
});

export const addSeasonTeamSchema = z.object({
  seasonId: uuidSchema,
  teamId: uuidSchema,
});

export const createMatchdaySchema = z.object({
  seasonId: uuidSchema,
  number: z.coerce.number().int().positive().max(MAX_MATCHDAY_NUMBER),
  name: optionalNameSchema,
});

export const updateMatchdayStatusSchema = z.object({
  seasonId: uuidSchema,
  matchdayId: uuidSchema,
  status: z.enum(["published", "finished"]),
});

export const createMatchSchema = z.object({
  seasonId: uuidSchema,
  matchdayId: uuidSchema,
  homeTeamId: uuidSchema,
  awayTeamId: uuidSchema,
  startsAt: z.iso.datetime({ offset: true }),
}).refine((value) => value.homeTeamId !== value.awayTeamId, {
  path: ["awayTeamId"],
});

export const updateMatchSchema = z
  .object({
    seasonId: uuidSchema,
    matchId: uuidSchema,
    status: z.enum(matchStatuses),
    startsAt: z.iso.datetime({ offset: true }),
    homeScore: z.union([z.literal(""), z.coerce.number().int().nonnegative()]),
    awayScore: z.union([z.literal(""), z.coerce.number().int().nonnegative()]),
  })
  .superRefine((value, context) => {
    const hasHome = value.homeScore !== "";
    const hasAway = value.awayScore !== "";
    if (value.status === "finished" ? !hasHome || !hasAway : hasHome || hasAway) {
      context.addIssue({ code: "custom", path: ["homeScore"] });
    }
  });
