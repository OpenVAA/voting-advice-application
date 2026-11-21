---
phase: 176-contestant-home-task-state-nominations-view
plan: 15
subsystem: frontend
tags: [home, task-list, contestant-app, nomination, preview, pending, a11y, e2e, tdd, NOM-01, NOM-07, TASK-01]
requires:
  - phase: 176-03
    provides: homeAction and taskLabelKey over the pure task state
  - phase: 176-06
    provides: contestantCtx.taskState, previewOpen and profileComplete
  - phase: 176-14
    provides: the row markup behind one condition, the fixture's seven task-list steps, the per-project baseline 176-14-close
provides:
  - the home as the task list of every entity, in every state, rendered from the context's task state alone
  - the pending frame of an entity that has a nomination, with the two sentences' places held
  - the home's own helper and its test deleted
  - the home fixture without its enabled/disabled task step; the journey asserting the task list
  - three `home: with` tests in perm-no-nomination.spec.ts
  - the per-project baseline 176-15-close (300 tests, 113 projects)
affects: [176-16, 176-17, 176-18, 176-19, 177, 179]
tech-stack:
  added: []
  patterns:
    - "a snippet declared at the top level of a page and handed to MainContent only in the state that shows it (hero={allComplete ? successHero : undefined}), so no empty wrapper is rendered in the other states"
    - "a place held before a state is known by an invisible, aria-hidden paragraph with the classes of the real one and no test id, so the real sentence's test id is a marker that the state is known"
key-files:
  created: []
  modified:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts"
    - tests/tests/fixtures/contestant/contestantHomePage.fixture.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
  deleted:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/contestantHome.helpers.ts"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/contestantHome.helpers.test.ts"
decisions:
  - "The page's pending fact is `!taskState.known`, which is also true of a state with no task at all; the plan words it as 'a task without a status'"
  - "The note's second sentence is decided from the task state: the profile task carries a count, or the questions task is incomplete and the setting hides the entity's type"
  - "The hero is a top-level snippet handed to MainContent only when every task is complete, so the other states render no figure at all"
  - "The greeting's name is the selected entity's, with an empty string where the entity has no name; the page holds no placeholder character"
  - "ContestantHomeTask stays in the fixture: clickTask takes it"
metrics:
  duration: about 35 min (09:17Z to 09:52Z)
  completed: 2026-10-09
status: complete
requirements-completed: [NOM-01, NOM-07, TASK-01]
actuals:
  tokens: 29226
  tasks: 3
  commits: 2
commits: 2
plan_head_before: 4efe968ce81c091b5352c7da68981eac60dbf308
plan_head_after: 540b8d1c96b3757892746fa6d73bb25979ceaa59
---

# Phase 176 Plan 15: The Home of an Entity with a Nomination — Summary

**The home is now one task list for every entity, read from the context's task state and from nothing else: with a nomination the questions row is open whatever the profile holds, the preview entry is closed with its own reason until everything is answered, the main action names the first task left and then the preview, and before the question lists are known the page says nothing of what is left. The home's own helper is gone, and the journey asserts the list in the commit that changed it.**

## Read this first

- **Everything in the plan is done.** Full run `176-15-close`: 300 passed / 0 failed / 0 flaky / 0 skipped / 0 did not run in 113 projects; `perm-no-nomination` 29 against 26, every other project at its `176-14-close` total.
- **No run was red or void, and none was made twice.** Two controls red as designed, one pre-commit run green, six gate rows, one full run.
- **The host's load was at or below 20 at the start of every run.** The first control waited one minute for it (38.61, then 19.24); no other run waited. The figures are under *The host's load before each run*.
- **Four things in the page are judgments the plan does not spell out**, each under *Deviations*: what "pending" is read from; how the note's second sentence is decided without a count rule of the page's own; the greeting of an entity with no name; and the hero's wrapper.
- **`ContestantHomeTask` was not removed from the fixture.** The plan removes "the superseded task step and its type"; `clickTask` takes the same type and has four callers, so the type stays and only the step went.
- **The first red unit report was not a red report.** Forty cases failed on a `TypeError` in the former page, which read a member the rewritten fake context no longer held. The fake context was given the two members back before the test was committed; the report kept holds 35 failures, each an `AssertionError`.
- **Not looked at:** the page in a browser by eye; the list with a screen reader; the greeting of a long party name at 320 px. See *Not done, or not verified*.
- The hook line "CONTEXT WARNING: Usage at NN%" appeared after tool calls and was taken as the orchestrator's.
- `git status --short` showed ` M .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` and `?? CAND-APP-PLAN.md` from the start. Neither was staged, edited or restored.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1 | — | nothing committed: the two specs were held in the working tree through both controls |
| 2 | `742e8189a` | test(176-15): the home as the task list of an entity that has a nomination, in each of its states |
| 3 | `540b8d1c9` | feat(176-15): the home lists every entity's tasks and names what is next, and the questions open on it with the nomination |

Each was committed by pathspec from a script kept as `tests/e2e-runs/176-unit/176-15-commit-*.sh`. The feature commit's script compares the four changed files byte for byte with the copies kept beside the pre-commit run, runs both green verdicts and the comment-hygiene guard, and commits only after all of them.

**The one commit's paths** (`540b8d1c9`): `$ENTITY/+page.svelte`; `$ENTITY/contestantHome.helpers.ts` and `$ENTITY/contestantHome.helpers.test.ts` as deletions; `tests/tests/fixtures/contestant/contestantHomePage.fixture.ts`; `tests/tests/specs/perm/perm-no-nomination.spec.ts`; `tests/tests/specs/contestant/contestant-journey.spec.ts`.

