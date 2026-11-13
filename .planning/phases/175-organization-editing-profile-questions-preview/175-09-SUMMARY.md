---
phase: 175-organization-editing-profile-questions-preview
plan: 09
subsystem: ui
tags: [contestant-app, profile-page, entity-descriptor, name-rule, colour, save-outcomes, aria-alert, invalidateAll, svelte-runes, tdd, e2e, red-control]

requires:
  - phase: 175-organization-editing-profile-questions-preview (plan 04)
    provides: entityDescriptorOf and its identity fields, nameState, isNameEditable, requiredNameLocale, the copy keys
  - phase: 175-organization-editing-profile-questions-preview (plan 05)
    provides: the organization-editing dataset, its three sessions, the registered test ids, the per-project baseline
  - phase: 175-organization-editing-profile-questions-preview (plan 06)
    provides: Input's requiredLocale prop, the color kind, the description and required attributes
  - phase: 175-organization-editing-profile-questions-preview (plan 07)
    provides: the store's setProperty, current.localizedNames, and the three outcomes of save()
  - phase: 175-organization-editing-profile-questions-preview (plan 08)
    provides: questionsReady, the name clause of profileComplete, the organization key of hideIfMissingAnswers
provides:
  - "the profile page for both entity types: the identity section (data-testid contestant-profile-identity, data-entity-type, data-name-state), the name sentence, the descriptor's name fields, the image by type, one colour field for an organization"
  - "the always-present alert region profile-save-message with data-outcome failed | name-refused, and focus on Save after a save that does not navigate"
  - "the re-read of the page's loads after a save that stored a listed property, and after a refused name"
  - "isRequiredNameMissing and NameFieldValues in lib/contestant/utils/nameRule.ts"
  - "Input's autocomplete prop"
  - "contestantProfilePage fixture steps: open, reload, expectIdentity, expectNameNote, fillName, fillShortName, expectName, expectShortName, expectNamesLocked, expectNamesEditable, expandNameTranslations, expectNameRequiredBadge, fillFirstName, fillLastName, expectPersonNames, expectPersonNamesEditable, setColor, clearColor, expectColor, expectNoColorField, uploadLogo, expectLogo, save, expectSaveMessage, expectSaveFocused"
  - "the state steps setOrganizationState, setCandidateState, setAnswersLocked, and groupTitleNaming, exported by the spec's composition root"
  - "multilingualTextField.localeField(scope, locale)"
  - "four profile: tests of perm-organization-editing.spec.ts"
  - "each of the seven catalogues at 634 keys"
  - "the gate rows 175-09-close (6 rows at 0) and the full run 175-09-close (230 passed in 110 projects)"
affects: [175-10, 175-11, 175-12, 175-13, 176, 179]

actuals:
  tokens: 28983 # chars/4 over the nine commits' diff outside .planning/ (115933 chars)
  tasks: 3
  commits: 9 # MEASURED: git rev-list --count 1013217aa..e090cddeb, before this file's own commit
plan_head_before: 1013217aacf48a4c9d3a93e1978e3b81fdf42a82
plan_head_after: e090cddeb1f8eca84d16629bcc585fd07fa39d81

tech-stack:
  added: []
  patterns:
    - "A page reads every difference between two entity types from the descriptor and tells a joined row from a stacked field by the field's Input kind, never by the entity's type"
    - "A message region that is in the document from the first render, so that a message put into it is announced"
    - "A fixture step that opens a page waits for something only the filled store renders, so that an edit is never made before the page has hydrated"
    - "A red E2E control is a run of the uncommitted tree through the wrapper; the tests are committed after the run that shows them green"

key-files:
  created:
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile/page.svelte.test.ts
  modified:
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile/+page.svelte
    - apps/frontend/src/lib/components/input/Input.type.ts
    - apps/frontend/src/lib/components/input/Input.svelte
    - apps/frontend/src/lib/contestant/utils/nameRule.ts
    - apps/frontend/src/lib/contestant/utils/nameRule.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/common.json
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/dynamic.json
    - tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts
    - tests/tests/fixtures/contestant/perm-organization-editing.ts
    - tests/tests/fixtures/shared/multilingualTextFieldFixture.fixture.ts
    - tests/tests/specs/perm/perm-organization-editing.spec.ts

key-decisions:
  - "The identity section's data-entity-type is the selected entity's own type and is absent while no entity is known; the page never falls back to a type name of its own"
  - "After a refused name the page treats the entity as confirmed by itself, keyed on the entity's id, so the name fields lock even when the list of the user's entities cannot be read again"
  - "The alert region carries no margin of its own: the message inside it does, so an empty region adds no space above the Save button"
  - "Input gains a typed autocomplete prop instead of the page passing the token through an untyped spread"
  - "The profile fixture's open() waits for the nominations block to list a nomination, which only the filled store renders: the suite has no other hydration signal"
  - "The required-name badge step is named expectNameRequiredBadge: expectRequiredBadge(label) already exists and keeps its signature"

patterns-established:
  - "setOrganizationState / setCandidateState / setAnswersLocked first, then open(), then expectIdentity: the opening of every test of the organization-editing spec"

requirements-completed: []

coverage:
  - id: D1
    description: "The identity section, its fields and its lock by entity type and name state, right before the store holds the entity's data; one colour field for an organization; the image's label by type"
    requirement: GEN-03
    verification:
      - kind: unit
        ref: "profile/page.svelte.test.ts, the first six groups (21 cases; red 20 failed / 1 passed at 3b595ab55, green at c07e1fdf7)"
        status: pass
      - kind: e2e
        ref: "perm-organization-editing › profile: (4 tests; red in 175-09-control, green in 175-09-precommit and 175-09-close)"
        status: pass
    human_judgment: false
  - id: D2
    description: "An edit hands the store a plain value: a name by locale, a colour as an object holding normal alone, or null"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "profile/page.svelte.test.ts, 'what an edit hands the store' (6 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The three outcomes of a save, the alert region, the re-read and the focus on Save"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "profile/page.svelte.test.ts, 'the outcomes of a save' (10 cases; red 10 failed / 21 passed at 920543d6e, green at b6516078e and 59abffb43)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A saved name reaches the menu's group title before any reload"
    requirement: GEN-01
    verification:
      - kind: e2e
        ref: "perm-organization-editing › profile: an unconfirmed organization fills in its required name, a short name and a logo, and the menu names it by the saved name"
        status: pass
    human_judgment: false
  - id: D5
    description: "The refused-name and failed-save outcomes in a browser: the message announced, focus on Save, the fields locked after the re-read"
    verification: []
    human_judgment: true
  - id: D6
    description: "The gate rows and one full default E2E run on this tree, every other project at its total in the plan-08 run"
    verification:
      - kind: other
        ref: "175-verdict.mjs gates 175-09-close --rows typecheck,lint,unit,check-frontend,build,format (exit 0)"
        status: pass
      - kind: e2e
        ref: "175-verdict.mjs e2e 175-09-close --same-projects-as 175-08-close --except perm-organization-editing=+ … (exit 0; 230 passed, 110 projects compared, 0 not as expected)"
        status: pass
    human_judgment: false
  - id: D7
    description: "A long locked name at 320px, and the colour row and the two-field name stack as a person sees them"
    verification: []
    human_judgment: true

