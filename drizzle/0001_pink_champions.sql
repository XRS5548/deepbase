CREATE TYPE "public"."db_permission" AS ENUM('f', 'rw', 'r');--> statement-breakpoint
CREATE TYPE "public"."form_permission" AS ENUM('f', 'rw', 'r');--> statement-breakpoint
CREATE TYPE "public"."log_action" AS ENUM('created', 'updated', 'deleted', 'shared', 'permission_changed', 'starred', 'unstarred');--> statement-breakpoint
CREATE TYPE "public"."log_entity" AS ENUM('team', 'team_member', 'database', 'db_col', 'db_value', 'form', 'form_col', 'form_submission', 'date_trigger', 'allotment');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('leader', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "databases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"image" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "date_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"team_id" uuid,
	"date" timestamp NOT NULL,
	"time" text,
	"message" text NOT NULL,
	"icon" text,
	"bg_color" text,
	"fired" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "db_cols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"db_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"bg_color" text,
	"icon" text,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "db_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"db_id" uuid NOT NULL,
	"values" jsonb NOT NULL,
	"bg_color" text,
	"starred" boolean DEFAULT false NOT NULL,
	"submitted_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_cols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"bg_color" text,
	"icon" text,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"name" text,
	"email" text,
	"user_id" text,
	"values" jsonb NOT NULL,
	"bg_color" text,
	"starred" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"image" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"pay_amount" numeric(10, 2),
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon" text,
	"url" text,
	"button_text" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "team_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"image" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "update_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" "log_entity" NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "log_action" NOT NULL,
	"performed_by" text NOT NULL,
	"diff" jsonb,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_db_allotments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"db_id" uuid NOT NULL,
	"user_id" text,
	"team_id" uuid,
	"permission" "db_permission" DEFAULT 'r' NOT NULL,
	"icon" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_form_allotments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"user_id" text,
	"team_id" uuid,
	"permission" "form_permission" DEFAULT 'r' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "date_triggers" ADD CONSTRAINT "date_triggers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_cols" ADD CONSTRAINT "db_cols_db_id_databases_id_fk" FOREIGN KEY ("db_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_values" ADD CONSTRAINT "db_values_db_id_databases_id_fk" FOREIGN KEY ("db_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_cols" ADD CONSTRAINT "form_cols_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_db_allotments" ADD CONSTRAINT "user_db_allotments_db_id_databases_id_fk" FOREIGN KEY ("db_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_db_allotments" ADD CONSTRAINT "user_db_allotments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_form_allotments" ADD CONSTRAINT "user_form_allotments_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_form_allotments" ADD CONSTRAINT "user_form_allotments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;