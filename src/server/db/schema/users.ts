import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const userProfiles = pgTable(
  "user_profiles",
  {
    userId: text("user_id").primaryKey(),
    displayName: text("display_name"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    birthDate: date("birth_date", { mode: "string" }),
    gender: text("gender"),
    avatarUrl: text("avatar_url"),
    globalRole: text("global_role").notNull().default("user"),
    banned: boolean("banned").notNull().default(false),
    banReason: text("ban_reason"),
    banExpiresAt: timestamp("ban_expires_at", {
      withTimezone: true,
      mode: "date",
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
    index("user_profiles_global_role_idx").on(table.globalRole),
    index("user_profiles_banned_idx").on(table.banned),
    check(
      "user_profiles_global_role_check",
      sql`${table.globalRole} in ('user', 'super_admin')`,
    ),
    check(
      "user_profiles_gender_check",
      sql`${table.gender} is null or ${table.gender} in ('female', 'male', 'non_binary', 'prefer_not_to_say', 'other')`,
    ),
    check(
      "user_profiles_birth_date_check",
      sql`${table.birthDate} is null or ${table.birthDate} <= current_date`,
    ),
  ],
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => userProfiles.userId, { onDelete: "cascade" }),
    locale: text("locale").notNull().default("es"),
    theme: text("theme").notNull().default("system"),
    timeZone: text("time_zone").notNull().default("America/Caracas"),
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
      "user_preferences_locale_check",
      sql`${table.locale} in ('es', 'en')`,
    ),
    check(
      "user_preferences_theme_check",
      sql`${table.theme} in ('light', 'dark', 'system')`,
    ),
  ],
);

export const userAuditEvents = pgTable(
  "user_audit_events",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id"),
    targetUserId: text("target_user_id"),
    action: text("action").notNull(),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_audit_events_actor_user_id_idx").on(table.actorUserId),
    index("user_audit_events_target_user_id_idx").on(table.targetUserId),
    index("user_audit_events_action_idx").on(table.action),
    index("user_audit_events_created_at_idx").on(table.createdAt),
    check(
      "user_audit_events_action_check",
      sql`${table.action} in (
        'user.created',
        'user.first_login',
        'user.email_verification_required',
        'user.profile_updated',
        'user.password_reset_requested',
        'user.password_changed',
        'user.google_login',
        'user.role_changed',
        'user.banned',
        'user.unbanned',
        'user.session_revoked'
      )`,
    ),
  ],
);
