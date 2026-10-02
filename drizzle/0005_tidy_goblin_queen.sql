CREATE TYPE "public"."quota_subject" AS ENUM('visitor', 'free');--> statement-breakpoint
CREATE TYPE "public"."rate_limit_scope" AS ENUM('subject', 'ip');--> statement-breakpoint
CREATE TABLE "quota_charges" (
	"window_id" integer NOT NULL,
	"chapter_id" integer NOT NULL,
	"charged_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quota_charges_window_id_chapter_id_pk" PRIMARY KEY("window_id","chapter_id")
);
--> statement-breakpoint
CREATE TABLE "quota_settings" (
	"subject" "quota_subject" PRIMARY KEY NOT NULL,
	"chapters_per_window" integer NOT NULL,
	"window_hours" integer DEFAULT 24 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quota_windows" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "quota_windows_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"subject" "quota_subject" NOT NULL,
	"subject_key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"used" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_windows" (
	"scope" "rate_limit_scope" NOT NULL,
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"requests" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "rate_limit_windows_scope_key_window_start_pk" PRIMARY KEY("scope","key","window_start")
);
--> statement-breakpoint
CREATE TABLE "visitor_identities" (
	"cookie_id" text PRIMARY KEY NOT NULL,
	"ip_hash" text NOT NULL,
	"trait_hash" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quota_charges" ADD CONSTRAINT "quota_charges_window_id_quota_windows_id_fk" FOREIGN KEY ("window_id") REFERENCES "public"."quota_windows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_charges" ADD CONSTRAINT "quota_charges_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quota_windows_subject_start_idx" ON "quota_windows" USING btree ("subject","subject_key","window_start");--> statement-breakpoint
CREATE INDEX "quota_windows_active_idx" ON "quota_windows" USING btree ("subject","subject_key","window_end");--> statement-breakpoint
CREATE INDEX "rate_limit_windows_expiry_idx" ON "rate_limit_windows" USING btree ("window_end");
--> statement-breakpoint
INSERT INTO "quota_settings" ("subject", "chapters_per_window", "window_hours")
VALUES ('visitor', 10, 24), ('free', 50, 24);
