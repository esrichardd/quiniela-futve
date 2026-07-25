CREATE TABLE "pool_match_prediction_scores" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pool_match_prediction_id" uuid NOT NULL,
	"points_earned" integer NOT NULL,
	"was_exact_score" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_match_prediction_scores_points_check" CHECK ("pool_match_prediction_scores"."points_earned" >= 0)
);
--> statement-breakpoint
CREATE TABLE "pool_matchday_perfect_bonuses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pool_id" uuid NOT NULL,
	"competition_season_id" uuid NOT NULL,
	"pool_membership_id" uuid NOT NULL,
	"matchday_id" uuid NOT NULL,
	"points_awarded" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_matchday_perfect_bonuses_points_check" CHECK ("pool_matchday_perfect_bonuses"."points_awarded" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "pool_match_prediction_scores_prediction_unique" ON "pool_match_prediction_scores" USING btree ("pool_match_prediction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pool_matchday_perfect_bonuses_membership_matchday_unique" ON "pool_matchday_perfect_bonuses" USING btree ("pool_membership_id","matchday_id");--> statement-breakpoint
CREATE INDEX "pool_matchday_perfect_bonuses_pool_id_idx" ON "pool_matchday_perfect_bonuses" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "pool_matchday_perfect_bonuses_matchday_id_idx" ON "pool_matchday_perfect_bonuses" USING btree ("matchday_id");--> statement-breakpoint
ALTER TABLE "pool_match_prediction_scores" ADD CONSTRAINT "pool_match_prediction_scores_prediction_fk" FOREIGN KEY ("pool_match_prediction_id") REFERENCES "public"."pool_match_predictions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_matchday_perfect_bonuses" ADD CONSTRAINT "pool_matchday_perfect_bonuses_membership_pool_fk" FOREIGN KEY ("pool_membership_id","pool_id") REFERENCES "public"."pool_memberships"("id","pool_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_matchday_perfect_bonuses" ADD CONSTRAINT "pool_matchday_perfect_bonuses_pool_season_fk" FOREIGN KEY ("pool_id","competition_season_id") REFERENCES "public"."pools"("id","competition_season_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_matchday_perfect_bonuses" ADD CONSTRAINT "pool_matchday_perfect_bonuses_matchday_season_fk" FOREIGN KEY ("matchday_id","competition_season_id") REFERENCES "public"."matchdays"("id","competition_season_id") ON DELETE restrict ON UPDATE no action;
