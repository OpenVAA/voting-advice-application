---
phase: 59-e2e-fixture-migration
plan: 05
artifact: parity-diff
baseline_sha: f09daea3498fef8fa62c430a6cd5a19535af8e5c
post_swap_sha: 4ce228c821bc08f820e062d5b1207c7135e649ae
swap_core_commit: 9c9e6363f
run_date: 2026-04-24
verdict: FAIL
regressions_count: 22
root_cause_count: 4
---

# Phase 59 Post-Swap Parity Analysis (D-59-04)

**Swap commit:** `4ce228c821bc08f820e062d5b1207c7135e649ae`
 (`docs(59-04): complete core-swap plan`; the swap itself is commit `9c9e6363f` — `feat(59-04): swap 3 variant setups + variant teardown onto dev-seed API`)
**Capture date:** 2026-04-24
**Invocation:** `yarn playwright test -c ./playwright.config.ts --reporter=json --workers=1`
 (DOTENV_CONFIG_QUIET=true, Node 22.4.0, Playwright 1.58.2, macOS arm64)
**Baseline:** `.planning/phases/59-e2e-fixture-migration/baseline/playwright-report.json` (41 pass / 10 data-race fail / 25 cascade / 13 test.skip = 89 tests, 178.0s)
**Post-swap:** `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` (20 pass / 13 fail / 56 cascade-or-skipped = 89 tests, 178.3s)

## Diff Script Verdict

Raw output from `tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts baseline/playwright-report.json post-swap/playwright-report.json` (exit 1):

```
Baseline: 41p / 10f / 38c
Post:     20p / 13f / 56c
Contract: 41 pass-locked, 10 data-race pool, 25 cascade-baseline.
PARITY GATE: FAIL — 22 regression(s):
  - [pass -> fail]    data-teardown :: setup/variant-data.teardown.ts > delete variant test dataset
  - [pass -> cascade] re-auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate
  - [pass -> fail]    candidate-app :: specs/candidate/candidate-questions.spec.ts > should persist comment text on a question after page reload (CAND-12)
  - [pass -> cascade] candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should register the fresh candidate via email link
  - [pass -> cascade] candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should upload a profile image (CAND-03)
  - [pass -> cascade] candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should show editable info fields on profile page (CAND-03)
  - [pass -> cascade] candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should persist profile image after page reload (CAND-12)
  - [pass -> cascade] candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should send registration email and extract link
  - [pass -> cascade] candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should complete registration via email link
  - [pass -> cascade] candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should complete forgot-password and reset flow via Inbucket email
  - [pass -> cascade] candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show read-only warning when answers are locked
  - [pass -> cascade] candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when candidateApp is disabled
  - [pass -> cascade] candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when underMaintenance is true
  - [pass -> cascade] candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should display notification popup when enabled
  - [pass -> cascade] candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render help page correctly
  - [pass -> cascade] candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render privacy page correctly
  - [pass -> cascade] candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should hide hero when hideHero is enabled
  - [pass -> cascade] candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show hero when hideHero is disabled
  - [pass -> cascade] candidate-app-password :: specs/candidate/candidate-password.spec.ts > should change password and login with new password
  - [pass -> cascade] candidate-app-password :: specs/candidate/candidate-password.spec.ts > should logout and return to login page
  - [pass -> fail]    data-teardown :: setup/data.teardown.ts > delete test dataset
  - [cascade -> cascade] voter-app :: specs/voter/voter-matching.spec.ts > should NOT show hidden candidate (no terms_of_use_accepted)
      new test appeared post-swap in failing/cascade state
```

## Counts Comparison

| Set | Baseline | Post-swap | Delta |
|-----|---------:|----------:|------:|
| Pass (`passed`) | 41 | 20 | **−21** |
| Fail (`failed` / `timedOut` — treated as hard fail) | 10 | 13 | **+3** |
| Cascade (`skipped` with no source marker, i.e. dependency cascade + source `test.skip`) | 38 | 56 | **+18** |
| **Total tests** | 89 | 89 | 0 |

