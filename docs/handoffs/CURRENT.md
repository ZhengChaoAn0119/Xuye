# Current handoff

Updated: 2026-10-01 (Asia/Taipei)

## Current state

- **Phase 0 (scaffold) is complete.** The production app lives at the repository root; the A3 prototype is in `prototype/` as the visual reference.
- Stack: Next.js 16.3 (App Router, Cache Components, typed routes, standalone output), TypeScript strict, PostgreSQL 17 + Drizzle, Auth.js v5 beta (database sessions; Email/Google/Apple enabled per env), Zod, Vitest, Playwright, Prettier, and Docker Compose (db, mailpit, migrate, app).
- Plan and phases: `docs/ARCHITECTURE.md` §7. Decisions: `docs/DECISIONS.md` → Production build.

## What phase 0 delivered

- `src/env.ts`: zod-validated server env, parsed lazily so builds need no secrets; provider credentials are validated in pairs.
- `src/server/db/`: Drizzle client (lazy, pooled) and the auth schema (`users` with `role`/`tier` enums, `accounts`, `sessions`, `verification_tokens`). First migration: `drizzle/0000_*.sql`.
- `src/server/auth.ts`, `src/server/auth-providers.ts`, and `src/app/api/auth/[...nextauth]/route.ts`: Auth.js with lazy config and the Drizzle adapter. The session exposes `user.id` and `user.role`.
- `src/server/services/health.ts` and `src/app/api/v1/health/route.ts`: the first service + versioned API pattern (200 ok / 503 degraded).
- `src/i18n/`: typed `t()` over `messages/zh-Hant.ts`; future locales must match the `Messages` type.
- `src/styles/tokens.css`: A3 tokens, plus the alternate palette from A2 under `:root[data-palette="alt"]`.
- `src/app/`: a placeholder home page in A3 style (static and prerendered).
- Tooling:
  - `pnpm check` (lint, format, typecheck, unit tests).
  - `pnpm test:e2e`.
  - `pnpm start` runs the standalone server.
  - `Dockerfile` (deps / migrator / builder / runner).
  - `docker-compose.yml`.
  - `.github/workflows/ci.yml`.
  - `.gitattributes` (LF), `.editorconfig`, `.nvmrc`.
- `AGENTS.md`: production commands and conventions. The Next.js-managed agent block is at the end of the file; leave it as is.

## Verification (2026-10-01, Windows 11, Node 24.14, Docker 29.4)

- `pnpm check`: lint clean, Prettier clean, typecheck clean, 11 unit tests passing.
- `pnpm build`: success; `/` is static, and the auth and health APIs are dynamic.
- `pnpm test:e2e`: 8/8 passing (desktop + mobile), both against `next dev` and in CI mode against the standalone build. This includes a **real email magic-link sign-in**: the email arrives in Mailpit, the link creates a database session, and the role is `reader`.
- `docker compose up --build` from an empty database volume: the migration applies, the app serves health 200, the home page and CSS load, and the providers endpoint responds. The app image is 298 MB.
- GitHub Actions CI has **not run yet**, because nothing has been pushed.

## Known notes

- A `url.parse()` deprecation warning comes from a dependency at runtime, not from project code.
- `next-auth` v5 is still beta; see `docs/DECISIONS.md`.
- The migration file has a generated name (`0000_fantastic_doctor_spectrum.sql`); later migrations can use `pnpm db:generate --name <name>`.

## Next steps (phase 1: content and admin)

1. Content schema: `authors`, `works`, `tags`, `work_tags`, `chapters`, `chapter_contents`, `audit_logs` (`docs/ARCHITECTURE.md` §3), plus a `pg_trgm` migration for search.
2. Services: work/chapter CRUD, publish visibility (`PUBLISHED`, or `SCHEDULED` with `publishAt <= now()`), and batch import with a preview step. Unit-test the visibility and chapter-splitting rules.
3. Admin area under `src/app/admin/`, restricted to `role = admin`. Add a script or seed to promote a user to admin.
4. A fictional seed work for development and e2e.

Still to confirm with the user: production email provider, Apple Developer account, object storage for covers, and monitoring/analytics tools.
