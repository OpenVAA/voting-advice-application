---
phase: 176-contestant-home-task-state-nominations-view
plan: 03
subsystem: frontend
tags: [task-state, pure-helper, contestant, unanswered, continue-targets, preview-rule, u-01, u-02, tdd]

requires:
  - phase: 176-contestant-home-task-state-nominations-view
    provides: "plan 176-01: `## Operator rulings as read` in 176-BASELINE-FACTS.md (C1 and C2 at the recommendation)"
  - phase: 175-organization-editing-profile-questions-preview
    provides: "the three derivations of the contestant context that the filters are lifted from; the caller contract of contestantHome.helpers.ts"
provides:
  - "apps/frontend/src/lib/contestant/tasks/taskState.ts: the task state, hasNomination, previewOpenOf and the five Continue targets"
  - "apps/frontend/src/lib/contestant/tasks/unanswered.ts: requiredInfoQuestionsOf and unansweredQuestionsOf, rune-free"
  - "apps/frontend/src/lib/contestant/tasks/index.ts: the barrel"
affects: [176-05, 176-06, 176-08, 176-10, 176-12, 176-14, 176-15, 176-17, 177, 179]

actuals:
  tokens: 17425 # chars/4 over `git diff 746714c56 HEAD -- apps/frontend/src/lib/contestant/tasks` (69702 chars)
  tasks: 2
  commits: 5 # MEASURED: git rev-list --count 746714c56..HEAD -- apps/frontend/src/lib/contestant/tasks. The range without the pathspec counted 8 when this file was written: three are plan 176-02's, made in the same checkout
plan_head_before: 746714c56cbbf18b70848911969f2700ed4a86da
plan_head_after: 11afab973c84536a4e475b7f2de2d25067805c30 # this plan's last code commit; HEAD when this file was written was 3bd66ff39695173826297a0e327f4f7fe089800f, a commit of plan 176-02

tech-stack:
  added: []
  patterns:
    - "A pure helper that imports nothing: route names and message keys as structural literal unions, routes returned as descriptors"
    - "A fact the save destroys is read before the save and passed beside the state read after it"
    - "A rule's order is proved by an input that throws when a member outside the allowed ones is read"

key-files:
  created:
    - apps/frontend/src/lib/contestant/tasks/taskState.ts
    - apps/frontend/src/lib/contestant/tasks/taskState.test.ts
    - apps/frontend/src/lib/contestant/tasks/unanswered.ts
    - apps/frontend/src/lib/contestant/tasks/unanswered.test.ts
    - apps/frontend/src/lib/contestant/tasks/index.ts
  modified: []

key-decisions:
  - "U-01 and U-02 are built at their recommended option: C1 and C2 both read `recommended-unticked (a)`"
  - "A save on a question page in a state that is not known leads back to the questions list as a return: nothing is decided from an unknown state"
  - "The save target's table pins the edit that does not lead on, on a state the U-01 fallback leaves alone, so that the fallback changes one row"
  - "taskStateOf passes its input unchanged to previewOpenOf, so the state and a server gate calling the rule directly cannot disagree"

requirements-completed: []

duration: about 18 min
completed: 2026-10-09
status: complete
---

# Phase 176 Plan 03: The Task State, its Predicates and the Five Continue Targets — Summary

**The entity's tasks, the next step, the preview's rule and the target of each of the five Continue buttons are pure functions in `lib/contestant/tasks/` with a case table each (148 unit cases, all green, each table red first); "not known" and "no nomination" are decided before any count is read, proved by inputs that throw when read; U-01 is one branch with one table row and U-02 one assignment with six rows, each swap measured by applying the fallback.**

Everything below was measured in this session unless it says "read" or "not established".

## Read this first

1. **Both tasks are done and both verify blocks exit 0.** Nothing imports the two modules yet; the proof is the unit files alone, as the plan says.
2. **U-01 and U-02 are built at the recommended option, not a fallback.** `## Operator rulings as read` in `176-BASELINE-FACTS.md` reads `C1: recommended-unticked (a)` and `C2: recommended-unticked (a)`. Sections C and D of the operator's document are unchanged between the commit it was read at (`abb5e1ddc`) and this plan's base (`git diff abb5e1ddc 746714c56` touches section E and the totals alone).
3. **There are five commits, not four.** The test file of Task 2 was revised once after its first red commit and before the implementation was committed (deviation 1). The red report beside the verify is of the revised file; the first is kept.
4. **One behaviour of the recommended option is settled here because no source states it:** a save on a question page while the state is not known leads to the questions list, as a return (deviation 3).
5. **The route `ContestantAppNominations` and the keys `contestantApp.home.nomination.enter` / `.view` are not on the tree.** `apps/frontend/src/lib/routes/route.ts` holds no occurrence of the route and `contestantApp.home.json` no `nomination` key. This module names them as structural literals; a page's route builder and translation function accept them only once the plan that adds them has run.

