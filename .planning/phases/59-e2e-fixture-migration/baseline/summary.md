---
phase: 59-e2e-fixture-migration
plan: 01
artifact: baseline-summary
baseline_sha: f09daea3498fef8fa62c430a6cd5a19535af8e5c
captured_date: 2026-04-23
runtime_seconds: 178
runtime_ms: 178021
total_tests: 89
counts:
  passed: 41
  data_race_fail: 10
  cascade: 25
  test_skip: 13
playwright_version: 1.58.2
node_version: 22.4.0
os: Darwin 25.3.0 (mac-arm64)
invocation: "yarn playwright test -c ./tests/playwright.config.ts ./tests --reporter=json --workers=1"
---

# Phase 59 Baseline — E2E Snapshot from pre-swap main

**Captured:** 2026-04-23
**Baseline commit:** `f09daea3498fef8fa62c430a6cd5a19535af8e5c`
  (`docs(59): plan e2e fixture migration (7 plans across 5 waves)`)
**Invocation:** `yarn playwright test -c ./tests/playwright.config.ts ./tests --reporter=json --workers=1`
  (Note: stdout pollution from `dotenv@17.3.1`'s "injecting env" banner suppressed via
  `DOTENV_CONFIG_QUIET=true` environment variable so the JSON report parses cleanly.
  CONTEXT.md §"Claude's Discretion" permits adjusting the exact invocation; the only
  drift from D-59-03 is dropping the `list` reporter alongside `json` — Playwright's
  `--reporter=json,list` would double-write stdout, corrupting the JSON. The `list`
  reporter view is not required by the parity contract; only the JSON report is.)
**Total runtime:** 2m 58s (178,021 ms, per `.stats.duration`)
**Totals:** 41 passed / 10 data-race fail / 25 cascade / 13 test.skip = **89 tests**

---

## Deltas from CONTEXT.md 15/19/55 expectation — Significant drift, NOT a blocker

CONTEXT.md §"Baseline Reference" tallies the v2.4 baseline as **15 pass / 19 data-race /
55 cascade = 89 tests**. The actual baseline at commit
`f09daea3498fef8fa62c430a6cd5a19535af8e5c` (today) is **41/10/25/13 (with 13 explicit
`test.skip` markers not counted separately in the v2.4 tally) = 89 tests**.

**Interpretation:** the total test count (89) matches, so no specs were added or removed
between v2.4 and today. The distribution across pass/fail/cascade has improved
substantially:

- **+26 passing** (was 15, now 41) — most gains are in `candidate-*` projects plus setup/teardown.
- **-9 data-race failures** (was 19, now 10) — remaining 10 are all `voter-app` /
  `voter-app-settings` tests that hit `TimeoutError: locator.waitFor` on
  `question-choice` / `voter-questions-start` / `voter-questions-category-list`
  selectors. Consistent with the Svelte 5 pushState reactivity bug tracked for the
  "Svelte 5 Migration Cleanup" milestone (D-59-13).
- **-30 cascade** (was 55, now 25) — most cascades now resolve because the upstream
  auth/candidate flows pass. The remaining cascades are all variant-* tests +
  `voter-app-popups` (which depends on `voter-app-settings`, which still has one
  data-race fail).

**Implication for D-59-04 parity rule:** the three lists below are the **actual
contract** for Plan 03 (swap) and Plan 05 (post-swap parity diff). The specific test
names — not the counts — are load-bearing. Plan 05's diff script must filter against
the "Data-race" list below, not the v2.4 19-name list from CONTEXT.md. The parity
gate becomes:

- **Pass set (41 tests)** — all must still pass post-swap. Any regression is a BLOCKER.
- **Data-race set (10 tests)** — may flake differently post-swap; pool MUST NOT grow.
- **Cascade set (25 tests)** — must remain non-passing OR become passing (both acceptable).
  A test moving from cascade INTO data-race, or into any new failure mode, is a BLOCKER.
- **Test.skip set (13 tests)** — explicit `test.skip()` markers in source code; these
  are not failures but are listed for completeness so Plan 05's counts reconcile.

---

## Passing Tests — Pass set (41 tests — must remain passing post-swap)

Includes Playwright setup/teardown projects plus per-project spec pass results.

