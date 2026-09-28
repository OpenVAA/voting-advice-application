# Phase 99 — Deferred Items

Out-of-scope discoveries logged during execution (SCOPE BOUNDARY rule). NOT fixed in this phase.

## Pre-existing lint errors (Plan 01, Task 1)

Discovered while running `yarn lint:check` for the `viewTransition.ts` helper. Both are
`simple-import-sort/imports` errors in test files **unmodified by this plan** (confirmed clean
`git status`); not caused by Plan 01 changes:

- `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.test.ts:1` — import sort
- `apps/frontend/src/lib/contexts/voter/answerStore.svelte.test.ts:1` — import sort

`viewTransition.ts` itself is lint-clean (`npx eslint src/lib/utils/viewTransition.ts` exits 0).

## Located-route voter-journey fixture stalls on multi-election seed (Plan 03, Task 2)

Discovered while running `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` in the local
dev environment. **All FIVE located-route a11y-smoke tests fail identically — the 3
pre-existing, baseline-green axe tests (`questions`, `results`, `voter-detail-drawer`) AND the
2 new NAVA11Y-01/02 tests added by this plan** — at the SAME shared fixture line
`tests/tests/fixtures/voter/voter-journey.fixture.ts:130` (`voter-questions-start` never
becomes visible). The 3 unlocated axe routes (`home`, `elections-selector`,
`constituencies-selector`) PASS.

Root cause (not caused by Plan 03 — the plan touches only `a11y-smoke.spec.ts` test
assertions, and reuses the shared fixture exactly as the pre-existing located tests do):

- The walk parks on the **"Select an election"** page (Playwright snapshot confirms 2 elections
  + a Continue button). The fixture's election-step guard
  `electionsList.isVisible({ timeout: TIMEOUTS.page })` keys on `getByTestId('voter-elections-list')`,
  which resolves to **count 0** in every live probe — `ElectionSelector.svelte` renders its
  outer div with a literal `data-testid="election-selector"` and the passed-in
  `data-testid="voter-elections-list"` does not reliably win. With a multi-election seed the
  Continue click is therefore skipped and the walk stalls on /elections; the `#route-announcer`
  is present and reads "Questions list" in the snapshot (the announcer itself works).
- The data-setup-base seed is **non-deterministic across runs** (one probe showed a SINGLE
  election that auto-skips /elections; the failing run showed TWO) — consistent with the
  documented HMR/seed-staleness fragility in this local environment
  (`project_e2e_hmr_staleness_restart.md`).

Per Task 2's explicit instruction ("if any spec fails for a reason that is NOT a flake and NOT
fixable via `?notr=1`, STOP and surface it — do not weaken or skip tests"), the fixture/seed
issue is **surfaced, not patched**. Fixing the shared `voter-journey` fixture or the
`ElectionSelector` testid forwarding is out of scope for a spec-only plan and would affect the
entire located-test suite. The new NAVA11Y-01/02 assertions are statically verified
(typecheck + lint clean) and recorded as a human-verification item in 99-03-SUMMARY.md.
