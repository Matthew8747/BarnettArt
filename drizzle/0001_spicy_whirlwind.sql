CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"match_artwork_colours" boolean DEFAULT true NOT NULL,
	"uniform_accent_hex" text DEFAULT '#8a7bff' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "accent_hex" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "palette_json" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_accent_hex_format" CHECK ("products"."accent_hex" IS NULL OR "products"."accent_hex" ~ '^#[0-9a-fA-F]{6}$');