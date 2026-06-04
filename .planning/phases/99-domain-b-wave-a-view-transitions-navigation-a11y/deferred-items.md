# Phase 99 — Deferred Items

Out-of-scope discoveries logged during execution (SCOPE BOUNDARY rule). NOT fixed in this phase.

## Pre-existing lint errors (Plan 01, Task 1)

Discovered while running `yarn lint:check` for the `viewTransition.ts` helper. Both are
`simple-import-sort/imports` errors in test files **unmodified by this plan** (confirmed clean
`git status`); not caused by Plan 01 changes:

- `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.test.ts:1` — import sort
- `apps/frontend/src/lib/contexts/voter/answerStore.svelte.test.ts:1` — import sort

`viewTransition.ts` itself is lint-clean (`npx eslint src/lib/utils/viewTransition.ts` exits 0).
