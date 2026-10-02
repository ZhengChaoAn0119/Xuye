CREATE TYPE "public"."site_palette" AS ENUM('a1', 'a2', 'a3');--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "site_palette" "site_palette" DEFAULT 'a3' NOT NULL;