duration: 39min
completed: 2026-10-08
status: complete
---

# Phase 175 Plan 09: The Profile Page for Both Entity Types, its Key Assertions Red First — Summary

**One profile page now serves a candidate and an organization from the per-type descriptor and the one name rule: an organization has a multilingual name and short name that are editable until an administrator confirms it, a logo and one colour; a candidate's two names follow the same rule; and a save has three outcomes the page tells apart in an always-present alert region. Four new `profile:` E2E tests were shown red on the uncommitted tree (4 failed on an expectation, 152 others passed), green on the uncommitted tree after the page changed (156 passed), and committed only then. The six gate rows are at 0 and the full run is 230 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run in 110 projects, every project at its total in `175-08-close` but the new one, at 8 against 4. The refused-name and failed-save outcomes are proven by component cases only: no test of this plan produces either in a browser.**

## Performance

- **Duration:** about 39 min (18:20Z → 18:59Z)
- **Tasks:** 3 of 3
- **Files:** 1 created, 25 modified (1699 lines added, 135 removed)

## Commits

| # | Commit | Subject |
|---|---|---|
| 1 | `77208ea9c` | `test(175-09): the profile's fixture steps and the state steps of the organization-editing spec` (Task 1 step 2) |
| 2 | `3b595ab55` | `test(175-09): the profile page's name states, fields and colour by entity type` (Task 2, red) |
| 3 | `0b96a97b0` | `feat(175-09): Input admits an autocomplete token for its control` (deviation 4) |
| 4 | `c07e1fdf7` | `feat(175-09): the profile's identity section, name fields and colour by entity type` (Task 2, green) |
| 5 | `0d15d9565` | `chore(175-09): four message keys the profile page no longer reads` (Task 2 step 3) |
| 6 | `920543d6e` | `test(175-09): the profile page's three save outcomes` (Task 3, red) |
| 7 | `b6516078e` | `feat(175-09): the profile page tells a saved, a refused and a failed save apart` (Task 3, green) |
| 8 | `59abffb43` | `refactor(175-09): one rule for a missing required name, for the context and the profile page` (the checklist's finding) |
| 9 | `e090cddeb` | `test(175-09): the profile of an organization and of an unconfirmed candidate` (Task 3 step 6, after the green verdict) |

Each was made by pathspec. The orchestrator's `1013217aa` (`docs(state)`) is the plan's base; no other agent's commit sits between these nine. The spec was uncommitted from Task 1's step 3 to commit 9 and was in no commit before it.

## Each task's verify command, with its real exit status

The three `<automated>` blocks were written to script files by a script that reads the plan file, and each file was compared with the plan's block afterwards: byte-identical, all three. Evidence: `tests/e2e-runs/175-unit/175-09-t<N>-verify.sh` / `.log` / `.exit` / `.head`.

| Verify | Head | Exit | What it showed |
|---|---|---|---|
| **Task 1, as written** | `77208ea9c` (spec uncommitted) | **0** | the five searches; both fixture files committed; `typecheck:tests`; ESLint; the kept copy holds a `profile:` test; the spec holds none at the control's head; `control 175-09-control … --red "profile:"` PASS |
| **Task 2, as written** | `0d15d9565` (spec uncommitted) | **0** | the three reads and the three negative searches; red head `3b595ab55` before the page's commit `c07e1fdf7`; the red report holds a failed case; the regenerated key type has no diff; namespaces 634 keys, 0 violations; frontend unit 175 files / 3042 tests passed; `check` 2133 files, 0 errors, 0 warnings; comment hygiene 0 |
| **Task 3, as written** | `e090cddeb` (clean tree) | **0** | the four reads and the negative search; red report 10 failed / 21 passed, green 0 failed of 31; the spec holds `profile:` at HEAD and none at the pre-commit run's head; `control 175-09-precommit … --green --were-red-in 175-09-control` PASS; both refusals non-zero; `gates 175-09-close --rows …` PASS; `e2e 175-09-close …` PASS |

No verify stage had a defect, and no check was edited.

## The control, the green proof and the runs

All E2E runs were made in the background on AC power (100 %), with no void marker and no Sleep entry in any window.

| Label | Tree | Head | Result | Verdict |
|---|---|---|---|---|
| `175-09-control` | fixtures committed, spec's four `profile:` tests in the working tree, page unchanged | `77208ea9c` | wrapper exit **1**; 156 tests: **152 passed, 4 failed**, 0 flaky, 0 skipped, 0 did not run | `control … --red "profile:"` **exit 0, PASS** (`175-09-control.verdict.txt`) |
| `175-09-precommit` | the page as committed, the same spec still uncommitted | `59abffb43` | wrapper exit **0**; **156 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run; Playwright 4.5 min; largest heartbeat lateness 93 ms | `control … --green --were-red-in 175-09-control` **exit 0, PASS** (`175-09-precommit.verdict.txt`): 8 of 8 in the project, each of the four red titles "was red, now passed" |
| `175-09-close` | committed, clean | `e090cddeb` | driver exit **0**; **230 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run; **110 projects**; Playwright 5.3 min; 18:49:10Z → 18:55:10Z; largest heartbeat lateness 88 ms; the dev-server log holds no Svelte warning | `e2e … --same-projects-as 175-08-close --except perm-organization-editing=+ --expect-project …` (five projects) **exit 0, PASS** (`175-09-close.verdict.txt`) |

Each was the first attempt under its label: no `-rN` run exists, none was void and none but the control was red.

**The four red tests of the control**, each with the first line of its error. All four failed at the same step, `contestantProfilePage.expectIdentity`, on `Locator: getByTestId('contestant-profile-identity') — Expected: visible — Timeout: 5000ms — element(s) not found`, after their state step and `open()` had passed:

1. `profile: a confirmed organization reads its name and short name in every seeded locale, locked` — `Error: expect(locator).toBeVisible() failed`
2. `profile: a confirmed organization sets a colour and saves it, its names still locked` — `Error: expect(locator).toBeVisible() failed`
3. `profile: an unconfirmed organization fills in its required name, a short name and a logo, and the menu names it by the saved name` — `Error: expect(locator).toBeVisible() failed`
4. `profile: an unconfirmed candidate changes its first and last name and saves them, and has no colour field` — `Error: expect(locator).toBeVisible() failed`

**The kept copy and the committed spec:** `tests/e2e-runs/175-e2e/175-09-control.spec.ts` is identical to the spec committed in `e090cddeb` (`diff`, before the commit). No expectation of a `profile:` test changed between the control and the commit, so the red did not have to be made again.

**The two refusals on the kept red control** (Task 3 step 7):

1. `control 175-09-control … --green` → **exit 1**: `FAIL the Playwright status is 1, not 0` and one `FAIL … : failed` line for each of the four tests; `175-verdict control 175-09-control --green: FAIL (5)` (`175-09-control.refusal-green.txt`).
2. `e2e 175-09-control --allow-slice --expect-project perm-organization-editing` → **exit 1**: `FAIL failed is 4`, `FAIL the run's exit file holds 1`, `FAIL the run was made on an uncommitted tree (…): such a run is judged with control, not e2e`, `FAIL … is stale`, `FAIL project 'perm-organization-editing' passed 4 of 8`; `175-verdict e2e 175-09-control: FAIL (5)` (`175-09-control.refusal-e2e.txt`).

**Gate rows `175-09-close`** — `tests/e2e-runs/175-gates/175-09-close`, head `e090cddeb`, driver exit 0, no Sleep entry in the window.

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 18 | |
| lint | 0 | 44 | `yarn lint:check`, every link |
| unit | 0 | 64 | frontend **175 files passed, 1 skipped; 3055 tests passed, 16 skipped** (3021 at `175-08-close`, +34: 31 page cases, 3 name-rule cases); dev-seed 68 files; app-shared 10 files; the harness's own 7 files / 102 tests |
| check-frontend | 0 | 8 | |
| build | 0 | 15 | |
| format | 0 | 18 | |

- `node 175-verdict.mjs gates 175-09-close --rows typecheck,lint,unit,check-frontend,build,format` → **exit 0, PASS** ("not stale: head e090cddeb is tree-equal to HEAD outside .planning/").
- The same without `--rows` → **exit 1** (`175-09-close.refusal-full-set.txt`).
- `175-verdict.mjs scope` and `… hygiene` both exit 0 at `e090cddeb`.

**The full run against `175-08-close`:** 110 projects compared, 0 not as expected. 109 are equal to their plan-08 totals; `perm-organization-editing` is 8 against 4. The five named projects: `perm-organization-editing` 8/8, `contestant-journey` 1/1, `perm-answers-locked` 3/3, `contestant-a11y-scan` 22/22, `contestant-entity-selection` 8/8. 226 + 4 = 230.

**The three unconfirmed candidates of ruling 4, as the run found them.** The base dataset's two selection candidates and the journey's invited candidate now render enabled, required name inputs. No test needed a changed expectation: `contestant-journey` (which reads the invited candidate's first name through `expectStaticInfo` and saves its profile), `contestant-entity-selection` (8) and `contestant-a11y-scan` (22, the candidate profile's entries among them) are each at their plan-08 totals, in the pre-commit run and in the full run. The fixture comment that called the input disabled is corrected.

## What was built — every name

### The page (`ENTITY/profile/+page.svelte`)

**Structure, in document order.**

1. `PreventNavigation`, unchanged: active while the store has unsaved data and answers are not locked.
2. The note: the answers-locked `Warning`, whose "hidden because answers are missing" sentence now reads `appSettings.entities.hideIfMissingAnswers[descriptor.hideIfMissingAnswersKey]`; or the completed message.
3. The instructions: `descriptor.instructionsNoQuestions` when `questionsReady` is true and there is no opinion question, otherwise `descriptor.instructions`.
4. **The identity section**, `<section data-testid="contestant-profile-identity" data-entity-type data-name-state>`:
   - `<h2>` — `descriptor.identityTitle`;
   - `<p id="profile-name-note" data-testid="contestant-profile-name-note">` — the name sentence, `descriptor.nameSentence.editable` or `.locked`; **not rendered** in the `locked-answers` state;
   - `<p>` — `dynamic.contestantAppBasicInfo.identity.lockedInfo`, only when a locked info question is listed;
   - the stacked fields, one `Input type="text-multilingual"` for each descriptor field of that kind, in a `gap-md` column, rendered only when there is one;
   - one `InputGroup` holding the single-line fields (`Input type="text"`) and then the locked info questions, rendered only when it has a row.
5. The nominations section, as it was but for `descriptor.nominationsDescription` and `descriptor.electionSymbolLabel`.
6. The editable section: the image (`descriptor.imageLabel`, `descriptor.imageInfo`), the colour when `descriptor.colorField.offered`, the editable info questions.
7. The primary actions: the required-fields note, **the alert region**, and the buttons in a `<div>` the page holds a reference to.

**Test ids and state attributes.**

| Where | Attribute | Values |
|---|---|---|
| the identity `<section>` | `data-testid="contestant-profile-identity"` | |
| | `data-entity-type` | `candidate`, `organization`; **absent** while the selected entity is not known |
| | `data-name-state` | `editable`, `locked-confirmed`, `locked-answers` |
| the name sentence | `data-testid="contestant-profile-name-note"`, `id="profile-name-note"` | present in `editable` and `locked-confirmed` only |
| a candidate's two `<input>`s | `data-testid="profile-first-name"`, `"profile-last-name"` | with `autocomplete="given-name"` / `"family-name"` in every state, and `aria-required="true"` while editable |
| an organization's two field containers | `data-testid="profile-name"`, `"profile-short-name"` | through `containerProps` |
| the colour | `data-testid="profile-color"` on the container, `"profile-color-hex"` on the hex `<input>` | an organization alone |
| the image | `data-testid="profile-image-upload"` on the container | unchanged |
| the alert region | `data-testid="profile-save-message"`, `role="alert"` | always rendered |
| | `data-outcome` | `failed`, `name-refused`; **absent** while the region holds no message |
| the buttons | `profile-submit`, `profile-cancel`, `profile-return` | unchanged |

**How a joined row and a stacked field are told apart without naming a type:** by the field's own `inputType` in the descriptor. `descriptor.identityFields.filter((field) => field.inputType === 'text-multilingual')` are the stacked fields and `… === 'text'` the rows of the group. The page compares an `Input` kind, never an entity type; it holds no `{#if}` and no ternary on the type, and the store-derived flag is gone.

**What each field takes.** `label`, test id, `autocomplete` and (while editable) `info` from the descriptor field; `locked={!nameEditable}`; `required` when the name is editable and the field's rule is not `'never'`; `requiredLocale={requiredNameLocale()}` when the name is editable and the rule is `'requiredLocale'`; `onShadedBg`; `aria-describedby="profile-name-note"` while the sentence is rendered; a multilingual field also `multilingualInfo=""`. Values: a multilingual field reads `userData.current?.localizedNames?.[property]`; a single-line field reads `userData.current?.entity[property]` and, while the store is empty, `contestantCtx.selectedEntity[property]`, which is why a candidate's names are in the server-rendered markup. On change the page calls `userData.setProperty(property, $state.snapshot(value))`.

**The colour.** `value={userData.current?.entity.color?.normal}`, `locked={contestantCtx.answersLocked}`; on change `userData.setProperty('color', { normal: value })` for a string and `null` otherwise.

**The name rule on this page.** `nameState` and `isNameEditable` over the selected entity and `contestantCtx.answersLocked`. The entity handed to the rule is `contestantCtx.selectedEntity`, or `{ confirmed: true }` once a save of that entity's names was refused (`nameRefusedFor`, the refused entity's id).

