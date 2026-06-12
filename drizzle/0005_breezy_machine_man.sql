CREATE TABLE "db_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"db_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"date_column_id" uuid,
	"message_column_id" uuid,
	"message" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"executed" boolean DEFAULT false NOT NULL,
	"executed_at" timestamp,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trigger_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger_id" uuid NOT NULL,
	"record_id" uuid NOT NULL,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "db_cols" ADD COLUMN "trigger_config" jsonb;--> statement-breakpoint
ALTER TABLE "db_triggers" ADD CONSTRAINT "db_triggers_db_id_databases_id_fk" FOREIGN KEY ("db_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_triggers" ADD CONSTRAINT "db_triggers_date_column_id_db_cols_id_fk" FOREIGN KEY ("date_column_id") REFERENCES "public"."db_cols"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_triggers" ADD CONSTRAINT "db_triggers_message_column_id_db_cols_id_fk" FOREIGN KEY ("message_column_id") REFERENCES "public"."db_cols"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trigger_logs" ADD CONSTRAINT "trigger_logs_trigger_id_db_triggers_id_fk" FOREIGN KEY ("trigger_id") REFERENCES "public"."db_triggers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trigger_logs" ADD CONSTRAINT "trigger_logs_record_id_db_values_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."db_values"("id") ON DELETE cascade ON UPDATE no action;