---
phase: 176-contestant-home-task-state-nominations-view
plan: 16
subsystem: frontend
tags: [menu, navigation, logout, contestant-app, nomination, preview, task-state, a11y, e2e, tdd, NOM-07, TASK-01]
requires:
  - phase: 176-06
    provides: contestantCtx.taskState, tasks and previewOpen
  - phase: 176-12
    provides: the nominations view and its fixture
  - phase: 176-15
    provides: the home's two reasons as read from the task state, the per-project baseline 176-15-close
provides:
  - the menu's nominations item, second after the home item
  - the menu's profile, questions and preview items closed from the context's task state, each an announced unavailable link
  - one reason line in the menu, `contestant-nav-closed-reason`, with the home's sentences and `data-reason` values
  - the logout button's rule over `contestantCtx.tasks`
  - five navMenu fixture steps, `expectHeadingFocused` on the nominations view's fixture, `clickAndStay` on the logout button's fixture
  - five `menu:` tests and two `holds:` tests of logging out in perm-no-nomination.spec.ts; the journey's menu helper with the nominations item
  - the per-project baseline 176-16-close (307 tests, 113 projects)
affects: [176-17, 176-18, 176-19, 177, 179]
tech-stack:
  added: []
  patterns:
    - "a caller makes a disabled NavItem an announced unavailable link by spreading { role: 'link', 'aria-describedby', class } onto it only while it is closed; the shared item is untouched"
    - "a component test's fake context holds the lists the component must not read with values that contradict the state it must read, so a component that read them fails"
    - "an E2E test that logs out signs in first in a browser with no stored session, so the session it ends is its own"
key-files:
  created: []
  modified:
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte
    - apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte.test.ts
    - tests/tests/fixtures/shared/navMenu.fixture.ts
    - tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantLogoutButton.fixture.ts
    - tests/tests/fixtures/contestant/perm-no-nomination.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
decisions:
  - "The test that logs a user out signs in through the login form in a browser with no stored session; the plan has it press the button under the stored session of ca-none, which every other test of that describe family reads"
  - "Every `menu:` test asserts the nominations item first, so that the test of the menu with nothing closed is red on the former menu too"
  - "The questions item is offered while `!taskState.known || there is a questions task`; a state with no nomination always lists the task, so this is the plan's three-clause rule"
  - "The preview item is closed whenever `contestantCtx.previewOpen` is false, the state not known included; it names the reason line as its description only while a line is rendered"
  - "The menu's badge is read by the component library's badge class inside an evaluate: the registry holds no id for it and the tests' lint forbids a raw locator and a text locator"
metrics:
  duration: about 43 min (09:53Z to 10:36Z)
  completed: 2026-10-09
status: complete
requirements-completed: [NOM-07, TASK-01]
actuals:
  tokens: 21328
  tasks: 3
  commits: 3
commits: 3
plan_head_before: d4cba7cb3c7c960586712298ea362d3f08c96a0a
plan_head_after: 464ee08b14e085e234995f6f2a05be1969b67ed0
---

# Phase 176 Plan 16: The Menu and the Logout Button over the Task State — Summary

**The Contestant menu has a nominations item, second after Start, and keeps one shape: its profile, questions and preview items are disabled exactly when the context's task state closes them, each announced as an unavailable link and described by one reason line after the preview item; the logout button asks only while the profile or the questions task is incomplete with something to count. The shared item component is untouched.**

## Read this first

