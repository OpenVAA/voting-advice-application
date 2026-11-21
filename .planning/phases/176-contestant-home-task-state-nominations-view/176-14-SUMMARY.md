---
phase: 176-contestant-home-task-state-nominations-view
plan: 14
subsystem: frontend
tags: [home, task-list, contestant-app, no-nomination, ssr, a11y, e2e, tdd, NOM-01, NOM-07, TASK-01]
requires:
  - phase: 176-03
    provides: homeAction and taskLabelKey over the pure task state
  - phase: 176-06
    provides: contestantCtx.taskState, known on the server for an entity with no nomination
  - phase: 176-13
    provides: the profile fixture on the no-nomination composition root and the per-project baseline 176-13-close
provides:
  - the home of an entity with no nomination as its task list, complete in the server-rendered markup
  - the row markup for every status the task state can give, behind one condition that plan 176-15 removes
  - seven fixture steps for the task list on contestantHomePage.fixture.ts, registered on the no-nomination composition root
  - the registry id contestant-home-task-badge
  - three `home:` tests in perm-no-nomination.spec.ts
  - the sign-in helper's wait to leave the login page on the suite's slow-page budget
  - the per-project baseline 176-14-close (297 tests, 113 projects)
affects: [176-15, 176-16, 176-17, 176-18, 176-19]
tech-stack:
  added: []
  patterns:
    - "a status told three ways inside one Button: the leading icon, an aria-hidden badge, and an sr-only sentence in the badge snippet, so the sentence is part of the button's accessible name"
    - "a closed entry as a disabled link-button described by one reason sentence through aria-describedby"
    - "a first-frame truth asserted in a browser context with scripts disabled"
key-files:
  created: []
  modified:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte"
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts"
    - tests/tests/fixtures/contestant/contestantHomePage.fixture.ts
    - tests/tests/fixtures/contestant/perm-no-nomination.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
    - tests/tests/utils/testIds.ts
    - tests/tests/setup/shared/registerAndStoreSession.ts
decisions:
  - "The two renderings are two MainContent blocks under one {#if}: the former markup is the {:else} branch, re-indented by Prettier and otherwise unchanged (git diff -w shows no line of it removed)"
  - "The badge of a task row carries a registry id of its own, contestant-home-task-badge, because the suite's lint forbids a raw locator and InfoBadge may not be changed"
  - "A blocked task means the reason is noNomination: the reason is read from the task state's statuses, not from a second rule"
  - "The sign-in helper's first wait takes TIMEOUTS.slowPage: the first pre-commit run was red on that wait under host load, before any home assertion ran"
metrics:
  duration: about 63 min (08:07Z to 09:10Z)
  completed: 2026-10-09
status: complete
requirements-completed: [NOM-01, NOM-07, TASK-01]
actuals:
  tokens: 13257
  tasks: 3
  commits: 4
commits: 4
plan_head_before: 19f4d13ddfc87a8bd42c5c03ed6b388094a5a677
plan_head_after: bd3a166d6e6b263104d1dd14e3f4f2e3d8758122
---

# Phase 176 Plan 14: The Home of an Entity with No Nomination — Summary

**An entity with no nomination now sees its task list on the home — "Define your nomination" first and incomplete, the profile and the questions shown blocked, the preview closed, one sentence saying why, one main action to the nominations view — all of it in the server's markup; the home of an entity that has a nomination is rendered by the markup and the helper it had.**

## Read this first

- **Everything in the plan is done.** Full run `176-14-close`: 297 passed / 0 failed / 0 flaky / 0 skipped / 0 did not run in 113 projects; `perm-no-nomination` 26 against 23, every other project at its `176-13-close` total.
- **One pre-commit run was red, on a test this plan's page does not reach.** `176-14-precommit` failed in `data-setup-entity-selection` — the sign-in of a setup did not leave the login page inside five seconds — and 181 tests did not run. It carries no void marker and no Sleep entry falls inside its window, so it is a failure, not a void. The cause as read from its trace is a fixed five-second wait on a cold dev server under host load; the wait was widened to the suite's slow-page budget in its own commit (`2872bbf9e`), and the run was made again as `176-14-precommit-r2`: 223 of 223. **The diagnosis rests on one trace and on timings, not on a reproduction**; the details, and what `-r2` does and does not show, are under *The red pre-commit run*.
- **Two files the plan does not list were changed:** `tests/tests/utils/testIds.ts` (one id) and `tests/tests/setup/shared/registerAndStoreSession.ts` (the wait).
- **The third `home:` test is red in the control on the greeting, not on the list.** With scripts off the page as it was greets with `Hello, ?!`, and the greeting is the test's first assertion after the landing. The plan says each test fails on an expectation of the list; the verdict passes, and the failure is an expectation of the surface this plan builds.
- **A row's forms for `complete` and for a status that is not known, and the main action's loading and preview forms, are written and are not reached by any state this plan's condition lets through.** No case exercises them here; plan 176-15 does.
- **Not looked at:** the page in a browser by eye, and the list with a screen reader. See *Not done, or not verified*, which also holds one accessibility question for the phase.
- The hook line "CONTEXT WARNING: Usage at NN%" appeared after tool calls and was taken as the orchestrator's.
- `git status --short` showed ` M .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` and `?? CAND-APP-PLAN.md` from the start. Neither was staged, edited or restored.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1 | `2ed2b83fd` | test(176-14): fixture steps for the home's task list |
| 2 | `63117bf73` | test(176-14): the home of an entity with no nomination, as its task list |
| 3 | `2872bbf9e` | test(176-14): the sign-in helper gives the login redirect a slow page's time |
| 3 | `bd3a166d6` | feat(176-14): an entity with no nomination sees its tasks on the home, starting with the nomination |

