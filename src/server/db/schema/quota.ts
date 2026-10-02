import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { chapters } from "./content";

export const quotaSubject = pgEnum("quota_subject", ["visitor", "free"]);
export const rateLimitScope = pgEnum("rate_limit_scope", ["subject", "ip"]);

export const visitorIdentities = pgTable("visitor_identities", {
  cookieId: text("cookie_id").primaryKey(),
  ipHash: text("ip_hash").notNull(),
  traitHash: text("trait_hash"),
  firstSeenAt: timestamp("first_seen_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const quotaSettings = pgTable("quota_settings", {
  subject: quotaSubject("subject").primaryKey(),
  chaptersPerWindow: integer("chapters_per_window").notNull(),
  windowHours: integer("window_hours").notNull().default(24),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
});

export const quotaWindows = pgTable(
  "quota_windows",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    subject: quotaSubject("subject").notNull(),
    subjectKey: text("subject_key").notNull(),
    windowStart: timestamp("window_start", { mode: "date", withTimezone: true }).notNull(),
    windowEnd: timestamp("window_end", { mode: "date", withTimezone: true }).notNull(),
    used: integer("used").notNull().default(0),
  },
  (t) => [
    uniqueIndex("quota_windows_subject_start_idx").on(t.subject, t.subjectKey, t.windowStart),
    index("quota_windows_active_idx").on(t.subject, t.subjectKey, t.windowEnd),
  ],
);

export const quotaCharges = pgTable(
  "quota_charges",
  {
    windowId: integer("window_id")
      .notNull()
      .references(() => quotaWindows.id, { onDelete: "cascade" }),
    chapterId: integer("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    chargedAt: timestamp("charged_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.windowId, t.chapterId] })],
);

export const rateLimitWindows = pgTable(
  "rate_limit_windows",
  {
    scope: rateLimitScope("scope").notNull(),
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { mode: "date", withTimezone: true }).notNull(),
    windowEnd: timestamp("window_end", { mode: "date", withTimezone: true }).notNull(),
    requests: integer("requests").notNull().default(1),
  },
  (t) => [
    primaryKey({ columns: [t.scope, t.key, t.windowStart] }),
    index("rate_limit_windows_expiry_idx").on(t.windowEnd),
  ],
);
