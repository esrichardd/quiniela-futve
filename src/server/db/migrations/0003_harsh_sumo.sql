CREATE TABLE "competition_catalog_audit_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competition_catalog_audit_action_check" CHECK ("competition_catalog_audit_events"."action" in (
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
      )),
	CONSTRAINT "competition_catalog_audit_entity_type_check" CHECK ("competition_catalog_audit_events"."entity_type" in ('season', 'team', 'season_team', 'matchday', 'match'))
);
--> statement-breakpoint
CREATE TABLE "competition_seasons" (
	"id" uuid PRIMARY KEY NOT NULL,
	"competition_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competition_seasons_name_check" CHECK (length(btrim("competition_seasons"."name")) between 1 and 120),
	CONSTRAINT "competition_seasons_code_check" CHECK ("competition_seasons"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "competition_seasons_status_check" CHECK ("competition_seasons"."status" in ('draft', 'active', 'finished')),
	CONSTRAINT "competition_seasons_date_range_check" CHECK ("competition_seasons"."starts_on" is null or "competition_seasons"."ends_on" is null or "competition_seasons"."ends_on" >= "competition_seasons"."starts_on")
);
--> statement-breakpoint
CREATE TABLE "matchdays" (
	"id" uuid PRIMARY KEY NOT NULL,
	"competition_season_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"name" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matchdays_number_check" CHECK ("matchdays"."number" > 0),
	CONSTRAINT "matchdays_name_check" CHECK ("matchdays"."name" is null or length(btrim("matchdays"."name")) between 1 and 120),
	CONSTRAINT "matchdays_status_check" CHECK ("matchdays"."status" in ('draft', 'published', 'finished'))
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"competition_season_id" uuid NOT NULL,
	"matchday_id" uuid NOT NULL,
	"home_team_id" uuid NOT NULL,
	"away_team_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_distinct_teams_check" CHECK ("matches"."home_team_id" <> "matches"."away_team_id"),
	CONSTRAINT "matches_status_check" CHECK ("matches"."status" in ('scheduled', 'postponed', 'in_progress', 'finished', 'cancelled')),
	CONSTRAINT "matches_result_check" CHECK ((
        "matches"."status" = 'finished'
        and "matches"."home_score" is not null
        and "matches"."away_score" is not null
        and "matches"."home_score" >= 0
        and "matches"."away_score" >= 0
      ) or (
        "matches"."status" <> 'finished'
        and "matches"."home_score" is null
        and "matches"."away_score" is null
      ))
);
--> statement-breakpoint
CREATE TABLE "season_teams" (
	"competition_season_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "season_teams_competition_season_id_team_id_pk" PRIMARY KEY("competition_season_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_check" CHECK (length(btrim("teams"."name")) between 1 and 120),
	CONSTRAINT "teams_short_name_check" CHECK ("teams"."short_name" is null or length(btrim("teams"."short_name")) between 1 and 40),
	CONSTRAINT "teams_code_check" CHECK ("teams"."code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
TRUNCATE TABLE "pools" CASCADE;--> statement-breakpoint
ALTER TABLE "pools" DROP CONSTRAINT "pools_competition_id_competitions_id_fk";
--> statement-breakpoint
DROP INDEX "pools_competition_id_idx";--> statement-breakpoint
ALTER TABLE "pools" ADD COLUMN "competition_season_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "competition_seasons" ADD CONSTRAINT "competition_seasons_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchdays" ADD CONSTRAINT "matchdays_competition_season_id_competition_seasons_id_fk" FOREIGN KEY ("competition_season_id") REFERENCES "public"."competition_seasons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "matchdays_season_number_unique" ON "matchdays" USING btree ("competition_season_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "matchdays_id_season_unique" ON "matchdays" USING btree ("id","competition_season_id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_matchday_season_fk" FOREIGN KEY ("matchday_id","competition_season_id") REFERENCES "public"."matchdays"("id","competition_season_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_season_team_fk" FOREIGN KEY ("competition_season_id","home_team_id") REFERENCES "public"."season_teams"("competition_season_id","team_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_season_team_fk" FOREIGN KEY ("competition_season_id","away_team_id") REFERENCES "public"."season_teams"("competition_season_id","team_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_teams" ADD CONSTRAINT "season_teams_competition_season_id_competition_seasons_id_fk" FOREIGN KEY ("competition_season_id") REFERENCES "public"."competition_seasons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_teams" ADD CONSTRAINT "season_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competition_catalog_audit_actor_idx" ON "competition_catalog_audit_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "competition_catalog_audit_entity_idx" ON "competition_catalog_audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "competition_catalog_audit_created_at_idx" ON "competition_catalog_audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_seasons_competition_code_unique" ON "competition_seasons" USING btree ("competition_id","code");--> statement-breakpoint
CREATE INDEX "competition_seasons_competition_status_idx" ON "competition_seasons" USING btree ("competition_id","status");--> statement-breakpoint
CREATE INDEX "matchdays_season_status_number_idx" ON "matchdays" USING btree ("competition_season_id","status","number");--> statement-breakpoint
CREATE INDEX "matches_matchday_starts_id_idx" ON "matches" USING btree ("matchday_id","starts_at","id");--> statement-breakpoint
CREATE INDEX "matches_season_starts_idx" ON "matches" USING btree ("competition_season_id","starts_at");--> statement-breakpoint
CREATE INDEX "matches_home_team_id_idx" ON "matches" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "matches_away_team_id_idx" ON "matches" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "season_teams_team_id_idx" ON "season_teams" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_code_unique" ON "teams" USING btree ("code");--> statement-breakpoint
CREATE INDEX "teams_name_idx" ON "teams" USING btree ("name");--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_competition_season_id_competition_seasons_id_fk" FOREIGN KEY ("competition_season_id") REFERENCES "public"."competition_seasons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pools_competition_season_id_idx" ON "pools" USING btree ("competition_season_id");--> statement-breakpoint
ALTER TABLE "pools" DROP COLUMN "competition_id";