Each was committed by pathspec from a script kept as `tests/e2e-runs/176-unit/176-14-commit-*.sh`. The plan lays out three commits; the third above is deviation 1.

## Each verify, with its real exit status

Each `<automated>` block was extracted byte for byte from the plan to `tests/e2e-runs/176-unit/176-14-t<N>-verify.sh` and run with `bash`; the log, the exit status and the head are beside each.

| Task | Exit | Head | Note |
|---|---|---|---|
| 1 | **0** | `2ed2b83fd` | With the spec alone uncommitted, after the control. |
| 2 | **0** | `63117bf73` | With the page and the spec uncommitted, after the working tree's checks. |
| 3 | **0** | `bd3a166d6` | After the full run and before any commit outside `.planning/`. |

The plan-level checks: `git log` names no commit of this plan for `contestantHome.helpers.ts` or its test (0 lines); the control, the pre-commit and the full-run verdicts each exit 0.

## The list's structure, in document order

What `$ENTITY/+page.svelte` renders while the entity's nomination task is incomplete, inside `MainContent`:

1. **The note slot** — `NotEditableNote reason="answersLocked"` under `contestant-answers-locked-warning`, only while answers are locked, with its first sentence alone. The slot's wrapper (`role="note"`) is rendered empty otherwise, as before.
2. **The title** — `<h1>`: `contestantApp.common.greeting` with the name the descriptor's `greetingName` reads from `contestantCtx.selectedEntity`. No hero snippet is passed, so no `<figure>` is rendered.
3. **The explanation** — `<p class="text-center" data-testid="contestant-home-status">`: the descriptor's `homeNoNomination`.
4. **The list** — `<ol class="mt-lg w-full list-none pl-0" aria-label={t('contestantApp.home.tasksLabel')} data-testid="contestant-home-tasks" data-task-state=…>`, one `<li>` per task of `contestantCtx.taskState.tasks`, each holding one `Button` and nothing else.
5. **The preview entry** — a `Button` under the list, outside it: `contestant-home-preview`, `data-preview`.
6. **The reason sentence** — `<p class="small-info mt-sm text-center" id="contestant-home-closed-reason" data-testid="contestant-home-closed-reason" data-reason=…>`, rendered when a reason applies.
7. **The primary actions** — the main action `contestant-home-continue` with `data-next-step`, and under it `LogoutButton` under `contestant-home-logout`, unchanged.

## Every id and state attribute

| Element | `data-testid` | State attribute | What this plan's state gives | What the markup can give |
|---|---|---|---|---|
| the `<ol>` | `contestant-home-tasks` | `data-task-state` | `ready` | `ready` or `pending` (from `taskState.known`) |
| each `<li>` | `contestant-home-task` | `data-task` | `nomination`, `profile`, `questions` | the task's id |
| each `<li>` | | `data-status` | `incomplete` (nomination), `blocked` (profile, questions) | `complete`, `incomplete`, `blocked`, `pending` (`task.status ?? 'pending'`) |
| the nomination's button | `contestant-home-nomination` | none | a link to the nominations view | |
| the profile's button | `contestant-home-profile` | none | disabled: no `href`, `aria-disabled="true"`, `tabindex="-1"`, `aria-describedby="contestant-home-closed-reason"` | |
| the questions' button | `contestant-home-questions` | none | the same | |
| the badge's wrapper | `contestant-home-task-badge` — **new in the registry**, `testIds.contestant.home.taskBadge` | `aria-hidden="true"` | on the nomination row, holding `!` | on every incomplete row: `task.count`, or `!` when the task has none |
| the status sentence | none: `<span class="sr-only">` inside the button | none | `…taskStatus.incomplete`, `…taskStatus.blocked` | also `…taskStatus.complete` and `…taskStatus.incompleteCount`; none while the status is not known |
| the preview entry | `contestant-home-preview` | `data-preview` | `closed`; disabled; described by the reason | `open` or `closed` (from `taskState.previewOpen`) |
| the reason sentence | `contestant-home-closed-reason`, which is also its `id` | `data-reason` | `noNomination` | `noNomination`; not rendered when no task is blocked |
| the main action | `contestant-home-continue` | `data-next-step` | `nomination` | `nomination`, `profile`, `questions`, `preview`; absent on the loading form |
| the explanation | `contestant-home-status` | none | | |

## The one condition between the two renderings, as written

In the script:

```ts
  /** Whether the page renders the task list: the entity's nomination task is incomplete. */
  const taskListShown = $derived(
    contestantCtx.taskState.tasks.some((task) => task.id === 'nomination' && task.status === 'incomplete')
  );
```

In the markup, once:

```svelte
{#if taskListShown}
  <MainContent title={t('contestantApp.common.greeting', { username: selectedName || '?' })}>
    … the task list …
  </MainContent>
{:else}
  <MainContent title={nextAction.title}>
    … the former markup …
  </MainContent>
{/if}
```

