CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_financial_settings" (
	"pool_id" uuid PRIMARY KEY NOT NULL,
	"currency" text NOT NULL,
	"has_participation_fee" boolean NOT NULL,
	"participation_fee_minor" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_financial_settings_currency_check" CHECK ("pool_financial_settings"."currency" in ('USD', 'COP', 'VES')),
	CONSTRAINT "pool_financial_settings_fee_check" CHECK ((
        "pool_financial_settings"."has_participation_fee" = true
        and "pool_financial_settings"."participation_fee_minor" is not null
        and "pool_financial_settings"."participation_fee_minor" > 0
      ) or (
        "pool_financial_settings"."has_participation_fee" = false
        and "pool_financial_settings"."participation_fee_minor" is null
      ))
);
--> statement-breakpoint
CREATE TABLE "pool_invitation_codes" (
	"pool_id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_invitation_codes_code_check" CHECK ("pool_invitation_codes"."code" ~ '^[A-HJ-NP-Z2-9]{6}$')
);
--> statement-breakpoint
CREATE TABLE "pool_memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pool_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_memberships_role_check" CHECK ("pool_memberships"."role" in ('pool_admin', 'player'))
);
--> statement-breakpoint
CREATE TABLE "pool_prediction_rules" (
	"pool_id" uuid PRIMARY KEY NOT NULL,
	"mode" text NOT NULL,
	"result_points" smallint,
	"exact_score_points" smallint,
	"perfect_matchday_bonus_points" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_prediction_rules_variant_check" CHECK ((
        "pool_prediction_rules"."mode" = 'simple'
        and "pool_prediction_rules"."result_points" > 0
        and "pool_prediction_rules"."exact_score_points" is null
        and "pool_prediction_rules"."perfect_matchday_bonus_points" is null
      ) or (
        "pool_prediction_rules"."mode" = 'score'
        and "pool_prediction_rules"."result_points" is null
        and "pool_prediction_rules"."exact_score_points" > 0
        and "pool_prediction_rules"."perfect_matchday_bonus_points" is null
      ) or (
        "pool_prediction_rules"."mode" = 'mixed'
        and "pool_prediction_rules"."result_points" > 0
        and "pool_prediction_rules"."exact_score_points" > "pool_prediction_rules"."result_points"
        and "pool_prediction_rules"."perfect_matchday_bonus_points" > 0
      ))
);
--> statement-breakpoint
CREATE TABLE "pool_prize_allocations" (
	"pool_id" uuid NOT NULL,
	"prize_model" text NOT NULL,
	"calculation_mode" text NOT NULL,
	"position" smallint NOT NULL,
	"value" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_prize_allocations_pool_id_position_pk" PRIMARY KEY("pool_id","position"),
	CONSTRAINT "pool_prize_allocations_variant_check" CHECK ("pool_prize_allocations"."calculation_mode" in ('percentage', 'fixed') and (
        ("pool_prize_allocations"."prize_model" = 'first_place' and "pool_prize_allocations"."position" = 1)
        or ("pool_prize_allocations"."prize_model" = 'top_three' and "pool_prize_allocations"."position" between 1 and 3)
      )),
	CONSTRAINT "pool_prize_allocations_value_check" CHECK ("pool_prize_allocations"."value" > 0),
	CONSTRAINT "pool_prize_allocations_percentage_check" CHECK ("pool_prize_allocations"."calculation_mode" <> 'percentage' or "pool_prize_allocations"."value" <= 10000)
);
--> statement-breakpoint
CREATE TABLE "pool_prize_configurations" (
	"pool_id" uuid PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"calculation_mode" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pool_prize_configurations_variant_check" CHECK ((
        "pool_prize_configurations"."model" = 'winner_takes_all'
        and "pool_prize_configurations"."calculation_mode" = 'pooled'
      ) or (
        "pool_prize_configurations"."model" = 'first_place'
        and "pool_prize_configurations"."calculation_mode" in ('percentage', 'fixed')
      ) or (
        "pool_prize_configurations"."model" = 'top_three'
        and "pool_prize_configurations"."calculation_mode" in ('percentage', 'fixed')
      ))
);
--> statement-breakpoint
CREATE TABLE "pools" (
	"id" uuid PRIMARY KEY NOT NULL,
	"competition_id" uuid NOT NULL,
	"created_by_user_id" text NOT NULL,
	"creation_token" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pool_financial_settings" ADD CONSTRAINT "pool_financial_settings_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_invitation_codes" ADD CONSTRAINT "pool_invitation_codes_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_memberships" ADD CONSTRAINT "pool_memberships_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_memberships" ADD CONSTRAINT "pool_memberships_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_prediction_rules" ADD CONSTRAINT "pool_prediction_rules_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pool_prize_configurations_variant_unique" ON "pool_prize_configurations" USING btree ("pool_id","model","calculation_mode");--> statement-breakpoint
ALTER TABLE "pool_prize_allocations" ADD CONSTRAINT "pool_prize_allocations_configuration_fk" FOREIGN KEY ("pool_id","prize_model","calculation_mode") REFERENCES "public"."pool_prize_configurations"("pool_id","model","calculation_mode") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_prize_configurations" ADD CONSTRAINT "pool_prize_configurations_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pools" ADD CONSTRAINT "pools_created_by_user_id_user_profiles_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "competitions_code_unique" ON "competitions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "competitions_is_active_idx" ON "competitions" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "pool_invitation_codes_code_unique" ON "pool_invitation_codes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "pool_memberships_pool_user_unique" ON "pool_memberships" USING btree ("pool_id","user_id");--> statement-breakpoint
CREATE INDEX "pool_memberships_pool_id_idx" ON "pool_memberships" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "pool_memberships_user_id_idx" ON "pool_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pools_competition_id_idx" ON "pools" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "pools_created_by_user_id_idx" ON "pools" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pools_creator_creation_token_unique" ON "pools" USING btree ("created_by_user_id","creation_token");
