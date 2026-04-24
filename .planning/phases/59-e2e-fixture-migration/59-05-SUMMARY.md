---
phase: 59-e2e-fixture-migration
plan: 05
subsystem: testing
tags: [e2e, parity-gate, playwright, dev-seed, D-59-04, D-59-12, fix-forward]
requirements: [E2E-03]
dependency_graph:
  requires:
    - plan: 01
      provides: "baseline/playwright-report.json + baseline/summary.md (41/10/25/13 pass-set contract)"
    - plan: 03
      provides: "scripts/diff-playwright-reports.ts (authoritative parity evaluator)"
    - plan: 04
      provides: "core swap landed (tests/ onto @openvaa/dev-seed); commit 9c9e6363f"
  provides:
    - "post-swap/playwright-report.json (172 KB, 89 tests, 178.3s)"
    - "post-swap/diff.md (PARITY GATE: FAIL verdict + regression triage + fix-forward workflow)"
  affects:
    - "Plan 59-06 — BLOCKED until parity gate flips to PASS (do NOT delete legacy fixtures)"
    - "Plan 59-07 — BLOCKED (VERIFICATION + D-24 finalization waits for 06)"
    - "Any Phase 59.1 / extension work-list targeting the 3 root causes surfaced here"
tech_stack:
  added: []
  patterns:
    - "Parity-gate artifact pair: playwright-report.json (machine-consumed) + diff.md (human-consumed) committed together"
    - "Fix-forward per D-59-12 — capture the gate, document regressions, leave the swap landed, surface a work-list to the orchestrator (NO rollback)"
key_files:
  created:
    - .planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json
    - .planning/phases/59-e2e-fixture-migration/post-swap/diff.md
  modified: []
decisions:
  - "Parity gate FAILED with 22 regressions tracing to 4 root-cause layers: (a) candidate-questions CAND-12 persist-comment timeout; (b) runTeardown('test-') deletes zero rows in both teardowns; (c) baseline summary.md ID drift (camelCase vs snake_case, Plan 59-02 rename cosmetic only); plus (d) the cascade chain that amplifies (a) across 18 downstream candidate-* tests. Phase 59 remains OPEN per D-59-12; Plan 06 BLOCKED."
  - "Data-race pool SHRANK (9 of 10 baseline flaky tests now pass post-swap). Under D-59-04 this is acceptable — the data-race pool may shift within itself, and shrinking is a strictly positive signal. The parity failure is NOT about concurrency variance; it's about deterministic data/teardown shape regressions."
  - "Post-swap run duration 178.3s vs baseline 178.0s (+0.17%) — seed path latency is effectively unchanged. NF-01 <10s seed budget (from phase scope) is not at risk; the extra time spent is in test bodies, not seeding."
  - "Diff script's 'new test appeared' flag for voter-matching NOT-show-hidden-candidate is a FALSE POSITIVE: the spec's title was renamed from camelCase to snake_case in Plan 59-02 (STATE.md decision log). Both baseline and post-swap have the test as test.skip — no runtime regression. Classed as a documentation-side cosmetic fix (update baseline/summary.md ID)."
metrics:
  duration_seconds: 520
  duration_human: "8m 40s"
  tasks_completed: 3
  files_created: 2
  files_modified: 0
  commits:
    - 9d36cdb35  # Task 2: post-swap playwright-report.json
    - e67be2bf0  # Task 3: diff.md with PARITY FAIL verdict
  completed_date: 2026-04-24
  verdict: FAIL
---

# Phase 59 Plan 05: Post-Swap Parity Gate Summary

**PARITY GATE: FAIL. 22 surface regressions across 3 real root causes — candidate-questions CAND-12 comment-persistence timeout (cascades into 18 tests), runTeardown('test-') deleting zero rows in both teardowns, and a cosmetic baseline ID drift from the Plan 59-02 snake_case migration. Phase 59 remains OPEN; Plan 06 (fixture deletion) is BLOCKED until parity flips green.**

## Performance

- **Duration:** 8m 40s (5m 40s for the Playwright capture + ~2 min human-action gate wait + 1 min diff+author)
- **Started:** 2026-04-24T05:33:00Z (Task 2 launch)
- **Completed:** 2026-04-24T05:41:11Z (Task 3 commit)
- **Tasks:** 3 (1 human-action + 2 auto)
- **Files created:** 2 (`post-swap/playwright-report.json`, `post-swap/diff.md`)

## Accomplishments

- Captured the post-swap Playwright JSON report against Plan-04 HEAD (`4ce228c821b...`) with the identical D-59-03 invocation used for the Plan 01 baseline. Report passes all integrity checks: parseable JSON, 25 suites, 89 tests (±0 from baseline), 178.3s runtime, zero secret leaks.
- Ran the Plan-03 parity diff script — `PARITY GATE: FAIL`, exit 1, 22 regressions — and committed the result alongside the report.
- Authored `post-swap/diff.md` with a triaged regression map: 4 root causes, fix-forward recommendations per D-59-12, explicit Plan 06 blocker.
- Surfaced the actionable work-list for orchestrator: 2 real code fixes (teardown prefix, CAND-12 question navigation) + 1 cosmetic doc fix (baseline ID).