## Performance

- **Duration:** about 18 min (00:36Z → 00:54Z)
- **Tasks:** 2 of 2
- **Files:** 5 created, all under `apps/frontend/src/lib/contestant/tasks/`; none modified

## Task Commits

| # | Commit | Subject | Task |
|---|---|---|---|
| 1 | `35a3e0ad2` | `test(176-03): which questions are required and which have no saved answer` | 1, red |
| 2 | `2d5a30bb6` | `feat(176-03): the unanswered filters as a module a server load can import` | 1, green |
| 3 | `8a7716fff` | `test(176-03): the task state, its predicates and where each Continue leads` | 2, red |
| 4 | `c72f5ea18` | `test(176-03): an edit of an answered question never leads on, stated on a state with a next step` | 2, red revised |
| 5 | `11afab973` | `feat(176-03): one pure task state with the next step, the preview's rule and the five Continue targets` | 2, green |

Each was made by pathspec, after `yarn assert:comment-hygiene`, ESLint and Prettier had each exited 0: for the last three in the commit's own `&&` chain, for the first two read from the command before it. Three commits of plan 176-02 lie between and after them (`437bac4b1`, `1119638e1`, `3bd66ff39`); none touches a file of this plan.

## Each verify, with its real exit status

Both `<automated>` blocks were written to script files by a script that reads the plan file, byte for byte, and run with `bash`. Evidence: `tests/e2e-runs/176-unit/176-03-t<N>-verify.sh` / `.log` / `.exit` / `.head`.

| Verify | Head | Exit |
|---|---|---|
| Task 1, as written | `2d5a30bb6` | **0** |
| Task 1, as written, again at this plan's last commit | `11afab973` | **0** |
| Task 2, as written | `11afab973` | **0** |

The plan's own three `<verification>` lines are stages of Task 2's block: the directory's unit run (2 files, 148 cases, exit 0), no `import` line in `taskState.ts` (the search exits 1), ESLint and Prettier on the directory (each 0).

## Red and green

| File | Red: head, total, failed | Green: head, total, failed |
|---|---|---|
| `unanswered.test.ts` | `35a3e0ad2` · 27 · **24** | `2d5a30bb6` · 27 · **0** |
| `taskState.test.ts` | `c72f5ea18` · 121 · **71** | `11afab973` · 121 · **0** |
| `taskState.test.ts`, first red (kept as `176-03-taskstate-red-r1.*`) | `8a7716fff` · 122 · 72 | — |

Every red failure is an `AssertionError` on an expectation: the stub modules type-check and import, so no case fails at import (a type check of the five files alone at each red head exits 0; see deviation 4).

**What was red.** In `unanswered.test.ts`, everything but the three cases an empty answer satisfies (an empty list in, and "every question is answered"). In `taskState.test.ts`, by group: `taskStateOf` 25 of 35, `hasNomination` 2 of 5, `previewOpenOf` 1 of 5, `taskLabelKey` 19 of 23, `homeAction` 6 of 8, `profileSaveTarget` 1 of 8, `questionsResumeRoute` 2 of 7, `questionSaveTarget` 9 of 13, `nominationsViewTarget` 6 of 8. The 50 that passed on the stub are the rows whose expected value is the "not known" value itself, seven of the ten sweeps and one of the three read-order cases, which hold over a state with no task, the eight freshness cases and the barrel case.

## The exported names

### `unanswered.ts` — imports `getCustomData` (`@openvaa/app-shared`) and `isEmptyValue` (`@openvaa/data`), nothing else

