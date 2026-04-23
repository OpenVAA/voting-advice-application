---
phase: 59-e2e-fixture-migration
plan: 03
subsystem: tests/
tags: [e2e, fixture-migration, parity-gate, variant-templates]
requirements: [E2E-02, E2E-03]
dependency_graph:
  requires:
    - "@openvaa/dev-seed (BUILT_IN_TEMPLATES.e2e + validateTemplate)"
    - ".planning/phases/59-e2e-fixture-migration/baseline/summary.md (test-set source of truth)"
    - ".planning/phases/59-e2e-fixture-migration/baseline/playwright-report.json (smoke-test input)"
  provides:
    - "tests/tests/setup/templates/variant-constituency.ts (Template)"
    - "tests/tests/setup/templates/variant-multi-election.ts (Template)"
    - "tests/tests/setup/templates/variant-startfromcg.ts (Template)"
    - ".planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts (parity gate)"
  affects:
    - "Plan 04 — will rewrite variant-*.setup.ts to load these templates via --template <path>"
    - "Plan 05 — will consume diff-playwright-reports.ts for post-swap verification"
    - "Plan 06 — will delete tests/tests/data/overlays/*.json once CI is green"
tech_stack:
  added: []
  patterns:
    - "Template composition via `...baseFixed(table)` spread from BUILT_IN_TEMPLATES.e2e"
    - "Playwright JSON shape inline-typed (no @playwright/test import dependency)"
    - "Tsx direct-invocation CLI guard pattern (packages/dev-seed/src/cli/teardown.ts analog)"
key_files:
  created:
    - tests/tests/setup/templates/variant-constituency.ts
    - tests/tests/setup/templates/variant-multi-election.ts
    - tests/tests/setup/templates/variant-startfromcg.ts
    - .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts
  modified: []
decisions:
  - "Per-task atomic commits (3 × feat(59-03)) instead of plan's Task-4 bundled commit — continues Plan 59-02 precedent and matches executor task_commit_protocol."
  - "Chose tooling approach (b) for the diff script: inline type aliases for Playwright JSON shape rather than importing @playwright/test from outside tests/. ~35 lines of type definitions, zero `any`, zero new deps. The diff script lives under .planning/ and has no access to the tests/ workspace's Playwright types."
  - "Template pass-through fields use `{ count: 0, fixed: [...baseFixed(table), ...new] }` rather than `{ ...base[table] }` spread — ensures count is always 0 (suppress synthetic emission) and fixed is a new array (no shared-reference mutation risk)."
  - "Overlay `_constituencies` / `_constituencyGroups` / `_elections` sentinel fields dropped from variant templates: pipeline.ts:229-255 post-topo pass OVERWRITES these with full-fanout per T-56-37. Per-row scoping from the legacy overlay cannot be reproduced template-side. Variant specs that require narrow scoping query by external_id (results-sections.spec.ts:171-174, multi-election.spec.ts:135-140) — that route still works."
  - "Overlay-side `organization: { externalId }` refs on candidate-type nominations dropped: e2e base already follows the Phase 56 NominationsGenerator contract (candidate-type nominations carry only the candidate ref; organization linkage flows through candidates.organization_id)."
metrics:
  duration_seconds: 625
  duration_human: "10m 25s"
  tasks_completed: 3
  task_4_note: "Plan's Task 4 (bundle commit) superseded by per-task atomic commits — 3 commits satisfy the net deliverable without a separate bundling step."
  files_created: 4
  files_modified: 0
  commits:
    - c3c8e2bec  # Task 1
    - 45d4d8abb  # Task 2
    - 5b449ab73  # Task 3
  completed_date: 2026-04-23
---

# Phase 59 Plan 03: Variant Templates + Parity Diff Script Summary

Three filesystem-loadable variant Templates replacing `tests/tests/data/overlays/*.json` + a Playwright JSON report diff script encoding the D-59-04 parity rule. All four artifacts pass validation / self-identity checks and cover every overlay external_id.

## Deliverables

| Artifact | Purpose | Row count added |
|---|---|---|
| `tests/tests/setup/templates/variant-constituency.ts` | Region/municipality hierarchy variant | 1 CG + 5 constituencies + 2 categories + 3 questions + 5 candidates + 8 nominations = 24 new rows |
| `tests/tests/setup/templates/variant-multi-election.ts` | Election-2 cross-nominations variant | 1 CG + 1 category + 2 questions + 3 candidates + 6 nominations = 13 new rows |
| `tests/tests/setup/templates/variant-startfromcg.ts` | Orphan-municipality reversed-flow variant | 1 CG + 5 constituencies + 2 categories + 2 questions + 4 candidates + 6 nominations = 20 new rows |
| `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` | D-59-04 parity gate consumed by Plan 05 | n/a (script) |

