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

## Handoff

After material work, update `docs/handoffs/CURRENT.md` with what changed, affected files and routes, verification performed, unresolved questions and next steps, and the branch or commit when available.

Record durable product decisions in `docs/DECISIONS.md`, not only in the handoff.
