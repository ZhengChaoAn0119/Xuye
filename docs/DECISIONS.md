# Durable decisions

Update this file only for decisions that should survive tools, computers, branches, and chat sessions.

## Production build (decided 2026-10-01)

- Framework: Next.js (App Router) + TypeScript, at the repository root. The prototype moves to `prototype/` and stays as reference.
- Database: PostgreSQL. Authentication: self-hosted Auth.js with Email, Google, and Apple, with sessions stored in PostgreSQL.
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
- Login options are Email, Google, and Apple.
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
- A3 is the primary design direction (confirmed 2026-10-01 after interactive review). New feature work targets A3 first.
- A2 (Komiic-inspired utility model) was reviewed and rejected for this product's structure and navigation. Its code stays in the prototype only as a comparison reference; do not extend it to more screens.
- A2's color palette is kept as a candidate alternate palette for A3. It may become an A3 color variant later, without bringing A2's layout along.
- A1 remains as a comparison reference.
- Prototype works, covers, authors, and reviews remain fictional.