## Task Commits

| Task | Name | Commit | Type |
|------|------|--------|------|
| 1 | Developer prepares post-swap dev stack | *(no commit — human-action)* | checkpoint |
| 2 | Capture post-swap Playwright report | `9d36cdb35` | docs |
| 3 | Run diff script + author post-swap/diff.md | `e67be2bf0` | docs |

_Plan metadata commit (this SUMMARY + STATE + ROADMAP updates) ships as the final commit of the plan._

## Files Created/Modified

- **`.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json`** (172,047 bytes) — Raw Playwright JSON report for post-swap run. Consumed by diff script + future re-run comparisons.
- **`.planning/phases/59-e2e-fixture-migration/post-swap/diff.md`** (~7 KB) — Human-readable parity verdict: tally comparison, D-59-04 rule evaluation, regression grouping by root cause, fix-forward recommendations, Plan 06 blocker declaration.

## Parity Gate Result — Full Output

```
Baseline: 41p / 10f / 38c
Post:     20p / 13f / 56c
Contract: 41 pass-locked, 10 data-race pool, 25 cascade-baseline.
PARITY GATE: FAIL — 22 regression(s)
```

Per-test regression list is embedded verbatim in `post-swap/diff.md` under `## Diff Script Verdict`.

## Regression Triage — 22 surface → 3 root causes + 1 cascade amplifier

### Root cause 1: `data.teardown.ts` / `variant-data.teardown.ts` `runTeardown('test-')` deletes zero rows (2 direct fails)