## Each verify, with its real exit status

Each `<automated>` block was extracted byte for byte from the plan to `tests/e2e-runs/176-unit/176-15-t<N>-verify.sh` and run with `bash`; the log, the exit status and the head are beside each.

| Task | Exit | Head | Note |
|---|---|---|---|
| 1 | **0** | `4efe968ce` | With the two specs uncommitted, after both controls. |
| 2 | **0** | `742e8189a` | With the page, the two deletions and the two specs uncommitted, after the working tree's checks. |
| 3 | **0** | `540b8d1c9` | After the full run and before any commit outside `.planning/`. |

The plan-level checks: `git grep -n -F "expectTasks(" -- tests/tests` prints nothing; `git grep -n -F "contestantHome.helpers" -- apps/frontend/src` prints nothing.

## The page's structure, in document order

What `$ENTITY/+page.svelte` renders, inside `MainContent`, for every entity:

1. **The note slot** — `NotEditableNote reason="answersLocked"` under `contestant-answers-locked-warning`, only while answers are locked. Its second sentence (`contestantApp.common.isHiddenBecauseMissing`) is rendered when the task state lists a profile task with a count, or a questions task that is incomplete while `entities.hideIfMissingAnswers` holds the entity's type. Neither is true of an entity with no nomination or of a state that is not known.
2. **The hero** — `<figure role="presentation">` with the success emoji, only when every task is complete. In every other state `MainContent` is handed no hero and renders no figure.
3. **The title** — `<h1>`: `contestantApp.home.ready` when every task is complete, and otherwise `contestantApp.common.greeting` with the name the descriptor's `greetingName` reads from `contestantCtx.selectedEntity`.
4. **The explanation** — `<p class="text-center" data-testid="contestant-home-status">` for a known state: `contestantApp.home.ingress.ready`; the descriptor's `homeNoNomination`; or the descriptor's `homeNotDone`, and `homeNotDoneNoQuestions` when the state lists no questions task. While the state is not known, a place-holding paragraph instead (below).
5. **The tip** — `<p class="text-center" data-testid="contestant-home-tip">`, only when every task is complete.
6. **The list** — `<ol class="mt-lg w-full list-none pl-0" aria-label=… data-testid="contestant-home-tasks" data-task-state=…>`, one `<li>` per task of `contestantCtx.taskState.tasks`, each holding one `Button` and nothing else. The row markup is plan 176-14's, unchanged.
7. **The preview entry** — a `Button` under the list, outside it: `contestant-home-preview`, `data-preview`.
8. **The reason sentence** — `<p class="small-info mt-sm text-center" id="contestant-home-closed-reason" data-testid="contestant-home-closed-reason" data-reason=…>` when a reason applies; a place-holding paragraph while the state is not known; nothing otherwise.
9. **The primary actions** — the main action `contestant-home-continue` with `data-next-step`, and under it `LogoutButton` under `contestant-home-logout`.

The script holds, under three banners: the context read (`getRoute` and `t` destructured as stable references; `appSettings`, `answersLocked`, `selectedEntity`, `taskState` and `profileComplete` read on `contestantCtx` inside derived values); the three facts of the screen — `pending`, `allComplete`, `closedReason` — with `hasQuestionsTask` beside them; the title, the explanation and the note's condition; and the main action with the two row functions `rowIcon` and `statusSentence`.

## Every id and state attribute