- auth-setup :: setup/auth.setup.ts > authenticate as candidate
- auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate
- candidate-app :: specs/candidate/candidate-auth.spec.ts > should login with valid credentials
- candidate-app :: specs/candidate/candidate-auth.spec.ts > should show error on invalid credentials
- candidate-app :: specs/candidate/candidate-questions.spec.ts > should answer a Likert opinion question and save (CAND-04)
- candidate-app :: specs/candidate/candidate-questions.spec.ts > should display entered profile and opinion data on preview page (CAND-06)
- candidate-app :: specs/candidate/candidate-questions.spec.ts > should display question cards organized by category (CAND-05)
- candidate-app :: specs/candidate/candidate-questions.spec.ts > should edit a previously answered question (CAND-05)
- candidate-app :: specs/candidate/candidate-questions.spec.ts > should navigate between categories (CAND-05)
- candidate-app :: specs/candidate/candidate-questions.spec.ts > should persist comment text on a question after page reload (CAND-12)
- candidate-app :: specs/candidate/candidate-questions.spec.ts > should persist question answers after page reload (CAND-12)
- candidate-app :: specs/candidate/candidate-questions.spec.ts > should show specific candidate data (name or answered question) in preview (CAND-06)
- candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should persist profile image after page reload (CAND-12)
- candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should register the fresh candidate via email link
- candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should show editable info fields on profile page (CAND-03)
- candidate-app-mutation :: specs/candidate/candidate-profile.spec.ts > should upload a profile image (CAND-03)
- candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should complete forgot-password and reset flow via Inbucket email
- candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should complete registration via email link
- candidate-app-mutation :: specs/candidate/candidate-registration.spec.ts > should send registration email and extract link
- candidate-app-password :: specs/candidate/candidate-password.spec.ts > should change password and login with new password
- candidate-app-password :: specs/candidate/candidate-password.spec.ts > should logout and return to login page
- candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should display notification popup when enabled
- candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should hide hero when hideHero is enabled
- candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render help page correctly
- candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should render privacy page correctly
- candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show hero when hideHero is disabled
- candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when candidateApp is disabled
- candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show maintenance page when underMaintenance is true
- candidate-app-settings :: specs/candidate/candidate-settings.spec.ts > should show read-only warning when answers are locked
- data-setup :: setup/data.setup.ts > import test dataset
- data-teardown :: setup/data.teardown.ts > delete test dataset
- data-teardown :: setup/variant-data.teardown.ts > delete variant test dataset
- data-teardown-variants :: setup/variant-data.teardown.ts > delete variant test dataset
- re-auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate
- voter-app :: specs/voter/voter-journey.spec.ts > should auto-imply election and constituency
- voter-app :: specs/voter/voter-journey.spec.ts > should load home page and display start button
- voter-app :: specs/voter/voter-static-pages.spec.ts > about page renders correctly
- voter-app :: specs/voter/voter-static-pages.spec.ts > info page renders correctly
- voter-app :: specs/voter/voter-static-pages.spec.ts > privacy page renders correctly
- voter-app :: specs/voter/voter-static-pages.spec.ts > should redirect to home when showAllNominations is false
- voter-app :: specs/voter/voter-static-pages.spec.ts > should render nominations page with entries

## Data-race Failing Tests — Data-race fail set (10 tests — pool that may shift post-swap; MUST NOT grow)

All 10 failures are `TimeoutError: locator.waitFor` or `expect(locator).toBeVisible`
failures waiting for `question-choice` / `voter-questions-start` /
`voter-questions-category-list` selectors — the exact pattern described in PROJECT.md
§"Known issues" as the Svelte 5 pushState reactivity bug. None involve setup projects
or infrastructure errors; all are voter-app assertion timeouts against rendered UI.
Deferred to "Svelte 5 Migration Cleanup" milestone per D-59-13.

