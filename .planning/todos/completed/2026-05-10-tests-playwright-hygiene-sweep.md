---
title: Test-infrastructure hygiene phase — clear the 98 pre-existing playwright/* warnings in tests/
priority: medium
created: 2026-05-10
resolves_phase: 73
context: Captured during Phase 71 OOS triage (`71-OUT-OF-SCOPE-FINDINGS.md` row #6). Phase 71 cleared the 27 unused-imports warnings in `apps/frontend/`; the 98 playwright warnings in `tests/` are not auto-fixable and require a dedicated test-hygiene phase.
---

# Test-infrastructure hygiene phase — playwright warnings

The frontend lint baseline is now 0 errors / 0 warnings. The remaining
`yarn lint:check` warnings (~98) all originate from `tests/`:

- `playwright/no-conditional-in-test` — `if (...)` branches inside test
  bodies that should be replaced by explicit assertions or by splitting
  into separate tests.
- `playwright/no-raw-locators` — `page.locator('...')` calls that should
  use semantic locators (`getByRole`, `getByText`, `getByTestId`).
- `playwright/no-networkidle` — `waitForLoadState('networkidle')` calls
  that should be replaced by element-state waits (`waitFor` against the
  element being asserted).

## Goal

Bring the repo to 0 lint warnings across all workspaces by sweeping the
`tests/` warnings batch-by-batch. Pair the sweep with the deterministic
E2E suite work tracked in
`.planning/todos/pending/2026-04-27-remove-e2e-skip-modifiers.md` —
both are test-hygiene concerns that benefit from being closed together.

## Approach

1. **Inventory** — run `yarn lint:check 2>&1 | grep -E "playwright/" | sort
   | uniq -c | sort -rn` to bucket the warnings per rule.
2. **Per-rule sweep** — fix one rule at a time, in this order:
   - `no-networkidle` (smallest, ~1 site) — quick win.
   - `no-raw-locators` (~50 sites) — biggest behavioral payoff; raw
     locators are brittle against DOM changes and harder to read in
     review.
   - `no-conditional-in-test` (~50 sites) — usually means a single test
     is exercising two contracts; split per branch.
3. **Lint enforcement** — once at 0 warnings, drop the workflow's
   `--quiet` flag (if any) and bump the gate from "warnings allowed" to
   "warnings forbidden".

## Why deferred from v2.8

Phase 71 OOS triage classified this as ❌ NOT FIT for v2.8 because it is
hours-to-days of manual rewrite per rule, not a mechanical sweep. Each
warning requires reading the test, understanding what state it was
asserting, and rewriting against semantic locators or explicit branch
splits. Best handled as a dedicated test-infra hygiene phase in v2.9.

## Files of interest

- `tests/tests/specs/voter/*.spec.ts`
- `tests/tests/specs/candidate/*.spec.ts`
- `tests/tests/specs/admin/*.spec.ts`

## Related todos

- `.planning/todos/pending/2026-04-27-remove-e2e-skip-modifiers.md` —
  pair-fix candidate (deterministic suite + clean lint baseline).
- `.planning/todos/pending/2026-04-27-extend-e2e-filter-type-coverage.md`
  — same v2.9 test-hygiene phase candidate.
- `.planning/phases/71-frontend-strict-typing-cleanup/71-OUT-OF-SCOPE-FINDINGS.md`
  row #6 — origin of this todo.

## Cross-references

- Phase 71 lint baseline (post-cleanup commit `04c319d1a` + this batch):
  0 errors / 0 warnings in apps/frontend, ~98 warnings in tests/.
