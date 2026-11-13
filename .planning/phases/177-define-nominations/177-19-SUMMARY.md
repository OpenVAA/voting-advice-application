---
phase: 177-define-nominations
plan: 19
subsystem: frontend-routes
tags: [nominations-view, task-state, nomination-editor, entry, locks, questions-follow, e2e]
status: complete
requires:
  - "177-18: the details page as built, the full run 177-18-close (379 of 379, 116 projects)"
  - "177-15: the load of the nominations tree and its nominationFacts, the editor's guard"
  - "177-12: the copy — descriptionEditable, emptyEditable, emptyNoElection, edit, requestedParent, nominationsNotEditableAnswersLocked"
  - "177-11: the nominations view's fixture steps (expectState with editable, expectEditAction, pressEdit, expectCard with a requested parent)"
  - "177-01: 177-gates.sh, 177-e2e.sh, 177-verdict.mjs"
provides:
  - "taskState.ts: TaskRoute holds ContestantAppNominationElections; TaskStateInput.nominationsEditable (optional); NominationsViewFacts; NominationsViewTarget; nominationsViewTarget(state, facts)"
  - "contestantContext: the task state's derived hands nominationsEditable over from nominationsEditableOf"
  - "nominations/+page.svelte: six states, data-nominations-editable, data-empty define | locked | noElection, contestant-nominations-edit, nomination-requested-parent, data-action define, data-reason nominationsAnswersLocked, role=list, mt-md and gap-md"
  - "the entity home: role=list on the task list"
  - "nominationDraft.ts: typedParentNameOf, exported"
  - "fixture steps: contestantEntityHomePage.followNominationTask; contestantNominationEditor.markDocument, .expectSameDocument; contestantNominationsPage.expectDescription, .expectButtonText; contestantQuestionsOverviewPage.expectQuestionsListed; perm-no-nomination's clearWrittenNominations; the nominations root hands out navMenu and contestantQuestionsOverviewPage and exports deleteNominationsWithDescendants"
  - "fifteen E2E tests in contestant-nominations.spec.ts: ten nominations-view:, one entry:, two holds:, two follow:, all @nomination-definition"
  - "runs: 177-e2e/177-19-control (13 red, each on its expectation), 177-e2e/177-19-precommit (394 of 394), 177-gates/177-19-close, 177-e2e/177-19-close (394 of 394)"
affects: [177-20, 177-21]
tech-stack:
  added: []
  patterns:
    - "a page that offers a way into a guarded tree reads the facts the guard decides on from the load they share, so the offer and the guard cannot disagree"
    - "a continue-target function takes the one fact the task state cannot hold as a second argument and names the button's action, so the page compares no route"
key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contestant/tasks/taskState.ts
    - apps/frontend/src/lib/contestant/tasks/taskState.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
    - apps/frontend/src/lib/contestant/nominations/nominationDraft.ts
    - "…/[entityId=uuid]/nominations/+page.svelte"
    - "…/[entityId=uuid]/nominations/page.svelte.test.ts"
    - "…/[entityId=uuid]/+page.svelte"
    - "…/[entityId=uuid]/page.svelte.test.ts"
    - tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts
    - tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts
    - tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts
    - tests/tests/fixtures/contestant/perm-contestant-nominations.ts
    - tests/tests/fixtures/contestant/perm-no-nomination.ts
    - tests/tests/setup/perm/perm-no-nomination.teardown.ts
    - tests/tests/specs/perm/contestant-nominations.spec.ts
    - tests/tests/specs/perm/perm-no-nomination.spec.ts
    - tests/tests/specs/a11y/contestant-a11y.spec.ts
decisions:
  - "nominationsEditable is an optional input of taskStateOf, read for an entity with no nomination alone; left out it is read as not editable, so the nomination task then leads to the view and never into the editor"
  - "the view takes whether an entry is offered from nominationFacts of the page's data, and the note's reason from the context's two locks"
  - "an empty view under no lock whose data holds no facts shows no sentence in place of the nominations"
  - "the view reads a typed parent name through typedParentNameOf of the draft module, which is exported, so the custom-data key is written once"
requirements-completed: [NOM-06, NOM-08]
metrics:
  started: "2026-10-11T10:31:07Z"
  completed: "2026-10-11T11:27Z"
  duration: "about 56 minutes, of which about 30 are three E2E runs and about 4 the gate rows"
  tasks: 3
  files: 19
actuals:
  tokens: 47638 # chars/4 over git diff 7b4b3b2df..8f6db36bc outside .planning (190,551 characters)
  tasks: 3
  commits: 3 # git rev-list --count 7b4b3b2df..8f6db36bc, measured before this file was committed
plan_head_before: 7b4b3b2dfab979313b5dfce943183dbb5884f698
plan_head_after: 8f6db36bc8d50047600c970e9cc0085d05a6f635
---

# Phase 177 Plan 19: The Ways into the Editor, the Nominations View's Six States, and What Follows a Save — Summary

