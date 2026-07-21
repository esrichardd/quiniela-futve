CREATE TABLE "user_audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"target_user_id" text,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_audit_events_action_check" CHECK ("user_audit_events"."action" in (
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
      ))
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"locale" text DEFAULT 'es' NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"time_zone" text DEFAULT 'America/Caracas' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_locale_check" CHECK ("user_preferences"."locale" in ('es', 'en')),
	CONSTRAINT "user_preferences_theme_check" CHECK ("user_preferences"."theme" in ('light', 'dark', 'system'))
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"first_name" text,
	"last_name" text,
	"birth_date" date,
	"gender" text,
	"avatar_url" text,
	"global_role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_global_role_check" CHECK ("user_profiles"."global_role" in ('user', 'super_admin')),
	CONSTRAINT "user_profiles_gender_check" CHECK ("user_profiles"."gender" is null or "user_profiles"."gender" in ('female', 'male', 'non_binary', 'prefer_not_to_say', 'other')),
	CONSTRAINT "user_profiles_birth_date_check" CHECK ("user_profiles"."birth_date" is null or "user_profiles"."birth_date" <= current_date)
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_audit_events_actor_user_id_idx" ON "user_audit_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "user_audit_events_target_user_id_idx" ON "user_audit_events" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "user_audit_events_action_idx" ON "user_audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "user_audit_events_created_at_idx" ON "user_audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_profiles_global_role_idx" ON "user_profiles" USING btree ("global_role");--> statement-breakpoint
CREATE INDEX "user_profiles_banned_idx" ON "user_profiles" USING btree ("banned");