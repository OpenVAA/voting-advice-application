---
phase: 177-define-nominations
plan: 11
subsystem: e2e-harness
tags: [e2e, fixtures, semantic-steps, test-ids, nomination-editor, nominations-view, playwright]
status: complete
requires:
  - "177-10: the composition root perm-contestant-nominations.ts with its test object and contestantNominationsPagesOf; the gate run 177-10-close and the full run 177-10-close (346 of 346, 116 projects)"
  - "177-01: 177-gates.sh and 177-verdict.mjs"
provides:
  - "tests/tests/utils/testIds.ts: contestant.nominations.edit and .requestedParent; the contestant.nominationEditor block (31 ids); the shared.entitySelector block (6 ids)"
  - "tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts: createContestantNominationEditor(page, admin), ContestantNominationEditorFixture, 42 steps and their argument types"
  - "contestantNominationsPage: expectEditAction, pressEdit, expectSupportButtons; optional editable, kind, reason, action and requestedParent on five existing steps; NominationsEmptyKind, NominationsLockedReason"
  - "notEditableNote: NotEditableReason with nominationsAnswersLocked"
  - "contestantEntityHomePage: followMainAction and ContestantMainActionDestination"
  - "contestantNominationEditor in the test object and in the bundle over a page of perm-contestant-nominations.ts and perm-no-nomination.ts"
  - "the gate run tests/e2e-runs/177-gates/177-11-close at 057f8faa7: typecheck, lint, unit, format all 0"
affects: [177-15, 177-16, 177-17, 177-18, 177-19, 177-20, 177-21]
tech-stack:
  added: []
  patterns:
    - "a fixture that records browser dialogs dismisses each one a turn of the event loop after it was raised, so a listener that answers the dialog itself is not disturbed and a page with no other listener is not left blocked"
    - "a bundle over a page hands out a fixture whose creation has a side effect through a getter, so code that does not read it does not create it"
    - "an option whose label covers its radio is chosen by pressing its row, which is the pointer target; the radio is then asserted checked"
key-files:
  created:
    - tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts
  modified:
    - tests/tests/utils/testIds.ts
    - tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts
    - tests/tests/fixtures/contestant/notEditableNote.fixture.ts
    - tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts
    - tests/tests/fixtures/contestant/perm-contestant-nominations.ts
    - tests/tests/fixtures/contestant/perm-no-nomination.ts
decisions:
  - "a selection in a step's address is given by external ids, which the fixture reads with the service role, as it reads the entity's; a literal id can be added beside them for an address that names nothing"
  - "a card is named by its election, then its constituency, then its place among the cards that share both: two cards of one election and constituency are possible"
  - "absent means not rendered: a note, a hint, a field or a group that a step expects absent is asserted with a count of zero, never as hidden"
  - "the bundles over a page create the editor's fixture when it is first read: creating it registers a dialog listener, and six committed scan entries call noNominationPagesOf"
  - "the link to the editor is asserted as an anchor with the entry's address, not by the link role: the application's Button renders an anchor with role button"
  - "the main button's label and a card's status are read in English from two constant tables in the fixture, as the profile's fixture reads its Save label"
requirements-completed: []
metrics:
  started: "2026-10-11T04:15:31Z"
  completed: "2026-10-11T04:42:00Z"
  duration: "27 minutes"
  tasks: 2
  files: 7
actuals:
  tokens: 22465 # chars/4 over git diff bd2cfe67f..057f8faa7 outside .planning (89,861 characters)
  tasks: 2
  commits: 2 # git rev-list --count bd2cfe67f..057f8faa7
plan_head_before: bd2cfe67f0e2f48c6891797a20695fb12541aae1
plan_head_after: 057f8faa766399219dafc40aa07ef057acf45321
---

# Phase 177 Plan 11: The Test Ids and the Editor's Fixture; Additive Steps on Three Existing Fixtures — Summary

Every id the editor and the changed nominations view will render is in the registry, one new fixture holds the 42 steps a test of the editor's three pages speaks in, three existing fixtures gained steps and optional arguments that leave every existing call as it was, and two composition roots hand the editor's fixture out. Nothing renders an id and no spec calls a step: the committed suite is what it was, and the four gate rows are green.

`requirements-completed` is empty on purpose. The plan's frontmatter names NOM-03 to NOM-06, and this plan builds the steps their tests will be written in; nothing a user meets is delivered by it. `REQUIREMENTS.md`, `STATE.md` and `ROADMAP.md` were not touched.

## Read this first

