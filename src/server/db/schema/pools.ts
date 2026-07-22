import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { competitions } from "./competitions";
import { userProfiles } from "./users";

export const pools = pgTable(
  "pools",
  {
    id: uuid("id").primaryKey(),
    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "restrict" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => userProfiles.userId, { onDelete: "restrict" }),
    creationToken: uuid("creation_token").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pools_competition_id_idx").on(table.competitionId),
    index("pools_created_by_user_id_idx").on(table.createdByUserId),
    uniqueIndex("pools_creator_creation_token_unique").on(
      table.createdByUserId,
      table.creationToken,
    ),
  ],
);

export const poolFinancialSettings = pgTable(
  "pool_financial_settings",
  {
    poolId: uuid("pool_id")
      .primaryKey()
      .references(() => pools.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    hasParticipationFee: boolean("has_participation_fee").notNull(),
    participationFeeMinor: bigint("participation_fee_minor", {
      mode: "bigint",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "pool_financial_settings_currency_check",
      sql`${table.currency} in ('USD', 'COP', 'VES')`,
    ),
    check(
      "pool_financial_settings_fee_check",
      sql`(
        ${table.hasParticipationFee} = true
        and ${table.participationFeeMinor} is not null
        and ${table.participationFeeMinor} > 0
      ) or (
        ${table.hasParticipationFee} = false
        and ${table.participationFeeMinor} is null
      )`,
    ),
  ],
);

export const poolPrizeConfigurations = pgTable(
  "pool_prize_configurations",
  {
    poolId: uuid("pool_id")
      .primaryKey()
      .references(() => pools.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    calculationMode: text("calculation_mode").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("pool_prize_configurations_variant_unique").on(
      table.poolId,
      table.model,
      table.calculationMode,
    ),
    check(
      "pool_prize_configurations_variant_check",
      sql`(
        ${table.model} = 'winner_takes_all'
        and ${table.calculationMode} = 'pooled'
      ) or (
        ${table.model} = 'first_place'
        and ${table.calculationMode} in ('percentage', 'fixed')
      ) or (
        ${table.model} = 'top_three'
        and ${table.calculationMode} in ('percentage', 'fixed')
      )`,
    ),
  ],
);

export const poolPrizeAllocations = pgTable(
  "pool_prize_allocations",
  {
    poolId: uuid("pool_id").notNull(),
    prizeModel: text("prize_model").notNull(),
    calculationMode: text("calculation_mode").notNull(),
    position: smallint("position").notNull(),
    value: bigint("value", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.poolId, table.position] }),
    foreignKey({
      columns: [table.poolId, table.prizeModel, table.calculationMode],
      foreignColumns: [
        poolPrizeConfigurations.poolId,
        poolPrizeConfigurations.model,
        poolPrizeConfigurations.calculationMode,
      ],
      name: "pool_prize_allocations_configuration_fk",
    }).onDelete("cascade"),
    check(
      "pool_prize_allocations_variant_check",
      sql`${table.calculationMode} in ('percentage', 'fixed') and (
        (${table.prizeModel} = 'first_place' and ${table.position} = 1)
        or (${table.prizeModel} = 'top_three' and ${table.position} between 1 and 3)
      )`,
    ),
    check("pool_prize_allocations_value_check", sql`${table.value} > 0`),
    check(
      "pool_prize_allocations_percentage_check",
      sql`${table.calculationMode} <> 'percentage' or ${table.value} <= 10000`,
    ),
  ],
);

export const poolPredictionRules = pgTable(
  "pool_prediction_rules",
  {
    poolId: uuid("pool_id")
      .primaryKey()
      .references(() => pools.id, { onDelete: "cascade" }),
    mode: text("mode").notNull(),
    resultPoints: smallint("result_points"),
    exactScorePoints: smallint("exact_score_points"),
    perfectMatchdayBonusPoints: smallint("perfect_matchday_bonus_points"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "pool_prediction_rules_variant_check",
      sql`(
        ${table.mode} = 'simple'
        and ${table.resultPoints} > 0
        and ${table.exactScorePoints} is null
        and ${table.perfectMatchdayBonusPoints} is null
      ) or (
        ${table.mode} = 'score'
        and ${table.resultPoints} is null
        and ${table.exactScorePoints} > 0
        and ${table.perfectMatchdayBonusPoints} is null
      ) or (
        ${table.mode} = 'mixed'
        and ${table.resultPoints} > 0
        and ${table.exactScorePoints} > ${table.resultPoints}
        and ${table.perfectMatchdayBonusPoints} > 0
      )`,
    ),
  ],
);

export const poolMemberships = pgTable(
  "pool_memberships",
  {
    id: uuid("id").primaryKey(),
    poolId: uuid("pool_id")
      .notNull()
      .references(() => pools.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userProfiles.userId, { onDelete: "restrict" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("pool_memberships_pool_user_unique").on(
      table.poolId,
      table.userId,
    ),
    index("pool_memberships_pool_id_idx").on(table.poolId),
    index("pool_memberships_user_id_idx").on(table.userId),
    check(
      "pool_memberships_role_check",
      sql`${table.role} in ('pool_admin', 'player')`,
    ),
  ],
);

export const poolInvitationCodes = pgTable(
  "pool_invitation_codes",
  {
    poolId: uuid("pool_id")
      .primaryKey()
      .references(() => pools.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("pool_invitation_codes_code_unique").on(table.code),
    check(
      "pool_invitation_codes_code_check",
      sql`${table.code} ~ '^[A-HJ-NP-Z2-9]{6}$'`,
    ),
  ],
);
