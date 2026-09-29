---
phase: 165-review-stack-comment-remediation
fixed_at: 2026-09-29T06:52:02Z
review_path: .planning/phases/165-review-stack-comment-remediation/165-REVIEW.md
scope: Part C only (C-WR-01..07, C-IN-01..07), fix_scope all
iteration: 1
findings_in_scope: 14
fixed: 13
skipped: 1
status: partial
---

# Phase 165: Code Review Fix Report (Part C)

**Fixed at:** 2026-09-29T06:52:02Z
**Source review:** `165-REVIEW.md`, Part C (full detail in `165-REVIEW-partC.md`)
**Iteration:** 1
**Branch:** `ship/v2.15-13-review-fixes`, main working tree (`workflow.use_worktrees: false`, so no worktree was created)

**Summary:**
- Findings in scope: 14 (7 warnings, 7 info)
- Fixed: 13
- Skipped: 1. C-IN-07 is `no_change_needed`, because it restates the D-15 and D-16 maintainer rulings.
- Commits: 14, from `563e3836c` to `815ee1757`. That is one per fixed finding, plus one hygiene commit for a file that C-WR-06 brought into the changed set (D-04).

**Status is `partial` only because of C-IN-07.** Every actionable finding is fixed.

**Commit-order note.** C-WR-02 was committed before C-WR-01. The progress check in C-WR-01 is measured against `STAGE_BUDGET`, and it can only fire before the test ceiling once C-WR-02 has shortened that budget.

**Prefix note.** Three commits use the `docs(165):` prefix, not `fix(165):`, because they change comments only: C-IN-02, C-IN-03 and the C-WR-06 hygiene commit. They are unpushed. Reword them if the prefix matters.

## Fixed Issues

### C-WR-01: `walkVoterStages` has no progress check

**Files modified:** `tests/tests/utils/voterNavigation.ts`
**Commit:** `69c79418a`
**Applied fix:** The walk now tracks the stage and pathname it is acting on. It throws when the same stage on the same path is still showing `STAGE_BUDGET` after the walk first acted on it. The message has this shape: `voter walk: stuck on the <stage> page at <url>. Its action did not take effect in N attempt(s) over T ms. The last attempt failed with: <first line of the swallowed timeout>`.

I used a time-based check rather than the review's count of 5 attempts. An attempt can take between about 11 s and a full `STAGE_BUDGET`, so a count would not scale with the environment's ceiling.

It is a failure, not a branch. No optional page is ever judged skipped because of it (D-14).

`advanceClick` and `leaveStage` now swallow only timeouts and rethrow everything else, such as a strict-mode violation. They return the swallowed timeout's first line so the walk can report it.

**Negative proof:** a scratch Playwright config outside the repo ran a stub page on `http://walk.test` (`scratchpad/walkprobe/`).
- A disabled questions-intro Start button now fails in 33 s locally: `stuck on the questions-intro page at http://walk.test/questions ... 3 attempt(s) over 33066 ms ... locator.click: Timeout 3000ms exceeded.` Before this fix the walk re-clicked until the test ceiling.
- A duplicated elections Continue button throws the strict-mode violation after 22 ms.

### C-WR-02: `STAGE_BUDGET = TIMEOUTS.testMax` makes the walk's own message unreachable

**Files modified:** `tests/tests/utils/voterNavigation.ts`
**Commit:** `563e3836c`
**Applied fix:**
- **Budget:** `STAGE_BUDGET = TIMEOUTS.testMax / 3`, so 30 s locally and 60 s on GitHub Actions. It is exported for the fixture.
- **Named step:** each `resolveVoterStage` call runs as `test.step('resolve the voter stage: one of [...]')`.
- **`isTimeout`:** it no longer matches message text. It is true for `errors.TimeoutError` and for a web-first assertion whose `matcherResult.timeout` is set.

I checked the text against Playwright 1.58.2 directly. A timed-out `toHaveAttribute` reads `expect(locator).toHaveAttribute(expected) failed ... Timeout: 300ms`. That matches neither the old pattern nor the review's suggested `Timed out \d+ms waiting`. `waitForURL` and `click` timeouts are `TimeoutError` instances.

### C-WR-03: The category-start href guard accepts the `__first__` placeholder

