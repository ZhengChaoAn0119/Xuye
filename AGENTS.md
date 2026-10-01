# Project instructions

This repository is shared between Claude, Codex, and human contributors.

Use the project-memory documents only when relevant:

- Read `docs/PROJECT_CONTEXT.md` when a task needs product, architecture, route, or validation context.
- Read `docs/DECISIONS.md` before changing product behavior, membership rules, navigation, content policy, or the A1/A2/A3 design directions.
- Read `docs/handoffs/CURRENT.md` when resuming work from another tool, computer, branch, or chat.
- Read `docs/ARCHITECTURE.md` before working on the production build (stack, folder layout, data model, quota flow, phases).
- For visuals, the A3 prototype in `prototype/` is the reference design. There are no Figma files.

## Working rules

- Treat repository files as the canonical project state. Chat memory is supporting context only.
- `prototype/` stays static HTML/CSS/JavaScript with no dependencies. It is a reference, not the product.
- The production build (Next.js + TypeScript) goes at the repository root. Follow the stack in `docs/DECISIONS.md` and do not add packages outside it without recording a decision.
- A3 is the primary design. A1 and A2 remain only as comparison references; do not extend A2's navigation model (see `docs/DECISIONS.md`).
- A3 remains the default design unless a recorded decision changes it.
- Use fictional works, authors, covers, and reviews in the prototype.
- Maintain both mobile and desktop layouts.
- Do not add frameworks or dependencies without an explicit requirement.
- Do not commit credentials, personal data, tokens, or API keys.
- Inspect the current worktree before editing and preserve unrelated changes.

## Verification

- Run `node --check prototype/app.js` after prototype JavaScript changes.
- Render affected desktop and mobile routes after layout or responsive CSS changes.
- Verify the relevant navigation path end to end, not only the edited screen.

## Production app (repository root)

Setup: `cp .env.example .env` (set `AUTH_SECRET` with `pnpm dlx auth secret`), then `pnpm install`, `docker compose up -d db mailpit`, `pnpm db:migrate`, `pnpm dev`. Sign-in emails appear in Mailpit at http://localhost:8025.

| Command | Purpose |
|---|---|
| `pnpm check` | lint, format check, typecheck, and unit tests. Must pass before every commit. |
| `pnpm test:e2e` | Playwright (desktop + mobile). Needs db + mailpit running. Uses its own `<db>_e2e` database (created and migrated automatically), so development data is never touched. Run it when pages, APIs, or auth change. |
| `pnpm db:generate` | Create a migration after editing `src/server/db/schema/`. Commit the generated `drizzle/` files. Never edit the database by hand. |
| `pnpm db:migrate` | Apply migrations. |
| `pnpm content:import <dir>` | Dry-run EPUB import; add `--apply` to write. Re-runs are safe (append and update only). |
| `pnpm user:promote <email>` | Make an existing account (sign in once first) an admin for `/admin`. |
| `pnpm build` then `pnpm start` | Production standalone server, the same artifact as the Docker image. Needs `AUTH_URL`. |
| `docker compose up --build` | Full stack: db, mailpit, migrate, app on :3000. |

Conventions:

- Before writing Next.js code, read the matching guide in `node_modules/next/dist/docs/`. This is Next.js 16 with Cache Components: `proxy.ts` instead of middleware, async request APIs, `use cache` + `cacheLife`/`cacheTag` for caching, and no `next lint`.
- Business logic goes in `src/server/services/`, takes its dependencies as arguments, and has unit tests. Pages, Server Actions, and `src/app/api/v1/` routes only validate input, check auth, and call services.
- Server-only modules import `"server-only"`. Keep pure logic in separate files so Vitest can import it.
- Environment variables are declared and validated only in `src/env.ts`, with `.env.example` kept in sync. Read them through `serverEnv()`, never `process.env` directly.
- Reader-facing copy goes through `t()` from `src/i18n`, never hard-coded strings. The admin back office (`/admin`) may inline Traditional Chinese. Styles use the CSS variables in `src/styles/tokens.css`, never raw colors.
- Every admin page, Server Action, and admin API checks authorization itself (`requireAdmin()` / `adminOrResponse()`); a layout check does not protect actions. Admin pages put their session read and data inside `<Suspense>` (see the existing pages).
- With Cache Components, a `200` status does not prove a streamed page rendered: e2e tests must assert on content.
- Raw `sql\`\`` fragments do not map parameter types: pass dates as ISO strings with an explicit cast, or use column helpers (`gt`, `lte`, …).
- Never commit book content. Import EPUBs from outside the repo; tests use `buildTestEpub()` fixtures.
- Record any new dependency in `docs/DECISIONS.md` with the reason.

## Handoff

After material work, update `docs/handoffs/CURRENT.md` with what changed, affected files and routes, verification performed, unresolved questions and next steps, and the branch or commit when available.

Record durable product decisions in `docs/DECISIONS.md`, not only in the handoff.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
