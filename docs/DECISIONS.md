# Durable decisions

Update this file only for decisions that should survive tools, computers, branches, and chat sessions.

## Production build (decided 2026-10-01)

- Framework: Next.js (App Router) + TypeScript, at the repository root. The prototype moves to `prototype/` and stays as reference.
- Database: PostgreSQL. Authentication: self-hosted Auth.js with Email and Google (Apple is deferred until after launch; see below), with sessions stored in PostgreSQL.
- SEO split: work pages, chapter directories, latest, and search are public and indexable. Chapter body text is served only through a server-side check (quota + anti-scraping) and is not statically rendered into public HTML.
- MVP scope: reader, work page, latest, search, accounts, bookshelf, history, cross-device sync, and quota. Reviews, membership purchase, and ads come in phase 2.
- All early users are Free tier. Membership purchase and payment are added only once traffic can support monetization; keep schema room for tiers but build no payment flow.
- Keep a separable API/data-access layer (no business logic only inside Server Actions or page components) so a future app can reuse it. An app is decided after the web version proves traffic.
- Content scale assumption: 10+ works, about 1,000+ chapters, 3,000–5,000 characters per chapter, about two updates per day. Platform staff publish through an admin back office; no author accounts.
- Language: Traditional Chinese (`zh-Hant`) only at launch. UI strings are centralized so `zh-Hans`, `en`, and `ja` can be added later. No locale prefix in URLs for now.
- Team: one developer working with Claude and Codex. Conventions and docs must let AI agents (and future human hires) pick up work from the repository alone.
- ORM: Drizzle ORM (schema in TypeScript) with drizzle-kit migrations committed to the repository. (Prisma was considered and replaced on 2026-10-01.)
- Next.js 16 with Cache Components (`cacheComponents: true`) enabled from the start. Public pages are cached with `use cache` + `cacheTag` and invalidated on publish; chapter text is request-time behind Suspense. This was chosen up front because adopting it later is a full migration.
- Auth.js is `next-auth` v5, which is still a beta release (5.0.0-beta.32 at setup) but supports Next 16. Keep auth calls behind `src/server/auth.ts` so the library can be swapped (for example to Better Auth) without touching features.
- Development email goes to Mailpit (docker compose); the production email provider is still open.
- Test stack: Vitest for unit tests, Playwright for e2e (desktop + mobile), and Prettier for formatting. CI runs `pnpm check`, e2e against the standalone build with PostgreSQL + Mailpit, and the Docker image build.
- Hosting: develop on Docker (app + PostgreSQL via Docker Compose) so the build is portable. The deployment platform (GCP, AWS, or self-hosted) is chosen before launch; avoid platform-specific APIs until then. Use `output: "standalone"`.
- Visitor quota identification: signed cookie + IP + a lightweight browser-trait hash (language, timezone, screen, and similar), combined. When a visitor's quota is used up, show only the recovery time. There is no login wall and no prompt to register. Registered users are counted per account with their own (higher) quota. Rate limiting and bot protection (for example Cloudflare) are layered on top. The trait hash must be disclosed in the privacy policy, and IP-level limits must tolerate shared IPs (schools, offices, mobile carriers).
- Design source: no Figma. The A3 prototype in `prototype/` is the visual reference. Production design tokens are CSS variables taken from `prototype/styles.css` (A3 values). The A2 palette stays available as an alternate A3 color set.
- Deferred until after the web version launches: Apple sign-in, the Apple Developer account, and all app work. The Apple provider code stays in place but is disabled while its env vars are empty. (2026-10-01)
- `AUTH_URL` is required when `NODE_ENV=production`, so sign-in links never point at a bind address such as 0.0.0.0.

### Content model and import (decided 2026-10-01, phase 1)

