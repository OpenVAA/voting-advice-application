---
phase: 176-contestant-home-task-state-nominations-view
plan: 17
subsystem: frontend
tags: [continue, task-state, profile, questions, contestant-app, e2e, tdd, TASK-01]
requires:
  - phase: 176-03
    provides: taskStateOf, profileSaveTarget, questionsResumeRoute, questionSaveTarget, unansweredQuestionsOf
  - phase: 176-06
    provides: contestantCtx.taskState, which follows the store's saved answers without a load
  - phase: 176-16
    provides: the per-project baseline 176-16-close (307 tests, 113 projects)
provides:
  - the profile's Save button over the task state — label from the saved data with the draft, target from the state after the save
  - the questions list's start and continue buttons over `questionsResumeRoute`
  - a question page's Save button over `questionSaveTarget`, with `wasUnanswered` read before the save
  - a component test of the question page (16 cases) and 9 further cases of the profile page
  - fixture steps `expectOnQuestion`, `expectSaveLabel`, `expectSubmitLabel`, `commitQuestion`; the three questions' texts in the no-nomination data module
  - two `continue:` tests and three `holds:` tests in perm-no-nomination.spec.ts; the journey's and the organization-editing spec's last answer asserting home
  - the per-project baseline 176-17-close (312 tests, 113 projects)
affects: [176-18, 176-19, 177]
tech-stack:
  added: []
  patterns:
    - "a Continue button asks one function of the task state twice: for its label, of a state built by taskStateOf with the page's draft counted as saved; for its target, of contestantCtx.taskState read after the save has succeeded"
    - "a fact the save itself changes (was this question unanswered) is copied into a plain local before `await userData.save()`"
    - "a component test's fake context computes its task state with the real taskStateOf over a raw state box that a fake save rewrites before it resolves"
key-files:
  created:
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/[questionId]/page.svelte.test.ts
  modified:
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/page.svelte.test.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/[questionId]/+page.svelte
    - tests/tests/fixtures/contestant/contestantEntityPages.fixture.ts
    - tests/tests/fixtures/contestant/contestantQuestionPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts
    - tests/tests/utils/permNoNominationData.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
    - tests/tests/specs/perm/perm-organization-editing.spec.ts
    - tests/tests/specs/perm/perm-localisation-positive.spec.ts
decisions:
  - "A third control was made, of perm-organization-editing, between the plan's two: Phase 175's test of the last answer now expects home, and the plan asks for the control of the project of every committed test whose target changes"
  - "The prospective state for a label is built only while the saved state is known, with `entityKnown: true` and `questionsReady: true`: the context exposes neither input, and a known state implies both"
  - "On a question page the profile's status is carried into the prospective state from the saved state's profile task, because the context does not expose whether a required name is missing"
  - "The questions list renders its start and continue buttons only while the state holds a question to resume at, so the button is never a link to nothing"
  - "The profile's `allRequiredFilled` is kept for the required-info notice and now reads the shared `unansweredQuestionsOf` over the store's current data"
metrics:
  duration: about 46 min (10:43Z to 11:29Z)
  completed: 2026-10-09
status: complete
requirements-completed: [TASK-01]
actuals:
  tokens: 19585
  tasks: 3
  commits: 4
commits: 4
plan_head_before: ed0fd49406f1786e37c06fb812af3a4e0fa7dfc1
plan_head_after: 57eb5d2a2388cdfcb4aa8d395ec86a9022d78a85
---

# Phase 176 Plan 17: The Profile's Save, the Questions List and a Question's Save over the Task State — Summary

**The three Continue buttons that still chose their own target now ask the entity's one task state: the label of the state with the draft counted as saved, the target of the state read after the save — so the last answer leads to the profile or home, never to the questions list.**

## Read this first