- **Both verify blocks pass as written**, exit 0 each; neither has a defect of the four kinds the dispatch lists.
- **No screen exists, so no step has run against the application.** Every step was written from the UI contract's markup blocks. As a substitute, the steps were run against static markup written from those blocks (nine scratch tests, all green, under `tests/e2e-runs/177-unit/177-11-mock/`, gitignored and not part of the suite). That shows the locators, the waits and the arithmetic work on markup of the contract's shape; it shows nothing about the pages plans 177-15 to 177-20 build. Which steps it exercised is under *What was observed and what was not*.
- **Two defects that a type check cannot see were found before the commit they belong to**, one through that check and one by reading the page the step lands on: see *Deviations*, 1 and 2. The one that matters most to later plans: **the application's `Button` with an `href` renders `<a role="button">`**, so the Edit action of the nominations view is not a link to assistive technology or to `getByRole('link')`. `expectEditAction` asserts an anchor with the entry's address instead.
- **The bundles over a page do not create the editor's fixture until it is read.** Creating it registers a dialog listener, and six committed scan entries of `perm-no-nomination.spec.ts` call `noNominationPagesOf(page)`. With an eager member, committed tests would have run with a listener this plan added; with the getter they run exactly as before. *Deviations*, 4.
- **The first two steps of the editor carry no client-only state attribute** in the contract. A press of Continue, or of a picker, made before the page has hydrated is lost. Plan 177-15 must settle this when it builds the steps: see *For plans 177-15 to 177-20*.
- **Two things a spec passes are read in English**: the main button's label and a card's status. If the copy plan 177-12 lands differs, the two constant tables at the top of the fixture are where it changes.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1 | `6dad8f47e` | `test(177-11): the nomination editor's test ids and semantic steps` |
| 2 | `057f8faa7` | `test(177-11): steps for the nominations view's six states, the note's third reason and the home's main action` |

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/177-unit/177-11-t<N>-verify.sh` and run with `bash`; its log, status and head are kept beside it.

| Block | As written | Restated | Head |
|---|---|---|---|
| Task 1 | **0** | — | `6dad8f47e` |
| Task 2 | **0** — its last stage: `177-verdict gates 177-11-close: PASS` | — | `057f8faa7` |

## Gate rows — `tests/e2e-runs/177-gates/177-11-close`, head `057f8faa7`

Launched in the background and polled. Before it: AC power, battery 100 %; Docker VM free 16.99 GiB (17,819,860 KiB of `docker run --rm alpine df -k /`; the floor is 13.8). No Sleep entry inside the run window.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 21 |
| lint | 0 | 49 |
| unit | 0 | 68 |
| format | 0 | 19 |

Unit totals, equal to `177-10-close`: frontend 3687 passed and 30 skipped, dev-seed 1050, data 318 (supabase 462, app-shared 148, llm 49, matching 43, argument-condensation 31, filters 22, question-info 22, core 8).

No E2E run was made, as the plan rules: no committed spec calls a new step. The latest full run stays `tests/e2e-runs/177-e2e/177-10-close`.

## Task 1 — the registry and the editor's fixture

### The registry

All 39 ids of the UI contract's block, each value as the contract writes it, each with its comment above:

- `contestant.nominations.edit`, `.requestedParent`.
- `contestant.nominationEditor`: `electionsPage`, `electionsList`, `electionsHint`, `electionsContinue`, `constituenciesPage`, `constituenciesList`, `constituenciesKept`, `constituenciesNoElection`, `constituenciesContinue`, `detailsPage`, `changeSelection`, `cards`, `card`, `cardElection`, `cardConstituency`, `cardPreviousConstituency`, `cardState`, `confirmedNote`, `newNote`, `symbol`, `symbolInput`, `parent`, `other`, `otherInput`, `otherError`, `remove`, `keep`, `removedNote`, `saveMessage`, `submit`, `cancel`.
- `shared.entitySelector`: `root`, `option`, `optionInput`, `optionHint`, `empty`, `error`.

The comments of four existing ids of `contestant.nominations` name what this phase adds: the page (`data-nominations-editable`), the empty sentence (`data-empty` and its three values), the main button (`define`), and the note (`data-reason` with `nominationsAnswersLocked`). The contract's own three comment lines for these read "now also carries", "now carries" and "gains"; they were written in the present tense instead, because a comment describes the code as it is.

### Every step's signature, as written

`createContestantNominationEditor(page: Page, admin: SupabaseAdminClient)`; `type ContestantNominationEditorFixture = ReturnType<typeof createContestantNominationEditor>`.

```ts
// addresses
open(entity: EntityGrantTarget): Promise<void>
openStep(entity: EntityGrantTarget, step: NominationEditorStep, selection?: NominationEditorSelection): Promise<void>
expectStep(step: NominationEditorStep): Promise<void>
expectNoStep(): Promise<void>
// the election step
expectElections(names: ReadonlyArray<string>): Promise<void>
expectChecked(names: ReadonlyArray<string>): Promise<void>
setElection(name: string, checked: boolean): Promise<void>
expectElectionsHint(shown: boolean): Promise<void>
expectElectionsContinue(enabled: boolean): Promise<void>
continueFromElections(): Promise<void>
// the constituency step
expectConstituencyPickers(electionNames: ReadonlyArray<string>): Promise<void>
chooseConstituency(constituencyName: string, electionName?: string): Promise<void>
expectChosenConstituency(constituencyName: string, electionName?: string): Promise<void>
expectKept(electionName: string): Promise<void>
expectNoElectionSentence(shown: boolean): Promise<void>
expectConstituenciesContinue(enabled: boolean): Promise<void>
continueFromConstituencies(): Promise<void>
// the details step, the page
expectEditorState(state: NominationEditorState): Promise<void>
expectCards(expected: ReadonlyArray<ExpectedEditorCard>): Promise<void>
expectChangeSelection(shown: boolean): Promise<void>
changeSelection(): Promise<void>
expectSubmit(action: EditorSubmitAction, label: EditorSubmitLabel): Promise<void>
submit(): Promise<void>
cancel(): Promise<void>
expectSaveMessage(outcome: EditorSaveOutcome | null): Promise<void>
// the details step, one card
expectNotes(ref: EditorCardRef, notes: ExpectedEditorNotes): Promise<void>
expectStatus(ref: EditorCardRef, value: EditorCardStatus | null): Promise<void>
typeSymbol(ref: EditorCardRef, text: string): Promise<void>
expectSymbol(ref: EditorCardRef, text: string): Promise<void>
expectParentGroup(ref: EditorCardRef, facts: ExpectedParentGroup): Promise<void>
chooseParent(ref: EditorCardRef, kind: ParentOptionKind, name?: string): Promise<void>
expectParentHint(ref: EditorCardRef, name: string, shown: boolean): Promise<void>
expectParentEmptyLine(ref: EditorCardRef, shown: boolean): Promise<void>
typeOtherName(ref: EditorCardRef, text: string): Promise<void>
expectOtherName(ref: EditorCardRef, text: string | null): Promise<void>
expectError(ref: EditorCardRef, field: EditorErrorField): Promise<void>
remove(ref: EditorCardRef): Promise<void>
keep(ref: EditorCardRef): Promise<void>
// focus and geometry
expectFocusOn(target: EditorFocusTarget): Promise<void>
parentByKeyboard(ref: EditorCardRef, keys: ReadonlyArray<string>): Promise<ParentKeyboardOutcome>
expectNoDialog(): Promise<void>
boxesOf(ref: EditorCardRef): Promise<EditorCardBoxes>
```

The exported types:

```ts
type NominationEditorStep = 'elections' | 'constituencies' | 'details'
interface NominationEditorSelection {
  elections?: ReadonlyArray<string>          // external ids, read with the service role
  constituencies?: ReadonlyArray<string>     // external ids
  electionIds?: ReadonlyArray<string>        // put into the address as given, after the others
  constituencyIds?: ReadonlyArray<string>
}
type NominationEditorState = 'loading' | 'ready' | 'saving' | 'error'
type EditorCardState = 'kept' | 'new' | 'removed'
interface ExpectedEditorCard { election: string; constituency: string; state: EditorCardState; confirmed: boolean; moved: boolean }
interface EditorCardRef { election: string; constituency?: string; nth?: number }
type EditorSubmitAction = 'continue' | 'return'
type EditorSubmitLabel = 'continue' | 'return' | 'saveAndContinue' | 'saveAndReturn'
type EditorSaveOutcome = 'invalid' | 'changed' | 'hasCandidates' | 'tooManyPending' | 'failed'
interface ExpectedEditorNotes { confirmed: boolean; new: boolean; removed: boolean; previousConstituency: string | null }
type EditorCardStatus = 'confirmed' | 'pending'
type ParentOptionKind = 'entity' | 'none' | 'other' | 'unlisted'
interface ParentOption { kind: ParentOptionKind; name: string }
type ExpectedParentGroup =
  | { shown: false }
  | { shown: true; required: boolean; chosen: ParentOptionKind | null; options: ReadonlyArray<ParentOption> }