```ts
export type RequirableQuestion = { readonly required: boolean; readonly customData?: object };
export type AnswerableQuestion = { readonly id: string };
export type SavedAnswers = Readonly<Record<string, { readonly value?: unknown } | null | undefined>>;

export function requiredInfoQuestionsOf<TQuestion extends RequirableQuestion>(
  infoQuestions: ReadonlyArray<TQuestion>
): Array<TQuestion>;

export function unansweredQuestionsOf<TQuestion extends AnswerableQuestion>(
  questions: ReadonlyArray<TQuestion>,
  answers: SavedAnswers | null | undefined
): Array<TQuestion>;
```

- `requiredInfoQuestionsOf` — a new array of the questions that are `required` and whose custom data is not `locked`, in the order given.
- `unansweredQuestionsOf` — a new array of the questions whose saved value is empty by `isEmptyValue`. **With no answers object (`undefined` or `null`) every question is unanswered**: the one statement of "no entity loaded". A caller passes `savedEntityData?.answers`.
- Both return the caller's own question type and the caller's own question objects, and change nothing they are handed.
- **Checked against the real types:** `Array<AnyQuestionVariant>` and an answers map of `LocalizedAnswer | null` are accepted, and each call returns `Array<AnyQuestionVariant>` (a scratch file outside the repository, `tsc` exit 0, with an `@ts-expect-error` control on a list without ids).

### `taskState.ts` — no `import` statement

```ts
export type TaskId = 'nomination' | 'profile' | 'questions';
export type TaskStatus = 'complete' | 'incomplete' | 'blocked';
export type TaskRoute =
  | { route: 'ContestantAppNominations' }
  | { route: 'ContestantAppProfile' }
  | { route: 'ContestantAppQuestions' }
  | { route: 'ContestantAppQuestion'; questionId: string }
  | { route: 'ContestantAppEntityHome' }
  | { route: 'ContestantAppPreview' };
export type Task = { id: TaskId; status: TaskStatus | undefined; route: TaskRoute; resume?: TaskRoute; count?: number };
export type NextStep = { task: TaskId; route: TaskRoute };
export type TaskState = {
  tasks: ReadonlyArray<Task>;
  nextStep: NextStep | undefined;
  previewOpen: boolean;
  known: boolean;
  allComplete: boolean;
};
export type TaskStateInput = {
  entityKnown: boolean;
  hasNomination: boolean;
  questionsReady: boolean;
  unansweredRequiredInfoCount: number;
  requiredNameMissing: boolean;
  opinionCount: number;
  unansweredOpinionCount: number;
  firstUnansweredOpinionId: string | undefined;
};
export type PreviewOpenInput = Pick<TaskStateInput, 'hasNomination' | 'unansweredRequiredInfoCount' | 'unansweredOpinionCount'>;
export type TaskLabelKey =
  | 'contestantApp.home.nomination.enter' | 'contestantApp.home.nomination.view'
  | 'contestantApp.home.basicInfo.enter' | 'contestantApp.home.basicInfo.edit' | 'contestantApp.home.basicInfo.view'
  | 'contestantApp.home.questions.enter' | 'contestantApp.home.questions.edit' | 'contestantApp.home.questions.view';
export type ContinueTarget = { route: TaskRoute; continues: boolean };
export type HomeAction =
  | { kind: 'pending' }
  | { kind: 'task'; task: TaskId; route: TaskRoute }
  | { kind: 'preview'; route: TaskRoute };
export type QuestionSaveFacts = { wasUnanswered: boolean };

export function hasNomination(nominations: ReadonlyArray<unknown> | null | undefined): boolean;
export function previewOpenOf(facts: PreviewOpenInput): boolean;
export function taskStateOf(input: TaskStateInput): TaskState;
export function taskLabelKey(task: Pick<Task, 'id' | 'status'>, answersLocked: boolean): TaskLabelKey;
export function homeAction(state: TaskState): HomeAction;
export function profileSaveTarget(state: TaskState): ContinueTarget;
export function questionsResumeRoute(state: TaskState): TaskRoute | undefined;
export function questionSaveTarget(state: TaskState, facts: QuestionSaveFacts): ContinueTarget;
export function nominationsViewTarget(state: TaskState): ContinueTarget | undefined;
```

