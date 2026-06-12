ALTER TABLE "form_cols" ADD COLUMN "type" text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "form_cols" ADD COLUMN "options" jsonb;--> statement-breakpoint
ALTER TABLE "form_cols" ADD COLUMN "required" boolean DEFAULT false NOT NULL;