- voter-app :: specs/voter/voter-detail.spec.ts > should display candidate answers correctly in info and opinions tabs
- voter-app :: specs/voter/voter-detail.spec.ts > should display candidate info and opinions tabs
- voter-app :: specs/voter/voter-detail.spec.ts > should open candidate detail drawer when clicking a result card
- voter-app :: specs/voter/voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs
- voter-app :: specs/voter/voter-journey.spec.ts > should show questions intro page with start button
- voter-app :: specs/voter/voter-matching.spec.ts > should display candidates in correct match ranking order
- voter-app :: specs/voter/voter-results.spec.ts > should display candidates section with result cards
- voter-app :: specs/voter/voter-results.spec.ts > should display entity type tabs for switching between candidates and organizations
- voter-app :: specs/voter/voter-results.spec.ts > should switch to organizations/parties section and back
- voter-app-settings :: specs/voter/voter-settings.spec.ts > should show category checkboxes when allowCategorySelection enabled

## Cascade / did-not-run Failing Tests — Cascade fail set (25 tests — upstream-dependency failures, did-not-run)

Per stored memory `feedback_e2e_did_not_run.md`, "did not run" tests are counted as
failures in all tallies. These tests were never executed because their dependency
chain (`data-setup-*` variant setups, `voter-app-settings`, upstream voter specs)
produced a failure that blocked the downstream project per Playwright's project
dependency model (see `tests/playwright.config.ts` `dependencies:` fields).

Cascade breakdown by root cause:

- **variant-* projects (20 tests):** blocked because `voter-app-popups` depends on
  `voter-app-settings`, and the variant chain depends on `voter-app-popups` +
  `candidate-app-password`. When `voter-app-settings` has a data-race fail, Playwright
  skips all downstream variant-data-setup-* projects, cascading to their spec projects.
- **voter-app-popups (4 tests):** depends on `voter-app-settings` (which has 1
  data-race fail -> project considered failed -> dependents skipped).
- **data-setup-* variant setup projects (3 tests):** upstream dependency chain failure
  prevents their setup execution.

Cascade test list:

- data-setup-constituency :: setup/variant-constituency.setup.ts > import constituency dataset
- data-setup-multi-election :: setup/variant-multi-election.setup.ts > import multi-election dataset
- data-setup-startfromcg :: setup/variant-startfromcg.setup.ts > import startfromcg dataset
- variant-constituency :: specs/variants/constituency.spec.ts > should allow constituency selection and proceed to questions
- variant-constituency :: specs/variants/constituency.spec.ts > should answer questions and reach results
- variant-constituency :: specs/variants/constituency.spec.ts > should display constituency-filtered results
- variant-constituency :: specs/variants/constituency.spec.ts > should show constituency selection page after election selection
- variant-constituency :: specs/variants/constituency.spec.ts > should show election accordion in multi-election results
- variant-constituency :: specs/variants/constituency.spec.ts > should show missing nominations warning for partial-coverage constituency
- variant-multi-election :: specs/variants/multi-election.spec.ts > should bypass election selection when disallowSelection is true
- variant-multi-election :: specs/variants/multi-election.spec.ts > should display election-specific questions
- variant-multi-election :: specs/variants/multi-election.spec.ts > should display questions and reach results
- variant-multi-election :: specs/variants/multi-election.spec.ts > should show election accordion and results after selecting election
- variant-multi-election :: specs/variants/multi-election.spec.ts > should show election selection page with 2 elections
- variant-results-sections :: specs/variants/results-sections.spec.ts > should show both sections with tabs when sections is ["candidate", "organization"]
- variant-results-sections :: specs/variants/results-sections.spec.ts > should show only candidates when sections is ["candidate"]
- variant-results-sections :: specs/variants/results-sections.spec.ts > should show only organizations when sections is ["organization"]
- variant-startfromcg :: specs/variants/startfromcg.spec.ts > should complete journey through questions to results
- variant-startfromcg :: specs/variants/startfromcg.spec.ts > should handle orphan municipality without error
- variant-startfromcg :: specs/variants/startfromcg.spec.ts > should show constituency selection first (reversed flow)
- variant-startfromcg :: specs/variants/startfromcg.spec.ts > should show election selection after constituency selection
- voter-app-popups :: specs/voter/voter-popups.spec.ts > should not show any popup when disabled
- voter-app-popups :: specs/voter/voter-popups.spec.ts > should remember dismissal after page reload
- voter-app-popups :: specs/voter/voter-popups.spec.ts > should show feedback popup after delay on results page
- voter-app-popups :: specs/voter/voter-popups.spec.ts > should show survey popup after delay on results page

