# Product issue board

This file is the repository-local source of truth for product, UI/UX, content, and technical issues discovered before Phase 5. It is deliberately usable by human contributors, Claude, and Codex without access to an external issue tracker.

## Collaboration rules

1. Give every issue a stable ID: `UX`, `I18N`, `FUNC`, `A11Y`, `PERF`, `SEC`, `OPS`, or `DOC` plus a number.
2. Before editing, set the issue to `IN PROGRESS`, add the agent/name and timestamp, and list the intended file scope.
3. Only parallelize issues whose file scopes do not overlap. If scopes overlap, record a dependency and work sequentially.
4. Keep acceptance criteria testable. Add the exact verification command or manual route before marking `DONE`.
5. Durable product decisions still belong in `docs/DECISIONS.md`; completed work and remaining risks also go in `docs/handoffs/CURRENT.md`.
6. Do not remove completed rows. Move details to the completed log so later agents can understand why the change exists.

Statuses: `BACKLOG`, `READY`, `IN PROGRESS`, `BLOCKED`, `DONE`.

## Active board

| ID       | Category           | Priority | Status | Owner               | Parallel group | Summary                                                                                                                                | File scope / dependency                                                 |
| -------- | ------------------ | -------- | ------ | ------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| UX-001   | Visual preferences | P1       | DONE   | Codex · 2026-10-02  | palette        | Let readers select the A1, A2, or A3 color palette while retaining the A3 layout; persist and synchronize the choice.                  | `tokens.css`, reader/account preferences, DB migration                  |
| I18N-001 | Localization       | P1       | DONE   | Codex · 2026-10-02  | copy           | Remove decorative English from the Traditional Chinese UI while preserving typed locale catalogs for future `zh-Hans`, `en`, and `ja`. | `zh-Hant.ts`, affected E2E expectations                                 |
| UX-002   | Navigation         | P1       | DONE   | Codex · 2026-10-02  | account-menu   | Close the account menu when the user clicks outside it, with Escape support.                                                           | `site-header*`, focused client component, desktop/mobile navigation E2E |
| FUNC-001 | Reader             | P1       | DONE   | Claude · 2026-10-02 | reader         | Auto-load the next chapter at the end of the current one without charging quota early; let readers turn it off.                        | reader page, `chapter-stream`, chapter API, prefs, migration 0007       |
| UX-003   | Visual preferences | P1       | DONE   | Claude · 2026-10-02 | palette        | Let every visitor switch the A1/A2/A3 palette (「佈景主題」) from the site header, in sync with the account page.                      | `theme-picker*`, `site-header*`, account preferences                    |

## Intake by category

### UI and visual design

- Add layout, responsive, color, typography, or component consistency reports here.

### Navigation and interaction

- Add route relationships, dead ends, missing feedback, focus, dismissal, and back-navigation reports here.

### Functionality and data

- Add reader, account, library, history, quota, import, and admin behavior reports here.

### Localization and content

- Add untranslated copy, terminology, date/number formatting, and future-locale readiness reports here.

### Accessibility

- Add keyboard, focus order, semantic role, label, contrast, and reduced-motion reports here.

### Performance, security, and operations

- Add performance regressions, abuse cases, security findings, deployment, monitoring, and backup work here.

## Issue template

```md
### CAT-000 · Short title

- Status / priority:
- Owner / claimed at:
- Parallel group:
- Routes and roles:
- Problem and evidence:
- Expected behavior:
- Acceptance criteria:
- Intended file scope:
- Dependencies / conflicts:
- Verification:
- Resolution notes:
```

## Completed log

Completed issues are moved here after checks and relevant desktop/mobile E2E pass.

### OPS-001 · Node user lookup fails in the managed Windows sandbox

- Status / priority: `DONE` / P1
- Resolution: added a Codex-only Node preload with a narrowly scoped `uv_os_get_passwd` fallback and `scripts/enable-codex-shell.ps1` to activate it without changing normal development, install, CI, or production behavior.
- Verification: `pnpm db:generate` and `pnpm e2e:prepare` both completed inside the sandbox without escalation.

### UX-001 · A1/A2/A3 palette selection

- Status / priority: `DONE` / P1
- Resolution: retained the A3 layout and added three color-only palettes. The A3 palette is the default; local preferences prevent a color flash, and signed-in preferences synchronize across devices through `site_palette`.
- Verification: preference unit tests, production build, and account E2E on desktop and mobile.

### I18N-001 · Traditional Chinese reader UI

- Status / priority: `DONE` / P1
- Resolution: replaced decorative English in reader-facing screens with Traditional Chinese while retaining the typed message-catalog API for future `zh-Hans`, `en`, and `ja` catalogs.
- Verification: lint, typecheck, production build, and affected navigation/account E2E.

### FUNC-001 · Auto-load the next chapter

- Status / priority: `DONE` / P1
- Resolution: `chapter-stream.tsx` appends the next chapter from `GET /api/v1/works/[id]/chapters/[position]` (same quota/rate authorization as the page) only after reader input reaches the bottom; URL, title, top bar, bookmark, and progress follow the chapter in view; quota/rate limits render inline. `auto_next_chapter` preference (migration 0007) with toolbar and account toggles.
- Verification: `pnpm check`, `pnpm build`, `tests/e2e/reading-experience.spec.ts` on desktop and mobile, and a real-Chrome walkthrough (quota counter moved exactly one unit per appended chapter).

### UX-003 · Header theme picker

- Status / priority: `DONE` / P1
- Resolution: `theme-picker.tsx` in the site header for visitors and members, with miniature previews of each palette; shares `setLocalPalette` and the `xuye:palette` event with the account page so both stay in sync.
- Verification: `tests/e2e/reading-experience.spec.ts` (visitor switch, persistence, account sync) on desktop and mobile; 390 px real-Chrome check.

### UX-002 · Dismissible account menu

- Status / priority: `DONE` / P1
- Resolution: extracted the account menu into a focused client component that dismisses on an outside pointer action or Escape and restores focus after keyboard dismissal.
- Verification: desktop and mobile navigation E2E exercises outside-click dismissal, reopening, links, admin visibility, and sign-out paths.
