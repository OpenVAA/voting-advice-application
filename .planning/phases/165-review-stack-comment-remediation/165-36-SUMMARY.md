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
  tokens: 56636
  tasks: 3
  commits: 21
plan_head_before: 4d44386b44e7b6cbb2f4828e2b2ed419cacf2945
plan_head_after: 7d1445f206ee5f7a12a35c00d1d2fcc39db1b930

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
  - "voter-journey's 120 s budget is not raised by the executor: the test is ~4.3x slower in CI, and changing a performance budget is the maintainer's call"

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
    description: "Every CI check green for the PR's tree"
    verification:
      - kind: e2e
        ref: "run 36457265423 e2e-tests: voter-journey 'full voter journey end-to-end' over its 120 s budget; 87 dependents did not run"
        status: fail
    human_judgment: true
    rationale: "Not green. The remaining red is a per-test budget question (raise JOURNEY_TEST_MAX or split the test) that needs the maintainer."

duration: 251min
completed: 2026-09-28
status: halted
---

# Phase 165 Plan 36: Final Ledger, Push, PR 13/13 and CI Summary

**The ledger is final (78 rows) and PR #889 (13/13) is open on #887. Under the maintainer's rulings, CI went from 6 of 11 green jobs to 10 of 11. The last red is `e2e-tests`, where the single long test `voter-journey` › "full voter journey end-to-end" runs about 4.3 times slower in CI than locally and reaches its 120 s budget. Raising that budget or splitting the test is the maintainer's decision. Locally the full suite is 165/0/0/0.**

## Performance

- **Duration:** about 251 min (from 2026-09-28T13:22:10Z), across the D-13 and D-14 continuations and four CI runs
- **Tasks:** 3 of 3 executed. Task 3's "every check green" is not met, so the status is `halted`.

## Accomplishments

- **Task 1: ledger.**
  - Every `fix` row's Commit cell is now derived from the `Review-Comment:` trailers.
  - Three column-shifting pipes are escaped.
  - The admin-access result is recorded.
  - `ledger-check.sh --final` passes (50 / 25 / 1 / 1 / 1), and `tip-proofs.sh` reports 27 PASS.
- **Task 2: publication.**
  - The scope check, the pattern secret sweep and trufflehog were clean before every push.
  - PR [#889](https://github.com/OpenVAA/voting-advice-application/pull/889) has base `ship/v2.15-12-planning`.
  - Every push was a normal push, and remote equals local.
- **Task 3: CI, under D-13 (the maintainer's rulings on the first run's red jobs):**
  - `js-yaml` moved to 4.3.2 / 3.15.2 in the lockfile only (`66974e29f`).
  - The v2.10 trace zips are deleted, and `163-RESEARCH.md` is the one exact-path scanner exclusion (`ff98fd22a`, `dbfb12af2`).
  - `dev-seed-integration` compiles Paraglide before its tests, and both E2E jobs run `e2e-run.sh` (`8432291b3`). `visual-container.sh --ci-literal` follows CI, and that file's hygiene is cleaned.
- **Task 3: CI, under D-14 (state-driven helpers, option c only):**
  - `resolveVoterStage` / `walkVoterStages` live in `utils/voterNavigation.ts`. A page counts only when the URL is on its route and its anchor is visible, and the walk acts on whatever renders.
  - These now drive `walkUntilQuestionsIntro`, the answer loop's stage resolution, `navigateToFirstQuestion` and `voterQuestionsPage.clickStart`.
  - The results picker is resolved against the list.
  - The radio path relies on the app's auto-advance. The old timed Next fallback could double-advance.
  - `dismissMissingNominationsIfPresent` no longer gives up after 10 s.
  - The preview portrait waits for the loading state to resolve (`b3aa22f0f`).
- **Latent defect found by D-14.**
  - The walk silently skipped the first question on `/questions/__first__`, after a 15 s dead wait. That affected every seed with category intros off.
  - It now answers the question, and `perm-org-matching` asserts full-walk scores (`dd5a51f78`).
- **CI-exposed race.** `candidate-journey` step 13.5's Save click was lost to a layout shift caused by its own blur. The step now blurs first and waits for the error to go (`da626bfb9`).
- **Local gates on the final code tree (`07ba296e5`):**
  - E2E via the wrapper: 165/0/0/0 (`tests/e2e-runs/165-36-d14d`).
  - `yarn lint:check` and `yarn format:check`: 0.
  - `yarn build` and `yarn test:unit`: 0 after the helper changes. The last change touched only a spec.
  - Hygiene: CLEAN over 240 files, in a detached worktree.
  - No schema changed, so 165-35's database gates stand.

## CI runs

| Run | Tree of | Jobs green | Outcome |
|---|---|---|---|
| [36429830379](https://github.com/OpenVAA/voting-advice-application/actions/runs/36429830379) | `1570012ec` | 6/11 | secret-scan, dependency-audit and dev-seed-integration red for inherited causes; both E2E jobs failed the project preflight. Led to D-13 |
| [36442680412](https://github.com/OpenVAA/voting-advice-application/actions/runs/36442680412) | `a60182821` | 9/11 | The D-13 jobs green; the E2E jobs ran the suite in CI for the first time and hit fixed-window branches. Led to D-14 |
| [36454241649](https://github.com/OpenVAA/voting-advice-application/actions/runs/36454241649) | `ed2b32e99` | 10/11 | `e2e-visual` green and every walk failure gone; one `candidate-journey` lost click, fixed |
| [36457265423](https://github.com/OpenVAA/voting-advice-application/actions/runs/36457265423) | `07ba296e5` | 10/11 | `candidate-journey` green. `voter-journey`'s one long test completed every step but ran ~4.3× slower than locally and reached its 120 s budget; 87 dependents did not run |

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
- `commits: 21` is measured from `4d44386b4` and includes the two orchestrator decision commits.

## Deviations from Plan

1. **[Rule 1] Escaped pipes in three ledger rows.**
2. **[Method] CI evidence through tree-identical `ci-evidence/**` commits.**
3. **[Rule 2, D-04] Hygiene of files that joined the changed set.** This covered `visual-container.sh`, the walk files and the two specs. Requirement ids left test titles and line anchors left comments.
4. **[Rule 1] The first-question alias defect** and the org-matching scores that depended on it.
5. **[Rule 1] The `candidate-journey` lost click.**
6. **[Scope] `voter-journey` budget.** Left to the maintainer: raising a performance budget to green a test is not an executor call.

## Maintainer follow-ups

- **Decide the `voter-journey` budget:** (a) raise `JOURNEY_TEST_MAX`, or (b) split the journey test (`deferred-items.md` § From 165-36).
- `organizationMatching: 'none'` still scores organisations by their own answers, although the settings type documents "No party matching is done". The `playwright.config.ts` comment "none → no score" repeats the old reading.
- The root `.env` lacks `SUPABASE_URL`, so `check:env-local` fails.
- Two style decisions were kept as rendered: the grey "Your answer" labels and markers (165-32), and the neutral disabled nav items (165-33).
- Post the draft thread replies from the ledger.

## Self-Check: PASSED

- `ledger-check.sh --final` exits 0 and `tip-proofs.sh` exits 0.
- The commits listed above are in `git log`, and `git rev-list --count 4d44386b4..7d1445f20` = 21.
- The only deleted files are the two trace zips, as D-13 ordered.
- `MainContent.svelte` and `.planning/milestone.lock` were never staged.
- Task 3's "every check passing" is **not** met. It is recorded as `status: halted`, not claimed.

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-28 (halted at the voter-journey CI budget)*