The `{:else}` branch is the page's former markup. Prettier re-indented it by one level; `git diff -w 63117bf73 bd3a166d6` on the page removes no line of it (the three lines it removes are the docstring's). `contestantHome.helpers.ts` and its test are as they were before the plan, and the script's former derivations — `entityName`, `nextAction`, `badges`, `hiddenForMissingAnswers`, `noOpinionQuestions`, `infoOutstanding`, the two counts, `profileComplete` — are unchanged.

With no entity known the state has no tasks, and with a nomination its first task is complete: in both the former markup renders.

## For plan 176-15: the row markup as written

Plan 176-15 removes `taskListShown`, the `{#if}` / `{:else}` / `{/if}` lines and the whole `{:else}` branch, with the script's former derivations and the imports only they need (`computeBadges`, `computeNextAction`, `isHiddenIfMissingAnswers`, `opinionQuestionsStateOf`, and `HeroEmoji` until the all-complete state brings it back). What it adds goes **into** the following, not beside it.

The row, for any status:

```svelte
    <ol
      class="mt-lg w-full list-none pl-0"
      aria-label={t('contestantApp.home.tasksLabel')}
      data-testid="contestant-home-tasks"
      data-task-state={taskState.known ? 'ready' : 'pending'}>
      {#each taskState.tasks as task (task.id)}
        {@const blocked = task.status === 'blocked'}
        {@const sentence = statusSentence(task)}
        <li data-testid="contestant-home-task" data-task={task.id} data-status={task.status ?? 'pending'}>
          <Button
            text={t(taskLabelKey(task, answersLocked))}
            icon={rowIcon(task)}
            iconPos="left"
            href={getRoute.current(task.route)}
            disabled={blocked}
            aria-describedby={blocked && closedReason ? CLOSED_REASON_ID : undefined}
            data-testid={TASK_TEST_ID[task.id]}>
            {#snippet badge()}
              {#if task.status === 'incomplete'}
                <span aria-hidden="true" data-testid="contestant-home-task-badge">
                  <InfoBadge text={task.count ?? '!'} />
                </span>
              {/if}
              {#if sentence}
                <span class="sr-only">{sentence}</span>
              {/if}
            {/snippet}
          </Button>
        </li>
      {/each}
    </ol>
```

What it reads, all in the script under the banner *The task list*:

- `taskState` — `$derived(contestantCtx.taskState)`, one value, never destructured.
- `rowIcon(task)` — `check` for `complete`, `locked` for `blocked`, otherwise `TASK_ICON[task.id]` (`election`, `profile`, `opinion`).
- `statusSentence(task)` — the `taskStatus` message of the status; `incompleteCount` with `{ count }` when `task.count` is defined and `incomplete` when it is not; `undefined` for a task with no status.
- `TASK_TEST_ID` — the button's id by task.
- `CLOSED_REASON_ID` — `'contestant-home-closed-reason'`, a constant, so the server's and the browser's markup agree.
- `closedReason` — **the one place a reason is decided**:

```ts
  const closedReason = $derived.by(() => {
    if (taskState.tasks.some((task) => task.status === 'blocked')) {
      return { reason: 'noNomination', sentence: t(descriptor.closedReasonNoNomination) } as const;
    }
    return undefined;
  });
```

  The preview's own reason (`previewNotReady`, with `closedReason.preview` or `closedReason.previewNoQuestions`) is a second branch of this derived value. The preview entry already names the reason's id whenever it is closed and a reason is rendered, and names none while the state is pending.

The rest of the rendering, as written:

```svelte
    <Button
      text={t('contestantApp.home.preview')}
      icon="previewProfile"
      iconPos="left"
      href={getRoute.current('ContestantAppPreview')}
      disabled={!taskState.previewOpen}
      aria-describedby={!taskState.previewOpen && closedReason ? CLOSED_REASON_ID : undefined}
      data-testid="contestant-home-preview"
      data-preview={taskState.previewOpen ? 'open' : 'closed'} />

    {#if closedReason}
      <p
        class="small-info mt-sm text-center"
        id={CLOSED_REASON_ID}
        data-testid="contestant-home-closed-reason"
        data-reason={closedReason.reason}>
        {closedReason.sentence}
      </p>
    {/if}

    {#snippet primaryActions()}
      <div class="flex w-full flex-col items-center justify-center">
        {#if action.kind === 'pending'}
          <Button variant="main" text={actionLabel} loading data-testid="contestant-home-continue" />
        {:else}
          <Button
            variant="main"
            text={actionLabel}
            icon="next"
            href={getRoute.current(action.route)}
            data-testid="contestant-home-continue"
            data-next-step={action.kind === 'task' ? action.task : 'preview'} />
        {/if}
        <LogoutButton variant="normal" icon={undefined} data-testid="contestant-home-logout" />
      </div>
    {/snippet}
```

`action` is `$derived(homeAction(contestantCtx.taskState))`; `actionLabel` is the label of the row of the task the action names, found in `taskState.tasks`, and `contestantApp.home.preview` otherwise.

What is **not** there yet and belongs to plan 176-15:

