CREATE TYPE "public"."reader_font" AS ENUM('serif', 'sans');--> statement-breakpoint
CREATE TYPE "public"."reader_theme" AS ENUM('sepia', 'white', 'dark');--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"reader_font_size" integer DEFAULT 19 NOT NULL,
	"reader_theme" "reader_theme" DEFAULT 'sepia' NOT NULL,
	"reader_font" "reader_font" DEFAULT 'serif' NOT NULL,
	"line_height" integer DEFAULT 205 NOT NULL,
	"page_width" integer DEFAULT 720 NOT NULL,
	"show_sexual" boolean DEFAULT false NOT NULL,
	"show_violence" boolean DEFAULT false NOT NULL,
	"show_badge" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"user_id" text NOT NULL,
	"chapter_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_user_id_chapter_id_pk" PRIMARY KEY("user_id","chapter_id")
);
--> statement-breakpoint
CREATE TABLE "bookshelf_items" (
	"user_id" text NOT NULL,
	"work_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookshelf_items_user_id_work_id_pk" PRIMARY KEY("user_id","work_id")
);
--> statement-breakpoint
CREATE TABLE "reading_progress" (
	"user_id" text NOT NULL,
	"work_id" integer NOT NULL,
	"current_chapter_position" integer NOT NULL,
	"furthest_chapter_position" integer NOT NULL,
	"scroll_progress" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"hidden_from_history_at" timestamp with time zone,
	CONSTRAINT "reading_progress_user_id_work_id_pk" PRIMARY KEY("user_id","work_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "age_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookshelf_items" ADD CONSTRAINT "bookshelf_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookshelf_items" ADD CONSTRAINT "bookshelf_items_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;