| Name | What it returns |
|---|---|
| `hasNomination` | `true` for a list with at least one element; `false` for an empty list, `null` and `undefined`. Confirmed or not is not asked. |
| `previewOpenOf` | `hasNomination && unansweredRequiredInfoCount === 0 && unansweredOpinionCount === 0`. No name flag. The counts must be those of loaded lists. |
| `taskStateOf` | The state, by the four rules below. |
| `taskLabelKey` | Nomination: `.view` once complete, otherwise `.enter`, with or without the answers lock. Profile and questions: `.view` for every status while answers are locked; otherwise `.edit` once complete and `.enter` while incomplete, blocked or without a status. |
| `homeAction` | `pending` while the state is not known; else the next step as `{ kind: 'task', task, route }`; else `{ kind: 'preview', route: ContestantAppPreview }`. |
| `profileSaveTarget` | The next step's route with `continues: true` when the next step is the questions; otherwise the entity's home with `continues: false` — the profile still incomplete, everything complete, no nomination, or not known. |
| `questionsResumeRoute` | The questions task's `resume`, or `undefined` — none unanswered, no questions task, blocked, or not known. |
| `questionSaveTarget` | In order: a question is unanswered → that question, a continue; the saved question was already answered, or the state is not known → the questions list, a return; otherwise the next step's route, or the entity's home when there is none, a continue. |
| `nominationsViewTarget` | `undefined` while the state is not known; the entity's home, a return, when there is no next step or the next step is the nomination; otherwise the next step's route, a continue. |

`ContinueTarget.continues` is the label's kind: `true` for `common.saveAndContinue` / `common.continue`, `false` for `common.saveAndReturn` / `common.return`. Which of each pair is the caller's (`userData.hasUnsaved`).

Names beyond the plan's contract: `PreviewOpenInput`, `TaskLabelKey`, `HomeAction`, `QuestionSaveFacts`, and in `unanswered.ts` the three surface types. Each names a shape the contract describes without naming.

## The order of the rules in `taskStateOf`

The first that applies decides; each is a commented step in the function.

1. **`!entityKnown`** → `{ tasks: [], nextStep: undefined, previewOpen: false, known: false, allComplete: false }`. Nothing else is read.
2. **`!hasNomination`** → nomination `incomplete` (→ `ContestantAppNominations`), profile `blocked`, questions `blocked` and listed, no count and no `resume` on either; next step the nomination; preview closed; **known**; not all complete. `questionsReady` and every question input are **not read**.
3. **`!questionsReady`** → nomination `complete`; profile and questions listed with `status: undefined` and no count; no next step; preview closed; **not known**; not all complete. No count is read.
4. **ready** → profile `incomplete` when `unansweredRequiredInfoCount > 0 || requiredNameMissing`, with `count` only for a count above zero (the name adds none); the questions task left out when `opinionCount === 0`, otherwise `incomplete` with `count` while `unansweredOpinionCount > 0`, its `route` the questions list and its `resume` the first unanswered question when an id is given; `nextStep` the first `incomplete` task with a copy of its route; `previewOpen` is `previewOpenOf(input)`; `allComplete` when every task listed is `complete`.

"Not read" in rules 1 to 3 is asserted by three cases that hand the function a `Proxy` which throws on any member outside the ones the rule may read.

## The case tables, as measured

Row counts are from the green report's cases per group (`176-03-taskstate-green.json`).

| Table | Rows | What its groups encode |
|---|---|---|
| `TASK_STATE_CASES` | 22 | entity not known (2); no nomination, with zero counts, counts above zero, lists ready and not, no opinion question, a name missing (6) — one answer for all; a nomination with the lists not loaded, counts above zero and at zero, no opinion question counted, a name missing (4) — one answer for all; lists loaded (7): both unanswered, count with a name missing, name missing with the preview closed and with it open, questions next, required info unanswered with no opinion unanswered, nothing unanswered; no opinion question (3): open, closed, open with the name missing |
| `HAS_NOMINATION_CASES` | 5 | `undefined`, `null`, empty, one, two |
| `PREVIEW_OPEN_CASES` | 5 | open; no nomination; required info; opinion; both |
| `TASK_LABEL_CASES` | 22 | nomination × {no status, incomplete, complete} × lock (6); profile and questions × {no status, incomplete, blocked, complete} × lock (8 each) |
| `HOME_ACTION_CASES` | 8 | pending (2); nomination; profile (2); questions; preview (2) |
| `PROFILE_SAVE_CASES` | 8 | on to the questions (1); home, a return (7): still incomplete, name missing, complete, complete with no opinion question, lists not loaded, entity not known, no nomination |
| `QUESTION_SAVE_CASES` | 11 | a question unanswered (4): profile complete, profile incomplete, the saved one already answered, exactly one left; none left and the saved one was unanswered (3): profile incomplete, name missing, everything complete; none left and the saved one was answered (2): everything complete, and a state with a next step; not known (2) |
| `NOMINATIONS_VIEW_CASES` | 8 | no nomination (2); `undefined` (2); profile; questions; home (2) |
| `QUESTIONS_RESUME_CASES` | 7 | a first unanswered question (2); `undefined` (5) |

