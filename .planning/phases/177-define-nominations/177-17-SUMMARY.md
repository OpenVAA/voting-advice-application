---
phase: 177-define-nominations
plan: 17
subsystem: frontend-routes
tags: [nomination-editor, existing-nominations, prefill, kept-section, moved-card, removed-card, guard, set-entity-nominations, pgtap, e2e]
status: complete
requires:
  - "177-16: the constituency step's sentence, constituenciesStoodFor, the full run 177-16-close (357 of 357, 116 projects), the gate run 177-16-close"
  - "177-15: the three editor routes, stepSelection.ts, the guard with its tracer condition, the details page as a tracer"
  - "177-14: buildCards, parentChoicesOf, somethingToWrite, validateCards, desiredSetOf as built"
  - "177-11: the editor's fixture and its test ids"
  - "177-10: the dataset perm-contestant-nominations, its four sessions and its state steps"
  - "177-07: set_entity_nominations and its pgTAP file"
  - "177-01: 177-gates.sh, 177-e2e.sh, 177-verdict.mjs"
provides:
  - "editorFacts.ts: startingSelectionOf(nominations), constituencyChoiceOf({ chosenElectionIds, nominations }); types NominationContestFacts, StartingElection, ConstituencyChoice"
  - "(edit)/+layout.ts serves an entity with a nomination in the editor's reach"
  - "stepSelection.ts: StepFacts.nominations, reachedNominationsOf, electionsStepSelection, constituenciesStepChoice, ConstituencyStepChoice, DetailsStepContests, IdentifiedNomination; detailsAddressOutcome answers { contests, keptElectionIds }"
  - "page data: elections `nominationSelection` (the starting selection); constituencies `nominationSelection` + `nominationConstituencyChoice { toChoose, kept, onArrival }`; details `nominationContests` + `nominationKeptElectionIds`"
  - "rendered test ids: contestant-nomination-constituencies-kept; on a card nomination-editor-state, -confirmed-note, -previous-constituency, -remove, -keep, -removed-note; data-card-state kept|new|removed, data-confirmed, data-moved"
  - "set_entity_nominations states `confirmed` in every UPDATE that writes the custom data: a confirmed nomination can be given a typed party name [db]"
  - "addNomination's options take an optional electionRound"
  - "component test (edit)/details/page.svelte.test.ts (18 cases); new cases in constituencies/page.svelte.test.ts, layout.tracking.test.ts, stepLoads.test.ts, editorFacts.test.ts; two pgTAP assertions in 43-set-entity-nominations.test.sql"
  - "fourteen E2E tests in contestant-nominations.spec.ts: one define:, ten edit:, three remove:, all @nomination-definition"
  - "runs: 177-e2e/177-17-control (13 red, each on its expectation), 177-e2e/177-17-precommit (red in one test: the database refused the save), 177-e2e/177-17-precommit-r2 (297 of 297), 177-gates/177-17-pgtap-red-r2, 177-gates/177-17-db, 177-gates/177-17-db-r2, 177-gates/177-17-close, 177-e2e/177-17-close (371 of 371, 116 projects)"
affects: [177-18, 177-19, 177-20, 177-21]
tech-stack:
  added: []
  patterns:
    - "a step's load answers what the page starts from — the chosen elections, the constituency to select per election — so the page seats its starting state at init and needs no effect that copies it once the data root arrives"
    - "a component test's page data is what the step's real load answers for the same world, so the test cannot drift from the load"
    - "a held, uncommitted change is set aside through byte-equal kept copies and a manifest when a clean tree is needed for a database gate, and copied back afterwards"
key-files:
  created:
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/page.svelte.test.ts"
  modified:
    - apps/frontend/src/lib/contestant/nominations/editorFacts.ts
    - apps/frontend/src/lib/contestant/nominations/editorFacts.test.ts
    - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/+layout.ts"
    - "…/(edit)/layout.tracking.test.ts"
    - "…/(edit)/stepSelection.ts"
    - "…/(edit)/stepLoads.test.ts"
    - "…/(edit)/elections/+page.ts"
    - "…/(edit)/elections/+page.svelte"
    - "…/(edit)/constituencies/+page.ts"
    - "…/(edit)/constituencies/+page.svelte"
    - "…/(edit)/constituencies/page.svelte.test.ts"
    - "…/(edit)/details/+page.ts"
    - "…/(edit)/details/+page.svelte"
    - tests/tests/fixtures/contestant/perm-contestant-nominations.ts
    - tests/tests/specs/perm/contestant-nominations.spec.ts
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/43-set-entity-nominations.test.sql
decisions:
  - "the constituency of a stored nomination is resolved by the constituency step's load, per election, and never put into the address by the election step: an address holds one flat list of constituencies, and two elections that share their constituencies would each be given the first of them"
  - "the starting selection is a list of { electionId, constituencyId? }, one entry per election, so that a stored constituency stays tied to its own election"
  - "while a constituency group is chosen first the constituency step keeps no election: its one selector stands for every admissible election, and a nomination in an election that is not held in the chosen constituency starts as about to be removed on the details step"
  - "the cards are built before the parent options are read, and the options are asked for the contests of every card, a removed and a moved one included"
  - "no card is built while the entity's nominations or the facts of them are not known: a set written from cards that leave a stored nomination out would delete it"
  - "the database defect the first pre-commit run found is corrected in the phase's own write function, not in the older confirmation trigger: the function states the confirmation in the statements that write the custom data"
  - "Keep is described by the line that says the nomination will be removed, beside the line's status role"