## Overlay-row coverage

Each overlay's unique external_id set was computed by
`grep -oE '"externalId": "[^"]+"' <overlay.json> | sort -u` and every id
cross-checked against the new template + the base e2e template. Results:

| Overlay | Unique external_ids | Missing (template OR base) |
|---|---|---|
| `constituency-overlay.json` | 32 | 0 |
| `multi-election-overlay.json` | 13 | 0 |
| `startfromcg-overlay.json` | 22 | 0 |

Every overlay row is either expressed in the new template or already in the
Phase 58 e2e base — complete parity.

## Shape-drift corrections applied (JSON -> TS)

Uniform across all three variants:

| Legacy JSON field | Template TS field | Rationale |
|---|---|---|
| `firstName` / `lastName` | `first_name` / `last_name` | snake_case matches TablesInsert<'candidates'> |
| `termsOfUseAccepted` | `terms_of_use_accepted` | snake_case per schema |
| `categoryType` | `category_type` | snake_case per schema |
| `electionDate` | `election_date` | snake_case per schema |
| `electionStartDate` | *(stripped)* | not a schema column; unused by spec |
| `order` | `sort_order` | matches base e2e rows |
| `{ externalId: 'x' }` (any ref obj) | `{ external_id: 'x' }` | snake_case per pipeline ref-sentinel convention |
| `projectId` (row-level) | *(stripped)* | template-schema field; ctx-managed |
| `published` (row-level) | *(stripped)* | defaulted by bulk_import |
| `choices[].normalizableValue: "3"` | `...: 3` (number) | matches base LIKERT_5 shape; Phase 57 latent emitter reads numeric |
| `choices[].key` | *(stripped)* | not present on base LIKERT_5 |
| `_constituencies` / `_constituencyGroups` / `_elections` per-row sentinels | *(stripped)* | pipeline.ts:229-255 full-fanout overwrites these (T-56-37) |
| `organization: { externalId }` on candidate-type nominations | *(stripped)* | NominationsGenerator contract: candidate-type nominations carry only candidate ref |

No shape-drift was load-bearing enough to warrant a template schema
extension. Every drop was documented in-template via comment.

## Diff script — tooling choice (a vs b)

**Chose approach (b)** — inline type aliases for Playwright JSON shape. Rationale:

- The diff script lives at `.planning/phases/59-e2e-fixture-migration/scripts/`
  which is outside any workspace with `@playwright/test` as a dep
  (Playwright is installed as a root dev dep, but tsx's module resolution
  from the .planning/ path doesn't walk up to root node_modules reliably
  without additional config).
- Option (a) would couple the parity script to the tests/ workspace's
  dependency graph for a read-only JSON shape that stabilizes at
  Playwright v1.x — not worth the coupling cost for a one-off parity gate.
- Approach (b) uses ~35 lines of interface definitions with zero `any`.
  The shape captures only the fields the diff script reads
  (`suites[].specs[].tests[].results[0].status`, `tests[].status` fallback,
  `tests[].projectName`) — leaner than importing the full JSONReporter
  type tree.
- Passes `tsx` execution without transform errors; validated via the
  self-identity smoke test (exit 0) + synthetic regression test (exit 1).

