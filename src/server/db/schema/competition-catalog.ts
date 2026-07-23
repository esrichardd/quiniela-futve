import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { competitions } from "./competitions";

export const competitionSeasons = pgTable(
  "competition_seasons",
  {
    id: uuid("id").primaryKey(),
    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    startsOn: date("starts_on", { mode: "string" }),
    endsOn: date("ends_on", { mode: "string" }),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("competition_seasons_competition_code_unique").on(
      table.competitionId,
      table.code,
    ),
    index("competition_seasons_competition_status_idx").on(
      table.competitionId,
      table.status,
    ),
    check(
      "competition_seasons_name_check",
      sql`length(btrim(${table.name})) between 1 and 120`,
    ),
    check(
      "competition_seasons_code_check",
      sql`${table.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),
    check(
      "competition_seasons_status_check",
      sql`${table.status} in ('draft', 'active', 'finished')`,
    ),
    check(
      "competition_seasons_date_range_check",
      sql`${table.startsOn} is null or ${table.endsOn} is null or ${table.endsOn} >= ${table.startsOn}`,
    ),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    shortName: text("short_name"),
    code: text("code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("teams_code_unique").on(table.code),
    index("teams_name_idx").on(table.name),
    check(
      "teams_name_check",
      sql`length(btrim(${table.name})) between 1 and 120`,
    ),
    check(
      "teams_short_name_check",
      sql`${table.shortName} is null or length(btrim(${table.shortName})) between 1 and 40`,
    ),
    check(
      "teams_code_check",
      sql`${table.code} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),
  ],
);

export const seasonTeams = pgTable(
  "season_teams",
  {
    competitionSeasonId: uuid("competition_season_id")
      .notNull()
      .references(() => competitionSeasons.id, { onDelete: "restrict" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.competitionSeasonId, table.teamId] }),
    index("season_teams_team_id_idx").on(table.teamId),
  ],
);

export const matchdays = pgTable(
  "matchdays",
  {
    id: uuid("id").primaryKey(),
    competitionSeasonId: uuid("competition_season_id")
      .notNull()
      .references(() => competitionSeasons.id, { onDelete: "restrict" }),
    number: integer("number").notNull(),
    name: text("name"),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("matchdays_season_number_unique").on(
      table.competitionSeasonId,
      table.number,
    ),
    uniqueIndex("matchdays_id_season_unique").on(
      table.id,
      table.competitionSeasonId,
    ),
    index("matchdays_season_status_number_idx").on(
      table.competitionSeasonId,
      table.status,
      table.number,
    ),
    check("matchdays_number_check", sql`${table.number} > 0`),
    check(
      "matchdays_name_check",
      sql`${table.name} is null or length(btrim(${table.name})) between 1 and 120`,
    ),
    check(
      "matchdays_status_check",
      sql`${table.status} in ('draft', 'published', 'finished')`,
    ),
  ],
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey(),
    competitionSeasonId: uuid("competition_season_id").notNull(),
    matchdayId: uuid("matchday_id").notNull(),
    homeTeamId: uuid("home_team_id").notNull(),
    awayTeamId: uuid("away_team_id").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" })
      .notNull(),
    status: text("status").notNull().default("scheduled"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.matchdayId, table.competitionSeasonId],
      foreignColumns: [matchdays.id, matchdays.competitionSeasonId],
      name: "matches_matchday_season_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.competitionSeasonId, table.homeTeamId],
      foreignColumns: [
        seasonTeams.competitionSeasonId,
        seasonTeams.teamId,
      ],
      name: "matches_home_season_team_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.competitionSeasonId, table.awayTeamId],
      foreignColumns: [
        seasonTeams.competitionSeasonId,
        seasonTeams.teamId,
      ],
      name: "matches_away_season_team_fk",
    }).onDelete("restrict"),
    index("matches_matchday_starts_id_idx").on(
      table.matchdayId,
      table.startsAt,
      table.id,
    ),
    index("matches_season_starts_idx").on(
      table.competitionSeasonId,
      table.startsAt,
    ),
    index("matches_home_team_id_idx").on(table.homeTeamId),
    index("matches_away_team_id_idx").on(table.awayTeamId),
    check("matches_distinct_teams_check", sql`${table.homeTeamId} <> ${table.awayTeamId}`),
    check(
      "matches_status_check",
      sql`${table.status} in ('scheduled', 'postponed', 'in_progress', 'finished', 'cancelled')`,
    ),
    check(
      "matches_result_check",
      sql`(
        ${table.status} = 'finished'
        and ${table.homeScore} is not null
        and ${table.awayScore} is not null
        and ${table.homeScore} >= 0
        and ${table.awayScore} >= 0
      ) or (
        ${table.status} <> 'finished'
        and ${table.homeScore} is null
        and ${table.awayScore} is null
      )`,
    ),
  ],
);

export const competitionCatalogAuditEvents = pgTable(
  "competition_catalog_audit_events",
  {
    id: uuid("id").primaryKey(),
    actorUserId: text("actor_user_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("competition_catalog_audit_actor_idx").on(table.actorUserId),
    index("competition_catalog_audit_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    index("competition_catalog_audit_created_at_idx").on(table.createdAt),
    check(
      "competition_catalog_audit_action_check",
      sql`${table.action} in (
        'season.created',
        'season.status_changed',
        'team.created',
        'season_team.added',
        'matchday.created',
        'matchday.published',
        'matchday.finished',
        'match.created',
        'match.schedule_changed',
        'match.status_changed',
        'match.result_recorded',
        'match.result_corrected'
      )`,
    ),
    check(
      "competition_catalog_audit_entity_type_check",
      sql`${table.entityType} in ('season', 'team', 'season_team', 'matchday', 'match')`,
    ),
  ],
);