- **All three tasks are done, every verify exits 0, and the full run is green**: 312 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 113 projects, every project but `perm-no-nomination` (36 → 41) at its plan-16 total.
- **What a user meets differently:** (1) the save of the last unanswered opinion question leads to the profile while it is incomplete and to the entity's home otherwise, where it led to the questions list; (2) a question page's Save button reads "Save and Continue" whenever another question is unanswered, where it read "Save and Return" on the question that is last in the list's order while an earlier one was unanswered. Nothing else changed: the profile's targets and labels, the list's two targets and the edit of an answered question are as they were, and three `holds:` tests show it.
- **Three deviations, each reported below:** a third control (the organization-editing project), two unlisted spec files changed, and a second fixture commit.
- **One finding for whoever writes the next Continue (Phase 177):** the context does not expose the inputs of its task state, so a page that needs the state "with my draft" rebuilds two of them by inference. See *For Phase 177*.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1 | `643175de5` | test(176-17): fixture steps for where a save leads |
| 1 | `10f0746f7` | test(176-17): a profile fixture step that commits a question's value to the draft |
| 2 | `69eb2e03e` | test(176-17): where the profile's save and a question's save lead, read after the save |
| 2, 3 | `57eb5d2a2` | feat(176-17): the profile's save, the questions list and a question's save follow the entity's next step |

`57eb5d2a2` is the one commit: the three pages and the four specs together, after the pre-commit run of the uncommitted tree had passed against all three controls.

## Each verify, with its real exit status

| Verify | Script | Exit | Head |
|---|---|---|---|
| Task 1 | `tests/e2e-runs/176-unit/176-17-t1-verify.sh` | 0 | `10f0746f7` |
| Task 2 | `176-17-t2-verify.sh` | 0 | `69eb2e03e`, the three pages uncommitted |
| Task 3 | `176-17-t3-verify.sh` | 0 | `57eb5d2a2` |

Each script is the plan's `<automated>` block byte for byte, extracted by a script and run with `bash`; its log, exit and head are beside it. The plan-level verification: both control verdicts 0 (below); `git grep -n -F -e "getNextQuestionId" -e "submitRouting" -- 'apps/frontend/src/routes/contestant' ':!*.test.ts'` prints nothing (exit 1); the full run's verdict 0, taken before any further commit outside `.planning/`.

## The five buttons

| # | Button | File (under `ENTITY`) | Function of the state | How it is asked |
|---|---|---|---|---|
| 1 | Home `contestant-home-continue` | `+page.svelte` | `homeAction(contestantCtx.taskState)` | a derived value; plan 14/15 |
| 2 | Profile `profile-submit` | `(nominated)/profile/+page.svelte` | `profileSaveTarget` | label: of the prospective state; target: of `contestantCtx.taskState` after the save |
| 3 | Questions list `contestant-questions-start`, `-continue` | `(nominated)/questions/+page.svelte` | `questionsResumeRoute(contestantCtx.taskState)` | a derived value; the two buttons render while it holds a route |
| 4 | Question page `contestant-questions-save` | `(nominated)/questions/[questionId]/+page.svelte` | `questionSaveTarget` | label: of the prospective state; target: of `contestantCtx.taskState` after the save, with `wasUnanswered` read before it |
| 5 | Nominations view `contestant-nominations-continue` | `nominations/+page.svelte` | `nominationsViewTarget(contestantCtx.taskState)` | a derived value; plan 12 |

Read by `git grep -n -e "homeAction" -e "profileSaveTarget" -e "questionsResumeRoute" -e "questionSaveTarget" -e "nominationsViewTarget" -- apps/frontend/src ':!*.test.ts'`: outside `lib/contestant/tasks/taskState.ts` each function is named by exactly the one file above. No page under the entity route builds a route from an unanswered list: the one remaining `unansweredOpinionQuestions[0]` is the `firstUnansweredOpinionId` the profile hands to `taskStateOf`.

Removed: `submitRouting` from the profile page and the question page; `getNextQuestionId`, `getIsLastUnanswered`, `nextQuestionId` and `isLastUnanswered` from the question page. The fall-through the removed comment protected is the state's own `resume`: the first unanswered question, whichever question was just saved.

## How a label and a target are asked

**The profile page.**

- *Label* — `prospectiveTarget`, a `$derived.by`: while `contestantCtx.taskState.known` is false it is `profileSaveTarget` of that state (home, a return). Otherwise it is `profileSaveTarget(taskStateOf({...}))` with `unansweredRequiredInfoCount` counted by `unansweredQuestionsOf(contestantCtx.requiredInfoQuestions, userData.current?.entity.answers)` — the store's current data, the draft included — and `requiredNameMissing` the page's own draft-inclusive name check; `hasNomination(contestantCtx.nominations)`, `contestantCtx.opinionQuestions.length` and the context's unanswered opinion questions for the rest. `submitLabel` picks "Save and Continue" / "Continue" when the target continues and answers are not locked, and "Save and Return" / "Return" otherwise, by `userData.hasUnsaved` as before.
- *Target* — in `handleSubmit`, after `userData.save()` has returned `success` and after the entity list's re-read where one is made: `goto(getRoute.current(profileSaveTarget(contestantCtx.taskState).route))`. The three outcomes, the alert region, `nameRefusedFor` and the focus handling are untouched.