- **The title, the hero, the explanation and the tip by state.** The title is the greeting, the explanation is `descriptor.homeNoNomination`, and no hero or tip is rendered. The other two states need `homeNotDone` / `homeNotDoneNoQuestions`, `contestantApp.home.ready`, the success emoji and `contestant-home-tip`.
- **The place-holding paragraphs while the state is pending.** The explanation is rendered under `contestant-home-status` unconditionally here, which is right only because this state is never pending. **Once the condition goes, `contestant-home-status` must be on the real explanation alone**, or every committed wait on it (listed below) passes against a pending frame.
- **The note's second sentence.** The note renders the reason alone. `hiddenForMissingAnswers` is still in the script, for the former markup.
- **The greeting's fallback.** `selectedName || '?'`: the `?` is left for an entity whose name is empty, which page data can hold for a party with no name in the request's locale or the default one.
- **`expectTasks`** is kept; its callers are in the journey.

Forms written and not exercised by a case of this plan: a `complete` row (the check, the "complete" sentence, no badge), a row with no status (its own icon, no sentence, `data-status="pending"`), an incomplete row with a count (the figure, the "items left" sentence), `data-task-state="pending"`, an open preview, the main action's loading form and its preview form. The component test's fake context takes any `TaskState`, so each is one `taskStateOf` call away.

## The fixture's steps

`tests/tests/fixtures/contestant/contestantHomePage.fixture.ts`, beside the four existing steps, which are unchanged. Every assertion of the new steps is hard and waits `TIMEOUTS.slowPage`, which is how the nominations view's fixture reads "the suite's page timeout"; every id is from the registry.

| Step | What it asserts |
|---|---|
| `expectTaskList({ nomination, profile, questions })` | the list's `data-task-state` is `ready`; then for each task the row's `data-task` and `data-status`, or no row for `null`. A row is the `contestant-home-task` that holds the task's own button |
| `expectTaskCount(task, count)` | the text of the row's `contestant-home-task-badge`: a number, `'!'`, or no badge for `null` |
| `expectPreview('open' \| 'closed')` | `data-preview`, and enabled or disabled to match |
| `expectReason(reason \| null)` | the sentence visible with that `data-reason`, or absent |
| `expectNextStep(step)` | the main action's `data-next-step` |
| `expectClosedEntryDescribed('profile' \| 'questions' \| 'preview')` | the entry is disabled and its accessible description is the reason sentence's text, read from the page |
| `expectGreeting(name)` | the first-level heading contains the name |

Exported types: `ContestantHomeListTask`, `ContestantHomeTaskStatus`, `ContestantHomeTaskStatuses`, `ContestantHomeClosedReason`, `ContestantHomeNextStep`, `ContestantHomeClosableEntry`. The fixture is registered on the no-nomination composition root as `contestantHomePage`. Its header still says four soft-assertion call sites, which is what it holds: the new steps add none.

The spec's three tests use all seven steps and the existing `clickContinue`; the plan counts five. `expectTaskCount` asserts "no count on a blocked row" and `expectPreview` "the preview closed", both in the two tests with scripts on.

## What the committed readers of a no-nomination home wait on

Derived from `perm-no-nomination.spec.ts` and its setup at `2ed2b83fd`, for `ca-none` and `or-none` in the state `none`:

| Reader | Where | Waits on |
|---|---|---|
| `contestantEntityHomePage.expectLanded` | `dataset:` × 2 | `contestant-home-status` visible; the URL an entity home with the entity's type and id |
| `contestantEntityPages.expectOnHome` | `gate:` "led to its home" × 2 (six times each); `gate:` "a nomination the administrator adds" × 2; `nominations:` the empty view's Return × 2; `gate:` "an entry the browser still shows open" | the URL, and `contestant-home-status` visible |
| `contestantEntityPages.expectHomeHeadingFocused` | `gate:` "an entry the browser still shows open" | the `<h1>` has focus |
| `registerAndStoreSession` with `settledTestId` | the dataset's setup, for each of its three editors | `contestant-home-status` visible |

The task-list rendering keeps all of them: the id on the explanation, one `<h1>` with `tabindex="-1"` from `MainContent`, the URL. The stale-entry test is the one that crosses the condition inside one session — the home is loaded with a pending nomination, the nomination is removed, the click on the profile entry is redirected home, and the page then renders the task list where the former markup was — and the heading that has focus afterwards is the new block's. It passed in `176-14-precommit-r2` and in the full run.

## Red and green (unit)

`page.svelte.test.ts`: 17 cases added in two describes; the 22 existing cases are as they were. The harness gained `taskState` and `nominationsLocked` behind getters, a default state built by the application's own `taskStateOf` for an entity that has a nomination, and a route builder that takes a route object as well as a name.

- **Red** — `tests/e2e-runs/176-unit/176-14-home-red.json`, head `63117bf73` (the test committed alone): 39 cases, **24 passed, 15 failed**, each an `AssertionError`. svelte-check ran on the tree with the test file before that commit: exit 0, so the commit passes `check` on its own.
- **Green** — `176-14-home-green.json`, head `63117bf73` with the page uncommitted: **39 of 39**.
- The frontend's whole unit suite on the same tree: 3543 passed, 20 skipped, 0 failed — 3526 before, and 17 more.

