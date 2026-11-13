---
phase: 177-define-nominations
plan: 18
subsystem: frontend-routes
tags: [nomination-editor, save-label, refused-save, prevent-navigation, task-state, user-data-store, answers-lock, e2e]
status: complete
requires:
  - "177-17: the details page as it serves an entity with nominations (builtOn, builtFor, the one write), the full run 177-17-close (371 of 371, 116 projects)"
  - "177-14: draftFactsOf, sameNominations, somethingToWrite"
  - "177-11: the editor's fixture (expectSubmit, expectSaveMessage, expectFocusOn, the dialog listener)"
  - "177-09: the writer's result — saved, refused with hasCandidates or tooManyPending, or a rejection"
  - "177-01: 177-gates.sh, 177-e2e.sh, 177-verdict.mjs"
provides:
  - "taskState.ts: nominationsSaveAction(state, draft); types NominationsDraftFacts, NominationsSaveLabelKey, NominationsSaveAction"
  - "(edit)/details/+page.svelte: the main button's label and data-action by the table; data-outcome changed | hasCandidates | tooManyPending | failed beside invalid; PreventNavigation; Cancel as a button that leaves without asking"
  - "contestantUserDataState.svelte.ts: the answers-lock effect writes only when there is something to clear"
  - "fixture steps contestantNominationEditor.leaveByChangingSelection(answer), .expectLeavePrompts(count); type EditorLeaveAnswer"
  - "component test (edit)/details/afterSave.svelte.test.ts (4 cases) with its two harness components AfterSaveRoot.svelte and AfterSaveContestant.svelte; 20 new cases in page.svelte.test.ts; 15 in taskState.test.ts; 3 in contestantUserDataState.svelte.test.ts"
  - "eight E2E tests in contestant-nominations.spec.ts: two button:, two refused:, one each leave:, stale:, closing:, saved:, all @nomination-definition"
  - "runs: 177-e2e/177-18-control (5 red, each on its expectation), 177-e2e/177-18-forward-red (the forward case red with the plan's literal check planted), 177-e2e/177-18-precommit (379 of 379), 177-gates/177-18-close, 177-e2e/177-18-close"
affects: [177-19, 177-20, 177-21]
tech-stack:
  added: []
  patterns:
    - "a button that saves asks one pure function for its label with the task state as it stands and a few facts of the draft, where the draft changes which questions the entity is asked"
    - "after a save, the page decides by where the re-read left the user (the route shown), not by whether the page is still mounted"
    - "a component test of a page under its real layout, context provider and store, with two harness components standing in for the layouts above, and a fake invalidateAll that replaces every load's data in place and flushes nothing"
key-files:
  created:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/afterSave.svelte.test.ts"
    - "…/(edit)/details/AfterSaveRoot.svelte"
    - "…/(edit)/details/AfterSaveContestant.svelte"
  modified:
    - apps/frontend/src/lib/contestant/tasks/taskState.ts
    - apps/frontend/src/lib/contestant/tasks/taskState.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
    - "…/(edit)/details/+page.svelte"
    - "…/(edit)/details/page.svelte.test.ts"
    - tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts
    - tests/tests/specs/perm/contestant-nominations.spec.ts
decisions:
  - "after a stored save the page navigates on unless the route shown is outside the editor's (edit) routes; a re-read that forwarded to another step of the editor does not stop the save from leading on (the orchestrator's ruling on P-17)"
  - "after a save that was not stored the page does nothing further once it is no longer mounted, wherever the re-read led"
  - "the label says continue exactly where a press leads on: a next step that is the nomination task itself reads as return"
  - "Cancel of the details step is a button with a handler, as the profile's is, and no longer an anchor"
  - "an eighth browser test, saved:, beyond the plan's seven, because the ruling on P-17 asks for a test that provokes the forward case"
  - "the cards are built by one function the build effect and the handler both call, so a save refused after the nominations changed rebuilds them without a second trigger"
requirements-completed: []
metrics:
  started: "2026-10-11T09:23:35Z"
  completed: "2026-10-11T10:27Z"
  duration: "about 64 minutes, of which about 38 are four E2E runs and about 6 the gate runs"
  tasks: 3
  files: 11
actuals:
  tokens: 27681 # chars/4 over git diff d38d22070..faeac54cc outside .planning (110,724 characters)
  tasks: 3
  commits: 6 # git rev-list --count d38d22070..faeac54cc
plan_head_before: d38d220706eb5cf097b98ace76d50806d5aa5f23
plan_head_after: faeac54ccb575f6f04017d9dc4b6580e85f37a25
---

# Phase 177 Plan 18: What the Details Step's Button Says, What a Refused Save Shows, and Leaving with Unsaved Changes — Summary

The details step's main button now reads what a press will do, by one pure function over the entity's tasks as they stand and three facts of the draft. A save the database does not store ends on the nominations view when nominations were closed meanwhile, on rebuilt cards when the nominations changed, and otherwise on the same cards with a message of the page's own, the draft intact and focus back on the button. Leaving with unsaved changes asks through the browser's confirm; Cancel and a press of the main button do not. The user-data store no longer replaces its current value with an equal copy under the answers lock. Eight browser tests hold it, five of them red on the tree before the page changed.