**The question page.**

- *The fact* — `unanswered`, a `$derived`: whether this question is among `contestantCtx.unansweredOpinionQuestions`, that is, has no saved answer.
- *Label* — `prospectiveTarget`: `questionSaveTarget(state, { wasUnanswered: unanswered })`, where `state` is `taskStateOf` over the context's values with this question counted as answered — the unanswered opinion questions without this one, the first of those as the first unanswered. `submitLabel` is "Save and Continue" when it continues, and "Save and Return" / "Return" by `userData.hasUnsaved` when it does not.
- *Target* — in `handleSubmit`: `const wasUnanswered = unanswered;` before `await userData.save()`; after a successful save, `goto(getRoute.current(questionSaveTarget(contestantCtx.taskState, { wasUnanswered }).route))`. `canSubmit`, the cancel label and handler, the failure path and the answers-locked rendering are untouched.

**The questions list.** `resumeRoute = $derived(questionsResumeRoute(contestantCtx.taskState))`; each of the two buttons is `href={getRoute.current(resumeRoute)}` inside `{#if resumeRoute}`.

**Two inputs are inferred, on both pages.** `taskStateOf` needs `entityKnown` and `questionsReady`, and the context exposes neither as it computes them (its `questionsReady` accessor is the raw flag, without the "the store holds the route's entity" clause). Both pages therefore build a prospective state only when the saved state is `known`, and pass `true` for both: by the rules of `taskStateOf` a known state is one whose entity is known and, where it has a nomination, whose lists are loaded. The question page also has no name check of its own, so it carries the profile's status over: `requiredNameMissing` is "the saved profile task is incomplete and no required info question is unanswered", which is exactly when the saved state's incompleteness is a missing name.

## Red and green — the component cases

`tests/e2e-runs/176-unit/176-17-continue-red.json` (head `69eb2e03e`, the pages as they were): 69 cases, 64 passed, 5 failed, each on its expectation.

| Red case | First line of the failure |
|---|---|
| profile — takes the target from the task state as the save leaves it: the questions list, although the draft the label was read from left a required field empty | expected "vi.fn()" to be called with arguments: [ '/route/ContestantAppQuestions' ] |
| profile — takes the target from the task state as the save leaves it: home, while the saved profile is still incomplete | expected … [ '/route/ContestantAppEntityHome' ] |
| question — reads "Save and Continue" on the last of two unanswered questions | expected '  common.saveAndReturn  ' to contain 'common.saveAndContinue' |
| question — leads to the profile after the last unanswered question while the profile is incomplete, although the save empties the unanswered ones before it resolves | expected … [ '/route/ContestantAppProfile' ] |
| question — leads home after the last unanswered question when nothing else is left, and not to the questions list: `wasUnanswered` is read before the save empties the unanswered ones | expected … [ '/route/ContestantAppEntityHome' ] |

`176-17-continue-green.json` (same head, the three pages changed in the working tree): 69 cases, 69 passed. The other 20 new cases pass on both sides: they assert what the pages already did.

The question page's test is a new file of 16 cases: seven of the label, six of where a stored save leads, two of a save that is not stored (a reported failure and a rejection: no navigation, the failure message, the label unchanged, the rejection's text not shown), one of answers locked (no Save button; the Return button leads to the list). Its fake context computes `taskState` with the real `taskStateOf` over a raw state box, and its fake save takes the saved question out of the box's unanswered ones before it resolves. The heading and the answer input are replaced by components that render nothing.

The profile's test gained nine cases in one describe, and its fake context a `nominations` getter, a `taskState` getter over the box's saved facts and a route builder that accepts a route object. The existing 44 cases are unchanged and pass: with no nominations in the box their state is not known, so the target is home, as each expected.

Frontend unit suite on the changed tree: 3567 passed, 20 skipped (the long-standing skips), 0 failed, 193 files (`176-17-frontend-unit.json`); svelte-check 0 errors, 0 warnings.