| Red case | First line of its failure |
|---|---|
| greets a candidate / an organization by the name of the selected entity, under one heading and no hero (2) | expected `…greeting(username=?)` to be the greeting with the entity's name |
| explains to a candidate / an organization what a nomination is, in no words or colour of an error (2) | expected `…ingress.notDone.<type>` to be `…ingress.noNomination.<type>` |
| lists the three tasks in order in a named ordered list that says it is ready | `[data-testid="contestant-home-tasks"]` should be rendered: expected null not to be null |
| shows the nomination as a link to the nominations view that is not completed, with a mark hidden from assistive technology | `[data-testid="contestant-home-nomination"]` should be rendered |
| shows the profile / the questions row as a locked button with no target that says it is not available and why (2) | expected undefined to be `'profile'` / `'questions'`: the button is in no task row |
| shows the preview entry under the list, closed and described by the reason | the list should be rendered |
| tells a candidate / an organization why the entries are closed, after them and in no colour of a warning (2) | expected to have a length of 1 but got 0 |
| offers one main action, labelled as the nomination row, that leads to the nominations view | expected `…basicInfo.enter` to contain `…nomination.enter` |
| with answers locked shows the note with its first sentence alone, and the closed rows take their view labels | the note contains the sentence that says the profile is hidden |
| is the same with nominations locked as with them unlocked | the list should be rendered |
| puts every status sentence inside a button, and no view-transition name on what it renders | the list should be rendered |

Green in the red report by design: the two cases of an entity that has a nomination (no task list, no reason sentence, the profile button there).

The locked icon and the nomination's own icon are asserted by comparing the row's `<svg>` content with the icon's drawing once the dynamic imports have settled. The view-transition case sees only what jsdom keeps of a `style` attribute; the gate for that rule is the verify chain's search of the page, which finds no such name.

## The control (E2E)

`tests/e2e-runs/176-e2e/176-14-control`, `--project perm-no-nomination`, head `2ed2b83fd` with `perm-no-nomination.spec.ts` alone uncommitted (kept as `176-14-control.perm-no-nomination.spec.ts`). 08:14:07Z to 08:25:24Z; AC power, 100 %; Docker VM free before: **18.31 GiB**. **223 total, 220 passed, 3 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 1; no void marker. Launched by `tests/e2e-runs/176-unit/176-14-control-launch.sh`, plan 13's launcher under this plan's name: it records the head, the status, the diff, the power source and the Docker VM's free space beside the run and refuses when a run is in flight, the port is held or the space is under the floor.

Verdict `control 176-14-control --project perm-no-nomination --setup data-setup-perm-no-nomination --dirty-only tests/tests/specs/perm/perm-no-nomination.spec.ts --red "home:"`: **PASS**, exit 0.

| Red test | First error line | What failed |
|---|---|---|
| home: a candidate with no nomination sees the nomination to define and the rest closed, with the reason | `Error: expect(locator).toHaveAttribute(expected) failed` | `getByTestId('contestant-home-tasks')`, expected `"ready"`, element(s) not found after 10 s |
| home: a party with no nomination sees the same list under its own name | `Error: expect(locator).toHaveAttribute(expected) failed` | the same locator. The greeting before it passed: the former page greets by the store's name once scripts have run |
| home: the no-nomination home is complete before any script runs | `Error: expect(locator).toContainText(expected) failed` | `getByRole('heading', { level: 1 })`, expected substring `"[CA-N] Unnominated"`, received `"Hello, ?!"` |

The dataset fields the tests read: the grants `UNNOMINATED_CANDIDATE_GRANT` and `UNNOMINATED_ORGANIZATION_GRANT`; the seeded names `UNNOMINATED_CANDIDATE_NAME.firstName` (`[CA-N] Unnominated`) and `UNNOMINATED_ORGANIZATION_NAME.en` (`[OR-N] Unnominated Party`). Each test begins with `setNominationState(…, 'none')` and opens the home by a full load. The third runs in a describe with `javaScriptEnabled: false`.

## The red pre-commit run

`tests/e2e-runs/176-e2e/176-14-precommit`, head `63117bf73` with the page and the spec uncommitted (kept beside the run). 08:28:51Z to 08:31:43Z; AC power; Docker VM free before: **18.23 GiB**. **223 total, 41 passed, 1 failed, 0 flaky, 181 did not run.** Wrapper exit 1. No `VOID-host-suspend.txt`.

**The failed test** — `data-setup-entity-selection` › "register + authenticate as a user whose only grant is then removed": `expect(page).not.toHaveURL(/.*login.*/)` at `tests/tests/setup/shared/registerAndStoreSession.ts:118`, five seconds, the URL still the login page and the submit button still in its loading form. Everything that depends on that setup did not run, the three `home:` tests among them.

**What was read:**

- *The host's log.* `pmset -g log` holds a `Sleep` entry at 11:31:58 local (08:31:58Z), "Clamshell Sleep", 310 s on battery, and a wake on AC power at 11:37:08. The run ended at 08:31:43Z, fifteen seconds before it, and the failed test ran from 08:29:18Z to 08:29:31Z. **No Sleep, Wake or DarkWake entry falls inside the run's window**, and the wrapper wrote no void marker. The run is a failure, not a void.
- *The trace* (kept: `tests/e2e-runs/176-unit/176-14-precommit-red-trace/`). The click on Submit took 2.8 s to return; the login form's POST began at 08:29:25.2Z and took 1.75 s; the load that follows it 1.52 s; the entity's load 0.93 s, ending at 08:29:29.4Z; the root's client-side reads ended at 08:29:29.9Z. The five-second wait ran from 08:29:25.2Z to 08:29:30.3Z. The navigation was a few hundred milliseconds from done when the wait ended.
- *Which page it led to.* The icons requested after the loads are the profile's, the opinions', the preview's and the menu's: the former markup's and the signed-in menu's. That user's organization has a nomination. No request names an icon of the task list.
- *The other sign-ins of the same run.* The four took 11.1 to 12.9 s, against 8.7 to 9.5 s in the control, made minutes earlier on the same tree but for the page. One of the four signs in a user who has not accepted the terms and is shown the terms gate, which renders in place of the entity's pages: it was 1.8 s slower as well.
- *The host.* `uptime`, minutes after: load averages 28.5, 32.2, 30.4. `ps`, read at 11:38 local: a `cpptools` process of an editor at 129 % CPU, 25 minutes old; a second, unrelated dev server listens on another port. The sign-in setups run four at once against a dev server started seconds before, which compiles each route at its first request.

