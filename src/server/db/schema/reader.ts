import { integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { chapters, works } from "./content";
import { users } from "./auth";

export const bookshelfItems = pgTable(
  "bookshelf_items",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workId: integer("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  },
  (item) => [primaryKey({ columns: [item.userId, item.workId] })],
);

export const readingProgress = pgTable(
  "reading_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workId: integer("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    currentChapterPosition: integer("current_chapter_position").notNull(),
    furthestChapterPosition: integer("furthest_chapter_position").notNull(),
    scrollProgress: integer("scroll_progress").notNull().default(0),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
    hiddenFromHistoryAt: timestamp("hidden_from_history_at", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (progress) => [primaryKey({ columns: [progress.userId, progress.workId] })],
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    chapterId: integer("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  },
  (bookmark) => [primaryKey({ columns: [bookmark.userId, bookmark.chapterId] })],
);
