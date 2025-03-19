CREATE TABLE "event_ticket_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"organization_user_id" integer NOT NULL,
	"allocation_quota" integer DEFAULT 0 NOT NULL,
	"remaining_quota" integer DEFAULT 0 NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_allocation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"allocation_id" integer NOT NULL,
	"old_quota" integer,
	"new_quota" integer,
	"action_type" varchar(50) NOT NULL,
	"changed_by" integer NOT NULL,
	"target_allocation_id" integer,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ticket_logs" ADD COLUMN "allocation_id" integer;--> statement-breakpoint
ALTER TABLE "organization_users" DROP COLUMN "guest_ticket_quota";