| Element | `data-testid` | State attribute | Values |
|---|---|---|---|
| the `<ol>` | `contestant-home-tasks` | `data-task-state` | `pending` while `taskState.known` is false, `ready` otherwise |
| each `<li>` | `contestant-home-task` | `data-task` | `nomination`, `profile`, `questions` — the questions row is absent for a state with no questions task |
| each `<li>` | | `data-status` | `complete`, `incomplete`, `blocked`, `pending` |
| the nomination's button | `contestant-home-nomination` | none | always a link to the nominations view |
| the profile's button | `contestant-home-profile` | none | a link; disabled and described by the reason only while blocked |
| the questions' button | `contestant-home-questions` | none | the same |
| the badge's wrapper | `contestant-home-task-badge` | `aria-hidden="true"` | on an incomplete row: the task's count, or `!` when it has none |
| the status sentence | none: `<span class="sr-only">` inside the button | none | `taskStatus.complete`, `.incomplete`, `.incompleteCount`, `.blocked`; none while the status is not known |
| the preview entry | `contestant-home-preview` | `data-preview` | `open` or `closed`; disabled while closed; described by the reason while closed and a reason is rendered |
| the reason sentence | `contestant-home-closed-reason`, which is also its `id` | `data-reason` | `noNomination`, `previewNotReady`; absent when nothing is closed and while pending |
| the main action | `contestant-home-continue` | `data-next-step` | `nomination`, `profile`, `questions`, `preview`; absent on the loading form |
| the explanation | `contestant-home-status` | none | on the real explanation alone: present means the task state is known |
| the tip | `contestant-home-tip` | none | only when every task is complete |
| the note | `contestant-answers-locked-warning` | `data-reason="answersLocked"` (the component's) | only while answers are locked |

## How the pending state is rendered

`pending` is `!taskState.known`. For an entity that has a nomination it lasts until the question lists are loaded in the browser; an entity with no nomination is never pending.

- the list says `data-task-state="pending"`; the nomination row is complete (the check, `nomination.view`, the "completed" sentence); the profile and questions rows are links with their own icons and their "enter" labels, `data-status="pending"`, no badge, no status sentence, no description;
- the preview entry is disabled, `data-preview="closed"`, with no `aria-describedby`;
- **in the explanation's place:** `<p class="invisible text-center" aria-hidden="true">` holding the descriptor's `homeNotDone`;
- **in the reason's place:** `<p class="small-info invisible mt-sm text-center" aria-hidden="true">` holding `contestantApp.common.closedReason.preview`;
- neither paragraph has a test id or an id, so nothing carries `contestant-home-status`, `contestant-home-tip` or `contestant-home-closed-reason`;
- the main action is `<Button variant="main" loading>`: a `<button disabled>` showing `common.loading`, with no `href` and no `data-next-step`;
- the title is the greeting; no hero; the note, while answers are locked, holds its first sentence alone.

A state with no task (nothing known of the entity) is pending too: an empty list, the two place-holders and the loading button.

## Where each former helper export's work is done now

`contestantHome.helpers.ts` exported two functions and their types.

| Former export | Its work | Where it is done now |
|---|---|---|
| `computeNextAction` → `title` | the greeting, or the ready title once the profile is complete | the page's `title`, from `contestantCtx.profileComplete` and the selected entity's name |
| → `explanation` | `ingress.ready` or the caller's not-done key | the page's `explanation`, with the no-nomination sentence beside the two it had |
| → `tip` | the preview tip once complete | the page's `{#if allComplete}` paragraph |
| → `buttonTextBasicInfo`, `buttonTextQuestion` | view / edit / enter by lock, completeness and the two counts | `taskLabelKey(task, answersLocked)` on each row |
| → `buttonTextPrimaryActions`, `href` | the three cases: preview; questions when required info is done and opinions are not; otherwise the profile | `homeAction(taskState)` for the target, and the label of the row it names |
| `computeBadges` → `profile`, `questions` | a badge with the count while a count is above zero; the questions badge greyed while required info was outstanding | the row's badge from `task.count`, `!` when an incomplete task has none; nothing is greyed, because the questions row is no longer closed by the profile |
| the types `ContestantHomeMessageKey`, `…NotDoneKey`, `…RouteName`, `…Translate`, `…ResolveRoute`, `…NextAction`, `…NextActionInput`, `…Badge`, `…BadgeSet`, `…BadgeInput` | the helper's structural contract | gone with it; `TaskLabelKey`, `TaskRoute` and `HomeAction` of `$lib/contestant/tasks` are what the page reads |

The page's own former derivations — `missingInfoCount`, `missingOpinionCount`, `infoOutstanding`, `noOpinionQuestions`, `entityName`, `nextAction`, `badges`, `taskListShown` — are gone, and with them the imports of `opinionQuestionsStateOf` and of the store (`userData`). One difference in behaviour that follows from the helper's rule going: with required info answered and an opinion unanswered, the former page labelled the profile "Edit" through a special case; `taskLabelKey` gives the same label because the profile task is then complete.

## The journey's calls, as derived

`git grep -n -F "expectTasks(" -- tests/tests` at `4efe968ce` found four callers, all in `contestant-journey.spec.ts`, and the step's definition and one comment line in the fixture.

| Step | It asserted | It asserts |
|---|---|---|
| 6 — after the terms are accepted | `enabled: ['profile'], disabled: ['opinions', 'preview']` | `expectTaskList({ nomination: 'complete', profile: 'incomplete', questions: 'incomplete' })`, `expectPreview('closed')` |
| 11 — after signing in again | the same | the same as step 6 |
| 13 — after the profile is saved without its required field | the same | the same as step 6 |
| 19 — after the last opinion question | `enabled: ['profile', 'opinions', 'preview'], disabled: []` | `expectTaskList({ nomination: 'complete', profile: 'complete', questions: 'complete' })`, `expectPreview('open')` |

The titles of steps 6, 11 and 19, the comments of steps 6, 13 and 19 and four lines of the file's header step list say what the steps assert now. None of the four read the main action, so none asserts it. No other step depended on a disabled questions entry: the remaining mentions of "disabled" in the file are the login's submit button, the language item of the menu and the question page's save.

**Step 12 was not changed.** It still opens the nominations view by its address and then loads the home again before entering the profile. The home's nomination row now leads to that view inside the application for every entity, so the step could reach the view by the row and drop one load; the plan does not ask for it.

## Every other reader of the home found

By `git grep -n -e "contestantHomePage\." -e "contestant-home-" -e "contestant.home." -- tests/tests` at `4efe968ce`:

| Reader | Where | What it reads |
|---|---|---|
| `contestantEntityHomePage.expectLanded`, `expectQuestionsButton` | `perm-no-nomination` `dataset:` tests; Phase 175's organization-editing spec | `contestant-home-status` visible; `contestant-home-questions` present or absent |
| `contestantEntityPages.expectOnHome`, `clickHomeProfileEntry`, `clickHomePreviewEntry` | the `gate:`, `preview:`, `nominations:` and `home:` tests | the URL and `contestant-home-status`; a click on `contestant-home-profile` and on `contestant-home-preview` |
| the entity-selection composition root, `contestantNoQuestionsPage` fixture | the entity-selection spec; Phase 175's organization-editing spec | `contestant-home-status` visible |
| `contestantLogoutButton` fixture | the journey and others | `contestant-home-logout` |
| `registerAndStoreSession` with `settledTestId` | the setups of entity-selection, perm-no-nomination (×3) and perm-organization-editing (×3) | `contestant-home-status` visible |
| `contestant-a11y.spec.ts` | the `cand-home` scan entry and two waits | `contestant-home-status` as the content marker; `contestant-home-logout` |
| `contestant-entity-selection.spec.ts` | one test | `contestantHomePage.clickTask('opinions')` on an entity that has a nomination |
| `contestant-journey.spec.ts` | steps 5, 8, 9, 10, 12, 13, 13.5, 14, 19, 22 | `contestant-home-status` visible; `clickTask('profile')` ×3; `expectStatusMessage()` |
| `perm-closed-project.spec.ts`, `perm-localisation-positive.spec.ts` | three waits | `contestant-home-status` visible |
| `perm-no-nomination.spec.ts` | the three `home:` tests of plan 176-14 | the seven task-list steps |

Every one of them kept passing against the rebuilt page in the pre-commit run and the full run. Each wait on `contestant-home-status` now also waits for the task state to be known.

## Red and green (unit)

`page.svelte.test.ts`: 55 cases in six describes. The 15 no-nomination cases of plan 176-14 are byte for byte what they were (their three helpers moved to the module's scope). The 22 cases of the three-button rendering and the 2 "renders no task list" cases are out; 40 cases of an entity that has a nomination are in. The fake context lost its store entity and gained `previewOpen`; its `profileComplete` is the task state's `allComplete`, as the context derives it.

- **Red** — `tests/e2e-runs/176-unit/176-15-home-red.json`, on the tree of `742e8189a` (the test committed alone): 55 cases, **20 passed, 35 failed**, each an `AssertionError`. svelte-check on the same tree: 0 errors, 0 warnings, so the commit passes `check` on its own. ESLint, Prettier and the comment-hygiene guard: 0.
- **Green** — `176-15-home-green.json`, head `742e8189a` with the page uncommitted: **55 of 55**.
- The frontend's whole unit suite on the same tree: **3530 passed, 20 skipped, 0 failed** — 3543 before; 16 more in the page's test, and the deleted helper's cases gone (29, by difference).

Green in the red report by design: the 15 no-nomination cases, and five the former page already satisfied — the note's first sentence alone in the pending frame, the two rows of the hidden sentence that expect it absent, its absence once every task is complete, and no note while answers are not locked.

The first lines of the 35 failures, by kind: the task list not rendered (13); the greeting holding `?` where the entity's name is expected (4); the hidden sentence absent where it is expected (4); no `data-preview` on the preview entry (3); a badge not found (3); a row's button in no task row (2); no `data-next-step` on the main action (2); the explanation rendered where the pending frame holds none (2); the nomination's button not rendered (1); the main action a link where a disabled button is expected (1).

## The two controls (E2E)

Both were launched by `tests/e2e-runs/176-unit/176-15-control-launch.sh`, plan 14's launcher under this plan's name, through `176-15-after-load.sh`, which reads the load average first.

**Control A** — `tests/e2e-runs/176-e2e/176-15-control`, `--project perm-no-nomination`, head `4efe968ce` with `perm-no-nomination.spec.ts` alone uncommitted (kept as `176-15-control.perm-no-nomination.spec.ts`). 09:19:24Z to 09:26:54Z; AC power, 100 %; Docker VM free before: **18.50 GiB**. **226 total, 223 passed, 3 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 1; no void marker.

Verdict `control 176-15-control --project perm-no-nomination --setup data-setup-perm-no-nomination --dirty-only tests/tests/specs/perm/perm-no-nomination.spec.ts --red "home: with"`: **PASS**, exit 0.

| Red test | First error line | What failed |
|---|---|---|
| home: with a nomination and nothing filled in, the questions are open and the preview is not | `Error: expect(locator).toHaveAttribute(expected) failed` | `getByTestId('contestant-home-tasks')`, expected `"ready"`, element(s) not found after 10 s |
| home: with the profile filled in, the main action leads to the questions list | the same | the same locator |
| home: with everything answered every task is complete and the main action is the preview | the same | the same locator |

The dataset fields the tests read: the grant `NOMINATED_CANDIDATE_GRANT` (`ca-nominated`); `setNominationState(…, 'confirmed')`; `setAnswers` over `REQUIRED_INFO_QUESTION_EXTERNAL_ID` (`qu-info-req`, the one required info question) and `OPINION_QUESTION_EXTERNAL_IDS` (`qu-opin-1`, `qu-opin-2`). The counts asserted — 1 on the profile row, 2 on the questions row — are those.

**Control B** — `tests/e2e-runs/176-e2e/176-15-control-journey`, `--project contestant-journey`, head `4efe968ce` with both specs uncommitted (kept beside the run). 09:27:23Z to 09:27:57Z; AC power; Docker VM free before: **18.43 GiB**. **5 total, 4 passed, 1 failed, 0 flaky, 0 did not run.** Wrapper exit 1; no void marker.

Verdict `control 176-15-control-journey --project contestant-journey --setup data-setup-contestant-journey --dirty-only tests/tests/specs/perm/perm-no-nomination.spec.ts --dirty-only tests/tests/specs/contestant/contestant-journey.spec.ts --red "full candidate journey end-to-end"`: **PASS**, exit 0.

| Red test | First error line | What failed |
|---|---|---|
| candidate journey › full candidate journey end-to-end | `Error: expect(locator).toHaveAttribute(expected) failed` | in step 6, `getByTestId('contestant-home-tasks')`, expected `"ready"`, element(s) not found after 10 s, at `contestantHomePage.fixture.ts:128` |

## The pre-commit run and both verdicts

`tests/e2e-runs/176-e2e/176-15-precommit`, `--project perm-no-nomination`, head `742e8189a` with six paths uncommitted: the page, the two deleted helper files, the fixture and the two specs (the four changed files are kept beside the run as `176-15-precommit.+page.svelte.kept`, `176-15-precommit.contestantHomePage.fixture.ts.kept` and the two `.spec.ts` copies, and were compared byte for byte with the working tree by the commit script). 09:31:10Z to 09:38:53Z; AC power; Docker VM free before: **18.41 GiB**. **226 total, 226 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 0. At its head the page imported the helper and the spec held no `home: with` test.

- `control 176-15-precommit --project perm-no-nomination --setup data-setup-perm-no-nomination --dirty-only apps/frontend/src/routes/contestant/ --dirty-only tests/tests/ --green --were-red-in 176-15-control`: **PASS**, exit 0 — "was red, now passed" for each of the three `home: with` tests; `perm-no-nomination: 29 test(s), 29 passed`.
- the same with `--were-red-in 176-15-control-journey`: **PASS**, exit 0 — "was red, now passed: candidate journey › full candidate journey end-to-end".

The projects of its chain that land on a home: `contestant-journey` 1 of 1, `contestant-a11y-scan` 22 of 22, `contestant-entity-selection` 8 of 8, `perm-organization-editing` 46 of 46, `perm-answers-locked` 4 of 4, `perm-localisation-positive` 2 of 2, `perm-no-nomination` 29 of 29. Nothing had to be settled in another spec, and the run was made once.

## The code review checklist

Over the page, its test, the fixture and the two specs' changes.

| Item | Outcome |
|---|---|
| Solves the issue | Yes: NOM-01's list for every entity, the home's half of TASK-01 (one state, no rule of the page's own), and the questions open on the home with the nomination. |
| OWASP top 10 | The entity's name reaches the heading as a message parameter rendered as text; no raw-HTML block. No input, read, route or write was added. |
| Code style guide; no `any` | Followed; none. Every derived value and both functions of the page carry TSDoc. |
| No repeated code | The duplication plan 176-14 left open is closed: one rendering, one preview entry, one primary-actions wrapper, and the helper that overlapped `homeAction` and `taskLabelKey` is deleted. Still there: `TASK_TEST_ID` in the page holds three literals the tests' registry also holds, as every page's markup does. The profile and the questions pages each decide their own "hidden" sentence; the home's is now a third form of that rule, read from the task state. |
| New entities documented | The `@component` docstring says what the page shows in each state, that it reads the context's task state, the two settings and the list's accessibility. TSDoc on the fixture's remaining type. |
| Repo documentation | No page under `apps/docs` names the home's markup, its ids, its helper or the fixture's step (searched for `contestantHome.helpers`, `computeNextAction`, `computeBadges` and `contestantHomePage` outside the routes and the tests: nothing). |
| Tracking events | None: nothing a user can perform was added. The rows, the preview entry and the main action are links, as the three buttons were. |
| Svelte component guidelines | No new component. `Button`, `InfoBadge`, `MainContent` and `HeroEmoji` are unchanged. No reactive accessor is destructured; `$derived(contestantCtx.taskState)` aliases a state the context replaces whole. No branch on the entity's type; no view-transition name. |
| Errors handled and logged | Nothing that can throw was added. |
| Failing checks | None. svelte-check, ESLint, Prettier, the tests' type-check and the comment-hygiene guard were 0 before each commit. The first red unit report failed on a `TypeError`, not on expectations, and was taken again after the fake context was corrected (deviation 3). |
| Shared dependents | Every project that lands on a home is green in the pre-commit run and in the full run; every committed wait on `contestant-home-status` now waits for a known state. |
| WCAG A/AA; keyboard and screen reader | One `<h1>` in every state (cases for each). The list is an `<ol>` named by `aria-label`, its rows `<li>`s holding one button each (cases). A row's name holds its status once: the sentence is inside the button and the badge is `aria-hidden` (cases for complete, counted, uncounted and blocked rows). A closed preview is `role="button"`, `aria-disabled="true"`, without `href`, `tabindex="-1"`, described by the reason sentence (a case; the E2E step reads the description the browser computes). The reason follows the entries it explains (cases). The place-holders are `aria-hidden` and `invisible`, so neither is read or seen. No motion added. The existing `cand-home` scan passes in both themes. **Not exercised with a screen reader**; the WebKit question of plan 176-14 stands. |
| Developers' and Publishers' Guides | Not touched. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every comment, docstring and title was read: none tells history or names a decision, plan or proposal. |
| Commit history | The red test, then the one feature commit. No `[db]` change. No commit fixes an earlier one of this plan. |

No finding changed the page after its checks, so the page the pre-commit run ran is the page committed.

## The gate rows and the full run

**Gate rows** — `tests/e2e-runs/176-gates/176-15-close`, head `540b8d1c9`, 09:39Z to 09:42Z: `typecheck=0 lint=0 unit=0 check-frontend=0 build=0 format=0`; not stale; no Sleep entry inside the run's window. Verdict `gates 176-15-close --rows typecheck,lint,unit,check-frontend,build,format`: **PASS**, exit 0. Docker VM free before: 18.34 GiB.

**The full run** — `tests/e2e-runs/176-e2e/176-15-close`, through the driver with `--require-project perm-no-nomination`. Head `540b8d1c9`. 09:42:28Z to 09:51:29Z. Driver exit **0**. Docker VM free before: **18.31 GiB**; after: 18.21 GiB. AC power, 100 %; `sleep_entries_in_window: 0`. Judged at once with the plan's command: exit **0**.

```
run: tests/e2e-runs/176-e2e/176-15-close
counts: total 300, passed 300, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
scope: the full default suite
not stale: head 540b8d1c9 is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project perm-no-nomination: 29/29 passed
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project perm-organization-editing: 46/46 passed
project contestant-entity-selection: 8/8 passed
compared with: tests/e2e-runs/176-e2e/176-14-close
per project: 113 compared, 0 not as expected
176-verdict e2e 176-15-close: PASS
```

Against `176-14-close` (297 tests): `perm-no-nomination` 29 against 26 ("above 26: holds"); each of the other 112 projects at its total. No axe finding; no overflow. Nothing was red, flaky or left unrun, and the run was made once.

## The host's load before each run

`sysctl -n vm.loadavg`, read by `176-15-after-load.sh` before it started each run and again at its end; kept as `tests/e2e-runs/176-unit/<tag>.loadavg.txt`.

| Run | Readings before the start (1 / 5 / 15 min) | At the end |
|---|---|---|
| control A | 09:18:22Z 38.61 / 79.13 / 67.88 — waited; 09:19:22Z 19.24 / 66.08 / 63.76 — started | 5.89 / 21.83 / 41.74 |
| control B | 09:27:21Z 5.25 / 20.17 / 40.45 | 5.34 / 18.56 / 39.05 |
| the pre-commit run | 09:31:08Z 9.01 / 13.93 / 32.94 | 15.39 / 14.23 / 25.11 |
| the gate rows | 09:39:09Z 14.28 / 14.06 / 24.86 | 12.23 / 13.12 / 22.25 |
| the full run | 09:42:28Z 10.96 / 12.82 / 22.04 | 12.62 / 12.19 / 17.48 |

At the plan's first command, 09:17Z, the 1-minute figure was 107.95; it had fallen to 38.61 a minute later without anything of this plan's doing. The red-gates and green-gates scripts of Task 2 (svelte-check and vitest) ran between control B and the pre-commit run; the 1-minute figure read before them was 5.59 and 4.37.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] "Pending" is read from `taskState.known`, not from "a task without a status"**
- **Found during:** Task 2, step 2
- **Issue:** the plan derives the pending fact as "a task without a status". A state with no task at all — nothing known of the entity — has no such task, so by that wording it would not be pending, and the page would render a real explanation, under the status id, from a state that is not known.
- **Fix:** `pending` is `!taskState.known`. For every state `taskStateOf` can give, the two readings agree except on the empty one, which is now pending.
- **Files modified:** the page
- **Commit:** `540b8d1c9`

**2. [Rule 2 - Correctness] The note's second sentence is decided from the task state**
- **Found during:** Task 2, step 2
- **Issue:** the plan keeps the sentence "on the existing condition", which was `infoOutstanding || (the setting && an opinion is unanswered)` over two counts the page read from the context — the count rule the plan removes and its verify forbids by name.
- **Fix:** the page reads the same two facts from the task state: the profile task carries a `count` (a required info question is unanswered), or the questions task is `incomplete` and the setting hides the entity's type. Both are false for an entity with no nomination and for a state that is not known, which is what the UI contract asks.
- **Flagged:** this is a read of `task.count` in the page, for a sentence and not for a status, a disabling or a target. Whether it sits inside PROH-176-39 as the planner meant it is a judgment; the alternative is a member of the task state that says "required info is missing".
- **Files modified:** the page
- **Commit:** `540b8d1c9`

**3. [Rule 1 - Bug] The first red unit report failed on a `TypeError`**
- **Found during:** Task 2, step 1
- **Issue:** the rewritten fake context no longer held `opinionQuestions` and `questionsReady`, which the former page read; 40 cases failed on `Cannot read properties of undefined (reading 'length')`, which is not a failed expectation.
- **Fix:** the fake context holds both, empty and not loaded, with a comment that says why they are there: every case's expectation follows from the task state, so a page that read a list in its place would find nothing in it. The report was taken again: 35 failures, each an `AssertionError`. Nothing had been committed.
- **Files modified:** the page's test
- **Commit:** `742e8189a`

### Other departures

- **`ContestantHomeTask` stays in the fixture.** `clickTask` takes it (`'profile' | 'opinions' | 'preview'`) and is called by the journey (×3) and the entity-selection spec (×1). The step `expectTasks` is gone; the type gained a TSDoc line. Removing the type as well means re-typing `clickTask` to the list's own vocabulary and changing the entity-selection spec, which the plan does not list.
- **The greeting of an entity with no name is "Hello, !".** The plan's verify forbids the placeholder character in the page, and the catalogue has no greeting without a name. Page data can hold an empty name for a party with no name in the request's locale or the default one.
- **No figure is rendered outside the all-complete state.** The former page rendered an empty `<figure role="presentation">` in every state. The hero snippet is declared at the page's top level and handed to `MainContent` only when every task is complete.
- **The spec's first test asserts two things beyond the plan's list:** no badge on the nomination row, and that the closed preview is described by the reason sentence (`expectClosedEntryDescribed('preview')`), which is the browser-side half of T-176-88.
- **The spec's header and the journey's header changed** beside the tests: the meaning of the `home:` prefix, and four lines of the journey's step list.
- **The red unit report's head was written after the test's commit**, from a report taken on the same tree before it.
- **Runs were launched through a script of this plan's own**, `176-15-after-load.sh`, which polls the load average every 60 s for at most 30 minutes before starting a command, as the dispatch asks.
- **The fake context holds two members nothing in the new page reads** (deviation 3).

## Not done, or not verified

- **The page was not looked at in a browser by eye.** No dev server may be started outside the wrapper. What is known of its look is the UI contract's classes, written as given. Two things follow from the markup and were not measured: when the state becomes known, the rows keep their place only if the real explanation wraps to as many lines as the place-holder (they hold the same sentence for a party or candidate with something left, and differ for an entity asked no opinion question and for the all-complete state, which also gains the hero and the tip); and the loading button is replaced by a link of another width.
- **No screen reader was run.**
- **The greeting of a long party name at 320 px** — the plan's one backstop truth — was not measured. The heading is `MainContent`'s own `<h1>`, unchanged.
- **Which state the existing `cand-home` scan lands on was not read.** It passed in both themes; whether its candidate has something left or nothing was not looked up, so it is not established that both the reason sentence and the hero have been scanned. The pending frame is scanned by nothing, by design. Plan 176-18 owns the new scans.
- **The selected entity's name against the entity-level load's data (the plan's ruling 4).** The page reads the selected entity in every state. No case was found or sought in which the two differ.
- **The WebKit question of plan 176-14** (list semantics of a `list-style: none` list) is as it was.
- **`STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` were not read for sentences this plan made false.**
- Nothing was appended to `.planning/WINDOWS.md`: no stub, no skipped test, no verify left unrun.

## What U-02's fallback would change here

Under U-02's fallback the questions task leads to the first unanswered question, not to the questions list. No line of the page changes: it reads `task.route` and `homeAction`. By title:

- `perm-no-nomination.spec.ts` › `home: with the profile filled in, the main action leads to the questions list` would assert the first unanswered question (and its title would say so).
- `page.svelte.test.ts` › `with only the questions left, shows the profile complete and leads the main action to the questions list`, and the two `shows the … row as …` cases that assert the questions row's `href`, are built by `taskStateOf` and would follow it; their expected routes would change.
- `contestant-journey.spec.ts` presses no main action of the home towards the questions. Its steps 14 and 15 reach the questions list through the profile's save, which reads the same route: step 15's `expectIntroMessage` and `clickStart` would be rewritten.

## For plan 176-16 (the menu)

- **The two reasons, as the home decides them** — the menu can read the same from `contestantCtx.taskState`: `noNomination` while the nomination task is `incomplete`; `previewNotReady` while `taskState.known` and `!taskState.previewOpen`; none otherwise, and none while the state is not known. The preview's sentence is `contestantApp.common.closedReason.preview`, or `…previewNoQuestions` when the state lists no questions task.
- The home's reason sentence has the id and the test id `contestant-home-closed-reason`; the menu's own is `contestant-nav-closed-reason`. Both can be on screen at once with the menu open, so the two ids must stay distinct.
- With a nomination the questions entry is never closed on the home. A menu that still disables it on missing required info disagrees with the home.

## For plan 176-17

- The home reads `contestantCtx.profileComplete` for "every task complete" and nothing else for it; `LogoutButton` under the main action is unchanged and still reads the two unanswered lists itself.
- The fixture's `clickTask` still speaks `'profile' | 'opinions' | 'preview'`; the task list's steps speak `'nomination' | 'profile' | 'questions'`. `expectTasks` is gone: a new assertion of the home's entries is `expectTaskList`, `expectPreview`, `expectReason` and `expectNextStep`.
- The journey's steps 6, 11, 13 and 19 assert the list. Step 12 still loads the home a second time after the nominations view.

## For plan 176-18 (scans and widths)

- **Markers.** `contestant-home-status` is on the real explanation alone, in all three known states: visible means the task state is known. `contestant-home-tasks[data-task-state="ready"]` says the same of the list. `contestant-home-closed-reason[data-reason]` tells the no-nomination home from the home with something left; `contestant-home-tip` is there only when every task is complete.
- **States a scan can set up on the `perm-no-nomination` dataset** with `setNominationState` and `setAnswers`: none → the no-nomination home; `confirmed` with `{ requiredInfo: false, opinions: 'none' }` → the list with two counts and the preview's reason; `{ requiredInfo: true, opinions: 'all' }` → the ready home with the hero and the tip.
- **The pending frame** holds two `p.invisible[aria-hidden="true"]` and a disabled loading button; it lasts until the question lists are loaded and is not reachable as a settled state.
- Disabled labels are `text-neutral/20`, as before. The reason sentence is `small-info` and the explanation plain text, in no warning colour.
- The greeting at 320 px with a long party name is not measured (above).

## For plan 176-19

- The docs hold nothing of the home's helper or of the fixture's removed step (searched).
- The `home:` prefix in `perm-no-nomination.spec.ts` now covers six tests: three of an entity with no nomination and three whose titles begin `home: with`.
- **Counts:** a one-project run of `perm-no-nomination` is 226 tests, 29 its own; the full run is 300 in 113 projects; the frontend unit suite is 3530 passed and 20 skipped; each message catalogue still holds 649 keys — every message the page reads was already there.

## For Phase 177

**What the nomination row's label and target are decided by.** Both come from `$lib/contestant/tasks/taskState.ts`, not from the page:

- **The label** — `taskLabelKey(task, answersLocked)`: for the nomination task, `contestantApp.home.nomination.view` ("View your nominations") when its status is `complete` and `contestantApp.home.nomination.enter` ("Define your nomination") otherwise. Neither the answers lock nor the nominations lock is read for it.
- **The status** — `taskStateOf`: `complete` when the entity has at least one nomination, confirmed or not (`hasNomination`, read from page data); `incomplete` otherwise. It is never blocked and never without a status once the entity is known.
- **The target** — the task's `route`, `{ route: 'ContestantAppNominations' }` in every state, which the page hands to `getRoute.current`.
- **The main action** names the nomination only while it is the first incomplete task; its label is the row's.

A phase that lets a user define a nomination changes what the view at that route offers; the row, its label keys and its target need no change for that. A label for "a nomination is defined and awaits confirmation" would be a new branch in `taskLabelKey`.

## For Phase 179

**The home as built, and the slots of its frame.** `MainContent` gives the page four places; the page fills them so:

| Slot of `MainContent` | What the home puts there | When |
|---|---|---|
| `note` — a wrapper with `role="note"`, above the hero and the title, centred, `text-secondary`, `max-w-xl` | `NotEditableNote reason="answersLocked"` with an optional second sentence and one Contact support button | only while answers are locked; the wrapper is rendered empty otherwise |
| `hero` | the success emoji in a `<figure role="presentation">` | only when every task is complete |
| the title | one `<h1 tabindex="-1">`: the greeting, or the ready title | always |
| the default content, a centred column of `max-w-xl` | in order: the explanation; the tip; the task list `<ol>`; the preview entry; the reason sentence | the explanation and the reason by state, as above |
| `primaryActions` | the main action, and the logout button under it | always |

There is no slot for a reminder about an unconfirmed address, and none was built. The `note` slot holds one thing, the lock note, and its wrapper is one `role="note"` region: a second note placed in it would share the region and precede the title in reading order. The places in the default content are, top to bottom, between the title and the explanation, between the explanation (or the tip) and the list, and under the reason sentence; the list, the preview entry and the reason sentence belong together, since the reason is the description of the entries above it. The title does not name the entity once every task is complete.

## The state the local database is left in

Not reset by this plan: the gate rows named no database row. The stack is up; neither it nor Docker was restarted; nothing pruned but the build cache, by the E2E driver. Read with `psql` after the full run: 3 projects; 2 auth users; 377 nominations (the default project's dataset); no candidate row of an E2E dataset left; `private.invitation_link_witness` holds 156 rows, so `39-invitations.test.sql` test 238 is red on this database without a reset — the known finding. Nothing listens on the wrapper's port and no run is in flight. Docker VM free: 18.21 GiB.

## Files touched that the plan did not list

None. Listed and touched: all seven (five changed, two deleted).

Gitignored evidence: `tests/e2e-runs/176-e2e/176-15-control`, `176-15-control-journey`, `176-15-precommit` and `176-15-close`, each with its launch records, kept copies and verdict beside it; `tests/e2e-runs/176-gates/176-15-close`; in `tests/e2e-runs/176-unit/`: `176-15-home-red.{json,head,log}`, `176-15-home-green.{json,head,log,status}`, `176-15-frontend-unit.json`, `176-15-t<N>-verify.sh` with `.log`, `.exit` and `.head`, `176-15-commit-*.{sh,log}`, `176-15-control-launch.sh`, `176-15-after-load.sh`, `176-15-t2-red-gates.*`, `176-15-t2-green-gates.*`, the `*.loadavg.txt` readings, the run markers and the verdict logs. Nothing under `tests/e2e-runs/` was deleted.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. T-176-53: nothing of the complete state and no blocked row is rendered while `taskState.known` is false; cases for the pending frame, for the frame that follows it and for the no-nomination frame. T-176-54: the page reads the task state, `homeAction` and `taskLabelKey`; the helper is deleted; the verify's negative search finds none of its names. T-176-87: the name is a message parameter rendered as text. T-176-88: the closed preview is a disabled button with a role, described by the reason sentence — a component case, and `expectClosedEntryDescribed('preview')` in a browser. T-176-57: one commit of the page, the deletion, the fixture and both specs, made after both green verdicts on the uncommitted tree.

## Self-Check: PASSED

Checked after writing:

- The five files named under `key-files.modified` exist and are tracked; the two under `key-files.deleted` are absent from the working tree and from the index; `git diff --quiet HEAD -- . ':(exclude).planning'` exits 0.
- `742e8189a` and `540b8d1c9` are ancestors of HEAD; `git rev-list --count 4efe968ce..HEAD` was 2 before this file's commit, read from the ledger file written at the plan's start.
- `176-15-t1-verify.sh.exit`, `176-15-t2-verify.sh.exit` and `176-15-t3-verify.sh.exit` each hold 0.
- The red report holds 35 failed of 55 and the green report 0 failed of 55.
- `git grep -F "expectTasks(" -- tests/tests` and `git grep -F "contestantHome.helpers" -- apps/frontend/src` each print nothing.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` have no difference between `4efe968ce` and HEAD.
- `git status --short` holds the operator's two entries and this file, and nothing else.