type EditorErrorField = 'parent' | 'otherName'
type EditorFocusTarget =
  | { on: 'heading' } | { on: 'submit' }
  | { on: 'remove' | 'keep' | 'firstParentOption' | 'otherName'; card: EditorCardRef }
interface ParentKeyboardOutcome { chosen: ParentOption | null; focused: ParentOption | 'otherName' | null }
interface EditorCardBoxes { card: Locator; optionRows: Array<Locator>; otherName: Locator | null; symbol: Locator | null; remove: Locator | null }
```

### Names and arguments that differ from the plan's table, with the reason

Every step of the plan's table exists under the plan's name. The differences are in arguments:

| The plan's | As written | Why |
|---|---|---|
| `openStep(entity, step, selection?)` "with the given election and constituency ids" | the selection is given by **external ids** (`elections`, `constituencies`), read with the service role; literal ids can follow in `electionIds` and `constituencyIds` | a spec knows a row by its external id and may hold no query; the fixture already reads the entity's id that way. The literal members are for an address that names something that is no election |
| `expectSubmit(action, labelKey)` | the second argument is one of four names — `continue`, `return`, `saveAndContinue`, `saveAndReturn` — and the fixture holds each one's English text | the names are the last segments of the four message keys; the label is read in English, as the profile's fixture reads its Save label |
| `expectStatus(card, value)` | `value` is `'confirmed'`, `'pending'` or `null` for a card with no status row; the row's text is compared with the English label and the card's `data-confirmed` with the same fact | the contract gives the row no state attribute of its own |
| `expectSaveMessage(outcome)` "an outcome, or none" | `null` is "none" | — |
| `expectOtherName(card, text)` | `text` may be `null`: the card shows no name field | the field is rendered only while "Other" is chosen, and a test of that needs to say so |
| a card "named by its election and, where an election has several, its constituency" | `EditorCardRef` has a third member, `nth` | two cards of one election and one constituency are possible — the duplicate-parent rule of the contract is about exactly them |
| `expectFocusOn(target)` "a card's first radio, a card's name field" | `{ on: 'firstParentOption', card }`, `{ on: 'otherName', card }` | — |

Beyond the plan's list, in Task 2: `pressButton` takes an optional action (below), and `ContestantMainActionDestination` has a seventh member, `preview` (below).

### How each rule of the plan's step 2 is met

- **An address** is the entity's home, built by `buildRoute` from the entity's type and id, plus the step's path (`/nominations/elections`, `/nominations/constituencies`, `/nominations/details`) and the two search params `nominationElectionId` and `nominationConstituencyId`, each repeatable. The three route keys of the editor are not on the tree yet, so the paths are constants of the fixture; plan 177-15 may replace them with the keys.
- **State is read from the attributes the contract names**: `data-editor-state`, `data-card-state`, `data-confirmed`, `data-moved`, `data-outcome`, `data-action`, `data-selected-kind`, `data-option-kind`, `aria-required`, `aria-invalid`. A name is read as text or as an accessible name.
- **An election is checked through the selector's own option id** (`election-selector-option`), found among the options by the accessible name of the checkbox. **A parent option is chosen by its kind**, and an entity by the accessible name of its radio; no step reads `entity-card-subcard`.
- **A card** is found by the heading that carries `nomination-editor-election` and has the election's name, then by a constituency value that begins with the constituency's name, then by `nth`. A reference that matches no card, or several, fails in the step that uses it.
- **No fixed wait**: the file holds no `waitForTimeout`; every step waits for the state it names. The one deferral in the file is one turn of the event loop inside the dialog listener, which is not a wait on the page.
- **`expectNoDialog`**: the listener is registered when the fixture is created and records every dialog's type and message; the step fails on any record.

### Things a later plan must know about the steps

- **Absent means not rendered.** `expectElectionsHint(false)`, `expectNoElectionSentence(false)`, `expectChangeSelection(false)`, `expectParentGroup(card, { shown: false })`, `expectParentHint(…, false)`, `expectParentEmptyLine(…, false)`, `expectOtherName(card, null)`, `expectStatus(card, null)` and the `false` members of `expectNotes` each assert a count of zero. An element kept in the DOM and hidden fails them.
- **The selector roots are read under the page's ids.** `ElectionSelector` and `ConstituencySelector` spread their rest props after their own `data-testid`, so the id the page passes replaces `election-selector` and `constituency-selector` on the root. The fixture reads `contestant-nomination-elections-list` and `contestant-nomination-constituencies-list`, and the selector's own ids only for the option label and the option. The same holds for `nomination-editor-parent` over `entity-selector`: `shared.entitySelector.root` is read by no step.
- **A picker is the selector's combobox.** `ConstituencySelector` renders one for a group of several constituencies and a plain line for a group of one. `chooseConstituency` and `expectChosenConstituency` read a combobox whose value ends with the constituency's name (the selector puts a check mark before it). `expectConstituencyPickers` counts sections by their headings, a single-constituency section included; with one name it asserts one combobox and no heading, which is how the selector renders a single section.
- **A picker's section has no test id and no role**; it is reached as the parent of the heading that names its election, with the lint exception the profile's fixture uses for the same shape.
- **On a moved card** the constituency is asserted as what the value begins with, in `expectCards` and in a card reference, because the contract does not say whether the previous-constituency line is inside the value or beside it. On every other card the value is compared whole.
- **Interacting steps of the details page wait for `data-editor-state="ready"` first** (`typeSymbol`, `chooseParent`, `typeOtherName`, `remove`, `keep`, `submit`, `changeSelection`, `parentByKeyboard`, and `expectChangeSelection`). Reading steps wait for the card alone.
- **`submit()` presses and asserts nothing about what follows**; the next step does — `expectSaveMessage(outcome)`, `expectNoStep()`, or another page's fixture. `expectSaveMessage(null)` passes on a page nothing was pressed on, so it is asserted after the press has been seen to lead somewhere.
- **`expectNoStep()`** passes on any page of the Contestant App that is not one of the three steps. Which page it is, that page's fixture says.
- **`expectError(card, 'parent')`** asserts that the group's accessible description is the error's text whole; `'otherName'` that the field's description contains it, because `Input` also names its info line.
- **`chooseParent` presses the option's row.** The contract's label covers the row, so a press on the radio itself would be intercepted by the label.
- **`parentByKeyboard`** focuses the chosen radio, or the first when none is chosen, presses the keys and returns what it finds; it asserts nothing of the outcome.
- **`boxesOf`** returns locators for `pageGeometry`'s steps; a part the card does not render is `null`, and `optionRows` is empty for a card with no parent group.
- **The dialog listener** dismisses a dialog one turn of the event loop after it was raised and ignores a failed dismissal. A listener that answers the dialog itself — `contestantProfilePage.leaveThroughMenu` is one — has then already done so. A test that reads both fixtures and raises a confirm on purpose will find it in `expectNoDialog`, which is correct.

## Task 2 — the three existing fixtures and the two roots

### `contestantNominationsPage.fixture.ts`

```ts
type NominationsButtonAction = 'continue' | 'return' | 'define'
type NominationsEmptyKind = 'define' | 'locked' | 'noElection'
type NominationsLockedReason = Extract<NotEditableReason, 'nominationsLocked' | 'nominationsAnswersLocked'>
interface ExpectedNominationCard { …; requestedParent?: string }

