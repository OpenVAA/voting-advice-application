---
quick_id: 260524-l1t
slug: refactor-voter-mega-journey-spec-ts-time
description: Multi-deliverable refactor — TIMEOUT/RX consts, named args, locator hardening, testId migration, RLS hardening, baseV1 rename
date: 2026-05-24
mode: quick
status: complete
tests_executed: false  # user-locked
deliverables_done: D1, D2, D3, D4, D5, D6, D7, D8, D9 (9 of 9)
commits:
  - hash: 56a0958cf
    subject: refactor(260524-l1t): timeout + regex consts, named-arg helpers, TS cleanup in voter-mega-journey
    deliverables: D1, D2, D3, D4, D5, D9
  - hash: d1cd31a64
    subject: feat(260524-l1t): replace .entitySelected raw locator with data-testid="entity-selected-answer"
    deliverables: D6 (primary)
  - hash: fcd8fa884
    subject: chore(260524-l1t): align variant specs with testIds.voter.elections.card→option rename (D6 ripple)
    deliverables: D6 (ripple — 3 variant specs)
  - hash: 6108a3628
    subject: feat(260524-l1t): RLS hardening — anon visibility gated by terms_of_use_accepted; nominations RLS-safe
    deliverables: D7
  - hash: e1bd3a43e
    subject: chore(260524-l1t): rename test-qg-opin-base-b/c → test-qg-opin-opt-a/b in baseV1
    deliverables: D8
---

# Quick Task 260524-l1t — SUMMARY

User requested a multi-item refactor pass to facilitate continued e2e work on
`voter-mega-journey.spec.ts`. **No tests were executed during this task** per
the user's directive — verification was static (lint + grep + tsc).

## Deliverable status

| ID | Description | Status | Commit |
|----|-------------|--------|--------|
| D1 | Global `TIMEOUT` constants (element/click/page/slowPage/testMax) | ✓ | 56a0958cf |
| D2 | Named args for helpers with 2+ params | ✓ | 56a0958cf |
| D3 | Common text regexes hoisted into `RX` const block | ✓ | 56a0958cf |
| D4 | `body.textContent` probe → specific locators with `.or()` chains | ✓ | 56a0958cf |
| D5 | `maybeAdvanceElectionAccordion` requires explicit pattern arg | ✓ | 56a0958cf |
| D6 | Real testId on `.entitySelected` (QuestionChoices.svelte + testIds.ts) | ✓ | d1cd31a64 + fcd8fa884 |
| D7 | RLS hardening — anon ToU gating + get_nominations RLS-safe + pgTAP | ✓ | 6108a3628 |
| D8 | Rename `test-qg-opin-base-b/c` → `test-qg-opin-opt-a/b` | ✓ | e1bd3a43e |
| D9 | TS6133 (`page` unused line 292) + TS80007 (`await` no-effect line 915) | ✓ | 56a0958cf |

## Execution notes

The first executor agent died with a socket error mid-execution after landing
Task 1 (`56a0958cf`) and Task 3 (`d1cd31a64`) but before committing Task 4
(D7 + D8). On resume the orchestrator audited the working tree, found Task 2
(D4 + D5) had been folded into Task 1's commit (intentional collapse — the
deliverables overlap with the named-args + RX consts work), and continued
inline with the remaining commits:

- **fcd8fa884** — the D6 commit additionally renamed `testIds.voter.elections.card`
  → `.option` (an out-of-original-scope cosmetic alignment between the JS key
  and the underlying DOM testid string `'election-selector-option'`). 3 variant
  specs needed a 1-line follow-up to track the rename. This is a benign ripple
  that keeps the test tree compiling — string DOM testid is unchanged.

- **6108a3628** — D7 RLS hardening cleanly addressed the `[u53-followup]`
  CA-AA-Hidden visibility gap surfaced by quick task 260523-u53. The new
  migration `00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql`
  contains 2 schema diffs (DROP+CREATE policy; CREATE OR REPLACE function),
  guarded by `BEGIN`/`COMMIT`. pgTAP fixtures updated: `create_test_data()` now
  sets `terms_of_use_accepted = now()` on candidate_a + candidate_a2 (keeps
  existing assertions passing); `03-anon-read.test.sql` adds 3 new assertions
  covering NULL / future / past branches (plan count 56 → 59).