The script exports `diffReports` and `flattenReport` as pure functions so
Plan 05 (or future tests) can unit-test the parity logic without invoking
the CLI.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cascade tests missing from `t.results[]` in baseline JSON**
- **Found during:** Task 3 self-identity smoke test
- **Issue:** Initial `flattenReport` read only `firstResult.status ?? 'unknown'`, which returned `'unknown'` for all 25 cascade tests because Playwright emits "did not run" tests with `results: []` (empty array) and a top-level `tests[].status: 'skipped'`. This caused the smoke test to report `PARITY GATE: FAIL` with 25 phantom regressions (cascade → fail) because the 'unknown' raw status was categorized as `fail`.
- **Fix:** Added `t.status` as fallback when `firstResult.status` is undefined. Documented inline via code comment citing the load-bearing nature for cascade detection.
- **Files modified:** `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` (single line change in the walk function)
- **Commit:** 5b449ab73 (folded into Task 3's commit — bug caught + fixed before the commit landed)

### Plan-scope adjustments

**2. Per-task atomic commits instead of plan's Task-4 bundle commit**
- **Found during:** Initial task-commit decision
- **Issue:** Plan's Task 4 bundles all 4 files into a single `feat(59-03)` commit. Executor task_commit_protocol + Plan 59-02 precedent both point at per-task atomic commits.
- **Fix:** 3 atomic commits (`c3c8e2bec`, `45d4d8abb`, `5b449ab73`) — one per functional delta. Net file set and aggregate message content is identical to the plan's Task 4 commit; only the commit granularity differs.

### Post-hoc baseline count reconciliation

**3. Baseline actual 41/10/25+13=89, not CONTEXT.md's 15/19/55=89**
- **Found during:** Task 3 authoring (reading baseline/summary.md vs CONTEXT.md)
- **Issue:** CONTEXT.md / D-59-04 describe a "19 data-race pool" — baseline/summary.md (authored by Plan 01) captures 10. Plan 01's summary.md is authoritative.
- **Fix:** Embedded all three lists (41 pass / 10 data-race / 25 cascade) from baseline/summary.md verbatim; did NOT use the CONTEXT.md estimate. 13 source-skip tests are explicitly excluded from the parity contract per baseline/summary.md's guidance.
- **No commit delta** — this is just a sourcing decision.

## Authentication gates

None. All verification ran offline (validate-template only; no live DB).

## Known Stubs

None. The three variant templates are complete fixtures replacing the
legacy overlay JSONs 1:1; the diff script is a standalone tool with no
pending wiring.

## Threat Flags

None. The diff script only reads JSON files passed as CLI args (T-59-03-04
"accept" disposition); templates carry no PII. No new network endpoints,
auth paths, or schema touches.

## Verification output

```
=== File existence (4/4 created) ===
tests/tests/setup/templates/variant-constituency.ts      14765 bytes
tests/tests/setup/templates/variant-multi-election.ts     8212 bytes
tests/tests/setup/templates/variant-startfromcg.ts       10639 bytes
.planning/phases/59-e2e-fixture-migration/scripts/
  diff-playwright-reports.ts                             21974 bytes

=== Overlay JSON imports in templates (expected 0) ===
variant-constituency.ts:     0
variant-multi-election.ts:   0
variant-startfromcg.ts:      0

=== externalId accessors in templates (expected 0) ===
variant-constituency.ts:     0
variant-multi-election.ts:   0
variant-startfromcg.ts:      0

=== BUILT_IN_TEMPLATES references (expected >= 1 each) ===
variant-constituency.ts:     4
variant-multi-election.ts:   4
variant-startfromcg.ts:      4

=== Diff script self-identity (expected PARITY GATE: PASS) ===
Baseline: 41p / 10f / 38c
Post:     41p / 10f / 38c
Contract: 41 pass-locked, 10 data-race pool, 25 cascade-baseline.
PARITY GATE: PASS — no regressions detected per D-59-04.
(exit 0)

=== Diff script synthetic regression (force voter-journey to fail) ===
PARITY GATE: FAIL — 1 regression(s):
  - [pass -> fail] voter-app :: specs/voter/voter-journey.spec.ts >
      should auto-imply election and constituency
      baseline-passing test regressed (D-59-04 PASS_LOCKED violation)
(exit 1)

=== yarn build (turborepo, all cached) ===
Tasks:    14 successful, 14 total
Cached:   14 cached, 14 total
Time:     260ms
```

## References

- Plan: [`59-03-PLAN.md`](./59-03-PLAN.md)
- Phase context: [`59-CONTEXT.md`](./59-CONTEXT.md) (D-59-04 parity rule)
- Phase patterns: [`59-PATTERNS.md`](./59-PATTERNS.md) §Diff script
- Baseline data source: [`baseline/summary.md`](./baseline/summary.md)
- Source overlays (deleted in Plan 06):
  - [`tests/tests/data/overlays/constituency-overlay.json`](../../../tests/tests/data/overlays/constituency-overlay.json)
  - [`tests/tests/data/overlays/multi-election-overlay.json`](../../../tests/tests/data/overlays/multi-election-overlay.json)
  - [`tests/tests/data/overlays/startfromcg-overlay.json`](../../../tests/tests/data/overlays/startfromcg-overlay.json)
- Downstream consumers:
  - Plan 04 — rewrites `tests/tests/setup/variant-*.setup.ts` to `--template <path>`
  - Plan 05 — runs `diff-playwright-reports.ts` as the post-swap parity gate
  - Plan 06 — deletes the source overlay JSONs after CI green

## Self-Check: PASSED

All 5 files verified present on disk; all 3 commit hashes verified in git log.

- `tests/tests/setup/templates/variant-constituency.ts` — FOUND
- `tests/tests/setup/templates/variant-multi-election.ts` — FOUND
- `tests/tests/setup/templates/variant-startfromcg.ts` — FOUND
- `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` — FOUND
- `.planning/phases/59-e2e-fixture-migration/59-03-SUMMARY.md` — FOUND
- `c3c8e2bec` (Task 1 — variant-constituency) — FOUND
- `45d4d8abb` (Task 2 — variant-multi-election + variant-startfromcg) — FOUND
- `5b449ab73` (Task 3 — diff-playwright-reports) — FOUND