**The cause, as far as the evidence goes:** the helper's first wait after Submit used the default five seconds for what is a form post and two redirected loads on a cold server; under that load it took a little over five. The helper's next line already waits `TIMEOUTS.slowPage` for the landing page to settle.

**What was done:** the wait takes `TIMEOUTS.slowPage`, and its comment says why (`2872bbf9e`, committed alone before the next run; it only lengthens a wait, so it can turn no test red). The run was then made again under the next suffix, on a tree that had changed.

**What is not established:** that the page of this plan added nothing to that sign-in — the evidence says the slowdown was general and reached a sign-in that never renders the home, but it was not measured in isolation. And `-r2` does not prove the fix: its sign-ins took 8.6 to 9.5 s, inside the old five-second wait as well. `-r2` and the full run show the tree green; the change to the wait is justified by the trace alone.

## The pre-commit run and its verdict

`tests/e2e-runs/176-e2e/176-14-precommit-r2`, `--project perm-no-nomination`, head `2872bbf9e` with two paths uncommitted: the page and the spec (kept beside the run as `176-14-precommit-r2.+page.svelte.kept` and `176-14-precommit-r2.perm-no-nomination.spec.ts`; both were compared byte for byte with the working tree before the commit). 08:40:50Z to 08:50:07Z; AC power; Docker VM free before: **18.21 GiB**. **223 total, 223 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 0. At its head the page held no task list and the spec no `home:` test.

`control 176-14-precommit --project perm-no-nomination --setup data-setup-perm-no-nomination --dirty-only apps/frontend/src/routes/contestant/ --dirty-only tests/tests/ --green --were-red-in 176-14-control` (the label reads its newest attempt, `-r2`): **PASS**, exit 0 — "was red, now passed" for each of the three `home:` tests; `perm-no-nomination: 26 test(s), 26 passed`.

The projects of its chain that land on a home: `contestant-journey` 1 of 1, `contestant-a11y-scan` 22 of 22, `contestant-entity-selection` 8 of 8, `perm-organization-editing` 46 of 46, `perm-answers-locked` 4 of 4, `perm-localisation-positive` 2 of 2, `perm-no-nomination` 26 of 26. Nothing had to be settled in another spec.

**The one commit's paths** (`bd3a166d6`): `$ENTITY/+page.svelte` and `tests/tests/specs/perm/perm-no-nomination.spec.ts`.

## The code review checklist

Over the page, its test, the fixture, the registry's id, the helper's wait and the spec's three tests.

| Item | Outcome |
|---|---|
| Solves the issue | Yes, for the state this plan owns: NOM-01's first task and NOM-07's "shown but disabled" on the home. The home of an entity that has a nomination is plan 176-15's. |
| OWASP top 10 | The entity's name reaches the heading as a message parameter rendered as text; no raw-HTML block was added. No input, read, route or write. |
| Code style guide; no `any` | Followed; none. The page's two functions and its derived values carry TSDoc. |
| No repeated code | **Open until plan 176-15, by the plan's design:** the preview entry and the primary-actions wrapper are in both renderings, and `contestantHome.helpers.ts` overlaps `homeAction` and `taskLabelKey`. `TASK_TEST_ID` in the page holds three literals the registry also holds, as every page's markup does. |
| New entities documented | The `@component` docstring says what each rendering shows, the settings read and the accessibility of the list; TSDoc on the fixture's steps and types; the registry's comment on the new id. |
| Repo documentation | No page under `apps/docs` names the home's markup, its ids or its helper (searched). |
| Tracking events | None: nothing a user can perform was added. The rows and the main action are links. |
| Svelte component guidelines | No new component. `Button`, `InfoBadge` and `MainContent` are unchanged. `taskState`, `selectedEntity` and `answersLocked` are read on `contestantCtx` inside derived scopes; `$derived(contestantCtx.taskState)` aliases a state the context replaces whole. No branch on the entity's type; no view-transition name. |
| Errors handled and logged | Nothing that can throw was added. |
| Failing checks | One red E2E run, diagnosed above. svelte-check, ESLint, Prettier and the comment-hygiene guard were 0 before each commit. The first draft of the fixture used raw locators, which the suite's lint refuses, and of the test an arrow function where the lint asks for a declaration; both were rewritten before their commits. |
| Shared dependents | The former rendering is untouched; every project that lands on a home is green in the pre-commit run and the full run. |
| WCAG A/AA; keyboard and screen reader | One `<h1>` (a case). The list is an `<ol>` named by `aria-label`, its rows `<li>`s holding one button each (cases). A row's name holds its status once: the sentence is inside the button and the badge is `aria-hidden` (cases). A blocked row and the closed preview are `role="button"`, `aria-disabled="true"`, without `href`, `tabindex="-1"`, described by the reason sentence (cases; the E2E step reads the accessible description the browser computes). The reason follows the entries it explains (a case). No motion added. The reason is `small-info` at full contrast; no warning colour on it or on the explanation (cases). **Not exercised with a screen reader, and no axe scan of this state exists before plan 176-18.** One question is recorded under *Not done, or not verified*. |
| Developers' and Publishers' Guides | Not touched. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every comment, docstring and title read: none tells history or names a decision, plan or proposal. |
| Commit history | Fixture, red test, feature, as planned, with the helper's wait between them as a commit of its own. No `[db]` change. No commit fixes an earlier one of this plan. |