`requirements-completed` is empty on purpose: NOM-06 and NOM-08 are built here for the save and are not complete until the editor is linked (177-19). `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not touched. **No schema change was needed.**

## Read this first

- **Green end to end.** Full run `177-18-close`: 379 of 379, 116 projects, per-project equal to `177-17-close` but for the eight new tests. Six gate rows green. No committed test was red at any commit, no test was retried, no axe finding, no overflow.
- **Eight browser tests, not seven.** The ruling on P-17 in `177-DISPATCH.md` asks for a test that provokes the forward-to-constituency case and is seen red first. It is the eighth, `saved:`. Tasks 2 and 3's verify commands pin seven, so each exits 1 as written at that one stage and 0 with `=8` (and, for Task 3, `saved:=1`). *Deviations*, 1.
- **The forward case happens in a browser, and was seen red.** With the plan's literal check planted in the working tree (navigate on only while the page is still mounted), run `177-18-forward-red` left the user on the constituency step after a stored save: `expect(page).toHaveURL(…/profile)` received `…/nominations/constituencies?…`. With the ruling's check the same test is green in two full runs.
- **That provoking run is not a clean control: a second test was red in it, on an expectation of mine the tree does not hold.** `closing:` asserted a note on the nominations view under the answers lock; the view shows its note under the nominations lock alone. Read from the failure's page snapshot, the line was removed, and the test is green in the two full runs since. *Deviations*, 2.
- **The control is as the plan writes it, in one run.** `177-18-control`: exactly the five `button:`, `refused:` and `leave:` tests red, each on an expectation; 297 others green.
- **A3 and A4 hold, observed in the component test — and the tick is not what makes A3 hold.** On the page as 177-17 left it, and on the page as it is now, the page navigates once, to the profile, with the list of cards the same node throughout. A planted removal of the `tick()` left every case green: the task state is already current when `await invalidateAll()` resumes. The harness's control (the loads' data left as it was → the entity's home) is what shows the test is sensitive. *Task 2*, below.
- **Two files beyond the plan's list**: the harness components `AfterSaveRoot.svelte` and `AfterSaveContestant.svelte`, beside the test. *Deviations*, 3.
- **Cancel on the details step is now a `<button>`**, not an anchor. *Deviations*, 4.
- **`stale:` and `closing:` were never seen red**, as the plan's ruling 4 expects; `saved:` was seen red only against the planted check, not against the tree before this plan (on which it is inferred green: the tracer's handler navigated on without any check).
- **The host's lid was closed during every run** (`Entering DarkWake state due to 'Clamshell Sleep'` throughout the window). No run carries the void marker and no run's output holds `server connection lost`.

## Task Commits

| # | Commit | What |
|---|---|---|
| 1 | `0339aba00` | `test(177-18)`: fifteen cases of the label function in `taskState.test.ts`, alone |
| 1 | `0c6d55300` | `feat(177-18)`: `nominationsSaveAction` and its three types in `taskState.ts`; nothing calls it |
| 1 | `b1d4dbd89` | `test(177-18)`: the fixture's two steps for the prompt on leaving; no committed spec calls them |
| 1 | `1b0bbe32a` | `test(177-18)`: the store's identity case, red, with two cases for what the lock must still clear |
| 2 | `77ec7ba38` | `fix(177-18)`: the store's answers-lock effect writes only when there is something to clear |
| 2 | `faeac54cc` | `feat(177-18)`: **the one** — the details page, its two component tests, the two harness components and the spec's eight tests, after the control and the green pre-commit run |
| 3 | — | runs only |

`0339aba00` imports a function that the next commit adds, so that one commit does not type-check by itself (TS2305); the pair does. Lint and the type check were run once, on the working tree that held both, and the four additive commits followed on its exit value 0.

## Each task's verify command, with its real exit status

Each block was written byte for byte from the plan to `tests/e2e-runs/177-unit/177-18-t<N>-verify.sh` and run with `bash`; log, exit and head are beside it.

| Task | As written | Corrected | Head |
|---|---|---|---|
| 1 | **0** | — | `1b0bbe32a`, the spec uncommitted |
| 2 | **1** — every stage before the per-project comparison passed; it prints `projects off their expected count: perm-contestant-nominations` | **0** (`177-18-t2-verify-corrected.sh`) | `faeac54cc` |
| 3 | **1** — the gates verdict passed; the E2E verdict prints `project 'perm-contestant-nominations' has total 32; expected 24+7 = 31` | **0** (`177-18-t3-verify-corrected.sh`) | `faeac54cc` |

The corrected forms differ in one number: `perm-contestant-nominations=8` for `=7`, and for Task 3 one more `--expect-title-count "perm-contestant-nominations::saved:=1"`. Neither is one of the six known defects; it is the eighth test.

## Task 1 — the label function, the fixture steps, the store's red case, five tests and the control

### `nominationsSaveAction`, as written

```ts
export type NominationsDraftFacts = { somethingToWrite: boolean; anyKeptOrNew: boolean; hadNomination: boolean };
export type NominationsSaveLabelKey =
  'common.continue' | 'common.return' | 'common.saveAndContinue' | 'common.saveAndReturn';
export type NominationsSaveAction = { labelKey: NominationsSaveLabelKey; action: 'continue' | 'return' };

