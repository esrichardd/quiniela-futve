CREATE TABLE "pool_match_predictions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pool_id" uuid NOT NULL,
	"competition_season_id" uuid NOT NULL,
	"pool_membership_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"predicted_result" text,
	"predicted_home_score" smallint,
	"predicted_away_score" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_match_predictions_result_check" CHECK ("pool_match_predictions"."predicted_result" is null or "pool_match_predictions"."predicted_result" in ('home', 'draw', 'away')),
	CONSTRAINT "pool_match_predictions_home_score_range_check" CHECK ("pool_match_predictions"."predicted_home_score" is null or "pool_match_predictions"."predicted_home_score" between 0 and 99),
	CONSTRAINT "pool_match_predictions_away_score_range_check" CHECK ("pool_match_predictions"."predicted_away_score" is null or "pool_match_predictions"."predicted_away_score" between 0 and 99),
	CONSTRAINT "pool_match_predictions_representation_check" CHECK ((
        "pool_match_predictions"."predicted_result" is not null
        and "pool_match_predictions"."predicted_home_score" is null
        and "pool_match_predictions"."predicted_away_score" is null
      ) or (
        "pool_match_predictions"."predicted_result" is null
        and "pool_match_predictions"."predicted_home_score" is not null
        and "pool_match_predictions"."predicted_away_score" is not null
      ))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "pools_id_competition_season_unique" ON "pools" USING btree ("id","competition_season_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pool_memberships_id_pool_unique" ON "pool_memberships" USING btree ("id","pool_id");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_id_season_unique" ON "matches" USING btree ("id","competition_season_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pool_match_predictions_membership_match_unique" ON "pool_match_predictions" USING btree ("pool_membership_id","match_id");--> statement-breakpoint
CREATE INDEX "pool_match_predictions_pool_id_idx" ON "pool_match_predictions" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "pool_match_predictions_match_id_idx" ON "pool_match_predictions" USING btree ("match_id");--> statement-breakpoint
ALTER TABLE "pool_match_predictions" ADD CONSTRAINT "pool_match_predictions_membership_pool_fk" FOREIGN KEY ("pool_membership_id","pool_id") REFERENCES "public"."pool_memberships"("id","pool_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_match_predictions" ADD CONSTRAINT "pool_match_predictions_pool_season_fk" FOREIGN KEY ("pool_id","competition_season_id") REFERENCES "public"."pools"("id","competition_season_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_match_predictions" ADD CONSTRAINT "pool_match_predictions_match_season_fk" FOREIGN KEY ("match_id","competition_season_id") REFERENCES "public"."matches"("id","competition_season_id") ON DELETE restrict ON UPDATE no action;
