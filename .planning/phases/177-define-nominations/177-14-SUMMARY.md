---
phase: 177-define-nominations
plan: 14
subsystem: frontend-components
tags: [entity-selector, radio-group, nominations, draft, pure-module, a11y, parent-options, editor-facts]
status: complete
requires:
  - "177-13: the gate run 177-13-close (frontend unit 3787 passed and 30 skipped, dev-seed 1050, data 318) and the full run 177-13-close (346 of 346, 116 projects)"
  - "177-09: DesiredNomination, NominationParentChoice, EntityNomination, EntityNominationParent, NominationContest in $lib/api/base/dataWriter.type"
  - "177-08: isNominableInShape, allowedParentTypes, NominationShape from @openvaa/data"
  - "177-12: the descriptor's members and the message keys the selector's callers word the options with"
  - "177-11: the six shared.entitySelector test ids and the steps that read them"
  - "177-01: 177-gates.sh, 177-verdict.mjs, 177-BASE"
provides:
  - "EntitySelector ($lib/dynamic-components/entitySelector): EntitySelectorProps, EntitySelectorOption; test ids entity-selector, entity-selector-option, entity-selector-option-input, entity-selector-option-hint, entity-selector-empty, entity-selector-error; state attributes data-selected-kind, data-option-kind, data-option-value"
  - "$lib/contestant/nominations/editorFacts.ts: nominationsEditableOf, admissibleElectionsOf, inReachNominationsOf; NominationLocks, ElectionShapeFacts, ElectionReachFacts, NominationReachFacts"
  - "$lib/contestant/nominations/nominationDraft.ts: buildCards, parentChoicesOf, somethingToWrite, validateCards, desiredSetOf, draftFactsOf, sameNominations; EditorCard, ParentRule, StoredCardValues, EditorElection, ListedParent, ParentOption, ParentChoices, CardError, CardErrorKind, DraftFacts; NO_PARENT_CHOICE, OTHER_PARENT_CHOICE"
  - "$lib/contestant/nominations/index.ts, the barrel of both modules"
  - "EntitySelector.svelte.test.ts (40 cases), editorFacts.test.ts (17 cases), nominationDraft.test.ts (123 cases)"
  - "the generated component listing (107 components) and the component's generated page"
  - "the gate runs tests/e2e-runs/177-gates/177-14-close (acb08e520) and 177-14-close-r2 (10ebe6b04), seven rows green each"
affects: [177-15, 177-16, 177-17, 177-18, 177-19, 177-20, 177-21]
tech-stack:
  added: []
  patterns:
    - "a single-choice group is a fieldset with the role radiogroup over native radios that share one name; the row's label is an overlay that carries the name, and everything visible in the row is hidden from assistive technology and takes no pointer events"
    - "a page's draft of independently removable items is a list of plain cards built by one pure function; the page changes four members of a card and every rule reads the cards"
    - "what a card's election asks of the entity's parent is stated on the card when it is built, so that the options, the validation and the desired set cannot be given different shapes"
key-files:
  created:
    - apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte
    - apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.type.ts
    - apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte.test.ts
    - apps/frontend/src/lib/dynamic-components/entitySelector/index.ts
    - apps/frontend/src/lib/contestant/nominations/editorFacts.ts
    - apps/frontend/src/lib/contestant/nominations/editorFacts.test.ts
    - apps/frontend/src/lib/contestant/nominations/nominationDraft.ts
    - apps/frontend/src/lib/contestant/nominations/nominationDraft.test.ts
    - apps/frontend/src/lib/contestant/nominations/index.ts
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entitySelector/EntitySelector/+page.md"
  modified:
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md"
decisions:
  - "the hidden part around an entity's card takes no pointer events: the card's own element is positioned and lay above the row's label, so a press on a card chose nothing in the markup as the UI contract writes it (observed in Chromium, in isolation)"
  - "buildCards takes the entity's type beside the plan's three arguments and states on every card what its election asks of the parent (parentRule); parentChoicesOf therefore takes { card, listed, locale } and not an `allowed` argument"
  - "the value of an entity option and of the unlisted option is the entity's id, so a card's parent choice on arrival is known when the card is built, before the parent options are read"
  - "that a candidate must answer its parent group itself, while every other entity type starts at the option that names no parent, is one private function of nominationDraft.ts; the matrix does not tell a candidate in a lists-and-independents election from a party"
  - "desiredSetOf throws for a card that has a parent group with nothing chosen, and for the typed-name option with a blank name; it never reads either as a nomination with no parent"
  - "a stored parent left chosen on a card that stays in its constituency is sent as keep, listed or not; an unchanged `none` or typed name is sent as itself"
  - "sameNominations compares by id, whatever the order, and leaves out the names a nomination is shown with"
  - "the selector's detail snippet is given the chosen option, as the plan's table says, not its value as the UI contract's block writes it"
