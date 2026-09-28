---
phase: 132-milestone-close-green-gate-svelte-check-zero-flip
plan: 04
subsystem: testing
tags: [eslint, lint, func-style, simple-import-sort, playwright, no-raw-locators, no-conditional-in-test]

# Dependency graph
requires:
  - phase: 132-01
    provides: candidate-journey harden that introduced one import-sort drift error
  - phase: 132-02
    provides: prior wave-1 remediation context
provides:
  - Clean-tree `yarn lint:check` exits 0 (all 20 pre-existing drift errors cleared)
  - 14 @openvaa/frontend errors cleared (12 func-style + 2 import-sort)
  - 6 tests/ errors cleared (2 import-sort + 2 no-raw-locators + 2 no-conditional-in-test)
affects: [132-03, milestone-close, gsd-complete-milestone]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "func-style declaration form: `$app/navigation` vitest stubs use `export function` not `export const = () =>`"
    - "reasoned `// reason:` + `eslint-disable-next-line` for DU-narrowing data-extraction ternaries in specs"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/i18n/tests/__mocks__/app-navigation.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts
    - apps/frontend/src/routes/candidate/(protected)/+layout.server.ts
    - tests/tests/fixtures/voter/entityDetails.fixture.ts
    - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
    - tests/tests/specs/candidate/candidate-journey.spec.ts
    - tests/tests/specs/voter/voter-nominations.spec.ts

key-decisions:
  - "Reverted prettier --write over-reach on candidate-journey.spec.ts (touched 2 pre-existing-drift lines outside the import block); re-applied eslint --fix alone to keep the diff import-only."
  - "Left pre-existing prettier drift in entityDetails.fixture.ts + candidate-bank-auth-journey.spec.ts untouched — this plan is scoped to lint remediation; Task 3 gates on lint:check, not format:check."

patterns-established:
  - "Pattern 1: func-style arrow-const → function-declaration is a behavior-neutral, identity-preserving conversion for exported stubs and local helpers (hoisting inert when called after declaration)."
  - "Pattern 2: extending an existing eslint-disable directive to add a second overlapping rule (`, playwright/no-raw-locators`) reuses the existing `// reason:` justification without a new disable block."

requirements-completed: []

coverage:
  - id: D1
    description: "All 20 clean-tree `yarn lint:check` errors cleared; command exits 0 across @openvaa/frontend + tests/."
    verification:
      - kind: automated_ui
        ref: "yarn lint:check (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No behavioral change to any unit test or spec — frontend 759 / dev-seed 444 unit tests unchanged; all Playwright specs still parse."
    verification:
      - kind: unit
        ref: "yarn test:unit (frontend 759 passed, dev-seed 444 passed, exit 0)"
        status: pass
      - kind: e2e
        ref: "npx playwright test -c tests/playwright.config.ts --list (exit 0)"
        status: pass
    human_judgment: false

# Metrics
duration: 6min
completed: 2026-07-22
status: complete
---

# Phase 132 Plan 04: Lint Remediation for the Close Gate Summary

**Cleared all 20 pre-existing clean-tree `yarn lint:check` errors (14 @openvaa/frontend + 6 tests/) with behavior-neutral edits confined to 8 files, unblocking the 132-03 milestone-close static gate.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-07-22T22:56:02Z
- **Completed:** 2026-07-22T23:01:38Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- 12 `func-style` errors cleared: 11 `$app/navigation` vitest stubs (`app-navigation.ts`) + 1 local `q` helper (`supabaseDataProvider.test.ts`) converted arrow-const → function declaration, preserving async-ness, signatures, and the exact `as {...}` cast.
- 4 `simple-import-sort` errors cleared via scoped `eslint --fix` (candidateContext.svelte.test.ts, +layout.server.ts, candidate-journey.spec.ts, voter-nominations.spec.ts) — import/named-member reorder only.
- 2 `playwright/no-raw-locators` errors cleared by extending the existing `no-restricted-locators` disable comments to also name `no-raw-locators` (reusing the existing `// reason:` block; no data-testid added).
- 2 `playwright/no-conditional-in-test` errors cleared with reasoned `// reason:` + `eslint-disable-next-line` on two discriminated-union data-extraction ternaries — the adjacent `expect(...length...)` assertions are byte-for-byte unchanged.
- Clean-tree gate proven green: `yarn lint:check` exit 0, `yarn test:unit` exit 0 (frontend 759 / dev-seed 444 unchanged), `npx playwright test --list` exit 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: Clear the 14 @openvaa/frontend lint errors** - `d44913d64` (fix)
2. **Task 2: Clear the 6 tests/ lint errors** - `a9ddc6ec2` (fix)
3. **Task 3: Prove the clean-tree gate green** - verification only (no files modified)