requirements-completed: []
metrics:
  started: "2026-10-11T08:11:40Z"
  completed: "2026-10-11T09:25Z"
  duration: "about 75 minutes, of which about 45 are four E2E runs and five gate runs"
  tasks: 3
  files: 19
actuals:
  tokens: 58262 # chars/4 over git diff 4f1ef8002..b21d16eae outside .planning (233,048 characters)
  tasks: 3
  commits: 5 # git rev-list --count 4f1ef8002..b21d16eae
plan_head_before: 4f1ef80022767cd1a1ab9ff2778d5070d70b2000
plan_head_after: b21d16eae089803e954ad119f8e3bda33973aacf
---

# Phase 177 Plan 17: Existing Nominations in the Editor — the Guard Opened, the Selection Prefilled, Existing, Moved and Removed Cards — Summary

An entity that already holds nominations now opens the editor and loses nothing by it. The guard's tracer condition is gone; the election step starts with the elections the entity is nominated in checked, the constituency step with the stored constituency selected, and an election in which the entity holds several nominations has a section in a selector's place. Every nomination in the editor's reach has a card on the details step whatever the selection chose: kept, moved with its previous constituency named, or about to be removed with Keep beside it. A set as stored writes nothing. Fourteen browser tests hold it, thirteen of which were red while the guard turned such an entity away.

