import type { AdapterAccountType } from "next-auth/adapters";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Property names follow what @auth/drizzle-adapter expects; column names are snake_case.

export const userRole = pgEnum("user_role", ["reader", "admin"]);
// Paid tiers are added later with ALTER TYPE ... ADD VALUE (see docs/DECISIONS.md).
export const userTier = pgEnum("user_tier", ["free"]);
export const readerTheme = pgEnum("reader_theme", ["sepia", "white", "dark"]);
export const readerFont = pgEnum("reader_font", ["serif", "sans"]);
export const sitePalette = pgEnum("site_palette", ["a1", "a2", "a3"]);
export const readingMode = pgEnum("reading_mode", ["paged", "continuous"]);
export const siteTheme = pgEnum("site_theme", ["light", "dark", "system"]);
export const worksView = pgEnum("works_view", ["grid", "list"]);
export const directoryOrder = pgEnum("directory_order", ["oldest", "newest"]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),
  role: userRole("role").notNull().default("reader"),
  tier: userTier("tier").notNull().default("free"),
  birthDate: date("birth_date"),
  ageVerifiedAt: timestamp("age_verified_at", { mode: "date", withTimezone: true }),
  termsVersion: text("terms_version"),
  termsAcceptedAt: timestamp("terms_accepted_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  suspendedAt: timestamp("suspended_at", { mode: "date", withTimezone: true }),
});

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  readerFontSize: integer("reader_font_size").notNull().default(19),
  readerTheme: readerTheme("reader_theme").notNull().default("sepia"),
  readerFont: readerFont("reader_font").notNull().default("serif"),
  sitePalette: sitePalette("site_palette").notNull().default("a3"),
  lineHeight: integer("line_height").notNull().default(205),
  pageWidth: integer("page_width").notNull().default(720),
  /** null until the reader picks paged or continuous reading on first entering the reader. */
  readingMode: readingMode("reading_mode"),
  siteTheme: siteTheme("site_theme").notNull().default("system"),
  worksView: worksView("works_view").notNull().default("grid"),
  directoryOrder: directoryOrder("directory_order").notNull().default("oldest"),
  showSexual: boolean("show_sexual").notNull().default(false),
  showViolence: boolean("show_violence").notNull().default(false),
  showBadge: boolean("show_badge").notNull().default(true),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);
