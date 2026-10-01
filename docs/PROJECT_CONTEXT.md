# Project context

## Product

`續頁` is the working name for a Traditional Chinese serial-fiction reading platform. It serves long and short fiction organized as works and chapters. Initial content is uploaded by the platform; author self-publishing is out of scope.

The repository currently contains an interactive front-end prototype built with plain HTML, CSS, and JavaScript. It has no build step or external package dependency.

## Main files

- `index.html`: application shell.
- `app.js`: fictional content data, hash routes, rendering, and prototype interactions.
- `styles.css`: responsive styles and the A1/A2/A3 design branches.
- `preview-*.png`: rendered visual checks.

## Routes

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
- A2 `快速追更`: Komiic-inspired utility model with a top toolbar, desktop side rail, mobile tabs, and high-density update cards.
- A3 `現代書庫`: restrained publishing-platform layout and the current default.

## Validation

- Run `node --check app.js` after JavaScript changes.
- For visual changes, render and inspect the affected hash routes at desktop and mobile widths.
