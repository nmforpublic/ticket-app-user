ALTER TABLE "users" ADD COLUMN "auth_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id");