**Plan metadata:** _(final docs commit — this SUMMARY + STATE/ROADMAP)_

## Files Created/Modified
- `apps/frontend/src/lib/i18n/tests/__mocks__/app-navigation.ts` - 11 arrow-const stubs → function declarations
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` - arrow-const `q` → function declaration (cast preserved)
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts` - import reorder
- `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` - import reorder
- `tests/tests/fixtures/voter/entityDetails.fixture.ts` - 2 disable comments extended with `, playwright/no-raw-locators`
- `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts` - 2 reasoned `no-conditional-in-test` disables
- `tests/tests/specs/candidate/candidate-journey.spec.ts` - import reorder
- `tests/tests/specs/voter/voter-nominations.spec.ts` - import reorder (`{ test, expect }` → `{ expect, test }`)

## Decisions Made
- **prettier scope discipline:** `prettier --write` on `voter-nominations.spec.ts` correctly normalized the `{ expect,test }` no-space artifact left by `eslint --fix`. But running it on `candidate-journey.spec.ts` also reformatted 2 unrelated pre-existing-drift lines (a long `.replace()` chain and a long `expect().not.toEqual()`), which is out of this plan's import-only scope. I reverted that file and re-applied `eslint --fix` alone, yielding an import-only diff.
- **Left pre-existing prettier drift untouched** in `entityDetails.fixture.ts` and `candidate-bank-auth-journey.spec.ts` (confirmed drift present at HEAD, not introduced by my comment edits). This plan is scoped to lint remediation only; `format:check` is not a gate here.

## Deviations from Plan

None - plan executed exactly as written. All three fix classes (func-style declaration conversion, import/member reorder, reasoned `// reason:`-block disable) landed as specified; every `expect(...)` assertion and its arguments are byte-for-byte unchanged.

## Issues Encountered
- `eslint --fix` on `voter-nominations.spec.ts` produced `{ expect,test }` (missing space after comma) because `simple-import-sort` reorders members but does not run prettier. Fixed by a scoped `prettier --write` on that single file (space-only change). No assertion or logic touched.

## Known Stubs
None introduced. (`app-navigation.ts` remains an intentional empty-body `$app/navigation` vitest stub — pre-existing and unchanged in behavior; only its declaration form changed.)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The clean-tree static gate is green: `yarn lint:check` exits 0. The blocked 132-03 close-gate plan (wave 3, depends_on 132-04) can now re-run `yarn lint:check` and honestly record the milestone-close static gate (phase SC #3) as green.
- 132-03 remains the sole authority for the E2E green proof — this plan ran NO E2E suite and recorded NO gate evidence.

## Self-Check: PASSED
- All modified files exist on disk (8/8 verified).
- Both task commits exist in git history: `d44913d64`, `a9ddc6ec2`.
- Clean-tree gate green: `yarn lint:check` exit 0, `yarn test:unit` exit 0 (frontend 759 / dev-seed 444), `playwright --list` exit 0.
- Diff scoped to exactly the 8 `files_modified` (no eslint/config, no product source, no other test).

---
*Phase: 132-milestone-close-green-gate-svelte-check-zero-flip*
*Completed: 2026-07-22*
