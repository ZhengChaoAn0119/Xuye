# Project context

## Product

`續頁` is the working name for a Traditional Chinese serial-fiction reading platform. It serves long and short fiction organized as works and chapters. Initial content is uploaded by the platform; author self-publishing is out of scope.

The repository contains:

- `prototype/`: an interactive front-end prototype built with plain HTML, CSS, and JavaScript, with no build step or package dependency. It is the visual and interaction reference.
- The production app (Next.js 16 + TypeScript + PostgreSQL), at the repository root. Phases 0–2 are done: scaffold, content and admin, and the public reader site. The stack and constraints are in `docs/DECISIONS.md` under "Production build", the structure and phases in `docs/ARCHITECTURE.md`, and current progress in `docs/handoffs/CURRENT.md`.

## Prototype files

- `prototype/index.html`: application shell.
- `prototype/app.js`: fictional content data, hash routes, rendering, and prototype interactions.
- `prototype/styles.css`: responsive styles and the A1/A2/A3 design branches.
- `prototype/preview-*.png`: rendered visual checks.

## Prototype routes

- `#/compare`: design-branch comparison.
- `#/latest`: latest-updated works.
- `#/search`: search and results.
- `#/work/:id`: work details and chapter directory.
- `#/reader/:id/:chapter`: chapter reader.
- `#/library`: signed-in bookshelf.
- `#/history`: reading history.
- `#/discussion/:id`: ratings and reviews.
- `#/profile`: quota and content preferences.
- `#/plans`: membership plans.

## Product model

- Visitor quota is lower than registered Free quota; all quotas use a rolling 24-hour window.
- A loaded chapter is never interrupted. Limits are handled before loading the next chapter.
- Paid tiers increase reading capacity and remove ads. Paid identity decoration is optional.
- Reading progress, bookshelf, settings, and identity synchronize across devices.
- The first release is mobile-first but desktop-complete; an app may follow later.

## Design branches

- A1 `紙頁書房`: quiet, literary, and paper-like.
- A2 `快速追更`: Komiic-inspired utility model with a top toolbar, desktop side rail, mobile tabs, and high-density update cards. Rejected structurally; its palette is an A3 color candidate.
- A3 `現代書庫`: restrained publishing-platform layout and the primary direction.

## Prototype state

Interactions persist per browser in `localStorage` under `xuye:*` keys (bookshelf, history, progress, bookmarks, votes, blocks, own reviews, preferences, reader settings). This stands in for account sync. Clear those keys to reset the demo data.

## Validation

- Run `node --check prototype/app.js` after prototype JavaScript changes.
- For visual changes, render and inspect the affected hash routes at desktop and mobile widths.
