# Current handoff

Updated: 2026-10-01 (Asia/Taipei)

## Current state

- **Phases 0, 1, and 2 are complete.** Readers can browse and read the full local library (29 works, 5,460 chapters) at http://localhost:3000 with `pnpm dev`.
- Plan: `docs/ARCHITECTURE.md` §7. Decisions: `docs/DECISIONS.md`, including the new "Public reader site" section.
- Local commits only: nothing has been pushed, so GitHub Actions CI has never run.

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

## Next steps (phase 3: accounts and sync)

1. Reader-facing sign-in page in A3 style (replacing the default Auth.js page) and an account page.
2. `user_preferences` (reader settings, content flags, 18+ confirmation) synced with the localStorage prefs.
3. Bookshelf, reading progress (scroll position), and history, with header links and "continue reading" on work pages.
4. Google sign-in when the user provides credentials (Apple is deferred until after launch).
