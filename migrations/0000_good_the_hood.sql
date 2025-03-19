CREATE TYPE "public"."auth_provider" AS ENUM('google', 'line');--> statement-breakpoint
CREATE TABLE "checkin_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"scanned_by" integer NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now(),
	"additional_info" jsonb
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image_url" text,
	"start_datetime" timestamp with time zone NOT NULL,
	"end_datetime" timestamp with time zone NOT NULL,
	"ticket_price" numeric(10, 2) NOT NULL,
	"capacity" integer NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_user_role_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_user_id" integer NOT NULL,
	"old_role" varchar(50) NOT NULL,
	"new_role" varchar(50) NOT NULL,
	"changed_by" integer,
	"reason" text,
	"changed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	"guest_ticket_quota" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_org_user" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"old_owner_user_id" integer,
	"new_owner_user_id" integer,
	"changed_by" integer NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"owner_user_id" integer NOT NULL,
	"ticket_type" varchar(50) NOT NULL,
	"issued_by" integer,
	"status" varchar(50) NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now(),
	"used_at" timestamp with time zone,
	"qr_code_data" text
);
--> statement-breakpoint
CREATE TABLE "user_auths" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"provider_identifier" varchar(255) NOT NULL,
	"profile" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_provider_identifier" UNIQUE("provider","provider_identifier")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