- The chapter number is the 1-based `position` in reading order, used in URLs. Headings are stored verbatim and never parsed for numbers, because source formats vary (第N章, 001, 01., 前言…).
- Chapter `kind` is `chapter` (story, including 番外 extras) or `note` (author announcements: 上架感言, 請假條, …). Notes appear in the directory, labelled, and are never charged reader quota.
- Chapter `status` is `draft`, `published`, or `hidden`, plus `publish_at`. "Scheduled" means published with a future `publish_at`; visibility is checked at read time, so no background job is needed.
- Import heuristics (`src/server/content/classify.ts`) mark notes and hide placeholder chapters ("本章暫不支持網頁閱讀"). Admins can change both. Re-imports never overwrite kind or status.
- Works are matched across imports by normalized title (`source_key`). A re-import appends new positions, updates chapters whose text or title changed, and only reports chapters missing from the file; nothing is deleted.
- Imported chapter publish time comes from the source `chapter-records/*.json` `updatedAt` (Asia/Taipei when no offset is given), then the EPUB modified date, then the import time.
- Bodies are stored as plain text, one paragraph per line, never HTML.
- Book content is never committed: EPUBs are imported from outside the repository (`*.epub` is git-ignored). Tests use generated fixture EPUBs (`src/server/content/fixtures.ts`).
- Covers: generated typographic covers by default (no image storage needed; none of the source EPUBs contain covers). `works.cover_key` is reserved for uploaded covers in S3-compatible object storage later.
- Admin back office copy may be inline Traditional Chinese; reader-facing copy goes through `t()`.
- Dependencies added in phase 1: `fflate` (EPUB unzip) and `tsx` (TypeScript CLI scripts with path aliases).
- E2E tests use a separate database (`<db>_e2e`, created by `pnpm e2e:prepare`) and never touch development data.

### Public reader site (decided 2026-10-01, phase 2)

- Public URLs: `/` (latest updates), `/search?q=`, `/works/{id}`, and `/works/{id}/chapters/{position}`. IDs are numeric; there are no slugs.
- A work is public once it has at least one visible chapter. Story chapter counts exclude author notes.
- Public reads are cached with `use cache` under the `catalog` cacheLife (60 s revalidate), tagged `works` / `work:{id}`. Chapter text is never cached; quota checks (phase 4) attach to `readChapterBody`.
- The home list renders per request (`connection()`) from cached data, so `next build` never needs a database. Param routes are App Shell + on-demand cached pages.
- Works flagged `has_sexual` are excluded from listings and search, and their work and reader pages show a gate, until the 18+ preference ships (phase 3).
- Chapter and search pages are `noindex`; work pages are indexable. Sitemap, canonical URLs, and `metadataBase` wait for the public domain (phase 5).
- Reader font size and theme are stored per device (`localStorage`, applied by a static boot script before paint); account sync comes in phase 3. Keyboard ← → changes chapter.
- Streamed pages can return HTTP 200 for not-found and forbidden UIs. Content never leaks; tests assert on the rendered UI, not the status code.

### Accounts and synchronization (implemented 2026-10-02, phase 3)

- Reader auth uses custom A3 pages at `/signin`, `/verify-request`, and `/auth-error`. Email magic links are always available when SMTP is configured; Google appears only when its credentials are configured. Apple remains deferred.
- `/library`, `/history`, and `/account` require a signed-in reader. Signed-out visitors are returned to the requested page after authentication.
- Reading progress keeps both the last opened chapter and the furthest chapter reached. The last opened chapter drives "continue reading" and history; the furthest chapter drives the bookshelf's unread/new/caught-up state.
- Exact position within a chapter is stored as an integer from 0–10,000 (0–100% in basis points). It is device-independent and remains stable when font, width, or line-height settings differ.
- Removing an item from history sets `hidden_from_history_at`; it does not delete reading progress. Opening that work again restores it to history.
- Reader display preferences remain mirrored in `localStorage` for pre-paint rendering. For signed-in readers, an existing server record wins; on the first sign-in, local display preferences seed the server record.
- Sexual and graphic-violence content are hidden independently. Sexual content requires a stored birth date and an 18+ verification timestamp before it can be enabled.
- Bookmarks are per chapter and synchronize for signed-in readers. Visitors may read but do not receive bookshelf, history, progress, or bookmark synchronization.

