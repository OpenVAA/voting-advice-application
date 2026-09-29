---
phase: 165-review-stack-comment-remediation
plan: 36
subsystem: release
tags: [ledger, push, pull-request, ci-evidence, secret-scan, js-yaml, paraglide, e2e-run, playwright, state-driven-waits]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-35's green final gate on e51a48b28, the fix commits with Review-Comment trailers, tip-proofs.sh and ledger-check.sh
provides:
  - The final 165-LEDGER.md (78 rows, trailer-derived commit cells, PR and CI record in the header)
  - PR #889 (13/13) open on ship/v2.15-12-planning
  - The D-13 CI fixes (secret-scan, dependency-audit, dev-seed-integration green; both E2E jobs on tests/scripts/e2e-run.sh)
  - The D-14 state-driven E2E helpers (resolveVoterStage / walkVoterStages), with e2e-visual green in CI
affects: [phase-165-verification, v2.15-stack-merge, ci-e2e]

actuals:
  tokens: 80861
  tasks: 3
  commits: 36
plan_head_before: 4d44386b44e7b6cbb2f4828e2b2ed419cacf2945
plan_head_after: see the SUMMARY commit (the HEAD this file is committed in)

tech-stack:
  added: []
  patterns:
    - "CI evidence for a branch whose tip commit touches only markdown: commit-tree the PR head's tree onto origin/main and push it to a new ci-evidence/** branch (tree-identical, no force)"
    - "E2E stage resolution: a voter page counts only when the URL is on its route AND its anchor is visible, retried with expect.toPass until one matches; the walk acts on whatever renders and repeats an action that did not take effect"
    - "Commit an input's value (blur) and wait for the resulting state before clicking a button the blur can move"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/165-36-SUMMARY.md
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-allow/165-36.tsv
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-36.tsv
  modified:
    - .github/workflows/main.yaml
    - .github/trufflehog-exclude-paths.txt
    - tests/scripts/visual-container.sh
    - yarn.lock
    - tests/tests/utils/voterNavigation.ts
    - tests/tests/utils/missingNominations.ts
    - tests/tests/fixtures/voter/voter-journey.fixture.ts
    - tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts
    - tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts
    - tests/tests/specs/perm/perm-org-matching.spec.ts
    - tests/tests/specs/candidate/candidate-journey.spec.ts
    - tests/tests/specs/voter/voter-journey.spec.ts
    - tests/tests/fixtures/voter/resultsPage.fixture.ts
    - tests/scripts/determinism-batch.sh
    - tests/tests/helpers/timeouts.ts
    - tests/tests/specs/voter/cold-entry-dataroot.spec.ts
    - packages/dev-seed/tests/rpcNullabilityGate.test.ts
    - apps/frontend/src/lib/contexts/voter/matchState.svelte.ts
    - apps/frontend/src/lib/contexts/voter/matchState.svelte.test.ts
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md
    - .planning/phases/165-review-stack-comment-remediation/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "Commit cells list every trailer-cited commit in commit order; related commits without a trailer follow 'also'"
  - "CI evidence uses the PR head's full tree (including .planning/), so each run tests exactly what PR #889 holds"
  - "D-13: js-yaml is refreshed in the lockfile only; the dev-seed Paraglide step uses the Vite plugin's options; both E2E jobs run e2e-run.sh"
  - "D-14: the voter walks resolve the rendered page by route and anchor and never take a page as skipped because it rendered late; timeouts become the test's own budget"
  - "The radio answer path relies on the app's auto-advance and no longer clicks Next after 3 s, which could skip a question"
  - "perm-org-matching asserts the scores of a walk that answers every question (25/25/75); the old values came from a walk that skipped the first question"
  - "D-15: voter-journey's budget is 240 s (maintainer); organizationMatching 'none' leaves organizations, factions and alliances unmatched (maintainer: the product was wrong)"
  - "D-16: TIMEOUTS.testMax is 180 s when GITHUB_ACTIONS=true (it reaches Playwright through e2e-run.sh, which unsets CI), 90 s locally; cold-entry waits run to the test budget; supabase/setup-cli pinned to 2.83.0"

