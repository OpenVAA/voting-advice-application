---
phase: 175-organization-editing-profile-questions-preview
plan: 10
subsystem: ui
tags: [contestant-app, questions-layout, known-zero, entity-descriptor, hide-if-missing-answers, navigation, home-page, svelte-runes, tdd, e2e, red-control]

requires:
  - phase: 175-organization-editing-profile-questions-preview (plan 04)
    provides: entityDescriptorOf with homeNotDone, homeNotDoneNoQuestions, greetingName and hideIfMissingAnswersKey; the copy keys of the neutral page and the home variants
  - phase: 175-organization-editing-profile-questions-preview (plan 05)
    provides: the organization-editing dataset, its three sessions, the test ids contestant-questions-none and contestant-questions-none-return, the per-project baseline
  - phase: 175-organization-editing-profile-questions-preview (plan 08)
    provides: ctx.questionsReady, the question scope by the loaded entity's type, the organization key of hideIfMissingAnswers
  - phase: 175-organization-editing-profile-questions-preview (plan 09)
    provides: the state steps setOrganizationState (with clearAnswers) and setCandidateState, the profile fixture's open() and save(), the full run 175-09-close
provides:
  - "the questions layout's three views (loading, the page for an entity with no opinion question, the questions page), with data-testid contestant-questions-none and contestant-questions-none-return"
  - "the menu's questions item and the home's questions button left out for an entity known to be asked no opinion question"
  - "the home's greeting and not-complete explanation read from the descriptor; computeNextAction takes notDoneKey"
  - "opinionQuestionsStateOf and OpinionQuestionsState in lib/contestant/utils/opinionQuestionsState.ts"
  - "isHiddenIfMissingAnswers and HideIfMissingAnswersSettings in lib/contestant/utils/hideIfMissingAnswers.ts, read by the home, the questions list, the profile and the sign-out modal"
  - "HomeNotDoneKey in entityDescriptor.ts; greetingName accepts the entity as the store holds it"
  - "fixture contestantNoQuestionsPage (open, expectNeutralPage, pressReturn, expectOnHome); navMenu.expectQuestionsItem; contestantEntityHomePage.expectQuestionsButton; contestantQuestionsOverviewPage.expectProgress and expectCardText; contestantQuestionPage.saveAndLeave; contestantProfilePage.expectQuestionValue and expectQuestionNotAsked"
  - "one holds: and one questions: test of perm-organization-editing.spec.ts"
  - "the gate rows 175-10-close (6 rows at 0) and the full run 175-10-close (232 passed in 110 projects)"
affects: [175-11, 175-12, 175-13, 176, 177, 179]

actuals:
  tokens: 29567 # chars/4 over the eight commits' diff outside .planning/ (118268 chars)
  tasks: 3
  commits: 8 # MEASURED: git rev-list --count 1ed0a3b71..5edbc7085, before this file's own commit
plan_head_before: 1ed0a3b719d682a1007d23ab7e2e45e341735bb8
plan_head_after: 5edbc7085149fa6cda88afa47972fe974a50c6d2

tech-stack:
  added: []
  patterns:
    - "A surface that depends on whether an entity has opinion questions reads one three-valued state — loading, none, some — and leaves a part out for none alone"
    - "A top-bar overlay that depends on reactive state is pushed from an effect whose cleanup takes it away, instead of once at component init"
    - "A rule read by several pages lives in one pure function that is handed values the page read on the context"

key-files:
  created:
    - apps/frontend/src/lib/contestant/utils/opinionQuestionsState.ts
    - apps/frontend/src/lib/contestant/utils/opinionQuestionsState.test.ts
    - apps/frontend/src/lib/contestant/utils/hideIfMissingAnswers.ts
    - apps/frontend/src/lib/contestant/utils/hideIfMissingAnswers.test.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions/layout.svelte.test.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts
    - tests/tests/fixtures/contestant/contestantNoQuestionsPage.fixture.ts
  modified:
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions/+layout.svelte
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/contestantHome.helpers.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/contestantHome.helpers.test.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/+page.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte
    - apps/frontend/src/lib/contestant/utils/entityDescriptor.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts
    - tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts
    - tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts
    - tests/tests/fixtures/contestant/contestantQuestionPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts
    - tests/tests/fixtures/contestant/perm-organization-editing.ts
    - tests/tests/fixtures/shared/navMenu.fixture.ts
    - tests/tests/specs/perm/perm-organization-editing.spec.ts
    - tests/tests/specs/perm/perm-hide-hero.spec.ts
    - tests/tests/specs/perm/perm-disable-allow-open.spec.ts
    - tests/README.md

key-decisions:
  - "The known-zero rule is one pure function, opinionQuestionsStateOf, read by the layout, the menu, the home and the profile; each caller passes ctx.questionsReady and ctx.opinionQuestions.length, read on the context"
  - "The setting's key by entity type is one pure function, isHiddenIfMissingAnswers, read by all five places that tell an entity it is hidden from voters"
  - "The progress bar is shown only while the entity has opinion questions, so it is absent in the loading view too"
  - "The descriptor's two home keys are narrowed to the four literals the home helper names, so the page passes a key and the helper resolves it"
  - "The dataset's last opinion question admits an open comment: the plan's holds test adds one, and the dataset as seeded offered no question that takes one"
  - "Where the save of the last unanswered question leads is not asserted by the spec: the step waits until the question's page is left"

patterns-established:
  - "questionsState !== 'none' is how a questions entry is offered; === 'none' is how the copy drops the opinions"

requirements-completed: []

