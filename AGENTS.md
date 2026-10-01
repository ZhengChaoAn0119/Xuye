# Project instructions

This repository is shared between Claude, Codex, and human contributors.

Use the project-memory documents only when relevant:

- Read `docs/PROJECT_CONTEXT.md` when a task needs product, architecture, route, or validation context.
- Read `docs/DECISIONS.md` before changing product behavior, membership rules, navigation, content policy, or the A1/A2/A3 design directions.
- Read `docs/handoffs/CURRENT.md` when resuming work from another tool, computer, branch, or chat.

## Working rules

- Treat repository files as the canonical project state. Chat memory is supporting context only.
- Preserve the static HTML/CSS/JavaScript architecture unless a task explicitly changes it.
- Keep A1, A2, and A3 as genuinely different UX branches, not color-only themes.
- A3 remains the default design unless a recorded decision changes it.
- Use fictional works, authors, covers, and reviews in the prototype.
- Maintain both mobile and desktop layouts.
- Do not add frameworks or dependencies without an explicit requirement.
- Do not commit credentials, personal data, tokens, or API keys.
- Inspect the current worktree before editing and preserve unrelated changes.

## Verification

- Run `node --check app.js` after JavaScript changes.
- Render affected desktop and mobile routes after layout or responsive CSS changes.
- Verify the relevant navigation path end to end, not only the edited screen.

## Handoff

After material work, update `docs/handoffs/CURRENT.md` with what changed, affected files and routes, verification performed, unresolved questions and next steps, and the branch or commit when available.

Record durable product decisions in `docs/DECISIONS.md`, not only in the handoff.
