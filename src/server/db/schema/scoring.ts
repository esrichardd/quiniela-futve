import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  boolean,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { matchdays } from "./competition-catalog";
import { poolMatchPredictions } from "./predictions";
import { poolMemberships, pools } from "./pools";

/**
 * Calculated score for a single `pool_match_predictions` row. Kept in its
 * own table (rather than columns on the prediction itself) so a match
 * result correction can recompute points without touching the member's
 * original input, and so the representation stays 1:1 and independently
 * cascadable.
 */
export const poolMatchPredictionScores = pgTable(
  "pool_match_prediction_scores",
  {
    id: uuid("id").primaryKey(),
    poolMatchPredictionId: uuid("pool_match_prediction_id").notNull(),
    pointsEarned: integer("points_earned").notNull(),
    wasExactScore: boolean("was_exact_score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("pool_match_prediction_scores_prediction_unique").on(
      table.poolMatchPredictionId,
    ),
    foreignKey({
      columns: [table.poolMatchPredictionId],
      foreignColumns: [poolMatchPredictions.id],
      name: "pool_match_prediction_scores_prediction_fk",
    }).onDelete("cascade"),
    check(
      "pool_match_prediction_scores_points_check",
      sql`${table.pointsEarned} >= 0`,
    ),
  ],
);

/**
 * Perfect matchday bonus granted to a membership for a given matchday. A
 * row only exists when the bonus was actually earned, so presence of the
 * row is the signal, not a zero value.
 */
export const poolMatchdayPerfectBonuses = pgTable(
  "pool_matchday_perfect_bonuses",
  {
    id: uuid("id").primaryKey(),
    poolId: uuid("pool_id").notNull(),
    competitionSeasonId: uuid("competition_season_id").notNull(),
    poolMembershipId: uuid("pool_membership_id").notNull(),
    matchdayId: uuid("matchday_id").notNull(),
    pointsAwarded: integer("points_awarded").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("pool_matchday_perfect_bonuses_membership_matchday_unique").on(
      table.poolMembershipId,
      table.matchdayId,
    ),
    index("pool_matchday_perfect_bonuses_pool_id_idx").on(table.poolId),
    index("pool_matchday_perfect_bonuses_matchday_id_idx").on(table.matchdayId),
    foreignKey({
      columns: [table.poolMembershipId, table.poolId],
      foreignColumns: [poolMemberships.id, poolMemberships.poolId],
      name: "pool_matchday_perfect_bonuses_membership_pool_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.poolId, table.competitionSeasonId],
      foreignColumns: [pools.id, pools.competitionSeasonId],
      name: "pool_matchday_perfect_bonuses_pool_season_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.matchdayId, table.competitionSeasonId],
      foreignColumns: [matchdays.id, matchdays.competitionSeasonId],
      name: "pool_matchday_perfect_bonuses_matchday_season_fk",
    }).onDelete("restrict"),
    check(
      "pool_matchday_perfect_bonuses_points_check",
      sql`${table.pointsAwarded} > 0`,
    ),
  ],
);