### Reading quota and application anti-scraping (implemented 2026-10-02, phase 4)

- Visitors receive 10 story chapters and registered Free readers receive 50 story chapters in a rolling 24-hour window beginning with the first charged chapter. Both values are editable at `/admin/quota`; the window length remains 24 hours.
- (Revised 2026-10-02, user direction) Quota limits daily views, so every server fetch of a story chapter is charged — reading a chapter once does not buy free rereads. Only a repeat of the same chapter within the reread grace after its last charge (default 10 minutes, `/admin/quota`) is free, which covers reloads, double clicks, and back/forward; the grace runs from the charge and is not extended by rereads. Author notes never use quota. PostgreSQL advisory transaction locks serialize simultaneous requests for one subject. (Superseded: one charge per window and chapter.)
- Visitors receive an HTTP-only, signed, one-year random-ID cookie. The cookie ID is the stable quota subject; IP and coarse browser traits are separately HMAC-hashed for abuse signals, and raw IP/trait values are never stored. `VISITOR_ID_SECRET` may separate this purpose from `AUTH_SECRET` in production.
- Chapter links disable framework prefetch so navigation previews cannot charge quota before entry. A body is fetched only after its request-time quota decision succeeds.
- PostgreSQL-backed fixed-window limits allow 80 chapter requests per account/visitor and 400 per IP in five minutes. The intentionally wider IP ceiling tolerates shared networks. Cloudflare/WAF remains a deployment-layer task for phase 5.
- `/privacy` discloses account data, necessary cookies, hashed visitor signals, purposes, sharing, retention, and reader choices. Public contact details must be filled in before launch.

### Open (recommendations given 2026-10-01, awaiting confirmation)

- Production email: an SMTP-compatible transactional provider on a dedicated subdomain with SPF/DKIM/DMARC. Recommended: Resend to start, or Amazon SES if hosting on AWS. Switching providers only changes `EMAIL_SERVER` and `EMAIL_FROM`.
- Uploaded covers (later): S3-compatible object storage (GCS, S3, or Cloudflare R2; MinIO in development) behind a small storage interface, with resized WebP variants and CDN delivery.

## Product and content

- Traditional Chinese is the initial language.
- Content is platform-operated at launch; there are no author accounts or submission tools.
- Works may be ongoing or completed and contain chapter-based long or short fiction.
- The home page sorts by latest upload/update time and shows each work once.
- Algorithmic recommendations are deferred until enough content and behavioral data exist.
- Search begins with one prominent field; filters appear with the results.

## Reading and quota

- The next chapter may preload, but quota is charged only when the reader enters it.
- Quota uses a rolling 24-hour period beginning with the first counted chapter load.
- The current loaded chapter remains readable after quota is exhausted.
- Quota messaging must not interrupt normal reading; show it only when the next chapter cannot load and in account information.
- The reader supports font size, line height, font choice, page width, and light/sepia/dark backgrounds.
- Vertical writing and offline reading are out of scope for the first web release.

## Accounts and membership

- Visitors can read with a small device/browser/network-associated quota.
- Registered Free accounts receive bookshelf, comments, history, and cross-device synchronization.
- Login options are Email, Google, and Apple. Apple is added after the web launch.
- Plans are monthly: Free plus three paid capacity levels. Exact names, prices, and quota values remain adjustable.
- Membership plan details (names, prices, quota values, payment) are deferred as of 2026-10-01; the plans page stays illustrative.
- Paid plans are ad-free and may include avatar, name color, and an optional badge.
- The current assumption is five registered devices and two simultaneous reading devices.
- Cancellation keeps benefits until the paid period ends; there is no separate free trial.
- Initial ads are non-tracking and never interrupt the text body.