requirements-completed: []
metrics:
  started: "2026-10-11T05:43Z (not recorded at the start; the first commit is 05:47:16Z)"
  completed: "2026-10-11T06:11:21Z"
  duration: "about 28 minutes"
  tasks: 2
  files: 11
actuals:
  tokens: 30570 # chars/4 over git diff cea7b1f89..10ebe6b04 outside .planning (122,281 characters)
  tasks: 2
  commits: 8 # git rev-list --count cea7b1f89..10ebe6b04
plan_head_before: cea7b1f89825b6eb24ffac08c492cfb767195107
plan_head_after: 10ebe6b042949ae7078a42c73edcf56e591c5734
---

# Phase 177 Plan 14: `EntitySelector`, and the Editor's Predicates and Draft Arithmetic as Pure Modules — Summary

One reusable single-choice group over the existing `EntityCard` — a native radio group with plain options around the cards — and two pure modules that hold every rule of the nomination editor that is not markup: who may edit, which elections admit the entity, which nominations are in reach, which cards there are, which options a card's parent group holds, what is unfinished, and what is sent to the writer. Nothing on the committed tree renders the component or calls the modules.

`requirements-completed` is empty on purpose: the plan's frontmatter names NOM-04, NOM-05 and NOM-06, and this plan builds the parts the editor's pages will be made of; nothing a contestant meets is delivered by it. `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` were not touched.

## Read this first

- **Both verify blocks pass as written**, exit 0 each, on the final head `10ebe6b04`. Neither met one of the four known defects.
- **The UI contract's markup for the selector has a pointer defect, and the component departs from it by one class.** In S7's block the label is an absolute overlay and the card comes after it; `EntityCard`'s own `article` is `relative`, so it is painted above the label and a press on a party's card reached the card and chose nothing. Observed in Chromium on the bare structure: the element at the card's title was the `H4`, and the radio was not checked after a click there; with `pointer-events: none` on the hidden part around the card the element was the `LABEL` and the radio was checked. The component carries `pointer-events-none` on that part. **The UI contract's block is unchanged and still shows the defective form** — a sentence for plan 177-21 or the orchestrator. *Deviations*, 1.
- **One commit of mine went in with the type check red, for 35 seconds.** `350c5c822` was committed while `svelte-check` reported twelve errors in `nominationDraft.test.ts` (a test helper typed for cards was handed desired nominations). I chained the commit on `cat` of the check's exit file instead of on its value. `acb08e520` fixes it; no gate ran in between, and both gate runs are after it. This is the fault 177-12 was reported for, and the dispatch warned of it. *Deviations*, 2.
- **Four signatures differ from the plan's sketch**, each for a stated reason: `buildCards` takes the entity's type; `parentChoicesOf` takes `{ card, listed, locale }`; `validateCards` takes the choices as a map by card key; `desiredSetOf` throws for a card in error. *Task 2* gives them as written, *Deviations*, 3 the reasons.
- **Two gate runs.** `177-14-close` (head `acb08e520`) was green on all seven rows and then made stale by the pointer fix; `177-14-close-r2` (head `10ebe6b04`) is the run of the final tree, green on all seven.
- **Nothing was run in a browser except the isolated probe above.** The keyboard model, the row's fill, the axe scan and the widths are the browser plans' (177-15, 177-17, 177-20), as the plan's ruling 2 and 4 have it.

## Task Commits

| Task | Commit | Subject |
|---|---|---|
| 1, red | `d49274306` | `test(177-14): EntitySelector is a named radio group over entity cards and plain options` |
| 1 | `2e2e5306d` | `feat(177-14): EntitySelector, one single-choice group for parties and alliances` |
| 2, red | `7ff1c6d5e` | `test(177-14): the nomination editor's predicates and draft arithmetic` |
| 2, red | `237808994` | `test(177-14): a new card only in an election that admits the entity, and one pair per election` |
| 2 | `350c5c822` | `feat(177-14): who may edit nominations, which elections admit an entity, and the editor's draft arithmetic` |
| 2, fix | `acb08e520` | `fix(177-14): the draft test's one-element helper is typed for any list` |
| 1, red | `5d47e9fc7` | `test(177-14): a press on an entity's card is left to the row's label` |
| 1, fix | `10ebe6b04` | `fix(177-14): a press on an entity's card chooses its option` |

## Each task's verify command, with its real exit status

Each block was written byte for byte from the plan to `tests/e2e-runs/177-unit/177-14-t<N>-verify.sh` (extracted by a script, not typed) and run with `bash`; log, exit and head are beside it.

