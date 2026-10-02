# Current handoff

Updated: 2026-10-02 (Asia/Taipei)

## Current state

- **Phases 0 through 4 are complete.** Readers can browse, read within rolling quotas, sign in, and synchronize preferences, bookshelf, progress, history, and bookmarks at http://localhost:3000 with `pnpm dev`.
- Plan: `docs/ARCHITECTURE.md` §7. Decisions: `docs/DECISIONS.md`, including the new "Public reader site" section.
- Pushed to `origin/main` on 2026-10-01. The first GitHub Actions run (#36880738989, commit `8292c11`) passed every job: "Lint, types, unit tests" (33 s), "Build and end-to-end tests" (84 s), and "Docker image builds" (72 s). Before pushing, the same three jobs were run locally from a clean clone, with no `.env`, and passed.

## Development machines

- Work happens on more than one machine and location; always `git pull` and run `pnpm install` plus `pnpm db:migrate` when resuming.
- **Docker availability differs per machine.** The machine used for the 2026-10-02 Claude session (`E:\project\xuye`, Windows 11) runs Docker Desktop (server 29.4.1) with the `xuye-db-1` and `xuye-mailpit-1` compose services healthy, so Docker Compose verification can be done there. The machine used for the earlier Codex sessions could not start Docker Desktop (no virtualization) and used native PostgreSQL 18 plus Mailpit instead.

## Auto-load next chapter and header theme picker (2026-10-02, Claude)

- **FUNC-001 auto-load:** `src/app/(reader)/works/[id]/chapters/[position]/chapter-stream.tsx` appends the next chapter when the reader's own input reaches the bottom of the page. Text comes from the new `GET /api/v1/works/[id]/chapters/[position]` (same `readChapterBody` quota/rate path as the page). The URL (`history.replaceState`), document title, reader top bar, bookmark, TOC marker, and `ReaderProgress` (now measured per chapter element) follow the chapter in view. Quota/rate limits show inline at the end of the stream. End-of-chapter nav is now the shared `chapter-end.tsx`.
- **Preference:** `auto_next_chapter` (default on) in `user_preferences`, migration `drizzle/0007_productive_shooting_star.sql`; local prefs key `autoNext`. Toggles: the ⇣ button in the reader toolbar and 「自動載入下一章」 on `/account`.
- **UX-003 theme picker:** `src/components/theme-picker.tsx` in the site header for everyone (visitors store it locally; members also PUT `sitePalette`). Account page label renamed to 「佈景主題」. `use-dismissible-details.ts` now backs both header popovers. Palette preview colors live in `tokens.css` as `--swatch-*`.
- **Verification:** `pnpm check` (79 unit tests), `pnpm build`, full production-build `pnpm test:e2e` 48/48 on desktop Chrome and Pixel 7 (new `tests/e2e/reading-experience.spec.ts`). Real Chrome on the dev DB: chapters 3→4→5 auto-loaded, URL/title/top bar switched both directions, reload restored mid-chapter-4 without triggering a load, toggle off/on synced to the server, quota moved 48→45 (one unit per chapter), simulated 429 rendered the quota notice, header/account palette sync both ways, 390 px picker without overflow.
- Run `pnpm db:migrate` after pulling (0007).

## Real-Chrome walkthrough (2026-10-02, Claude in Chrome, `pnpm dev`)

- Signed in as an admin account on the Docker-backed dev database (29 works, 5,460 chapters). Home, search, work, reader, library, history, account, privacy, signin/verify/auth-error, 404, `/admin`, and `/admin/quota` match the docs.
- Verified: account menu (outside click and Escape close it, focus returns), directory collapse at 60, reader noindex/immersive layout/arrow keys/dark theme/TOC current marker, progress and theme restore after reload, "continue reading" on the work page, bookshelf add/remove with undo, history entry, palette switch (A1 ↔ A3), Free quota counter (48/50), admin quota defaults 10/50, signed-out redirects, and no horizontal overflow at 390 px (iframe check; the maximized window could not be resized).
- Not verified in a real browser: the visitor quota-exhausted state (needs a cookie-less browser session) and Google sign-in.
- UX observations for the upcoming fix round: the floating reader toolbar overlaps body text at the bottom; the TOC drawer stays light in the dark reader theme; the long email wraps awkwardly as the account-page heading; an admin account is labelled "免費會員"; the admin logo mark is "序" while the site mark is "續".
- Dev-only log noise: requesting `/admin` without a session logs "Could not validate `instant`… NEXT_REDIRECT"; the redirect itself works.

## Phase 2 delivered

- **Routes:** `src/app/(site)/` (header and footer layout) contains `/`, `/search`, and `/works/[id]`. `src/app/(reader)/works/[id]/chapters/[position]` is the immersive reader with no site header. There is also a global `not-found.tsx` and `robots.ts`.
- **Data:** `src/server/services/catalog.ts` holds pure db reads (summaries, search via ILIKE on pg_trgm-indexed columns, work detail with directory, `neighbors()`, request-time chapter body). `src/server/catalog.ts` wraps them as cached reads (`use cache`, `cacheLife("catalog")` = 60 s, tags from `cache-tags.ts`); the body is uncached.
- **Components** (`src/components/`):
  - `work-cover` (generated typographic covers, stable palette per work ID).
  - `works-browser` (grid/list toggle and status filter, client-side).
  - `chapter-directory` (sorting, collapse at 60 entries).
  - `reader-chrome` (top bar, floating controls, TOC drawer, ← → keys).
  - `reader-prefs` (localStorage prefs plus a boot script applied before paint).
  - `site-header` / `site-nav`.
- **i18n:** all reader-facing copy goes through `t()`, which now supports `{var}` interpolation.
- **Fixes along the way:**
  - The admin import now expires tags immediately (`{ expire: 0 }`).
  - `usePathname` moved under Suspense (it was failing the build).
  - The end-of-chapter nav was renamed to "章節導覽" (its label duplicated the TOC's, which is an accessibility issue).

## Verification (2026-10-01)

- `pnpm check`: 61 unit tests, lint, Prettier, and typecheck all clean. The tests cover the reader boot script against `normalizePrefs` in a simulated DOM.
- `pnpm build`: success. Every public route is Partial Prerender (static shell + streamed content).
- E2E: 22/22 passing, desktop and mobile, against the **production standalone build** (`CI=1 PW_CHANNEL=chrome`), because the user had a `next dev` running and it was left untouched. The new `reader.spec.ts` seeds a work through the real admin paths, then covers:
  - Latest/search listing and filters.
  - The directory: notes are labelled; hidden and scheduled chapters are excluded.
  - Reader navigation: hidden chapters are skipped, the "caught up" state shows, keyboard navigation works.
  - Hidden, scheduled, and nonexistent chapters show not-found.
  - The chapter page has `noindex`.
  - Font size and theme persist across reload and chapter changes.
  - The TOC marks the current chapter.
  - No horizontal overflow.
- Real data on the production build: home, search, work (477 story chapters, 1,917,005 characters), and reader pages all return 200 in about 0.7–1.1 s with no server errors and no overflow at 1440 px or 390 px. Screenshots reviewed. Dark theme verified via computed colors (the first screenshot was mid-transition).

## Known notes

- Bookshelf and history links are not in the header yet (phase 3).
- Sitemap, canonical URLs, and `metadataBase` wait for the public domain (phase 5).
- Reader prefs are per device until account sync (phase 3).

## Previous Phase 3 scope (now implemented)

1. Reader-facing sign-in page in A3 style (replacing the default Auth.js page) and an account page.
2. `user_preferences` (reader settings, content flags, 18+ confirmation) synced with the localStorage prefs.
3. Bookshelf, reading progress (scroll position), and history, with header links and "continue reading" on work pages.
4. Google sign-in when the user provides credentials (Apple is deferred until after launch).

## Phase 3 delivered (2026-10-02)

- Added custom A3 sign-in, verification, error, and account pages. Email login uses the existing Mailpit flow; Google is conditionally displayed when credentials exist.
- Added `user_preferences`, `bookshelf_items`, `reading_progress`, and `bookmarks`, plus birth date and age-verification fields on users. Migration: `drizzle/0004_fancy_jack_murdock.sql`.
- Added authenticated `/api/v1/me/` routes and `reader-account` services for preferences, age verification, bookshelf, progress, history, and bookmarks.
- Added `/library`, `/history`, and `/account`; the site navigation and work pages now expose save and continue-reading flows.
- Reader settings sync between the database and `localStorage`; theme, size, font, line height, and page width apply before or immediately after paint. Reader pages persist chapter and scroll position and restore it across devices.
- Content preference filtering now happens per request outside the shared catalog cache. Sexual and violence flags are handled independently.
- Added Phase 3 unit and Playwright coverage in `reader-account.test.ts` and `tests/e2e/account.spec.ts`.

### Verification

- `pnpm check`: passed (69 unit tests).
- `pnpm build`: passed; public and account routes retain Partial Prerendering.
- `/signin`: rendered and visually inspected at 1440 px and Pixel 7 sizes; no overflow or layout issue found.
- `pnpm test:e2e`: 24/24 passed against the production standalone build on desktop Chrome and Pixel 7. The suite used an isolated native PostgreSQL 18 cluster and Mailpit v1.31.3 because Docker Desktop could not start without virtualization.
- Phase 3 targeted responsive rerun: 2/2 passed, including horizontal-overflow assertions for the work page, reader, library, history, and account page at both desktop and Pixel 7 sizes.

## Phase 4 delivered (2026-10-02)

- Added signed visitor identities plus HMAC-only IP and coarse browser-trait storage. Raw IP and trait values are not stored; the disclosure is available at `/privacy`.
- Added `quota_settings`, `quota_windows`, `quota_charges`, `visitor_identities`, and PostgreSQL-backed `rate_limit_windows` in migration `drizzle/0005_tidy_goblin_queen.sql`.
- Visitor and Free defaults are 10 and 50 story chapters per rolling 24 hours. Reloading/revisiting a charged chapter and reading author notes do not consume quota.
- Added transaction-level serialization for concurrent charges, subject and shared-IP rate limits, recovery-time reader messaging, and Free quota status on `/account`.
- Added `/admin/quota` with independent authorization and audit logging. Admins can adjust both chapter limits without a deploy.
- Disabled prefetch on chapter links so framework navigation cannot charge before entry. The chapter body remains uncached and is fetched only after authorization.
- Added `VISITOR_ID_SECRET` (optional in development, recommended separately in production), visitor trait API, privacy-policy page, and footer link.

### Verification

- `pnpm check`: passed (75 unit tests plus lint, Prettier, and typecheck).
- `pnpm build`: passed; Proxy is included and reader-facing routes retain Partial Prerendering.
- Targeted quota and reader E2E: 16/16 passed on desktop Chrome and Pixel 7.
- Full `pnpm test:e2e`: 32/32 passed against the production standalone build on desktop Chrome and Pixel 7 using an isolated native PostgreSQL 18 cluster and Mailpit v1.31.3.

## Next steps (phase 5: launch preparation)

1. Choose the public domain and deployment target; add Cloudflare/WAF, canonical URLs, sitemap, and production monitoring/backups.
2. Replace the privacy page's pre-launch contact placeholder with the public operator contact.
3. Set production secrets (`AUTH_SECRET`, separate `VISITOR_ID_SECRET`) and production Email/Google OAuth credentials.
4. Complete Docker Compose verification after host virtualization is enabled.

## Navigation and UX audit fixes (2026-10-02)

- Reworked the signed-in site header into a responsive account menu with account, conditional admin, and sign-out actions. The admin sidebar now marks the active section and provides return-to-site, account, and sign-out actions on desktop and mobile.
- Added inline bookshelf removal, per-item and clear-all history removal, failure rollback, confirmation for clear-all, and undo through a new history restore API/service.
- Moved end-of-chapter navigation inside the successful chapter-body state, so quota, rate-limit, unavailable, and content-gated views cannot imply that reading completed or expose next navigation.
- Added public work/chapter previews, cancel links, and unsaved-change warnings to admin edit forms. Added recovery links to `/verify-request`, cancel to age verification, and library/history shortcuts to `/account`.
- Added `tests/e2e/navigation.spec.ts`, covering visitor, reader, and admin entry/exit paths plus collection undo and admin unsaved-change behavior on desktop Chrome and Pixel 7.

### Verification

- `pnpm check`: passed (75 unit tests plus lint, Prettier, and typecheck).
- `pnpm build`: passed with all expected routes and Partial Prerender shells.
- Full production-build `pnpm test:e2e`: 40/40 passed on desktop Chrome and Pixel 7 against the isolated `xuye_e2e` database.
- The computer-use browser inventory returned no available browser surfaces. Automated real-Chrome coverage passed, but a user-visible browser surface is still needed for the requested manual visual walkthrough.

## Pre-Phase 5 UI and workflow adjustments (2026-10-02)

- Added `docs/ISSUES.md` as the shared, categorized issue board for human, Claude, and Codex collaboration.
- Kept the A3 production layout and added selectable A1, A2, and A3 color palettes. A3 remains the default; the selection applies before paint locally and synchronizes through account preferences. Migration: `drizzle/0006_condemned_frank_castle.sql`.
- Removed decorative English from the Traditional Chinese reader UI. The typed `t()` message-catalog boundary remains in place for future `zh-Hans`, `en`, and `ja` catalogs.
- Extracted the signed-in account menu into a client component. Outside pointer actions and Escape dismiss it; Escape also restores focus to the menu trigger.
- Added a narrowly scoped managed-Codex Windows workaround for Node's sandbox-only `uv_os_get_passwd` failure. Normal developer shells, CI, installs, and production do not load it.
- Changed the local Mailpit example to `smtp://127.0.0.1:1025` so Windows does not prefer an unavailable IPv6 listener.
- Added the opt-in `E2E_EXTERNAL_SERVER=1` Playwright path. Normal CI remains unchanged; the option lets managed Windows runs use an explicitly isolated production server and receive a reliable Playwright exit code.

### Verification

- Created the local `xuye` development database and applied migrations 0001 through 0006 successfully; the isolated `xuye_e2e` database was rebuilt separately.
- `pnpm check`: passed (lint, Prettier, typecheck, and 77 unit tests).
- `pnpm build`: passed for the production standalone artifact.
- Full production-build Playwright suite: 40/40 passed in 1.7 minutes on desktop Chrome and Pixel 7, including account synchronization, all-role navigation, outside-click menu dismissal, A1 palette synchronization, quota, privacy, reader, and admin flows.
- Native computer-use and in-app browser inventories exposed no controllable browser surface. A visible Chrome window could be launched for the user, while automated UI validation remained in real Chrome through Playwright.