**`allRequiredFilled`** is also false while the name is editable, the store holds the entity and a required name field is missing in the current values, unsaved edits included. `canSubmit` is `status !== 'loading'`, unchanged: a missing name never disables Save.

**`handleSubmit`.** Clears the region; `await userData.save()`, with a rejection logged and never shown; then:

| Outcome | What the page does |
|---|---|
| `{ type: 'success', listedPropertySaved: false }` | `goto(submitRouting.submitRoute)` |
| `{ type: 'success', listedPropertySaved: true }` | `await invalidateAll()` with the button still "Saving…", then `goto` |
| `{ type: 'nameRefused' }` | records the entity as refused; region ← `t(descriptor.nameRefusedMessage)`, `data-outcome="name-refused"`; `await invalidateAll()`; stays; focus on Save |
| `{ type: 'failure' }`, or a rejection | region ← `t('contestantApp.error.saveFailed')`, `data-outcome="failed"`; no re-read; stays; focus on Save |

A re-read that rejects is logged and is not a failed save: the success path still navigates, and the refused path keeps its message. Focus is returned with `await tick()` and then `.focus()` on the element `[data-testid="profile-submit"]` inside the buttons' `<div>`.

**The four prohibitions, read on the committed file:** no reactive accessor is destructured and `dataRoot` is read in place; no comparison of a type with `'organization'` or `'candidate'`; no `view-transition-name`; no `+page.ts` or `+layout.ts` added. The nominations block is where it was.

