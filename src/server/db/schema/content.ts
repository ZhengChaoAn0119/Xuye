import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

const timestamps = {
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const workStatus = pgEnum("work_status", ["ongoing", "completed"]);
// "note" = author announcements (上架感言, 請假條…): listed in the directory, never charged quota.
export const chapterKind = pgEnum("chapter_kind", ["chapter", "note"]);
// A published chapter with a future publish_at is "scheduled"; no cron needed.
export const chapterStatus = pgEnum("chapter_status", ["draft", "published", "hidden"]);

// Trigram (pg_trgm, migration 0002) indexes back substring search on titles and names.
export const authors = pgTable(
  "authors",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull().unique(),
    ...timestamps,
  },
  (t) => [index("authors_name_trgm_idx").using("gin", t.name.op("gin_trgm_ops"))],
);

export const works = pgTable(
  "works",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: text("title").notNull(),
    authorId: integer("author_id").references(() => authors.id, { onDelete: "set null" }),
    synopsis: text("synopsis").notNull().default(""),
    status: workStatus("status").notNull().default("ongoing"),
    hasSexual: boolean("has_sexual").notNull().default(false),
    hasViolence: boolean("has_violence").notNull().default(false),
    // Object-storage key of an uploaded cover; null = generated typographic cover.
    coverKey: text("cover_key"),
    // Stable key used to match re-imports of the same work (normalized title).
    sourceKey: text("source_key").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("works_source_key_idx").on(t.sourceKey),
    index("works_title_trgm_idx").using("gin", t.title.op("gin_trgm_ops")),
  ],
);

export const tags = pgTable("tags", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  ...timestamps,
});

export const workTags = pgTable(
  "work_tags",
  {
    workId: integer("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.workId, t.tagId] })],
);

export const chapters = pgTable(
  "chapters",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    workId: integer("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    // 1-based reading order within the work; also the public chapter number in URLs.
    position: integer("position").notNull(),
    title: text("title").notNull(),
    kind: chapterKind("kind").notNull().default("chapter"),
    status: chapterStatus("status").notNull().default("draft"),
    publishAt: timestamp("publish_at", { mode: "date", withTimezone: true }),
    wordCount: integer("word_count").notNull().default(0),
    // sha256 of the body; lets re-imports skip unchanged chapters.
    contentHash: text("content_hash").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("chapters_work_position_idx").on(t.workId, t.position),
    index("chapters_visibility_idx").on(t.status, t.publishAt),
  ],
);

export const chapterContents = pgTable("chapter_contents", {
  chapterId: integer("chapter_id")
    .primaryKey()
    .references(() => chapters.id, { onDelete: "cascade" }),
  // Plain text, one paragraph per line. Never HTML.
  body: text("body").notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    // Null for CLI/system actions; `actorLabel` then says who.
    actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
    actorLabel: text("actor_label").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_entity_idx").on(t.entityType, t.entityId)],
);