The home's first task now leads straight into the nomination editor for an entity with no nomination while nominations can be edited, and to the nominations view while they cannot. The view shows one of six states — with nominations or none; editable or not; an election that admits the entity or none — with a link to the editor where it lists nominations and an entry is offered, a note under either lock that gives that lock's reason, and a typed party name on its own row with the line that it was requested. Fifteen browser tests hold it, thirteen of them red on the tree before the change; two of them walk a save and read the home, the view and the questions afterwards with no new document loaded.

**No schema change was needed.** `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `177-DISPATCH.md` and `177-21-INPUTS.md` were not touched.

## Read this first

- **Green end to end, each run on its first attempt.** Closing run `177-19-close`: 394 of 394, 116 projects, per project equal to `177-18-close` but for fifteen more in `perm-contestant-nominations` (47). Six gate rows green. No committed test was red at any commit, no test was retried, no axe finding, no overflow.
- **All three verify commands exit 0 as written.** The plan's count of fifteen holds: the verify stages compare a difference against `177-18-close`, not a total, so the project standing at 32 before this plan moved nothing. No corrected copy was needed, and none of the six known defects was met.
- **The control is one run, as the plan writes it.** `177-19-control`: exactly the thirteen `nominations-view:`, `entry:` and `follow:` tests red, each on an expectation; 307 others green, the two `holds:` tests among them. The two-run method of *After 177-16* was not needed: the control ran with only `contestant-nominations.spec.ts` uncommitted, so nothing upstream was red.
- **Eleven of the thirteen reds failed on the view's state attributes, read first** — as the plan designs — so the assertions after that first read were never seen red in a browser. Five planted defects at the component level show that the cases behind them are sensitive (below). *Not done or not observed* lists what that leaves.
- **`nominationsEditable` is optional**, which the plan does not say. The profile page and the question page build a prospective state with `taskStateOf` and neither may write the "editable" condition out. *Deviations*, 1.
- **A defect of my own first commit, fixed in the third.** Three "no facts" cases of the view's component test passed `undefined` to a helper whose parameter has a default, so they rendered with facts. They were red at commit 1 for the missing attribute and would never have turned green. Found on the first green run; the helper now takes `null`. A planted defect then turned exactly those three red. *Deviations*, 5.
- **Commits 1 and 2 leave the frontend type check red** (37 errors in three test files, each for a member, an arity or a type the third commit adds). *Deviations*, 6.
- **Five files beyond the plan's list**, all additive but one export: two fixtures, the draft module, and two renames-with-export. *Deviations*, 2 and 3.
- **The host's lid was closed during every run** (`Entering DarkWake state due to 'Clamshell Sleep'` at the start of each window). No run carries the void marker, no output holds `server connection lost`, and the heartbeat's worst gap in the closing run was 72 ms.

## Task Commits

| # | Commit | What |
|---|---|---|
| 1 | `a90d76cb8` | `test(177-19)`: the red unit and component cases in four files, alone — 48 failed of 340, each an `AssertionError` |
| 1 | `b3e7815d8` | `test(177-19)`: additive fixture steps and compositions in six files; no committed spec calls one |
| 2 | `8f6db36bc` | `feat(177-19)`: **the one** — the task state, the context, the view, the home, the draft module's export, the view's component test, the spec's fifteen tests and one changed assertion, the changed tests of two other specs, the teardown — after the control and the green pre-commit run |
| 3 | — | runs only |

## Each task's verify command, with its real exit status

Each block was written byte for byte from the plan to `tests/e2e-runs/177-unit/177-19-t<N>-verify.sh` and run with `bash`; log, exit and head are beside it.

| Task | As written | Corrected | Head |
|---|---|---|---|
| 1 | **0** | — | `b3e7815d8`, the spec uncommitted |
| 2 | **0** | — | `8f6db36bc` |
| 3 | **0** | — | `8f6db36bc` |

## Task 1 — the red cases, the fixture steps, fifteen tests and the control

### The red unit and component cases

Kept twice: `177-unit/177-19-units-red.{log,exit,head,json}` is the first run, and `177-19-units-red-r2.*` the files as committed but for one import order. Both: exit 1, head `7b4b3b2df`, **48 failed, 292 passed** of 340, every failure an `AssertionError`.

| File | Red | What they pin |
|---|---|---|
| `taskState.test.ts` | 17 | rule 2 by `nominationsEditable`; `homeAction` to the entry; every row of `nominationsViewTarget(state, facts)` with its `action` |
| `contestantContext.svelte.test.ts` | 4 | the entry with neither lock on; a lock coming on and going off under a live context |
| the home's `page.svelte.test.ts` | 4 | `role="list"`; the row and the main action to the entry; the home differs in those two addresses alone |
| the view's `page.svelte.test.ts` | 23 | thirteen state cases, the typed parent, three changes under a mounted page |

**Green from the start, so guards and not red-first evidence**: the D-14 cases in both files (a stored answer to a question the entity is not asked — `unansweredQuestionsOf` and the context already count the applicable set only); `nominationsSaveTarget` for a next step that is the entry; the three cases under a lock in the context's file; the cases that rules 1, 3 and 4 answer the same state whatever the input holds.

### `nominationsViewTarget` and `NominationsViewFacts`, as written

```ts
export type NominationsViewFacts = { entryOffered: boolean };
export type NominationsViewTarget = ContinueTarget & { action: 'continue' | 'return' | 'define' };