## Library and community

- Bookshelf states are not started, new chapters available, and caught up.
- Reading history is separate from the bookshelf and includes uncollected works.
- Ratings use five stars plus text reviews and require at least one loaded chapter.
- Reviews may identify a chapter; content beyond a reader's progress is hidden as a possible spoiler.
- `有幫助` counts are public; `沒有幫助` affects ranking without exposing its count.
- Review menus include block and report; initial moderation is manual.

## Content preferences

- Sexual content and graphic violence are separate preferences.
- Sexual content requires a simple birthday and 18+ confirmation before it can be enabled.

## Navigation and visual direction

- The general hierarchy is brand/search/account above latest/bookshelf/history.
- Signed-in reader and admin utilities live in one account menu on both desktop and mobile. Admins can enter the back office from that menu; the back office always exposes return-to-site, account, and sign-out actions and marks the active section.
- Destructive collection actions are recoverable: bookshelf removal and reading-history removal/clear use optimistic feedback with undo; clearing all history also requires confirmation.
- Admin edit forms warn before link navigation or unload when changes are unsaved, and work/chapter editors expose public previews and explicit cancel destinations.
- Quota-, rate-, and availability-blocked chapter responses never render successful end-of-chapter or next-chapter navigation.
- A3 is the primary layout direction (confirmed 2026-10-01 after interactive review). New feature work targets A3 first, and A3 remains the default palette.
- A2 (Komiic-inspired utility model) was reviewed and rejected for this product's structure and navigation. Its code stays in the prototype only as a comparison reference; do not extend it to more screens.
- A1, A2, and A3 are user-selectable color palettes on the production A3 layout. The choice is stored locally for pre-paint rendering and synchronized through account preferences for signed-in readers; palette selection never changes navigation or page structure.
- The palette is presented to readers as 「佈景主題」 and is switchable from the site header by everyone, visitors included (device-local for visitors, synced for signed-in readers); the account page keeps the same control.
- Paged and continuous reading are two separate modes chosen on first entering the reader (no default is imposed; dismissing the prompt reads paged for that browser session). Paged keeps previous/next buttons and never fetches ahead; continuous has no end-of-chapter buttons and appends the next chapter only after the reader's own input reaches the bottom, charging quota like opening the chapter. The URL/title/top bar/progress follow the chapter in view. The mode can be changed from the reader toolbar or 「設定 › 閱讀」.
- Continuous reading virtualizes far-away chapters (same-height placeholders, text kept in page memory) so scrolling back never refetches; past 30 cached chapters the farthest text is released and only refetched — and charged — when the reader explicitly asks.
- 「我的」 (header menu and `/account`) holds broad, frequent items: personal info, content preferences, settings, admin (admins), sign out. Detailed choices live in `/settings` categories: profile, reading, appearance, content, privacy. Reading and appearance work for visitors (device-only); the other sections need an account.
- Display names are a paid-member feature; Free readers see a name derived from their email (e.g. 「ai6r…」), never the full address as a heading.
- The site has light, dark, and follow-system themes for every palette (`light-dark()` tokens with `color-scheme`); the reader background (sepia/white/dark) stays independent, and site tokens inside the reader follow the reader background.
- Readers can download their data (JSON) and delete their account. Deletion cascades preferences, bookshelf, progress, bookmarks, and sessions; quota windows are kept (text-keyed) so deleting and re-registering cannot reset quota; admins cannot self-delete. A stronger terms-of-service consent is still required before launch (ISSUES DOC-001).
- Reader-facing production copy is Traditional Chinese (`zh-Hant`) only for now. Copy continues to use the typed `t()` catalog so `zh-Hans`, `en`, and `ja` catalogs can be added later without replacing component APIs.
- Prototype works, covers, authors, and reviews remain fictional.
