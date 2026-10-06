# Current handoff

Updated: 2026-10-06 (Asia/Taipei)

## Device offline handoff (2026-10-06, Codex)

- This device is going offline. Continue from `main`; the consent/reader fixes are merged and pushed at `3f7c750`. A fresh `git fetch origin` confirmed local `main` and GitHub `origin/main` match before this documentation update, with a clean worktree.
- This handoff is maintained in `docs/handoffs/CURRENT.md` (the repository's canonical handoff). This round changes documentation only; no routes, application behavior, dependencies, or migrations changed.
- Verification for this documentation update: `pnpm check` passed (lint, formatting, typecheck, and 95 unit tests); `git diff --check` passed. Commit and push to `origin/main`, fetch again, and verify matching commit IDs and a clean worktree. The commit containing this section is the offline checkpoint.
- Resume on another device: `git pull --ff-only origin main`, `pnpm install`, configure that device's local `.env`, start PostgreSQL/Mailpit, and run `pnpm db:migrate` (including **0010**). In the managed Codex Windows sandbox, dot-source `. .\scripts\enable-codex-shell.ps1` before pnpm commands. This workspace has no `.env`; secrets are not transferred through Git.
- Latest application verification remains: 95 unit tests, production build, 74 desktop/mobile E2E passes and 2 Google-only skips. No application build/E2E rerun is needed for this documentation-only checkpoint. Latest GitHub CI status remains to be checked on the next online session.
- Next priority: Phase 5 launch preparation. Supply OPS-002 operator/contact, processor/location, and retention/backup inputs; choose domain/hosting; configure production mail/OAuth/secrets, WAF, SEO, monitoring, and backups. Real Google OAuth remains unverified without credentials. FUNC-004 followed-author/update notifications stays in backlog.

## Merge review (2026-10-06, Codex)

### Fixes and merge preparation

- User authorized fixing the review findings and merging to `main`. Both P2 findings are resolved on `feat/launch-terms-ux`: work/chapter/search pages pass their destination into the consent guard; the chapter API returns uncached HTTP 403 JSON with `status: terms_required` and the requested chapter's consent URL. Continuous reading displays a confirmation link while keeping loaded text visible; confirmation resumes at the requested chapter. No new dependencies or migration changes.
- Affected files/routes: `src/server/reader.ts`, work/search/chapter pages, chapter API, `chapter-stream.tsx`, and `tests/e2e/reading-experience.spec.ts`. Regression tests exercise work/chapter/search returns and consent becoming outdated during continuous reading, including JSON status/cache headers and the full confirmation/return path.
- Verification after fixes: `pnpm check` passed (95 unit tests); `pnpm build` passed; full production-server E2E with retries disabled passed **74 tests**, with **2 Google-only tests skipped** because Google credentials are not configured (76 total, desktop Chrome + Pixel 7, 2.9 minutes). Isolated database: `xuye_review_e2e`, PostgreSQL on `127.0.0.1:55435`; Mailpit on `127.0.0.1:1025/8025`. No development database or real content used. `git diff --check` passed.
- Integration: fast-forward `main` from `7c2a977` to the branch's repair commit and push both branches after these checks. No review blockers remain. Deployment still requires migration 0010; operator/policy placeholders and real Google OAuth verification remain launch prerequisites. The original review below records the findings before repair.

- Reviewed `main` (`7c2a977`) through `feat/launch-terms-ux` (`0157ded`); no application code changed and no merge or push performed.
- Recommendation: fix two P2 consent navigation issues before merging. `src/server/reader.ts:11` always redirects to consent with `/` as the destination, losing work/chapter/search navigation. The same helper is called by the chapter JSON API; its redirect is followed as HTML by `chapter-stream.tsx`, which converts JSON parse failure into a generic loading failure rather than guiding the reader through consent. This is relevant when consent becomes outdated during an open reading session.
- Verification this review: `pnpm check` passed (95 unit tests), `pnpm build` passed, and `git diff --check main...HEAD` passed. E2E was not rerun: this workspace has no `.env` and the expected PostgreSQL/Mailpit ports were not listening. The previous handoff reports 72/72 E2E passes for this commit; that suite does not cover these two cases.
- Next: preserve the requested reader destination, return a structured consent-required API response and handle it in continuous reading, add regression coverage, then rerun desktop/mobile E2E and review for merge. Migration 0010 is required on deployment; public policy/operator placeholders remain a launch prerequisite.

## Terms and remaining UX round (2026-10-05, Codex)

- Branch: `feat/launch-terms-ux`; based on `7c2a977`. User authorized commit and push on 2026-10-05; the resulting commit is available in this branch's Git history.
- Confirmed the latest `main` CI run [37112639911](https://github.com/ZhengChaoAn0119/Xuye/actions/runs/37112639911) at `7c2a977`: lint/types/unit, standalone build/E2E, and both Docker image targets all passed (completed 2026-10-03).
- DOC-001: public `/terms`, updated `/privacy`, footer links, default-checked opt-out choices in email/Google sign-in, server-side refusal handling, and versioned account consent. User explicitly requested implied/default agreement rather than an unchecked explicit opt-in. Consent is stored only after authentication or submission of `/consent`, never just on a page view. Same-device login proceeds without a second choice; legacy sessions and links opened on another device see `/consent`.
- Migration **0010** adds nullable consent version/time to users. Run `pnpm db:migrate` after pulling; no legacy acceptance is backfilled. Guards independently block account/admin operations pending current consent, while export, deletion, privacy controls, policy pages, and sign-out remain usable. Export includes consent version/time.
- UX-006: moved the reader toolbar from the floating bottom pill to an opaque sticky settings row below the top bar. UX-007: admin identity correctly displayed on `/account` and `/settings/profile`. UX-008: admin mark changed from 「序」 to 「續」 per user confirmation.
- Affected files: `src/lib/terms.ts`, `src/server/services/terms-consent*`, auth/session/authorization plumbing, `src/server/db/schema/auth.ts`, `drizzle/0010*` + metadata, `src/app/(site)/{signin,consent,terms,account,settings}`, `/api/v1/me` and export, shared header/footer/i18n, reader chrome CSS, admin nav, account export service, and E2E support/terms/reading-experience.
- Verification: `pnpm check` passed (95 unit tests); production standalone build passed; full production-build E2E **72/72 passed in 3.2 minutes, with retries disabled**, desktop Chrome + Pixel 7. Screenshots of terms, sign-in, consent, reader bottom text/navigation, account role, and admin branding were reviewed at both sizes. Tests used a fresh, isolated native PostgreSQL 18 cluster on `127.0.0.1:55435`, database `xuye_terms_e2e`, and Mailpit on `127.0.0.1:1025/8025`. No development database, existing server, or real content was used. This workspace has no `.env`.
- Google form refusal was tested with local dummy provider configuration, without contacting Google; real OAuth login still requires production credentials. The Windows-managed webServer teardown hangs, so the final suite used the documented `E2E_EXTERNAL_SERVER=1` path against the isolated standalone server. Earlier new-test failures were fixed by scoping alerts to `main`, expecting the actual null signed-out session, and waiting for the declined checkbox state before resubmitting. All temporary app, Mailpit, and PostgreSQL services have been stopped.
- Remaining launch inputs: operator legal name and public contact, actual processors/locations, retention and backup periods, then the Phase 5 domain/hosting/credentials/monitoring work. Google OAuth's real external provider flow still needs credentials; form consent logic is shared and email/legacy/cross-device paths are covered locally.

## Current state

- **Phases 0 through 4 are complete, plus a pre-Phase-5 reader/settings round (2026-10-02/03).** Readers can browse; read page by page or continuously within rolling quotas; switch palette and light/dark/system themes; sign in; manage `/settings`; and synchronize preferences, bookshelf, progress, history, and bookmarks. Run with `pnpm dev` at http://localhost:3000.
- Plan: `docs/ARCHITECTURE.md` §7. Decisions: `docs/DECISIONS.md`. Issue board: `docs/ISSUES.md` (DOC-001 and UX-006/007/008 are now implemented; OPS-002 launch-policy inputs and FUNC-004 followed-content remain).
- Baseline branch `main`. Commits of the earlier round, all pushed to `origin/main` on 2026-10-03:
  - `2de5f0a` auto-load next chapter (FUNC-001) and header theme picker (UX-003); migration 0007.
  - `22c17ec` quota reread grace (FUNC-003), paged/continuous modes (FUNC-002), continuous-reading DOM virtualization (PERF-001), settings center, display names, site dark mode, data export/deletion (UX-004); migrations 0008 and 0009.
  - `50996d2` reader top bar links to the book directory and the chapter list (UX-005); `keepalive` saves.
  - `d4ed94f` chapter header shows only the title (book/author link, reading time, word count removed).
  - The handoff/docs commit that records this list.
- Earlier: pushed 2026-10-01; the first GitHub Actions run (#36880738989, commit `8292c11`) passed lint/types/unit, build + E2E, and Docker image jobs. CI status of this round's push: see the latest Actions run for `main`.
- **After pulling this round on another machine:** `pnpm install`, then `pnpm db:migrate` (including new 0010), then `pnpm dev`.

## Next steps

1. The consent/reader fixes are merged and pushed to `main` at `3f7c750`. Check the latest GitHub `main` CI when online; the revision has already passed local checks, build, and desktop/mobile E2E.
2. OPS-002 (P0 before launch): supply the operator's legal name, public service/privacy/content-rights contact, actual processors/locations, and retention/backup periods; replace the test-version policy placeholders.
3. Phase 5 launch preparation (see "Next steps (phase 5: launch preparation)" below): domain/host, Cloudflare/WAF, canonical URLs, sitemap, monitoring, backups, production secrets and mail/OAuth credentials.
4. FUNC-004 (backlog): 「關注的資訊」 settings once update notifications or followed authors exist.

## Development machines

- Work happens on more than one machine and location; always `git pull` and run `pnpm install` plus `pnpm db:migrate` when resuming.
- **Docker availability differs per machine.** The machine used for the 2026-10-02 Claude session (`E:\project\xuye`, Windows 11) runs Docker Desktop (server 29.4.1) with the `xuye-db-1` and `xuye-mailpit-1` compose services healthy, so Docker Compose verification can be done there. The machine used for the earlier Codex sessions could not start Docker Desktop (no virtualization) and used native PostgreSQL 18 plus Mailpit instead.

## Reader top bar fix (2026-10-03, Claude)

- UX-005: the reader top bar's book title now links to the work page's chapter directory (`/works/[id]#directory`) and the chapter title opens the TOC drawer. `ChapterDirectory` scrolls itself into view for `#directory` because it streams in after navigation.
- Bookshelf/bookmark PUTs use `keepalive` so a save survives immediate navigation.
- Per user request, the chapter header no longer shows the small book/author link above the title or the reading time and word count below it (page chapter and continuous-mode chapters); only the note badge and the title remain. `reader.meta` copy removed.
- Verification: `pnpm check` (91 unit tests), production build, `pnpm test:e2e` 60/60 (twice, no flaky), real Chrome.

## Reading modes, quota grace, settings center (2026-10-02, Claude)

Plan: `C:\Users\User\.claude\plans\rippling-purring-avalanche.md` (approved). Migrations **0008** (enums + prefs columns, `quota_charges.id`, `quota_settings.reread_grace_minutes`) and **0009** (drop `auto_next_chapter`) — split because drizzle-kit's rename prompt cannot run non-interactively. Run `pnpm db:migrate` after pulling.

- **Quota (FUNC-003):** every fetch of story text is charged; a repeat of the same chapter within `reread_grace_minutes` (default 10, `/admin/quota`) after its last charge is free. `withinRereadGrace()` in `src/server/services/quota.ts`.
- **Reading modes (FUNC-002):** `readingMode` = `paged | continuous | null`. `src/components/reading-mode-prompt.tsx` (native `<dialog>`) asks on first reader visit; "decide later" = paged for the browser session (`sessionStorage`). `chapter-end.tsx` (client) shows buttons only in paged mode; `chapter-stream.tsx` loads only in continuous mode and re-checks on input so short chapters still continue. Toolbar ⇣ toggles the mode, ⚙ links to `/settings/reading`.
- **Memory (PERF-001):** far chapters → same-height placeholders (text kept), `MAX_CACHED = 30` then explicit reload; `content-visibility: auto` on chapter sections.
- **Settings (UX-004):** `src/app/(site)/settings/*` (layout + nav + profile/reading/appearance/content/privacy), components in `src/components/settings/*` (old `account-preferences.tsx` removed). `/account` is an overview. Account menu: 個人資訊 / 內容偏好 / 設定 / 後台 / 登出; `use-dismissible-details` now also closes on link click (was a real bug: the menu stayed open across client navigations).
- **Prefs plumbing:** `reader-prefs.ts` now owns `loadPrefs`, `setLocalPrefs`, `savePrefs`, `syncPrefs`, `serverPatch`, `PREFS_EVENT`, `SITE_BOOT_SCRIPT` (palette + site theme before paint); `use-prefs.ts` hook. `AccountPreferenceSync` enables account sync and fills a missing server `readingMode` from the device.
- **Display names:** `src/lib/display-name.ts` — `canChangeDisplayName` (no paid tier yet → false), `displayNameFor` (email local part shortened). `PUT /api/v1/me/profile` returns 403 for Free.
- **Dark mode:** `tokens.css` uses `light-dark()`; `<html data-site-theme>` sets `color-scheme`. Reader shell sets its own `color-scheme` from the reader background (fixes the light TOC drawer in the dark reader).
- **Data rights:** `GET /api/v1/me/export` (JSON download), `DELETE /api/v1/me` (retype email; admins refused). Terms/consent still to do (DOC-001).
- **E2E:** `playwright.config.ts` now seeds `readingMode: "paged"` in `storageState` so the prompt does not cover other flows; `reading-experience.spec.ts` clears it. New helper `ageQuotaCharges()` in `tests/e2e/support.ts`.
- **Verification:** `pnpm check` (91 unit tests), `pnpm build`, production-build `pnpm test:e2e` **58/58** (desktop Chrome + Pixel 7). Real Chrome on the dev DB: prompt → continuous synced to the account; chapters 6→13 auto-loaded with DOM steady at ~450 nodes; scroll-back restored chapter 8 with no new API request; each chapter charged exactly once; dark mode checked in all three palettes; settings/account/reader at 390 px without page overflow.
- **Dev data left behind:** the signed-in dev account now has `readingMode = continuous` (chosen during the walkthrough; the prompt shows again only for a fresh browser/visitor) and quota 31/50 (14 reads: chapters 6–13 of work 7 by Claude, chapters 200–205 of work 21 from another browser session).

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
- Visitor and Free defaults are 10 and 50 story chapters per rolling 24 hours. Author notes do not consume quota. (Superseded 2026-10-02: rereads are charged again after a 10-minute grace — see "Reading modes, quota grace, settings center".)
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