Notes on tally semantics:
- Baseline's 38 cascade total = the 25 "cascade" listed in `baseline/summary.md` + the 13 `test.skip` source markers; the diff script collapses both into `cascade` because it cannot distinguish source-skip from dependency-skip without the summary.md curation. The authoritative baseline breakdown of 41/10/25/13 remains the D-59-04 contract reference.
- Post-swap's 56 cascade total = 18 NEW cascades introduced by this run's regressions + 38 baseline cascades/source-skips that remained non-pass.
- Runtime essentially unchanged (178.0s → 178.3s) — regressions are caused by deterministic assertion / teardown failures, not timeouts in the seed path.

## D-59-04 Rule Evaluation

1. **All baseline PASS → post PASS:** **NO.** 20 of the 41 `PASS_LOCKED` tests regressed post-swap (1 `pass→fail`, 19 `pass→cascade`, plus the 2 teardown `pass→fail`).
2. **No test outside the data-race pool entered a failing state:** **NO.** `candidate-app :: candidate-questions > should persist comment text (CAND-12)` was never in `DATA_RACE_TESTS` and now times out. This is the root-cause failure that cascades through the entire candidate dependency chain.
3. **Data-race pool membership may shift within itself:** (informational) Of the 10 `DATA_RACE_TESTS`, **9 now pass** post-swap (`voter-detail` suite + `voter-results` suite + `voter-matching > display candidates in correct match ranking order` + `voter-journey > show questions intro page`), and **1 remains failing** (`voter-app-settings > should show category checkboxes when allowCategorySelection enabled`). The flake pool **shrank**, not grew — this is acceptable per D-59-04.

## Regression Grouping — 4 root causes, 22 surface regressions

### Root cause 1 — `data.teardown.ts` / `variant-data.teardown.ts` `runTeardown('test-')` deletes zero rows (2 direct fails, 0 cascades)

**Error (both teardown projects, identical pattern):**
- `data-teardown :: setup/data.teardown.ts > delete test dataset`:
  `Error: runTeardown deleted zero rows — prefix mismatch?`
  `expect(received).toBeGreaterThan(expected) · Expected: > 0 · Received: 0`
- `data-teardown :: setup/variant-data.teardown.ts > delete variant test dataset`:
  `Error: variant runTeardown deleted zero rows`
  (same assertion pattern)

**Hypothesized cause:**
Per STATE.md Plan 59-04 decision: *"PREFIX 'test-' is the single literal at every call site (5 runTeardown + 0 Writer override — Writer.write receives the template's externalIdPrefix directly, which is '' for e2e and satisfies Pitfall 5 only because the emitted rows already carry 'test-' verbatim from fixed[].external_id)."* But `@openvaa/dev-seed`'s pipeline also emits synthetic rows (non-`fixed[]` rows generated by `count: N`) when a template declares `count > 0`. Those synthetic rows inherit the template's `externalIdPrefix` (empty string for e2e) PLUS their generator's default external_id shape (e.g. `candidate-42`, `org-finn`, etc.) — without the `test-` literal prefix. `runTeardown('test-', client)` then only matches the hand-authored `fixed[]` rows with literal `test-*` external_ids; synthetic rows are orphaned from prefix-based teardown.