## The controls — runs of the uncommitted tree

Load average (1 min) read before each start by the launcher; none had to wait.

| Label | Project | Head | Uncommitted | Load before | Docker VM free | Counts | Verdict |
|---|---|---|---|---|---|---|---|
| `176-17-control` | perm-no-nomination | `10f0746f7` | `$SPEC` | 4.26 | 18.40 GiB | 238: 236 passed, 2 failed | `--red "continue:"` PASS |
| `176-17-control-orgediting` | perm-organization-editing | `10f0746f7` | `$SPEC`, the organization-editing spec | 9.10 | 18.33 GiB | 195: 194 passed, 1 failed | `--red "voter: the saved colour and answers of organization A"` PASS |
| `176-17-control-journey` | contestant-journey | `10f0746f7` | those two and `$JOURNEY` | 10.63 | 18.26 GiB | 5: 4 passed, 1 failed | `--red "full candidate journey end-to-end"` PASS, with a third `--dirty-only` (below) |

Each red test ended `failed` on `Error: expect(page).toHaveURL(expected) failed`, and each received the questions list's URL:

| Red test | Expected | Received |
|---|---|---|
| continue: the last answer leads to the profile while required info is missing | the entity's `/profile` | `…/contestant/candidate/<id>/questions` |
| continue: the last answer leads home once the profile is complete | the entity's home | `…/contestant/candidate/<id>/questions` |
| voter: the saved colour and answers of organization A are what a voter sees | the entity's home | `…/contestant/organization/<id>/questions` |
| full candidate journey end-to-end (step 19) | the entity's home | `…/contestant/candidate/<id>/questions` |

**The three `holds:` tests as the first control found them: all passed** on the former pages — `holds: the profile's save leads to the questions list once the required info is filled in`, `holds: an answer saved while required info is missing leads to the next question`, `holds: saving an edit of an answered question returns to the questions list`. Reading the state changed none of the three.

**Control B's verdict as the plan writes it exits 1**, for one reason: `FAIL the recorded worktree status holds 'tests/tests/specs/perm/perm-organization-editing.spec.ts', which is outside the --dirty-only paths`. With `--dirty-only tests/tests/specs/perm/perm-organization-editing.spec.ts` added it exits 0. Both logs are kept (`176-17-control-journey-verdict-asplanned.log`, `-verdict.log`). Task 1's verify block reads the journey control's Playwright status alone, and exits 0.

## The committed callers of a save step, as derived before the controls

`git grep -n -e "clickContinue(" -e "saveAndLeave(" -e "saveAndExpect(" -e "contestantProfilePage.save(" -e "contestantProfilePage.submit(" -e "saveThroughReread(" -- tests/tests/specs`:

| Spec | Step | State it saves in | What it waits on | Changed by this plan |
|---|---|---|---|---|
| contestant-journey 13, 14 | profile `submit()` | required info empty; then filled | home; the questions overview | no |
| contestant-journey 16, 18, 18.5, 18.6 | question `clickContinue()` | other questions unanswered | loads the overview itself | no |
| contestant-journey 19 | the walk's last `clickContinue()` | the last unanswered, profile complete | forced a load of home | **yes — now asserts home** |
| contestant-entity-selection | `clickContinue()` | an edit, none unanswered | the questions overview | no |
| perm-localisation-positive | `submit()`; two `clickContinue()` | everything answered; edits | leaves the profile; the overview | no (one comment) |
| perm-organization-editing | eight `save({ expect: 'navigation' })`, `saveThroughReread()`, `save({ expect: 'message' })` | — | leaving the profile, or a message | no |
| perm-organization-editing | `saveAndLeave()` | the last unanswered | leaving the question | no |
| perm-organization-editing | `saveAndExpect('list')` | the last unanswered; no info question is required and the name is locked | the questions list | **yes — now `saveAndExpect('home')`** |
| perm-no-nomination | `saveAndLeave()` (preview test) | the last unanswered | leaving the question, then the menu's home item | no — it now starts that step from home, and passes |

## What U-01's and U-02's fallbacks would change here

Both stand at their recommended option; no line of a page would change under either fallback, only `taskState.ts`.