No finding changed the page after its checks, so the page the pre-commit run ran is the page committed.

## The gate rows and the full run

**Gate rows** — `tests/e2e-runs/176-gates/176-14-close`, head `bd3a166d6`: `typecheck=0 lint=0 unit=0 check-frontend=0 build=0 format=0`; not stale; no Sleep entry inside the run's window. Verdict: **PASS**, exit 0. Docker VM free before: 18.63 GiB.

**The full run** — `tests/e2e-runs/176-e2e/176-14-close`, through the driver with `--require-project perm-no-nomination`. Head `bd3a166d6`. 08:55:20Z to 09:05:42Z. Driver exit **0**. Docker VM free before: **18.61 GiB**; after: 18.51 GiB. AC power, 100 %; `sleep_entries_in_window: 0`. Judged at once with the plan's command: exit **0**.

```
run: tests/e2e-runs/176-e2e/176-14-close
counts: total 297, passed 297, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
scope: the full default suite
not stale: head bd3a166d6 is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project perm-no-nomination: 26/26 passed
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project perm-organization-editing: 46/46 passed
project contestant-entity-selection: 8/8 passed
compared with: tests/e2e-runs/176-e2e/176-13-close
per project: 113 compared, 0 not as expected
176-verdict e2e 176-14-close: PASS
```