coverage:
  - id: D1
    description: "The questions layout shows a loading view until the entity's question data is loaded, a neutral page for an entity that is asked no opinion question, and the questions page otherwise; the redirect to the profile and the progress bar are for an entity that has opinion questions alone"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "questions/layout.svelte.test.ts (13 cases; 12 failed at 755ca9a53, 13 passed at b2eb0791b)"
        status: pass
      - kind: e2e
        ref: "perm-organization-editing › questions: a candidate with no opinion question to answer is offered no questions entry, and the questions URL says so (red in 175-10-control-r2, green in 175-10-precommit and 175-10-close)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The menu's questions item is rendered until the data is loaded and shows none, and is then absent from the markup"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "ContestantNav.svelte.test.ts, 'the questions item' (5 cases; 2 failed at 755ca9a53)"
        status: pass
      - kind: e2e
        ref: "perm-organization-editing › questions: (absent for the candidate) and › holds: (present for the organization)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The home's questions button follows the same rule; the explanation is the descriptor's sentence or its no-questions variant; the greeting is the descriptor's name; the hidden-from-voters sentence follows the key of the entity's own type"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "page.svelte.test.ts beside the home page (19 cases; 8 failed at 755ca9a53) and contestantHome.helpers.test.ts (29 cases; 3 failed at 755ca9a53)"
        status: pass
      - kind: e2e
        ref: "perm-organization-editing › questions: and › holds: (the button absent and present)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every read of entities.hideIfMissingAnswers in the Contestant app takes the key of the selected entity's type"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "hideIfMissingAnswers.test.ts (9 cases) and the home page's five cases"
        status: pass
      - kind: other
        ref: "Task 2 verify: the negative search for hideIfMissingAnswers?.candidate and for a comparison of a type with a literal in the named files (exit 1, as required)"
        status: pass
    human_judgment: false
  - id: D5
    description: "An organization answers the opinion question addressed to it with a comment, sees the progress and the saved answer, answers an info question on its profile and is not asked a candidate's question"
    requirement: GEN-01
    verification:
      - kind: e2e
        ref: "perm-organization-editing › holds: a confirmed organization answers the opinion question it has left and an info question, and is not asked a candidate's question (green in 175-10-control-r2, 175-10-precommit and 175-10-close)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The gate rows and one full default E2E run on this plan's committed tree, every other project at its total in the plan-09 run"
    verification:
      - kind: other
        ref: "175-verdict.mjs gates 175-10-close --rows typecheck,lint,unit,check-frontend,build,format (exit 0)"
        status: pass
      - kind: e2e
        ref: "175-verdict.mjs e2e 175-10-close --same-projects-as 175-09-close --except perm-organization-editing=+ … (exit 0; 232 passed, 110 projects compared, 0 not as expected)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The neutral page and the loading view as a person sees them: no frame of the neutral page for an entity that has questions, the page in seven locales and at 320 px, read with a screen reader"
    verification: []
    human_judgment: true

duration: 41min
completed: 2026-10-08
status: complete
---

# Phase 175 Plan 10: The Questions Pages for Either Entity Type, the Key Assertions Red First — Summary

**An entity that is asked no opinion question now meets a neutral page at the questions URL and is offered no questions entry in the menu or on its home, and nobody else sees an entry or a page disappear and come back: the questions layout has three views decided by `ctx.questionsReady` and the opinion list, with a loading view where the error page used to flash. The home's greeting and explanation and every "hidden from voters" sentence are read per entity type through the descriptor. One new `questions:` E2E test was shown red on the uncommitted tree (1 failed on an expectation, 157 others passed), green on the uncommitted tree after the surfaces changed (158 passed), and committed only then; one new `holds:` test shows an organization answering its own questions. The six gate rows are at 0 and the full run is 232 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run in 110 projects, every project at its total in `175-09-close` but the new one, at 10 against 8. The first control was red in the `holds:` test too, for a mismatch between the plan and the dataset and not for a defect of the questions pages; Task 2's verify exits 1 as written, on a search that meets a test file.**

## Performance

- **Duration:** about 41 min (19:04Z → 19:46Z)
- **Tasks:** 3 of 3
- **Files:** 7 created, 22 modified (1281 lines added, 100 removed)

## Commits

