CREATE TYPE "public"."directory_order" AS ENUM('oldest', 'newest');--> statement-breakpoint
CREATE TYPE "public"."reading_mode" AS ENUM('paged', 'continuous');--> statement-breakpoint
CREATE TYPE "public"."site_theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TYPE "public"."works_view" AS ENUM('grid', 'list');--> statement-breakpoint
ALTER TABLE "quota_charges" DROP CONSTRAINT "quota_charges_window_id_chapter_id_pk";--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "reading_mode" "reading_mode";--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "site_theme" "site_theme" DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "works_view" "works_view" DEFAULT 'grid' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "directory_order" "directory_order" DEFAULT 'oldest' NOT NULL;--> statement-breakpoint
ALTER TABLE "quota_charges" ADD COLUMN "id" integer PRIMARY KEY NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "quota_charges_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "quota_settings" ADD COLUMN "reread_grace_minutes" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
CREATE INDEX "quota_charges_window_chapter_idx" ON "quota_charges" USING btree ("window_id","chapter_id","charged_at");