- Error: `Error: runTeardown deleted zero rows — prefix mismatch?` on both teardown assertions.
- Likely cause: e2e template has `externalIdPrefix: ''` (per STATE.md Plan 04 note); synthetic rows (from any `count: N` generator emits) inherit that empty prefix — teardown's filter `external_id LIKE 'test-%'` excludes them. Only hand-authored `fixed[]` rows with literal `test-*` ids are swept.
- Fix path: set `externalIdPrefix: 'test-'` on the e2e template in `packages/dev-seed/src/templates/e2e.ts` (and reconcile any `fixed[]` entries that already carry the literal so they don't double-prefix).

### Root cause 2: `candidate-app :: candidate-questions > should persist comment text (CAND-12)` times out at `getByTestId('candidate-questions-comment')` (1 direct fail + 18 cascaded)

- Error: `Test timeout of 30000ms exceeded` inside `QuestionPage.fillComment` at `locator.fill(...)` awaiting the comment input locator.
- Likely cause: e2e template's opinion-question ordering / per-question settings differs from the pre-swap JSON fixtures. The other 7 `candidate-questions.spec.ts` tests pass (basic question rendering works) — only this one can't find the comment textarea at its navigation path.
- Cascade: `candidate-app` project fails ⇒ `candidate-app-mutation` (7) skip ⇒ `re-auth-setup` (1) skip ⇒ `candidate-app-password` (2) + `candidate-app-settings` (8, 7 of which were baseline-pass) skip. **1 → 18 amplification.**
- Fix path: diff `tests/tests/data/default-dataset.json` (pre-deletion) vs `packages/dev-seed/src/templates/e2e.ts` at the navigation target; adjust template question settings (or spec) so the target question has a comment field.

### Root cause 3 (cosmetic): Baseline summary ID drift for `voter-matching > should NOT show hidden candidate` (1 flagged, 0 real regression)

- Error (diff script): "new test appeared post-swap in failing/cascade state".
- Actual cause: Plan 59-02's snake_case migration (per STATE.md decision log) renamed the test title suffix from `(no termsOfUseAccepted)` → `(no terms_of_use_accepted)`. Both baseline and post-swap have the test as `test.skip` with no runtime — this is a test-ID match failure in the diff, not a spec regression.
- Fix path: update `baseline/summary.md` to reflect the snake_case rename. One-line doc change.

### Cascade amplifier: Playwright project-dependency model

The `candidate-app` failure (1 test) cascades through Playwright's `dependencies: [...]` wiring into 18 downstream tests being `skipped`. The cascade is **correct behavior** — Playwright is right to not run tests whose setup chain is broken. Fixing root cause 2 collapses all 18 cascades automatically.

## Decisions Made

- **Declared FAIL verdict and committed it, did NOT revert the swap.** Per D-59-12 (fix-forward, no rollback), the swap commit (`9c9e6363f`) stays landed; the phase pauses with a documented regression list rather than unwinding Plan 04's work. The `post-swap/diff.md` doubles as the fix-forward work list.
- **Did NOT create a follow-up Plan 59-06 or Phase 59.1 fixup plan.** Per the plan's Task 3 fix-forward instructions, "do NOT automatically create the follow-up plan; the orchestrator will surface this to the user." The orchestrator now owns the decision between (a) fixing inline as a Plan 59-05.1 continuation, (b) spawning a Phase 59.1 fixup plan, or (c) some other intervention.
- **Did NOT re-order or retry the Playwright run.** Single run is sufficient because the regressions are deterministic (assertion failures + timeouts on non-flake tests, not concurrency variance). `--workers=1` removes concurrency as a variance source — re-running would produce identical results.
- **Embedded the full 22-regression list verbatim in diff.md Stop-at-printed-output format.** Keeps the diff output traceable — anyone re-running the script gets the exact same output, character-for-character.

## Deviations from Plan

None — plan executed exactly as written. Task 2 and Task 3 instructions were followed; the FAIL verdict is the plan's explicit alternate branch under D-59-12.

The plan text (Task 3 item 4) requires a structured handoff reply on FAIL; this SUMMARY + the completion message below constitute that handoff.

## Issues Encountered

- **Parity FAIL itself is the issue** — 22 regressions documented in diff.md. See root-cause triage above.
- The initial health probe via `curl 127.0.0.1:5173` returned connect-refused; Vite listens on IPv6 localhost only. The baseline's `wait-for-healthy.sh` already uses `http://localhost:5173` (IPv6-friendly) so the capture itself was unaffected — just a surprise during startup diagnostics.

## User Setup Required

None. All infrastructure (Supabase + Vite) was already running from Task 1's human-action gate.

## Next Phase Readiness

**Plan 59-06 is BLOCKED.** Per D-59-04 + D-59-12, legacy JSON fixtures (`default-dataset.json`, `voter-dataset.json`, `candidate-addendum.json`) + overlay JSONs + `tests/tests/utils/mergeDatasets.ts` must NOT be deleted until the parity gate flips to PASS.

**Next actions required (orchestrator decision):**

1. **[HIGH priority — fixes 20 of 22 regressions]** Set `externalIdPrefix: 'test-'` on the e2e template in `packages/dev-seed/src/templates/e2e.ts`; reconcile any `fixed[]` entries with literal `test-*` ids to avoid double-prefix. Verify: `yarn dev:reset && cd tests && yarn tsx seed-test-data.ts && curl -s 'http://127.0.0.1:54321/rest/v1/candidates?select=external_id' -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" | jq 'map(.external_id | startswith("test-")) | all'` → must return `true`.

2. **[HIGH priority — fixes 1 direct + 18 cascaded regressions]** Adjust the e2e template's opinion-question content so the navigation path in `candidate-questions.spec.ts:209` (the CAND-12 persist-comment test) lands on a question that renders the `candidate-questions-comment` textarea. Root-cause investigation: diff old `default-dataset.json` (Plan 06 retains until parity green) vs the e2e template's `questions.fixed[]` at the spec's navigation target.

3. **[LOW priority — doc cosmetic]** Update `baseline/summary.md` to rename the voter-matching "should NOT show hidden candidate" test ID from `(no termsOfUseAccepted)` → `(no terms_of_use_accepted)` to match the post-swap snake_case naming. One-line sed replacement.

4. Re-run this plan's Task 2 + Task 3 after fixes land. Overwrite `post-swap/playwright-report.json` and `post-swap/diff.md` on subsequent iterations — no commit-history rewrite needed.

5. When `PARITY GATE: PASS` prints, proceed with Plan 59-06 (fixture deletion). Plan 59-07 (VERIFICATION + D-24 finalization) then follows.

**Blockers:**
- Plan 59-06 (fixture deletion) cannot start until #4 above prints PASS.
- Plan 59-07 (VERIFICATION.md + D-24 finalization) cannot start until Plan 59-06 completes.

## Self-Check: PASSED

- Files exist:
  - `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` — FOUND (172 KB)
  - `.planning/phases/59-e2e-fixture-migration/post-swap/diff.md` — FOUND (~7 KB, 5 required headings)
- Commits exist:
  - `9d36cdb35` (post-swap report) — FOUND in `git log`
  - `e67be2bf0` (diff.md FAIL verdict) — FOUND in `git log`
- Diff script verdict and diff.md verdict agree: both say `PARITY GATE: FAIL`.
- JSON test count matches baseline: both 89.
- Secret-leak grep on post-swap report: 0 matches (T-59-05-01 clear).
- No `playwright-stderr.log` left in the working tree (per plan Task 2 step 4).

---
*Phase: 59-e2e-fixture-migration*
*Completed: 2026-04-24*
*Verdict: PARITY GATE: FAIL — Plan 06 BLOCKED pending fix-forward*
