# Current handoff

Updated: 2026-10-01 (Asia/Taipei)

## Current state

- 2026-10-01: The production build was decided (Next.js + TypeScript + PostgreSQL + Drizzle + Auth.js, developed on Docker with hosting chosen before launch; see `docs/DECISIONS.md` → Production build). The architecture plan is in `docs/ARCHITECTURE.md`. There is no Figma step; the A3 prototype is the visual reference.
- The prototype moved to `prototype/`, and file paths in the sections below refer to files inside it.
- Next step: phase 0 (scaffold) from `docs/ARCHITECTURE.md` §7. Still to confirm: email provider, Apple Developer account, object storage, and monitoring/analytics tools (`docs/ARCHITECTURE.md` §9).

- The interactive static prototype is implemented in `index.html`, `app.js`, and `styles.css`.
- A3 is confirmed as the primary design. A2 was reviewed and rejected structurally; its palette is kept as an A3 color candidate. Membership details are deferred. See `docs/DECISIONS.md`.
- Prototype controls on A3 routes are now functional, with per-browser persistence in `localStorage` (`xuye:*` keys).

## Latest material change

Wired up previously presentational controls (A3):

- `#/latest`: 全部／連載中／已完結 filters (work with grid and list views).
- `#/search`: status filters, genre filters (toggle), empty state with reset.
- `#/work/:id`: save/unsave to bookshelf, chapter sort order, "show all chapters", genre tag links to search, continue-reading uses saved progress, last-read chapter highlighted.
- `#/library`: count and list reflect saved works; empty state.
- `#/history`: real history from reader visits; manage mode with per-item remove and clear-all (progress is kept).
- `#/discussion/:id`: helpful / not-helpful votes, review menu (block user, report modal, delete own review), unblock, spoiler masks driven by reading progress with reveal, write-review modal (stars, chapter scope limited to read chapters, requires at least one read chapter).
- `#/reader/:id/:n`: records progress and history, bookmark toggle, table-of-contents modal scrolled to the current chapter, previous-chapter disabled at chapter 1, chapter titles per work, reader theme/size persisted.
- `#/profile`: tabs (帳號總覽／閱讀設定／內容偏好), reading defaults with preview, preference toggles; enabling sexual content requires a birthday + 18+ confirmation modal.
- Header quota indicator links to profile; Escape closes modals.
- Updated compare page and prototype bar wording for the A3-primary decision.

## Verification

- `node --check app.js` passed.
- Headless Chrome (CDP) script exercised 48 interaction checks across all routes at 1366px and 390px. All passed, with no runtime errors and no horizontal overflow on mobile. Screenshots were inspected for the discussion menu, profile age modal, reader TOC, and work page.

## Known limitations

- A2-only controls (hamburger, 最新更新／新作上架 tabs) are still presentational. Intentional: A2 is not being extended.
- Login, payment, and plan selection remain illustrative toasts or modals.
- Reader font choice, line height, and page width (listed in decisions) are not yet implemented; only size and background are.
- Bookshelf state labels (有新章／已追到最新) are still static fixture data, not derived from progress.

## Suggested next steps

1. Decide on the front-end framework for the production build (comparison discussed in chat on 2026-10-01; recommendation: Next.js + TypeScript).
2. Optionally add the A2 palette as an A3 color variant for comparison.
3. Implement the remaining reader settings (font, line height, page width).
