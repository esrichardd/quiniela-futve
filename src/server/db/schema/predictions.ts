import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { matches } from "./competition-catalog";
import { poolMemberships, pools } from "./pools";

export const poolMatchPredictions = pgTable(
  "pool_match_predictions",
  {
    id: uuid("id").primaryKey(),
    poolId: uuid("pool_id").notNull(),
    competitionSeasonId: uuid("competition_season_id").notNull(),
    poolMembershipId: uuid("pool_membership_id").notNull(),
    matchId: uuid("match_id").notNull(),
    predictedResult: text("predicted_result"),
    predictedHomeScore: smallint("predicted_home_score"),
    predictedAwayScore: smallint("predicted_away_score"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("pool_match_predictions_membership_match_unique").on(
      table.poolMembershipId,
      table.matchId,
    ),
    index("pool_match_predictions_pool_id_idx").on(table.poolId),
    index("pool_match_predictions_match_id_idx").on(table.matchId),
    foreignKey({
      columns: [table.poolMembershipId, table.poolId],
      foreignColumns: [poolMemberships.id, poolMemberships.poolId],
      name: "pool_match_predictions_membership_pool_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.poolId, table.competitionSeasonId],
      foreignColumns: [pools.id, pools.competitionSeasonId],
      name: "pool_match_predictions_pool_season_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.matchId, table.competitionSeasonId],
      foreignColumns: [matches.id, matches.competitionSeasonId],
      name: "pool_match_predictions_match_season_fk",
    }).onDelete("restrict"),
    check(
      "pool_match_predictions_result_check",
      sql`${table.predictedResult} is null or ${table.predictedResult} in ('home', 'draw', 'away')`,
    ),
    check(
      "pool_match_predictions_home_score_range_check",
      sql`${table.predictedHomeScore} is null or ${table.predictedHomeScore} between 0 and 99`,
    ),
    check(
      "pool_match_predictions_away_score_range_check",
      sql`${table.predictedAwayScore} is null or ${table.predictedAwayScore} between 0 and 99`,
    ),
    check(
      "pool_match_predictions_representation_check",
      sql`(
        ${table.predictedResult} is not null
        and ${table.predictedHomeScore} is null
        and ${table.predictedAwayScore} is null
      ) or (
        ${table.predictedResult} is null
        and ${table.predictedHomeScore} is not null
        and ${table.predictedAwayScore} is not null
      )`,
    ),
  ],
);
