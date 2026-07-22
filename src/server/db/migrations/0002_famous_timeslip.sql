DROP INDEX "pool_memberships_pool_id_idx";--> statement-breakpoint
DROP INDEX "pool_memberships_user_id_idx";--> statement-breakpoint
CREATE INDEX "pool_memberships_pool_created_id_idx" ON "pool_memberships" USING btree ("pool_id","created_at","id");--> statement-breakpoint
CREATE INDEX "pool_memberships_user_created_id_idx" ON "pool_memberships" USING btree ("user_id","created_at","id");