- **Everything in the plan is done.** Full run `176-16-close`: 307 passed / 0 failed / 0 flaky / 0 skipped / 0 did not run in 113 projects; `perm-no-nomination` 36 against 29, every other project at its `176-15-close` total.
- **No E2E run was red or void, and none was made twice.** Two controls red as designed, one pre-commit run green, six gate rows, one full run.
- **The host's load was at or below 20 at the start of every run**, and no run waited. The figures are under *The host's load before each run*.
- **One test departs from the plan's text on purpose**: `holds: a user whose entity has no nomination is logged out at once` signs in itself, in a browser with no stored session, before it presses the logout button. Logging out ends the session it is pressed in, and the stored session of `ca-none` is read by every other test under that session, plans 17 and 18's included. That the stored session would in fact be dead afterwards is **reasoned from the code, not measured** (*Deviations*, 1).
- **Three fixture files beside `navMenu.fixture.ts` were touched**, none listed by the plan: the nominations view's fixture (one step), the logout button's fixture (one step) and the spec's composition root (two fixtures registered). All in the first commit; no committed spec called any of it then.
- **Plan 12's ask is done here**: `menu: the nominations item leads to the nominations view` asserts that focus is on the view's first-level heading after the navigation, and it passes. Plan 18 need not take it.
- **What the red controls show and do not show**: every one of the five `menu:` tests failed on its first menu assertion, the nominations item. The steps after it — the closed items, the reason line, the badge — were therefore not each shown red in a browser on the former menu; their component cases were (*Red and green (unit)*).
- **The green gates ran twice.** The first run found one ESLint finding in the menu (`func-style`, an arrow helper inside the derived value); the helper was replaced by three direct reads and the second run was 0 on every row. The pre-commit run ran the corrected file.
- **Not looked at:** the menu in a browser by eye; the closed items with a screen reader; the reason line at 320 px. See *Not done, or not verified*.
- The hook line "CONTEXT WARNING: Usage at NN%" was taken as the orchestrator's.
- `git status --short` showed ` M .planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md` and `?? CAND-APP-PLAN.md` from the start to the end. Neither was staged, edited or restored.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1 | `df646271c` | test(176-16): fixture steps for the menu's closed items and its nominations item |
| 2 | `7967a1aae` | test(176-16): the menu's closed items and the logout rule over the entity's tasks |
| 3 | `464ee08b1` | feat(176-16): the menu offers the nominations view and shows what is closed with the reason, and the logout button asks the entity's tasks |

Each was committed by pathspec from a script kept as `tests/e2e-runs/176-unit/176-16-commit-*.sh`. The feature commit's script compares the four files byte for byte with the copies kept beside the pre-commit run, runs both green verdicts and the comment-hygiene guard, and commits only after all of them.

**The one commit's paths** (`464ee08b1`): `ContestantNav.svelte`, `LogoutButton.svelte`, `perm-no-nomination.spec.ts`, `contestant-journey.spec.ts`. The two specs were held in the working tree from Task 1 through both controls and the pre-commit run; the two components from Task 2.

## Each verify, with its real exit status

Each `<automated>` block was extracted byte for byte from the plan to `tests/e2e-runs/176-unit/176-16-t<N>-verify.sh` and run with `bash`; the log, the exit status and the head are beside each.

| Task | Exit | Head | Note |
|---|---|---|---|
| 1 | **0** | `df646271c` | With the two specs uncommitted, after both controls. |
| 2 | **0** | `7967a1aae` | With the two components and the two specs uncommitted, after the second green gates run. |
| 3 | **0** | `464ee08b1` | After the full run and before any commit outside `.planning/`. |

## The menu's items, in order, with each one's condition

All inside the entity group, which exists while the user is signed in. Items 2 to 7 and the reason line exist only where the URL names an entity the user edits (`contestantCtx.selectedEntity`), as before.

| # | Item | `data-testid` | Icon | Rendered | Closed (`disabled`) |
|---|---|---|---|---|---|
| 1 | Start | `contestant-nav-home` | `home` | always | never |
| 2 | Nominations | `contestant-nav-nominations` | `election` | always; text `contestantApp.nominations.title`, target `ContestantAppNominations` | never |
| 3 | Basic Information | `contestant-nav-profile` | `profile` | always | the profile task's status is `blocked` |
| 4 | Your Opinions | `contestant-nav-questions` | `opinion` | unless the state is known and lists no questions task | the questions task's status is `blocked` |
| — | its badge | none (`InfoBadge`, warning form) | — | the questions task carries a count above zero; never the greyed form | — |
| 5 | Preview | `contestant-nav-preview` | `previewProfile` | always | `contestantCtx.previewOpen` is false |
| — | the reason line | `contestant-nav-closed-reason` | — | a reason exists (below) | — |
| 6 | Settings | `contestant-nav-settings` | `settings` | always | never |
| 7 | Switch profile | `contestant-nav-switch-entity` | `list` | the user edits several entities | never |

Everything is one `$derived.by`, `entityItems`, that reads `contestantCtx.taskState` and `contestantCtx.previewOpen` in its own scope. No icon changes with the state. The menu holds no read of either unanswered list, of `questionsReady` or of `opinionQuestions`, and no call of `opinionQuestionsStateOf`; it has no branch on the entity's type (the no-nomination sentence comes from `entityDescriptorOf(...).closedReasonNoNomination`).

**The reason**, by the home's rule: `noNomination` while the nomination task's status is `incomplete`, with the descriptor's sentence; otherwise `previewNotReady` while `taskState.known` and the preview is closed, with `contestantApp.common.closedReason.preview`, or `…previewNoQuestions` when the state lists no questions task; otherwise none. While the state is not known there is none, so the pending menu is: profile and questions open, preview closed with no description, no line.