- **U-01's fallback** (criterion 4 to the letter): the spec's `holds: an answer saved while required info is missing leads to the next question` would expect the profile; the component case `leads to the other unanswered question once the save has taken this one out of the unanswered ones, with the profile incomplete` would expect the profile route, and `reads "Save and Continue" on the only unanswered question while the profile is incomplete` would keep its label.
- **U-02's fallback** (D-06 as written): the spec's `holds: the profile's save leads to the questions list once the required info is filled in` would expect the first unanswered question (`expectOnQuestion` for `qu-opin-1`); the component cases `leads to the questions list once the save has stored the draft that fills the last required field` and `takes the target from the task state as the save leaves it: the questions list, …` would expect that question's route; and the journey's steps 14 and 15 would be rewritten.

## The pre-commit run and the green proof

`176-17-precommit`: `--project perm-no-nomination` on head `69eb2e03e` with the three pages and four specs uncommitted; load before 13.95; Docker VM free 18.24 GiB; 238 tests, 238 passed, 7.3 min. Kept beside it: the four specs as it ran them and the three pages (`176-17-precommit.profile+page.svelte.kept`, `.questions+page.svelte.kept`, `.question+page.svelte.kept`).

| Verdict | Exit | "was red, now passed" |
|---|---|---|
| `control 176-17-precommit … --green --were-red-in 176-17-control` | 0 | both `continue:` tests |
| `… --were-red-in 176-17-control-journey` | 0 | the journey |
| `… --were-red-in 176-17-control-orgediting` | 0 | the organization-editing test |

At `69eb2e03e` the spec holds no `continue:` test and the question page does not name `questionSaveTarget` (the verify block's two negative searches).

## Gate rows and the full run

`176-17-close` gates on `57eb5d2a2` (load before 7.87; Docker VM free 18.16 GiB): typecheck 0 (23 s), lint 0 (51 s), unit 0 (84 s), check-frontend 0 (11 s), build 0 (17 s), format 0 (21 s). `176-verdict.mjs gates 176-17-close --rows typecheck,lint,unit,check-frontend,build,format`: PASS, not stale, no Sleep entry in the window.

The full default run `tests/e2e-runs/176-e2e/176-17-close`, head `57eb5d2a2388cdfcb4aa8d395ec86a9022d78a85`, 11:18:03Z to 11:26:55Z; load before 12.60; Docker VM free 18.12 GiB; AC power, battery 100 %:

```
counts: total 312, passed 312, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
scope: the full default suite
not stale: head 57eb5d2a2 is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project perm-no-nomination: 41/41 passed
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project perm-organization-editing: 46/46 passed
project perm-disable-allow-open: 3/3 passed
compared with: tests/e2e-runs/176-e2e/176-16-close
  perm-no-nomination	41	36	above 36	holds
per project: 113 compared, 0 not as expected
176-verdict e2e 176-17-close: PASS
```

Every other project is `equal to` its plan-16 total (the whole table is in `tests/e2e-runs/176-unit/176-17-e2e-verdict.log`). No run of this plan was void, and none was red other than the three controls, each red as named. No axe finding and no overflow.

## Code review checklist

| Item | Outcome |
|---|---|
| Solves the issue | Yes: the three remaining buttons read the one state; roadmap criterion 4 holds for all five. |
| OWASP top 10 | Nothing added: a target is a route name out of the helper's literal union, with a question id out of the state, handed to the route builder; no input, query, privilege or redirect parameter is new. |
| Code style guide | Followed; ESLint refused the import order of the question page once (`simple-import-sort`), in Task 2's gate script and before anything of the pages was committed; its own fix was applied. |
| No `any` | None. The tests cast a fixture `as unknown as ContestantUserData<true>`, as the existing cases do. |
| No repeated code | **One finding, not closed:** the profile page and the question page each build a prospective state with the same guard and the same two inferred inputs. It is not extracted because the right home for it is the context or the helper, neither in this plan's files. See *For Phase 177*. |
| New entities documented | Each new derived value and each fixture step has a doc comment; both pages' docstrings say where the save leads. |
| Repo documentation | `apps/docs` says nothing of where a save leads (searched for the label keys, "last unanswered", "next unanswered"). Nothing to update. |
| Tracking events | Nothing a user can perform is added. |
| New Svelte components | None. |
| Errors handled and logged | Unchanged: a failed, refused or rejected save logs as before and chooses no target; the state is read only after `success`. |
| Failing checks | None. |
| Parts sharing a dependency | Each of the five functions is called by its one page; the home, the menu, the logout button and the nominations view are untouched and their tests pass (3567 unit cases; the full run). |
| WCAG A and AA; keyboard and screen reader | No element is added. The list's two buttons are rendered under one more condition, which holds whenever they were useful. The 22 contestant scans and the organization-editing scans pass in the full run. |
| Documentation added where necessary | The docstrings above. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every touched comment read. The comments of the journey, the localisation spec and the profile fixture that named `submitRouting`, `submitRoute`, a line range of the question page or the former "overview or home" were rewritten to say what the pages do. |
| Commit history | Four commits: two of fixture steps, one of red component tests, one of the pages with the specs. |
| No fixes of itself | `10f0746f7` adds a step to a fixture file `643175de5` had touched; it is an addition found while writing the spec, not a correction. |
| Formatting in its own commit | No formatting-only change. |
| `[db]` | No database change. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — blocking] A third control, of `perm-organization-editing`**
- **Found during:** Task 1's derivation of the committed callers.
- **Issue:** Phase 175's `voter: the saved colour and answers of organization A are what a voter sees` asserted `saveAndExpect('list')` after the last answer, a target this plan changes. The plan's own section asks that such a test be rewritten in the same uncommitted set and that the control of its project be made; `<long_gates>` names two controls.
- **Fix:** the expectation became `saveAndExpect('home')`; `176-17-control-orgediting` was run between the plan's two controls (it had to precede the journey's: a red journey leaves the chain did-not-run) and judged red; the pre-commit run was judged a third time with `--were-red-in 176-17-control-orgediting`. Control B's verdict takes one more `--dirty-only` for it.
- **Files modified:** `tests/tests/specs/perm/perm-organization-editing.spec.ts`. **Commit:** `57eb5d2a2`.