| Task | Exit | Head | Note |
|---|---|---|---|
| 1 | 0 | `2e2e5306d` | after the component's commit |
| 1 | 0 | `10ebe6b04` | again on the final head; this is the kept log |
| 2 | 0 | `10ebe6b04` | as written, naming `177-14-close`: the verdict script read the `-r2` directory and judged that |
| 2 | 0 | `10ebe6b04` | the same block naming `177-14-close-r2` outright (`177-14-t2-verify-r2.sh`, one word changed) |

`177-verdict gates`: `rows: 7 expected (the named subset), 7 recorded`; `not stale: head 10ebe6b04 is tree-equal to HEAD outside .planning/`; `power: no Sleep entry inside the run window`; `PASS`.

## Gate rows

Before each run: on AC power, battery 100 %; Docker VM 16.7 GiB free (no row of this subset touches the database or Docker).

| Row | `177-14-close`, head `acb08e520` | `177-14-close-r2`, head `10ebe6b04` |
|---|---|---|
| typecheck | 0 | 0 |
| lint | 0 | 0 |
| unit | 0 | 0 |
| check-frontend | 0 | 0 |
| build | 0 | 0 |
| format | 0 | 0 |
| docs-links | 0 | 0 |

Unit totals of `177-14-close-r2`: frontend **3967 passed and 30 skipped** (3787 before the plan, and the plan's 180 cases), dev-seed 1050, data 318. `177-14-close` held 3966: the pointer case was added after it.

## Task 1 — `EntitySelector`

### The props and the option type, as written

```ts
export type EntitySelectorOption = { value: string; name: string; hint?: string } & (
  | { kind: 'entity'; entity: AnyEntityVariant }
  | { kind: 'none' | 'other' | 'unlisted' }
);

export type EntitySelectorProps = SvelteHTMLElements['fieldset'] & {
  legend: string;
  options: ReadonlyArray<EntitySelectorOption>;
  selected?: string;                          // bindable; undefined while nothing is chosen
  required?: boolean;                         // default false
  error?: string;
  emptyMessage?: string;
  detail?: Snippet<[EntitySelectorOption]>;   // given the chosen option
  onChange?: (value: string) => void;
};
```

`import { EntitySelector } from '$lib/dynamic-components/entitySelector';` — the types come from the same barrel. `entity` is `AnyEntityVariant` of `@openvaa/data`: an object of the data root, which is what the card takes.

### The markup, against S7's block

Element for element as the contract writes it, with these differences:

| Where | The component | Why |
|---|---|---|
| the hidden `div` around the card | `class="pointer-events-none"` | the pointer defect above |
| the `fieldset` | `min-w-0` through `concatClass` | a `fieldset`'s default minimum inline size is its content's, which is how a long label widens a page past a phone's width; the caller's classes merge with it |
| the `fieldset`'s `aria-describedby` | the caller's ids, then the error line's id while it is shown | a caller's description is kept, as `Input` does for its controls |
| the radios' `name` | the component's generated id | one name per group, different between two groups on a page (asserted) |
| `detail` | rendered only for the chosen option's row, and given that option | the plan's table; a page asks `option.kind === 'other'` |

The caller's `data-testid` replaces `entity-selector` on the root, so the details page's `nomination-editor-parent` is the `fieldset`; the five inner ids are the component's own. `data-selected-kind` is empty while `selected` names no option of the group.

### What reading the result showed and a test does not

- **The group's accessible name holds the required sentence while the mark is shown.** The mark is inside the legend, as the contract writes it, and the group is named by its legend: a screen reader hears "List Required" until something is chosen. The fixture asserts the radios' names and `aria-required`, not the group's name.
- **The label covers the hint too**, so the hint cannot be selected as text. It is read through the radio's description.

### Red, then green

- The committed test alone fails on its import (`177-14-selector-red-import.*`, no test collected). **The red control is therefore an uncommitted skeleton** — the real type file and barrel, and a component that renders an empty `fieldset` — over head `cea7b1f89`: `177-14-selector-red.{log,exit,head,json}`, exit 1, **39 failed of 39, each an `AssertionError`**, no file failed to load (read from the JSON report).
- Green at `2e2e5306d`: 39 of 39. The pointer case: red at `5d47e9fc7` on the committed component (`expected "" to contain "pointer-events-none"`, 1 failed and 39 passed, `177-14-selector-pointer-red.*`), green at `10ebe6b04`, 40 of 40.
- The keyboard is asserted as structure: one shared name, no `tabindex` anywhere in the group, and 24 key events dispatched at a radio, none of which the component prevents or answers.

### The components skill's re-check list

| Item | Outcome |
|---|---|
| 1. Docstring, co-located type file, barrel export | All three exist. |
| 2. `yarn workspace @openvaa/docs generate:docs`, diff read | First run exit 1: the link validator refuses a source link to a file git does not track, and the component was untracked; the run then skipped its formatting step and left 50 generated files reformatted. With the three files staged: exit 0, and the diff is the listing's one entry and its total (106 to 107) and the component's new page. Run again after the pointer fix: one line of the page. Both committed with the component. |
| 3. `yarn workspace @openvaa/docs validate:links` | Exit 0, 0 findings; the gate row `docs-links` is 0 in both runs. |
| 4. The skill itself re-read | **Two measured counts are now one short**, reported and not edited (the dispatch leaves skills to 177-21): see *Sentences the work made false*. Nothing else is invalidated; the component reads the component context's `t` alone, a stable reference. |
| 5. `bash .claude/scripts/audit-skill-links.sh components` | Exit 0: 30 checked, 0 dangling. `audit-skill-drift.sh` was not run. |

## Task 2 — the predicates and the draft

### `editorFacts.ts`, as written

```ts
export function nominationsEditableOf({ nominationsLocked, answersLocked }: NominationLocks): boolean;

export function admissibleElectionsOf<TElection extends ElectionShapeFacts>(
  elections: ReadonlyArray<TElection>, entityType: EntityType
): Array<TElection>;

export function inReachNominationsOf<TNomination extends NominationReachFacts>(args: {
  nominations: ReadonlyArray<TNomination>;
  elections: ReadonlyArray<ElectionReachFacts>;
  entityType: EntityType;
}): Array<TNomination>;

type NominationLocks = { nominationsLocked: boolean; answersLocked: boolean };
type ElectionShapeFacts = { nominationShape: NominationShape };
type ElectionReachFacts = ElectionShapeFacts & { id: Id; round: number };
type NominationReachFacts = { electionId: Id; electionRound: number };
```

An `Election` of the data root satisfies both election types, and an `EntityNomination` the nomination's. Each function returns a list of its own that holds the objects it was given, in the order given. A nomination in an election that is not among those given is not in reach.

### `nominationDraft.ts`, as written

```ts
export const NO_PARENT_CHOICE = 'none';
export const OTHER_PARENT_CHOICE = 'other';

export type ParentRule = { types: ReadonlyArray<EntityType>; parentRequired: boolean; choiceRequired: boolean };

export type StoredCardValues = {
  electionSymbol: string;
  parentChoice: string | undefined;                  // the choice on arrival
  otherName: string;                                 // trimmed; '' when none is stored
  parent?: { entityType: EntityType; entityId: Id };
};

export type EditorCard = {
  key: string;                                       // the nomination's id; `new:<election>:<constituency>` on a new card
  nominationId?: Id;
  electionId: Id;
  constituencyId: Id;                                // on a moved card, the new one
  previousConstituencyId?: Id;                       // on a moved card alone
  confirmed: boolean;                                // false on a new card
  state: 'kept' | 'new' | 'removed';                 // a moved card is kept
  electionSymbol: string;                            // draft, as typed
  parentChoice: string | undefined;                  // draft: an option's value
  otherName: string;                                 // draft, as typed
  parentRule: ParentRule;
  stored?: StoredCardValues;                         // left out on a new card
};

export type EditorElection = { id: Id; nominationShape: NominationShape };
export type ListedParent = { entityType: EntityType; id: Id; name: string };

export type ParentOption =
  | { kind: 'none' | 'other'; value: string }
  | { kind: 'entity' | 'unlisted'; value: string; entityType: EntityType; entityId: Id };

export type ParentChoices = { options: Array<ParentOption>; selected: string | undefined; required: boolean };
export type CardErrorKind = 'parentRequired' | 'otherNameRequired' | 'duplicateParent';
export type CardError = { key: string; error: CardErrorKind };
export type DraftFacts = { somethingToWrite: boolean; anyKeptOrNew: boolean; hadNomination: boolean };

export function buildCards(args: {
  entityType: EntityType;
  nominations: ReadonlyArray<EntityNomination>;      // those in reach
  chosen: ReadonlyArray<NominationContest>;
  elections: ReadonlyArray<EditorElection>;          // in the election step's order
}): Array<EditorCard>;

export function parentChoicesOf(args: { card: EditorCard; listed: ReadonlyArray<ListedParent>; locale: string }): ParentChoices;
export function somethingToWrite(cards: ReadonlyArray<EditorCard>): boolean;
export function validateCards(cards: ReadonlyArray<EditorCard>, choices: ReadonlyMap<string, ParentChoices>): Array<CardError>;
export function desiredSetOf(cards: ReadonlyArray<EditorCard>): Array<DesiredNomination>;   // throws for a card in error
export function draftFactsOf(cards: ReadonlyArray<EditorCard>, hadNomination: boolean): DraftFacts;
export function sameNominations(a: ReadonlyArray<EntityNomination>, b: ReadonlyArray<EntityNomination>): boolean;
```

The page changes four members of a card — `state`, `electionSymbol`, `parentChoice`, `otherName` — and nothing else; every function but `buildCards` reads cards and changes none.

### What each function decides, beyond the plan's rows

- **`buildCards`.** Every stored nomination it is given has a card whatever `chosen` holds; one whose election is not among `elections` has one too, after the others, with no parent group, so that no row leaves the desired set by being left out. A new card is built only where the election is among those given **and** admits the entity's type (asked of `admissibleElectionsOf`). Of two chosen pairs naming one election the first is read. A moved card exists only where the election holds exactly one stored nomination.
- **The choice on arrival is on the card.** `card.parentChoice` and `card.stored.parentChoice` are set when the card is built; `parentChoicesOf(...).selected` states the same value, from what is stored and never from the draft. The page needs no step that seats the choice once the options arrive.
- **`parentChoicesOf`.** Order: the unlisted option, the option that names no parent, the listed entities, the typed-name option. An entity is listed once; an entity of a type the election does not pair with the entity — a faction among them — is dropped. `required` is "the user must choose", which is true for a candidate in both list shapes and false for a party; it is not the matrix's "a parent is required".
- **`validateCards`.** A card with a group and no option chosen is `parentRequired` whatever its entity type; a party's group starts at the option that names no parent, so only a candidate's can be in that state from the screen. A chosen value that is no option of the group counts as nothing chosen. The duplicate rule compares the entity chosen — listed or unlisted — at one election and constituency, and reports the later card; two cards that both name no parent, or both a typed name, are not reported. At most one error for each card, in the cards' order.
- **`desiredSetOf`.** `keep` where the stored parent is left chosen on a card that stays in its constituency, listed or not — the carried finding of 177-07. A moved card never says `keep`. A card with no parent group says `keep` when it exists and stays, `none` otherwise.
- **`sameNominations`.** By id, whatever the order; compares the election, constituency, round, symbol, confirmation, the parent's type and id, and the custom data by content. The election's, constituency's and parent's names are not compared: a renamed party is not a changed nomination.

### How ruling 3's branch was built

One private function, `carriesStoredParent(rule, parentType, moved)`: always true on a card that stays in its constituency, and on a moved card true only where the parent's type is among `rule.types`. It is asked twice. `buildCards` asks it for the choice on arrival: a moved card whose stored parent is of a paired type starts at that parent, and otherwise as a new card does. `parentChoicesOf` asks it for the unlisted option, under the comment that says what the branch does: a stored parent that is not listed is carried as the first option, on a moved card only where the type is paired. `desiredSetOf` then names that parent as an `entity` at the new constituency, since a move cannot say `keep`. Cases: a moved candidate under an unlisted party (carried), under a faction (as new: nothing chosen), and a moved party under an organization (as new: the option that names no parent).

### Red, then green

- The committed tests alone fail on their imports. **The red control is uncommitted skeletons** that answer nothing (`[]`, `false`, an empty answer): `177-14-draft-red.{log,exit,head,json}`, exit 1, over head `2e2e5306d`: **119 failed and 19 passed, every failure an `AssertionError`**, no file failed to load. The 19 that passed expect the answer `false` (three rows of `nominationsEditableOf`, fifteen of `sameNominations`) or that the barrel exports ten functions, which a skeleton satisfies.
- Two cases of `buildCards` were added afterwards, in a red commit of their own (`237808994`; `177-14-draft-red-2.*`, both failing on an expectation).
- Green: 140 of 140 on the first run of the real modules.
- **Ten planted defects, each seen caught** (one at a time, the file restored after each): an untouched group read as no parent (2 tests fail), an unchanged stored parent sent as `entity` (2), an unchosen nomination kept (7), a candidate starting at the no-parent option (8), removed cards validated (1), a new card in an election that does not admit the entity (1), a moved card carrying a parent of any type (2), removed cards in the desired set (2), the answers lock ignored (1), the round ignored (1).

## For plans 177-15 and 177-17 — how a page turns `parentChoicesOf`'s answer into the selector's options

```svelte
<script lang="ts">
  import { EntitySelector, type EntitySelectorOption } from '$lib/dynamic-components/entitySelector';
  import { buildCards, parentChoicesOf, type ListedParent } from '$contestant/nominations';

  // `parentOptions` is the answer of writer.getNominationParentOptions, already provided to the data root.
  // Read `contestantCtx.dataRoot` and `contestantCtx.locale` inside the derived that builds the options.
  const listed: Array<ListedParent> = parentOptions.map(({ entity }) => ({
    entityType: entity.type,
    id: entity.id,
    name: contestantCtx.dataRoot.getEntity(entity.type, entity.id).name
  }));
  const choices = parentChoicesOf({ card, listed, locale: contestantCtx.locale });

  const options: Array<EntitySelectorOption> = choices.options.map((option) => {
    switch (option.kind) {
      case 'none':
        return { kind: 'none', value: option.value, name: t(descriptor.parentNone) };
      case 'other':
        return { kind: 'other', value: option.value, name: t(descriptor.parentOther) };
      case 'entity': {
        const entity = contestantCtx.dataRoot.getEntity(option.entityType, option.entityId);
        return {
          kind: 'entity',
          value: option.value,
          name: entity.name,
          entity,
          hint: nominatedAtTheCardsPair(option.entityId) ? undefined : t(descriptor.parentNotNominatedHint)
        };
      }
      case 'unlisted': {
        const parent = storedNominationOf(card)?.parent; // from contestantCtx.nominations, by card.nominationId
        return {
          kind: 'unlisted',
          value: option.value,
          name: parent?.name || parent?.shortName || '',
          hint: t('contestantApp.nominations.parent.unlisted')
        };
      }
    }
  });
</script>

{#if choices.options.length}
  <EntitySelector
    class="mt-lg"
    legend={t(descriptor.nominationParentLabel)}
    {options}
    bind:selected={card.parentChoice}
    required={choices.required}
    error={errorOf(card)}
    emptyMessage={t(descriptor.parentNoOptions)}
    data-testid="nomination-editor-parent">
    {#snippet detail(option)}
      {#if option.kind === 'other'}
        <Input type="text" bind:value={card.otherName} … />
      {/if}
    {/snippet}
  </EntitySelector>
{/if}
```

- **No group is shown where `choices.options` is empty.** That is a candidate in a candidates-only election, and a card whose election was not given.
- **`bind:selected={card.parentChoice}` directly.** The card already holds the choice on arrival; nothing is copied from `choices.selected`.
- **`data-selected-kind` and `data-option-kind` are the option's `kind`**, which is what the fixture's `expectParentGroup` reads; the radio's accessible name is the option's `name` whole.
- **An entity option's entity must be in the data root before the options are built**: `getEntity` throws for one that is not. The hint is the page's: the module does not read `nominatedIn`.
- **The unlisted option's name is not in the module's answer.** It is the stored nomination's `parent.name`, with `shortName` when the name is empty, read by `card.nominationId`.
- **`validateCards` takes a map**: `new Map(cards.map((card) => [card.key, parentChoicesOf({ card, listed, locale })]))`, with each card's own `listed` where the options differ by contest. A card left out of the map is read as one with no group, and `desiredSetOf` then throws for it if its group has nothing chosen — pass every card.
- **`desiredSetOf` throws.** Call it only after `validateCards` answered an empty list, inside the handler's `try`.
- **Keep and Remove** assign `card.state`; a removed card keeps its draft, so Keep restores what was typed. `data-moved` is `card.previousConstituencyId !== undefined`.
- **The error's message key is the page's**: `parentRequired` → `contestantApp.nominations.error.parentRequired`, `duplicateParent` → `…error.duplicateParent`, both as the selector's `error`; `otherNameRequired` → the descriptor's `parentOtherRequired`, under the name field.
- **The elections given to `buildCards`** are `admissibleElectionsOf(contestantCtx.dataRoot.elections, type)`, in the election step's order; the nominations are `inReachNominationsOf(...)` of `contestantCtx.nominations`.

## For plans 177-18 and 177-19

- `draftFactsOf(cards, hadNomination)` answers `{ somethingToWrite, anyKeptOrNew, hadNomination }`; `anyKeptOrNew` is false exactly when every card is removed (and for no card).
- `sameNominations` takes two lists: filter both by `inReachNominationsOf` first, and hand `[]` for a list that is `undefined`.
- `nominationsEditableOf({ nominationsLocked, answersLocked })` takes one object.
- The key of the typed name, `requestedParentOrganization`, is a private constant of `nominationDraft.ts`. The nominations view of 177-19 reads the same key from `customData`; exporting a reader from this module would keep it in one place. Not built here: no plan asked for it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A press on an entity's card chose nothing**
- **Found during:** reading the component against the fixture's `chooseParent`, which presses the row, after Task 2's commit.
- **Issue:** the UI contract's markup puts the card after an absolutely positioned label; the card's `article` is itself positioned, so it is painted above the label and takes the press.
- **Confirmed in isolation:** a page with that structure alone, in Chromium through the repository's Playwright: `elementFromPoint` at the card's title was `H4#title` and a click there left the radio unchecked; with `pointer-events: none` on the hidden part it was `LABEL` and the radio was checked. The probe ran on the bare structure with inline styles, not on the built component with Tailwind.
- **Fix:** `pointer-events-none` on the hidden part around the card, a comment above it, a sentence in the docstring, and a test of the class.
- **Files modified:** `EntitySelector.svelte`, its test, its generated page.
- **Commits:** `5d47e9fc7` (red), `10ebe6b04`.

**2. [Rule 1 - Bug] A commit with the type check red**
- **Found during:** Task 2, at the commit of the modules.
- **Issue:** `only()` in `nominationDraft.test.ts` was typed for cards and used on desired nominations; the red run could not show it, since the skeleton's types were `any`. `svelte-check` reported twelve errors, and the commit was made anyway because the command chained on reading the exit file, not on its value.
- **Fix:** the helper takes a list of any element. `svelte-check` 0 errors and 0 warnings afterwards, read from the command's own status.
- **Commits:** `350c5c822` holds the fault, `acb08e520` the fix. The modules themselves were never in error.

### Other deviations

**3. Signatures that differ from the plan's `<the_draft>`.**
- `buildCards({ entityType, nominations, chosen, elections })` — the plan lists three arguments. The card's parent rule and its choice on arrival both depend on the entity's type, and the plan's acceptance criterion has the module ask `allowedParentTypes`.
- `parentChoicesOf({ card, listed, locale })` — the plan writes `{ allowed, listed, card }`. `allowed` is on the card as `parentRule`, built from `allowedParentTypes`; an `allowed` argument could disagree with what the card was built on, and it cannot tell a candidate in a lists-and-independents election from a party, which start differently. `locale` is the "given locale" of the plan's behaviour block.
- `validateCards(cards, choices)` with `choices` a `ReadonlyMap<string, ParentChoices>` by card key — the plan does not say what `choices` is.
- `desiredSetOf(cards)` throws for a card with a group and nothing chosen and for a blank typed name — the form in which "an error, not a desired nomination with no parent" was built.
- Two constants and nine types are exported beside the seven functions and `EditorCard`.

**4. The `detail` snippet is given the option**, as the plan's table says; S7's block writes `detail?.(value)`.

**5. The red controls are uncommitted skeletons**, as in 177-08, 177-09 and 177-13: the committed tests alone fail on a missing import.

**6. Two test cases were added after the first test commit**, in their own red commit, before the modules.

**7. A probe file stood under `tests/` for about three seconds** (`tests/.hit-probe-177-14.mjs`, written, run and removed in one command) while the first gate run was in flight. That run is the superseded one; the run of record started on a clean tree after it.

**8. No ledger file was written at the start.** `plan_head_before` is the head the first red run recorded (`177-14-selector-red.head`), and `commits` is measured from it.

## Code review checklist

| Item | Outcome |
|---|---|
| The changes solve what they set out to | Yes for the parts; the editor itself is 177-15 to 177-18. |
| OWASP top 10 | Injection: every name, hint and line is a text interpolation; a case renders `<b>bold</b>` as legend, error, empty line, name and hint and finds no `b` element. Broken access control: nothing here decides access; the predicates state what the database enforces. No secret, no network call, no storage. |
| Code style guide | Function declarations throughout (`func-style`); no numeric spacing class; props from a co-located type file; `concatClass`; one `bind:` with the project's comment above it. |
| No `any` | None in the committed files. The uncommitted skeleton used it and was replaced. |
| No repeated code | `admissibleElectionsOf` is the one statement of admissibility and `buildCards` and `inReachNominationsOf` call it. The required mark's two elements are `Input`'s, repeated here as the contract writes them; `Input` exports no part for it. |
| New entities documented | Every exported type, member, constant and function has TSDoc; the component has its `@component` docstring; both modules have a header. |
| Repo documentation updated | The generated listing and page. Hand-written docs: none names these; see *Sentences the work made false*. |
| Tracking events | None: the component adds no function a user reaches yet, and the contract names no event for a parent choice. |
| Svelte component guidelines | Runes only; snippet for `detail`; rest props spread through `concatClass`; barrel; docstring. |
| Errors handled and logged | `desiredSetOf` throws with a developer's message and no stored value; the page's handler catches it. Nothing is swallowed. |
| Failing checks | None on the final head; one of mine in between, *Deviations*, 2. |
| Parts sharing dependencies not unduly affected | `EntityCard`, `EntityList`, `Input` and `ConstituencySelector` are byte-identical to the base commit (`git diff --quiet $(cat 177-BASE) HEAD` on the four directories: 0). Nothing imports the new files. |
| WCAG A and AA | Built to the contract's a11y truths and asserted as structure; **not scanned**: no page renders the component. |
| Keyboard and screen reading | Native radios with one name; no key handler, no `tabindex`. Not exercised in a browser here. |
| Docs added where necessary | The developers' guide has no page on the editor yet; 177-21's. |
| Comment hygiene | `yarn assert:comment-hygiene` 0 violations before each of the eight commits; every comment read; no history and no plan id. |
| Clean, linear history | Linear. Two `fix` commits follow their `feat` commits on the same files: *Deviations*, 1 and 2. |
| No fixes of itself | **Not met**: `acb08e520` and `10ebe6b04` are fixes of this plan's own commits, left unsquashed because the phase's commits are not rewritten. |
| Formatting changes separate | No formatting-only change. |
| `[db]` tag | No database change. |

## Prohibitions

- **PROH-177-35** — held: a candidate's new card has nothing chosen; `validateCards` reports it; `desiredSetOf` throws for it. The planted defect that read it as no parent failed 2 tests.
- **PROH-177-36** — held: the component renders a row only for an entry of `options`, and `parentChoicesOf` an entity option only for an element of `listed`; the one option it adds itself is the stored parent.
- **PROH-177-37** — held: the four components are byte-identical to the base commit; no variant, prop or token was added to an existing component.

## Threat Flags

None. The plan adds no endpoint, no auth path, no file access and no schema change. Its register's mitigations: T-177-56 and T-177-57 as the prohibitions above; T-177-58 by the markup case; T-177-59 by "gives every stored nomination a card, whatever the selection holds" and by `desiredSetOf` naming every card that is not removed.

## Sentences the work made false, reported and not edited

- **`177-UI-SPEC.md`, S7, the control's block** — the hidden `div` around `EntityCard` as written lets the card take the press; the built form carries `pointer-events-none`. Also "`{@render detail?.(value)}`": the snippet is given the option.
- **`.claude/skills/components/SKILL.md`, convention 1** — "104 files calling `$props()` and 104 co-located `*.type.ts` files": 105 and 105 on this head, measured over the three target directories. Convention 3 — "61 files in the three directories above depend on this": 62 by the same measure; its second figure, "68 across all of `apps/frontend/src`", was not re-measured.
- No hand-written page of the developers' guide names the selector or the two modules. `apps/docs/…/contestant-app/home-and-tasks/+page.md` is where a reader would look for the editor's rules.

## Not done, or not verified

- **Nothing was rendered in a browser** except the isolated probe: the keyboard model, focus after a choice by pointer, the row's fill while checked, the required mark's look, long names inside the card, the axe scan and the widths are unobserved. jsdom does not focus a control when its label is pressed, so the focus case puts focus on the radio first and asserts that the component moves it nowhere.
- **The pointer fix is confirmed on the bare structure, not on the built component.** That `pointer-events-none` reaches every descendant of the real card, and that Tailwind emits the class, is inferred; 177-15's first press on a party's row is where it is observed.
- **No E2E run**: by the plan's ruling 4. The latest full run is still `177-13-close`.
- **`Intl.Collator` ordering** was asserted for `sv`, `de` and `en` in Node; a browser's order for the project's other locales was not.
- `audit-skill-drift.sh` was not run.
- The state commands (`state.advance-plan` and the others) were not run: the dispatch leaves `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` to the orchestrator.

## The state the local stack is left in

Untouched. No row of the gate subset resets or reads the database, no dev server was started, and no E2E run was made. Docker VM 16.7 GiB free before each gate run.

## Known Stubs

None.

## Evidence (gitignored)

- `tests/e2e-runs/177-unit/177-14-*`: the two verify scripts with their logs, exits and heads; `selector-red-import`, `selector-red`, `selector-green`, `selector-pointer-red`, `selector-pointer-green`; `draft-red`, `draft-red-2`, `draft-green`; `check-a` to `check-d` (`check-b` is the red one); `generate-docs` (exit 1), `-b` and `-c`; `validate-links`, `skill-links`, `unit-coverage`, the hygiene logs; `gates` and `gates-r2`.
- `tests/e2e-runs/177-gates/177-14-close` and `177-14-close-r2`.

## Self-Check: PASSED

- The eleven files of `key-files` exist on `10ebe6b04` (`git ls-files --error-unmatch` on each: 0).
- The eight commits are ancestors of `HEAD`.
- `git status --short` held `?? CAND-APP-PLAN.md` alone before this file was written.