export function nominationsViewTarget(state: TaskState, facts: NominationsViewFacts): NominationsViewTarget | undefined;
```

- the state not known: `undefined`, whatever the fact;
- a next step that is not the nomination: that step, `continues: true`, `continue`;
- a next step that is the nomination, an entry offered **and** the step's route the editor's entry: that route, `continues: true`, `define`;
- otherwise the entity's home, `continues: false`, `return` — no next step, no entry offered, or an entry said to be offered while the task leads to the view.

`TaskStateInput.nominationsEditable?: boolean` — read in rule 2 alone; left out, it is read as not editable. `taskState.ts` still imports nothing and `taskLabelKey` is byte-equal to the base commit (Task 2's verify).

### The fixture steps

| Fixture | Step |
|---|---|
| `contestantEntityHomePage` | `followNominationTask()` — presses the nomination row, waits for one known page, answers by the values `followMainAction` returns; both now share one private `destinationShown` |
| `contestantNominationEditor` | `markDocument()`, `expectSameDocument()` — a member of the window object |
| `contestantNominationsPage` | `expectDescription(text)` — one paragraph of the view reads exactly that above a shown list; `expectButtonText(text)` |
| `contestantQuestionsOverviewPage` | `expectQuestionsListed(labels)` — one card per label and as many cards as labels, every category expanded |
| the nominations root | `navMenu` and `contestantQuestionsOverviewPage` as fixtures of `test`; `deleteNominationsWithDescendants` exported |
| `perm-no-nomination.ts` | `clearWrittenNominations()` — every nomination of the dataset's three entities with no external id, what stands under one first |

### The control

`tests/e2e-runs/177-e2e/177-19-control`, head `b3e7815d8`, only the spec uncommitted, one project, wrapper status 1, 10:45:17Z to 10:55:10Z, Docker VM 16.54 GiB free before it, AC power, no void marker: 320 tests, **307 passed, 13 failed, 0 did not run**. `177-verdict control 177-19-control … --red "nominations-view:" --red "entry:" --red "follow:"`: **PASS** — *13 test(s) named; 307 other test(s)*.

| Red test | Expected | Received |
|---|---|---|
| `nominations-view: listed and editable…` | `data-nominations-editable="true"` | no such attribute |
| `…nominations listed but no election admissible — no Edit` | `"false"` | none |
| `…under the nominations lock every editor address leads here…` | `"false"` | none |
| `…under the answers lock alone…` | `data-nominations-locked="true"` | `"false"` |
| `…with both locks on…` | editable `"false"` | none |
| `…a typed party is shown on its row…` | editable `"true"` | none |
| `…no nomination and editable…` | editable `"true"` | none |
| `…no nomination under either lock…` | editable `"false"` | none |
| `…a party with no nomination reads the same…` | editable `"true"` | none |
| `…no election the party can stand in…` | editable `"false"` | none |
| `entry: …the home's first task and its main action lead to the editor` | `"nominationElections"` | `"nominations"` |
| `follow: after a first save…` | `"nominationElections"` | `"nominations"` |
| `follow: a question that no longer applies…` | editable `"true"` | none — after the questions list read three cards and 3 of 3, the menu led home and the row led to the view |

The spec as the control ran it is `177-19-control.contestant-nominations.spec.ts.kept`.

## Task 2 — the task state, the view, the home, the other specs, the pre-commit run

### The view as built

- **What decides.** `entryOffered` is `!!facts && facts.editable && facts.admissibleElectionIds.length > 0`, over `data.nominationFacts`. `lockReason` is `nominationsLocked` when the context's `nominationsLocked` is on, otherwise `nominationsAnswersLocked` when its `answersLocked` is, otherwise nothing. The page calls no predicate and writes no "editable" condition: it reads the fact from the load and picks the note's reason from the two locks.
- **The note** is rendered while `lockReason` is set, under the one test id, with `data-reason`; `data-nominations-locked` follows it and `data-nominations-editable` follows `entryOffered`.
- **Listed**: `nominationsDescriptionEditable` where an entry is offered, `nominationsDescription` otherwise; the list carries `role="list"`; a card's parent row is the parent when there is one, and otherwise the typed name with the requested line inside the same `<dd>`, under `nomination-requested-parent`.
- **Empty**: `data-empty` is `define` where an entry is offered, `locked` under a lock, `noElection` where the facts say editable and no election admits the entity — and nothing at all where none of the three holds. The support block is rendered in `noElection` alone.
- **The actions**: the main button's label is picked by `target.action` (`define` reads `contestantApp.home.nomination.enter`); the Edit button is rendered where `viewState === 'listed' && entryOffered`, outside the branch on the target, so it is there while the main button is still in its loading form.
- **Spacing**: `mt-12`, `gap-12`, `mt-12` are `mt-md`, `gap-md`, `mt-md`.