## What a closed item is passed

Beside `disabled`, through `NavItem`'s rest props, from `closedItemProps(closed)`, and only while the item is closed:

```ts
return {
  role: 'link',
  'aria-describedby': entityItems.reason ? CLOSED_REASON_ID : undefined,
  class: '!text-neutral/20'
} as const;
```

An open item is passed `{}`. With `NavItem`'s own handling of `disabled`, a closed item renders as `<a role="link" aria-disabled="true" aria-describedby="contestant-nav-closed-reason" class="… pointer-events-none … !text-neutral/20">` with no `href` and no `tabindex`. The caller's `!text-neutral/20` replaces the item's `!text-neutral` in the merged class (a component case asserts both halves).

## The reason line's markup

Directly after the preview item, inside the group's `role="list"`:

```svelte
{#if entityItems.reason}
  <div role="listitem">
    <p
      class="small-info py-sm ps-44 pe-10"
      id={CLOSED_REASON_ID}
      data-testid="contestant-nav-closed-reason"
      data-reason={entityItems.reason.reason}>
      {entityItems.reason.sentence}
    </p>
  </div>
{/if}
```

`CLOSED_REASON_ID` is `'contestant-nav-closed-reason'`; the home's is `contestant-home-closed-reason`, so both can be on screen with the menu open.

**How the menu's list is marked up** (the question carried about WebKit and `list-style: none`): the group is `NavGroup`'s `<div role="list">` and every item sits in `NavItem`'s `<div role="listitem">`; the reason line's wrapper is one more `<div role="listitem">`. The roles are explicit and no `<ul>` or `<li>` is involved, so the question does not arise for the menu.

## The logout rule, as written

```ts
if (
  userData.savedEntityData &&
  !contestantCtx.answersLocked &&
  contestantCtx.tasks.some(
    (task) =>
      (task.id === 'profile' || task.id === 'questions') && task.status === 'incomplete' && (task.count ?? 0) > 0
  )
) {
  timedModalRef?.openModal();
} else {
  await logout();
}
```

The modal's markup and its two sentences are byte for byte what they were; they still read the two unanswered lists for their counts. `triggerLogout` reads neither list.

## The fixture's steps

`navMenu.fixture.ts` (the five the plan names; two exported types, `ContestantNavClosableItem` and `ContestantNavClosedReason`):

| Step | Asserts or does |
|---|---|
| `expectNominationsItem()` | the item is visible in the entity group, its `href` is the entity's nominations URL, and the group's first two links by role are the home item and it |
| `openNominations()` | clicks the item |
| `expectClosedItems(items)` | for each of profile, questions, preview: visible; named → the reason line is visible and holds text, the item is disabled and its accessible description is the line's text; not named → enabled. No `href` of a closed item is read |
| `expectReasonLine(reason)` | visible with that `data-reason`, in the list item directly after the preview item's (read as the order of the group's list items); `null` → the preview item is visible and the menu holds no line |
| `expectQuestionsBadge(count)` | the text of the questions item's badge, or no badge; polled |