**2. [Rule 3 — blocking] A fixture step the plan does not list: `contestantProfilePage.commitQuestion`**
- **Found during:** Task 1, step 2.
- **Issue:** a text field hands its value to the page on `change`, which a fill alone does not fire; the profile's label could not be read before the save with `fillQuestion`.
- **Fix:** `commitQuestion(label, value)` fills the control and leaves it. Committed alone, before any spec called it. **Commit:** `10f0746f7`.

**3. [Rule 1 — a comment made false] `perm-localisation-positive.spec.ts`**
- **Issue:** one comment named `submitRoute = ContestantAppQuestions` and a line range of the question page, both gone with this plan.
- **Fix:** the comment says what the save does. No expectation changed. **Commit:** `57eb5d2a2`.

**4. [Rule 2 — type safety] The list's two buttons inside `{#if resumeRoute}`**
- **Issue:** `questionsResumeRoute` answers `undefined` while no question is unanswered or the state is not known; the plan says "nothing else of the page changes".
- **Fix:** each button is rendered while there is a route. What the former page linked to in a state that is not known was not observed; no test of the suite meets that state.

### Other departures

- **The red report was taken twice**, before and after the commit of the test files, so that its `.head` is the commit that holds them; the counts are the same (69, 64, 5).
- **The first gate set of Task 2 exited 12** on the import order above; nothing had been committed. It was run again whole after the fix (`176-17-t2-green-gates-r2`), exit 0.

## Files touched that the plan did not list

- `tests/tests/specs/perm/perm-organization-editing.spec.ts` — one expectation and its comment (deviation 1).
- `tests/tests/specs/perm/perm-localisation-positive.spec.ts` — one comment (deviation 3).

## For Phase 177

**The form in which a new Continue reads the state.**

- *A button that saves nothing* (the home, the list, the nominations view): one derived value, `const target = $derived(theFunction(contestantCtx.taskState))`, and `href={getRoute.current(target.route)}`.
- *A button that saves first* (the profile, a question, the editor to come): two reads of one function.
  - **Label:** a `$derived.by` that returns `theFunction(taskStateOf({...}))` with the inputs the draft changes counted as saved; `continues` picks between the "continue" and the "return" pair of messages. While `contestantCtx.taskState.known` is false, ask the saved state itself and build nothing.
  - **Target:** in the submit handler, after the save has returned success, `goto(getRoute.current(theFunction(contestantCtx.taskState, facts).route))`. Any fact the save itself changes is copied into a plain local **before** `await userData.save()`. A save that fails reads nothing.