### The shared rule (`lib/contestant/utils/nameRule.ts`)

```ts
export type NameFieldValues = {
  text: Partial<Record<IdentityFieldDescriptor['property'], unknown>>;
  byLocale: Partial<Record<IdentityFieldDescriptor['property'], LocalizedString | null>>;
};
export function isRequiredNameMissing(
  field: Pick<IdentityFieldDescriptor, 'property' | 'required'>,
  values: NameFieldValues
): boolean;
```

`'always'` → `isBlankText(values.text[property])`; `'requiredLocale'` → `missingRequiredLocale(values.byLocale[property], requiredNameLocale())`; `'never'` → `false`. The context applies it to the saved names (`{ text: savedEntityData, byLocale: savedLocalizedNames ?? {} }`) and the page to `userData.current`. The context's own copy of the switch, and its imports of the two text helpers, are gone.

### `Input`

```ts
// InputPropsBase
autocomplete?: HTMLInputAttributes['autocomplete'];
```

It is not destructured: it reaches the control in the rest props, as the component's documentation says an element's attributes do. The `@component` block names it.

### The catalogues

`common.candidatePortrait` and `dynamic.contestantAppBasicInfo.immutableData.title`, `.ingress`, `.emptyPlaceholder` are removed from all seven locales. **Each catalogue holds 634 keys** (638 before; counted over every file of each locale, and by `assert:i18n-catalog-namespaces`: 634 total; `contestantApp.*` 182, `adminApp.*` 121, other 331). The generated key type lost the four members.

**Readers and docs mentions of the removed keys:** `git grep -n -F -e "common.candidatePortrait" -e "contestantAppBasicInfo.immutableData" -- apps/frontend/src tests/tests apps/docs/src` printed only the generated key type once the page had changed; a search of the whole repository outside `.planning/` and the catalogues agrees. **No page under `apps/docs/src` names any of the four**, so nothing is recorded for plan 175-13 on that count.

### The profile fixture (`contestantProfilePage.fixture.ts`)

Every id is read from `testIds`, every locator is inside the fixture, every new assertion is hard. Existing steps keep their signatures.

| Step | What it does |
|---|---|
| `open()` | `goto` the entity-less profile route in `en`, then wait until the nominations block lists a nomination (`TIMEOUTS.slowPage`) |
| `reload()` | `page.reload()`, then the same wait |
| `expectIdentity({ entityType, nameState })` | the section visible (`TIMEOUTS.page`), then its two attributes |
| `expectNameNote(present)` | the sentence visible, or absent from the visible section |
| `fillName(locale, text)`, `fillShortName(locale, text)` | the locale's field enabled, then fill and blur, through the multilingual fixture scoped to the container |
| `expectName(locale, text)`, `expectShortName(locale, text)` | `toHaveValue` on the locale's field |
| `expectNamesLocked()`, `expectNamesEditable()` | in both containers: a field in that state is visible and none is in the other |
| `expandNameTranslations()` | the toggle of the name and of the short name |
| `expectNameRequiredBadge(present)` | the name container's text holds "Required" not followed by " language", or does not |
| `fillFirstName(text)`, `fillLastName(text)` | enabled, fill, blur |
| `expectPersonNames(firstName, lastName)` | `toHaveValue` on both |
| `expectPersonNamesEditable()` | both enabled |
| `setColor(hex)`, `clearColor()` | the hex field: enabled, fill, blur |
| `expectColor(hex)` | `toHaveValue`; `''` is no colour |
| `expectNoColorField()` | the identity section visible, then no `profile-color` |
| `uploadLogo(path)`, `expectLogo()` | the existing file-chooser step; an `<img>` in the image container |
| `save({ expect: 'navigation' \| 'message' })` | Save enabled, click, then the URL outside `/profile`, or the region with a `data-outcome` (`TIMEOUTS.slowPage`) |
| `expectSaveMessage(outcome)` | the region's `data-outcome`, and that it is not empty |
| `expectSaveFocused()` | `toBeFocused` on Save |