### Every reader of the route union that changed

None. `TaskRoute` gained `ContestantAppNominationElections`; the type check named no reader: `getRoute.current` already accepted the key, and the home, the menu and the details page render whatever route they are given. The two callers of `taskStateOf` outside the context — the profile page and the question page — compile unchanged because the new input is optional.

### ESLint and the compiler on the list role

`yarn lint:check` exit 0 and `yarn workspace @openvaa/frontend check` *0 errors, 0 warnings* with both roles in place. **Assumption A8 holds: neither raised anything**, and no accepted-warning comment was written.

### The changed tests of the two other specs

`perm-no-nomination.spec.ts` — 68 tests before and after; no test removed.

| Test, by its title before | What it asserted | What it asserts |
|---|---|---|
| `nominations: a candidate with no nomination sees the empty view, one way to support and a Return that leads home` — **retitled** `…sees the sentence that one can be defined, no support button and a button that leads into the editor` | empty, unlocked; the "contact support" sentence; one support button; `return`; pressed → the home | empty, unlocked, `editable: true`; the "can define" sentence with `data-empty="define"`; no support button; `define`; pressed → the editor's details step |
| `nominations: a party with no nomination sees the same view in its own words` | the same, in the party's sentence | the same, in the party's sentence |
| `home: a candidate with no nomination sees the nomination to define and the rest closed, with the reason` | the main action pressed → the nominations view | pressed → the editor's details step |
| `home: a party with no nomination sees the same list under its own name` | the same | the same |
| `phone: the empty nominations view fits the viewport` (at 320 and 390) | the "contact support" sentence; fits | `editable: true`; the "can define" sentence, `define`; the button says `define`; fits |
| scan entry `no-nomination-nominations-empty` (light and dark) | reach: empty, unlocked, the "contact support" sentence, `return` | reach: `editable: true`, the "can define" sentence with `data-empty="define"`, `define` |
| `nominations: with nominations locked, the empty view shows the note above the same sentence and one support button` — **retitled** `…above the sentence that says whom to ask, and one support button` | — | **no expectation changed**; "the same sentence" no longer named anything |

Each changed expectation is one the surface made false: the sentence, the support count, the button's action and where a press leads. Nothing was loosened; the two `nominations:` tests and the scan's reach each gained two reads. The dataset's one election is `organization_list_and_independents` in one constituency, so the editor leads both entity types straight to the details step — **observed**.

`contestant-a11y.spec.ts` — `cand-nominations`: the reach also asserts `data-nominations-editable="true"` and that the link to the editor is visible. The scan passes in both themes with the link on the shaded page.

`contestant-nominations.spec.ts` — `closing:` gained `expectState({ listed, locked: true, editable: false })` and `expectLockedNote(true, 'nominationsAnswersLocked')`, as *After 177-18* names. Not in the control, by design: it would have been a fourteenth red.

`perm-no-nomination.teardown.ts` calls `clearWrittenNominations()` first. **Not exercised with a row to clear**: no test of that spec saves through the editor.

### Planted defects, at the component level

Each planted in the working tree after the gate rows, run against one test file, and restored with `git checkout --`; reports in `177-unit/177-19-planted-*.{log,exit,json}`.

| Planted | Cases red |
|---|---|
| the support block also where a nomination can be defined | 2 — the two "no nomination, editable" cases, on the support count |
| the Edit link wherever nominations are listed | 6 — three lock cases, no admissible election, no facts, a lock coming on |
| one reason for both locks | 2 — the two "answers lock alone" cases, on `data-reason` |
| an entry offered where the data holds no facts | 3 — exactly the three "no facts" cases |
| `nominationsViewTarget` into the editor with no entry offered | 1 of 168 — "no nomination, nominations can be edited and no entry is offered… : home" |

### The pre-commit run

`tests/e2e-runs/177-e2e/177-19-precommit`, head `b3e7815d8`, ten files uncommitted (each kept as `177-19-precommit.<name>.kept`, manifest with SHA-256 in `177-unit/177-19-held-files.tsv`, each `cmp`-equal to the tree at the commit — the commit script refuses otherwise), full default suite, wrapper status 0, 10:59:16Z to 11:09:10Z, Docker VM 16.46 GiB free before it, first attempt: **394 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 116 projects**. Against `177-18-close`: equal but for fifteen more in `perm-contestant-nominations` (47 of 47).

Before it, on the same files, each read from its exit file: `yarn workspace @openvaa/frontend check` 0 (0 errors, 0 warnings); the unit tests of the four directories 0 (1408 of 1408); `yarn lint:check` 0 (it holds both type checks and comment hygiene); `yarn assert:a11y-scan-wiring` 0; Prettier 0.

## Task 3 — the gate rows and the full run

**Gate rows** — `tests/e2e-runs/177-gates/177-19-close`, head `8f6db36bc`:

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 23 |
| lint | 0 | 51 |
| unit | 0 | 70 |
| check-frontend | 0 | 9 |
| build | 0 | 16 |
| format | 0 | 22 |

