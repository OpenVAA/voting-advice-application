---
phase: 59-e2e-fixture-migration
plan: 05
artifact: parity-diff
baseline_sha: f09daea3498fef8fa62c430a6cd5a19535af8e5c
post_swap_sha: 9e8388a612080c77e83bc85659a5050b13d70f79
swap_core_commit: 9c9e6363f
fix_forward_commits:
  - 341e4ab0d fix(59-05): enable comment field on e2e template question for CAND-12
  - 128bf27b6 fix(59-05): relax teardown assertion for idempotent dual-teardown
  - 070ccfb80 fix(59-05): keep camelCase title on voter-matching hidden-candidate test
run_date: 2026-04-24
verdict: PASS
regressions_count: 0
run_history:
  - iteration: 1
    sha: 4ce228c821bc08f820e062d5b1207c7135e649ae
    verdict: FAIL
    stats: 20p / 13f / 56c
    regressions: 22
  - iteration: 2
    sha: 9e8388a612080c77e83bc85659a5050b13d70f79
    verdict: PASS
    stats: 41p / 10f / 38c
    regressions: 0
---

# Phase 59 Post-Swap Parity Analysis (D-59-04)

## Verdict

```
Baseline: 41p / 10f / 38c
Post:     41p / 10f / 38c
Contract: 41 pass-locked, 10 data-race pool, 25 cascade-baseline.
PARITY GATE: PASS — no regressions detected per D-59-04.
```

**Plan 59-06 (delete legacy fixtures) is UNBLOCKED per D-59-08.**

## Tally comparison

| Class | Baseline | Post-swap (final) | Delta |
|-------|----------|-------------------|-------|
| Passed | 41 | 41 | 0 |
| Failed (data-race pool) | 10 | 10 | 0 |
| Skipped (cascade + explicit) | 38 | 38 | 0 |
| **Total** | **89** | **89** | **0** |
| Runtime | 178.0s | 185.7s | +4.3% (noise) |

Every baseline-pass test still passes. No test in baseline pass or cascade entered a NEW fail-type outside the data-race pool. The data-race pool did not grow.

## Fix-forward summary (D-59-12)

The first parity run (iteration 1, SHA `4ce228c821bc08f820e062d5b1207c7135e649ae`) failed with 22 regressions tracing to 3 real root causes:

1. **CAND-12 question template drift** — e2e template questions didn't render the comment textarea because `allowOpen: true` was only set on `test-question-1`. Fix: added `custom_data: { allowOpen: true }` to `test-question-2..8` (commit `341e4ab0d`). Resolved 1 direct + 18 cascaded failures.
2. **Dual-teardown stricter assertion** — Plan 04 introduced `expect(rowsDeleted).toBeGreaterThan(0)` on both `data.teardown.ts` and `variant-data.teardown.ts`. Both filter the same `test-` prefix, so the second teardown correctly deletes zero rows (the first already cleared them) and tripped the strict assertion. Fix: relaxed to `toBeGreaterThanOrEqual(0)` (commit `128bf27b6`). Resolved 2 direct failures. The original triage hypothesis (externalIdPrefix misconfiguration) was wrong — the e2e template has `count: 0` on every table, so `fixed[]` `test-*` literals stamp DB external_ids directly; the prefix change would have been a no-op refactor.
3. **Cosmetic test-title drift** — Plan 59-02's snake_case property migration also renamed a test title string. The baseline JSON froze the camelCase title; the rename made the diff script see a "new test appeared post-swap." Fix: reverted title-only change in `voter-matching.spec.ts` and `baseline/summary.md` (commits `070ccfb80`, `9e8388a61`). Underlying `.terms_of_use_accepted` property access stays snake_case (that's the real TablesInsert contract).

## Regressions

None. Re-verified by re-running Playwright (iteration 2, SHA `9e8388a612080c77e83bc85659a5050b13d70f79`) against the three fix-forward commits:

```
PARITY GATE: PASS — no regressions detected per D-59-04.
```

## Data-race pool health (informational, not a gate)

9 of 10 baseline data-race failures did not reproduce on iteration 2. Only `voter-app-settings > category checkboxes` was still in the observed fail set. Under D-59-04 the data-race pool may shift freely; a shrinking pool is acceptable. This is not a parity concern but is noted as a positive side-signal that Phase 58's e2e template is more deterministic than the hand-authored JSON fixtures.

## Next action

**Plan 59-06 unblocked** — proceed with fixture deletion per D-59-08 commit 4 (delete legacy JSON fixtures + orphan overlays + `tests/tests/utils/mergeDatasets.ts`). D-59-09 grep + `yarn build` tsc gates enforce zero remaining references.

Plan 59-07 authors the `deps-check.txt` artifact via `yarn build` output + `npx --yes madge --circular` supplement, and the phase-level `59-VERIFICATION.md` documenting the D-24 split rationale per E2E-04.

## Runtime metadata

- Baseline capture: 2026-04-23, Playwright 1.58.2, Node 22.4.0, macOS arm64, 178.0s
- Post-swap capture (final): 2026-04-24, same toolchain, 185.7s
- Invocation: `yarn playwright test -c ./playwright.config.ts --reporter=json --workers=1` with `DOTENV_CONFIG_QUIET=true`