**Files modified:** `tests/tests/utils/voterNavigation.ts`, `tests/tests/fixtures/voter/voter-journey.fixture.ts`
**Commit:** `a3a96a605`
**Applied fix:** There is now one exported helper, `followCategoryStart(page)`. It uses this pattern, built from the app's `FIRST_QUESTION_ID`:

```
/questions/(?!category/|__first__(?:[/?#]|$))[^/?#]+
```

The fixture's duplicate `followLinkWhenHrefResolved` is deleted, and the answer loop calls the shared helper. A null href after a match now throws instead of silently skipping the navigation.

**Checks:**
- The regex rejects `/en/questions/__first__`, `/questions/__first__?x=1` and `/en/questions/category/abc`. It accepts `/en/questions/qu-1`.
- **Scratch probe:** the helper does not follow a `__first__` href. The URL stays on the category page and the named assertion fails after the budget. It does follow an href that resolves after 1.5 s.

### C-WR-04: The post-slider branch keeps a swallowed fixed window that silently skips a question

**Files modified:** `tests/tests/fixtures/voter/voter-journey.fixture.ts`
**Commit:** `a813891a7`
**Status:** fixed, requires human verification (logic change)
**Applied fix:** After a number question, the loop now uses an `expect.poll` with budget `STAGE_BUDGET` and a message naming the question. It waits until both of these hold:
- the `voter-questions-heading` text differs from the heading captured when the slider was answered;
- the scoped choices or a slider are present.

**Why not the review's `isConnected` check:** the questions layout remounts the input only on `{#key \`${question.type}-${deleteEpoch}\`}`. So two adjacent number questions share one `<input type="range">` element, and that check would never resolve.

**Other changes:**
- The silent Skip fallback is gone. A question with neither choices nor a visible slider throws `voter-journey: question <id> rendered neither choices nor a number slider at <url>`.
- `waitForVisible`, which had no remaining caller, is deleted.
- The other answer-surface waits moved from `testMax` to `STAGE_BUDGET`, so their messages can be reached too.

**Not exercised:** no seed has two adjacent number questions. On `e2e/base` a number question (base-6) is followed by a multi-choice question (base-7), and that path passes.

### C-WR-05: The results landing keeps fixed windows

**Files modified:** `tests/tests/fixtures/voter/voter-journey.fixture.ts`
**Commit:** `c8e7e90fd`
**Applied fix:** These waits now all use `STAGE_BUDGET` (30 s locally, 60 s on CI):
- the picker-option wait, previously 10 s;
- the results-list wait, previously a literal 15 s whose stale `// reason:` is dropped;
- the picker-or-list race, previously `testMax`;
- `requireNavigation`, previously 10 s. It covers the last answer's hop to `/results`.

`requireNavigation` is still loud, and its docstring and message give the new budget.

### C-WR-06: The CI-only 180 s ceiling is lowered back by hard-coded `setTimeout` sites

**Files modified:**
- `tests/tests/setup/shared/auth.setup.ts`
- `tests/tests/setup/admin/admin-auth.setup.ts`
- `tests/tests/setup/perm/perm-answers-locked.setup.ts`
- `tests/tests/setup/perm/perm-question-video.setup.ts`
- `tests/tests/setup/perm/perm-hide-hero.setup.ts`
- `tests/tests/setup/perm/perm-disable-allow-open.setup.ts`
- `tests/tests/specs/perf/performance-budget.spec.ts`
- `tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts`
- `tests/tests/helpers/timeouts.ts`

**Commits:** `b1a03b7ca` (fix), `0ded2ea45` (D-04 hygiene)
**Applied fix:**
- The six setups and the performance spec use `TIMEOUTS.testMax`, not `90000`.
- The five 2e2cg tests use `BOUNCE_TEST_MAX = TIMEOUTS.testMax / 2`, not `45000`.
- The `timeouts.ts` header no longer calls perm-localisation-positive's 180 s a budget above the ceiling. It also states the rule: a `setTimeout` at or below the ceiling is written in terms of `TIMEOUTS.testMax`.
- No `setTimeout(<digits>)` is left under `tests/tests`.

**Hygiene:** `performance-budget.spec.ts` joined the changed set, and the gate flagged one narrative line: "This spec previously asserted ...". The header now states why Navigation Timing is not asserted on, with the same measurements.

