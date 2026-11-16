# Defining nominations

A candidate's or a party's user defines the entity's own nominations in the Contestant App: the elections it stands in, the constituency of each, its election symbol and what it stands under. The nomination editor is three pages that collect a draft and one write that stores it. This page describes the editor's addresses, what lets a user in, how the draft is built and saved, and what the database does with the save.

The view that lists an entity's nominations, and the task that leads into the editor, are described in [The home, the tasks and the nominations view](/developers-guide/contestant-app/home-and-tasks). The database's rules for a nomination are in [Authentication and authorisation](/developers-guide/backend/authentication#nominations-an-entity-defines).

## The three steps and their addresses

The editor is the route group [`nominations/(edit)`](<https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)>) below the entity routes:

| Step               | Path below `/contestant/<entityType>/<entityId>/nominations` | Route key                               |
| ------------------ | ------------------------------------------------------------ | --------------------------------------- |
| The elections      | `/elections`                                                 | `ContestantAppNominationElections`      |
| The constituencies | `/constituencies`                                            | `ContestantAppNominationConstituencies` |
| The details        | `/details`                                                   | `ContestantAppNominationDetails`        |

The election step's address is the editor's entry: every link into the editor names it, and its load forwards to the first step that has something to choose.

The group is below `nominations` and outside the `(nominated)` group, which redirects an entity with no nomination to its home. An entity with no nomination must be able to open the editor, because the editor is where it gets one.

The selection travels in the address, in two search parameters that may each be repeated: `nominationElectionId` and `nominationConstituencyId`. They are the editor's own names and are not persistent search parameters, so they are dropped by every route that is built without them. An id counts only when it names an election that admits the entity's type, or a constituency of such an election or of the constituency group that is chosen first. Any other id is dropped before anything is decided, and no error page is shown for it.

## The facts and the guard

Two layout loads decide who is let in. Neither makes a request and neither reads the URL.

| Load                                                                                                                                                                                                                | Returns or decides                                                                                                                                                                                                                                                                                                                             | Reads                              | Runs                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| [`nominations/+layout.ts`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+layout.ts>)   | `nominationFacts`: whether the nominations may be edited, the ids of the elections that admit the entity's type, and the ids of the entity's nominations the editor manages. `undefined` while a gate is pending, when the page data holds no entity, and when the root load could not read the settings, the elections or the constituencies. | `parent` alone                     | On entry to the nominations tree and when a parent load's data changes.  |
| [`(edit)/+layout.ts`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/+layout.ts>) | The guard. While the nominations cannot be edited, or no election admits the entity's type, the user is redirected with a 307 to the nominations view, which says why. With no facts it decides nothing and the layout above shows its own view.                                                                                               | `parent` and the two entity params | Once per entry to the editor, and not on a navigation between two steps. |

The nominations view reads the same `nominationFacts` to decide whether it offers a way into the editor, so the view and the guard cannot disagree. The facts also say whether another nomination can be added (`canAddAnother`), on which the view's Add a nomination is shown.

Neither load reads a `url` property or `route`. A layout load that read the address tracked would run again on every navigation between two steps, and the steps keep a draft. The elections and constituencies an address names are therefore read by each step's own page load.

Four predicates in [`$lib/contestant/nominations`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/nominations/editorFacts.ts) state the conditions once:

- `nominationsEditableOf(locks)`: neither `access.nominationsLocked` nor `access.answersLocked` is on.
- `admissibleElectionsOf(elections, entityType)`: the elections whose nomination shape admits the entity's type, asked of `isNominableInShape` of `@openvaa/data`.
- `nominationEntryOfferedOf({ locks, elections, entityType })`: the editor lets the entity in, the first predicate and at least one election of the second. The home's nomination task asks it.
- `inReachNominationsOf({ nominations, elections, entityType })`: the nominations the editor manages, which are those at their election's current round in an election that admits the entity's type. A nomination outside the reach is listed on the nominations view, has no card in the editor and is left as it is by a save.

No page, load or component writes one of these conditions out.

## The order of the steps

Which step an address leads to is decided by the shared ordering module [`selectionOrder.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/routes/selectionOrder.ts) of `$lib/routes`. The Voter App's election and constituency pages ask the same functions, `electionsStepOutcome` and `constituenciesStepOutcome`. The two apps differ only in what they hand over:

|                                                                                                             | Voter App      | Nomination editor                          |
| ----------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------ |
| The elections on offer                                                                                      | every election | the elections that admit the entity's type |
| `elections.disallowSelection` implies every election                                                        | yes            | no: only a single election is implied      |
| With `elections.startFromConstituencyGroup`, a single election held in the chosen constituencies is implied | no             | yes                                        |
| A single election with a single constituency passes over both steps                                         | no             | yes                                        |

[`(edit)/stepSelection.ts`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/stepSelection.ts>) maps the module's outcomes to the editor's three addresses and holds no ordering rule of its own. Each step's page load calls it and redirects with a 307 when the address lacks what the step needs.

For an entity that already has nominations the steps start from them:

- The election step checks the elections the entity is nominated in.
- The constituency step selects the constituency of the entity's one nomination in each chosen election.
- A chosen election in which the entity holds several nominations has no constituency to choose. Its nominations are kept as they are stored, each with a card on the details step. The application gives an entity one constituency for each election; an entity that stands in several is seeded by an administrator.

Under `elections.startFromConstituencyGroup` the constituency picked from the group is resolved, for each election, to the constituency that election is held in (`constituenciesStoodFor`).

## The draft

The details step holds the draft. Its arithmetic is the pure module [`nominationDraft.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/nominations/nominationDraft.ts):