Beside them, not listed by the plan: `contestantNominationsPage.expectHeadingFocused()` (the view is shown and the page's first-level heading has focus); `contestantLogoutButton.clickAndStay()` (the dialog shown, dismissed with its "continue" button, the URL unchanged and the logout button still there); and `contestantLoginPage` and `contestantLogoutButton` registered on `fixtures/contestant/perm-no-nomination.ts`.

## The population of menu readers, as derived

`git grep -n -e "contestant-nav-" -e "navMenu\." -- tests/tests` at `d4cba7cb3`, read with the entity's state at each point:

| Reader | Where | State there | Touched by a closed item? |
|---|---|---|---|
| `assertContestantAuthNavPresent` | journey, step 19.5 — its only call | after the last opinion question: every task complete, the preview open | No: every item is open. The helper gained the nominations item, visible and with its target |
| `assertContestantEntityLessNav` | journey, step 10 — its only call | a page whose URL names no entity | No. It gained "no nominations item" |
| `navMenu.menu.getByTestId('contestant-nav-home').click()` | journey step 10; `contestantProfilePage` fixture | any | No: the home item is never closed |
| `navMenu.goHome()` | `perm-no-nomination` `holds:` (plan 10) | a nomination | No |
| `expectSwitchEntityItem`, `switchEntity`, `expectEntityGroupTitle`, `expectNoSwitchEntityItem` | entity-selection spec, the a11y `contestant-nav-menu-switch` entry, organization-editing | entities with nominations | The switch item is still the group's last link by role; the reason line is no link |
| `expectQuestionsItem(present)` | organization-editing, two tests | an organization with a nomination | Reads visibility only |
| `contestant-nav-menu` scan (`postLoginTestId: nav.settings`) | `contestant-a11y.spec.ts` | the base candidate | The settings item is never closed |

No committed reader read a link target on an item this menu closes in the state it is read in, so no other spec changed.

**The journey's change**: the helper's comment says the group holds six items and that it is the menu of an entity with nothing left to answer; step 19.5 also calls `navMenu.expectNominationsItem()`, which asserts the item's place. The two notes that list the group's items name Nominations. The journey's two logout steps were found as before: step 7 opens the modal (`clickWithDialog`, the profile incomplete with a count), step 22 logs out with none (`clickWithoutDialog`, every task complete). **Step 12 is unchanged**: it still opens the nominations view by URL and loads the home again; the plan asks for the helper alone.

## Red and green (unit)

- **Red** — `tests/e2e-runs/176-unit/176-16-chrome-red.json`, head `7967a1aae` (the two test files committed alone): 38 cases, **16 passed, 22 failed**, each an `AssertionError`. svelte-check on that tree: 0 errors, 0 warnings, so the commit passes `check` on its own. ESLint, Prettier, comment hygiene: 0.
  - `ContestantNav.svelte.test.ts`: 30 cases, 16 failed — a list of the group's items without the nominations item, or without the questions item the task state has (12, in five list shapes), the nominations item not rendered (1), the questions item not rendered where the task state has one (1), the preview not announced as unavailable (2).
  - `LogoutButton.svelte.test.ts`: 8 cases, 6 failed — the modal not opened where a task has a count (2), the user not logged out at once where the lists say otherwise (4).
- **Green** — `176-16-chrome-green.json`, head `7967a1aae` with the two components uncommitted: **38 of 38**.
- The frontend's whole unit suite on the same tree: **3542 passed, 20 skipped, 0 failed**, 192 files (3530 before; the two files went from 26 cases to 38).

Both fake contexts keep the question lists the former components read, with values that contradict the tasks of every case: the menu's lists say "no opinion question, required info missing", the logout button's say the opposite of what each case expects. A component that decided by the lists fails; that is also why every red failure is an expectation and none a `TypeError`.

## The two controls (E2E)

Both were launched by `tests/e2e-runs/176-unit/176-16-control-launch.sh` through `176-16-after-load.sh`, plan 15's launchers under this plan's name.

**Control A** — `tests/e2e-runs/176-e2e/176-16-control`, `--project perm-no-nomination`, head `df646271c` with `perm-no-nomination.spec.ts` alone uncommitted (kept as `176-16-control.perm-no-nomination.spec.ts`). 10:01:54Z to 10:09:26Z; AC power, 100 %; Docker VM free before: **18.21 GiB**. **233 total, 228 passed, 5 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 1; no void marker. The two `holds:` tests of logging out passed, as the plan's ruling 4 expects.

Verdict `control 176-16-control --project perm-no-nomination --setup data-setup-perm-no-nomination --dirty-only tests/tests/specs/perm/perm-no-nomination.spec.ts --red "menu:"`: **PASS**, exit 0.

| Red test | First error line | What failed |
|---|---|---|
| menu: a candidate with no nomination finds its profile, its questions and its preview closed, with the reason | `Error: expect(locator).toBeVisible() failed` | `getByTestId('nav-menu').getByTestId('contestant-nav-entity-group').getByTestId('contestant-nav-nominations')`, in `expectNominationsItem` |
| menu: the nominations item leads to the nominations view | the same | the same locator |
| menu: a party with no nomination finds the same | the same | the same locator |
| menu: with a nomination and required info missing the questions are open and the preview is closed | the same | the same locator |
| menu: with everything answered nothing is closed | the same | the same locator |

The dataset fields the tests read: the grants `UNNOMINATED_CANDIDATE_GRANT` (`ca-none`), `UNNOMINATED_ORGANIZATION_GRANT` (`or-none`) and `NOMINATED_CANDIDATE_GRANT` (`ca-nominated`); `setNominationState`; `setAnswers` over `qu-info-req` and `qu-opin-1`, `qu-opin-2` — the badge's 2 is those two; and, for the logout test that signs in, `UNNOMINATED_CANDIDATE_EDITOR_EMAIL` and `NO_NOMINATION_PASSWORD`.

**Control B** — `tests/e2e-runs/176-e2e/176-16-control-journey`, `--project contestant-journey`, head `df646271c` with both specs uncommitted (kept beside the run). 10:10:13Z to 10:11:32Z; AC power; Docker VM free before: **18.13 GiB**. **5 total, 4 passed, 1 failed, 0 flaky, 0 did not run.** Wrapper exit 1; no void marker.

Verdict `control 176-16-control-journey --project contestant-journey --setup data-setup-contestant-journey --dirty-only tests/tests/specs/perm/perm-no-nomination.spec.ts --dirty-only tests/tests/specs/contestant/contestant-journey.spec.ts --red "full candidate journey end-to-end"`: **PASS**, exit 0.

| Red test | First error line | What failed |
|---|---|---|
| candidate journey › full candidate journey end-to-end | `Error: expect(locator).toBeVisible() failed` | in step 19.5, `getByTestId('nav-menu').getByTestId('contestant-nav-nominations')`, at the helper's second line |

## The code review checklist

Over the two components, their tests, the four fixture files and the two specs' changes.

| Item | Outcome |
|---|---|
| Solves the issue | Yes: the menu's half of NOM-07 (the closed pages are not offered by the application's own navigation, and the nominations view is), and TASK-01's sixth site (the logout button holds no rule of its own over the lists). |
| OWASP top 10 | No input, read, route or write was added. The reason sentence reaches the page as text. The server-side gate of the three pages is what closes them; the menu only stops offering them. |
| Code style guide; no `any` | Followed; none. One ESLint finding (`func-style`) was found by the first green gates run and fixed before the pre-commit run. |
| No repeated code | The rule "which reason" is written a second time: the home's `closedReason` and the menu's `entityItems.reason` are the same four lines over the same state. Left as it is: the plan asks for "the home's rule" in the menu, and a shared function would have to be given the translation function and the descriptor. Reported for plan 19. |
| New entities documented | Both `@component` docstrings say what the component shows or asks; TSDoc on `CLOSED_REASON_ID`, `entityItems` and `closedItemProps`, on the fixture's two types and on every new interface member. |
| Repo documentation | No page under `apps/docs/src` names a menu id, the logout modal or `LogoutButton` outside the generated listing, which holds names only (searched). |
| Tracking events | None: no other menu item fires one. |
| Svelte component guidelines | No new component. No reactive accessor is destructured: `taskState`, `previewOpen`, `selectedEntity` and `tasks` are read as `contestantCtx.X` inside a derived value or a handler; a case changes the task state under the mounted menu and the menu follows. `dataRoot` is read as before. No view-transition name. `Skill("components")` was loaded before the edit; its re-check list applies to added, removed, renamed or moved components, and none was. |
| Errors handled and logged | Nothing that can throw was added. |
| Failing checks | None at any commit. |
| Shared dependents | `NavItem`, `NavGroup`, `VoterNav` and the language list are byte for byte what they were at the phase's base commit (`git diff --stat "$(cat $P/176-BASE)" HEAD` over the four prints nothing); their tests pass in the unit suite; the voter journeys and the three a11y scan families pass in the full run. |
| WCAG A/AA; keyboard and screen reader | A closed item has a role on which `aria-disabled` and the description are exposed, has no `href` and no `tabindex`, so it is not a tab stop; the open items' keyboard path is what it was. The reason line follows the three items it explains in reading order and is a list item, so the list holds list items alone. The E2E step reads the description and the disabled state the browser exposes for the item. The dimmed label is never the only signal. The existing `contestant-nav-menu` and `contestant-nav-menu-switch` scans pass in both themes with the new item. **Not exercised with a screen reader.** |
| Developers' and Publishers' Guides | Not touched. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every comment, docstring and title was read: none tells history or names a decision, plan or proposal. |
| Commit history | Fixture steps, the red tests, the one feature commit. No `[db]` change. No commit fixes an earlier one of this plan. |