export function nominationsSaveAction(state: TaskState, draft: NominationsDraftFacts): NominationsSaveAction;
```

`NominationsDraftFacts` is structural and is what `draftFactsOf` answers; `taskState.ts` still imports nothing. The rows, in the order the function reads them:

1. nothing to write, the state known: Continue where `nominationsSaveTarget(state).continues`, Return otherwise;
2. nothing to write, the state not known: Continue;
3. every card removed: Save and Return, whatever the state;
4. something to write with a card kept or new, the entity had no nomination: Save and Continue;
5. the same, the state known: Save and Continue where a press leads on, Save and Return when no task is left;
6. the same, the state not known: Save and Continue.

**One reading beyond the plan's table.** "A next step exists" is read as "a press leads on", so a state whose next step is the nomination task itself (an entity with no nomination and nothing to write) reads Return, as `nominationsSaveTarget` leads home from it. A case asserts that for every known state the action with nothing to write is `continue` exactly where the target continues. The details page cannot show that row: an entity with no nomination has a new card, which is something to write.

Red, with an uncommitted skeleton that answers the tracer's one row — `177-unit/177-18-label-red.{log,exit,head,json}`, exit 1, head `d38d22070`: 11 failed, 135 passed, every failure an `AssertionError`. Green: 173 of 173 in the tasks directory.

### The fixture's two steps

`leaveByChangingSelection(answer: 'stay' | 'leave')` arms the fixture's dialog listener for one confirm, presses "Change the selection", waits until one confirm was raised and answered, and then until the details step is still shown (stay) or has been left (leave). `expectLeavePrompts(count)` counts the confirms that step answered. A confirm no step was waiting for is recorded as before and fails `expectNoDialog`.

### The store's red case

`177-unit/177-18-store-red.{log,exit,head,json}`, exit 1: 1 failed, 68 passed — `expected { entity… } to be { entity… } // Object.is equality`, at the assertion after the flush under the lock. The same test first shows that without the lock the value read before the flush is the value after it. One assertion of my first draft was wrong (a key count; a draft handle persists its default when it is created) and was removed before the red run that is kept; a throwaway guard, reverted with `git checkout --`, showed the identity assertion pass.

### The control

`tests/e2e-runs/177-e2e/177-18-control`, head `1b0bbe32a`, only the spec uncommitted, wrapper status 1, 09:35:14Z to 09:44:18Z, Docker VM 16.88 GiB free before it, AC power, no void marker: 302 tests, **297 passed, 5 failed, 0 did not run**. `177-verdict control 177-18-control … --red "button:" --red "refused:" --red "leave:"`: **PASS** — *5 test(s) named; 297 other test(s)*.

| Red test | First line of its error |
|---|---|
| `button: an untouched set reads Continue…` | `expect(locator).toHaveText(expected) failed` |
| `button: with no task left…` | `expect(locator).toHaveAttribute(expected) failed` |
| `refused: nominations removed elsewhere…` | `expect(locator).toHaveAttribute(expected) failed` |
| `refused: a nomination with candidates listed under it…` | `expect(locator).toHaveAttribute(expected) failed` |
| `leave: leaving with unsaved changes asks first…` | `the page asked once before it was left` (an `expect.poll`) |

The spec as the control ran it is `177-18-control.contestant-nominations.spec.ts.kept`.

## Task 2 — the page, the store, the component tests, the pre-commit run

### The handler, as built

`(edit)/details/+page.svelte`, `handleSubmit`, in this order:

1. `validateCards`; on an error the region says `invalid` and the handler returns.
2. With nothing to write: `goto` the target of `nominationsSaveTarget(contestantCtx.taskState)`. No write, no re-read.
3. `saving = true`; **`leavingUnasked = true`** — the bypass, set before the write and so before anything that can navigate; `startedFrom = builtOn`.
4. The one `contestantCtx.setEntityNominations(desiredSetOf(cards))`; a rejection is logged and read as nothing.
5. `await invalidateAll()`, whatever the outcome, then one `await tick()`.
6. **`saved`**: `if (onEditorStep()) goto(target)`, and return. `onEditorStep()` reads `page.route.id` from `$app/state` and asks whether it starts with `CONTESTANT_NOMINATION_EDITOR + '/'`.
7. **Not stored, and the page is no longer shown** (`shown`, a plain flag `onDestroy` clears): return. No message, no navigation.
8. **Not stored, still shown**: `notStoredOutcome(result, startedFrom)` — `changed` when `sameNominations(startedFrom, reachedNominationsOf(contestantCtx.nominations, data.nominationFacts))` is false, then the two named refusals, then `failed` — sets the region's outcome and the message of its key; the bypass is cleared, `saving` ends, and after a tick focus is on the main button.

