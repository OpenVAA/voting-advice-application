<!--@component

# Contestant app nomination editor: the details step

Shows one card for each nomination the entity the user edits has or is about to have, and writes the entity's nominations when its main button is pressed. See `+page.ts` for what the address chose and for the redirects of an address that lacks it.

- **Which cards there are.** Every nomination of the entity that the editor manages has a card, whatever the steps before chose: the selection never merges, moves or drops a stored nomination. Its card is kept where its election is chosen, and says that the nomination is about to be removed where it is not. A stored nomination that is the only one of its election, in an election chosen with another constituency, is one card at the new constituency that names the previous one. An election in which the entity holds several nominations has a card for each, as stored. A chosen election and constituency in which the entity has no nomination has a new card. A nomination the editor does not manage, at another round of its election or in an election that no longer admits the entity, has no card and is left as it is by a save.
- **A card** is headed by its election and names its constituency, neither of which can be changed here. A card of a stored nomination shows its status and starts from what is stored. It holds, where the election lets the entity stand under something, a group in which that is chosen: a listed party or alliance, a name typed for one that is not listed, or the option that names none; and then a field for the election symbol. A listed entity that is not nominated in the card's election and constituency says so under its name. A stored party or alliance that is no longer listed is the group's first option, chosen, and is left as it is by a save unless another option is chosen.
- **A note** says of a confirmed nomination that a change must be confirmed again, before anything is changed, and of a new one that it must be confirmed before voters see it.
- **Remove**, on a card of a stored nomination, writes nothing and opens no dialog. The card then says that the nomination will be removed when the user continues, shows no field, and offers Keep, which restores the card with what was typed. A card that is about to be removed is not checked. When every card is about to be removed they all stay on the page.
- **Nothing is written before the main button is pressed.** No field, no Remove and no other step writes a nomination.
- **The main button says what a press does.** With nothing to write it reads "Continue", or "Return" when no task of the entity is left. With something to write it reads "Save and Continue", or "Save and Return" when no task is left and whenever every card is about to be removed. The label is asked of `nominationsSaveAction`, with the entity's tasks as they stand and the draft; the button's `data-action` says whether it continues or returns. Wherever a press leads on from the editor, it leads to the nominations view, whose main button then continues or returns as the label said.
- **A press** first checks every card that is not about to be removed. A card that is not finished stops the save: the message region says that some nominations need attention, each unfinished control shows its own error, and focus moves to the first of them. Two cards of one election and constituency that name the same party or alliance are such a case, and the second of them shows the error. With nothing to write the button writes nothing and leads to the nominations view. Otherwise every nomination is written in one call and the page's data is read again.
- **A save that is stored** takes the user to the nominations view, which lists what was stored and leads on from there, whatever the entity's tasks. When reading the data again has led away from the editor, to the nominations view because nominations can no longer be edited, the user stays there.
- **Cancel** leads to the nominations view, and a link above the cards leads back to the selection where the editor has a step to select on.
- **Leaving with changes that are not saved** asks first, through the browser's own confirm. Cancel discards them without asking, and so does a press of the main button, whatever its save leads to.
- **While the cards cannot be shown yet** a loading indicator stands in their place and the main button is in its loading form: until the entities a nomination can stand under have been read, and until every card's election and constituency are on the page. That is the case in the server-rendered markup.
- **When those entities cannot be read**, or once they are read the data root does not hold an entity, an election or a constituency the cards are shown with, an error message stands in the cards' place, the failure is logged, and the page holds no main button, so nothing can be written.

The page says which of these it is in through `data-editor-state`: `loading`, `ready`, `saving` or `error`. It is shaded while it lists cards.

Everything that differs between entity types is read from the descriptor of the selected entity's type. Which parent a card offers is decided by the election's nomination shape and is never written out here.

### A save that is not stored

Nothing is read again before a write: the cards are written as the user sees them, together with the nominations they were built on, and the database refuses the write when the stored nominations are no longer those. A nomination created, moved, edited or removed since the cards were built is therefore never removed or written back by a save. After a save that was not stored the page's data is read again, and the first of these that applies is what the user meets:

1. **Nominations can no longer be edited.** Reading the data again leads to the nominations view, which says why. The page shows no message and navigates nowhere itself.
2. **Answers are locked**, as the write was refused for (`answersLocked`), while reading the data again has not led away. The note that nominations can no longer be changed because editing has ended stands in place of a message (`data-outcome="answersLocked"`). The cards and what was typed are kept.
3. **The entity's nominations are no longer those the cards were built on**, as the re-read shows or as the write was refused for. The cards are built again from the nominations as they now are, what was typed is dropped, and the message says that the nominations have changed (`data-outcome="changed"`).
4. **Candidates are listed under a nomination that was to be removed or moved** (`hasCandidates`). The cards and what was typed are kept.
5. **The limit on nominations that wait for confirmation is reached** (`tooManyPending`). The cards and what was typed are kept.
6. **Anything else** (`failed`). The cards and what was typed are kept, and a second press tries again.

In cases 2 to 6 the message is the page's own, never the text the save was refused with, and focus returns to the main button, which reads as it did. Nothing of a save that was not stored is in the database.

### Accessibility

- Each card is an `<article>` named by its heading, and the cards are the items of a list.
- The message region is always rendered, so that a message put into it is announced. After a save that was not stored, focus returns to the main button.
- An error is shown at its control, which is marked invalid and described by it.
- The line that says a nomination is about to be removed is a status message (`role="status"`), and it describes Keep. Pressing Remove moves focus to that card's Keep, and pressing Keep to that card's Remove, so focus is never lost with the button that was pressed.
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { onDestroy, tick, untrack } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { NotEditableNote } from '$contestant/components/notEditableNote';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Input } from '$lib/components/input';
  import { Loading } from '$lib/components/loading';
  import { PreventNavigation } from '$lib/components/preventNavigation';
  import { Warning } from '$lib/components/warning';
  import {
    admissibleElectionsOf,
    buildCards,
    desiredSetOf,
    draftFactsOf,
    parentChoicesOf,
    sameNominations,
    somethingToWrite,
    validateCards
  } from '$lib/contestant/nominations';
  import { nominationsSaveAction } from '$lib/contestant/tasks';
  import { entityDescriptorOf } from '$lib/contestant/utils/entityDescriptor';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { EntitySelector } from '$lib/dynamic-components/entitySelector';
  import { CONTESTANT_NOMINATION_EDITOR } from '$lib/routes';
  import { EDITOR_STEP_ROUTE, hasSelectionStep, reachedNominationsOf, selectionSearch } from '../stepSelection';
  import type {
    EntityNomination,
    NominationContest,
    NominationParentOption,
    SetEntityNominationsResult
  } from '$lib/api/base/dataWriter.type';
  import type { CardError, CardErrorKind, EditorCard, ListedParent, ParentChoices } from '$lib/contestant/nominations';
  import type { EntitySelectorOption } from '$lib/dynamic-components/entitySelector';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // appSettings, dataRoot, locale, nominations, selectedEntity and taskState are reactive accessors: read via contestantCtx.X inside the tracking scope, never destructured, and dataRoot never through an alias.
  const contestantCtx = getContestantContext();
  const { getRoute, setDataRoot, t } = contestantCtx;
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // The page's state
  ////////////////////////////////////////////////////////////////////

  /** The entities a nomination can stand under: not read yet, the answer, or `'failed'` for a read that was refused or failed. */
  let parentOptions = $state.raw<ReadonlyArray<NominationParentOption> | 'failed' | undefined>(undefined);
  /** The cards. The draft is what the user has typed and chosen on them, and which of them are about to be removed. */
  let cards = $state<Array<EditorCard>>([]);
  /** The entity's nominations in the editor's reach as they were read when the cards were built: what the draft started from. */
  let builtOn = $state.raw<ReadonlyArray<EntityNomination>>([]);
  /** Whether a save is under way. */
  let saving = $state(false);
  /** What a press of the main button that stayed on the page says: a card is not finished, or the save was not stored for one of five reasons. */
  type StayedOutcome = 'invalid' | 'changed' | 'hasCandidates' | 'tooManyPending' | 'answersLocked' | 'failed';
  /** What the last press of the main button left to say, while it did not lead on to another page. */
  let saveMessage = $state<{ outcome: StayedOutcome; text: string } | undefined>();
  /** The errors the last press of the main button found. */
  let reported = $state.raw<ReadonlyArray<CardError>>([]);
  /** The list of cards, through which focus is moved to a control in error. */
  let cardList = $state<HTMLElement | undefined>();
  /** The element that holds the page's buttons, through which focus is returned to the main button. */
  let actions = $state<HTMLElement | undefined>();

  /** Whether a navigation away is let through without asking: set by Cancel, and by a press of the main button for as long as its save and what follows it can navigate. */
  let leavingUnasked = $state(false);
  /** Whether the page is still shown. */
  let shown = true;
  onDestroy(() => {
    shown = false;
  });

  /** Everything that differs by entity type. */
  const descriptor = $derived(entityDescriptorOf(contestantCtx.selectedEntity?.type));

  /** The options as they were read, or `undefined` while there are none to show. */
  const readOptions = $derived(parentOptions === 'failed' ? undefined : parentOptions);

  /** The longest election symbol and the longest typed name the database stores. Each reaches its field's control as an attribute, with the other attributes `Input` passes on. */
  const SYMBOL_LIMIT = { maxlength: 50 };
  const OTHER_NAME_LIMIT = { maxlength: 100 };

  /** What the address chose, as one value: it changes only when the address names other contests or other kept elections, and not when the load is run again for the same ones. */
  const contestsKey = $derived(
    [
      ...data.nominationContests.map((contest) => `${contest.electionId} ${contest.constituencyId}`),
      ...data.nominationKeptElectionIds.map((electionId) => `kept ${electionId}`)
    ].join(',')
  );

  /** The elections that admit the entity's type, in the order the election step lists them. */
  const admissible = $derived.by(() => {
    const entityType = contestantCtx.selectedEntity?.type;
    return entityType ? admissibleElectionsOf(contestantCtx.dataRoot.elections, entityType) : [];
  });

  ////////////////////////////////////////////////////////////////////
  // Reading the parent options and building the cards
  ////////////////////////////////////////////////////////////////////

  /** The selection whose options were asked for last, so that an answer to an earlier question is dropped. */
  let askedFor: string | undefined;
  /** The selection the cards were built for. */
  let builtFor: string | undefined;
  /** The read of the parent options for the cards as they were last built. */
  let optionsRead: Promise<void> = Promise.resolve();

  // The cards are built once for what the address chose, when the entity's nominations, the facts of them and the elections are on the page, and the options are read for the cards that were built. The cards are the draft from then on, so nothing builds them again for the same selection: not a rerun of the page's loads either. The one exception is a save that was not stored because the nominations have changed, which builds them again itself.
  $effect(() => {
    const key = contestsKey;
    const known =
      !!contestantCtx.selectedEntity?.type &&
      !!contestantCtx.nominations &&
      !!data.nominationFacts &&
      admissible.length > 0;
    if (!known || builtFor === key) return;
    untrack(buildCardsAnew);
  });

  /**
   * Build the cards from the entity's nominations as the page now holds them, for what the address chose, and read the parent options for them. The draft is dropped with the cards it was typed on, and so is any message. No card is built while the entity's type, its nominations, the facts of them or the elections are not on the page, since a set written from cards that leave a stored nomination out would remove it.
   */
  function buildCardsAnew(): void {
    const entityType = contestantCtx.selectedEntity?.type;
    const stored = contestantCtx.nominations;
    const facts = data.nominationFacts;
    if (!entityType || !stored || !facts || !admissible.length) return;
    const key = contestsKey;
    builtFor = key;
    const nominations = reachedNominationsOf(stored, facts);
    builtOn = nominations;
    cards = buildCards({ entityType, nominations, chosen: chosenPairsOf(nominations), elections: admissible });
    reported = [];
    saveMessage = undefined;
    optionsRead = readParentOptions(key, contestsOf(cards));
  }

  /**
   * The chosen elections, each with a constituency, as the cards are built from them: the contests of the address, and each election whose nominations are kept as stored with the constituency of the first of them. A card of such an election stays in its own constituency whichever of them is named.
   * @param nominations - The entity's nominations in the editor's reach.
   */
  function chosenPairsOf(nominations: ReadonlyArray<EntityNomination>): Array<NominationContest> {
    const kept = data.nominationKeptElectionIds.flatMap((electionId) => {
      const first = nominations.find((nomination) => nomination.electionId === electionId);
      return first ? [{ electionId, constituencyId: first.constituencyId }] : [];
    });
    return [...data.nominationContests, ...kept];
  }

  /**
   * The election and constituency of every card, each pair once: those of a card that is about to be removed too, and of a moved card the constituency it is moved to.
   */
  function contestsOf(built: ReadonlyArray<EditorCard>): Array<NominationContest> {
    const contests = new Map<string, NominationContest>();
    for (const { electionId, constituencyId } of built)
      contests.set(`${electionId} ${constituencyId}`, { electionId, constituencyId });
    return [...contests.values()];
  }

  /**
   * Read the entities a nomination at the cards' contests can stand under, and give them to the data root, so that an option can show the entity itself. A read that is refused or fails leaves the page in its error state.
   * @param key - The selection the read is for.
   * @param contests - The election and constituency of every card.
   */
  async function readParentOptions(key: string, contests: Array<NominationContest>): Promise<void> {
    askedFor = key;
    parentOptions = undefined;
    // A rejection's message can hold the backend's own text, so it is logged and never shown.
    const options = await contestantCtx.getNominationParentOptions(contests).catch((e) => {
      log.error(`[Contestant app nomination editor] Error reading the parent options: ${e?.message}`);
      return undefined;
    });
    if (askedFor !== key) return;
    if (!options) {
      parentOptions = 'failed';
      return;
    }
    try {
      // The data root is mutated through `setDataRoot(updater)`, which runs the updater untracked.
      setDataRoot((dr) => dr.update(() => dr.provideEntityData(options.map((option) => option.entity))));
      parentOptions = options;
    } catch (e) {
      log.error(`[Contestant app nomination editor] Error providing the parent options to the data root: ${e}`);
      parentOptions = 'failed';
    }
  }

  ////////////////////////////////////////////////////////////////////
  // What the cards show
  ////////////////////////////////////////////////////////////////////

  type CardView = {
    card: EditorCard;
    headingId: string;
    electionName: string;
    constituencyName: string;
    /** The name of the constituency the nomination is stored in, on a moved card alone. */
    previousConstituencyName: string | undefined;
    choices: ParentChoices;
    options: Array<EntitySelectorOption>;
  };

  /** The entities the options name, each with the name the data root holds for it: `undefined` until the options are read, and `'failed'` when the data root does not hold one of their entities. */
  const listedLookup = $derived.by((): Array<ListedParent> | 'failed' | undefined => {
    if (!readOptions) return undefined;
    try {
      return readOptions.map(({ entity }) => ({
        entityType: entity.type,
        id: entity.id,
        name: contestantCtx.dataRoot.getEntity(entity.type, entity.id).name
      }));
    } catch (e) {
      log.error(`[Contestant app nomination editor] Error resolving a parent option in the data root: ${e}`);
      return 'failed';
    }
  });

  /** The entities the options name, or `undefined` while there are none to show. */
  const listed = $derived(listedLookup === 'failed' ? undefined : listedLookup);

  /** What each card's parent group offers, by the card's key. */
  const choicesByKey = $derived(
    new Map(
      cards.map((card) => [card.key, parentChoicesOf({ card, listed: listed ?? [], locale: contestantCtx.locale })])
    )
  );

  /** Every card with the names and options it is shown with: `undefined` until the options are listed, and `'failed'` when the data root does not hold a name a card is shown with, so that no card is shown without its options or with a name it could not resolve. */
  const viewsLookup = $derived.by((): Array<CardView> | 'failed' | undefined => {
    if (!listed || !cards.length) return undefined;
    try {
      return cards.map((card, index) => {
        const choices = choicesByKey.get(card.key) ?? { options: [], selected: undefined, required: false };
        return {
          card,
          headingId: `nomination-editor-card-${index}-heading`,
          electionName: contestantCtx.dataRoot.getElection(card.electionId).name,
          constituencyName: contestantCtx.dataRoot.getConstituency(card.constituencyId).name,
          previousConstituencyName:
            card.previousConstituencyId === undefined
              ? undefined
              : contestantCtx.dataRoot.getConstituency(card.previousConstituencyId).name,
          choices,
          options: choices.options.map((option) => selectorOptionOf(card, option))
        };
      });
    } catch (e) {
      log.error(`[Contestant app nomination editor] Error resolving a card's names in the data root: ${e}`);
      return 'failed';
    }
  });

  /** Every card with the names and options it is shown with, or `undefined` while there are none to show. */
  const views = $derived(viewsLookup === 'failed' ? undefined : viewsLookup);

  /** Which of its states the page is in. */
  const editorState = $derived.by((): 'loading' | 'ready' | 'saving' | 'error' => {
    if (parentOptions === 'failed' || listedLookup === 'failed' || viewsLookup === 'failed') return 'error';
    if (!views) return 'loading';
    return saving ? 'saving' : 'ready';
  });

  /** Whether the page lists cards. */
  const listing = $derived(views !== undefined);

  /** Where the link back to the selection leads: the editor's entry, with what the address chose as its selection. `undefined` where the editor has no step to select on. */
  const changeSelectionHref = $derived.by(() => {
    if (!admissible.length) return undefined;
    const selectable = hasSelectionStep({
      appSettings: contestantCtx.appSettings,
      dataRoot: contestantCtx.dataRoot,
      admissible
    });
    if (!selectable) return undefined;
    return getRoute.current({
      route: EDITOR_STEP_ROUTE.elections,
      ...selectionSearch({
        electionIds: [
          ...new Set([
            ...data.nominationContests.map((contest) => contest.electionId),
            ...data.nominationKeptElectionIds
          ])
        ],
        constituencyIds: [...new Set(data.nominationContests.map((contest) => contest.constituencyId))]
      })
    });
  });

  /**
   * One option of a card's parent group, as the selector shows it.
   * @param card - The card.
   * @param option - The option, as the draft arithmetic names it.
   */
  function selectorOptionOf(card: EditorCard, option: ParentChoices['options'][number]): EntitySelectorOption {
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
          hint: isNominatedAt(card, option.entityId) ? undefined : t(descriptor.parentNotNominatedHint)
        };
      }
      case 'unlisted': {
        const parent = builtOn.find((nomination) => nomination.id === card.nominationId)?.parent;
        return {
          kind: 'unlisted',
          value: option.value,
          name: parent?.name || parent?.shortName || '',
          hint: t('contestantApp.nominations.parent.unlisted')
        };
      }
    }
  }

  /**
   * Whether a listed entity is nominated in a card's election and constituency.
   */
  function isNominatedAt(card: EditorCard, entityId: string): boolean {
    const option = readOptions?.find(({ entity }) => entity.id === entityId);
    return !!option?.nominatedIn.some(
      (contest) => contest.electionId === card.electionId && contest.constituencyId === card.constituencyId
    );
  }

  ////////////////////////////////////////////////////////////////////
  // Errors
  ////////////////////////////////////////////////////////////////////

  /** The errors shown, by the card's key: those the last press found that the draft has not put right since. */
  const shownErrors = $derived.by(() => {
    const shown = new Map<string, CardErrorKind>();
    if (!reported.length) return shown;
    const standing = validateCards(cards, choicesByKey);
    for (const { key, error } of reported) {
      if (standing.some((other) => other.key === key && other.error === error)) shown.set(key, error);
    }
    return shown;
  });

  /**
   * The message of the error a card's parent group is in, if any.
   */
  function parentErrorOf(card: EditorCard): string | undefined {
    switch (shownErrors.get(card.key)) {
      case 'parentRequired':
        return t('contestantApp.nominations.error.parentRequired');
      case 'duplicateParent':
        return t('contestantApp.nominations.error.duplicateParent');
      default:
        return undefined;
    }
  }

  /**
   * Move focus to the first element a selector names inside the card of the key given, once the page shows what was just changed.
   */
  async function focusInCard(key: string, selector: string): Promise<void> {
    await tick();
    const index = cards.findIndex((card) => card.key === key);
    const card = cardList?.querySelectorAll<HTMLElement>('[data-testid="nomination-editor-card"]')[index];
    card?.querySelector<HTMLElement>(selector)?.focus();
  }

  /**
   * Move focus to the control an error is shown at: the name field for a missing name, and otherwise the first option of the card's parent group.
   */
  async function focusError({ key, error }: CardError): Promise<void> {
    await focusInCard(
      key,
      error === 'otherNameRequired'
        ? '[data-testid="nomination-editor-other-input"]'
        : '[data-testid="nomination-editor-parent"] input[type="radio"]'
    );
  }

  ////////////////////////////////////////////////////////////////////
  // The main button's label
  ////////////////////////////////////////////////////////////////////

  /** What the main button says and does: asked with the entity's tasks as they stand, read here in this scope, and with what the draft would write. */
  const submitAction = $derived(
    nominationsSaveAction(contestantCtx.taskState, draftFactsOf(cards, builtOn.length > 0))
  );

  ////////////////////////////////////////////////////////////////////
  // Removing and keeping
  ////////////////////////////////////////////////////////////////////

  /**
   * Say that a card's nomination is to be removed by the save. Nothing is written, and what was typed on the card stays in the draft. Focus moves to the card's Keep, which stands where its Remove was.
   */
  async function removeCard(card: EditorCard): Promise<void> {
    card.state = 'removed';
    await focusInCard(card.key, '[data-testid="nomination-editor-keep"]');
  }

  /**
   * Take a card's removal back: the card shows its fields again with what was typed. Focus moves to the card's Remove, which stands where its Keep was.
   */
  async function keepCard(card: EditorCard): Promise<void> {
    card.state = 'kept';
    await focusInCard(card.key, '[data-testid="nomination-editor-remove"]');
  }

  ////////////////////////////////////////////////////////////////////
  // Saving
  ////////////////////////////////////////////////////////////////////

  /**
   * Whether the address shown is one of the editor's steps.
   */
  function onEditorStep(): boolean {
    return !!page.route.id?.startsWith(`${CONTESTANT_NOMINATION_EDITOR}/`);
  }

  /**
   * Check every card that is not about to be removed and, when none is unfinished, write the entity's nominations and lead to the nominations view. With nothing to write, nothing is written. A card that is not finished, and a save that is not stored, each stay on the page and say why.
   */
  async function handleSubmit(): Promise<void> {
    if (editorState !== 'ready') return;
    saveMessage = undefined;

    const errors = validateCards(cards, choicesByKey);
    reported = errors;
    if (errors.length) {
      saveMessage = { outcome: 'invalid', text: t('contestantApp.nominations.error.checkCards') };
      await focusError(errors[0]);
      return;
    }

    // A draft that equals what is stored writes nothing, so that a nomination nobody changed is never sent as changed.
    if (!somethingToWrite(cards)) {
      await goto(getRoute.current('ContestantAppNominations'));
      return;
    }

    saving = true;
    // From here on a navigation is the save's own or the redirect of the re-read, so none of them asks.
    leavingUnasked = true;
    const startedFrom = builtOn;
    // A rejection's message can hold the backend's own text, so it is logged and never shown.
    const result = await Promise.resolve()
      .then(() => contestantCtx.setEntityNominations(desiredSetOf(cards, listed ?? []), startedFrom))
      .catch((e) => {
        log.error(`[Contestant app nomination editor] Error saving the nominations: ${e?.message}`);
        return undefined;
      });
    // The page's loads are run again whatever the outcome, so that the settings, the entity's nominations, its tasks and its question lists are those the database holds. The re-read redirects to the nominations view when nominations can no longer be edited.
    await invalidateAll().catch((e) => {
      log.error(`[Contestant app nomination editor] Error reading the page data again: ${e?.message}`);
    });
    // What the re-read brought has reached the entity's tasks and this page's own data after one tick.
    await tick();

    if (result?.type === 'saved') {
      // Where the re-read led out of the editor the user stays there; where it led to another step of the editor, the save still leads to the nominations view.
      if (onEditorStep()) await goto(getRoute.current('ContestantAppNominations'));
      return;
    }

    // The re-read led away from this page, which can show nothing any more.
    if (!shown) return;

    const outcome = await notStoredOutcome(result, startedFrom);
    saveMessage = { outcome, text: t(NOT_STORED_MESSAGE[outcome]) };
    leavingUnasked = false;
    saving = false;
    // The button was disabled while the save ran, which can cost it its focus.
    await tick();
    actions?.querySelector<HTMLElement>('[data-testid="contestant-nomination-submit"]')?.focus();
  }

  /** The message of each reason a save was not stored. */
  const NOT_STORED_MESSAGE = {
    changed: 'contestantApp.nominations.error.changed',
    hasCandidates: 'contestantApp.nominations.error.hasCandidates',
    tooManyPending: 'contestantApp.nominations.error.tooManyPending',
    answersLocked: 'contestantApp.common.nominationsNotEditableAnswersLocked',
    failed: 'contestantApp.nominations.error.saveFailed'
  } as const;

  /**
   * Why a save was not stored, decided in a fixed order after the page's data was read again: the write was refused because answers are locked, then the entity's nominations are no longer those the cards were built on, by the re-read or by the write's own refusal, then the two other refusals the write names, then anything else. Where the nominations have changed the cards are built again from them, and the read of their options is awaited.
   * @param result - What the write answered, or nothing for a write that was rejected.
   * @param startedFrom - The nominations the cards were built on when the main button was pressed.
   */
  async function notStoredOutcome(
    result: SetEntityNominationsResult | undefined,
    startedFrom: ReadonlyArray<EntityNomination>
  ): Promise<keyof typeof NOT_STORED_MESSAGE> {
    // The lock refuses the write before the nominations are compared, so the refusal says nothing of whether they have changed, and no save can be stored while it holds.
    if (result?.type === 'refused' && result.reason === 'answersLocked') return 'answersLocked';
    const stored = reachedNominationsOf(contestantCtx.nominations, data.nominationFacts);
    const refusedAsChanged = result?.type === 'refused' && result.reason === 'changed';
    if (refusedAsChanged || !sameNominations(startedFrom, stored)) {
      // The re-read has built the cards again already where it also changed what the address chose.
      if (builtOn === startedFrom) buildCardsAnew();
      await optionsRead;
      return 'changed';
    }
    if (result?.type === 'refused' && (result.reason === 'hasCandidates' || result.reason === 'tooManyPending'))
      return result.reason;
    return 'failed';
  }

  /**
   * Leave for the nominations view without asking, whatever the draft holds.
   */
  async function handleCancel(): Promise<void> {
    leavingUnasked = true;
    await goto(getRoute.current('ContestantAppNominations'));
    leavingUnasked = false;
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  // The shaded background sets the cards off from the page, so the overlay is pushed while cards are listed and reverted with them.
  $effect(() => {
    if (listing) return pageStyles.push({ drawer: { background: 'bg-base-200' } });
  });
</script>

<!-- One row of a card: the label above its value, which wraps at any character. -->
{#snippet row(label: string, value: string, testId: string)}
  <div>
    <dt class="small-info uc-first">{label}</dt>
    <dd class="mt-xs [overflow-wrap:anywhere]" data-testid={testId}>{value}</dd>
  </div>
{/snippet}

<PreventNavigation active={() => !leavingUnasked && somethingToWrite(cards)} />

<MainContent
  title={t('contestantApp.nominations.details.title')}
  data-testid="contestant-nomination-details"
  data-editor-state={editorState}>
  <p class="text-center">{t('contestantApp.nominations.details.ingress')}</p>

  {#if editorState === 'error'}
    <ErrorMessage inline class="mt-lg" />
  {:else if views}
    {#if changeSelectionHref}
      <Button
        text={t('contestantApp.nominations.details.changeSelection')}
        icon="previous"
        iconPos="left"
        href={changeSelectionHref}
        data-testid="contestant-nomination-change-selection" />
    {/if}
    <ul
      class="mt-lg gap-lg flex list-none flex-col self-stretch pl-0"
      role="list"
      bind:this={cardList}
      data-testid="contestant-nomination-details-list">
      {#each views as view (view.card.key)}
        {@const otherErrorId = `${view.headingId}-other-error`}
        {@const removedNoteId = `${view.headingId}-removed-note`}
        {@const otherNameMissing = shownErrors.get(view.card.key) === 'otherNameRequired'}
        {@const existing = view.card.nominationId !== undefined}
        <li>
          <article
            class="bg-base-100 p-lg rounded-lg"
            aria-labelledby={view.headingId}
            data-testid="nomination-editor-card"
            data-card-state={view.card.state}
            data-confirmed={view.card.confirmed ? 'true' : 'false'}
            data-moved={view.card.previousConstituencyId !== undefined ? 'true' : 'false'}>
            <h2 class="text-lg" id={view.headingId} data-testid="nomination-editor-election">{view.electionName}</h2>
            <dl class="mt-md gap-md flex flex-col">
              <div>
                <dt class="small-info uc-first">{t('common.constituency')}</dt>
                <dd class="mt-xs [overflow-wrap:anywhere]" data-testid="nomination-editor-constituency">
                  {view.constituencyName}
                </dd>
                {#if view.previousConstituencyName !== undefined}
                  <dd
                    class="small-info mt-xs [overflow-wrap:anywhere]"
                    data-testid="nomination-editor-previous-constituency">
                    {t('contestantApp.nominations.details.previousConstituency', {
                      constituency: view.previousConstituencyName
                    })}
                  </dd>
                {/if}
              </div>
              {#if existing}
                {@render row(
                  t('contestantApp.nominations.state.label'),
                  view.card.confirmed ? t('common.confirmed') : t('contestantApp.nominations.state.pending'),
                  'nomination-editor-state'
                )}
              {/if}
            </dl>
            {#if view.card.state === 'removed'}
              <Warning class="mt-md" role="status" id={removedNoteId} data-testid="nomination-editor-removed-note">
                {t(
                  view.card.confirmed
                    ? 'contestantApp.nominations.details.removedConfirmedNote'
                    : 'contestantApp.nominations.details.removedNote'
                )}
              </Warning>
              <Button
                class="mt-sm"
                text={t('contestantApp.nominations.details.keep')}
                icon="replay"
                iconPos="left"
                aria-describedby={removedNoteId}
                onclick={() => keepCard(view.card)}
                data-testid="nomination-editor-keep" />
            {:else}
              {#if view.card.state === 'kept' && view.card.confirmed}
                <p class="small-info mt-md" data-testid="nomination-editor-confirmed-note">
                  {t('contestantApp.nominations.details.confirmedNote')}
                </p>
              {/if}
              {#if view.card.state === 'new'}
                <p class="small-info mt-md" data-testid="nomination-editor-new-note">
                  {t('contestantApp.nominations.details.newNote')}
                </p>
              {/if}
              {#if view.options.length}
                <EntitySelector
                  class="mt-lg"
                  legend={t(descriptor.nominationParentLabel)}
                  options={view.options}
                  bind:selected={view.card.parentChoice}
                  required={view.choices.required}
                  error={parentErrorOf(view.card)}
                  emptyMessage={t(descriptor.parentNoOptions)}
                  data-testid="nomination-editor-parent">
                  {#snippet detail(option)}
                    {#if option.kind === 'other'}
                      <div class="mt-sm">
                        <Input
                          type="text"
                          label={t(descriptor.parentOtherLabel)}
                          info={t(descriptor.parentOtherInfo)}
                          required
                          {...OTHER_NAME_LIMIT}
                          autocomplete="off"
                          value={view.card.otherName}
                          onChange={(value) => (view.card.otherName = typeof value === 'string' ? value.trim() : '')}
                          aria-invalid={otherNameMissing ? 'true' : undefined}
                          aria-describedby={otherNameMissing ? otherErrorId : undefined}
                          containerProps={{ 'data-testid': 'nomination-editor-other' }}
                          data-testid="nomination-editor-other-input" />
                        {#if otherNameMissing}
                          <p
                            class="text-warning mt-sm"
                            role="alert"
                            id={otherErrorId}
                            data-testid="nomination-editor-other-error">
                            {t(descriptor.parentOtherRequired)}
                          </p>
                        {/if}
                      </div>
                    {/if}
                  {/snippet}
                </EntitySelector>
              {/if}
              <div class="mt-lg">
                <Input
                  type="text"
                  label={t(descriptor.electionSymbolLabel)}
                  info={t(descriptor.electionSymbolInfo)}
                  {...SYMBOL_LIMIT}
                  autocomplete="off"
                  value={view.card.electionSymbol}
                  onChange={(value) => (view.card.electionSymbol = typeof value === 'string' ? value.trim() : '')}
                  containerProps={{ 'data-testid': 'nomination-editor-symbol' }}
                  data-testid="nomination-editor-symbol-input" />
              </div>
              {#if existing}
                <Button
                  class="mt-lg"
                  text={t('contestantApp.nominations.details.remove')}
                  icon="removeFromList"
                  iconPos="left"
                  color="warning"
                  onclick={() => removeCard(view.card)}
                  data-testid="nomination-editor-remove" />
              {/if}
            {/if}
          </article>
        </li>
      {/each}
    </ul>
  {:else}
    <Loading />
  {/if}

  {#snippet primaryActions()}
    <!-- The message of a press that stayed on the page. The region is always rendered, so that a message put into it is announced. -->
    <div role="alert" data-testid="contestant-nomination-save-message" data-outcome={saveMessage?.outcome}>
      {#if saveMessage?.outcome === 'answersLocked'}
        <NotEditableNote reason="nominationsAnswersLocked" class="mb-lg mt-md" />
      {:else if saveMessage}
        <ErrorMessage inline message={saveMessage.text} class="mb-lg mt-md" />
      {/if}
    </div>

    <div class="grid w-full justify-items-center" bind:this={actions}>
      {#if editorState !== 'error'}
        <Button
          variant="main"
          icon="next"
          text={t(submitAction.labelKey)}
          loading={editorState !== 'ready'}
          loadingText={editorState === 'saving' ? t('common.saving') : undefined}
          onclick={handleSubmit}
          data-testid="contestant-nomination-submit"
          data-action={submitAction.action} />
      {/if}
      <Button text={t('common.cancel')} onclick={handleCancel} data-testid="contestant-nomination-cancel" />
    </div>
  {/snippet}
</MainContent>