`requirements-completed` is empty on purpose: NOM-04 to NOM-06 are built for existing nominations here and are not complete until the refusals are named (177-18) and the editor is linked (177-19). `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not touched.

## Read this first

- **Green end to end.** Full run `177-17-close`: 371 of 371, 116 projects, per-project equal to `177-16-close` but for the fourteen new tests. Twelve gate rows green. No test was retried, no axe finding, no overflow.
- **A defect of the database was found by the first pre-commit run and corrected, with two commits tagged `[db]` beyond the plan's two.** A confirmed nomination could not be given a typed party name: `set_entity_nominations` was refused whole (`P0001`, HTTP 400) by rule 1 of `enforce_nomination_confirmation`, which reads the row as still confirmed because the trigger turns an edited row's confirmation off only after that rule. The editor reaches this as soon as it serves an entity whose nomination an administrator confirmed, which is this plan's change. Reproduced in isolation by two pgTAP assertions committed red and alone; corrected in the write function, which now states `confirmed` beside the custom data. *Deviations*, 1. **This reopens the schema block that 177-07 closed**: one function body, no signature, no type, no policy.
- **The pre-commit run was made twice.** `177-17-precommit` is red in one test, `edit: a candidate replaces its party with a typed name…`, on that refusal. `177-17-precommit-r2`, on the same held files (each byte-equal to the first run's kept copy) over the corrected function: 297 of 297. The second run is not a retry: the cause of the first was found, isolated and fixed between them.
- **The control is as the plan writes it, in one run.** `177-17-control`: exactly the thirteen `edit:` and `remove:` tests red, each on `expect(locator).toBeVisible()` at the step that expects the election step; the new `define:` test and 283 others green. The tracer needed no correction.
- **The held change was set aside once and restored.** The database rows need a clean tree, so the fifteen held files were copied beside the pre-commit run (`177-17-precommit.*.kept`, manifest `177-unit/177-17-held-files.tsv`, each `cmp`-equal), discarded by the plan's resume rule, and copied back after the database commits, each `cmp`-equal again.
- **One file beyond the plan's list on the frontend**: `(edit)/stepSelection.ts`, which the three loads and the two selection pages already decide through. *Deviations*, 2.
- **Task 2's verify exits 2 as written and 0 in its corrected form** — the known `--dirty-only` defect, the label of the second pre-commit run, and `stepSelection.ts`. Tasks 1 and 3 exit 0 as written.
- **The kept section and everything of the start-from-constituency mode with existing nominations are held by unit and component cases alone**, as the plan's ruling 7 says of the first.
- **The host's lid was closed during every run** (`Entering DarkWake state due to 'Clamshell Sleep'` throughout the window). No run carries the void marker, and no run's output holds `server connection lost`. The one red run that was not a control is red on the database's refusal, read from the test's trace.

## Task Commits

| # | Commit | What |
|---|---|---|
| 1 | `dbd9f10af` | `test(177-17)`: `addNomination`'s options take an optional election round; no committed spec passed it |
| 2 | `d44b1cfdb` | `test(177-17)`: two pgTAP assertions for a typed name on a confirmed nomination, red and alone |
| 2 | `b5f455957` | `fix[db](177-17)`: `set_entity_nominations` states the confirmation beside the custom data; the migration regenerated |
| 1, 2 | `b8faa7a03` | `feat(177-17)`: the spec's fourteen tests and every application file, one commit, after the control and the green pre-commit run |
| 2 | `b21d16eae` | `docs[db](177-17)`: two comment sentences of the write function; the migration regenerated |
| 3 | — | runs only |

`d44b1cfdb` was amended once, minutes after it was made and before anything stood on it: its first assertion was a `lives_ok` around a helper that catches what the function raises, so it passed whatever happened. The red run of that form is kept as `177-unit/177-17-pgtap-red-vacuous.log`.

## Each task's verify command, with its real exit status

Each block was written byte for byte from the plan to `tests/e2e-runs/177-unit/177-17-t<N>-verify.sh` and run with `bash`; log, exit and head are beside it.

| Task | As written | Corrected | Head |
|---|---|---|---|
| 1 | **0** | — | `dbd9f10af`, the spec uncommitted |
| 2 | **2** — every stage before the verdict passed; the verdict refuses several paths after one `--dirty-only` | **0** (`177-17-t2-verify-corrected.sh`) | `b21d16eae` |
| 3 | **0** | — | `b21d16eae` |

The corrected form of Task 2 differs in the verdict's arguments alone: one path per `--dirty-only`, `stepSelection.ts` among them, and the label `177-17-precommit-r2`. Its two `grep` stages for `startingSelectionOf` in the entry load and `constituencyChoiceOf` in the constituency load pass on the loads' docstrings, as 177-15's did: the calls are one hop away in `stepSelection.ts`, where the same two searches pass on real calls.

## Task 1 — the fourteen tests, and the control

`addNomination` took no round before this plan; `AddedNomination.electionRound` is new and optional.

Every new test begins with `setNominationsLocked(false)`, `setAnswersLocked(false)` and the state steps of what it reads, opens the editor by its entry address, asserts the step shown before it presses anything there, holds no locator, and ends with `expectNoDialog`. A test whose save leads on states the entity's answers too, so that the next task is the profile. One helper of the spec, `continueToDetails`, walks the three steps with what each shows on arrival.

| Test | What it asserts beyond its title |
|---|---|
| `define: a candidate names a party that is not nominated at its pair…` | the hint under the long-named party; after the save the candidate's row under that party and **the party's own new row, unconfirmed**, both read from the database |
| `edit: an entity with nominations starts from them` | both elections checked, no hint, one picker with the northern region selected; two kept confirmed cards with the confirmed note, the status row, the stored symbol, "None" chosen and both alliances listed, the unconfirmed one included |
| `edit: saving an untouched set…` | the press leads to the profile; the two rows as seeded in the database and on the view |
| `edit: a changed symbol…` | the changed row pending, the other still confirmed |
| `edit: a party names an alliance…` | no hint on the alliance nominated there, a hint on the unconfirmed one; the alliance's new row in the database |
| `edit: several nominations in one election…` | Continue of the election step leads straight to the cards; three cards in the elections' order, each with its own status, note and symbol; a symbol changed on one is stored on that one alone |
| `edit: a candidate replaces its party with a typed name…` | the stored party chosen on arrival; "Other" reached with three arrow presses with focus on its radio; Tab then puts focus in the name field; the name stored and the parent unlinked; reopened, "Other" with the name and status pending; a listed party chosen hides the field and removes the name; reopened, that party chosen |
| `edit: a changed constituency moves…` | north selected on arrival; one moved card with the previous-constituency line, the confirmed note, the stored symbol and party, and the hint that the party is not nominated at the new constituency; one row afterwards, with no external id, pending |
| `edit: a party that is no longer listed…` | the unlisted option first, chosen, with its line as the radio's description; the link kept by a save that changes the symbol |
| `edit: two nominations at one contest…` | no constituency step; the error under the second card's group, focus on its first radio, the region `invalid`, both rows unchanged |
| `edit: a nomination outside the editor's reach…` | the election of the other round offered and unchecked, the election that no longer admits a candidate not offered; one card; after the save both other rows as they were, one of them still confirmed |
| `remove: a removed card says so, can be kept…` | no field on the removed card, focus on Keep, nothing written; Keep restores the typed symbol with focus on Remove; removed again, one row left |
| `remove: unchecking an election…` | the card removed, the database unchanged, Keep restores it |
| `remove: removing every nomination…` | the card still shown; the home with the nomination task incomplete and the others blocked; no row |

**The control** — `tests/e2e-runs/177-e2e/177-17-control`, head `dbd9f10af`, only the spec uncommitted, wrapper status 1, 08:15:34Z to 08:25:48Z, no void marker: 297 tests, **284 passed, 13 failed, 0 did not run**. `177-verdict control 177-17-control … --red "edit:" --red "remove:"`: **PASS** — *13 test(s) named by 'edit:', 'remove:'; 284 other test(s)*. The spec as the control ran it is `177-17-control.contestant-nominations.spec.ts.kept`.

## Task 2 — the implementation

### The two functions, as written

```ts
export type NominationContestFacts = { electionId: Id; constituencyId: Id };
export type StartingElection = { electionId: Id; constituencyId?: Id };
export type ConstituencyChoice = { toChoose: Array<Id>; kept: Array<Id> };

export function startingSelectionOf(nominations: ReadonlyArray<NominationContestFacts>): Array<StartingElection>;
export function constituencyChoiceOf(args: {
  chosenElectionIds: ReadonlyArray<Id>;
  nominations: ReadonlyArray<NominationContestFacts>;
}): ConstituencyChoice;
```