- **How the handler tells that the page is no longer shown**: two ways, for two questions. After a stored save it asks *where the user is* — the route id — so that a re-read that forwarded to another step of the editor still leads on, and one that led to the nominations view does not (the ruling on P-17). After a save that was not stored it asks *whether this page is still mounted*, since a page that is gone can show no message wherever the user is.
- **`changed` rebuilds through the page's own loading sequence.** The body of the build effect is now `buildCardsAnew()`, which the effect and the handler both call; it keeps the read of the options as a promise, which the handler awaits before it ends `saving`. So focus is put on the main button once the button can take it: it is disabled while the options are read.
- **Where the re-read itself changed what the address chose** (the kept elections), the build effect has rebuilt the cards already; the handler sees that `builtOn` is no longer what it started from and does not rebuild twice.
- **`builtFor` is not cleared by hand**, as 177-15 and 177-17 suggested: `buildCardsAnew()` is called directly, which needs no trigger.
- **The label** is one derived value: `nominationsSaveAction(contestantCtx.taskState, draftFactsOf(cards, builtOn.length > 0))`, both read in that derived's own scope. The page never calls `taskStateOf`.
- **`PreventNavigation`** is `active={() => !leavingUnasked && somethingToWrite(cards)}`. **Cancel** is `handleCancel`: the bypass, then `goto` the nominations view.

### The store

The answers-lock effect empties the draft only when it holds an answer and discards the staged properties only when one is staged. The identity case is green; the 68 other cases of the file are unchanged and green, among them "a draft stored for B beforehand is cleared when B is loaded" and "the answers lock turning on discards every staged property".

### What `afterSave.svelte.test.ts` mounts, and what it showed

- **For real:** the details page inside the entity layout (`[entityId=uuid]/+layout.svelte`), the contestant context from `initContestantContext()` with its real user-data store, the data context from `initDataContext()` with a real `DataRoot`, the real `load` of the details step for the page's data, and `MainContent`, `EntitySelector`, `Input` and `Button` below the page.
- **Stood in for:** the root layout and the Contestant App's layout, by `AfterSaveRoot.svelte` (it initialises the data context and holds the root layout's data-root effect) and `AfterSaveContestant.svelte` (it initialises the contestant context); **the `(protected)` layout between them and the entity layout is left out**; the app, auth, i18n, component and layout contexts; the page state (`$app/state`, an object over raw state); `goto`, `invalidateAll` and `beforeNavigate`; and the data writer, whose two nomination functions are spies.
- **The rerun** is a fake `invalidateAll` that replaces the page state's data and the `data` of the entity layout and of the page in place, with new objects, and flushes nothing.

| Case | Result |
|---|---|
| after a save that gave the entity its first nomination, with the data replaced: `goto` once, `{ route: 'ContestantAppProfile' }` | green on the page as 177-17 left it and on the page as it is now |
| the list of cards and the card are the nodes they were; no mutation removed the list; `data-editor-state` never read `loading` or `error` | green on both |
| the control: the data left as it was → `{ route: 'ContestantAppEntityHome' }` | green on both |
| after a refused write and the same replacement: outcome `hasCandidates`, the list, the card and the symbol field the same nodes, the typed symbol in place, the options read once | red on 177-17's page (`failed`), green now |

- **A3 — observed in this harness, on both pages:** the entity's tasks are current when the page asks where to go. **The tick is not what makes it so:** with `await tick()` removed from the handler (planted, `177-unit/177-18-planted-noTick.*`, then restored byte-equal) all 42 cases of the directory stayed green. *Inferred:* the state the fake writes schedules Svelte's flush as a microtask before the handler's continuation, and the same holds for the real `invalidateAll`, which awaits again after it sets the root's props (read in `@sveltejs/kit` 2.70.3, `_invalidate`). The tick stays, as the plan lays it out; the handler waits for nothing else and uses no timer.
- **A4 — observed in this harness:** the page stays mounted through the replacement with no loading frame. What the harness cannot say: whether a layout it stands in for or leaves out (root, Contestant App, `(protected)`) replaces its subtree on a rerun. In a browser every saving test ended on its target, which a remount would not prevent.
- **A second planted defect** — the plan's literal check on the stored path (`if (shown)` for `if (onEditorStep())`), `177-unit/177-18-planted-shownOnly.*`: exactly one case red, "still leads on to the next task when the re-read led to another step of the editor".

### The page's component cases

`page.svelte.test.ts` gained 20 cases in four groups; `$app/navigation`'s fake now keeps the guards `beforeNavigate` is given, and the suite's stub of `$app/state` carries the route.

- **What the main button says** (5): Continue and Return for an untouched set; Save and Continue and Save and Return for a changed card, and Return again once the stored value is typed back; Save and Return when every card is removed; Save and Continue for an entity that had no nomination; the saving label during a save.
- **A save that is not stored** (6): `changed` (the cards show the nominations as re-read, the options are read a second time, the label follows the new draft, focus on the button); `hasCandidates` and `tooManyPending` (the cards the same nodes, the removal and the typed symbol kept, the label as before, focus on the button, no navigation); a rejection whose message holds a marker — the marker is nowhere in the document and is in what was logged, and a second press calls the write again; an answer the page cannot name reads `failed`; a re-read that takes the page away leaves no navigation and no message.
- **A save that is stored, when the re-read led away** (2): nothing further when the route is the nominations view; the target when the route is another step of the editor.
- **Leaving** (7): one guard; no question for an untouched set; a question while a field differs or a card is about to be removed, cancelled on "stay" and let through on "leave"; none when Cancel leaves; none during a save's re-read or at the navigation after a stored one; a question again after a save that was not stored; no `<dialog>`.