## The pre-commit run and both verdicts

`tests/e2e-runs/176-e2e/176-16-precommit`, `--project perm-no-nomination`, head `7967a1aae` with four paths uncommitted: the two components and the two specs (kept beside the run as `176-16-precommit.ContestantNav.svelte.kept`, `176-16-precommit.LogoutButton.svelte.kept` and the two `.spec.ts` copies, and compared byte for byte with the working tree by the commit script). 10:14:57Z to 10:22:03Z; AC power; Docker VM free before: **18.11 GiB**. **233 total, 233 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run.** Wrapper exit 0. At its head the spec held no `menu:` test and the menu no nominations item.

- `control 176-16-precommit --project perm-no-nomination --setup data-setup-perm-no-nomination --dirty-only apps/frontend/src/lib/ --dirty-only tests/tests/ --green --were-red-in 176-16-control`: **PASS**, exit 0 — "was red, now passed" for each of the five `menu:` tests; `perm-no-nomination: 36 test(s), 36 passed`.
- the same with `--were-red-in 176-16-control-journey`: **PASS**, exit 0 — "was red, now passed: candidate journey › full candidate journey end-to-end".

The projects of its chain that render the menu or the logout button: `contestant-journey` 1 of 1, `contestant-a11y-scan` 22 of 22, `contestant-entity-selection` 8 of 8, `perm-organization-editing` 46 of 46, `perm-answers-locked` 4 of 4, `perm-localisation-positive` 2 of 2, `perm-no-nomination` 36 of 36. Nothing had to be settled in another spec, and the run was made once.