`startingSelectionOf` answers one entry per election, in the order the elections are first met, with the constituency only where the entity holds exactly one nomination there. `constituencyChoiceOf` puts each chosen id, once, into `kept` where the entity holds several nominations in the election and into `toChoose` otherwise. Both take the nominations in reach and return fresh objects; both are exported from the barrel.

### What each load returns

| Load | Returns |
|---|---|
| elections (the entry) | `nominationSelection`: the address's elections and constituencies; where the address names no election, the elections of `startingSelectionOf` over the nominations in reach, with the address's constituencies |
| constituencies | `nominationSelection` (every chosen election, a kept one included, and the address's constituencies) and `nominationConstituencyChoice { toChoose, kept, onArrival }`: the elections the selector is handed, the elections with a section, and by election the constituency to select on arrival — the address's, else that of the entity's one nomination there |
| details | `nominationContests` (one pair for each chosen election that takes a constituency) and `nominationKeptElectionIds` |

- **The constituency address** forwards to the details address when every chosen election is kept, and asks the ordering module about the others alone otherwise. While a constituency group is chosen first it is served whatever is chosen, hands the selector every admissible election and keeps none.
- **The details address** accepts a chosen election with no constituency where the entity holds several nominations in it, and forwards to the constituency step for any other election that lacks one.
- **The nominations in reach** reach a load as `parentData.contestantUserData.nominations` filtered by the facts' ids (`reachedNominationsOf`), which is also how the election page and the details page read them from `contestantCtx.nominations`. No load and no page counts nominations.

### The guard

The third disjunct of the one `if`, item 5 of the docstring and the third entry of `TURNED_AWAY` are gone. `layout.tracking.test.ts` now serves two kinds of entity on each of the six addresses — with no nomination, and with a nomination in reach — and still turns away under a lock, with no admissible election, and under a lock with a nomination. Its three negative controls are unchanged.

### The pages

- **Elections.** Checked on arrival is `data.nominationSelection.electionIds`. Continue hands `afterElections` the nominations in reach; an election with several nominations is left out of the constituency question.
- **Constituencies.** The selector is handed the load's `toChoose`; `selected` starts as a copy of `onArrival`, at init, so the effect that seated the address's constituencies once is gone. After the selector, one `<section data-testid="contestant-nomination-constituencies-kept">` per kept election with an `<h3>` and the `severalKept` sentence.
- **Details.** Below.

### Where the details page keeps a card's draft, and how Remove and Keep hand focus over

- `cards` is deep `$state`: the draft is four members of each card — `state`, `electionSymbol`, `parentChoice`, `otherName`. A removed card keeps the other three, so Keep shows what was typed.
- **`builtOn`** (`$state.raw`) is the list of the entity's nominations in reach the cards were built on. The unlisted option's name is read from it.
- One effect builds the cards and then asks for the options. It waits for the entity's type, `contestantCtx.nominations`, `data.nominationFacts` and an admissible election, and returns at once when `builtFor` equals the selection's key, so a rerun of the loads for the same address rebuilds nothing. The key is the contests and the kept elections of the address.
- `buildCards` is handed the address's contests plus, for each kept election, a pair naming the constituency of the first stored nomination there: that is what makes its cards `kept` rather than `removed`, and a card of such an election stays in its own constituency whichever is named.
- `removeCard(card)` sets `card.state = 'removed'`, `keepCard(card)` sets `'kept'`; each then awaits one `tick()` and focuses the button that took the pressed one's place, found by the card's index in the list (`focusInCard`, which `focusError` now shares). Neither calls the context.
- A removed card renders its heading, its constituency, its status row, a `Warning` with `role="status"` holding `removedConfirmedNote` or `removedNote`, and Keep, which is `aria-describedby` that line. No field is rendered.
- The handler's new branch stands after validation and before the write: with `somethingToWrite(cards)` false it calls no write and no `invalidateAll`, and goes to `nominationsSaveTarget(contestantCtx.taskState).route`, which is the entity's home while the state is not known.

### Unit and component tests, red first

Red on the tracer's pages with skeletons of the two functions that answer nothing — `177-unit/177-17-pages-red.{log,exit,head,json}`, exit 1, head `dbd9f10af`: **55 failed, 97 passed** over five files. 46 failures are `AssertionError`s; the other nine are the load under test rejecting with its redirect — six where the guard turns an entity with a nomination away, three where the details load forwards a kept election to the constituency step. No file failed to load and nothing timed out.

Green: **152 of 152** in the same five files (`177-17-pages-green.log`). The directories of the verify: 48 files, 1084 tests. `yarn workspace @openvaa/frontend check`: 0 errors, 0 warnings. Lint, the tests' type check, the unit-coverage guard and comment hygiene: 0, each read from its exit file.

- `editorFacts.test.ts`: six cases of `startingSelectionOf`, five of `constituencyChoiceOf`.
- `stepLoads.test.ts`: five entry cases, nine constituency cases, five details cases and two Continue cases for an entity with nominations; a fifth election, `county`, shares the regions with `regional` so that one case shows each election starting from its own stored constituency.
- `constituencies/page.svelte.test.ts`: the page's data is now what the step's real load answers; five new cases — the stored constituency selected and passed on, the address's in its place, the kept section beside a selector, no section for one nomination, and the mode.
- `details/page.svelte.test.ts`, new, 18 cases with the context's two nomination functions as spies: which cards there are (kept, removed by an unchecked election, moved, several in one election with the options asked for every card's contest, out of reach, none while the nominations are not known, the draft kept through a re-read); what a card shows (status, the two notes, a stored parent that is not listed as text with markup in its name, a stored typed name with markup as the field's value); Remove and Keep; the main button (no write and the target for a set as stored, the home while the state is not known, one write with every card that is not removed, a removed card neither checked nor written, an empty set when all are removed).

No planted defect was run against these beyond the red-first run.

### The pre-commit runs

- **`177-17-precommit`** — head `dbd9f10af`, the fifteen files uncommitted, wrapper status 1, 08:37:49Z to 08:46:24Z: 297 tests, **296 passed, 1 failed**. The failure: `expect(page).toHaveURL(…/profile)` after the first save of `edit: a candidate replaces its party with a typed name…`; the page stayed on the details step with the failed-save message. From the test's trace: the `set_entity_nominations` request answered 400, and the page logged *Nomination … cannot be confirmed while custom_data carries "requestedParentOrganization"*. Kept, with its fifteen copies.
- **`177-17-precommit-r2`** — head `b5f455957`, the same fifteen files, wrapper status 0, 08:54:29Z to 09:03:03Z: **297 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run**; `perm-contestant-nominations` 24 of 24. `177-verdict control 177-17-precommit-r2 … --green --were-red-in 177-17-control`: **PASS**, *was red, now passed* for all thirteen. A copy of each file is kept as `177-17-precommit-r2.*.kept`, each byte-equal to the tree at the commit.

## Task 3 — the gate rows and the full run

**Gate rows** — all on head `b21d16eae`:

| Run | Row | Status | Seconds |
|---|---|---|---|
| `177-17-db-r2` | db-reset | 0 | 31 |
| | types-regen | 0 | 2 |
| | types-clean | 0 | 0 |
| | pgtap | 0 | 6 |
| | sql-lint | 0 | 3 |
| | integration | 0 | 5 |
| `177-17-close` | typecheck | 0 | 21 |
| | lint | 0 | 47 |
| | unit | 0 | 71 |
| | check-frontend | 0 | 9 |
| | build | 0 | 16 |
| | format | 0 | 19 |

`177-verdict gates` on each: **PASS**, not stale. pgTAP: `Files=44, Tests=2312` (2310 before; file 43 plans 130). Unit totals: frontend **4139 passed and 30 skipped** (4078 in `177-16-close`), dev-seed 1050, data 318, supabase 462, app-shared 148. Before them, on head `b5f455957`: `177-17-db` (db-reset, types-regen, types-clean, pgtap, sql-lint), all 0, PASS.

**The full run** — `tests/e2e-runs/177-e2e/177-17-close`, head `b21d16eae`, `bash 177-e2e.sh 177-17-close --require-project perm-contestant-nominations --require-project perm-startfromcg`, status 0:

- Docker VM 16.95 GiB free before it (the driver's record), 16.89 after. AC power, 100 %. 09:08:16Z to 09:18:07Z. No void marker.
- **371 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 116 projects.**
- Verdict as the plan writes it — `--same-projects-as 177-16-close --except perm-contestant-nominations=14 --expect-title-count "…::edit:=10" --expect-title-count "…::remove:=3" --expect-title-count "…::define:=2"` — **PASS**: `per project: 116 compared, 0 not as expected`.
- **Per project against `177-16-close`:** 115 equal; `perm-contestant-nominations` 24 against 10. 357 + 14 = 371.

## For plans 177-18 to 177-20

### For 177-18 — the handler, and what the cards were built on

All in `(edit)/details/+page.svelte`, `handleSubmit`, in this order:

1. `validateCards(cards, choicesByKey)`; on an error the region says `invalid` and the handler returns.
2. `if (!somethingToWrite(cards))` → `goto(getRoute.current(nominationsSaveTarget(contestantCtx.taskState).route))`, return. No write, no `invalidateAll`.
3. `saving = true`; **the write**: `contestantCtx.setEntityNominations(desiredSetOf(cards))`, the page's one call, inside a chain whose rejection is logged and read as `undefined`.
4. **`invalidateAll()`**, whatever the outcome.
5. On `result?.type === 'saved'`: one `tick()`, then **the target**: `goto(getRoute.current(nominationsSaveTarget(contestantCtx.taskState).route))`.
6. Otherwise `saveMessage = { outcome: 'failed', … }`, `saving = false`, focus back on the main button.

- **`builtOn`** is the name of the nominations the cards were built on: the entity's nominations in reach, as read when the cards were built. `sameNominations(builtOn, reachedNominationsOf(contestantCtx.nominations, data.nominationFacts))` is the comparison a "changed" outcome needs.
- **To show stored state after a refusal**, clear `builtFor` before `invalidateAll()`: it is a plain variable, so clearing it triggers nothing by itself, but the build effect reads `contestantCtx.nominations` and `data.nominationFacts`, both new objects after the rerun, and then rebuilds the cards and asks for the options again.
- **The page stays mounted through the rerun now** — the guard no longer redirects an entity with a nomination. *Inferred from every saving test ending on its target; the mounted page between the rerun and the navigation was not observed.*
- **A stored save can make the details load's rerun forward.** Removing one of two nominations in an election with several constituencies leaves that election with one nomination: it is no longer kept, the address names no constituency for it, and the rerun redirects to the constituency step before the handler navigates on to its target. A check that "the page is still shown" before that navigation (P-17) would leave the user on the constituency step after a save that was stored. *Read from the load and the handler; no test removes one of several.*
- **The main button's label and action are still the tracer's one row**, also on a set with nothing to write and on one with every card removed. The refusals — `hasCandidates`, `tooManyPending`, the lock — still read `failed`. `nom-or-edit-list-north` has a candidate under it and is the row to remove or move for the first of them; this plan's tests keep away from it.
- **`draftFactsOf(cards, hadNomination)`**: `hadNomination` is `builtOn.length > 0`.

### What exists for every later plan

- The details page for a party, in a browser: "None" chosen, both alliances, the hint on one not nominated at the pair, the alliance's nomination added by the save.
- "Other" in a browser: its field under its row, reached by Tab from its radio; the stored name on reopening; removed by choosing a listed party.
- The unlisted option in a browser, with its hint as the radio's description.
- `setEntityConfirmed` and `setElectionType` are safe to flip inside a `try` with these tests' `finally` order: written nominations cleared first, then the entity's seeded state, then the flip put back.
- A nomination a state step adds for a party sorts after the party's seeded rows on the view and in the cards, since it states no order.

### What each later plan must not assume

- **The kept section has been in no browser** (ruling 7), and neither has anything of the start-from-constituency mode for an entity with nominations: the prefill of the one selector, the elections checked after a constituency was chosen first, and a nomination that starts as removed because its election is not held in the chosen constituency. All are unit or component cases. The start-from-constituency dataset's contestant has no nomination and no step restores one.
- **Where two elections are combined into one selector** (a parent and a child election, as the voter's page shows them), the selector reads the child election's selection alone, so a stored constituency of the parent election preselects nothing there. *Read in `ConstituencySelector`; not tested.*
- **Which of the two removal lines a card shows is held by the component test alone.** The fixture's `expectNotes` reads the line's presence, not its wording; the browser tests assert the line, the card's `data-confirmed` and where focus is.
- **No axe scan, no width measurement and no keyboard walk** of an existing, moved or removed card, of Remove and Keep, or of the kept section (177-20). The removed line uses `Warning`'s own colour and its own numeric gap class, unchanged.
- **Whether a screen reader announces the removed line** is not known: it is a status inserted together with its content, and focus moves to Keep at the same moment. Keep is described by the line so that it is read with the button. Asserted: the role, the description's id. Observed: nothing.
- **The duplicate rule's error is asserted on the second card alone**; no step asserts that the first card shows none.
- **"Change the selection" carries what the address chose**, the kept elections included, and not the draft: a card kept by hand after its election was unchecked starts as removed again when the user returns that way.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] A confirmed nomination could not be given a typed party name**
- **Found during:** Task 2, the first pre-commit run.
- **Issue:** `enforce_nomination_confirmation` refuses, as its first rule, a row that is confirmed while its custom data carries a requested name, and turns an edited row's confirmation off only in its second. `set_entity_nominations` named only the columns that differ, so on a confirmed row the trigger saw `confirmed` still true beside the new name and raised. The pgTAP file of 177-07 gives a name only to rows an earlier save had already unconfirmed.
- **Confirmed in isolation:** `177-gates/177-17-pgtap-red-r2`, head `d44b1cfdb`: 2 of 2312 red, both in file 43 — the save answers `{"raised": "P0001", "message": "Nomination … cannot be confirmed while custom_data carries \"requestedParentOrganization\" (Party Z)…"}`, and the row is unchanged. Kept as `177-unit/177-17-pgtap-red.{log,exit,head}`.
- **Fix:** the four `UPDATE` statements of the function that write `custom_data` also set `confirmed = confirmed AND NOT COALESCE(v_target_custom ? c_requested, false)`: off where the custom data being written carries a requested name, as stored otherwise. It can never turn the flag on. For an entity's editor the trigger turns it off anyway; for a caller who may confirm, a row keeps its confirmation unless it is given a name, which no caller may confirm.
- **Not changed:** the trigger. A direct `UPDATE` by an entity's editor that adds the key to a confirmed row is still refused by rule 1. Nothing in the application makes that statement; whether the trigger's two rules should change places is a question for the operator, and a candidate for 177-21's list.
- **Files:** `schema/503-entity-rpcs.sql`, `migrations/00001_initial_schema.sql`, `tests/database/43-set-entity-nominations.test.sql` · **Commits:** `d44b1cfdb`, `b5f455957`, `b21d16eae`
- **Process:** `Skill("database")` loaded first; the assertions committed red and alone; the migration regenerated in each schema commit and the parity guard 0; the generated types unchanged (`types-clean` 0); every database row through the gate driver on a clean tree.

### Other deviations

2. **`stepSelection.ts` joined the changed files.** The plan lays the new rules out in the three loads and the election page; on the tree those four already decide through this module, and writing the rules into each would have stated them four times. The two functions are called there and nowhere else.
3. **The election step's Continue carries the address's constituencies and not those of the stored nominations.** The plan's step 5 has it carry the stored ones "for the elections still chosen". The constituency step's load selects the stored constituency instead, for its own election, so the same thing is selected on arrival and two elections that share their constituencies each start from their own; a flat list in the address cannot say which constituency is whose. The entry's `nominationSelection.constituencyIds` is therefore the address's alone.
4. **`startingSelectionOf` answers a list of entries by election**, where the plan's sentence reads as a selection of two flat lists, for the same reason.
5. **The constituency page seats its starting selection at init** from the load's answer; the effect that did it once the data root arrived is removed.
6. **The cards are built before the options are read**, where the tracer read first: the options are asked for the contests of every card, which are not known before the cards are.
7. **Keep is `aria-describedby` the removed line**, beyond the contract's markup.
8. **The previous-constituency line is a second `<dd>`** of the constituency's `<dt>`, so the list holds only terms and descriptions; the contract leaves its element open.
9. **The handler's branch for nothing to write stands after validation.** A stored nomination that is itself unfinished — a candidate with neither party nor name in a closed-list election — therefore stops Continue with the error at its group until it is finished or removed, on a set nobody changed.
10. **The spec defines four external ids and one helper of its own** (`continueToDetails`); the data module was not touched.
11. **The commit ledger was written before the first commit**; `plan_head_before` is read from it.

## How the plan's truths stand

Built and observed in a browser: the editor served to an entity with nominations; the prefilled elections and constituency; a card per nomination in reach with status, notes, symbol and parent; an untouched set leaving both rows confirmed; a changed symbol unconfirming one row; the not-nominated hint and the added parent nomination for a candidate and for a party; the keyboard in the parent group; "Other" stored, reopened and replaced; a moved card and its save; the unlisted parent kept by a save; several nominations in one election kept; the duplicate rule on the page; rows out of reach with no card and unchanged; Remove, Keep, focus, the deferred removal; an unchecked election's card; every card removed and the home's first task open again.

Built and held by a unit or component test alone: the kept section; that an untouched set and Remove call no write (ruling 9); which removal line is shown; a name with markup as text; the mode with existing nominations; no card before the nominations are known; the stored constituency per election for shared constituencies.

Built in the database and held by pgTAP: a typed name on a confirmed nomination.

## The components skill's re-check list

| Item | Outcome |
|---|---|
| 1. docstring, type file, barrel | No component was added, removed, renamed or moved; the three files changed are pages, each with its `@component` block brought up to date. |
| 2. `generate:docs` | Not run: the generated listing covers components, and none changed. |
| 3. `validate:links` | Not run by itself; the plan's gate rows do not include `docs-links`, and no doc was changed. |
| 4. the skill itself | Read against the change: nothing in `SKILL.md` is made false. The contestant context's `nominations` is read as `contestantCtx.nominations` in each scope, never destructured; `dataRoot` never through an alias. |
| 5. drift and link audits | Not run: the skill's files were not touched. |

## Code review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: fourteen browser tests, thirteen red before; the gaps are named above. |
| OWASP top 10 | T-177-70: every nomination in reach has a card and is in the desired set unless removed; no card is built before the nominations are known. T-177-71: a removed card says so with Keep beside it and nothing is written before the press. T-177-72: no call for an untouched set, as a spy sees it. T-177-73: the unlisted option sends `keep`. T-177-74: cards from the nominations in reach alone, and the database's reach behind them. T-177-75: names are text interpolations; two component cases with markup. T-177-76: one condition removed; the guard's other cases and controls stand. T-177-77: the duplicate reported before any write. The schema change lets a statement set `confirmed` to its own value or to false, never to true. |
| Code style guide; no `any` | Followed; none. Every helper is a function declaration. `as never` for the page's `data` prop and for the load's event in the two component tests. |
| No repeated code | `reachedNominationsOf` is the one filter of nominations by the facts. The spec repeats its state steps per test by the suite's rule. |
| New entities documented | TSDoc on every exported symbol and type; docstrings of the three loads and the three pages rewritten for what they now do. |
| Repo documentation updated | Not by this plan: see *Sentences the work made false*. |
| Tracking events | None added; no page of the entity tree sends one. |
| Svelte component guidelines | No component created. Runes only; reactive accessors read in their scope; no `view-transition-name`, no `<dialog>`, no confirmation component, no numeric spacing class in new markup, no branch on the entity's type. |
| Errors handled | Unchanged paths: a failed read of the options and a failed save each log and show the page's own message. |
| Failing checks | The first pre-commit run, diagnosed and fixed at its cause; two existing unit expectations of the details load updated for its new member. |
| Parts sharing dependencies not unduly affected | `ConstituencySelector`, `EntitySelector`, `selectionOrder.ts` and `nominationDraft.ts` are unchanged. The existing cases of `stepLoads.test.ts` pass with their expectations extended by the new members alone. The start-from-constituency spec's contestant describe is green in three runs. pgTAP 2310 earlier assertions green. |
| WCAG A and AA; keyboard and screen reader | Headings, list and article structure as before; the kept section headed at the selectors' level; focus handed between Remove and Keep; the removed line a status that describes Keep. **No axe scan and no width measurement of the new states** (177-20). |
| Developers' and Publishers' Guides | Not updated; 177-21. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before every commit, read from its exit file; no history and no ids in a comment or a title. |
| Clean history; no fixes of itself | Five commits. `b21d16eae` corrects two comment sentences of the function `b5f455957` changed: it is a fix of this plan's own commit, kept apart because a schema commit needs a clean tree and the application commit stood between them. |
| Formatting changes apart | None. |
| `[db]` | Both commits that change the schema carry it and hold the regenerated migration; the generated types did not change. The pgTAP commit changes no schema. |

## Prohibitions

- **PROH-177-44** (the selection never removes, moves or merges): `remove: unchecking an election…` reads the database unchanged with the removed card shown; `edit: several nominations…` and `edit: two nominations…` reach the cards with no constituency step and every row as stored. Explicit.
- **PROH-177-45** (Remove deletes nothing and opens no dialog; nothing before Continue): the component cases with the write as a spy; `remove: a removed card…` reads the database after Remove; `expectNoDialog` ends every test; the page holds no `<dialog>` and no confirmation component (Task 2's verify). Explicit.
- **PROH-177-46** (an unchanged card is never sent as changed): the component case for a set as stored; `edit: saving an untouched set…`; `edit: a changed symbol…` leaves the other row confirmed. Explicit.

## Threat Flags

None beyond the plan's register. The write function now names `confirmed` in four statements; the expression can keep the stored value or turn it off, and the trigger still refuses any caller without `nomination.confirm` who would turn it on.

## Sentences the work made false, reported and not edited

- `.claude/skills/database/SKILL.md` and `177-07-SUMMARY.md`: the pgTAP totals (`Files=44, Tests=2312`; file 43 plans 130), and "naming only the columns that differ" of the write function.
- `177-07-SUMMARY.md`, *For plan 177-09*: the table of what passes through has no row for the confirmation rule's `P0001` on a typed name, which the function no longer provokes for a confirmed row.
- `177-UI-SPEC.md` S4 and the plan's step 5: the election step's Continue does not carry stored constituencies (*Deviations*, 3). S6: Keep's description is not in the markup. S5: the kept section's classes.
- `177-15-SUMMARY.md`: *Known Stubs*, the guard's row, resolved; "A4 is false on this tree" no longer holds.
- `tests/playwright.config.ts`, any comment that counts the tests of `perm-contestant-nominations`: the project holds 24.

## Not done, or not verified

- The kept section, and the mode for an entity with nominations, in a browser.
- Axe scans, width measurements and a keyboard walk of the new states (177-20).
- What a screen reader announces on Remove and Keep.
- The redirect of the details load's rerun after a save that changes which elections are kept: read, not provoked.
- The mounted page between the rerun and the navigation after a stored save: inferred.
- The trigger's rule order for a direct `UPDATE`: reported, not changed.
- A planted defect against the new unit, component and pgTAP cases, beyond the red-first runs.
- `gsd_run windows append` was not run, and `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not updated, as the dispatch rules.

## The state the local stack is left in

The database was reset four times by the gate driver during this plan and is as the full run's teardowns left it afterwards: every `e2e-perm-` and `test-` dataset removed. No dev server is running; port 5173 has no listener. Docker VM 16.89 GiB free. `git status --short` before this file: `?? CAND-APP-PLAN.md`.

## Known Stubs

None added. Of the tracer's stubs in `177-15-SUMMARY.md`, the guard's is resolved here; the main button's one fixed row and the refusals that all read `failed` remain 177-18's.

## Evidence (gitignored)

- `tests/e2e-runs/177-e2e/177-17-control`, `177-17-precommit`, `177-17-precommit-r2`, `177-17-close`, with the kept copies beside the first three.
- `tests/e2e-runs/177-gates/177-17-pgtap-red`, `177-17-pgtap-red-r2`, `177-17-db`, `177-17-db-r2`, `177-17-close`.
- `tests/e2e-runs/177-unit/177-17-*`: the three verify scripts with log, exit and head and the corrected form of Task 2's; the red and green logs and JSON reports of the unit and component tests; the pgTAP red log in both forms; the verdict logs; the check, lint, type-check, unit, coverage, hygiene and parity logs with their exit files; `177-17-held-files.tsv`; `177-17-commit.sh`.

## Self-Check: PASSED

The five commits are ancestors of `HEAD`; the one created file and the eighteen modified ones exist; the four E2E run directories and the five gate directories exist with their `ended` or `done` markers.