### C-WR-07: The closed-project teardown skips the dataset delete and masks the original error

**Files modified:** `tests/tests/setup/perm/perm-closed-project.teardown.ts`
**Commit:** `098a0cf80`
**Applied fix:** A module-level `runEveryStep` runs three named steps independently:
1. unregister the auth user;
2. `runTeardownAsserted`;
3. `ensureProject`.

It then rethrows a single error unchanged. When more than one step fails, it throws an `AggregateError` whose message lists every failed step with its message, because reporters print only the outer message. The header now describes this.

**Proof:** the teardown passed in its smoke run. The failure paths were not provoked.

### C-IN-01: `expectNoOrgMatchScore` is a one-shot negative count

**Files modified:** `tests/tests/fixtures/voter/resultsPage.fixture.ts`
**Commit:** `a840a7ea7`
**Applied fix:** Before counting, the method waits for a member subcard's match score to be visible. The perm seed sets `cardContents.organization: ['children']`, so a scored subcard is present. The docstring states that precondition.

### C-IN-02: `SendEmailResultSchema` documents a 500 branch it never sees

**Files modified:** `packages/app-shared/src/data/schemas/sendEmailResult.schema.ts`
**Commit:** `854ffadae`
**Applied fix:** This is the docs option. The schema docs and the `success` field doc now say that `functions.invoke` turns the 500 branch into an error, so the adapter throws before parsing and the per-recipient list is not read.

The schema still accepts the 500 shape, because it mirrors the function, and its test is unchanged.

I did not take the alternative, having the adapter read `error.context.json()`. It would change adapter behaviour, and the review offered it only as one of two options.

### C-IN-03: Stale descriptions of the old walk and of the 90 s ceiling

**Files modified:**
- `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts`
- `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts`
- `tests/tests/specs/perm/perm-disable-allow-open.spec.ts`
- `tests/tests/utils/voterNavigation.ts`
- `tests/tests/fixtures/voter/voter-journey.fixture.ts`

**Commit:** `7bcb0e095`
**Applied fix:**
- **Rewritten:** the claims about a "race-based passer", a "hard-wait" `answeredVoterPage` that "would time out", and the `isVisible` guard now describe the stage walk as it is. The two "90s" mentions are also reworded.
- **Also corrected:** the `advanceClick` reason comment called its 3 s click "TIGHTER than TIMEOUTS.click", but that bucket is 2 s.
- **Already done elsewhere:**
  - `tests/playwright.config.ts` had already been corrected in Part A.
  - `voter-journey.fixture.ts:53` and `:170` were removed with the C-WR-03 helper.

### C-IN-04: Dead code

**Files modified:** `tests/tests/utils/voterNavigation.ts`, `tests/tests/utils/missingNominations.ts` (deleted), `tests/README.md`
**Commit:** `0d8332e38`
**Applied fix:**
- **Walk stop points:** `StopAt` and `advanceVoterFlow` are deleted, and `navigateToFirstQuestion` calls `walkVoterStages(page, ['question'])`.
- **Helpers file:** `missingNominations.ts` had no caller anywhere in the repo, so it is deleted.
- **README:** the pitfall entry that prescribed the deleted helpers now describes what the specs actually do:
  - `toBeHidden` on the modal testid on fully nominated paths;
  - `perm-missing-nominations.spec.ts` for the modal's contents;
  - the `open`-attribute rule for a rendered DaisyUI dialog.
- **Check:** `e2eDocPreconditionGate` passes 7/7.

### C-IN-05: Unscoped `inputError` wait in the candidate profile step

**Files modified:** `tests/tests/specs/candidate/candidate-journey.spec.ts`
**Commit:** `906a1c313`
**Applied fix:** A `linkFieldError` locator, built from `candidateProfilePage.getQuestion(/\[qu-info-text-link\]/).first().getByTestId(testIds.shared.inputError)`, now scopes both assertions:
- the soft invalid-URL `toContainText`, which the review did not cite but which has the same page-wide scope;
- the `toBeHidden`.

The profile page wraps each `QuestionInput` in `candidate-profile-info-item`, and `Input.svelte` renders `input-error` inside it.