## Test.skip set (13 tests — explicit source-code skip markers; informational only)

These tests have `test.skip(...)` or `test.fixme(...)` calls in source code. Playwright
records them as `status: "skipped"` with `results[0].status: "skipped"` (not
`"no-result"` like cascades). They are neither passing nor failing; they are not
part of the parity contract. Listed here only so the total (41+10+25+13 = 89)
reconciles with `.stats` in `playwright-report.json`.

- voter-app :: specs/voter/voter-journey.spec.ts > should answer all Likert questions with navigation
- voter-app :: specs/voter/voter-matching.spec.ts > should NOT show hidden candidate (no terms_of_use_accepted)
- voter-app :: specs/voter/voter-matching.spec.ts > should confirm category intros were not shown during journey (VOTE-05 partial negative coverage)
- voter-app :: specs/voter/voter-matching.spec.ts > should confirm results accessible after all questions answered (VOTE-07 partial above-threshold coverage)
- voter-app :: specs/voter/voter-matching.spec.ts > should show partial-answer candidate in results with valid score
- voter-app :: specs/voter/voter-matching.spec.ts > should show perfect match candidate as top result
- voter-app :: specs/voter/voter-matching.spec.ts > should show worst match candidate as last result
- voter-app-settings :: specs/voter/voter-settings.spec.ts > should enforce minimum answers before results available
- voter-app-settings :: specs/voter/voter-settings.spec.ts > should filter questions to selected categories
- voter-app-settings :: specs/voter/voter-settings.spec.ts > should hide results link when showResultsLink is false
- voter-app-settings :: specs/voter/voter-settings.spec.ts > should show category intro page before each category
- voter-app-settings :: specs/voter/voter-settings.spec.ts > should show question intro page when questionsIntro.show enabled
- voter-app-settings :: specs/voter/voter-settings.spec.ts > should skip category when skip button clicked

## Baseline metadata

| Field | Value |
|-------|-------|
| Commit SHA | `f09daea3498fef8fa62c430a6cd5a19535af8e5c` |
| Commit subject | `docs(59): plan e2e fixture migration (7 plans across 5 waves)` |
| Branch | `feat-gsd-roadmap` |
| Capture date (UTC) | 2026-04-23 |
| Capture start | 2026-04-23T18:46:05.270Z |
| Total runtime | 178,021 ms (2m 58s) |
| Playwright version | 1.58.2 |
| Node version | 22.4.0 |
| OS | Darwin 25.3.0 (mac-arm64) |
| Total tests | 89 |
| Passed | 41 |
| Data-race fail | 10 |
| Cascade (did-not-run) | 25 |
| Test.skip (source markers) | 13 |
| JSON report size | ~0.17 MB (181,209 bytes) |
| Workers | 1 (`--workers=1` per D-59-03, removes concurrency as variance source) |
| Reporter | `json` only (dropped `list` from D-59-03 to avoid stdout double-write; stdout -> JSON file) |
| dotenv banner | Suppressed via `DOTENV_CONFIG_QUIET=true` so JSON report parses cleanly |

## Secret-leak sanity check (T-59-01-01)

Pre-commit grep against `playwright-report.json` for patterns
`SERVICE_ROLE_KEY|Bearer ey...|"password":|SUPABASE_SERVICE_ROLE` returns **zero
matches**. Playwright's JSON reporter does not emit env vars; error messages in this
report are all frontend UI assertion failures (no auth-token echoes, no env dumps).

## References

- Raw Playwright JSON: [`./playwright-report.json`](./playwright-report.json) (~0.17 MB)
- Health-check helper: [`./wait-for-healthy.sh`](./wait-for-healthy.sh)
- Phase context: [`../59-CONTEXT.md`](../59-CONTEXT.md) (D-59-01/02/03/04/13)
- Phase patterns: [`../59-PATTERNS.md`](../59-PATTERNS.md) section "Baseline capture"
- Plan: [`../59-01-PLAN.md`](../59-01-PLAN.md)
- Plan 05 (post-swap parity) will consume this file's pass/data-race/cascade lists
  verbatim as the contract for the parity gate.
