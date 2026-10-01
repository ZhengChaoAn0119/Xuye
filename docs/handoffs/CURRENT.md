# Current handoff

Updated: 2026-10-01 (Asia/Taipei)

## Current state

- **Phases 0 and 1 are complete.** The production app is at the repository root; the A3 prototype in `prototype/` is the visual reference.
- The local development database holds the user's **full library: 29 works, 5,460 chapters, about 14.84M characters**, imported from `E:\project\appgame\novels` (outside the repo, never committed).
- Plan: `docs/ARCHITECTURE.md` (§7 phases). Decisions: `docs/DECISIONS.md`, including the new "Content model and import" section.

## Phase 1 delivered

- **Schema** (`src/server/db/schema/content.ts`, migrations 0001–0003): authors, works, tags, work_tags, chapters (position / kind / status / publish_at / content_hash), chapter_contents, audit_logs, and pg_trgm indexes on titles and author names.
- **Content core** (`src/server/content/`, pure and unit-tested):
  - EPUB parser (`epub.ts`, using fflate).
  - Text cleanup (`text.ts`).
  - Chapter classification into story / author note / unavailable placeholder (`classify.ts`).
  - Import planning: insert / update / unchanged / missing (`import-plan.ts`).
  - Visibility rule (`visibility.ts`).
  - Form schemas and Taipei-time helpers (`schemas.ts`).
  - Test EPUB builder (`fixtures.ts`).
- **Services** (`src/server/services/`): `content-import.ts` (preview and transactional apply), `admin-content.ts` (dashboard, works, chapters), `audit.ts`.
- **Authorization:** `src/server/authz.ts` provides `requireAdmin()` (redirects to sign-in, or 404 for non-admins) and `adminOrResponse()` (401/403 for APIs).
- **Admin UI** (`/admin`):
  - Dashboard.
  - Works list.
  - Work edit (metadata, tags, content flags) with the full chapter table.
  - Add and edit chapters with publish now / schedule / draft / hide.
  - EPUB upload with a preview step, via `POST /api/admin/import` because uploads exceed the 1 MB Server Action limit.
- **CLI:** `pnpm content:import <dir> [--apply]`, `pnpm user:promote <email>`, `pnpm e2e:prepare`.
- **Hardening:** `AUTH_URL` is required in production (found when a sign-in redirect went to 0.0.0.0). `.dockerignore` excludes tests and scripts (otherwise `next build` type-checks them and the Docker build fails). `*.epub` is git-ignored.

## Verification (2026-10-01)

- `pnpm check`: 48 unit tests, lint, Prettier, and typecheck all clean.
- `pnpm test:e2e`: 14/14 passing (desktop + mobile) against the separate `xuye_e2e` database. Covered:
  - Admin guard: anonymous visitors are redirected; readers get a 404.
  - The import API returns 401 when anonymous.
  - Full admin flow: EPUB preview → import → edit metadata and tags → schedule a chapter → dashboard → re-import shows no changes.
- Real data: the CLI dry run and apply both matched the EPUB survey (29 books, 5,460 chapters = 5,489 spine items − 29 nav pages). All 58 note/hidden classifications were reviewed by hand; none were wrong.
- Production build + standalone server on real data: admin pages load in about 0.6–1.0 s, including the 481-chapter work, with no server errors and no horizontal overflow on mobile. Screenshots reviewed.
- Docker: `runner` and `migrator` images build.
- GitHub Actions CI has **still not run**, because nothing has been pushed.

## Known notes

- In dev, a signed-out or non-admin visit to `/admin` logs "Could not validate instant" (the redirect or 404 interrupts dev validation). This is expected and dev-only.
- CLI imports and scheduled chapters going live do not invalidate cache tags. Phase 2 public pages must use a short `cacheLife`.
- The local admin account used for verification is `local-admin@xuye.localhost` (local Mailpit only). The user can sign in with any email at `/api/auth/signin` and run `pnpm user:promote`.

## Next steps (phase 2: public reader pages)

1. Latest updates (home), search (pg_trgm), work page with the directory, and the chapter reader. Follow the A3 prototype (`prototype/`), desktop and mobile.
2. Generated typographic covers (no images).
3. Public caching: `use cache` + `cacheTag(cacheTags.work(id))` + a short `cacheLife`. The chapter body stays request-time behind Suspense, ready for the phase 4 quota checks.
4. SEO basics for public pages (metadata, `noindex` on chapter pages).

Still open with the user: production email provider (recommended: Resend or SES) and cover storage (later). Apple sign-in and the app are deferred until after launch.