expectState({ state, locked, editable }: { state: NominationsViewState; locked: boolean; editable?: boolean }): Promise<void>
expectCard(index: number, card: ExpectedNominationCard): Promise<void>
expectEmptySentence(text: string, kind?: NominationsEmptyKind): Promise<void>
expectLockedNote(present: boolean, reason: NominationsLockedReason = 'nominationsLocked'): Promise<void>
expectSupportButtons(count: number): Promise<void>        // new
expectEditAction(): Promise<void>                           // new
pressEdit(): Promise<void>                                  // new
expectButton(action: NominationsButtonAction): Promise<void>
pressButton(action?: NominationsButtonAction): Promise<void>
```

- `expectState` without `editable`, `expectEmptySentence` without `kind` and `pressButton` without `action` assert exactly what they asserted. `expectLockedNote(true)` still asserts `data-reason="nominationsLocked"`: the default is the old literal.
- `expectCard` with `requestedParent`: the parent row begins with the typed name and the card holds the `nomination-requested-parent` line. `parent` must then be `null`; both given throws. Without it, nothing about that line is asserted, so no existing call changed.
- `expectEditAction`: exactly one element with the edit id, visible, an anchor, whose `href` is the editor's entry under an entity, whose accessible name is the text it shows, and which follows the main button in document order.
- `pressButton` has no argument on the committed tree, so "accepts `'define'`" was given the form of an optional action that is asserted before the press.
- `expectNoEditAction` is not touched.

### `notEditableNote.fixture.ts` and `contestantEntityHomePage.fixture.ts`

```ts
type NotEditableReason = 'answersLocked' | 'nominationsLocked' | 'nominationsAnswersLocked'