Red on the unchanged page — `177-unit/177-18-page-red.{log,exit,head,json}`, exit 1, head `1b0bbe32a`: **13 failed, 29 passed** over the two files, every failure an `AssertionError`. Eleven of the 24 new cases were green on the unchanged page, each because the tracer's handler already did what the case asks: the three A3/A4 cases; the label of an entity with no nomination (the tracer's one row is its row) and the saving label; the rejection whose text is not shown and the answer the page cannot name (both read `failed` then as now); the refused save whose re-read takes the page away, and the stored save whose re-read led to another step (the old handler navigated on without any check); the guard during a save (no guard existed to ask) and the dialog count. They are guards, not red-first evidence. Green: **111 of 111** in the directory and the store's file; the verify's three directories, 1257 tests.

### The two lock tests and the forward test

| Test | What it asserts beyond its title |
|---|---|
| `stale:` | the details step still shown after the lock is set; after Continue the nominations view of the entity, no step of the editor, `data-nominations-locked="true"`, the note with reason `nominationsLocked`, the heading focused, one card with the stored symbol, confirmed; the row unchanged in the database; no dialog |
| `closing:` | after Continue under the answers lock the nominations view, no step; one card with the new symbol, pending; the row in the database with the new symbol, unconfirmed; no dialog |
| `saved:` | a party with two nominations in the closed-list election reaches the cards straight from the election step; one of the two removed, Save and Continue; the profile; the two seeded rows in the database, both still confirmed; no dialog |

### The forward case, provoked

`tests/e2e-runs/177-e2e/177-18-forward-red`, head `1b0bbe32a`, the held files with `if (shown)` in place of `if (onEditorStep())` on the stored path, wrapper status 1, 09:49:30Z to 09:58:15Z: 305 tests, **303 passed, 2 failed**.

- `saved:` — `expect(page).toHaveURL(…/profile)`; received `…/nominations/details?…` three times, then `…/nominations/constituencies?nominationElectionId[0]=…&nominationElectionId[1]=…&nominationConstituencyId=…` twenty-one times. **Observed: the rerun of the details load forwards to the constituency step after a stored save that leaves an election with one nomination, and a check of "is the page still shown" strands the user there.**
- `closing:` — `expect(locator).toBeVisible()` on the nominations view's locked note: `element(s) not found`. The page snapshot shows the view with the saved card, pending, and no note. My expectation, not the application: the view's docstring says the answers lock does not show its note, and the plan's row for `closing:` names no note. The line was removed.

`177-verdict control 177-18-forward-red … --red "saved:"`: **FAIL (1)**, for that second red test. The run was not made again: the provoking test failed on its own expectation with the constituency step in its received value, and the other failure's cause was read, not guessed.

### The pre-commit run

