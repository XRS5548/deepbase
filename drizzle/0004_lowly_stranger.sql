ALTER TABLE "date_triggers" ADD COLUMN "db_col_id" uuid;--> statement-breakpoint
ALTER TABLE "db_cols" ADD COLUMN "type" text DEFAULT 'string' NOT NULL;--> statement-breakpoint
ALTER TABLE "date_triggers" ADD CONSTRAINT "date_triggers_db_col_id_db_cols_id_fk" FOREIGN KEY ("db_col_id") REFERENCES "public"."db_cols"("id") ON DELETE set null ON UPDATE no action;