patterns-established:
  - "Read the trufflehog chunk count before trusting a clean scan"
  - "Read a CI failure's step durations before diagnosing a race: a uniform slowdown across completed steps is a budget, not a race"

requirements-completed: [165-SC1, 165-SC5]

coverage:
  - id: D1
    description: "Every one of the 78 comments has a disposition, evidence, a trailer-derived commit or ledger reference and a one-line draft reply; appendix of 12 review bodies"
    requirement: "165-SC1"
    verification:
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/ledger-check.sh --final (50/25/1/1/1, appendix 12, VERDICT: PASSED)"
        status: pass
      - kind: other
        ref: "bash .planning/phases/165-review-stack-comment-remediation/scripts/tip-proofs.sh (27 PASS)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Branch pushed without force, remote equals local, PR #889 open with base ship/v2.15-12-planning, title 13/13, body linking the ledger and ending with the attribution lines"
    requirement: "165-SC5"
    verification:
      - kind: other
        ref: "test \"$(git rev-parse origin/ship/v2.15-13-review-fixes)\" = \"$(git rev-parse HEAD)\"; gh pr view 889 --json baseRefName,title"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-13 and D-14 CI fixes: secret-scan, dependency-audit, dev-seed-integration and e2e-visual green in CI; the voter walks and candidate journey no longer fail in CI"
    verification:
      - kind: other
        ref: "https://github.com/OpenVAA/voting-advice-application/actions/runs/36457265423 (10 of 11 jobs success)"
        status: pass
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-36-d14d --no-db-reset (165/0/0/0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-15 organizationMatching 'none' product fix: parties unmatched, UI shows no score"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/voter/matchState.svelte.test.ts (2/2; red on the old code)"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/perm/perm-org-matching.spec.ts in tests/e2e-runs/165-36-d15 (165/0/0/0) and CI run 36463977144"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every CI check green for the PR's tree"
    verification:
      - kind: e2e
        ref: "https://github.com/OpenVAA/voting-advice-application/actions/runs/36476589852 (all 11 jobs success, first attempt; e2e-tests 165/0/0/0, e2e-visual 7/0/0/0)"
        status: pass
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-36-d16 --no-db-reset (165/0/0/0)"
        status: pass
    human_judgment: false

duration: 421min
completed: 2026-09-28
status: complete
---

# Phase 165 Plan 36: Final Ledger, Push, PR 13/13 and CI Summary

**The ledger is final (78 rows), PR #889 (13/13) is open on #887, and CI is green for its tree: [run 36476589852](https://github.com/OpenVAA/voting-advice-application/actions/runs/36476589852) passed all 11 jobs on the first attempt, including the full E2E suite (165/0/0/0) and the visual baselines. Getting there took six CI runs and four maintainer rulings (D-13 to D-16). They fixed inherited CI causes, made the E2E walks state-driven, fixed a product defect (`organizationMatching: 'none'` scored parties) and set CI-specific time budgets.**

## Performance

- **Duration:** about 421 min (from 2026-09-28T13:22:10Z), across the D-13 to D-16 continuations and six CI runs
- **Tasks:** 3 of 3, all acceptance criteria met.

## Accomplishments

- **Task 1: ledger.**
  - Every `fix` row's Commit cell is derived from the `Review-Comment:` trailers.
  - Three column-shifting pipes are escaped.
  - `ledger-check.sh --final` passes (50 / 25 / 1 / 1 / 1), and `tip-proofs.sh` reports 27 PASS.
- **Task 2: publication.** The scope check, the pattern secret sweep and trufflehog were clean before every push. PR [#889](https://github.com/OpenVAA/voting-advice-application/pull/889) has base `ship/v2.15-12-planning`, and every push was a normal push.
- **D-13 (CI red jobs).**
  - `js-yaml` refreshed in the lockfile.
  - v2.10 trace zips deleted, plus one exact scanner exclusion.
  - Paraglide compiled for dev-seed.
  - Both E2E jobs on `e2e-run.sh`.
  - Commits: `66974e29f`, `ff98fd22a`, `8432291b3`, `dbfb12af2`.
- **D-14 (state-driven helpers).**
  - `resolveVoterStage` / `walkVoterStages` for every voter walk (`b3aa22f0f`).
  - The first-question skip defect fixed (`dd5a51f78`).
  - A layout-shift lost click in `candidate-journey` fixed (`da626bfb9`).
- **D-15 (budget and product rulings).**
  - `JOURNEY_TEST_MAX` raised to 240 s, with the measured cost in its comment (`a3357767e`).
  - `organizationMatching: 'none'` now leaves organizations, factions and alliances unmatched (`841231e77`):
    - The match state returns them as plain nominations, the shape the UI already renders without a score.
    - The unit test fails on the old code.
    - `perm-org-matching` asserts the party card has no score of its own.
    - Recorded as a maintainer-directed fix found during CI remediation, not a review comment.
  - Two files joined the changed set and were brought to the hygiene rules:
    - the journey spec, whose test titles lost their requirement ids;
    - `determinism-batch.sh`, which now matches the renamed step and expects 165 executed tests instead of the stale 135.
- **D-16 (CI budgets and pin).**
  - `TIMEOUTS.testMax`, the Playwright default test timeout, is 180 s when `GITHUB_ACTIONS=true` and 90 s locally (`3ad2b1620`).
    - The signal is `GITHUB_ACTIONS` because it reaches Playwright even through `e2e-run.sh`, which unsets `CI`.
    - Verified: the resolved project timeout is 180000 with it and 90000 without.
  - `cold-entry-dataroot`'s first data-dependent waits run to the test budget, not a fixed 10 s.
  - `supabase/setup-cli` is pinned to 2.83.0 in all six jobs (`5aeb099b0`).
  - Each change's comment carries the measured CI cost.
- **Local gates on the final code tree (`311494c7f`).**
  - E2E via the wrapper: 165/0/0/0 (`tests/e2e-runs/165-36-d16`).
  - build, lint, format and unit: 0.
  - Hygiene: CLEAN over 248 files.
  - No schema changed, so 165-35's database gates stand.

## CI runs

| Run | Tree of | Jobs green | Outcome |
|---|---|---|---|
| [36429830379](https://github.com/OpenVAA/voting-advice-application/actions/runs/36429830379) | `1570012ec` | 6/11 | Inherited causes. Led to D-13 |
| [36442680412](https://github.com/OpenVAA/voting-advice-application/actions/runs/36442680412) | `a60182821` | 9/11 | Fixed-window walk branches under CI latency. Led to D-14 |
| [36454241649](https://github.com/OpenVAA/voting-advice-application/actions/runs/36454241649) | `ed2b32e99` | 10/11 | `e2e-visual` green; one lost click, fixed |
| [36457265423](https://github.com/OpenVAA/voting-advice-application/actions/runs/36457265423) | `07ba296e5` | 10/11 | `voter-journey` over 120 s at ~4.3× CI slowdown. Led to D-15 |
| [36463977144](https://github.com/OpenVAA/voting-advice-application/actions/runs/36463977144) | `87974e4bc` | 10/11 | Attempt 1: two jobs lost to external rate limits, no test ran, re-run once. Attempt 2: `e2e-tests` 157 passed, 2 failed, 6 did not run. `voter-journey` passed (183.5 s). Remaining: `voter-alliance` 95 s against the 90 s default test budget (21 s locally; seven other tests at 78-89 s), and a cold `/en/results` load over its 10 s wait |
| [36476589852](https://github.com/OpenVAA/voting-advice-application/actions/runs/36476589852) | `311494c7f` | **11/11** | **GREEN on the first attempt**, after D-16. `e2e-tests` 165 passed, 0 failed, 0 flaky, 0 did not run; `e2e-visual` 7 passed. Slowest in CI: `voter-journey` 169 s (budget 240 s), `voter-alliance` 89 s (budget 180 s) |
| [36535849705](https://github.com/OpenVAA/voting-advice-application/actions/runs/36535849705) | `ee550b0cf` | **11/11** | **GREEN on the first attempt**, after the code-review fix pass (`165-REVIEW-FIX.md`) and its re-gate (`165-REVIEW-FIX-GATE.md`). `e2e-tests` 165 passed, 0 failed, 0 flaky, 0 did not run (11.9 m); `e2e-visual` 7 passed. Both E2E jobs ran with `--no-watch` (`package_watcher=false`) and `ci-write-local-keys.sh`; `dev-seed-integration` ran `paraglide:compile` and the setup-cli pin test |

## Timed-branch census (D-14)

- **Converted:**
  - the walk's intro, elections and constituencies branches;
  - the questions-intro one-shot;
  - the answer loop's fixed entry wait and its URL-based category branch;
  - the radio 3 s probe and its Next fallback;
  - the results picker branch;
  - `voterQuestionsPage.clickStart`;
  - `advanceVoterFlow`'s 5 s step wait;
  - `dismissMissingNominationsIfPresent`'s give-up;
  - the preview portrait wait.
- **Kept, as they are not optional-page branches:**
  - the slider-family probe;
  - `candidateQuestionPage.answerCurrentQuestion`'s choice-vs-slider probe (CI never failed there);
  - `resultsPage.dismissAllDialogs`;
  - `voterNavFixture`'s menu-state probe;
  - `multiChoice.pollEnabled`.

## Task Commits

- Task 1: `6f63f3ef4`
- Task 2: `1570012ec`
- Task 3, first pass: `45d4cf7c0`, `6c913e570`, `3f8ef59cf`
- D-13 (the orchestrator's `40f6f91b8`): `66974e29f`, `ff98fd22a`, `8432291b3`, `dbfb12af2`, `a60182821`, `79ee02194`, `048b20e85`, `6f0b2e49c`
- D-14 (the orchestrator's `a66d35ba9`): `b3aa22f0f`, `dd5a51f78`, `ed2b32e99`, `da626bfb9`, `07ba296e5`, `7d1445f20`
- D-14, continued: `266a83f79`, `2ba6b2966`
- D-15 (the orchestrator's `cd5e34540`): `841231e77`, `a3357767e`, `87974e4bc`, `52d39b531`, `eb23671a7`, `ddb77cc91`
- D-16 (the orchestrator's `56cd22919`): `3ad2b1620`, `5aeb099b0`, `311494c7f`, and the green-run record
- `commits: 36` is measured from `4d44386b4` through this SUMMARY's commit and includes the four orchestrator decision commits.

## Deviations from Plan

1. **[Rule 1] Escaped pipes in three ledger rows.**
2. **[Method] CI evidence through tree-identical `ci-evidence/**` commits.**
3. **[Rule 2, D-04] Hygiene of files that joined the changed set.** This covered `visual-container.sh`, the walk files and the two specs. Requirement ids left test titles and line anchors left comments.
4. **[Rule 1] The first-question alias defect** and the org-matching scores that depended on it.
5. **[Rule 1] The `candidate-journey` lost click.**
6. **[Scope] `voter-journey` budget.** Left to the maintainer, who ruled 240 s (D-15).
7. **[Rule 2, D-04] `determinism-batch.sh`.** It joined the changed set with the step rename. Its planning references were removed and its stale expected count (135) was corrected to 165.
8. **[Scope] CI speed budgets after run 5.** Left to the maintainer, who ruled 180 s for CI (D-16).
9. **[Infra] Run 5's first attempt** lost two jobs to rate limits before any test ran. It was re-run once on the same commit and recorded as such. D-16's pin removes the GitHub API dependency.

## Maintainer follow-ups

- Post the draft thread replies from the ledger.
- The `tests/playwright.config.ts` comment on `timeout` still says "90s ceiling"; the value is 180 s on GitHub Actions. The file was outside the changed set.
- The root `.env` lacks `SUPABASE_URL`, so `check:env-local` fails.
- Two style decisions were kept as rendered (165-32, 165-33).

## Self-Check: PASSED

- `ledger-check.sh --final` exits 0 and `tip-proofs.sh` exits 0.
- The commits listed above are in `git log`; `commits: 36` counts from `4d44386b4` through this SUMMARY's commit, including the orchestrator's four decision commits.
- The only deleted files are the two trace zips, as D-13 ordered.
- `MainContent.svelte` and `.planning/milestone.lock` were never staged.
- Task 3: every CI check passed on run 36476589852, a tree identical to the PR head. The PR itself reports no checks, because `main.yaml`'s `pull_request` trigger covers only PRs into `main`; that is recorded in the ledger and in WINDOWS 275.

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-28*