### C-IN-06: `--ci-literal` does not reproduce CI's timeout posture

**Files modified:** `tests/scripts/visual-container.sh`
**Commit:** `815ee1757`
**Applied fix:** Under `--ci-literal` the script now adds `DOCKER_ARGS+=(-e GITHUB_ACTIONS=true)`, and the flag's help text says so. That gives the container the 180 s ceiling and `forbidOnly`. Those are the only two consumers of `GITHUB_ACTIONS` under `tests/`.

`bash -n` passes. The container itself was not run.

## Skipped Issues

### C-IN-07: Two widened budgets now apply locally too

**File:** `tests/tests/specs/voter/voter-journey.spec.ts:24`, `tests/tests/specs/voter/cold-entry-dataroot.spec.ts:40,51,70,86`
**Reason:** `no_change_needed`. It restates maintainer rulings:
- **D-15:** `JOURNEY_TEST_MAX` is 240 s, with its measured cost in the comment.
- **D-16:** the cold-entry checks wait up to the test's budget.

The review itself marks the item "noted, not contested", and its fix is optional. Keying `JOURNEY_TEST_MAX` off `ON_GITHUB_ACTIONS` would reverse the D-15 value locally, which is a maintainer call.
**Original issue:** the CI-motivated widenings also loosen the local regression signal.

## Verification record

**Where it ran:** every gate ran in the **main checkout** (no worktree), against the local Supabase stack. The numbers are reproducible from this tree.

| Check | Result |
|---|---|
| `yarn lint:check` (turbo lint, tests ESLint, `typecheck:tests`, frontend typecheck, all `assert:*` guards) | exit 0 |
| `yarn typecheck:tests` after each commit | exit 0 |
| ESLint and Prettier on every touched file | clean |
| `hygiene-changed-files.sh --files`, per commit, over each commit's files | VERDICT: CLEAN. One narrative hit in `performance-budget.spec.ts` was fixed in `0ded2ea45`. |
| `tip-proofs.sh` | exit 0 |
| `packages/app-shared` vitest | 92 passed |
| `packages/dev-seed` `e2eDocPreconditionGate.test.ts` | 7 passed |
| Scratch walk probe (4 cases, outside the repo; no tracked file touched) | all pass after a probe-config `baseURL` fix |

**E2E smoke.** Each run used `tests/scripts/e2e-run.sh --no-db-reset --project <p>`. Every run had preflight OK 1 and failures 0, and all run dirs are under `tests/e2e-runs/`:

| Project (run dir `165-fixC-*`) | Result |
|---|---|
| voter-journey (after C-WR-05) | 4 passed |
| voter-alliance | 3 passed |
| perm-hide-if-missing-answers | 95 passed |
| perm-org-matching | 122 passed |
| candidate-journey | 5 passed |
| perm-closed-project | 165 passed |
| perm-not-located-2e2cg | 54 passed |
| performance | 3 passed |
| perm-interactive-info | 117 passed |
| a11y-smoke | 18 passed |
| voter-journey-final (at the tip) | 4 passed |

There were no failed, flaky or did-not-run tests. The perm runs pulled their dependency chains. These are project runs, not the full suite. The full re-gate is left to the orchestrator, as instructed.

**What the orchestrator still has to do:**
- **Hygiene reads:** none are recorded. `record-hygiene-read.sh` needs a `165-NN` plan id.
- **Newly changed files:** these joined the branch's changed set through these fixes:
  - `tests/tests/setup/shared/auth.setup.ts`
  - `tests/tests/setup/admin/admin-auth.setup.ts`
  - four `tests/tests/setup/perm/*.setup.ts`
  - `tests/tests/specs/perf/performance-budget.spec.ts`
  - `tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts`
  - `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts`
  - `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts`
  - `tests/tests/specs/perm/perm-disable-allow-open.spec.ts`
  - `tests/tests/fixtures/voter/resultsPage.fixture.ts`
- **Deleted file:** `tests/tests/utils/missingNominations.ts`.
- **Unrelated local changes:** `apps/frontend/src/lib/layouts/main/MainContent.svelte` and `.planning/milestone.lock` were never staged.
- **This report:** it is not committed.

---

_Fixed: 2026-09-29T06:52:02Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
