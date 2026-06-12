CREATE TABLE "trigger_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"db_id" uuid NOT NULL,
	"trigger_column_id" uuid NOT NULL,
	"record_id" uuid NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"message" text
);
--> statement-breakpoint
ALTER TABLE "db_cols" RENAME COLUMN "trigger_config" TO "trigger_date_column_id";--> statement-breakpoint
ALTER TABLE "db_cols" ADD COLUMN "trigger_message_column_id" uuid;--> statement-breakpoint
ALTER TABLE "db_cols" ADD COLUMN "trigger_static_message" text;--> statement-breakpoint
ALTER TABLE "trigger_executions" ADD CONSTRAINT "trigger_executions_db_id_databases_id_fk" FOREIGN KEY ("db_id") REFERENCES "public"."databases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trigger_executions" ADD CONSTRAINT "trigger_executions_trigger_column_id_db_cols_id_fk" FOREIGN KEY ("trigger_column_id") REFERENCES "public"."db_cols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trigger_executions" ADD CONSTRAINT "trigger_executions_record_id_db_values_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."db_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_cols" ADD CONSTRAINT "db_cols_trigger_date_column_id_db_cols_id_fk" FOREIGN KEY ("trigger_date_column_id") REFERENCES "public"."db_cols"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "db_cols" ADD CONSTRAINT "db_cols_trigger_message_column_id_db_cols_id_fk" FOREIGN KEY ("trigger_message_column_id") REFERENCES "public"."db_cols"("id") ON DELETE set null ON UPDATE no action;