type ContestantMainActionDestination =
  | 'nominationElections' | 'nominationConstituencies' | 'nominationDetails'
  | 'nominations' | 'profile' | 'questions' | 'preview'
followMainAction(): Promise<ContestantMainActionDestination>
```

`followMainAction` waits until the main action says where it leads (`data-next-step`, which is there only once the entity's tasks are known), presses it, waits until one page's marker is visible, asserts that exactly one is, asserts the URL is that page's under an entity, and returns its name. The markers: the three editor containers, `contestant-nominations`, `contestant-profile-identity`, `contestant-questions-intro` or `contestant-questions-none`, `contestant-preview-container`. `preview` is beyond the plan's six: the home's main action can lead there (`data-next-step="preview"`), and without it such a press would end in a timeout that names no page.

The plan puts the step on `contestantEntityHomePage`; the UI contract's Fixtures table names `contestantHomePage.fixture.ts` for it. The plan was followed.

### The two roots

`contestantNominationEditor` is a fixture of the `test` object of `perm-contestant-nominations.ts` and of `perm-no-nomination.ts`, and a member of `contestantNominationsPagesOf(page)` and `noNominationPagesOf(page)`. In the two bundles it is a getter that creates the fixture on first read and returns the same one afterwards.

### The population of existing calls, as re-read

`git grep -n -E "expectState\(|expectCard\(|expectEmptySentence\(|expectLockedNote\(|expectButton\(|expectNote\(|pressButton\(" -- tests/tests/specs` at `6dad8f47e`: 57 lines (kept as `tests/e2e-runs/177-unit/177-11-t2-population.txt`). `pressButton(` was added to the plan's search because that step changed too.

| Step | Calls | Every call's form |
|---|---|---|
| `expectState(` | 17 | `{ state, locked }`, no `editable` |
| `expectCard(` | 9 | an object with no `requestedParent` |
| `expectLockedNote(` | 9 | one argument |
| `expectButton(` | 8 | `'return'` or `'continue'` |
| `expectEmptySentence(` | 6 | one argument |
| `expectNote(` | 4 | `'answersLocked'` |
| `pressButton(` | 4 | no argument |

By file: `perm-no-nomination.spec.ts` 48, `contestant-nominations.spec.ts` 4, `perm-answers-locked.spec.ts` 4, `contestant-journey.spec.ts` 1. No call outside `tests/tests/specs`. The word `requestedParent` occurs twice in `contestant-nominations.spec.ts`, both in rows compared with `nominationsOf`, neither in an `expectCard` argument. No call passes an argument a changed step now reads differently.

## What was observed and what was not

**Observed:** the type check, the lint, the format check and the unit rows on the committed head; both verify blocks; the population above; and the nine scratch tests against static markup.

**The scratch check** (`tests/e2e-runs/177-unit/177-11-mock/`: a configuration of its own, `page.setContent` and `page.route`, no server, no database, no global setup; logs `run-1.log` to `run-7.log`, the last one nine of nine). Run on the final code:

- Editor, exercised: `open`, `openStep` with external and literal ids (the address compared whole), `expectStep` for all three, `expectNoStep` passing and failing, every step of the election step, `expectConstituencyPickers` with two names, `chooseConstituency` and `expectChosenConstituency` under a named heading, `expectKept`, `expectNoElectionSentence` and `expectConstituenciesContinue` both ways, `cancel`, `expectEditorState`, `expectCards` with a moved card, `expectChangeSelection(true)`, `expectSubmit`, `submit`, `expectSaveMessage` with `null` and with `invalid`, `expectNotes`, `expectStatus` in its three forms, `typeSymbol`, `expectSymbol`, `expectParentGroup` in its three forms, `chooseParent` for an entity and for "Other", `expectParentHint` both ways, `expectParentEmptyLine(false)`, `typeOtherName`, `expectOtherName` with text and with `null`, `expectError(…, 'parent')`, `remove`, `keep`, `expectFocusOn` for the first parent option, Keep and Remove, `parentByKeyboard` with arrows and with Tab, `expectNoDialog` passing and failing, `boxesOf`; the dialog listener alone, twice on one page, and beside a listener that accepts.
- Editor, **not exercised**: `continueFromConstituencies`, `changeSelection`, `expectError(…, 'otherName')`, `expectFocusOn` for the heading, the main button and the name field (the heading only as a failing case), `expectParentEmptyLine(true)`, `expectChangeSelection(false)`, `chooseParent` for `none` and `unlisted`, `expectConstituencyPickers` with one name.
- Nominations view, exercised: every existing call form on markup of the committed shape; `expectState` with `editable`, passing and failing; `expectEmptySentence` with a kind, passing and failing; `expectLockedNote` with the new reason, and the default failing on it; `expectButton('define')`; `expectCard` with a requested parent; `expectSupportButtons`; `expectEditAction` passing and failing; `expectNoEditAction` passing, and failing on a page with Edit. **Not exercised:** `pressEdit`, `pressButton(action)` on its passing path.
- Home, exercised: `followMainAction` to the details step, the nominations view, the profile and the questions. **Not exercised:** to the election step, the constituency step and the preview.
- The bundle: no dialog listener until `contestantNominationEditor` is read, one after, the same fixture on a second read.

**Inferred, not observed:** everything about how the real pages will render. In particular that `ConstituencySelector`'s picker is always the autocomplete combobox on these pages (read in `SingleGroupConstituencySelector.svelte` and `Select.svelte`: a group with several constituencies gets `autocomplete="on"`), and that input a user makes on a checkbox, a radio or a text field before hydration is kept (read in Svelte's `bind:group`, `bind:checked` and `bind:value`, which take the DOM's value when it differs at hydration).

## For plans 177-15 to 177-20

### The steps by area

| Area | Fixture | Steps |
|---|---|---|
| The editor's addresses | `contestantNominationEditor` | `open`, `openStep`, `expectStep`, `expectNoStep` |
| The election step | `contestantNominationEditor` | `expectElections`, `expectChecked`, `setElection`, `expectElectionsHint`, `expectElectionsContinue`, `continueFromElections` |
| The constituency step | `contestantNominationEditor` | `expectConstituencyPickers`, `chooseConstituency`, `expectChosenConstituency`, `expectKept`, `expectNoElectionSentence`, `expectConstituenciesContinue`, `continueFromConstituencies` |
| The details step, the page | `contestantNominationEditor` | `expectEditorState`, `expectCards`, `expectChangeSelection`, `changeSelection`, `expectSubmit`, `submit`, `cancel`, `expectSaveMessage` |
| The details step, a card | `contestantNominationEditor` | `expectNotes`, `expectStatus`, `typeSymbol`, `expectSymbol`, `remove`, `keep` |
| The parent selector | `contestantNominationEditor` | `expectParentGroup`, `chooseParent`, `expectParentHint`, `expectParentEmptyLine`, `typeOtherName`, `expectOtherName`, `expectError` |
| Focus, keyboard, dialogs | `contestantNominationEditor` | `expectFocusOn`, `parentByKeyboard`, `expectNoDialog` |
| Geometry | `contestantNominationEditor` with `pageGeometry` | `boxesOf`, then `pageGeometry.expectInside`, `expectNoOverlap`, `expectAtLeast`, `expectNoHorizontalOverflow` |
| The nominations view's six states | `contestantNominationsPage` | `expectState` (`editable`), `expectEmptySentence` (kind), `expectLockedNote` (reason), `expectSupportButtons`, `expectEditAction`, `pressEdit`, `expectNoEditAction`, `expectButton` and `pressButton` (`'define'`), `expectCard` (`requestedParent`) |
| The note on other pages | `notEditableNote` | `expectNote` with the third reason |
| The home's main action | `contestantEntityHomePage` | `followMainAction` |

Both `perm-contestant-nominations.ts` and `perm-no-nomination.ts` export a `test` that offers `contestantNominationEditor`; `perm-startfromcg.spec.ts`'s contestant describe (177-16) gets a root of its own and composes it there.

### What the screens must provide for the steps to hold

- **A marker of a hydrated page on the first two steps, or a server render that shows no selector.** The details page has `data-editor-state`, and every interacting step waits for `ready`. The election and constituency steps have nothing of the kind in the contract. `continueFromElections`, `continueFromConstituencies`, `chooseConstituency` and `cancel` press an element with a handler; pressed before hydration, the press is lost and the step ends in a timeout, which would be an intermittent failure. If the server renders `<Loading />` in the selector's place — the contract leaves that open — the selector's presence is the marker and nothing more is needed. If it renders the selector, plan 177-15 adds a state attribute and the wait, in its own commit.
- **The parent group under `nomination-editor-parent`**, with the option rows, inputs, hints, empty line and error under the selector's own ids inside it.
- **`data-option-kind` on each row and a radio named by the option's name alone.** `expectParentGroup` compares the accessible name whole.
- **The name field of "Other" rendered only while "Other" is chosen**, and its error under `nomination-editor-other-error`. `Input` renders its own error under `input-error`; whichever the page uses, the contract's id is the one the step reads.
- **Remove moves focus to Keep and Keep to Remove**, and a kept card says `data-card-state="kept"` again: `keep` waits for that value.
- **A status row's text** equal to `Confirmed` or `Pending confirmation`, and the main button's to one of `Continue`, `Return`, `Save and Continue`, `Save and Return`, in English.

### The Edit action is an anchor with role button

`Button.svelte` renders `<a role="button" tabindex="0" href=…>` when it is given an `href`. The contract's "Edit is a link named by its text" is therefore, on the tree's component, an anchor that assistive technology and `getByRole` see as a button. `expectEditAction` asserts the anchor and its address. The same holds for every `Button` with an `href` on the editor's pages — Cancel and "change selection" among them — and for the main buttons of the home and the nominations view today. Whether that is right for a navigation is a question about the component, not about this phase's pages; it is reported, not changed.

## Deviations from Plan

### Auto-fixed Issues

Each was found before the commit of the task it belongs to, so no commit holds the defect: the first through the scratch check, the second by reading the page the step lands on, the third by the type check.

**1. [Rule 1 - Bug] `expectEditAction` asserted the link role**
- **Found during:** Task 2, reading `Button.svelte` after a scratch failure on the link's name.
- **Issue:** the first form was `toHaveRole('link')`. The application's `Button` with an `href` is `<a role="button">`, so the step would have failed on the real page with a correct Edit action.
- **Fix:** the step asserts that the element is an anchor and that its `href` is the editor's entry.
- **Files modified:** `contestantNominationsPage.fixture.ts`. **Commit:** `057f8faa7`.

**2. [Rule 1 - Bug] `followMainAction` knew the questions page by an element it does not always render**
- **Found during:** Task 2, reading the questions page.
- **Issue:** the first marker was `contestant-questions-list`, which the page renders only once something is answered; with nothing answered it renders the intro alone.
- **Fix:** the marker is `contestant-questions-intro`, which both branches render, or `contestant-questions-none`.
- **Files modified:** `contestantEntityHomePage.fixture.ts`. **Commit:** `057f8faa7`.

**3. [Rule 1 - Bug] A focus target that did not type-check as intended**
- **Found during:** Task 1, the first type check.
- **Issue:** `EditorFocusTarget` held `{ on: 'heading' | 'submit' }` as one member, which the compiler does not narrow away after two comparisons.
- **Fix:** two members, one per literal.
- **Files modified:** `contestantNominationEditor.fixture.ts`. **Commit:** `6dad8f47e`.

### Other deviations

4. **The bundles hand the editor's fixture out through a getter.** The plan asks for it in each root's `…PagesOf(page)`; written as a plain member it would be created on every call, and `noNominationPagesOf(page)` is called by six committed scan entries. The plan's own premise is that nothing committed calls anything new. The getter keeps the member and the premise both.
5. **`pressButton` gained an optional action**, the form "accepts `'define'`" could take for a step with no argument.
6. **`followMainAction` knows the preview** beside the plan's six pages.
7. **The comment of the note's id** in `testIds.ts` was extended beside the three the plan names, because the note's `data-reason` gains a value in this phase too.
8. **A scratch check was made that the plan does not ask for**, with Playwright and static markup, outside the suite and the wrapper: no server was started, no port used and the database not read. Its files are under `tests/e2e-runs/177-unit/177-11-mock/` and are evidence, not tests.
9. **No walk of `.agents/code-review-checklist.md`**: the plan adds no application code and has no checklist step.

## Prohibitions

- **PROH-177-28** (judgment): held. No step waits a fixed time; no step reads `entity-card-subcard`; state is read from the `data-*` and `aria-*` attributes the contract names and from text. Two places read text in English (the main button's label, a card's status) and two use a raw locator with a `// reason:` comment (the parent of a picker's heading; an option's row by its kind attribute).
- **PROH-177-29** (explicit): held. Every change to an existing step is a new optional argument, a default equal to the old literal, or a member more in a union; the population above was re-read; Task 2's verify asserts that no commit since the spec's own touched `tests/tests/specs`, and passed.

## Threat Flags

None. No endpoint, auth path or schema object was added. T-177-48 is mitigated as far as it can be before the screens exist — every step waits for the state it names, and the scratch check includes failing cases for `expectNoStep`, `expectNoDialog`, `expectEditAction`, `expectNoEditAction`, `expectEmptySentence`, `expectLockedNote` and `expectState` — and is finished by each screen plan's negative control. T-177-49 is mitigated as PROH-177-29 says.

## Sentences the work made false, reported and not edited

For plan 177-21:

- `tests/README.md`, the paragraph on `tests/tests/fixtures/contestant/`: its list of page fixtures names no nomination-editor fixture; "`contestantEntityHomePage.fixture.ts` opens the app's root under a single-entity session and asserts that the home shown is that entity's" does not say it also follows the main action; "`contestantNominationsPage.fixture.ts` … reads its state, its cards and its button" does not name the Edit action or the support-button count.
- `177-UI-SPEC.md`, *Locator Contract*, the Fixtures table: the row for the step that follows the main action names `contestantHomePage.fixture.ts`; the plan put it on `contestantEntityHomePage.fixture.ts`. S2's "Edit is a link named by its text" and its *Accessibility* line: on the tree's `Button` it is an anchor with role button. Planning records: note, do not rewrite.

## Not done, or not verified

- **No step has run against the application.** See *What was observed and what was not* for the steps the scratch check did not reach either.
- **The hydration of the first two steps** is not settled; it cannot be before the pages exist.
- **No E2E run**, as the plan rules. That the committed suite is unchanged rests on: no spec file changed, every changed step re-read against its 57 calls, the getter in the two bundles, and the four gate rows. The next full run is `177-13-close`.
- **`STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md`** were not updated, as the dispatch rules.

## The state the local stack is left in

Untouched by this plan: no reset, no E2E run, no state step, no query. The database is as `177-10-close` and its teardowns left it. Docker VM free space 16.99 GiB before the gate run; one `alpine` container was run to read it and removed.

## Known Stubs

None. Two constant tables in the editor's fixture hold English labels on purpose (above); they are not placeholders.

## Evidence (gitignored)

- `tests/e2e-runs/177-unit/177-11-t1-verify.{sh,log,exit,head}`, `177-11-t2-verify.{sh,log,exit,head}`, `177-11-t2-population.txt`, `177-11-gates-close.{log,exit}`
- `tests/e2e-runs/177-gates/177-11-close/`
- `tests/e2e-runs/177-unit/177-11-mock/` — `playwright.config.ts`, `mock.spec.ts`, `j-mock.spec.ts`, `run-1.log` to `run-7.log`

## Self-Check: PASSED

The seven changed files, the summary, the gate run's `summary.tsv`, the population file and the scratch check's last log are on disk; `6dad8f47e` and `057f8faa7` are ancestors of `HEAD`; the registry holds 31 ids in the editor's block and 6 in the selector's; the editor's fixture holds its 42 steps (Task 1's verify names each).