`177-verdict gates 177-19-close --rows …`: **PASS**, not stale. Unit totals: frontend **4228 passed and 30 skipped** (4181 in `177-18-close`: 47 more), dev-seed 1050, data 318, supabase 462, app-shared 148. `power.txt` holds one Sleep entry in the window, which the verdict reads as informative.

**The full run** — `tests/e2e-runs/177-e2e/177-19-close`, head `8f6db36bc`, `bash 177-e2e.sh 177-19-close --require-project perm-contestant-nominations --require-project perm-no-nomination --require-project contestant-a11y-scan --require-project contestant-journey`, status 0, first attempt:

- Docker VM 16.34 GiB free before it (the driver's record), 16.24 after. AC power, 100 %. 11:13:45Z to 11:24:15Z. No void marker; no `server connection lost` in its output; 312 heartbeats, 72 ms the latest.
- **394 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 116 projects.** The four required projects: `perm-contestant-nominations` 47 of 47, `perm-no-nomination` 68 of 68, `contestant-a11y-scan` 24 of 24, `contestant-journey` 1 of 1.
- Verdict as the plan writes it — `--same-projects-as 177-18-close --except perm-contestant-nominations=15` with the four title counts — **PASS**: `per project: 116 compared, 0 not as expected`; `nominations-view:` 10, `entry:` 1, `holds:` 2, `follow:` 2.
- **Per project against `177-18-close`:** 115 equal; `perm-contestant-nominations` 47 against 32. 379 + 15 = 394.

## For plan 177-20 — the steps that reach each of the view's states

All through `tests/tests/fixtures/contestant/perm-contestant-nominations.ts`; a scan's `reach` takes the page fixtures from `contestantNominationsPagesOf(page)`. Every step that sets a lock or an election's type is followed by a full page load and restored in a `finally`.

| State | Steps | What the reach reads |
|---|---|---|
| J1 — listed, an entry offered | `setNominations(EDIT_ORGANIZATION_GRANT, 'seeded')`, both locks off; `contestantNominationsPage.open` | `expectState({ listed, locked: false, editable: true })`, `expectEditAction()`. Already scanned by `cand-nominations` on the base dataset. |
| J2 — listed, under a lock | `setNominations(EDIT_CANDIDATE_GRANT, 'seeded')`; `setNominationsLocked(true)` or `setAnswersLocked(true)` | `expectState({ listed, locked: true, editable: false })`, `expectLockedNote(true, 'nominationsLocked' \| 'nominationsAnswersLocked')` |
| J3 — empty, an entry offered | `setNominations(NEW_CANDIDATE_GRANT, 'none')`, locks off | `expectState({ empty, false, editable: true })`, `expectEmptySentence(text, 'define')`, `expectButton('define')`. Already scanned by `no-nomination-nominations-empty`. |
| J4 — empty, under a lock | the same with a lock on | `expectEmptySentence(text, 'locked')`, the note |
| J5 — empty, no election | `setNominations(NEW_ORGANIZATION_GRANT, 'none')`; `setElectionType(LIST_ELECTION_EXTERNAL_ID, 'candidate_only')` and the same for `OPEN_ELECTION_EXTERNAL_ID`; restore both from `SEEDED_ELECTION_TYPES` | `expectState({ empty, false, editable: false })`, `expectEmptySentence(text, 'noElection')`, `expectSupportButtons(1)`. Marker: the empty sentence with `data-empty="noElection"`. |
| J6 — listed, no election | `setNominations(EDIT_ORGANIZATION_GRANT, 'seeded')` and the same two types | `expectState({ listed, false, editable: false })`, `expectNoEditAction()` |
| a typed parent's row | `setNominations(EDIT_CANDIDATE_GRANT, 'seeded')`; `addNomination(EDIT_CANDIDATE_GRANT, OPEN_NATION_CONTEST, { externalId, parent: { kind: 'other', name } })` in an election the candidate has no other nomination in, so `expectCardOf` names the card | `expectCardOf({ …, parent: null, requestedParent: name })` |

What has been in no scan and no width measurement: J2 under the answers lock (the note's third sentence), J5, J6, the requested-parent row, and the Edit link at 320 and 390 pixels. J3 is measured at both widths by the changed `phone:` test.

**A test that ends on the details step with a new card must not navigate by a full page load afterwards**: the two `home:` tests and the two `nominations:` tests of `perm-no-nomination.spec.ts` end there, which meets no prompt because the page is closed with the test.

## For plan 177-21

- **`2026-10-09-176-states-and-assertions-the-phase-left-unexercised.md`**, items this plan's tests now exercise:
  - item 4, both halves — `holds: with no nomination under either lock the home's first task leads to the nominations view` loads the home of an entity with no nomination under the nominations lock and under the answers lock, reads its next step and follows its main action. It does not read the home's note.
  - item 9, in part — `nominations-view: a typed party is shown on its row with the line that it was requested` reads a parent row that is not a party's own; a party under an alliance is still read by no test of this plan.
  - item 11 is not met by this plan: its tests enter the view by in-app navigation and assert no focus there (`stale:` of 177-18 does).
- **`2026-10-09-176-list-semantics-of-the-task-list-and-the-nominations-list-on-webkit.md` is closed by the two roles** (operator decision F4 (a)). Its sentence that the role "trips Svelte's `a11y_no_redundant_roles` warning" did not hold on this tree: the check ran with `--fail-on-warnings` and raised nothing. Whether WebKit announces the lists is still not tested: the suite has no WebKit project.
- **Sentences of the docs this plan made false** are listed under *Sentences the work made false*. `CLAUDE.md`: none found.
- **`nominationsEditable` is optional** and the other option is located: make it required, and give the profile page and the question page the value — each a third asker of the predicate, or a value the context exposes. One member's `?` in `taskState.ts` and one line in each page.
- **The view's seventh, unreachable state**: an empty list, no lock and no facts in the data shows the heading and Return alone. The load answers no facts only where the root or the entity layout shows an error view in the page's place.
- **A candidate for the operator's list**: between the load's rerun and the app context's settings effect the view can render one frame with `editable: false` and no note — the fact comes from the load and the reason from the context. *Inferred from the code; not observed*, and no test saw it: `stale:` and `closing:` both end on the note.

## Deviations from Plan

### Auto-fixed Issues

None in the application. In my own tests:

- **[Rule 1 — Bug] A test helper's default hid the "no facts" case** (*Read this first*). Committed red in `a90d76cb8`, fixed in `8f6db36bc`. No committed E2E test was ever red.
- **[Rule 1 — Bug] Two type errors and one import order in the D-14 case**, each before the first commit; the first red run kept is the one before them.

### Other deviations

1. **`nominationsEditable` is optional.** The plan's step 5 foresees readers of the route union; the type check instead named two callers of `taskStateOf` — the profile page and the question page, which build a prospective state. PROH-177-54 forbids a page to write the condition out, and the plan says nothing else of the context changes. Left out, the input reads as not editable, which fails toward the view and never toward an editor that would turn the user away. Both pages are under the route group of an entity that has a nomination, for which the input is not read — a unit case pins that it is not.
2. **`typedParentNameOf` is exported from `nominationDraft.ts`** (the private `typedNameOf`, renamed, taking `Pick<EntityNomination, 'customData'>`). The view needs the typed name; a second copy of the key `requestedParentOrganization` would have been repeated code. One file beyond the plan's list, in the feat commit.
3. **Fixture files beyond the plan's list**: `contestantNominationsPage.fixture.ts` (two steps — the fixture had none for the listed sentence or the button's text) and `contestantQuestionsOverviewPage.fixture.ts` (one step, as the plan allows). The nominations root's private `deleteWithDescendants` is exported as `deleteNominationsWithDescendants` and the no-nomination root imports it, in place of a second copy of thirty lines.
4. **The note's reason is read from the context's locks and the entry from the load's facts** — two sources of one setting (*For plan 177-21*, last item). The facts hold `editable` and not which lock, and the plan adds nothing to them.
5. **The helper's default**, above.
6. **Commit 1 does not type-check alone, and neither does commit 2's tree in the frontend.** A red-first case against a member that does not exist cannot. ESLint and comment hygiene were 0 before commit 1; `yarn typecheck:tests`, ESLint over the fixtures and comment hygiene 0 before commit 2; the full `lint:check` and the frontend check 0 before commit 3 — each chained on its exit file's value.
7. **One more walk in the J5 test than its row names**: Return leads home, and the home's main action leads to the view again — the ring of T-177-90, seen closed in a browser.
8. **`follow: after a first save…` reads how many questions are counted, not which.** With nothing answered the questions list shows no cards, so the count on the home (2, and 1 on the profile) is what it reads. The second `follow:` test names the questions by their labels.
9. **Neither `follow:` test reads the home row's label**: the row's status and where it leads are read; the label is `taskLabelKey`'s, unchanged and unit-tested.
10. **The summary's `metrics` hold the plan's whole duration; `actuals.tokens` is measured over the three commits.**

## How the plan's truths stand

**Built and observed in a browser**: the home's main action and its nomination row into the editor with no nomination and nothing locked; to the view under either lock, and for an entity that has a nomination; the home complete with scripts off (the existing test, green); J1 with Edit, pressed, and the party's elections checked; J3 for a candidate and a party, the button in the home's words, pressed, nothing checked; J4 under each lock; J5 with one support button, the entry address leading back, Return leading home and the home leading to the view again; J6; all three editor addresses leading to the view under the nominations lock and under the answers lock alone, with that lock's reason and no Edit; one note under both; the typed party on its row; after a first save, by the menu, the nomination complete, two questions counted, the view listing the pending nomination and continuing to the profile, one document throughout; a nomination removed and defined again with its question leaving the list and returning answered, one document throughout; the home's list and the view's list in both themes of the scans.

**Built and held by a unit or component test alone**: the view with no facts in its data; a typed name with markup in it rendered as text; a typed name of white space or of no text; a nomination with both a parent and a typed name; `nominationsViewTarget` while the state is not known; D-14 at the unit level.

**Not established**: that each of the six states is in the server-rendered markup and unchanged by hydration. No test loads the view with scripts off; it follows from the fact being a universal load's data and the locks being read from settings the server holds — *inferred*.

## Code review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: fifteen browser tests, thirteen red before; the gaps are named above. |
| OWASP top 10 | T-177-85: the entry is read from the facts the guard decides on; three browser tests for the redirect under each lock. T-177-86: the typed name is a text interpolation; a component case renders markup and finds no element. T-177-87: six states as a component table and as browser tests. T-177-88: no write is made to answers; unit and context cases; the second `follow:` test. T-177-89: the table of changed tests above; no count moved. T-177-90: unit cases, and the J5 test walks the ring. |
| Code style guide; no `any` | Followed; none. `as never` for the `data` prop in the view's component test, as the existing page tests do. |
| No repeated code | The typed-name key and the delete-with-descendants are each in one place (*Deviations*, 2 and 3). The spec repeats its state steps per test by the suite's rule. |
| New entities documented | TSDoc on the two types, their members, the changed function and the exported helper; the view's `@component` block rewritten to the six states; each fixture step documented and listed in its file's header. |
| Repo documentation updated | Not by this plan: see *Sentences the work made false*. |
| Tracking events | None added; no page of the entity tree sends one. |
| Svelte component guidelines | No library component created. Runes only; `nominations`, `nominationsLocked`, `answersLocked`, `taskState` and `selectedEntity` read as `contestantCtx.X` in their scope; no `view-transition-name`, no `<dialog>`, no branch on the entity's type, no numeric spacing class. |
| Errors handled | The page raises and catches nothing; an absent fact reads as no entry. |
| Failing checks | Three component cases on the first green run (the helper); one import order and two type errors before the first commit. |
| Parts sharing dependencies not unduly affected | The task state is read by the home, the menu, the profile, the questions and the editor: the pre-commit run was a full default run, 394 of 394, and the 1408 unit tests of the four directories are green. |
| WCAG A and AA; keyboard and screen reader | The Edit link is an anchor named by its text after the main button (the fixture asserts tag, name and order); `cand-nominations` and `no-nomination-nominations-empty` pass axe in both themes. **No scan of J5, J6, the third note sentence or the requested row** (177-20). No screen reader was run. |
| Developers' and Publishers' Guides | Not updated; 177-21. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before every commit, read from its exit file; no history and no ids in a comment or a title. |
| Clean history; no fixes of itself | Three commits. The third corrects a helper of the first (*Deviations*, 5): the test file is in both. |
| Formatting changes apart | The view's three spacing classes are in the feat commit, with the markup they belong to. |
| `[db]` | No schema, migration or type change. |

## The components skill's re-check list

| Item | Outcome |
|---|---|
| 1. docstring, type file, barrel | No library component was added, removed, renamed or moved. The view is a route page; its `@component` block is rewritten. |
| 2. `generate:docs` | Not run: the generated listing covers the three library directories, and none changed. |
| 3. `validate:links` | Not run; no doc was changed and the plan's gate rows do not include `docs-links`. |
| 4. the skill itself | Read against the change: nothing in `SKILL.md` is made false. `context-reactivity.md` was not read whole. |
| 5. drift and link audits | Not run: the skill's files were not touched. |

## Prohibitions

- **PROH-177-52** (no Edit outside the one state; never two support buttons): the view's state table in the component test, the planted "Edit wherever listed" (6 red), `expectNoEditAction` and `expectSupportButtons` in seven browser tests. Explicit.
- **PROH-177-53** (the home asks nothing of elections; no message of the home changes; `taskLabelKey` untouched): Task 2's verify stages on the seven catalogues and on the function's text, both passed; the J5 test shows the home leading to the editor's entry and the guard answering. Explicit.
- **PROH-177-54** (`taskState.ts` imports nothing; no page writes the condition out): Task 2's verify stage; the context asks `nominationsEditableOf`, the view reads `facts.editable`. Explicit.
- **PROH-177-55** (a stored answer is never deleted, shown, asked or counted): no write to answers was added; the second `follow:` test reads the answer back after the nomination returns. Explicit.
- **PROH-177-56** (no assertion weakened): the table of changed tests. Judgment.

## Threat Flags

None beyond the plan's register. The view reads the page's data in a derived; no load was changed and none reads a URL or a route.

## Sentences the work made false, reported and not edited

- `apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md`: the task table's row "`nomination` … Its page: The nominations view … `ContestantAppNominations`"; "`nominationsViewTarget(state)` — The first incomplete task's page, or the entity's home for an entity with no nomination and when nothing is left"; "`profileSaveTarget`, `questionSaveTarget` and `nominationsViewTarget` return the target together with whether it `continues`" (the last also returns an `action`); § *The nominations view*: "Nothing in the view can be edited", "**With none** it says that no nomination is defined and offers a way to contact support", "**While `access.nominationsLocked` is on** a note…" (the answers lock shows one too); § *The note*: "Its `reason` property selects the sentence: `'answersLocked'` or `'nominationsLocked'`" and "the nominations view while nominations are locked".
- `apps/docs/…/contestant-app/pre-registration-and-invitation/+page.md`: "The app has no page on which a user adds a nomination" — false since 177-15, and now linked from the home.
- `apps/docs/…/configuration/app-settings/+page.md`, § *The nominations lock*, "In the frontend": still true as far as it goes; it does not say that the lock closes the editor, that the home's first task then leads to the view, or that the answers lock does the same with a note of its own.
- `177-DISPATCH.md`, *After 177-18*: "`perm-contestant-nominations` holds 32 tests" — 47; "Predecessor full run: … `177-18-close`" — `177-19-close`, 394 of 394; "Frontend unit: 4181 passed" — 4228; "The nominations view shows its note under the nominations lock only" — under either. *After 177-16*: "Plan 177-19 … will meet this" — it did not: its control held one spec uncommitted.
- `177-19-PLAN.md`: `files_modified` lacks `nominationDraft.ts`, `contestantNominationsPage.fixture.ts` and `contestantQuestionsOverviewPage.fixture.ts`; "the home's page changes by one attribute" — and two sentences of its docstring; `<the_states>` has no row for data without facts.
- `177-UI-SPEC.md` S2: the markup shows no `role="list"`; the note is described "while not editable" where the page reads the two locks; the six states have no row for data without facts. § *Locator Contract*: "those under the lock keep `'return'`, the others assert `'define'`" — the nominated candidate's `return` with nothing left stays too.
- `177-18-SUMMARY.md`: "The nominations view shows no note under the answers lock alone. `closing:` therefore asserts none."
- `.planning/todos/pending/2026-10-09-176-list-semantics-…md`: closed; its sentence on the compiler's warning.
- The frontend's unit count and the nominations project's test count wherever they are stated.

## What should go into the files I did not edit

- **`STATE.md`**: plan 177-19 complete at `8f6db36bc`; the decisions of the frontmatter; the predecessor full run is `177-19-close` (394 of 394, 116 projects); frontend unit 4228 passed, 30 skipped.
- **`ROADMAP.md`**: Phase 177, 19 of 21 plans done; criteria 4 and 5 are seen in a browser by the two `follow:` tests.
- **`REQUIREMENTS.md`**: NOM-06 and NOM-08 are built and observed end to end with this plan (`requirements-completed` above). Whether to tick them now or at 177-21 is the orchestrator's.
- **`177-DISPATCH.md`**, a section *After 177-19*: the four corrections above; `nominationsEditable` is optional; the view decides the entry from the facts and the reason from the context; `data-empty` has no value where the data holds no facts; the steps that reach each state (the table above); the scans still missing.
- **`177-21-INPUTS.md`**: the items of *For plan 177-21*.

## Not done, or not observed

- The assertions after the first read of each `nominations-view:` test, red in a browser.
- The `holds:` tests red, by design; the changed tests of the two other specs red (ruling 6).
- The six states with scripts off.
- The view with no facts in its data, in a browser: not reachable with a dataset of the suite.
- The frame between the load's rerun and the context's settings.
- Axe, width and keyboard walk of J5, J6, the answers-lock note, the requested row and the Edit link at phone widths (177-20). What a screen reader announces. WebKit.
- A party under an alliance on the view.
- `clearWrittenNominations` of the no-nomination dataset with a row to clear.
- `generate:docs`, `validate:links`, the skill audits.
- `.claude/skills/components/context-reactivity.md` was not read whole.
- `gsd_run windows append` was not run, and `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not updated, as the dispatch rules.

## The state the local stack is left in

No database gate was run and the database was not reset by this plan. It is as the closing run's teardowns left it: every `e2e-perm-` and `test-` dataset removed, both locks off and every election type restored (*inferred* from the run's green tests and teardown projects; not queried). No dev server is running: ports 5173 and 5273 have no listener (*measured*). Docker VM 16.24 GiB free (*measured*). `git status --short` before this file: `?? CAND-APP-PLAN.md`.

## Known Stubs

None added and none left: the editor is now linked from the home and from the view.

## Evidence (gitignored)

- `tests/e2e-runs/177-e2e/177-19-control`, `177-19-precommit`, `177-19-close`, with the kept copies beside the first two.
- `tests/e2e-runs/177-gates/177-19-close`.
- `tests/e2e-runs/177-unit/177-19-*`: the three verify scripts with log, exit and head; the two red runs and the two green ones of the four test files; the five planted-defect reports; the launch, evidence and verdict logs with their exit files; the check, lint, type-check, unit, scan-wiring and Prettier logs with theirs; `177-19-held-files.tsv`; `177-19-commit-1.sh` to `177-19-commit-3.sh`.

## Self-Check: PASSED

The three commits are ancestors of `HEAD`; the nineteen modified files exist; the three E2E run directories and the gate directory exist with their `ended` or `done` markers.