| Function                                                     | Answers                                                                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `buildCards({ entityType, nominations, chosen, elections })` | The cards and the state each starts in.                                                                                                     |
| `parentChoicesOf({ card, listed, locale })`                  | The options of a card's parent group and the one chosen on arrival.                                                                         |
| `somethingToWrite(cards)`                                    | Whether the draft differs from what is stored.                                                                                              |
| `validateCards(cards, choices)`                              | What each unfinished card lacks.                                                                                                            |
| `desiredSetOf(cards, listed)`                                | The set of nominations handed to the writer, each chosen entity named by its own type. Call it only after `validateCards` answered nothing. |
| `draftFactsOf(cards, hadNomination)`                         | What the main button's label is decided from.                                                                                               |

**Every nomination in the editor's reach has a card**, whatever the steps before chose. The selection never merges, moves or drops a stored nomination by itself:

- A stored nomination whose election is chosen is kept.
- A stored nomination whose election is not chosen says that it is about to be removed, and can be kept.
- A stored nomination that is the only one of its election, in an election chosen with another constituency, is one card at the new constituency that names the previous one.
- A chosen election and constituency in which the entity has no nomination is a new card.

A card holds, where the election lets the entity stand under something, a group in which that is chosen, and then the election symbol. Which parent an entity may name, and whether it must name one, is asked of `allowedParentTypes` of `@openvaa/data` and of nothing else: an organization for a candidate, an alliance for an organization. The group's options are, in order: a stored parent that is no longer listed, the listed entities by name, "Other", under which the name of a party or an alliance that is not listed is typed, and last the option that names none (absent where a parent must be named).

The listed entities are read by `contestantCtx.getNominationParentOptions(contests)`, which says of each option at which of the asked contests it is nominated. The page provides them to the data root, so that each is shown as an entity card. A card of a stored nomination whose parent was not changed sends `keep` and not the entity again: `keep` is the one way to leave a stored link exactly as it is. Which option a stored nomination's card starts on is read from `EntityNominationParent.entityId` of the entity's nominations: the id of the stored parent, compared with the ids of the listed options, which is also how a parent that is no longer listed is told apart.

### The selector

The parent group is [`EntitySelector`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte), a single-choice group whose options are entities, each shown as a compact `EntityCard`, with plain options before and after them. It is given its options and knows nothing of what a choice means. The radios are native and share one name, so the group is one tab stop. See its [generated page](/developers-guide/frontend/components/generated/dynamic-components/entitySelector/EntitySelector).

## The save

Nothing is written before the main button of the details step is pressed: no field, no Remove and no other step writes a nomination.

A press runs in this order:

1. **Check.** Every card that is not about to be removed is checked. An unfinished card stops the save, each unfinished control shows its error, and focus moves to the first.
2. **Nothing to write.** A draft that equals what is stored writes nothing and leads to the nominations view.
3. **One write.** `contestantCtx.setEntityNominations(desiredSetOf(cards, listed), builtOn)` hands over the whole set of the entity's nominations and the nominations the cards were built on. The data writer calls the database function `set_entity_nominations` once, with each of those nominations' ids and `updatedAt`, and either all of the set is stored or none of it.
4. **The re-read.** `invalidateAll()` runs the page's loads again whatever the write answered, so the settings, the entity's nominations, its tasks and its question lists are those the database holds. The entity-level load has no dependency key; `invalidateAll()` is what reruns it.
5. **The target.** After a stored save the user is taken to the nominations view, which lists what was stored; its main button then leads on to the entity's next task, or back to its home, as `nominationsViewTarget` decides of the state the save and the re-read left. When the re-read has led out of the editor, to the nominations view because the nominations can no longer be edited, the user stays there.

The main button's label is asked of `nominationsSaveAction(contestantCtx.taskState, draftFactsOf(…))`: "Continue" or "Return" with nothing to write, "Save and Continue" or "Save and Return" otherwise. The page builds no task state of its own.

### A save that is not stored

`setEntityNominations` resolves to `{ type: 'saved', … }` or to `{ type: 'refused', reason }`, and rejects for anything else. After the re-read the first of these that applies is what the user meets:

| Case                                                                                                                                    | What the page shows                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The nominations can no longer be edited                                                                                                 | Nothing: the re-read has led to the nominations view, which says why.                                                                                     |
| The entity's nominations are no longer those the cards were built on: `refused` with `changed`, or a re-read that differs               | The cards are built again from the nominations as they now are, what was typed is dropped, and the message says the nominations have changed (`changed`). |
| `refused` with `hasCandidates`: a nomination that was to be removed or moved has nominations listed under it                            | A message; the cards and what was typed are kept.                                                                                                         |
| `refused` with `tooManyPending`: the write would create a parent's nomination beyond the limit on unconfirmed ones a user may originate | A message; the cards and what was typed are kept.                                                                                                         |
| Anything else                                                                                                                           | A message that the save failed (`failed`), also the page's own; a second press tries again.                                                               |

The message is always the page's own text, never the text the write was refused with. Nothing of a save that was not stored is in the database.

**Nothing is read again before the write, and the database checks the write against the read.** The write carries the nominations the cards were built on, each with the time it was last updated, and `set_entity_nominations` refuses it with `40001` when the nominations in its reach are no longer those. A nomination an administrator added, moved, edited, confirmed or removed while the editor was open is therefore never deleted or written over by a save: the save is refused as `changed`, and the cards are built again.

Leaving the details step with changes that are not saved asks first, through the browser's own confirm. Cancel and the main button do not ask.

## What the database enforces

| Rule                                                    | Enforced by the database                                                                                                                                                                                                                                                                  | Enforced by the pages alone                                                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| The nominations lock, `access.nominationsLocked`        | Yes: the entity insert, update and delete policies on `nominations` each refuse while it is on                                                                                                                                                                                            | The guard and the view also read it                                                                             |
| The answers lock, `access.answersLocked`                | Yes: the entity insert, update and delete policies on `nominations` refuse an entity's own editor while it is on, and `set_entity_nominations` refuses it with `42501` and `set_entity_nominations: answers are locked in this project`; a project editor and a project admin still write | The guard closes the editor and the view shows a note                                                           |
| Which entity type an election admits                    | Yes: `validate_nomination` on every write                                                                                                                                                                                                                                                 | The editor offers only admissible elections                                                                     |
| A candidate needs a parent in a closed-list election    | Yes: when the transaction ends                                                                                                                                                                                                                                                            | The card's group is required                                                                                    |
| A linked party or alliance is one of the listed options | **No**: `set_entity_nominations` checks that the named parent is of the right type and does not hold it to the options                                                                                                                                                                    | The selector lists the project's confirmed organizations for a candidate, and its alliances for an organization |

The pages are guidance; the policies, the triggers and `set_entity_nominations` are the permission. Do not rely on the guard to keep a write out.

## Rules to keep

1. **One write.** The editor calls `setEntityNominations` once per save, with the whole set. A stored nomination the set leaves out is removed, so a set built from a partial list deletes nominations.
2. **The layout loads read no URL.** The facts load and the guard read `parent` and the entity params. A tracked read of the address reruns them between steps.
3. **The entity-level load is not given a dependency key.** A changed nomination reaches the view, the task state and the guard when `invalidateAll()` reruns it.
4. **No rule is written twice.** "Editable", "admissible" and "in reach" are the three predicates above; which entity may be nominated and which parent it may name are `isNominableInShape` and `allowedParentTypes`; the order of the steps is the shared ordering module.
5. **No page branches on the entity's type.** What differs between a candidate and a party is read from the descriptor of the entity's type.
6. **The target is read after the save**, from the state as it stands then.

## In tests

- `editorFacts.test.ts` and `nominationDraft.test.ts` beside the two modules, `selectionOrder.test.ts` beside the ordering module, and `stepLoads.test.ts`, `layout.tracking.test.ts` and `layout.test.ts` beside the loads. `layout.tracking.test.ts` fails when the guard reads a `url` property.
- `page.svelte.test.ts` beside the details page holds the outcomes of a save, the two refusals among them: `tooManyPending` and `failed` are held by its component cases alone, with the write as a spy. `afterSave.svelte.test.ts` mounts the page inside the entity layout with the real contestant and data contexts, and holds what the page does once the entity's data has been replaced.
- The writer's integration test, `supabaseDataWriter.integration.test.ts`, calls the two database functions through the API. It runs against the local stack and in no CI job.
- The E2E project `perm-contestant-nominations` ([`contestant-nominations.spec.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/tests/tests/specs/perm/contestant-nominations.spec.ts)) drives the editor and the view for a candidate and a party, with and without nominations, on a dataset of three elections of three types. `perm-startfromcg` drives the editor under `elections.startFromConstituencyGroup`. The editor's tests of both carry the tag `@nomination-definition`.
- The pgTAP files `43-set-entity-nominations.test.sql` and `44-nomination-parent-options.test.sql` hold the two functions, and `23-nominations-write.test.sql` the policies.