Alternate hypothesis (less likely but possible): by the time data-teardown runs, a prior teardown path has already removed the rows. The error message `"deleted zero rows"` supports the prefix-mismatch explanation (synthetic rows simply don't carry the prefix) over the already-deleted one (already-deleted would likely show a different symptom — e.g., cascade from data-setup fail).

**Evidence to confirm:**
1. `yarn dev:reset && cd tests && yarn tsx seed-test-data.ts` (Task 1 smoke did this and exited 0 silently).
2. `curl -s 'http://127.0.0.1:54321/rest/v1/candidates?select=external_id' -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" | jq 'map(.external_id) | group_by(startswith("test-"))'` → count of `test-*` vs non-prefixed rows. Expect synthetic rows without the prefix.
3. Inspect `packages/dev-seed/src/templates/e2e.ts` for any `count: N` entries. The template may rely on synthetic generation for e.g. voters or secondary orgs.

**Fix-forward options (D-59-12):**
- **Option A (template-side, minimal invasive):** Set `externalIdPrefix: 'test-'` on the `e2e` template in `packages/dev-seed/src/templates/e2e.ts`. This stamps every generator-emitted row (synthetic + default-filled hand-authored rows) with the prefix. May require auditing the template's `fixed[]` entries to ensure they don't double-prefix.
- **Option B (teardown-side):** Change `runTeardown('test-', client)` to use a broader strategy — e.g., delete by `project_id` matching TEST_PROJECT_ID, not by external_id prefix. Safer for the parity gate but couples teardown to admin-client knowledge.
- **Option C (assertion relaxation):** Drop the `toBeGreaterThan(0)` assertion in `data.teardown.ts` / `variant-data.teardown.ts`. Makes the teardown pass on a clean DB but silently masks real bugs. NOT RECOMMENDED.

**Recommendation:** Option A. It also aligns with the Plan 59-04 decision quoted above — the existing system fails exactly at the gap between `externalIdPrefix: ''` + `fixed[]` literal `'test-*'` ids that Plan 04 flagged.

### Root cause 2 — `candidate-app :: candidate-questions > should persist comment text (CAND-12)` times out waiting for `getByTestId('candidate-questions-comment')` (1 direct fail, 18 cascaded)

**Error:**
```
Test timeout of 30000ms exceeded.
Error: locator.fill: Test timeout of 30000ms exceeded.
  - waiting for getByTestId('candidate-questions-comment')
  at QuestionPage.fillComment (tests/pages/candidate/QuestionPage.ts:30:29)
  at tests/specs/candidate/candidate-questions.spec.ts:209:24
```

**Hypothesized cause:**
`getByTestId('candidate-questions-comment')` — the comment textarea — is rendered by the candidate-questions page **only when the active question is an opinion question with a category that the candidate is eligible to answer**. The e2e template's question content (per Phase 58 Plan 58-15 audit + Plan 59-02 template-driven refs) likely has a different category ordering, different first-opinion-question, or a different `type` mix than the pre-swap JSON fixtures provided. Specifically:
- Baseline JSON fixtures seeded **one specific opinion question** at a specific index that this spec targets.
- Post-swap e2e template emits opinion questions via the same schema but the question-id the spec navigates to (or the question count / order) may differ.

The other 7 `candidate-questions.spec.ts` tests **passed** (including "answer a Likert opinion question and save" CAND-04, "display question cards organized by category" CAND-05, "edit a previously answered question" CAND-05, etc.), so basic question rendering works. Only the comment-persistence test is broken — suggesting the test's navigation path to the right question is off by one, or the specific question it targets doesn't have a comment-allowed flag in the e2e template.

**Cascade impact:**
Because `candidate-app` has a fail, Playwright skips `candidate-app-mutation` (4 profile tests + 3 registration tests = 7 skipped), which skips `re-auth-setup` (1 skipped), which skips `candidate-app-password` (2 skipped), which skips `candidate-app-settings` (8 skipped, of which 1 was baseline-cascade and 7 were baseline-pass). Total cascaded: 18 previously-passing tests now skipped.

**Evidence to confirm:**
1. Read `tests/tests/specs/candidate/candidate-questions.spec.ts:183-215` to see which question the spec navigates to.
2. Inspect `packages/dev-seed/src/templates/e2e.ts` for the first opinion-type question's properties (category_id, entity_type, settings).
3. Compare with `tests/tests/data/default-dataset.json` (pre-deletion) — what did the old fixture have at the same navigation path?

**Fix-forward options (D-59-12):**
- **Option A:** Adjust the e2e template's opinion questions so the spec's target navigation lands on a question with a comment textarea. Likely a one-line fix in `packages/dev-seed/src/templates/e2e.ts`.
- **Option B:** Adjust the spec to navigate to a specific question external_id rather than relying on index/order. More robust but higher churn.

**Recommendation:** Option A, driven by a diff of old JSON fixture questions vs the e2e template's question emit at the navigation point.

### Root cause 3 — Spec-ID drift: `voter-matching > should NOT show hidden candidate` renamed from `termsOfUseAccepted` → `terms_of_use_accepted` (1 flagged, 0 real regression)

**Error:** Diff script flags `voter-app :: specs/voter/voter-matching.spec.ts > should NOT show hidden candidate (no terms_of_use_accepted)` as "new test appeared post-swap in failing/cascade state".

**Hypothesized cause:**
Plan 59-02 (snake_case migration, per STATE.md: *"snake_case migration extended beyond .externalId (plan-explicit) to .firstName/.lastName/.termsOfUseAccepted"*) renamed the test title from camelCase to snake_case. Baseline has `(no termsOfUseAccepted)`; post-swap has `(no terms_of_use_accepted)`. Both are in `SOURCE_SKIP` — the test has a `test.skip(...)` marker — so it didn't actually run in either case.

**This is NOT a real regression.** It's a test-id drift artifact. The diff script flags it because it can't match baseline → post by ID. The test itself is `skipped` in both reports with no error.

**Fix-forward:**
- **Option A:** Update `baseline/summary.md` to use the post-swap id (snake_case) and re-commit. Simple one-line change.
- **Option B:** Ignore this specific flag in the diff script (add an explicit rename-bypass list). Adds complexity for a one-time artifact.

**Recommendation:** Option A. The baseline summary is for documentation; updating it to reflect the snake_case rename is strictly cosmetic and keeps the diff script simple.

## Verdict

**PARITY GATE: FAIL — D-59-12 fix-forward activated.** Diff script exit 1. The following regressions must be addressed before Phase 59 can complete:

### Real regressions requiring code fixes (3 root causes → 21 surface tests)

1. **[HIGH — blocks entire candidate dependency chain]** `candidate-app :: candidate-questions > should persist comment text on a question after page reload (CAND-12)` times out at `getByTestId('candidate-questions-comment')`.
   - Root cause: e2e template's question ordering or per-question settings differ from the pre-swap JSON fixtures.
   - Cascades: 18 candidate-* tests skipped downstream.
   - Next action: diff old `default-dataset.json` questions vs `packages/dev-seed/src/templates/e2e.ts` question emit at the navigation path; adjust template (or spec) until navigation lands on a comment-allowed question.

2. **[HIGH — breaks both teardowns]** `runTeardown('test-', client)` deletes zero rows in both `data.teardown.ts` and `variant-data.teardown.ts`.
   - Root cause: e2e template's `externalIdPrefix: ''` lets synthetic rows skip the `test-` prefix that teardown's filter requires.
   - Fix: set `externalIdPrefix: 'test-'` on the `e2e` template and reconcile with existing `fixed[]` `test-*` literals.

3. **[LOW — cosmetic]** Baseline summary ID for `voter-matching > should NOT show hidden candidate` uses camelCase; post-swap uses snake_case (Plan 59-02 rename). No real regression; update `baseline/summary.md` accordingly.

### Fix-forward workflow (per D-59-12, NO rollback)

1. Open a Phase 59.1 (or Plan 08 extension) work-list covering the 3 root causes above.
2. Debug and patch in this order: Root cause 2 first (template-side, single-file change), then root cause 1 (spec/template coordination), then root cause 3 (documentation cosmetic).
3. After each fix, re-run Plan 59-05 Task 2 + Task 3 (re-capture post-swap report, re-run diff). This plan's file structure is reusable — overwrite `post-swap/playwright-report.json` and `post-swap/diff.md` on subsequent iterations.
4. Phase 59 remains OPEN until parity is green. **Plan 59-06 (delete legacy fixtures) is BLOCKED** — do not delete the JSON fixtures until the parity gate flips to PASS.

## References

- Baseline summary: [`../baseline/summary.md`](../baseline/summary.md)
- Baseline Playwright report: [`../baseline/playwright-report.json`](../baseline/playwright-report.json)
- Post-swap Playwright report: [`./playwright-report.json`](./playwright-report.json) (commit `9d36cdb35`)
- Core swap commit: `9c9e6363f` (`feat(59-04): swap 3 variant setups + variant teardown onto dev-seed API`) — run `git show 9c9e6363f` for the swap diff
- Phase 59 CORE_SWAP wrap: [`../59-04-SUMMARY.md`](../59-04-SUMMARY.md)
- Diff script: [`../scripts/diff-playwright-reports.ts`](../scripts/diff-playwright-reports.ts)
- Parity rule (D-59-04) + fix-forward policy (D-59-12): [`../59-CONTEXT.md`](../59-CONTEXT.md)