| # | Commit | Subject |
|---|---|---|
| 1 | `f699d3c34` | `test(175-10): fixture steps for an entity with no opinion questions` (Task 1 step 2) |
| 2 | `21a067d59` | `test(175-10): the organization-editing dataset's last opinion question admits an open comment` (deviation 1) |
| 3 | `242ae3be6` | `test(175-10): fixture steps for saving the last answer and reading a card of a collapsed category` (deviation 1) |
| 4 | `755ca9a53` | `test(175-10): the questions layout's three states, the menu item and the home explanation` (Task 2, red) |
| 5 | `b2eb0791b` | `feat(175-10): an entity with no opinion questions meets a neutral page and no questions entry` (Task 2, green) |
| 6 | `007ac4062` | `test(175-10): two spec comments say what a questions URL shows now` (the checklist's finding) |
| 7 | `5b4bb2490` | `test(175-10): an organization answers its questions, and an entity with none meets a neutral page` (Task 3 step 3, after the green verdict) |
| 8 | `5edbc7085` | `docs(175-10): the tests README names what the organization-editing spec asserts now` |

Each was made by pathspec. The plan's base is `1ed0a3b71`; no other agent's commit sits between these eight. The spec was uncommitted from Task 1's step 3 to commit 7 and was in no commit before it.

## Each task's verify command, with its real exit status

The three `<automated>` blocks were written to script files by a script that reads the plan file, and each file was compared with the plan's block afterwards: byte-identical, all three. Evidence: `tests/e2e-runs/175-unit/175-10-t<N>-verify.sh` / `.log` / `.exit` / `.head`.

| Verify | Head | Exit | What it showed |
|---|---|---|---|
| **Task 1, as written** | `242ae3be6` (spec uncommitted) | **0** | the neutral page's fixture tracked; the three fixture files without uncommitted changes; `typecheck:tests`; ESLint; the kept copy holds a `questions:` and a `holds:` test; the spec holds no `questions:` test at the control's head; `control 175-10-control … --red "questions:"` PASS on `175-10-control-r2` |
| **Task 2, as written** | `b2eb0791b` (spec uncommitted) | **1** | stops at its sixth stage, `{ git grep -q -F "error.noQuestions" -- "$E"; test $? -eq 1; }`: the search covers the whole entity route and finds the layout's own test, which names the former title to assert that it is not rendered (deviation 4). The five stages before it passed |
| Task 2, the same chain with that one stage excluding `*.test.ts` | `b2eb0791b` | **0** | every later stage passed: the negative search for the candidate's key and for a comparison of a type with a literal; no `view-transition-name` in the layout; red head `755ca9a53` before the layout's commit `b2eb0791b`; the red report holds a failed case and the green none; frontend unit 179 files / 3116 tests passed; `check` 2139 files, 0 errors, 0 warnings; comment hygiene 0. Kept as `175-10-t2-verify-own.sh` |
| **Task 3, as written** | `5edbc7085` (clean tree) | **0** | the spec holds `questions:` and `holds:` at HEAD and no locator, soft assertion or axe builder; a clean tree outside `.planning/`; the spec holds no `questions:` test at the pre-commit run's head; `control 175-10-precommit … --green --were-red-in 175-10-control` PASS; `gates 175-10-close --rows …` PASS; `e2e 175-10-close …` PASS |

No check was edited.

## The control, the green proof and the runs

All E2E runs were made in the background on AC power (100 %), with no void marker, one preflight success and no preflight failure each, no Svelte warning in any dev-server log, and no Sleep, Wake or DarkWake entry between 22:05 and 22:45 local time, which covers every run window.

| Label | Tree | Head | Result | Verdict |
|---|---|---|---|---|
| `175-10-control` | fixtures committed, the spec's two tests in the working tree, surfaces unchanged | `f699d3c34` | wrapper exit **1**; 158 tests: **156 passed, 2 failed**, 0 flaky, 0 skipped, 0 did not run; Playwright 6.1 min; largest heartbeat lateness 40 ms | not a passing control: the `holds:` test was red too, and it ended on the test's timeout, not on an expectation. No verdict file: a label names its newest attempt |
| `175-10-control-r2` | the dataset's change and two more fixture steps committed, the spec with its `holds:` test corrected, surfaces unchanged | `242ae3be6` | wrapper exit **1**; 158 tests: **157 passed, 1 failed**; Playwright 4.8 min; largest heartbeat lateness 41 ms | `control 175-10-control … --red "questions:"` **exit 0, PASS** (`175-10-control-r2.verdict.txt`) |
| `175-10-precommit` | the surfaces as committed, the same spec still uncommitted | `007ac4062` | wrapper exit **0**; **158 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run; Playwright 4.6 min; 88 projects; largest heartbeat lateness 56 ms | `control 175-10-precommit … --green --were-red-in 175-10-control` **exit 0, PASS** (`175-10-precommit.verdict.txt`): 10 of 10 in the project; the red title "was red, now passed" |
| `175-10-close` | committed, clean | `5edbc7085` | driver exit **0**; **232 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run; **110 projects**; Playwright 5.6 min; 19:37:59Z → 19:44:15Z; largest heartbeat lateness 165 ms; Docker VM 14.16 GiB free | `e2e 175-10-close --same-projects-as 175-09-close --except perm-organization-editing=+ --expect-project …` (five projects) **exit 0, PASS** (`175-10-close.verdict.txt`) |

**The red test of the passing control**, with the first line of its error:

- `questions: a candidate with no opinion question to answer is offered no questions entry, and the questions URL says so` — `Error: expect(locator).toHaveCount(expected) failed`, on `getByTestId('nav-menu').getByTestId('contestant-nav-questions')`, expected 0, received 1, after 5000 ms, in `navMenu.expectQuestionsItem(false)`.

**Whether the `holds:` test was red, and what was fixed.** It was red in the first control and green in the second. It was **not** ruling 4's finding about the questions pages for an organization. Up to the failing step the organization was offered its questions on the home and in the menu, saw its progress at 2 of 3, was led to its unanswered question and chose an answer. It then timed out in `contestantQuestionPage.enterInfo`, waiting 90 s for the comment field, which the page does not render: the dataset seeded every opinion question with `allow_open: false`, and the plan's test "adds an open comment". Three things changed before the second control, none of them a questions page:

1. the dataset's last opinion question, `qu-opin-3`, is seeded with `allow_open: true` (`21a067d59`);
2. the overview fixture expands every category before it reads a card, because a collapsed category does not render its cards and one whose questions are all answered starts collapsed (`242ae3be6`) — read from `Expander.svelte` before the second run, not found by a failure;
3. the test no longer asserts where the save of the last unanswered question leads; it waits until the question's page is left, through the new step `saveAndLeave` (`242ae3be6`).

**The kept copies.** `tests/e2e-runs/175-e2e/175-10-control.spec.ts` is the spec as the second control ran it and is identical to the spec committed in `5b4bb2490` (`diff`, before the commit). The spec as the first control ran it is kept as `175-10-control.r1.spec.ts`; the two differ in the `holds:` test alone: `saveAndLeave()` in place of `clickContinue()` followed by `expectLanded(…)`. The `questions:` test is the same in both, so the red did not have to be made again after the pre-commit run.

**Gate rows `175-10-close`** — `tests/e2e-runs/175-gates/175-10-close`, head `5edbc7085`, driver exit 0, no Sleep entry in the window.

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 18 | |
| lint | 0 | 44 | `yarn lint:check`, every link |
| unit | 0 | 64 | frontend **179 files passed, 1 skipped; 3116 tests passed, 16 skipped** (3055 at `175-09-close`, +61); dev-seed 68 files; app-shared 10 files; the harness's own 7 files / 102 tests |
| check-frontend | 0 | 9 | |
| build | 0 | 15 | |
| format | 0 | 18 | |

- `node 175-verdict.mjs gates 175-10-close --rows typecheck,lint,unit,check-frontend,build,format` → **exit 0, PASS** ("not stale: head 5edbc7085 is tree-equal to HEAD outside .planning/").
- `175-verdict.mjs scope` and `… hygiene` both exit 0 at `5edbc7085`.

**The full run against `175-09-close`:** 110 projects compared, 0 not as expected. 109 are equal to their plan-09 totals; `perm-organization-editing` is 10 against 8. The five named projects: `perm-organization-editing` 10/10, `contestant-journey` 1/1, `perm-answers-locked` 3/3, `contestant-a11y-scan` 22/22, `contestant-entity-selection` 8/8. 230 + 2 = 232. The two specs whose comments were corrected are at their totals: `perm-hide-hero` 1/1, `perm-disable-allow-open` 3/3.

**A candidate's journey is unchanged** (roadmap criterion 5): `contestant-journey` passed in both controls, in the pre-commit run and in the full run, with no line of its spec changed. Its menu and home assertions hold because the base dataset's candidate has opinion questions.

No run was void. Two runs were red: both controls, as controls are, and the first of them also in a test that should have held, for the reason above.

## What was built — every name

`ENTITY` is `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]`.

### The shared rule of the known zero (`lib/contestant/utils/opinionQuestionsState.ts`)

```ts
export type OpinionQuestionsState = 'loading' | 'none' | 'some';
export function opinionQuestionsStateOf({ questionsReady, questionCount }: {
  questionsReady: boolean;
  questionCount: number;
}): OpinionQuestionsState;
```

`'loading'` while `questionsReady` is false, whatever the count; then `'none'` for a count of zero and `'some'` otherwise. Every caller passes `ctx.questionsReady` and `ctx.opinionQuestions.length`, each read on the context inside the caller's own `$derived`.

### The shared read of the setting (`lib/contestant/utils/hideIfMissingAnswers.ts`)

```ts
export type HideIfMissingAnswersSettings = {
  entities?: { hideIfMissingAnswers?: Partial<Record<ServedEntityType, boolean>> };
};
export function isHiddenIfMissingAnswers({ entityType, appSettings }: {
  entityType: ServedEntityType | undefined;
  appSettings: HideIfMissingAnswersSettings;
}): boolean;
```

`appSettings.entities.hideIfMissingAnswers[key]` with `key = entityDescriptorOf(entityType).hideIfMissingAnswersKey`, and `false` where the descriptor names no key. While the type is not known the candidate's descriptor is read, as on every page.

### The questions layout (`ENTITY/questions/+layout.svelte`)

| Name | Definition |
|---|---|
| `questionsState` | `$derived(opinionQuestionsStateOf({ questionsReady: ctx.questionsReady, questionCount: ctx.opinionQuestions.length }))` |
| `requiredInfoMissing` | `$derived(questionsState === 'some' && ctx.unansweredRequiredInfoQuestions.length > 0)` |
| `view` | `'none'` when `questionsState === 'none'`; else `'loading'` when `questionsState === 'loading' \|\| requiredInfoMissing`; else `'questions'` |
| the redirect | `$effect(() => { if (requiredInfoMissing) goto(getRoute.current('ContestantAppProfile')); })` |
| the progress bar | `$effect(() => { if (questionsState === 'some') return topBarSettings.push({ progress: 'show' }); })` — the returned revert is the effect's cleanup |
| `progress.max`, `progress.current` | two effects, unchanged |

| View | Markup |
|---|---|
| `loading` | `<Loading />` — the component's own `data-testid="loading-indicator"` |
| `none` | `<MainContent title={t('contestantApp.questions.none.title')} data-testid="contestant-questions-none">`, holding `<p class="text-center">` with `contestantApp.questions.none.content` and, in `primaryActions`, one `<Button variant="main" text={t('common.return')} href={getRoute.current('ContestantAppEntityHome')} data-testid="contestant-questions-none-return" />`. No hero snippet, no note |
| `questions` | `{@render children?.()}` |

The layout carries no state attribute; the view is told from which of the three is in the markup. It no longer imports `HeroEmoji` and no longer reads `error.noQuestions` or `dynamic.error.heroEmoji`. The server markup of every direct load of a questions page is the loading view, because `questionsReady` is false on the server.

**How the progress bar is hidden on the neutral page.** The layout no longer calls `topBarSettings.use({ progress: 'show' })` once at init. The overlay is pushed from an effect only while `questionsState` is `'some'`, and taken away by the effect's cleanup when the state changes or the layout is destroyed. In the other two views the header reads the registry's default, `'hide'`, and renders no `<progress>` element. One consequence beyond the neutral page: **the bar is also absent in the loading view**, where it was rendered with a maximum of 0.

### The menu (`ContestantNav.svelte`)

`questionsOffered = $derived(opinionQuestionsStateOf({ … }) !== 'none')`. The signed-in items, in order:

1. `contestant-nav-home` — always;
2. inside `{#if contestantCtx.selectedEntity}`: `contestant-nav-profile`; `contestant-nav-questions`, **inside `{#if questionsOffered}`**; `contestant-nav-preview`; `contestant-nav-settings`; `contestant-nav-switch-entity`, inside `{#if contestantCtx.entities.length > 1}`;
3. Help and Privacy in a second group.

An item is left out by an `{#if}` around its `NavItem`: it is absent from the markup. The questions item keeps its `disabled` state and its badge while required info is unanswered.

### The home page (`ENTITY/+page.svelte`) and its helper

Page-level facts, each a `$derived`: `descriptor` (`entityDescriptorOf(contestantCtx.selectedEntity?.type)`), `noOpinionQuestions` (`opinionQuestionsStateOf({ … }) === 'none'`), `hiddenForMissingAnswers` (`infoOutstanding || (isHiddenIfMissingAnswers({ entityType: contestantCtx.selectedEntity?.type, appSettings }) && missingOpinionCount !== 0)`), `entityName` (`descriptor.greetingName(userData.current.entity)`, or `undefined` while the store is empty). The inline ternary on the entity's type is gone.

```ts
export type ContestantHomeNotDoneKey = Extract<ContestantHomeMessageKey, `contestantApp.home.ingress.notDone${string}`>;

export type ContestantHomeNextActionInput = {
  profileComplete: boolean;
  answersLocked: boolean;
  missingInfoCount: number | undefined;
  missingOpinionCount: number | undefined;
  notDoneKey: ContestantHomeNotDoneKey;   // new
  username: string;
  t: ContestantHomeTranslate;
  resolveRoute: ContestantHomeResolveRoute;
};
export function computeNextAction(input: ContestantHomeNextActionInput): ContestantHomeNextAction;
```

The page passes `notDoneKey: noOpinionQuestions ? descriptor.homeNotDoneNoQuestions : descriptor.homeNotDone`. The helper's defaults read `explanation: t(notDoneKey)`; its three cases, its routes and `computeBadges` are unchanged. The key is not read once the profile is complete.

The home's ids: `contestant-home-status`, `contestant-home-tip`, `contestant-home-profile`, `contestant-home-questions` (**inside `{#if !noOpinionQuestions}`**), `contestant-home-preview`, `contestant-home-continue`, `contestant-home-logout`, and `contestant-answers-locked-warning`.

### The descriptor (`lib/contestant/utils/entityDescriptor.ts`)

```ts
export type HomeNotDoneKey = Extract<TranslationKey, `contestantApp.home.ingress.${'notDone' | 'notDoneNoQuestions'}.${ServedEntityType}`>;
// EntityDescriptor
homeNotDone: HomeNotDoneKey;
homeNotDoneNoQuestions: HomeNotDoneKey;
greetingName: (entity: { firstName?: string | null; name?: string | null }) => string | null | undefined;
```

No value of a descriptor changed. A third served type with home keys fails the type check in the home page until the helper's own union names them.

### The reads of the setting, as derived, each with the key it now takes

`git grep -n "hideIfMissingAnswers" -- apps/frontend/src ':!*.test.ts'` at `b2eb0791b`, the Contestant app's part:

| Where | Before | Now |
|---|---|---|
| `LogoutButton.svelte`, the modal's "will be hidden" sentence | `hideIfMissingAnswers?.candidate` | `isHiddenIfMissingAnswers({ entityType: contestantCtx.selectedEntity?.type, appSettings })` |
| the home page, the answers-locked warning | `.candidate` | the same call |
| the questions list page, the answers-locked warning | `.candidate` | one `$derived`, `hiddenIfMissingAnswers`, for both reads |
| the questions list page, the unanswered warning | `.candidate` | the same `$derived` |
| the profile page (plan 175-09's read) | its own two lines over the descriptor | the same call |

Every one takes the key the descriptor names for the selected entity's type: `candidate` for a candidate, `organization` for an organization. The docstrings of the home page, the questions list page and `LogoutButton` name the setting without naming an entity type. The settings page's docstring named the setting although the page reads none; the line is removed.

**The Contestant app no longer reads `error.noQuestions`.** `git grep -n -F "error.noQuestions" -- apps/frontend/src` prints the voter app's questions layout, the generated key type, and the constant of the new layout test that asserts the title is not rendered.

### The fixtures' new steps

| Fixture | Step | What it does |
|---|---|---|
| `contestantNoQuestionsPage` (new; `createContestantNoQuestionsPage(page, admin)`) | `open(entity)` | `goto` the questions URL of `entity` itself, built from the id of the row with its external id |
| | `expectNeutralPage()` | the page's id visible (`TIMEOUTS.slowPage`); the URL still the questions URL; an `<h1>`; the Return visible; exactly one button in the page; no `progressbar` on the page; the Return at least 44 by 44 CSS px |
| | `pressReturn()` | the Return visible, then click |
| | `expectOnHome()` | an entity-home URL and the home's status message |
| `navMenu` | `expectQuestionsItem(present)` | the profile item visible first, then the questions item visible, or a count of 0 |
| `contestantEntityHomePage` | `expectQuestionsButton(present)` | the status message visible first, then the questions button visible, or a count of 0 |
| `contestantQuestionsOverviewPage` | `expectProgress({ answered, total })` | the header's `progressbar`: `max`, and `value` once its animation settles |
| | `expectCardText(label, text)` | the list visible, every category expanded, then the matching card holds the text |
| `contestantQuestionPage` | `saveAndLeave()` | click Save and wait until the URL is no longer that question's |
| `contestantProfilePage` | `expectQuestionValue(label, value)` | the value in the question's control |
| | `expectQuestionNotAsked(label)` | no info item matches the label |

Every id is read from `testIds`, every new assertion is hard, and every wait is on `TIMEOUTS.page` or `TIMEOUTS.slowPage`. The composition root registers three more fixtures: `contestantNoQuestionsPage`, `contestantQuestionPage` and `contestantQuestionsOverviewPage`.

### The spec's two tests

In a third top-level describe, `perm-organization-editing: the questions`:

| Session | Title | State step | What it asserts |
|---|---|---|---|
| confirmed organization | `holds: a confirmed organization answers the opinion question it has left and an info question, and is not asked a candidate's question` | `{ confirmed: true, clearAnswers: [qu-opin-3, qu-info-org] }` | the home's questions button and the menu's questions item are there; progress 2 of 3 and the continue prompt; the prompt leads to `[QU-OPIN-3]`; a choice and a comment; the save leaves the question; on a fresh load progress 3 of 3, the completion state, the card holds the comment and the question shows the chosen answer; the profile shows `[QU-INFO-ORG]` and not `[QU-INFO-CAND]`; an answer to it is saved and shown after a fresh load |
| unconfirmed candidate | `questions: a candidate with no opinion question to answer is offered no questions entry, and the questions URL says so` | `{ confirmed: false }` | no questions item in the menu; no questions button on the home; the questions URL shows the neutral page with one button of full size and no progress bar, and nothing redirected; the Return leads to the home |

## Task 2 — the cases that were red

**Red at `755ca9a53`** (`175-10-questions-red.json`, exit 1): 83 cases over four files, **25 failed, 58 passed**, every failure an `AssertionError`; every file mounted.

- **The layout** (13 cases, 12 failed): the loading view with an empty list, with a list that holds questions and with unanswered required info while the data is not loaded (3); the loading view and the redirect while required info is unanswered; no neutral page on the way from the first render to the questions page; the neutral page's title, paragraph and button; no hero and no error title; no progress bar; no redirect with and without unanswered required info (2); the neutral page replacing the loading view; the progress bar following the questions. The one that passed is "shows the questions page, with the progress bar and its maximum".
- **The menu** (22 cases, 2 failed): the item absent for a candidate and for an organization that is asked no opinion question. The three "is rendered" cases passed, as controls.
- **The home page** (19 cases, 8 failed): the button absent for a known zero, and going once the data shows none (2); the explanation for a candidate with none, an organization with questions, an organization with none, and an organization whose data is not loaded (4); the hidden sentence for an organization in both directions (2). The greeting's three cases passed: the ternary already greeted correctly.
- **The helper** (29 cases, 3 failed): the explanation for each of the three keys that is not the candidate's standard one. "Never leads to the questions for an entity with no unanswered opinion question" passed, as today.

**Green at `b2eb0791b`** (`175-10-questions-green.json`, exit 0): 83 of 83.

## The code review checklist

Over the layout, the two pages, the menu, the sign-out button, the two helpers, the component tests, the fixtures and the spec's two tests. Recorded before the pre-commit run; the one finding was fixed before it.

| Item | Outcome |
|---|---|
| Solves the issue | yes: a project that addresses every opinion question to one entity type no longer shows the other an error page, and an organization answers its own questions in a browser |
| OWASP top 10 | T-175-51: three states on the loaded fact, with cases for the layout, the menu and the home. T-175-62: one function reads the key of the selected entity's type, with cases in both directions and a negative search. T-175-63: the spec was uncommitted until the green verdict. No input path, no markup written from data, no new request |
| Code style guide | `Array<T>`, explicit return types, object parameters, TSDoc on every new function, type, constant and step. The two helpers hold their types in their own files, as their neighbours `nameRule.ts` and `entityDescriptor.ts` do |
| No `any` | none. Casts in tests only, `as const` and `as Array<[…]>` on case tables; two non-null assertions in the new fixture, after an assertion that the value is not null |
| No repetition | the known-zero rule and the setting's read by type each have one definition; the profile page's own copies of both were replaced. `expandAllCategories` is one function for the overview fixture's two steps. Not fixed: the `matchMedia` stub is in twelve component test files, two of them new |
| New entities documented | the layout's and the home page's `@component` blocks; the menu's "what the menu shows"; both helpers; `HomeNotDoneKey`; `notDoneKey`; every fixture step and the new fixture's header |
| Repo markdown | `tests/README.md`: the spec's row, the fixture list and the dataset's sentence (`5edbc7085`). The dataset's own header says which question admits a comment |
| **Tracking events** | **None added.** `git grep -n -e "startEvent" -e "startPageview" -e "track(" -- apps/frontend/src/routes/contestant apps/frontend/src/lib/layouts` prints 16 lines (`tests/e2e-runs/175-unit/175-10-tracking-search.txt`): three of `Layout.svelte`, which starts `menu_open` and tracks `video`; one of `MaintenancePage.svelte`, which tracks `maintenance_shown`; three test fakes that define `startEvent`; and nine `untrack(` calls. No page of the Contestant app starts an event for a page or for a primary action. **Page views are tracked for every page by the root layout**: `apps/frontend/src/routes/+layout.svelte` calls `startPageview(to.url.href, from.url.href)` after every navigation, which covers the neutral page as a destination and its Return as the navigation it is |
| New Svelte components | none |
| Errors handled and logged | no new failure path: the three views are derivations, and a rejected `goto` is as it was |
| Failing checks | none at the close. One commit holds failing unit files by the plan's own order (deviation 9) |
| Parts sharing the dependency | **Finding, fixed in `007ac4062`:** the headers of `perm-hide-hero.spec.ts` and `perm-disable-allow-open.spec.ts` said a questions URL shows the layout's empty state while the data is loading, which is no longer true; both now give the question's internal id as the reason for going through the overview. `LogoutButton` has four hosts — the home page, the top bar, the register page and the nothing-to-edit view; where no entity is selected its type is not known, the candidate's key is read, and the modal does not open because no entity is loaded. The full run holds every other project at its total |
| WCAG A/AA, keyboard and screen reader | the neutral page is a `MainContent` page: an `<h1>` that takes focus after a navigation, the route announcer speaks its title, one button reachable by keyboard and at least 44 by 44 px (asserted in the browser). The loading view has its screen-reader label. A menu item that is left out is absent, not disabled. `contestant-a11y-scan` is 22/22. **Not done:** an axe scan of the neutral page, which is plan 175-12's entry 5 |
| Docs guides | the generated pages of `ContestantNav`, `LogoutButton` and four routes restate docstrings that changed; plan 175-13 regenerates them |
| Comment hygiene | every added or changed comment read; `yarn assert:comment-hygiene` exit 0 on the working tree before each of the eight commits |
| Commit history | linear: test, test, test, test, feat, test, test, docs |
| No fixes of itself | **finding:** commit 3 changes `expectCardText`, which commit 1 added, so that it expands the categories first |
| Formatting in its own commit | none; the README's table was re-padded by Prettier in the commit that changed a cell |
| `[db]` tag | no database change |
| Backend, adapter and Edge Function sections | name nothing this plan touches |

**The components skill's re-check list:** no component was added, removed, renamed or moved. `generate:docs` is plan 175-13's. `.claude/skills/components/` was read and not edited: nothing in it names the questions layout, the menu's items or these helpers.

## Each fallback's status

- **U-15, U-16** (the neutral page; the copy for an entity with no opinion questions). Built as ruled.
- **U-30** (the unconfirmed candidate as the third identity). Built as ruled; not exercised. This plan's removable parts under the fallback: the describe "as the unconfirmed candidate's editor" of the spec's third describe, with its one `questions:` test; the fixture `contestantNoQuestionsPage`, its registration in the composition root and `navMenu.expectQuestionsItem(false)`'s only absent-case caller. The neutral page, the absent menu item and the absent home button are then held by the component cases above alone.
- **U-19** (the organization's key of the setting). Built as ruled in plans 175-04 and 175-08; under the fallback `isHiddenIfMissingAnswers` answers `false` for an organization with no line changed, and one case of the home page's test and one of the function's own change their expectation: an organization with its key on is then not told that it is hidden.

## Deviations from Plan

**1. [Rule 1] The first control was not a passing control, and three changes preceded the second.** The plan's `holds:` test adds an open comment; plan 175-05's dataset seeds every opinion question with `allow_open: false`, so the page renders no comment field and the test timed out waiting for it. The dataset's last opinion question now admits a comment (`packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts`, a file the plan does not list; dev-seed typecheck 0 and unit 1037 of 1037 after the change). The alternative was a `holds:` test without a comment, which would leave an organization's comment — a multilingual field saved beside its answer — unproven in a browser. The plan's step 4 foresees a red `holds:` test as a defect of the questions pages; this one was a defect of the test's premise, and is reported as such.

**2. The spec does not assert where the save of the last unanswered question leads.** The first form of the test expected the entity's home, as the page's comment says. I did not establish which of the home and the list the app chooses, so the step waits until the question's page is left and the test then opens the list itself. **Not determined, and worth a look:** the page computes its target from a `$derived` over the unanswered list, which the save itself empties before the target is read.

**3. Fixture files the plan does not list:** `contestantQuestionsOverviewPage.fixture.ts` (`expectProgress`, `expectCardText`, the shared `expandAllCategories`), `contestantQuestionPage.fixture.ts` (`saveAndLeave`) and `contestantProfilePage.fixture.ts` (`expectQuestionValue`, `expectQuestionNotAsked`). The `holds:` test needs each; the profile fixture's existing `expectQuestionsAbsent` is a soft assertion, which the spec may not hold.

**4. Task 2's verify exits 1 as written.** Its negative search for `error.noQuestions` covers every file under the entity route, and the new layout test names that key in a constant to assert that the title is not rendered. The test was not changed for the search and the check was not edited. The stage's intent — no page or layout under the entity route reads the title — was run with the same search excluding `*.test.ts`, every other stage unchanged: exit **0**.

**5. Two helpers the plan does not name**, each with its test: `opinionQuestionsState.ts` and `hideIfMissingAnswers.ts`. The plan has the layout, the menu and the home each decide the known zero from the two context reads, and four reads each take the descriptor's key; that is one rule in four places and another in five. Each caller still reads `ctx.questionsReady` and `ctx.opinionQuestions.length` on the context, as the plan and its verify require. The profile page's two inline copies were replaced with the same calls (`ENTITY/profile/+page.svelte`, not listed; its 31 cases pass).

**6. A fourth component test file, `ENTITY/page.svelte.test.ts`**, for the home page. The plan's behaviours for the home — the button's three cases, the explanation by type and known zero, the greeting — have no test in the plan's three files but the helper's, which cannot see the page's `{#if}` or its reads of the descriptor. The red and green reports cover four files.

**7. `entityDescriptor.ts` changed, a file the plan does not list:** the two home keys are narrowed to `HomeNotDoneKey`, as plan 175-04's summary offers, and `greetingName` accepts a `null` name, because the store's entity holds one for an entity without a name (`check` exit 1 on the first attempt, measured).

**8. The two helpers' tests were not shown red in a commit.** They are in the `feat` commit with the functions they test: a test of a module that does not exist fails at import and would have put a type error into the red commit.

**9. One commit holds failing unit files: `755ca9a53`**, the red commit of Task 2, as the plan orders it. At that commit the frontend's unit suite fails in four files and `yarn workspace @openvaa/frontend check` exits 0. No E2E test was committed red.

**10. The helper's test file changed in the `feat` commit**, by its types alone: at the red commit its input type was the helper's joined with the new member, so that the red commit type-checks; with the member in the helper's own type the join is gone. No case changed.

**11. The settings page's docstring lost its Settings block** (`ENTITY/settings/+page.svelte`, not listed). It named `entities.hideIfMissingAnswers.candidate` as affecting a message; the page reads no setting and renders no such message. Plan 175-09's summary left the line for this plan.

**12. Two more commits than the plan's three:** `007ac4062` for the checklist's finding, as Task 3's step 1 allows, and `5edbc7085` for `tests/README.md`, which describes the spec and was committed after it.

**13. `contestantNoQuestionsPage.expectNeutralPage()` asserts more than the page's id:** the unchanged URL, the heading, one button, no progress bar and the Return's size. They are this plan's truths about the page, and a browser is where the last two can be measured.

**14. The green report was taken on the commit that holds the code**, after the commit; the four files had passed on the working tree first.

**Not recorded in `.planning/WINDOWS.md`:** there is no stub and no skipped test; the ledger is a shared planning file, as plans 01 to 09 left it.

## What was not done or not verified

- **Task 2's verify does not exit 0 as written** (deviation 4).
- **"Neither the neutral page nor the former error page appears for any frame" is proven by component cases**, which read the markup after each flush, and by the absence of the error title from the layout. No browser run captures frames; the E2E shows the end states.
- **Where the save of the last unanswered question leads** was not established (deviation 2).
- **The questions list page's two reads of the setting and `LogoutButton`'s one have no component case.** The function they call has eleven; the home page's wiring of the same call has five. A reading of `LogoutButton` shows that its read cannot change what the modal says: the sentence it guards is in a branch reached only while required info is unanswered, in which case the sentence is shown whatever the setting holds. It was so before this plan and is not changed.
- **The no-questions variants of the home explanation and the profile instructions were not seen in a browser.** On this dataset the candidate's profile is complete, so its home shows the ready sentence. Component cases hold both.
- **No axe scan of the neutral page, no measurement at 320 or 390 px, no reading in the six other locales**: plan 175-12's. The Return's size was measured at the suite's desktop viewport alone.
- **The U-30 fallback was not exercised.**
- **No isolated determinism batch** of the spec was made; D-22's three isolated runs are plan 175-13's. The new project ran four times in this plan: twice with the `questions:` test red by design, twice green.
- **`GEN-01` is not marked complete by this plan**: the preview is plan 175-11's and the confirmation sequence 175-12's. `requirements-completed` is empty on purpose.
- **The preview was not touched**, by the plan.

## For Phase 176

What a later phase reads or replaces, by name.

**The known-zero fact.** `opinionQuestionsStateOf({ questionsReady, questionCount })` in `$lib/contestant/utils/opinionQuestionsState` is the one definition, with four callers: the questions layout, `ContestantNav`, the home page and the profile page. **It cannot tell "not loaded yet" from "no election to load questions for"**: `ctx.questionsReady` stays false for an entity with no selected election (plan 175-08's note), and for such an entity the function answers `'loading'` for good — the questions URL shows the loading view for ever, and the menu item and the home button stay. Today the entity layout's server load signs such an entity out before any page renders. When that sign-out goes, give the function a third input decided from the entity's own nominations, or decide "no nomination" before it is called; every caller then follows.

**The questions layout** (`ENTITY/questions/+layout.svelte`) — states and conditions:

| View | Condition |
|---|---|
| `none` — the neutral page | `questionsState === 'none'`, whatever the required info |
| `loading` | `questionsState === 'loading'`, or `requiredInfoMissing` (`questionsState === 'some' && ctx.unansweredRequiredInfoQuestions.length > 0`) |
| `questions` | otherwise |

**To remove the required-info redirect:** delete the `$effect` that calls `goto(getRoute.current('ContestantAppProfile'))`, delete `requiredInfoMissing`, and reduce `view` to `questionsState === 'none' ? 'none' : questionsState === 'loading' ? 'loading' : 'questions'`. One case of `questions/layout.svelte.test.ts` then changes: "shows the loading view and asks for the profile while required info is unanswered". The neutral page, the loading view and the progress-bar effect are what stays. The menu's questions item and the home's questions and preview buttons are still `disabled` while required info is unanswered (`ContestantNav.svelte`, `infoOutstanding` in the home page); those are separate from the redirect.

**The home's helper.** `computeNextAction(input: ContestantHomeNextActionInput): ContestantHomeNextAction` in `ENTITY/contestantHome.helpers.ts`, with the input and its new member `notDoneKey: ContestantHomeNotDoneKey` as written under *What was built*. Its three cases, evaluated in order: `profileComplete` → the ready title and the preview; `missingInfoCount === 0 && missingOpinionCount !== 0` → the questions; otherwise → the profile. For an entity with no opinion question `missingOpinionCount` is 0, so the second case never applies and the Continue target is never the questions route; the helper still computes `buttonTextQuestion`, which the page does not render then. `computeBadges({ requiredInfoQuestions, opinionQuestions })` is unchanged.

**The home page's facts**, each a `$derived` in `ENTITY/+page.svelte`: `descriptor`, `noOpinionQuestions`, `hiddenForMissingAnswers`, `infoOutstanding`, `entityName`, `nextAction`, `badges`. The questions button is inside `{#if !noOpinionQuestions}`; nothing else of the task list is conditional.

**The menu's item list** and how an item is left out: as written under *What was built*. "The task is omitted" for a menu item is an `{#if}` around its `NavItem`.

**Every test id and state attribute of this plan:**

| Id | Where | Notes |
|---|---|---|
| `contestant-questions-none` | the neutral page's `MainContent` root | rendered for a known zero alone: the reach marker of plan 175-12's scan entry 5 |
| `contestant-questions-none-return` | its one button, an `<a role="button">` to the entity's home | |
| `loading-indicator` | the loading view | `Loading`'s own id; not unique to this layout |
| `contestant-nav-questions` | the menu | absent for a known zero; disabled while required info is unanswered |
| `contestant-home-questions` | the home | absent for a known zero; disabled while required info is unanswered |
| `contestant-home-status` | the home's explanation | its text is the descriptor's sentence, or the ready sentence |

This plan adds **no state attribute**. The profile page's `data-entity-type`, `data-name-state` and `data-outcome` are plan 175-09's.

**The copy keys read here:** `contestantApp.questions.none.title`, `.content`; `common.return`; `contestantApp.home.ingress.notDone.<type>` and `.notDoneNoQuestions.<type>` through `descriptor.homeNotDone` and `descriptor.homeNotDoneNoQuestions`; `contestantApp.common.greeting` with `descriptor.greetingName`.

**Fixture steps that assert these surfaces**, for the specs a later phase changes: `navMenu.expectQuestionsItem(present)`, `contestantEntityHomePage.expectQuestionsButton(present)`, `contestantNoQuestionsPage.open(entity)` / `expectNeutralPage()` / `pressReturn()` / `expectOnHome()`. `contestant-journey.spec.ts` asserts the menu's five items and the home's three tasks by id for a candidate that has questions; it was not changed.

## What the next plans should know

**The dataset after this plan's two tests have run** (until its teardown), beside what plan 175-09's summary lists: organization A has answered all three opinion questions — `qu-opin-3` with its second choice and the comment `[OR-A] Why the party holds this opinion.` — and `qu-info-org` with `[OR-A] A party of the organization-editing dataset.`. A voter who answers every question at the maximum no longer sees A at 33 %. A later test that reads A's answers, its match or its preview sets them first: `setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, { clearAnswers: [...] })` removes answers, and no state step writes one.

**The dataset as seeded:** `qu-opin-3` admits an open comment and the other two opinion questions do not.

**175-11 (preview).** After the `holds:` test A's preview has three answers and an open comment on the third. `opinionQuestionsStateOf` and `isHiddenIfMissingAnswers` are there if the preview needs either rule.

**175-12 (E2E).**
- Scan entry 5: `contestantNoQuestionsPage.open(UNCONFIRMED_CANDIDATE_GRANT)` reaches the neutral page; its reach marker is `contestant-questions-none`.
- The neutral page's own width and target-size checks can start from `expectNeutralPage()`, which measures the Return at the desktop viewport.
- `contestantQuestionsOverviewPage.goToPage()` waits for the list's intro, which the layout renders only once the entity's question data is loaded; for an entity with no opinion question it times out. Use `contestantNoQuestionsPage` there.
- `saveAndLeave()` asserts no destination.
- A direct load of any questions URL now shows `loading-indicator` first.

**175-13 (docs and close).**
- Docstrings that changed: the questions layout, the home page, the questions list page, the settings page, `ContestantNav` and `LogoutButton`. Their generated pages are stale until `generate:docs`.
- `developers-guide/frontend/contexts/+page.md` can say how a page reads the known zero: through `opinionQuestionsStateOf`.
- Whether the last answer's save should lead to the home or to the list (deviation 2) is open.
- The `matchMedia` stub is repeated in twelve component test files.

**Orchestrator.** Nothing in `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` or `CLAUDE.md` was edited; `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted; nothing under `.planning/phases/176-*` was touched. Open for a ruling: whether Task 2's negative search should exclude test files (deviation 4); whether the dataset's change stands (deviation 1); and whether `CLAUDE.md`'s rule should name `questionsReady`, which three more files now read.

## The state the local database is left in

Unchanged in kind from plan 175-09's close. No reset was run and no schema file changed. Read with `psql` after the full run:

- Schema: the tree's. pgTAP's helpers are still in `public`, so `yarn db:types` is valid only after another reset.
- Data: `seed.sql` plus the `default` dataset in the default project (1 election, 328 candidates, 8 organizations), which the dev-seed unit suite writes again: it ran twice in this plan, once by hand after the dataset changed and once in the gate's `unit` row.
- The E2E project `…00e2` exists and holds no election, candidate or organization: every teardown of the four runs passed. The empty project `…05c1` exists.
- Auth users: 2, those of `seed.sql`.
- The Supabase stack and Docker were never restarted. `docker builder prune -af` ran four times: once before each of the three wrapper runs and once inside the E2E driver. The Docker VM has 14.16 GiB free.

## Files touched that the plan did not list

- `apps/frontend/src/lib/contestant/utils/opinionQuestionsState.ts`, `opinionQuestionsState.test.ts`, `hideIfMissingAnswers.ts`, `hideIfMissingAnswers.test.ts` (deviation 5)
- `apps/frontend/src/lib/contestant/utils/entityDescriptor.ts` (deviation 7)
- `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts` (deviation 6)
- `…/profile/+page.svelte` (deviation 5), `…/settings/+page.svelte` (deviation 11)
- `packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts` (deviation 1)
- `tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts`, `contestantQuestionPage.fixture.ts`, `contestantProfilePage.fixture.ts` (deviation 3)
- `tests/tests/specs/perm/perm-hide-hero.spec.ts`, `perm-disable-allow-open.spec.ts` (the checklist's finding; comments only)
- `tests/README.md` (deviation 12)

Gitignored evidence: under `tests/e2e-runs/175-e2e/`, `175-10-control` and `175-10-control-r2`, each with its `.log`, `.exit`, `.launched` and `.evidence.log`, the second with `.verdict.txt`; `175-10-control.spec.ts` and `175-10-control.r1.spec.ts`; `175-10-precommit` with its `.log`, `.exit`, `.launched`, `.evidence.log` and `.verdict.txt`; `175-10-close` with its `.log`, `.exit`, `.launched` and `.verdict.txt`. Under `tests/e2e-runs/175-gates/`, `175-10-close` with its `.log`, `.exit`, `.launched`, `.verdict.txt`, `.scope.txt` and `.hygiene.txt`. Under `tests/e2e-runs/175-unit/`, `175-10-questions-red` and `-questions-green`, each with `.json`, `.log`, `.exit` and `.head`; `175-10-t1-verify.*`, `-t2-verify.*`, `-t2-verify-own.*`, `-t3-verify.*`; and `175-10-tracking-search.txt`.

## Known Stubs

None.

## Threat Flags

None. The plan's register covers what was added: an empty list read as "no questions" (T-175-51), a warning that reads another type's key (T-175-62) and a red test committed into the serial chain (T-175-63). No file of this plan adds a network endpoint, an auth path, a file access or a schema change; the dataset's change is one boolean of a test template.

## Self-Check: PASSED

Checked after writing:

- The seven created files exist; `git diff --name-status 1ed0a3b71 5edbc7085 -- . ':(exclude).planning'` lists 29 paths: the seven added and the twenty-two modified named above.
- The eight commits of the table are ancestors of `HEAD`; `git rev-list --count 1ed0a3b71..5edbc7085` is 8.
- `175-10-t1-verify.exit` and `-t3-verify.exit` hold 0, `-t2-verify.exit` holds 1 and `-t2-verify-own.exit` holds 0, at heads `242ae3be6`, `5edbc7085`, `b2eb0791b` and `b2eb0791b`; each of the three scripts is byte-identical to its block of the plan.
- `tests/e2e-runs/175-e2e/175-10-control.exit` and `175-10-control-r2.exit` hold 1, `175-10-precommit.exit` and `175-10-close.exit` hold 0, and `tests/e2e-runs/175-gates/175-10-close.exit` holds 0; the four verdict files end in PASS; no run directory holds a void marker.
- The two unit reports and their `.head` files exist under `tests/e2e-runs/175-unit/`, with exits 1 and 0; the case counts in this file were read from them and from the runs' own output.
- The kept copy of the spec is identical to the committed spec.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` are unchanged since `1ed0a3b71`.
