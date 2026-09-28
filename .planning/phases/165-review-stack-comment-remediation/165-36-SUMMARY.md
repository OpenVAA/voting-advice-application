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
  tokens: 74938
  tasks: 3
  commits: 29
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
  - "Other budgets are not raised by the executor: after run 5 the remaining red is CI speed against fixed budgets, returned to the maintainer"

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
        ref: "run 36463977144 e2e-tests: voter-alliance over the 90 s default test budget; cold-entry-dataroot located /en/results over its 10 s wait (157 passed, 2 failed, 6 did not run)"
        status: fail
    human_judgment: true
    rationale: "Not green. The remaining red is CI speed against fixed per-test and per-wait budgets, a posture decision that D-15 kept with the maintainer."

duration: 323min
completed: 2026-09-28
status: halted
---

# Phase 165 Plan 36: Final Ledger, Push, PR 13/13 and CI Summary

**The ledger is final (78 rows) and PR #889 (13/13) is open on #887. Under the maintainer's rulings D-13 to D-15, CI went from 6 of 11 green jobs to 10 of 11, and `e2e-tests` now runs the whole suite in CI: 157 passed, 2 failed, 6 did not run. `voter-journey` passes in 183.5 s under its new 240 s budget. D-15 also fixed a product defect: `organizationMatching: 'none'` no longer scores parties. The two remaining failures are CI speed against fixed budgets (a 90 s test budget and a 10 s cold-load wait), which D-15 left with the maintainer. Locally the full suite is 165/0/0/0.**

## Performance

- **Duration:** about 323 min (from 2026-09-28T13:22:10Z), across the D-13, D-14 and D-15 continuations and five CI runs
- **Tasks:** 3 of 3 executed. Task 3's "every check green" is not met, so the status is `halted`.

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
- **Local gates on the final code tree (`87974e4bc`).**
  - E2E via the wrapper: 165/0/0/0 (`tests/e2e-runs/165-36-d15`).
  - build, lint, format and unit: 0.
  - Frontend `check`: 0 errors, 0 warnings.
  - Hygiene: CLEAN over 245 files.
  - No schema changed, so 165-35's database gates stand.

## CI runs

| Run | Tree of | Jobs green | Outcome |
|---|---|---|---|
| [36429830379](https://github.com/OpenVAA/voting-advice-application/actions/runs/36429830379) | `1570012ec` | 6/11 | Inherited causes. Led to D-13 |
| [36442680412](https://github.com/OpenVAA/voting-advice-application/actions/runs/36442680412) | `a60182821` | 9/11 | Fixed-window walk branches under CI latency. Led to D-14 |
| [36454241649](https://github.com/OpenVAA/voting-advice-application/actions/runs/36454241649) | `ed2b32e99` | 10/11 | `e2e-visual` green; one lost click, fixed |
| [36457265423](https://github.com/OpenVAA/voting-advice-application/actions/runs/36457265423) | `07ba296e5` | 10/11 | `voter-journey` over 120 s at ~4.3× CI slowdown. Led to D-15 |
| [36463977144](https://github.com/OpenVAA/voting-advice-application/actions/runs/36463977144) | `87974e4bc` | 10/11 | Attempt 1: two jobs lost to external rate limits, no test ran, re-run once. Attempt 2: `e2e-tests` 157 passed, 2 failed, 6 did not run. `voter-journey` passed (183.5 s). Remaining: `voter-alliance` 95 s against the 90 s default test budget (21 s locally; seven other tests at 78-89 s), and a cold `/en/results` load over its 10 s wait |

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
- D-15 (the orchestrator's `cd5e34540`): `841231e77`, `a3357767e`, `87974e4bc`, `52d39b531`
- `commits: 29` is measured from `4d44386b4` through this SUMMARY's commit and includes the three orchestrator decision commits.

## Deviations from Plan

1. **[Rule 1] Escaped pipes in three ledger rows.**
2. **[Method] CI evidence through tree-identical `ci-evidence/**` commits.**
3. **[Rule 2, D-04] Hygiene of files that joined the changed set.** This covered `visual-container.sh`, the walk files and the two specs. Requirement ids left test titles and line anchors left comments.
4. **[Rule 1] The first-question alias defect** and the org-matching scores that depended on it.
5. **[Rule 1] The `candidate-journey` lost click.**
6. **[Scope] `voter-journey` budget.** Left to the maintainer, who ruled 240 s (D-15).
7. **[Rule 2, D-04] `determinism-batch.sh`.** It joined the changed set with the step rename. Its planning references were removed and its stale expected count (135) was corrected to 165.
8. **[Scope] CI speed budgets after run 5.** Left to the maintainer: D-15 forbids other budget changes.

## Maintainer follow-ups

- **Decide the CI speed posture** (`deferred-items.md` § From 165-36, under D-15). The options:
  - (a) a larger default per-test budget for the E2E run in CI, with the cold-entry waits running to the test budget;
  - (b) raise only the two failing budgets (fragile: seven tests sit at 78-89 s);
  - (c) make the results-only specs cheaper than a full answered walk.
- Optional: pin `supabase/setup-cli`'s version, to avoid the GitHub API rate limit seen in run 5's first attempt.
- The root `.env` lacks `SUPABASE_URL`, so `check:env-local` fails.
- Two style decisions were kept as rendered (165-32, 165-33).
- Post the draft thread replies from the ledger.

## Self-Check: PASSED

- `ledger-check.sh --final` exits 0 and `tip-proofs.sh` exits 0.
- The commits listed above are in `git log`; `commits: 29` counts from `4d44386b4` through this SUMMARY's commit, including the orchestrator's three decision commits.
- The only deleted files are the two trace zips, as D-13 ordered.
- `MainContent.svelte` and `.planning/milestone.lock` were never staged.
- Task 3's "every check passing" is **not** met. It is recorded as `status: halted`, not claimed.

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-28 (halted at the CI speed-posture decision)*