Exported types: `ProfileNameState`, `ProfileSaveOutcome`. `multilingualTextField` gained `localeField(scope, locale): Locator`.

### The state steps and the composition root (`fixtures/contestant/perm-organization-editing.ts`)

```ts
export interface OrganizationState {
  confirmed?: boolean;
  name?: Readonly<Record<string, string>>;
  shortName?: Readonly<Record<string, string>> | null;
  color?: Readonly<{ normal: string; dark?: string }> | null;
  image?: null;                       // null removes the logo
  clearAnswers?: ReadonlyArray<string>; // external ids of questions
}
export interface CandidateState { confirmed?: boolean; firstName?: string; lastName?: string }

export async function setOrganizationState(externalId: string, state: OrganizationState): Promise<void>;
export async function setCandidateState(externalId: string, state: CandidateState): Promise<void>;
export async function setAnswersLocked(on: boolean): Promise<void>;
export function groupTitleNaming(name: string): RegExp;
```

Each state step is a plain exported `async` function that makes its own service-role client, so code that is handed a page alone can call it. Each writes only the members it is given, in one `update` of the row; a call with no member writes nothing. `setOrganizationState` resolves the row by external id, and for `clearAnswers` reads the stored answers and the questions' ids and writes the answers without those keys. `setAnswersLocked` is `updateAppSettings({ access: { answersLocked: on } })`. The freeze of a confirmed entity's names does not bind them: `enforce_entity_immutability` returns at once for any role but `authenticated`.

The `test` object gained two fixtures: `contestantProfilePage` and `navMenu`.

### The spec's four tests

In a second top-level describe, `perm-organization-editing: the profile`, one nested describe per session:

| Session | Title | State step | What it asserts |
|---|---|---|---|
| confirmed organization | `profile: a confirmed organization reads its name and short name in every seeded locale, locked` | `{ confirmed: true, name, shortName }` as seeded | organization, `locked-confirmed`; the sentence; `en` and `fi` of both fields with translations expanded; every field disabled |
| confirmed organization | `profile: a confirmed organization sets a colour and saves it, its names still locked` | `{ confirmed: true, color: null }` | empty hex field; `#2546A8` typed shows `#2546a8`; the save navigates; after a fresh load the colour is shown and the section is still `locked-confirmed` |
| unconfirmed organization | `profile: an unconfirmed organization fills in its required name, a short name and a logo, and the menu names it by the saved name` | `{ confirmed: false, name: { fi }, shortName: null, image: null, color: null }` | `editable`; the sentence; the badge; fields enabled; `en` and `sv` names and an `en` short name filled; the badge gone; a logo chosen and shown; the save navigates; **the menu's group title ends with the saved `en` name on the page the save led to**; after a fresh load all four values and the logo, and no badge |
| unconfirmed candidate | `profile: an unconfirmed candidate changes its first and last name and saves them, and has no colour field` | `{ confirmed: false, firstName, lastName }` as seeded | candidate, `editable`; the sentence; the seeded names, enabled; no colour field; both changed; the save navigates; after a fresh load the new names |

Each opens with its state step, then `open()`, then `expectIdentity`. None confirms an organization mid-test and none reads the voter app.

## Task 2 — the cases that were red

**Red at `3b595ab55`** (`175-09-page-red.json`, exit 1): 21 cases, **20 failed, 1 passed**, every failure an `AssertionError`; the page mounted in all of them. The one that passed is "reads the standard instructions when the entity has an opinion question to answer", which the candidate's fixed sentence already satisfied.

The 20, by group: a candidate (4) — confirmed before the store holds its data, unconfirmed and required, the in-row badge on a blank first name, the image's label; an organization (4) — editable with the required locale, no badge once the default locale holds a name, locked for a confirmed one with its colour editable, locked under the answers lock with no sentence; a selected entity that is not known (1); the locked info questions (3) — none listed, one listed with the type's placeholder, a candidate's names and locked questions in one group; what an edit hands the store (6) — a name, a short name, nothing on expanding the translations, a candidate's first name, a colour, an emptied colour; the instructions (2) — the organization's standard and no-questions variants.

**Green at `c07e1fdf7`** (`175-09-page-green.json`, exit 0): 21 of 21.

## Task 3 — the cases that were red

**Red at `920543d6e`** (`175-09-save-red.json`, exit 1): 31 cases, **10 failed, 21 passed**. All ten new cases failed on an expectation, and the 21 of Task 2 passed.

1. holds an empty alert region before any save
2. navigates without reading the list again when no listed property was stored
3. reads the list again before it navigates when a listed property was stored, and keeps saving until then
4. navigates and reports no failure when the list cannot be read again after a stored save
5. stays, says that the name was refused in the entity's own sentence, and reads the list again
6. says a candidate's refused name in the candidate's sentence
7. locks the name fields after a refused name even when the list cannot be read again
8. stays and says that the save failed when the store reports a failure
9. stays and says that the save failed when the save rejects, without the rejection's text
10. empties the region when a second save starts

**Green at `b6516078e`**, and again at `59abffb43` after the refactor (`175-09-save-green.json`, exit 0; the report taken at `b6516078e` is kept as `175-09-save-green.at-b6516078e.*`): 31 of 31. The test file is identical at `920543d6e` and at HEAD.

## Assumption A4

*Re-reading the loads with `invalidateAll()` after a save reruns the entity-level load without remounting the page or losing its message.*

**Not falsified; and not proven in a browser for the refused path.** What this plan has:

- **A component case** (case 5 above): the fake `invalidateAll` does what the rerun loads would — the listed entity becomes confirmed and the store holds the stored names again — while its promise is still pending and after it settles. The message region is the same element before and after, with the same sentence and outcome; the name fields are locked and show the stored names; nothing navigated. This shows that the page's own state survives the data change. It cannot show that the route tree keeps the page mounted, because `invalidateAll` is a spy.
- **A reading of the three layouts above the page.** The root layout's `ready` and the entity layout's `layoutState` are pure derivations of resolved load data and yield a loading view for invalid data only; the protected layout swaps the page for a gate only when the load returns one. The entity layout's effect calls `userData.init` with the re-read data, which keeps the store for the same entity. Nothing in them remounts the page on a rerun.
- **A browser run of the success path**: the unconfirmed organization's test saves a name and a logo, the page re-reads and navigates, and the menu shows the saved name before any reload. A remount during the re-read would not fail that test, so it proves the re-read and not the absence of a remount.