Against `176-13-close` (294 tests): `perm-no-nomination` 26 against 23 ("above 23: holds"); each of the other 112 projects at its total. No axe finding; no overflow. Nothing was red, flaky or left unrun, and the run was made once.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The sign-in helper's five-second wait failed the first pre-commit run**
- **Found during:** Task 3, step 2
- **Issue:** `176-14-precommit` was red in `data-setup-entity-selection` before any test of the home ran; see *The red pre-commit run*.
- **Fix:** `registerAndStoreSession` waits `TIMEOUTS.slowPage` for the URL to leave the login page.
- **Files modified:** `tests/tests/setup/shared/registerAndStoreSession.ts` (not in the plan's list)
- **Commit:** `2872bbf9e`
- **Flagged:** the diagnosis is from one trace and from timings. It was not reproduced, and the run after it would have passed without the change. The helper is shared by every setup that signs a user in.

**2. [Rule 3 - Blocking] The badge had no locator the suite's lint admits**
- **Found during:** Task 1, step 1
- **Issue:** `expectTaskCount` reads a row's badge. `InfoBadge` carries no test id and may not be changed, and ESLint refuses a raw `.locator()` in a fixture.
- **Fix:** the page's own `aria-hidden` wrapper around the badge carries `contestant-home-task-badge`, registered as `testIds.contestant.home.taskBadge`. The UI contract's Locator Contract does not list that id.
- **Files modified:** `tests/tests/utils/testIds.ts` (not in the plan's list), the fixture, the page
- **Commit:** `2ed2b83fd` (the id and the step), `bd3a166d6` (the attribute)

### Other departures

- **The third `home:` test's first red expectation is the greeting**, as said above. Its assertions are in the order the plan lists them.
- **`expectTaskCount` takes `number | '!' | null`**, so that the mark of an incomplete task with nothing to count can be asserted; the plan gives a figure or `null`.
- **`expectPreview('open')` also asserts that the entry is enabled.** The plan asks for the disabled half.
- **`expectTaskList` asserts each row's `data-task` beside its `data-status`**, since the row is found by the button it holds.
- **The former markup is re-indented**, by Prettier, inside the `{:else}`.
- **The red unit report was taken twice**: before the test's commit and again at its head, which is the report kept. Both hold 15 failures of 39.
- **Task 2's step 3 ran from a script of this plan's own** (`176-14-t2-green-gates.sh`): svelte-check, the page's test, the whole frontend unit suite, ESLint, Prettier and the hygiene guard, each status read directly.
- **The test's harness changed beside the new cases**: two members of the fake context, a default task state, and the route builder's parameter. No existing case's body changed, and all 22 pass against the former page and against the new one.
- **The plan-head ledger file was not written.** `plan_head_before` is the head read by the plan's first command, `19f4d13dd`, which is also the head the dispatch names; `commits: 4` is `git rev-list --count 19f4d13dd..bd3a166d6`.

## Not done, or not verified

- **The page was not looked at in a browser by eye.** No dev server may be started outside the wrapper, and the suite keeps no screenshot of a passing test. What is known of its look is the UI contract's classes, written as given: the list `mt-lg w-full list-none pl-0`, the reason `small-info mt-sm text-center`. The base style gives the explanation a 16 px bottom margin, which with the list's `mt-lg` makes 36 px between them where the former page has 16 px.
- **No screen reader was run.** The accessible name and description are asserted from the DOM (jsdom) and, for the description, from the browser's own computation (Playwright).
- **An accessibility question for the phase, not answered here:** WebKit removes list semantics from a list styled `list-style: none` unless it carries `role="list"`. If that holds for the Safari versions the project supports, VoiceOver users are told neither the list's name nor a row's position, on this list and on the nominations view's `<ul>` of plan 176-12 alike. The UI contract's markup has no role, and adding one needs an accepted Svelte warning (`a11y_no_redundant_roles`). Neither list was changed. **This is stated from memory of WebKit's behaviour and was not tested.**
- **No axe scan and no width measurement of the no-nomination home.** Both are plan 176-18's.
- **The forms listed under *For plan 176-15* that no state reaches here** are covered by no case.
- **Nominations locked on the home, and answers locked with no nomination,** are component cases alone, not E2E steps.
- **`STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` were not read for sentences this plan made false.**
- Nothing was appended to `.planning/WINDOWS.md`: no stub, no skipped test, no verify left unrun.

## For plans 176-15 to 176-18

- **176-15:** see *For plan 176-15: the row markup as written*. The component test's `NOMINATED_FACTS` and `taskStateOf` build any state. The fixture's seven steps are there for it on both roots it needs: the no-nomination root registers `contestantHomePage` since this plan, and the journey's root, where the four `expectTasks` callers are, registered it before.
- **176-16 (the menu):** the home's reason sentence has the id and the test id `contestant-home-closed-reason`; the menu's own is `contestant-nav-closed-reason`. `closedReason` in the page reads "a blocked task means `noNomination`" from the state; the menu can read the same from `contestantCtx.taskState.tasks`.
- **176-18 (scans and widths):** the no-nomination home's content marker is `contestant-home-status`, and `contestant-home-tasks[data-task-state="ready"]` says the list is drawn. The disabled rows' labels are `text-neutral/20`, as the former page's disabled buttons are in the existing `cand-home` scan.
- **Any plan that signs a user in through `registerAndStoreSession`:** its first wait is now ten seconds. A sign-in that takes longer than five on a cold server no longer fails by itself.
- **Counts:** a one-project run of `perm-no-nomination` is 223 tests, 26 its own; the full run is 297 in 113 projects; the frontend unit suite is 3543 cases; each message catalogue still holds 649 keys — every message this plan reads was already there.
- **The `home:` prefix** now exists in `perm-no-nomination.spec.ts` and the spec's header names it. Plan 176-15's prefix `home: with` is matched by `--red "home: with"`; `--red "home:"` would match this plan's three tests too.

## The state the local database is left in

Not reset by this plan. The stack is up; neither it nor Docker was restarted; nothing pruned but the build cache, by the E2E driver. Read with `psql` after the full run: 3 projects; 2 auth users; 377 nominations (the default project's dataset); no candidate or nomination row of an E2E dataset left; the suite's project has `answersLocked` false and no `nominationsLocked` key; `private.invitation_link_witness` holds 138 rows, so `39-invitations.test.sql` test 238 is red on this database without a reset — the known finding. Nothing listens on the wrapper's port and no run is in flight. Docker VM free: 18.51 GiB.

## Files touched that the plan did not list

- `tests/tests/utils/testIds.ts` — deviation 2.
- `tests/tests/setup/shared/registerAndStoreSession.ts` — deviation 1.

Listed and touched: all five.

Gitignored evidence: `tests/e2e-runs/176-e2e/176-14-control`, `176-14-precommit` (red), `176-14-precommit-r2` and `176-14-close`, each with its launch records, kept copies and verdict beside it; `tests/e2e-runs/176-gates/176-14-close`; in `tests/e2e-runs/176-unit/`: `176-14-home-red.{json,head,log}`, `176-14-home-green.{json,head,log,status}`, `176-14-frontend-unit.json`, `176-14-t<N>-verify.sh` with `.log`, `.exit` and `.head`, `176-14-commit-*.{sh,log}`, `176-14-control-launch.sh`, `176-14-t2-red-gates.*`, `176-14-t2-green-gates.*`, the run markers and verdict logs, and `176-14-precommit-red-trace/`. Nothing under `tests/e2e-runs/` was deleted.

## Known Stubs

None. The `?` in the greeting is the fallback for an entity with no name, not a placeholder for data that is on its way.

## Threat Flags

None beyond the plan's register. T-176-55: the name is a message parameter rendered as text. T-176-56: the disabled button with a role, the description and the status sentence, asserted by component cases and by `expectClosedEntryDescribed` in a browser. T-176-79: one condition; the former helper and its test unchanged; the 22 existing cases unchanged and green; the pre-commit run's chain. T-176-80: the page held through the pre-commit run and committed with the spec in one commit.

## Self-Check: PASSED

Checked after writing:

- The seven files named under `key-files` exist and are tracked; `git diff --quiet HEAD -- . ':(exclude).planning'` exits 0.
- `2ed2b83fd`, `63117bf73`, `2872bbf9e` and `bd3a166d6` are ancestors of HEAD; `git rev-list --count 19f4d13dd..HEAD` was 4 before this file's commit.
- `176-14-t1-verify.sh.exit`, `176-14-t2-verify.sh.exit` and `176-14-t3-verify.sh.exit` each hold 0.
- The red report holds 15 failed of 39 and the green report 0 failed of 39.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` have no difference between `19f4d13dd` and HEAD.
- `git status --short` holds the operator's two entries and this file, and nothing else.