Beside the tables, in `taskState.test.ts`: 3 cases of what is read before a state is decided; 10 sweeps over all 192 combinations of the inputs (two values of each member, the unanswered opinion count never above the opinion count); 1 case labelling the tasks of two states; 2 cases on the fact read before the save; 8 freshness cases; 1 barrel case. `unanswered.test.ts` holds 27 cases: 10 of the required-info filter and 17 of the unanswered filter.

The six rows of `QUESTION_SAVE_CASES` that the plan's `<behavior>` lists are rows 1, 2, 3, 5, 7 and 8 of the eleven.

## The two blocks of ruling 1

Each fallback was applied to the committed helper as a mutation and the test file run against it, so "what changes" below is what failed, not a reading.

### U-01 — one branch of `questionSaveTarget`

The block, `taskState.ts`, the first statements of the function (lines 293 to 295 at `11afab973`):

```ts
  // While a question is unanswered the user keeps answering: the button leads to the first unanswered question, whatever else is incomplete and whether or not the question just saved had an answer before.
  const resume = questionsResumeRoute(state);
  if (resume) return { route: resume, continues: true };
```

**The fallback (criterion 4 to the letter):** one statement before the block —

```ts
  if (state.tasks.find((task) => task.id === 'profile')?.status === 'incomplete')
    return { route: { route: 'ContestantAppProfile' }, continues: true };
```

— and the block's comment loses "whatever else is incomplete". Nothing else in the module changes.

**The one row that changes:** in `QUESTION_SAVE_CASES`, `'a question is unanswered and the profile is incomplete'` — `expected` becomes `{ route: PROFILE, continues: true }`. Measured: with the fallback applied, **1 of 121** cases fails, and it is that row. The row of the same title in `QUESTIONS_RESUME_CASES` is of another function and does not change.

### U-02 — one assignment in `taskStateOf`

The block, `taskState.ts`, inside rule 4 (lines 212 and 213 at `11afab973`):

```ts
    // The task leads to its own page, the questions list, also while a question is unanswered: that is where the user arrives from outside the questions. The first unanswered question is carried beside it, for the buttons inside the questions.
    const route: TaskRoute = { route: 'ContestantAppQuestions' };
```

**The fallback (D-06 as written):** that one line becomes

```ts
    const route: TaskRoute = firstUnanswered ? copyOf(firstUnanswered) : { route: 'ContestantAppQuestions' };
```

with its comment restated. `copyOf` is needed: a case asserts that no object is repeated inside one state. `nextStep`, `homeAction`, `profileSaveTarget` and `nominationsViewTarget` read the task's route and need no change.

**The six rows that change**, each from `QUESTIONS_LIST` to the first unanswered question of its input. Measured: with the fallback applied, **6 of 121** cases fail, and they are these:

| Table | Row | Becomes |
|---|---|---|
| `TASK_STATE_CASES` | `'required info unanswered and opinions unanswered'` — the questions task's `route` | `question('q-3')` |
| `TASK_STATE_CASES` | `'required info answered, a required name missing, an opinion unanswered: the preview is closed'` — the questions task's `route` | `question('q-4')` |
| `TASK_STATE_CASES` | `'the profile complete and opinions unanswered: the next step is the questions'` — the questions task's `route` and `nextStep.route` | `question('q-3')` |
| `HOME_ACTION_CASES` | `'only the questions incomplete'` | `question('q-3')` |
| `PROFILE_SAVE_CASES` | `'the next step is the questions'` | `question('q-3')` |
| `NOMINATIONS_VIEW_CASES` | `'the next step is the questions'` | `question('q-3')` |

The sweeps, the freshness cases and every row whose questions task is complete, blocked or without a status do not change.

## The case that catches a target read after the save emptied its input

`questionSaveTarget` takes `{ wasUnanswered }`, which its caller reads before the save, beside a state its caller reads after it. The state after the save holds no unanswered question whether the save answered the last one or edited an answered one, so no reading of that state can tell the two apart.