- **e1bd3a43e** — D8 was partially-done by the executor (display names updated
  to "Optional Opinion Questions A/B" but external_ids still on `-base-b/c`).
  Completed inline: 4 external_id renames in baseV1.ts + 4 doc-comment block
  rewrites + 1 step-title rename + 1 walk-comment rewrite in
  voter-mega-journey.spec.ts. Legacy `(was: Base-B)` parentheticals preserved
  in comments for grep-discoverability during the migration trail.

## Verification (static-only — per user directive "Don't try to run the tests")

```
yarn eslint --flag v10_config_lookup_from_file tests/tests/specs/voter/voter-mega-journey.spec.ts
  → 0 errors, 0 warnings

grep -rn "test-qg-opin-base-b\|test-qg-opin-base-c\|test-qu-opin-base-b\|test-qu-opin-base-c"
     --include="*.ts" --include="*.svelte" --include="*.sql" -- .
  → 0 matches (excluding .planning/ and node_modules)

git status --short
  → only TEST-INVENTORY.md modified (user's WIP for REFACTOR-2; not in scope)
  → apps/frontend/tsconfig.tsbuildinfo (pre-existing dirty entry)
  → no source-file regressions
```

## Files changed (per commit)

| Commit | Files |
|--------|-------|
| 56a0958cf | tests/tests/specs/voter/voter-mega-journey.spec.ts |
| d1cd31a64 | apps/frontend/src/lib/dynamic-components/.../QuestionChoices.svelte, tests/tests/utils/testIds.ts, tests/tests/specs/voter/voter-mega-journey.spec.ts, tests/tests/specs/voter/voter-detail.spec.ts |
| fcd8fa884 | tests/tests/specs/variants/Ne-Nc.spec.ts, tests/tests/specs/variants/constituency.spec.ts, tests/tests/specs/variants/multi-election.spec.ts |
| 6108a3628 | apps/supabase/supabase/schema/302-rls.sql, apps/supabase/supabase/schema/503-entity-rpcs.sql, apps/supabase/supabase/migrations/00002_anon_select_terms_of_use_and_get_nominations_rls_guard.sql, apps/supabase/supabase/tests/database/00-helpers.test.sql, apps/supabase/supabase/tests/database/03-anon-read.test.sql |
| e1bd3a43e | packages/dev-seed/src/templates/baseV1.ts, tests/tests/specs/voter/voter-mega-journey.spec.ts |

## Follow-ups surfaced

1. **D7 requires DB reset to take effect.** The next `yarn db:reset` (or
   `yarn db:reset-with-data`) will apply migration 00002. Existing seeded
   data with NULL `terms_of_use_accepted` on candidates (e.g. legacy default
   template if not updated) will become anon-invisible. Recommend auditing
   other seed templates (`packages/dev-seed/src/templates/default.ts`,
   `e2e.ts`) for unset `terms_of_use_accepted` before next milestone close.

2. **D6 sr-only sibling pattern.** The new `data-testid="entity-selected-answer"`
   lives on a sibling `<span>` (since `data-testid` can only appear once per
   element and the radio input already has `data-testid="question-choice"`).
   The voter-detail spec exemplar at lines 246-249 was also migrated. Future
   testId additions on opinion-row elements should follow the same pattern
   or add a wrapper `<div data-testid="...">`.

3. **TEST-INVENTORY.md whitespace-only diff (uncommitted).** User-owned WIP
   not modified by this task — preserved as-is in the working tree.

4. **Spec runtime not re-verified.** Per user directive. The spec passed
   3/3 at the end of 260523-u53; the changes in this task are non-functional
   refactors (TIMEOUT/RX consts, named-args, regex hoist, testId migration)
   plus a backend RLS tightening that the user will need to verify against
   a `yarn db:reset` and a manual single-spec run before relying on the new
   visibility contracts.