The falsifier the plan names — the refused save finding no message, or the fields redrawn empty, after the re-read **in a browser** — is plan 175-12's refusal step. The fallback (a dependency key of its own on the user-level load) was not needed and not built.

## The code review checklist

Over the page, its test, the fixtures, the state steps and the spec's four tests. Recorded before the pre-commit run; the one finding was fixed before it.

| Item | Outcome |
|---|---|
| Solves the issue | yes: an organization has its name, short name, logo and colour on its profile, and a candidate's names follow the one rule. The refused and failed outcomes are unit-proven only |
| OWASP top 10 | T-175-44: the region renders catalogue sentences alone; a rejection's message is logged and a case asserts that no word of it is rendered. T-175-43: the page's lock is presentation, and after a refusal the page locks the names by itself. T-175-46: every field and the colour come from the descriptor and the one rule, with a case for each state and for an unknown entity. The colour reaches the store as `{ normal }` from a value `Input` already held to `#rrggbb`. No new input path writes markup |
| Code style guide | `Array<T>`, explicit return types, TSDoc on every new function, constant, type and step. One exported function takes two positional parameters of different types (`setOrganizationState(externalId, state)`), as the plan writes it |
| No `any` | none. Three casts, each named: `value as Exclude<EditableEntityProps[…], undefined>` on what `Input`'s `onChange` hands over as `unknown`; `source as Record<string, unknown>` after `Object.hasOwn` in `memberOf`; `as unknown as ContestantUserData<true>` on the test's fixtures, as its siblings do |
| No repetition | **Finding, fixed in `59abffb43`:** the page carried its own switch over a field's required rule beside the context's; it is `isRequiredNameMissing` once, with three direct cases. Not fixed: `open()` is the third place that waits for a profile to be usable, beside the 500 ms wait of `uploadPortrait` and the bare `page.goto` of two specs |
| New entities documented | the page's `@component` block; every script member; `Input`'s `autocomplete` in the type and the docstring; the fixture's header and steps; the composition root's header, types and functions |
| Repo markdown | none names what changed: no docs page holds a removed key, and `tests/README.md` describes the dataset and its sessions, not steps |
| **Tracking events** | **None added.** The page lets a user edit a name, a short name and a colour. `git grep -n -e "startEvent" -e "track(" -- apps/frontend/src/routes/contestant apps/frontend/src/lib/contestant` prints 11 lines: nine are `untrack(` calls (in the two layouts, the pre-registration page, four tracking tests and two component tests), and two are `startEvent: () => undefined` in the fake contexts of `gateFocus.svelte.test.ts` and `page.svelte.test.ts`. **The Contestant app emits no tracking event for any of its edits** — not for an answer, an image or a save — so the new ones follow that form and emit none (`tests/e2e-runs/175-unit/175-09-tracking-search.txt`) |
| New Svelte components | none |
| Errors handled and logged | a rejected save and a rejected re-read are each logged at `error` with the page's name; the inline message logs itself through `ErrorMessage` |
| Failing checks | none at the close. Two commits hold a failing unit file by the plan's own order (deviation 9) |
| Parts sharing the dependency | `Input`'s new prop is optional and not destructured, so every caller is as it was; the context's name clause is the same rule through the shared function (its 15 cases pass); the full run holds every other project at its total |
| WCAG A/AA, keyboard and screen reader | 4.1.3: one `role="alert"` region present from the first render; 2.4.3: focus returned to Save after a save that stays; 1.3.1 / 4.1.2: the sentence is the fields' description, the required state is programmatic; 1.3.5: the two autocomplete tokens in every state. `contestant-a11y-scan` is 22/22 over the changed candidate profile. **Not done:** an axe scan of an organization's profile, which is plan 175-12's, and a reading of the page with a screen reader |
| Docs guides | the generated pages of `Input` and of this route restate docstrings that changed; plan 175-13 regenerates them |
| Comment hygiene | every added or changed comment read; `yarn assert:comment-hygiene` exit 0 on the working tree before each of the nine commits |
| Commit history | linear: test, test, feat, feat, chore, test, feat, refactor, test |
| No fixes of itself | `59abffb43` rewrites the required-name block `c07e1fdf7` added to the page, for the checklist's finding |
| Formatting in its own commit | none |
| `[db]` tag | no database change |
| Backend, adapter and Edge Function sections | name nothing this plan touches |

**The components skill's re-check list:** no component was added, removed, renamed or moved. `Input` gained a prop with its docstring line and `.type.ts` entry. `generate:docs` is plan 175-13's. `.claude/skills/components/` was read and not edited: nothing in it counts `Input`'s props or names this page.

## Each fallback's status