Three things pin it, in `describe('questionSaveTarget')`:

- the rows `'none is unanswered, the one saved was unanswered, everything is complete'` (→ home, a continue) and `'none is unanswered and the one saved was already answered'` (→ the questions list, a return): **one input, two targets**;
- `'leads to two places from one state read after the save, by what was read before it'`: one state object, both readings;
- `'leads on after the last unanswered question is answered, although the save has emptied the unanswered ones'`: the state before the save with one question unanswered, the state after it with none and no count, and the target home.

**Measured against the defect itself.** With the helper changed to decide from the count read after the save (the question page's `isLastUnanswered` rule, `count === 1`), 5 of 121 cases fail: the three "the one saved was unanswered" rows and both cases above. With `wasUnanswered` ignored the other way (a save always leads on), 3 fail. With the edit branch placed after the next step, 1 fails: the row `'…a next step exists: an edit does not lead on'`.

Seven more mutations were run and each is caught: "no nomination" decided after the lists (9 cases fail), an unloaded list read as complete (10), a missing name closing the preview (3), the questions blocked by an incomplete profile (7), a site returning the state's own route object (1), and the two fallbacks above. The list with the failing titles is in the session's scratch directory, not in the repository.

## Deviations from Plan

**1. Task 2 has two red commits.** After the first (`8a7716fff`, 122 cases) and before the implementation was committed, I applied the U-01 fallback to the working copy and three cases failed, not one: the named row, a row I had added beyond the plan's six (`'none is unanswered, the one saved was already answered, the profile is incomplete'` → the list) and the second variant of a paired case. The plan bounds the swap to one row. The extra row was restated on a state the fallback leaves alone — an entity whose next step is its nomination — and the paired case reduced to the state with nothing left to do (`c72f5ea18`, 121 cases). The red report was taken again on the committed stub at that head; the first is kept as `176-03-taskstate-red-r1.*`. **What this costs:** under the recommended option, "an edit with the profile incomplete and no question unanswered leads to the list" (UI contract S6, case 4 (c)) is held by the branch order and by the next-step row, and by no row of its own state. Plan 176-17's component cases are the place for it if it is wanted.

**2. Names beyond the contract** — listed under *The exported names*.

**3. Four things the plan leaves open, settled in the helper and each held by a case:**
   - `questionSaveTarget` in a state that is not known → the questions list, a return (two rows). The page shows no question before the lists are loaded, so the branch is a guard.
   - `nominationsViewTarget` for an entity that is not known → `undefined`, as for an entity with a nomination whose lists are not loaded.
   - The questions task's `resume` needs both an unanswered count above zero and an id. A first id with a count of zero gives none.
   - `count` is absent, not zero, when there is nothing to count; a missing name adds nothing to the profile's count.

**4. A type check the plan does not order, of this plan's five files alone.** `tsc --noEmit` through a config file in the session's scratch directory that extends the frontend's and includes only `lib/contestant/tasks/*.ts`: exit 0 at both red heads and at the green one. It is not the workspace's `typecheck`, which stays plan 176-05's row; it wrote nothing into the repository. It is what "the red commit type-checks" (ruling 6) rests on.

**5. The helper was rewritten in place for the mutation runs, while uncommitted** — two batches of nine and one more — from a copy in the scratch directory, and compared byte for byte with that copy after each batch (`cmp`, identical). The committed file is that copy.

**6. `git checkout -- apps/frontend/src/lib/contestant/tasks/taskState.ts` was run once**, on my own uncommitted file, to return it to the committed stub for the second red report; the implementation was kept in the scratch directory and copied back.

**7. Each green report was taken again after its commit**, so that the `.head` beside it names a commit that holds the code it ran. The run before each commit passed too.

**8. The stubs of the red commits name their unused parameters with `void`,** so that the red commits hold no ESLint warning.

**9. HEAD is on `feat/entity-signup-multi-grant`,** the branch the orchestrator named for this checkout, not on a per-agent branch.

## Not done, or not verified

- **No workspace-wide gate, no svelte-check, no E2E run, no database command, no dev server** — by the plan. Typecheck, svelte-check and the whole unit suite over these files are plan 176-05's rows.
- **Nothing imports the modules.** That the context's derivations and these filters agree on real data is plan 176-06's to show; here it is a reading of the three derivations and a type check.
- **The U-01 and U-02 fallbacks were applied as mutations and discarded**; neither was built or committed.
- **`requirements-completed` is empty on purpose:** TASK-01 is met when the context and the five buttons read this state.
- **Which plan adds the route `ContestantAppNominations` and the two `home.nomination` keys was not established.** A string search of plans 04 to 09 for the route's name and for `home.nomination` found one line, in a verify block of plan 176-07; the plans were not read whole.
- **Nothing was appended to `.planning/WINDOWS.md`:** there is no stub, no skipped case and no verify that did not run.
- **The two test commits of Task 2 were not squashed** (code review checklist, "no fixes of itself"): the checkout is shared and plan 176-02's commits lie between them.

## For plans 176-06 to 176-17

**176-06 (the context).**
- Build the input inside the context's own derived scope and hand **values**: `entityKnown`; `hasNomination(list)`; `questionsReady`; the two unanswered lists' lengths; the name clause; `opinionQuestions.length`; `unansweredOpinionQuestions[0]?.id`.
- `requiredInfoQuestionsOf(infoQuestions)` and `unansweredQuestionsOf(list, savedEntityData?.answers)` reproduce the three derivations as they stand, the "no entity → every question" branch included: `savedEntityData` undefined gives no answers object.
- `entityKnown` means "whether the entity has a nomination has been read". With it false the state has **no tasks**; with a nomination and `questionsReady` false it has three, two without a status. Both are `known: false`.
- `profileComplete` (U-21) is `state.allComplete`: false for an entity with no nomination and for every state that is not known.
- Every result is fresh on every call (asserted), so a `$derived` over the state is value-replacing; the state is still never destructured.
- `taskStateOf` never reads a count before rule 4. The context need not guard its counts.

**176-10 (the preview's server gate).** Call `hasNomination(nominations)` and `previewOpenOf({ hasNomination, unansweredRequiredInfoCount, unansweredOpinionCount })` with counts from `unansweredQuestionsOf` over lists the load itself built. `previewOpenOf` cannot know whether its counts were loaded: a zero from an unloaded list opens the preview. With no answers object the filter answers every question, which closes it. The barrel pulls in `@openvaa/data` and `@openvaa/app-shared` through `unanswered.ts` and nothing of Svelte or `$app`.

**176-12 (the nominations view).** `nominationsViewTarget(state)`: `undefined` → the button's loading form; otherwise `route` and `continues` (`common.continue` when true, `common.return` when false). With no nomination the answer is home, a return, as soon as the entity is known, whatever the lists hold. Under the U-02 fallback its "questions next" target becomes the first unanswered question with no change here.

**176-14 and 176-15 (home).** `homeAction(state)` for the main action; `taskLabelKey(task, answersLocked)` for each row and for the main action's label when `kind` is `'task'` (`contestantApp.home.preview` when it is `'preview'`; that key is not in `TaskLabelKey`). A row is pending when `task.status === undefined`. An incomplete row shows `task.count` when present and the `!` mark when absent. A blocked row never has a count. The questions row is absent from `state.tasks` only for a nominated entity whose loaded lists hold no opinion question.

**176-17 (the two saves).**
- **Read `wasUnanswered` before `await userData.save()`** — whether the page's question is among the unanswered ones — and call `questionSaveTarget(stateAfterTheSave, { wasUnanswered })` for the target. Computing both from one derived value after the save is the defect the table exists for.
- For the **label**, call the same function with a state built from inputs that count the draft as saved; `continues` chooses between the two label pairs.
- The state's `resume` after a save is the first unanswered question, which is what the page's `-1` fall-through gives today, also after an edit of an answered question.
- `profileSaveTarget(state)`: the same two moments. Its target is the questions only when they are the next step, so a profile that still lacks its required name returns home.
- With answers locked neither button is rendered; neither function takes the lock.
- One state has no row of its own: an edit with the profile incomplete and no question unanswered (deviation 1).

## For Phases 177 and 179

- "Has a nomination" is `hasNomination`, and it counts an unconfirmed one. A nomination a user defines in Phase 177 completes the task at once.
- `nominationsViewTarget` answers home, a return, for an entity with no nomination. Where a user can add one, the label is that phase's to change; the function has no input for it.
- A further task is one member of `TaskId`, one entry in rule 2's and rule 3's lists and one block in rule 4; `nextStep`, `allComplete` and every site follow from the list's order.
- `TaskRoute` names six routes as literals. A route added to the app is added there too, or the helper cannot lead to it.

## Code review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | In part, by design: the state and its targets exist and are tested; nothing reads them until plan 176-06 |
| OWASP top 10 | No input from a request, no output to a page, no query, no secret. T-176-11 to T-176-13 are met by the rules' order and the tables |
| Code style guide | Followed: generic array syntax, no `.js` extensions, TSDoc on every exported symbol; ESLint and Prettier exit 0 |
| No `any` | None; no cast in either module. The test file holds no cast |
| No repeated code | **Open until plan 176-06:** the two filters repeat the context's three derivations, which that plan makes call them. `contestantHome.helpers.ts` overlaps `homeAction` and `taskLabelKey` until plan 176-15 replaces it |
| New entities documented | Yes |
| Repo documentation | None touches these modules yet |
| Tracking events | None: no user-facing function |
| Svelte component guidelines | No component |
| Errors handled and logged | No function throws; none has a failure mode |
| Failing checks | None |
| Shared dependencies not unduly affected | Nothing imports the modules; no existing file changed |
| WCAG, keyboard, screen reader | No markup |
| Developers' and Publishers' Guides | Not touched; nothing user-visible yet |
| Comment hygiene | `yarn assert:comment-hygiene` exit 0 before each commit; every comment and case title read: no history, no decision, plan or proposal id |
| Clean, linear history | Linear. Five commits where four were planned (deviation 1) |
| No fixes of itself | **Not met as it stands:** `c72f5ea18` revises the test file of `8a7716fff`; a squash is left to the orchestrator |
| Formatting in its own commit | No formatting-only change |
| `[db]` tag | No database change |

## The wave-mate

Plan 176-02 worked in the same checkout throughout. No check of mine failed on a file of theirs, and I waited on none. Its untracked and modified files were left as they were; every commit of mine names its own paths. Once, a new file of theirs showed as staged before a commit of mine and as untracked after it; a pathspec commit beside another path's staged new file was reproduced in a scratch repository and leaves that file staged, so the change was not this plan's, and plan 176-02 committed the file afterwards (`437bac4b1`).

## Files touched that the plan did not list

None in the repository. `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` are untouched; `CAND-APP-PLAN.md` is untracked as before; nothing under `tests/e2e-runs/` was deleted.

Gitignored evidence, all in `tests/e2e-runs/176-unit/`: `176-03-unanswered-red.{json,head,log}`, `176-03-unanswered-green.{json,head,log}`, `176-03-taskstate-red.{json,head,log}`, `176-03-taskstate-red-r1.{json,head,log}`, `176-03-taskstate-green.{json,head,log}`, `176-03-taskstate-green-precommit.log`, `176-03-t1-verify.{sh,log,exit,head}`, `176-03-t1-verify-final.{log,exit}`, `176-03-t2-verify.{sh,log,exit,head}`, five `176-03-hygiene-*.log` and `176-03-start.txt`.

## Known Stubs

None. The stub bodies of the two red commits are replaced by the two green ones.

## Threat Flags

None. The modules add no endpoint, no auth path, no file access and no schema. T-176-11 is met by rules 1 to 3 and their cases, the unreadable inputs and the sweeps; T-176-12 by `hasNomination` and `previewOpenOf` being exported and `taskStateOf` calling the latter with its input unchanged; T-176-13 by `wasUnanswered` and the cases above.

## Self-Check: PASSED

Checked after writing:

- The five files exist under `apps/frontend/src/lib/contestant/tasks/` and are tracked; `git diff --quiet HEAD` over the directory exits 0.
- `35a3e0ad2`, `2d5a30bb6`, `8a7716fff`, `c72f5ea18` and `11afab973` are ancestors of HEAD; `git rev-list --count 746714c56..HEAD -- apps/frontend/src/lib/contestant/tasks` is 5.
- `176-03-t1-verify.exit`, `176-03-t1-verify-final.exit` and `176-03-t2-verify.exit` each hold 0; their heads are `2d5a30bb6` and `11afab973`.
- The red reports hold 24 of 27 and 71 of 121 failed cases; the green reports hold 0 of 27 and 0 of 121.
- Neither module holds a cast or an `any`; `taskState.ts` holds no `import` line.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` have no difference between `746714c56` and HEAD.