`tests/e2e-runs/177-e2e/177-18-precommit`, head `1b0bbe32a`, the seven held files uncommitted (each kept as `177-18-precommit.<file>.kept`, manifest `177-unit/177-18-held-files.tsv`, each `cmp`-equal to the tree at the commit), full default suite, wrapper status 0, 10:01:32Z to 10:10:59Z, Docker VM 16.76 GiB free before it, first attempt: **379 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 116 projects**; `perm-contestant-nominations` 32 of 32. Per project against `177-17-close` (Task 2's corrected verify): equal but for eight more in the nominations project.

`177-verdict control 177-18-precommit … --green --were-red-in 177-18-control` lists *was red, now passed* for all five and then fails on `the recorded Playwright invocation does not name --project`: that sub-command judges a one-project run, and this is a full one. The plan judges the pre-commit run through Task 2's verify, which it passes in the corrected form.

Before it, on the same held files: `yarn workspace @openvaa/frontend check` 0 errors and 0 warnings; `yarn lint:check` 0 (it holds both type checks and comment hygiene, with the new files staged); the unit-coverage guard 0; Prettier 0 — each read from its exit file. A first lint run was 1 for two import orders and one function expression in a test, fixed before the run that counts.

## Task 3 — the gate rows and the full run

**Gate rows** — `tests/e2e-runs/177-gates/177-18-close`, head `faeac54cc`:

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 22 |
| lint | 0 | 49 |
| unit | 0 | 72 |
| check-frontend | 0 | 9 |
| build | 0 | 16 |
| format | 0 | 19 |

`177-verdict gates 177-18-close --rows …`: **PASS**, not stale. Unit totals: frontend **4181 passed and 30 skipped** (4139 in `177-17-close`: 42 more — 15 label, 3 store, 20 page, 4 after-save), dev-seed 1050, data 318, supabase 462, app-shared 148. The driver's `power.txt` holds one Sleep entry in the window, which the verdict reads as informative.

**The full run** — `tests/e2e-runs/177-e2e/177-18-close`, head `faeac54cc`, `bash 177-e2e.sh 177-18-close --require-project perm-contestant-nominations --require-project perm-answers-locked --require-project contestant-journey`, status 0:

- Docker VM 16.62 GiB free before it (the driver's record), 16.54 after. AC power, 100 %. 10:15:13Z to 10:25:14Z. No void marker; no `server connection lost` in its output.
- **379 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 116 projects.** The three required projects: `perm-contestant-nominations` 32 of 32, `perm-answers-locked` 4 of 4, `contestant-journey` 1 of 1.
- Verdict as the plan writes it — `--same-projects-as 177-17-close --except perm-contestant-nominations=7 …` — **FAIL (1)**: `per project: 116 compared, 1 not as expected`, the nominations project at 32 against an expected 31.
- Verdict in the corrected form — `--except perm-contestant-nominations=8`, the five title counts of the plan and `saved:=1` — **PASS**: `per project: 116 compared, 0 not as expected`; `button:` 2, `refused:` 2, `leave:` 1, `stale:` 1, `closing:` 1, `saved:` 1, all passed.
- **Per project against `177-17-close`:** 115 equal; `perm-contestant-nominations` 32 against 24. 371 + 8 = 379.

## For plans 177-19 and 177-20

### For 177-19 — where the page reads the task state, and what the view may now be asked

- **The details page reads `contestantCtx.taskState` in two places**: in the derived `submitAction`, for the label, and in `handleSubmit`, twice, as the argument of `nominationsSaveTarget` — once with nothing to write and once after a stored save. Nothing else of the task state is read, and no state is built on the page.
- **The nominations view shows no note under the answers lock alone.** `closing:` therefore asserts none. When 177-19 gives the view the reason `nominationsAnswersLocked`, that test is the place to add `expectLockedNote(true, 'nominationsAnswersLocked')`; the fixture's type already holds the reason.
- **A `perm-no-nomination` or nominations test that leaves the details step by a full page load with a draft will meet the browser's own `beforeunload` prompt**, which `PreventNavigation` registers. Leave by Cancel, by a save, or with the draft as stored. No test of the suite does otherwise today.
- **Cancel of the details step is a `<button>`.** The fixture presses it by test id and asserts no tag; the election and constituency steps' Cancel are anchors as before.
- `nom-or-edit-list-north` (the party's closed-list nomination) has a candidate under it; `refused: a nomination with candidates…` calls `setNominations(CHILD_CANDIDATE, 'seeded')` first, so it does not depend on what a test before it left.

### For 177-20 — what has been in no scan

- **No axe scan, no width measurement and no keyboard walk** of the message region with any of the four messages, of the button's four labels, or of the details step after a rebuild. The messages are `ErrorMessage inline`, as the `invalid` one is.
- **Whether a screen reader announces a message put into the region while focus moves to the button at the same moment** is not known. Asserted: `role="alert"`, the outcome, focus. Observed: nothing.
- **During the rebuild after `changed`** the cards' place holds the loading indicator and the button its loading form, for as long as the options are read; the message appears when they are. Not measured in a browser beyond `refused: nominations removed elsewhere…` reading the outcome, the new card and focus.

### What each later plan must not assume

- **A save that is not stored, after which the re-read forwards to another step of the editor, shows no message.** A nomination removed elsewhere from an election in which the entity held several makes that election no longer "kept"; the details load's rerun then forwards to the constituency step, the page is gone, and the user is on that step with the nominations as they now are and nothing that says the save was not stored. *Read from the load and the handler; not provoked.* A candidate for the operator's list.
- **`tooManyPending` and `failed` have been in no browser** (ruling 5): each is a component case with the write as a spy. The `failed` message was in a browser once, unintended, in 177-17's first pre-commit run.
- **The eight tests do not cover a moved card that is refused for candidates listed under it**; `hasCandidates` is provoked by a removal.

## Deviations from Plan

### Auto-fixed Issues

None in the application. Two in my own tests, each before any commit:

- **[Rule 1 — Bug] `closing:` asserted a note the view does not show.** Found in `177-18-forward-red`; the line removed. No committed test was ever red.
- **[Rule 1 — Bug] `stale:` and `closing:` were first inserted into the "removing nominations" describe** by an anchor that matched an earlier test's ending. Same session, wrong heading; moved to the new describe before the pre-commit run.

### Other deviations

1. **An eighth browser test, `saved:`.** The dispatch's ruling on P-17 postdates the plan and asks for a test that provokes the forward case; a component case alone cannot say whether the forward happens in a browser. The plan's two count stages therefore fail as written.
2. **`177-18-forward-red` is an extra run and not a clean control** (above). It is the red-first evidence the ruling asks for.
3. **Two harness components** beside `afterSave.svelte.test.ts`. A context is initialised in a component's own init, and the effects a context installs belong to the component that initialises it; standing in for the two layouts with two components keeps those effects where the application has them. Each has a `@component` block that says it is a test harness. They are in no component library and no route.
4. **Cancel is a button with `handleCancel`**, as the profile's Cancel is, where the tracer had an anchor. The plan says Cancel "sets the bypass and navigates"; an anchor with a click handler would have rested on the order of two listeners, and a modified click would have left the bypass on.
5. **`nominationsSaveAction` reads "a next step exists" as "a press leads on"** (above), one case beyond the table.
6. **The bypass is `leavingUnasked` and the mounted flag `shown`**; the profile's names were not reused because the two say different things here.
7. **The build effect's body became `buildCardsAnew()`**, and `builtFor` is no longer cleared by hand.
8. **The red-first unit commit for the label does not type-check alone** (above).
9. **The summary's `metrics` hold the plan's whole duration; `actuals.tokens` is measured over the six commits.**
10. **The commit ledger was written before the first commit**; `plan_head_before` is read from it.

## How the plan's truths stand

Built and observed in a browser: the button's labels Continue, Save and Continue, Return, Save and Return and its two actions; a saved change returning to the home with no task left; `changed` with the rebuilt card, the dropped draft and focus on the button; `hasCandidates` with the card still removed, Keep working, focus on the button and nothing stored; the confirm on leaving, "stay" keeping the draft, Cancel leaving without asking (with a typed symbol and with a removed card); the stale editor under the nominations lock ending on the view with its note, heading focused, nothing stored, no dialog; a save under the answers lock stored and ending on the view; a stored save leading on after the re-read forwarded to another step.

Built and held by a unit or component test alone: every row of the label's table beyond those four labels, the state that is not known among them; `tooManyPending`; `failed` and that no raised text is rendered; a second press retrying; the guard during a save in flight; the store's identity under the lock; A3 and A4.

Not established: whether `stale:` or `closing:` would have been red on the tree before this plan (ruling 4).

## Code review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: eight browser tests, five red before; the gaps are named above. |
| OWASP top 10 | T-177-78: the rejection is logged and the page shows its own key; a component case plants a marker and finds it nowhere in the document. T-177-79: `stale:` reads the stored value after the refused save. T-177-80: accepted; `closing:` shows the stored save and the view. T-177-81: accepted as ruled; a removed row is caught (`refused: nominations removed elsewhere…`). T-177-82: a target is chosen only on `saved`; every other outcome sets the region and returns focus. T-177-83: the bypass is set before the write; `stale:`, `closing:` and `saved:` end with no dialog. T-177-84: three store cases — nothing to clear, a draft alone, a staged property alone — and the two earlier ones. |
| Code style guide; no `any` | Followed; none. Every helper is a function declaration. `as never` for the `data` props and the load's event in the two component tests and the harness, as the existing page test does. |
| No repeated code | The label's rule is in one function; the page builds no task state. `buildCardsAnew` is the one place cards are built. The spec repeats its state steps per test by the suite's rule. |
| New entities documented | TSDoc on the function, its three types and each member; the page's `@component` block rewritten, with a section on a save that is not stored; docstrings on the two harness components and the test's header. |
| Repo documentation updated | Not by this plan: see *Sentences the work made false*. |
| Tracking events | None added; no page of the entity tree sends one. |
| Svelte component guidelines | No library component created. Runes only; `taskState`, `nominations`, `selectedEntity`, `dataRoot`, `appSettings` and `locale` read as `contestantCtx.X` in their scope; no `view-transition-name`, no `<dialog>`, no confirmation component, no branch on the entity's type, no new spacing class. |
| Errors handled | A rejected write and a failed re-read are each logged and never shown; a failed read of the options after a rebuild leaves the page in its error state with the message. |
| Failing checks | One lint run (import order, a function expression in a test) and four type errors in a test's spy, each fixed before the run that counts; the forward-red run's second failure, diagnosed and fixed in the test. |
| Parts sharing dependencies not unduly affected | The store is read by every page of the Contestant App: the pre-commit run was a full default run, 379 of 379, and the store's 68 earlier cases are green. `PreventNavigation`, `Button`, `nominationDraft.ts` and `stepSelection.ts` are unchanged. |
| WCAG A and AA; keyboard and screen reader | The message region is the existing `role="alert"`; focus returns to the main button after every save that stays; Cancel is a button, reachable and operable as before. **No axe scan and no width measurement of the new states** (177-20). |
| Developers' and Publishers' Guides | Not updated; 177-21. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before every commit (inside `lint:check`, read from its exit file, new files staged); no history and no ids in a comment or a title. |
| Clean history; no fixes of itself | Six commits, none a fix of another. |
| Formatting changes apart | None. |
| `[db]` | No schema, migration or type change. |

## The components skill's re-check list

| Item | Outcome |
|---|---|
| 1. docstring, type file, barrel | No library component was added, removed, renamed or moved. The two harness components sit beside their test in a route directory, outside the three library directories, and have no type file and no barrel by design. |
| 2. `generate:docs` | Not run: the generated listing covers the three library directories, and none changed. |
| 3. `validate:links` | Not run; no doc was changed and the plan's gate rows do not include `docs-links`. |
| 4. the skill itself | Read against the change: nothing in `SKILL.md` is made false. `context-reactivity.md` was not read whole; the rule as `CLAUDE.md` and the skill's summary state it was followed. |
| 5. drift and link audits | Not run: the skill's files were not touched. |

## Prohibitions

- **PROH-177-47** (no raised text rendered): the marker case of `page.svelte.test.ts`; the page's messages are four keys in one map. Explicit.
- **PROH-177-48** (a refused save navigates nowhere of the page's own): `goto` not called in each of the six not-stored cases; `stale:` ends on the view by the guard's redirect alone. Explicit.
- **PROH-177-49** (no `taskStateOf` on the page; `taskState.ts` imports nothing): Task 1's and Task 2's verify stages, both passed. Explicit.
- **PROH-177-50** (no dialog element, no confirmation component): Task 2's verify stage; the component case counting `<dialog>`. Explicit.
- **PROH-177-51** (the guard never keeps what the lock must clear): the store's two new cases and its two earlier ones. Explicit.

## Threat Flags

None beyond the plan's register. The page reads `page.route.id` in an event handler, after its own re-read; no load reads a URL or a route.

## Sentences the work made false, reported and not edited

- `177-18-PLAN.md`: "seven E2E tests", `perm-contestant-nominations=7` in two verify commands, and row 1 of `<the_outcomes>` ("the page is no longer shown … after a save that was stored") — the stored path asks where the user is.
- `177-DISPATCH.md`, *What the editor's fixture expects of the screens*: "the fixture asserts Edit, Cancel and 'Change the selection' as anchors" — Cancel of the details step is a `<button>`, and the fixture asserts no tag for it. *After 177-17*: "`perm-contestant-nominations` holds 24 tests" — 32; "`builtFor` is a plain variable, cleared before `invalidateAll()` to rebuild the cards" — it is not cleared; `buildCardsAnew()` is called.
- `177-UI-SPEC.md` S8: "The page computes its prospective state as the profile and the question page do" — it computes none. S6's markup for the details step's Cancel, where it reads as an anchor. S8's label table has no row for a state that is not known, nor for a next step that is the nomination task.
- `177-RESEARCH.md` A3: "one `await tick()` … is enough" — true, and the tick is not what is needed; A3 and A4 are no longer "still open because they need a browser".
- `177-17-SUMMARY.md`: "The main button's label and action are still the tracer's one row", "The refusals … still read `failed`", "The mounted page between the rerun and the navigation after a stored save: inferred", and *Known Stubs*.
- `177-15-SUMMARY.md`, *Known Stubs*: the main button's fixed row and the refusals, resolved.
- `apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md`: "A button that saves asks twice … **For its label**, before the save, with a state built by `taskStateOf` from the saved data together with the draft on the page" — not so for the nomination editor's button; the page names neither `nominationsSaveAction` nor `nominationsSaveTarget`.
- `.planning/todos/pending/2026-10-09-176-user-data-store-rewrites-current-on-every-run-of-the-answers-lock-effect.md`: closed by `77ec7ba38`.
- The frontend's unit count wherever it is stated: 4181 passed and 30 skipped.

## For plan 177-21

- **`tooManyPending` and `failed` are held by component cases alone** (ruling 5), with the two refusal codes asserted through the real API by 177-09's integration cases.
- **The todo of item P-18's residue**: a nomination an administrator adds to the entity while the editor is open is left out of the desired set and deleted by the save, and a value an administrator changes meanwhile is written over, each with no refusal. A removed row is caught and shown as `changed` — observed in `refused: nominations removed elsewhere…`.
- **The store's todo is closed** by this plan's fix; move it to `done`.
- **A new candidate for the operator's list**: a save that is not stored whose re-read forwards to another step of the editor shows no message (above).
- **P-17 as built**: the recommended option, with the located difference that "the page is still shown" is read from the route after a stored save. The other option — on to the next task under a fresh answers lock — is now `if (onEditorStep())` removed from one line.
- `nominationsSaveAction` is a seventh function beside the six of `$lib/contestant/tasks` that a page asks; the developers' guide page above is where it belongs.

## Not done, or not verified

- `tooManyPending` and `failed` in a browser.
- Whether `stale:` or `closing:` would have been red before this plan.
- `saved:` on the tree before this plan: not run there.
- A clean one-run control for the forward case: `177-18-forward-red` holds a second red test.
- Axe scans, width measurements and a keyboard walk of the new states (177-20); what a screen reader announces.
- A4 beyond the entity layout: the layouts above it are stood in for or left out.
- A save that is not stored whose re-read forwards to another step: read, not provoked.
- `.claude/skills/components/context-reactivity.md` was not read whole.
- `gsd_run windows append` was not run, and `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not updated, as the dispatch rules.

## The state the local stack is left in

No database gate was run and the database was not reset by this plan. It is as the full run's teardowns left it: every `e2e-perm-` and `test-` dataset removed (inferred from the run's green teardown projects; not queried). Both locks are off: each test that sets one unsets it in a `finally`, and the run was green. No dev server is running; port 5173 has no listener. Docker VM 16.54 GiB free. `git status --short` before this file: `?? CAND-APP-PLAN.md`.

## Known Stubs

None added. The tracer's two stubs that 177-17 left for this plan — the main button's one fixed row, and the refusals that all read `failed` — are resolved.

## Evidence (gitignored)

- `tests/e2e-runs/177-e2e/177-18-control`, `177-18-forward-red`, `177-18-precommit`, `177-18-close`, with the kept copies beside the first three.
- `tests/e2e-runs/177-gates/177-18-close`.
- `tests/e2e-runs/177-unit/177-18-*`: the three verify scripts with log, exit and head and the corrected forms of Tasks 2 and 3; the red logs and JSON reports of the label, the store and the page; the two planted-defect reports; the verdict and evidence logs; the check, lint, type-check, component-test, coverage and Prettier logs with their exit files; `177-18-held-files.tsv`; `177-18-commit-1.sh` and `177-18-commit-2.sh`.

## Self-Check: PASSED

The six commits are ancestors of `HEAD`; the three created files and the eight modified ones exist; the four E2E run directories and the gate directory exist with their `ended` or `done` markers.