- **U-05** (a candidate's first and last name required while editable). Built as ruled; not exercised. This plan's part under the fallback: two cases of the page's test change — "renders both name inputs enabled and required for an unconfirmed candidate" loses its `aria-required` expectation and "shows the in-row required badge on a blank first name of an unconfirmed candidate" expects no badge — and no line of the page changes, because the page reads `required` from the descriptor field.
- **U-12** (a refused name does not cost the other edits). Built as ruled; not exercised. Nothing of this plan changes under the fallback: the page renders the outcome and the sentence it is given.
- **U-30** (the unconfirmed candidate as the third identity). Built as ruled; not exercised. This plan's removable parts are one block each: the describe "as the unconfirmed candidate's editor" with its one test and the constant `ENTERED_CANDIDATE` in the spec; `setCandidateState` and `CandidateState` in the composition root. The fixture's four candidate steps serve any candidate profile and would stay.

## Deviations from Plan

**1. The required-badge step is `expectNameRequiredBadge(present)`, not `expectRequiredBadge(present)`.** The fixture already has `expectRequiredBadge(label)` for an info question, and the plan also says existing steps keep their signatures. The two cannot share a name.

**2. The fixture gained `open()` and `reload()`, which the plan's list does not name.** A test has to reach the page, and has to do so without racing hydration: the suite has no hydration signal, and an edit made before the page hydrates reaches no handler. `open()` waits for the nominations block to list a nomination, which is rendered only from the store, and the store is filled by an effect after hydration. **Phase 176 changes that block**: if a nomination is no longer listed there, this wait is what breaks, by name.

**3. `tests/tests/fixtures/shared/multilingualTextFieldFixture.fixture.ts` gained `localeField(scope, locale)`**, a file the plan does not list. The plan asks for the name steps "through the multilingual field fixture"; that fixture could fill a locale's field and not read one, and its locale registry is private.

**4. [Rule 3] `Input` gained an `autocomplete` prop** (`Input.type.ts`, `Input.svelte`'s docstring; commit `0b96a97b0`), two files the plan does not list. `autocomplete={field.autocomplete}` on `Input` is a type error: `InputPropsBase` extends `HTMLAttributes<HTMLElement>`, which has no such member (`check` exit 1, measured). The alternative that type-checks without touching `Input` is an object spread, which passes because a spread is not checked for excess members; that is a bypass and was not kept. `check` is at 0 errors with the prop, so the union did not become too complex.

**5. The alert region has no margin of its own.** The UI contract's sketch puts `mb-lg mt-md` on the region. It is always rendered, so those classes would add that space above the Save button on every profile, with no message. The classes are on the `ErrorMessage` inside it, where they were.

**6. After a refused name the page locks the names by itself.** The plan has the fields turn locked through the re-read of the list. The UI contract also says they must not stay editable when that re-read fails. The page records the refused entity's id and hands the name rule `{ confirmed: true }` for it: a refusal is raised only for a row that is confirmed. Case 7 holds it.

**7. A rejected re-read is caught and logged.** The plan says a failed re-read "is not caught into a save failure". It is caught so that the handler goes on — the success path still navigates and the Save button does not stay in its saving state for good — and it produces no save-failure message. Case 4 holds it.

**8. `handleSubmit` no longer sets the status to `error` when it is called while a save is in flight.** It did, which would have ended the in-flight save's saving state. The button is disabled then, so no user reaches the branch.

**9. Two commits hold a failing unit file: `3b595ab55` and `920543d6e`.** They are the red commits of Tasks 2 and 3, as the plan orders them. At each the frontend's unit suite fails in `profile/page.svelte.test.ts` alone, and the next `feat` commit makes it pass. No E2E test was committed red.

**10. A ninth commit, `59abffb43`**, for the checklist's finding, as Task 3's step 4 allows. It touches `nameRule.ts`, `nameRule.test.ts` and `contestantContext.svelte.ts`, which the plan does not list.

**11. `data-entity-type` is absent for a selected entity that is not known.** The contract lists two values. For an unknown entity the descriptor's fallback renders a candidate's fields, and the attribute says what is true: no type is known.

**12. `OrganizationState.image` admits `null` alone.** The plan lists the member; a test needs "no logo", and a logo is stored by uploading one on the page.

**13. The composition root also exports `groupTitleNaming(name)`** and registers `navMenu`. The spec holds no locator and builds no pattern itself.

**14. The green reports were taken on the commits that hold the code**, after each commit; each suite had passed on the working tree first.

**15. One exit status was read through a pipe, once.** My first `svelte-check` of the red test file was piped through `tail`, so its status was not the command's. The output said 0 errors. Every status recorded in this file was read from the command itself, and `check` was run again, unpiped, before each later commit.

**Not recorded in `.planning/WINDOWS.md`:** there is no stub and no skipped test; the ledger is a shared planning file, as plans 01 to 08 left it. What would go there is the list below.

## What was not done or not verified

- **The refused-name and failed-save outcomes were not produced in a browser.** The region, the sentence, the focus on Save and the fields turning locked are held by ten component cases against a fake context. Plan 175-12 asserts the refusal in a browser.
- **Assumption A4 is not proven for the refused path in a browser** (above).
- **Five fixture steps and two state-step paths were run by no test:** `reload()`, `clearColor()`, `expectSaveMessage()`, `expectSaveFocused()` and `save({ expect: 'message' })`; `setAnswersLocked()` and `setOrganizationState(…, { clearAnswers })`. They type-check and lint; plans 175-10 to 175-12 are their first callers.
- **The plan's two backstops are open.** A long locked name at 320px was not looked at. The failed re-read after a stored save is held by a component case with a rejecting spy, not by a failing load.
- **No axe scan of an organization's profile**, and no measurement at 320 or 390 px: both are plan 175-12's. The colour row and the two-field name stack were driven by the suite and seen by nobody.
- **The answers-locked state of an organization's profile** has a component case and no browser test here.
- **The guard was not exercised with a staged name, colour or logo in a browser.** `PreventNavigation` is unchanged and reads the store's `hasUnsaved`, which plan 175-07's unit cases hold.
- **`saveMessage` is not cleared when the route's params change under a mounted page.** No link of the app leads from one entity's profile to another's without leaving the route.
- **The privacy statement is as it was**, by the orchestrator's instruction.
- **`GEN-01` and `GEN-03` are not marked complete by this plan**: the questions, the home and menu, and the preview are plans 175-10 and 175-11, and the confirmation sequence is 175-12's. `requirements-completed` is empty on purpose.

## What the next plans should know

**Every test of the spec** begins `await setOrganizationState(…)` or `setCandidateState(…)`, then `contestantProfilePage.open()` (or its page's own opener), then its first expectation. Import the three state steps, `groupTitleNaming` and `test` from `tests/tests/fixtures/contestant/perm-organization-editing.ts`.

**The dataset after this plan's four tests have run** (until its teardown): organization A is confirmed with its seeded names and the colour `{ normal: '#2546a8' }`; organization B is unconfirmed with `name` `{ fi: '[OR-B] Vahvistamaton puolue', en: '[OR-B] Renamed Party', sv: '[OR-B] Omdöpt parti' }`, `short_name` `{ en: 'ORB' }` and a logo; the candidate is `[CA-U] Renamed` `Person`. A later test that reads any of these sets it first. The `dataset:` tests run before them in file order and read the seeded rows.

**175-10 (questions, home, nav).**
- The profile's Save leads to the questions route for an entity with unanswered opinion questions and all required fields filled, and to the entity's home otherwise. Organization B's missing `en` name makes `allRequiredFilled` false, so before its name is filled its Save reads "Save and Return".
- The page's instructions already take the no-questions variant on a known zero; the candidate of this dataset is that case.
- `isRequiredNameMissing(field, { text, byLocale })` is exported if the home needs to say why a profile is incomplete.

**175-11 (preview).** The page hands the store `{ normal: '#rrggbb' }` or `null` for the colour, so after a save `userData.current.entity.color` is what the writer's read-back gives, and before any save it is the stored value unparsed. Organization B has a logo after this plan's test and organization A has none.

**175-12 (E2E).**
- **The refusal step:** set B unconfirmed with the state step; `open()`; `fillName(…)`; then `setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, { confirmed: true })` — one write, and it publishes B, because its nomination is confirmed; `save({ expect: 'message' })`; `expectSaveMessage('name-refused')`; `expectSaveFocused()`; `expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' })`; `expectNamesLocked()`. Set B unconfirmed again in a `finally`, or the tests after it find it published. This step is also the browser proof of assumption A4.
- With `requiredLocale` in effect and the displayed locale equal to the required one (the suite opens `/en/`), **one** field is visible before the toggle; `expandNameTranslations()` shows three (`en`, `fi`, `sv`).
- `expectNamesLocked()` and `expectNamesEditable()` need at least one rendered field in each container, which a multilingual field always has.
- `expectNameRequiredBadge` reads English text, as `open()` loads `/en/`.
- A scan entry's `reach` can call the state steps directly; they take no fixture.
- Reach markers: `profile-name` exists for an organization alone, and `contestant-profile-identity` with `data-name-state="locked-answers"` is the answers-locked state. Wrap `setAnswersLocked(true)` in a `finally` that sets it back: the setting is the suite's one settings row.
- The alert region is always in the document and empty; an axe entry sees an empty `role="alert"` element.

**175-13 (docs and close).**
- Docstrings that changed: this route's `@component` block (both entity types, the two settings it reads) and `Input`'s (the `autocomplete` property). Their generated pages are stale until `generate:docs`.
- The four route docstrings that say "`entities.hideIfMissingAnswers.candidate`: Affects message shown": this page's now says the key is that of the selected entity's type; the other three follow plan 175-10.
- No docs page names a removed key.
- The determinism batch runs four tests that write: each resets what it reads, so three isolated runs start from the same state.
- `resultsPage.openEntityDetailsForCard` and the profile's hydration wait are two workarounds a shared step could replace.

**Phase 176 (nominations).** `contestantProfilePage.open()` waits on a `group` inside `contestant-profile-nominations`. When that block changes, give `open()` another thing only the filled store renders, or a real hydration signal.

**Phase 179.** `isRequiredNameMissing` and `NameFieldValues` are in `nameRule.ts`; `Input` takes `autocomplete`.

**Orchestrator.** Nothing in `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` or `CLAUDE.md` was edited; `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted; nothing under `.planning/phases/176-*` was touched. Open for a ruling: whether the alert region should carry the contract's margins when empty (deviation 5), and whether `data-entity-type` should name `candidate` for an unknown entity (deviation 11).

## The state the local database is left in

Unchanged in kind from plan 175-08's close. No reset was run and no schema file changed. Read with `psql` after the full run:

- Schema: the tree's. pgTAP's helpers are still in `public`, so `yarn db:types` is valid only after another reset.
- Data: `seed.sql` plus the `default` dataset in the default project (1 election, 328 candidates, 8 organizations), which the gate's `unit` row writes again.
- The E2E project `…00e2` exists and holds no election, candidate or organization: every teardown of the three runs passed. Its settings row reads `access.answersLocked: false`. The empty project `…05c1` exists.
- Auth users: 2, those of `seed.sql`.
- The Supabase stack and Docker were never restarted. `docker builder prune -af` ran three times: once before each of the two wrapper runs and once inside the E2E driver. The Docker VM has 14.3 GiB free.

## Files touched that the plan did not list

- `tests/tests/fixtures/shared/multilingualTextFieldFixture.fixture.ts` (deviation 3)
- `apps/frontend/src/lib/components/input/Input.type.ts`, `Input.svelte` (deviation 4)
- `apps/frontend/src/lib/contestant/utils/nameRule.ts`, `nameRule.test.ts`, `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts` (deviation 10)

Gitignored evidence: under `tests/e2e-runs/175-e2e/`, `175-09-control` with `175-09-control.spec.ts`, `.log`, `.exit`, `.launched`, `.evidence.log`, `.verdict.txt`, `.refusal-green.txt` and `.refusal-e2e.txt`; `175-09-precommit` with its `.log`, `.exit`, `.launched`, `.evidence.log` and `.verdict.txt`; `175-09-close` with its `.log`, `.exit`, `.launched` and `.verdict.txt`. Under `tests/e2e-runs/175-gates/`, `175-09-close` with its `.log`, `.exit`, `.launched`, `.verdict.txt`, `.refusal-full-set.txt`, `.scope.txt` and `.hygiene.txt`. Under `tests/e2e-runs/175-unit/`, `175-09-page-red`, `-page-green`, `-save-red`, `-save-green` (and `.at-b6516078e`), each with `.json`, `.log`, `.exit` and `.head`; `175-09-t1-verify.*`, `-t2-verify.*`, `-t3-verify.*`; `175-09-tracking-search.txt`; and the logs of the checks run before each commit.

## Known Stubs

None.

## Threat Flags

None. The plan's register covers what was added: the page's lock against the database's (T-175-43), the refusal's text (T-175-44), a silent refused or failed save (T-175-45), a field for the wrong type or with the wrong lock on first paint (T-175-46), a stale name in the menu (T-175-47) and a test that passes once (T-175-61). The state steps write with the service role from test code against the local stack alone.

## Self-Check: PASSED

Checked after writing:

- The created test file and the modified files exist; `git diff --name-status 1013217aa e090cddeb -- . ':(exclude).planning'` lists 26 paths: the twelve named above outside the catalogues, and `common.json` and `dynamic.json` of each of the seven locales.
- The nine commits of the table are ancestors of `HEAD`; `git rev-list --count 1013217aa..e090cddeb` is 9.
- `175-09-t1-verify.exit`, `-t2-verify.exit` and `-t3-verify.exit` hold 0, at heads `77208ea9c`, `0d15d9565` and `e090cddeb`; each script is byte-identical to its block of the plan.
- `tests/e2e-runs/175-e2e/175-09-control.exit` holds 1, `175-09-precommit.exit` and `175-09-close.exit` hold 0, and `tests/e2e-runs/175-gates/175-09-close.exit` holds 0; the four verdict files end in PASS and the three refusal files in FAIL; no run directory holds a void marker.
- The four unit reports and their `.head` files exist under `tests/e2e-runs/175-unit/`, with exits 1, 0, 1, 0; the case counts in this file were read from them. The page's test file is identical at `920543d6e` and at `HEAD`.
- The kept copy of the spec is identical to the committed spec.
- `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` are unchanged since `1013217aa`.