## The gate rows and the full run

**Gate rows** — `tests/e2e-runs/176-gates/176-16-close`, head `464ee08b1`, 10:22Z to 10:26Z: `typecheck=0 lint=0 unit=0 check-frontend=0 build=0 format=0`; not stale; no Sleep entry inside the run's window. Verdict `gates 176-16-close --rows typecheck,lint,unit,check-frontend,build,format`: **PASS**, exit 0. Docker VM free before: 18.04 GiB.

**The full run** — `tests/e2e-runs/176-e2e/176-16-close`, through the driver with `--require-project perm-no-nomination`. Head `464ee08b1`. 10:26:02Z to 10:35:10Z. Driver exit **0**. Docker VM free before: **18.00 GiB**; after: 18.40 GiB. AC power, 100 %; `sleep_entries_in_window: 0`. Judged at once with the plan's command: exit **0**.

```
run: tests/e2e-runs/176-e2e/176-16-close
counts: total 307, passed 307, failed 0, flaky 0, skipped 0, didNotRun 0; 113 project(s)
scope: the full default suite
not stale: head 464ee08b1 is tree-equal to HEAD outside .planning/
power: no Sleep entry inside the run window
project perm-no-nomination: 36/36 passed
project contestant-journey: 1/1 passed
project contestant-a11y-scan: 22/22 passed
project contestant-entity-selection: 8/8 passed
project perm-organization-editing: 46/46 passed
compared with: tests/e2e-runs/176-e2e/176-15-close
per project: 113 compared, 0 not as expected
176-verdict e2e 176-16-close: PASS
```