- **The functions the five buttons call:** `homeAction`, `profileSaveTarget`, `questionsResumeRoute`, `questionSaveTarget`, `nominationsViewTarget`, all in `$lib/contestant/tasks`.
- **A gap to close before a third saving button is written.** The context does not expose `entityKnown`, the combined `questionsReady` or `requiredNameMissing`, so each saving page infers them (above). An accessor that hands out the state's input — or a context method `taskStateWith(overrides)` — would remove the inference and the block the two pages now repeat. No plan of this phase owns it.
- An editor that defines a nomination completes the nomination task at once (`hasNomination` counts an unconfirmed one), so its "after the save" state has the profile as the next step.

## For plan 176-18 (scans and widths)

- No surface gained an element. The question page's Save button now reads "Save and Continue" in more states, and the questions list's start and continue buttons are absent while the state holds no question to resume at; a scan that waits on either button should wait on `contestant-questions-intro` instead.
- The save of the last answer lands on home or the profile without a new document. A scan or a width test that answered the last question and then expected the questions list must open the list itself.
- `contestantEntityPages.expectOnQuestion(grant, questionExternalId)` asserts the URL alone; it shows no element. `contestantQuestionPage.expectSaveLabel` and `contestantProfilePage.expectSubmitLabel` read the English label.

## For plan 176-19

- **Counts:** a one-project run of `perm-no-nomination` is 238 tests, 41 its own; the full run is 312 in 113 projects; the frontend unit suite is 3567 passed and 20 skipped in 193 files; no message was added, so each catalogue still holds 649 keys.
- **The `continue:` prefix** exists in `perm-no-nomination.spec.ts` with two tests, and the spec's header names it and says which three `holds:` tests are about where a save leads.
- **The journey's step 19 no longer loads the home**: it asserts the URL after the last save and reads the task list from the application's own state. Step 12 still opens the nominations view by URL and loads the home again.
- **Two rules are still written twice:** the reason rule (home and menu, plan 16's note) and the prospective state (profile and question page, this plan).
- The docs hold nothing of where a save leads.

## Not done, or not verified

- **Not looked at in a browser by eye**, and not exercised with a screen reader. What the buttons read and where they lead rests on the component cases and the E2E steps.
- **The state "an edit of an answered question, none unanswered, the profile incomplete"** has no E2E test: the helper answers the questions list for it (plan 03's deviation 1), the component case `leads back to the questions list after an edit …` covers the complete profile only.
- **The profile's label under a missing required name** has no new case: the page's name check is unchanged and is handed to `taskStateOf` as it is; the existing cases of the name rule pass.
- **The list's buttons in a state that is not known** are not tested: the condition that hides them there has no case of its own.
- **`STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not read** for sentences this plan made false.
- Nothing was appended to `.planning/WINDOWS.md`: no stub, no skipped test, no verify left unrun.

## The state the local database is left in

Not reset by this plan: the gate rows named no database row. The stack is up; neither it nor Docker was restarted; nothing was pruned by hand. Read with `psql` after the full run: 3 projects; 2 auth users; 377 nominations (the default project's dataset); no candidate row of an E2E dataset left; `private.invitation_link_witness` holds 194 rows, so `39-invitations.test.sql` test 238 is red on this database until the next reset — the known finding. No run is in flight.

## Known Stubs

None.

## Evidence (gitignored)

`tests/e2e-runs/176-e2e/176-17-control`, `176-17-control-orgediting`, `176-17-control-journey`, `176-17-precommit` and `176-17-close`, each with its launch records, kept copies and verdict logs beside it or in `tests/e2e-runs/176-unit/`; `tests/e2e-runs/176-gates/176-17-close`; in `tests/e2e-runs/176-unit/`: `176-17-continue-red.{json,head,log}`, `176-17-continue-green.{json,head,log,status}`, `176-17-frontend-unit.json`, `176-17-t<N>-verify.sh` with its log, exit and head, the red and green gate scripts with their logs, the launchers, the commit scripts and the `.loadavg.txt` files.

## Self-Check: PASSED

The created test file, the three pages, the red and green reports, the gate summary, the full run's summary and the kept copies exist; commits `643175de5`, `10f0746f7`, `69eb2e03e` and `57eb5d2a2` are ancestors of HEAD; `git rev-list --count ed0fd4940..HEAD` gave 4 before this summary's commit.