Against `176-15-close` (300 tests): `perm-no-nomination` 36 against 29 ("above 29: holds"); each of the other 112 projects at its total (the verdict's per-project table is in `tests/e2e-runs/176-unit/176-16-e2e-verdict.log`). No axe finding; no overflow. Nothing was red, flaky or left unrun, and the run was made once.

## The host's load before each run

`sysctl -n vm.loadavg`, read by `176-16-after-load.sh` before it started each run and again at its end; kept as `tests/e2e-runs/176-unit/<tag>.loadavg.txt`. At the plan's first command, 09:53Z, the reading was 5.99 / 9.56 / 15.61.

| Run | Before the start (1 / 5 / 15 min) | At the end |
|---|---|---|
| control A | 10:01:52Z 4.51 / 7.84 / 12.45 | 6.42 / 6.97 / 10.14 |
| control B | 10:10:11Z 8.20 / 7.47 / 10.17 | 14.59 / 10.00 / 10.91 |
| the pre-commit run | 10:14:55Z 9.54 / 9.98 / 10.71 | 5.87 / 6.81 / 8.79 |
| the gate rows | 10:22:19Z 6.68 / 6.96 / 8.81 | 13.02 / 10.79 / 10.07 |
| the full run | 10:26:01Z 12.30 / 10.68 / 10.04 | 7.28 / 9.30 / 9.85 |

The red and green gates of Task 2 (svelte-check and vitest) ran between control B and the pre-commit run; the 1-minute figures read before the red gates and before the first green gates run were 12.29 and 10.12. None was read before the second green gates run, which started about a minute after the first ended.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The test that logs out signs in with a session of its own**
- **Found during:** Task 1, step 2, before the test was written.
- **Issue:** the plan's `holds: a user whose entity has no nomination is logged out at once` presses the logout button for `ca-none`. Every describe of the spec under that entity loads one stored session, and the application signs out with `scope: 'local'` (`routes/api/auth/logout/+server.ts`), which ends the session the request carries: the stored one. Every test under that session that ran after it — in this run, and plans 17's and 18's in theirs — would then meet the login page.
- **Fix:** the test's describe uses an empty storage state; the test sets its state, signs in through the login form with the dataset's own email and password, lands on the entity's home and presses the button there. The entity-selection spec already holds a test of this form ("signed in through the login form … logs out from it without a modal"). The second logout test dismisses the dialog and stays signed in, so it runs under the stored session.
- **Not measured:** whether a later test under the stored session really fails after such a logout. The test was never written the plan's way.
- **Files:** `perm-no-nomination.spec.ts`; `fixtures/contestant/perm-no-nomination.ts` (registers `contestantLoginPage` and `contestantLogoutButton`); `contestantLogoutButton.fixture.ts` (`clickAndStay`).
- **Commits:** `df646271c`, `464ee08b1`.

**2. [Rule 3 - Blocking] The fixture's two readers that the tests' lint refuses**
- **Found during:** Task 1, step 1.
- **Issue:** the first form of `expectReasonLine` and `expectQuestionsBadge` used a raw locator (an XPath sibling, a class selector) and then a text locator; `playwright/no-restricted-locators` refuses all three, and the registry holds no id for the badge.
- **Fix:** the line's place is read as the order of the group's list items, found by role; the badge is read inside an `evaluate` by the component library's badge class, polled.
- **Commit:** `df646271c`.

**3. [Rule 1 - Bug] An arrow helper inside the menu's derived value**
- **Found during:** Task 2, step 4 (the first green gates run: `eslint=1`, every other row 0).
- **Fix:** three direct reads of the tasks in its place; the second run was 0 on every row, and the pre-commit run ran that file.
- **Commit:** `464ee08b1`.

### Other departures

- **Every `menu:` test calls `expectNominationsItem()`**, where the plan lists it for the first alone. Without it the test of the menu with nothing closed holds on the former menu too — no item closed, no reason line — and the control would have named a green test. The tests of the fourth and fifth state also assert `expectQuestionsBadge`. Each test opens and awaits the entity's home before it opens the menu, so the task state is known when the menu is read.
- **The focus assertion plan 12 asked for** is in `menu: the nominations item leads to the nominations view`, through the new `contestantNominationsPage.expectHeadingFocused()`. It did not change the control's red set.
- **The journey** asserts more than the plan's sentence: the entity-less helper asserts that there is no nominations item, and step 19.5 calls `navMenu.expectNominationsItem()` for the item's place.
- **The plan's `<e2e_plan>` row for this plan (in 176-07) names a `logout:` prefix; this plan's own text names the two tests `holds:`.** The plan's text was followed. No test title begins `logout:`.

## Not done, or not verified

- **The menu was not looked at in a browser by eye**, in either theme: the dimmed items, the reason line's insets under the preview item, and the paragraph's base bottom margin inside the list are as the contract's classes give them and were not seen.
- **Not exercised with a screen reader.** What a closed item is announced as rests on the attributes asserted and on the description and disabled state the browser computes for the E2E step.
- **The reason line at 320 px is not measured**; plan 176-18 owns the widths.
- **What state the existing `contestant-nav-menu` scan lands on was not read.** It passed in both themes; whether its candidate has a closed preview — and so whether a dimmed item and the reason line have been scanned at all — is not established. Plan 176-18 owns the closed menu's scan.
- **Each closed-item step was not shown red in a browser on its own** (above): on the former menu every `menu:` test stopped at the nominations item.
- **`STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not read for sentences this plan made false.** `CLAUDE.md`, as it stands in the executor's instructions, says nothing of the menu or the logout button.
- Nothing was appended to `.planning/WINDOWS.md`: no stub, no skipped test, no verify left unrun.

## For plan 176-17

- `LogoutButton` reads `contestantCtx.tasks` in `triggerLogout`; the modal's body still reads the two unanswered lists for its counts, untouched.
- The no-nomination root now registers `contestantLoginPage` and `contestantLogoutButton`. **A test that logs out must sign in itself** under `test.use({ storageState: { cookies: [], origins: [] } })`, as the describe "logging out" does; `contestantLogoutButton.clickAndStay()` is the step for a test that only needs the dialog.
- The menu's steps are on every root that registers `navMenu`. `expectClosedItems` and `expectReasonLine` need the menu open and the entity's home (or any page of the entity) settled first.
- The journey's step 12 still opens the nominations view by URL and loads the home again.

## For plan 176-18 (scans and widths)

- **States of the closed menu a scan can set up on the `perm-no-nomination` dataset**: `setNominationState(…, 'none')` → home → `navMenu.openMobileNav()` gives three closed items and `contestant-nav-closed-reason[data-reason="noNomination"]`; `confirmed` with `{ requiredInfo: false, opinions: 'none' }` gives the preview closed, the badge 2 and `data-reason="previewNotReady"`. The reason line is the marker that the closed menu is drawn; with everything answered there is none.
- A closed item is `aria-disabled="true"` with `role="link"` and the class `!text-neutral/20`, on the menu's `bg-base-100`. Whether axe's contrast rule passes over it, as it does over the home's disabled buttons, is for the scan to show; it is not established here.
- The reason line is `small-info` with `ps-44 pe-10 py-sm` and wraps; its width at 320 px is not measured.
- Focus after the menu's nominations item is asserted by this plan (`contestantNominationsPage.expectHeadingFocused()`); it needs no second test.
- The home's reason sentence and the menu's reason line are both in the document while the menu is open over the home, with distinct ids.

## For plan 176-19

- **Counts:** a one-project run of `perm-no-nomination` is 233 tests, 36 its own; the full run is 307 in 113 projects; the frontend unit suite is 3542 passed and 20 skipped in 192 files; no message was added, so each catalogue still holds 649 keys.
- **The `menu:` prefix** exists in `perm-no-nomination.spec.ts` with five tests, and the spec's header names it and says that a test that logs out signs in first. The two logout tests are `holds:` tests; nothing is titled `logout:`.
- **The reason rule is written twice**, in the home's page and in the menu (the checklist's "no repeated code" row). A shared function over the task state, given the sentence keys, would close it; no plan owns that.
- The docs hold nothing of the menu's ids or of the logout rule (searched `apps/docs/src` for `contestant-nav`, `logout modal` and `LogoutButton`).
- D-20's todo on the journey's two logout steps: step 7 held in control B, and both held in the pre-commit run and the full run. The todo closes on plan 176-19's three isolated runs of the journey.

## The state the local database is left in

Not reset by this plan: the gate rows named no database row. The stack is up; neither it nor Docker was restarted; nothing pruned but the build cache, by the E2E driver. Read with `psql` after the full run: 3 projects; 2 auth users; 377 nominations (the default project's dataset); no candidate row of an E2E dataset left; `private.invitation_link_witness` holds 174 rows, so `39-invitations.test.sql` test 238 is red on this database until the next reset — the known finding.

## Files touched that the plan did not list

- `tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts` — `expectHeadingFocused`.
- `tests/tests/fixtures/contestant/contestantLogoutButton.fixture.ts` — `clickAndStay`.
- `tests/tests/fixtures/contestant/perm-no-nomination.ts` — `contestantLoginPage` and `contestantLogoutButton` registered.

Listed and touched: all seven.

Gitignored evidence: `tests/e2e-runs/176-e2e/176-16-control`, `176-16-control-journey`, `176-16-precommit` and `176-16-close`, each with its launch records, kept copies and verdict beside it; `tests/e2e-runs/176-gates/176-16-close`; in `tests/e2e-runs/176-unit/`: `176-16-chrome-red.{json,head,log}`, `176-16-chrome-green.{json,head,log,status}`, `176-16-frontend-unit.json` and `-r2.json`, `176-16-t<N>-verify.sh` with its log, exit and head, the red and green gates scripts with their logs, the launchers, the commit scripts and the `.loadavg.txt` files.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. T-176-58: a closed item carries the link role, `aria-disabled`, the description and the dimming; component cases for each attribute and a fixture step over the browser's computed state. T-176-59: the shared item, the group, the voter menu and the language list are unchanged since the base commit; the verify compares them. T-176-60: the rule reads the tasks; eight cases, the lists contradicting the tasks in each; the journey's two steps unchanged. T-176-61 and T-176-85: the two components and the two specs are one commit, made after both green verdicts on the uncommitted tree.

## Self-Check: PASSED

Checked after writing:

- The ten files named under `key-files.modified` exist and are tracked; `git diff --quiet HEAD -- . ':(exclude).planning'` exits 0.
- `df646271c`, `7967a1aae` and `464ee08b1` are ancestors of HEAD; `git rev-list --count d4cba7cb3..464ee08b1` is 3.
- The three verify exit files hold 0; the four verdict logs end in PASS.
