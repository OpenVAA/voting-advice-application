/**
 * @file contestantNominationEditor fixture.
 *
 * Function-fixture for the nomination editor of one entity of the Contestant App: the three pages under the entity's nominations view on which a user chooses the elections to stand in, the constituency in each, and the details of each nomination — its election symbol and what it stands under — before one press of the main button writes them all.
 *
 * Every `open…` step is a full page load. What a page shows is read from the state attributes of its container, of a card, of the parent group and of an option's row, and a name as the text or the accessible name of its own element. A card is named by its election and, where that is not enough, by its constituency and its place among the cards that share both. A parent option is chosen by its kind and, for an entity, by the accessible name of its radio.
 *
 * Surface, the addresses:
 *  - open(entity)                         — load the editor's entry address under the entity.
 *  - openStep(entity, step, selection?)   — load the address of one step, with a selection in the editor's own search params.
 *  - expectStep(step)                     — that step is shown, and neither of the other two.
 *  - expectNoStep()                       — the browser is in the Contestant App and shows no page of the editor.
 *  - expectNoTextOnPage(text)             — the page shown reads that text nowhere.
 *
 * The election step:
 *  - expectElections(names)               — the elections listed, in order.
 *  - expectChecked(names)                 — the elections that are checked, in order.
 *  - setElection(name, checked)           — check or uncheck one election.
 *  - expectElectionsHint(shown)           — the sentence that says nothing is chosen is shown and describes Continue, or is absent.
 *  - expectElectionsContinue(enabled)     — Continue can be pressed, or cannot.
 *  - continueFromElections()              — press Continue and wait until the step has been left.
 *
 * The constituency step:
 *  - expectConstituencyPickers(electionNames) — one picker per election named, in order.
 *  - expectGroupPicker(groupName)         — one picker under no heading, over the constituency group of that name.
 *  - chooseConstituency(constituencyName, electionName?) — choose a constituency in a picker.
 *  - expectChosenConstituency(constituencyName, electionName?) — a picker shows that constituency as chosen.
 *  - expectKept(electionName)             — the section that stands in for a picker is shown for that election.
 *  - expectNoElectionSentence(shown)      — the sentence that says the chosen constituency holds no election is shown and describes Continue, or is absent.
 *  - expectConstituenciesContinue(enabled) — Continue can be pressed, or cannot.
 *  - continueFromConstituencies()         — press Continue and wait until the step has been left.
 *
 * The details step, the page:
 *  - expectEditorState(state)             — what the page says of itself: loading, ready, saving or in error.
 *  - expectCards(cards)                   — each card's election, constituency, state, confirmed flag and moved flag, in order.
 *  - expectChangeSelection(shown)         — the link back to the selection is shown, or absent.
 *  - changeSelection()                    — follow that link and wait until the step has been left.
 *  - leaveByChangingSelection(answer)     — follow that link from a page that asks before it is left, and answer the question with "stay" or "leave".
 *  - expectLeavePrompts(count)            — how many times the page has asked before it was left, each time answered by the step above.
 *  - expectSubmit(action, label)          — what the main button does, and which of its four labels it reads.
 *  - submit()                             — press the main button.
 *  - cancel()                             — press Cancel, on whichever step is shown, and wait until the editor has been left.
 *  - expectSaveMessage(outcome)           — the outcome the message region carries with its message, or `null` for a region that holds none.
 *
 * The details step, one card:
 *  - expectNotes(card, notes)             — which of the confirmed, new and removed lines the card holds, and the constituency its previous-constituency line names.
 *  - expectStatus(card, value)            — the card's status row, or `null` for a card with none.
 *  - typeSymbol(card, text)               — type into the symbol field and leave it.
 *  - keySymbol(card, text)                — type into the symbol field key by key, as a keyboard does, and leave it.
 *  - expectSymbol(card, text)             — the symbol field's value.
 *  - expectParentGroup(card, facts)       — the parent group is absent; or it is shown, required or not, with a kind chosen and its options in order.
 *  - chooseParent(card, kind, name?)      — choose a parent option by its kind and, for an entity, by its name.
 *  - expectParentHint(card, name, shown)  — the option of that name carries a hint that describes its radio, or carries none.
 *  - expectParentEmptyLine(card, shown)   — the line that says no entity is listed is shown, or absent.
 *  - typeOtherName(card, text)            — type into the name field of "Other" and leave it.
 *  - keyOtherName(card, text)             — type into the name field of "Other" key by key, as a keyboard does, and leave it.
 *  - expectOtherName(card, text)          — the name field's value, or `null` for a card that shows no name field.
 *  - expectError(card, field)             — the parent group, or the name field, is in error and described by its message.
 *  - remove(card)                         — press Remove and wait until the card says it is to be removed.
 *  - keep(card)                           — press Keep and wait until the card says it is kept.
 *
 * Focus and geometry:
 *  - expectFocusOn(target)                — focus is on the page's heading, the main button, a card's Remove or Keep, a card's first parent option or a card's name field.
 *  - parentByKeyboard(card, keys)         — press keys from the parent group's tab stop, and report which option is chosen and where focus is.
 *  - parentTabStops(card)                 — how many radios of the parent group the Tab key stops on, walking through the group forwards and backwards.
 *  - expectNoDialog()                     — no browser dialog has been raised since the fixture was created, but those `leaveByChangingSelection` answered.
 *
 * One document:
 *  - markDocument()                       — mark the document the page shows, so that a later step can tell whether it is still the same one.
 *  - expectSameDocument()                 — the document shown is the one that was marked: no full page load was made since.
 *  - boxesOf(card)                        — the card and its option rows, name field, symbol field, Remove and Keep, for the steps of `shared/pageGeometry.fixture.ts`.
 *  - parentNameBoxOf(card, name)          — the element in which a card shows the name of a listed entity, for the same steps.
 *  - electionLabelBoxOf(name)             — the label of an election of the election step, for the same steps.
 *
 * The entity's id, and the ids of the elections and constituencies of a selection, are read with the service role by their external ids.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
// Use direct import to avoid loading other modules which depend on `$app/...`
import { escapeRegExp } from '../../../../apps/frontend/src/lib/utils/regexp';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { contestantUrlRe, ENTITY_SEGMENT_SOURCE } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import type { Dialog, Locator, Page } from '@playwright/test';
import type { EntityGrantTarget, SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/** The member of the window object that marks a document for `markDocument` and `expectSameDocument`. */
const DOCUMENT_MARK = '__nominationEditorDocumentMark';

/** A page of the editor. */
export type NominationEditorStep = 'elections' | 'constituencies' | 'details';

/** The steps, in the order a user meets them when none is passed over. */
const STEPS: ReadonlyArray<NominationEditorStep> = Object.freeze(['elections', 'constituencies', 'details']);

/** Each step's path below an entity. The election step's is also the editor's entry address. */
const STEP_SUB_PATH: Readonly<Record<NominationEditorStep, string>> = Object.freeze({
  elections: '/nominations/elections',
  constituencies: '/nominations/constituencies',
  details: '/nominations/details'
});

/** The editor's two search params, each repeatable. */
const ELECTION_PARAM = 'nominationElectionId';
const CONSTITUENCY_PARAM = 'nominationConstituencyId';

/** The selection a step's address carries. The members given by external id are read with the service role; the others are put into the address as they are, after them. */
export interface NominationEditorSelection {
  /** The elections chosen, by external id. */
  elections?: ReadonlyArray<string>;
  /** The constituencies chosen, by external id. */
  constituencies?: ReadonlyArray<string>;
  /** Further values of the election param, as given: for an address that names something that is no election. */
  electionIds?: ReadonlyArray<string>;
  /** Further values of the constituency param, as given. */
  constituencyIds?: ReadonlyArray<string>;
}

/** What the details page says of itself in `data-editor-state`. */
export type NominationEditorState = 'loading' | 'ready' | 'saving' | 'error';

/** What a card says of itself in `data-card-state`. */
export type EditorCardState = 'kept' | 'new' | 'removed';

/** What a card of the details step is expected to show. */
export interface ExpectedEditorCard {
  /** The card's heading: the election's name. */
  election: string;
  /** The constituency's name. On a moved card it is the constituency the nomination moves to. */
  constituency: string;
  /** Whether the nomination is kept, new or about to be removed. */
  state: EditorCardState;
  /** Whether the card says its nomination is confirmed. */
  confirmed: boolean;
  /** Whether the card says its nomination moves to another constituency. */
  moved: boolean;
}

/** Which card a step reads or operates. */
export interface EditorCardRef {
  /** The card's heading: the election's name. */
  election: string;
  /** The constituency's name, where the election has several cards. */
  constituency?: string;
  /** Which of several cards that share the election and the constituency, counted from 0 in the page's order. */
  nth?: number;
}

/** What the main button of the details step does, as its `data-action` names it. */
export type EditorSubmitAction = 'continue' | 'return';

/** Which label the main button reads: with nothing to write it continues or returns, and otherwise it saves first. */
export type EditorSubmitLabel = 'continue' | 'return' | 'saveAndContinue' | 'saveAndReturn';

/** The English text of each label of the main button. */
const SUBMIT_LABEL_TEXT: Readonly<Record<EditorSubmitLabel, string>> = Object.freeze({
  continue: 'Continue',
  return: 'Return',
  saveAndContinue: 'Save and Continue',
  saveAndReturn: 'Save and Return'
});

/** How the question a page asks before it is left is answered: the user stays on the page, or leaves it. */
export type EditorLeaveAnswer = 'stay' | 'leave';

/** The value of the message region's `data-outcome` attribute while it holds a message. */
export type EditorSaveOutcome = 'invalid' | 'changed' | 'hasCandidates' | 'tooManyPending' | 'failed';

/** The lines a card is expected to hold. */
export interface ExpectedEditorNotes {
  /** The line that says the nomination is confirmed. */
  confirmed: boolean;
  /** The line that says the nomination is new. */
  new: boolean;
  /** The line that says the nomination is about to be removed. */
  removed: boolean;
  /** The constituency the previous-constituency line names, or `null` for a card with no such line. */
  previousConstituency: string | null;
}

/** What a card's status row says. */
export type EditorCardStatus = 'confirmed' | 'pending';

/** The English text of each value of the status row. */
const STATUS_TEXT: Readonly<Record<EditorCardStatus, string>> = Object.freeze({
  confirmed: 'Confirmed',
  pending: 'Pending confirmation'
});

/** The kind of a parent option, as its row names it in `data-option-kind`. */
export type ParentOptionKind = 'entity' | 'none' | 'other' | 'unlisted';

/** A parent option: its kind and the accessible name of its radio. */
export interface ParentOption {
  kind: ParentOptionKind;
  name: string;
}

/** What the parent group of a card is expected to be. */
export type ExpectedParentGroup =
  | {
      /** The card holds no parent group. */
      shown: false;
    }
  | {
      shown: true;
      /** Whether the group says a choice is required. */
      required: boolean;
      /** The kind of the option chosen, or `null` while nothing is chosen. */
      chosen: ParentOptionKind | null;
      /** Every option of the group, in order. */
      options: ReadonlyArray<ParentOption>;
    };

/** A field of a card that can be in error. */
export type EditorErrorField = 'parent' | 'otherName';

/** Where focus is expected to be. */
export type EditorFocusTarget =
  | {
      /** The first-level heading of the page shown. */
      on: 'heading';
    }
  | {
      /** The main button of the details step. */
      on: 'submit';
    }
  | {
      /** A card's Remove, its Keep, the first radio of its parent group, or its name field of "Other". */
      on: 'remove' | 'keep' | 'firstParentOption' | 'otherName';
      card: EditorCardRef;
    };

/** What a parent group is left in after keys were pressed in it. */
export interface ParentKeyboardOutcome {
  /** The option chosen, or `null` when none is. */
  chosen: ParentOption | null;
  /** The option whose radio has focus, `'otherName'` when the name field of "Other" has it, or `null` when focus is on neither. */
  focused: ParentOption | 'otherName' | null;
}

/** The parts of a card whose boxes a geometry step measures. A part the card does not render is `null`. */
export interface EditorCardBoxes {
  /** The card itself. */
  card: Locator;
  /** The row of each parent option, in order. Empty for a card with no parent group. */
  optionRows: Array<Locator>;
  /** The container of the name field of "Other". */
  otherName: Locator | null;
  /** The container of the symbol field. */
  symbol: Locator | null;
  /** The Remove button. */
  remove: Locator | null;
  /** The Keep button, which a card shows while its nomination is about to be removed. */
  keep: Locator | null;
}

/** How many radios of a parent group the Tab key stops on while it walks through the group in each direction. A radio group is one tab stop, so each is 1. */
export interface ParentTabStops {
  /** With Tab, from before the group to after it. */
  forward: number;
  /** With Shift+Tab, from after the group to before it. */
  backward: number;
}

/** A pattern for a text that begins with `text`, after any leading whitespace. */
function beginsWith(text: string): RegExp {
  return new RegExp(`^\\s*${escapeRegExp(text)}`);
}

/** A pattern for a text that ends with `text`, before any trailing whitespace. */
function endsWith(text: string): RegExp {
  return new RegExp(`${escapeRegExp(text)}\\s*$`);
}

/** A text with every run of whitespace as one space, and none at either end. */
function normalized(text: string | null): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/** How a failure message names a card. */
function describeCard(ref: EditorCardRef): string {
  const constituency = ref.constituency === undefined ? '' : `, ${ref.constituency}`;
  const nth = ref.nth === undefined ? '' : `, number ${ref.nth + 1} of its kind`;
  return `the card of ${ref.election}${constituency}${nth}`;
}

/**
 * Create the fixture for the nomination editor of an entity.
 *
 * A listener for browser dialogs is registered on `page` here, so `expectNoDialog` covers everything the page does from the test's first step on.
 *
 * @param page - The page the fixture drives.
 * @param admin - A service-role client of the suite's project, used to read ids by external id.
 * @returns The fixture's steps, as the file's header lists them.
 */
export function createContestantNominationEditor(page: Page, admin: SupabaseAdminClient) {
  const ids = testIds.contestant.nominationEditor;
  const selector = testIds.shared.entitySelector;

  const stepPage: Readonly<Record<NominationEditorStep, Locator>> = {
    elections: page.getByTestId(ids.electionsPage),
    constituencies: page.getByTestId(ids.constituenciesPage),
    details: page.getByTestId(ids.detailsPage)
  };
  const anyStepPage = stepPage.elections.or(stepPage.constituencies).or(stepPage.details);

  const electionsList = stepPage.elections.getByTestId(ids.electionsList);
  const electionLabels = electionsList.getByTestId(testIds.voter.elections.label);
  const electionsHint = stepPage.elections.getByTestId(ids.electionsHint);
  const electionsContinue = stepPage.elections.getByTestId(ids.electionsContinue);

  const constituenciesList = stepPage.constituencies.getByTestId(ids.constituenciesList);
  const noElectionSentence = stepPage.constituencies.getByTestId(ids.constituenciesNoElection);
  const constituenciesContinue = stepPage.constituencies.getByTestId(ids.constituenciesContinue);

  const cards = stepPage.details.getByTestId(ids.cards).getByTestId(ids.card);
  const changeSelectionLink = stepPage.details.getByTestId(ids.changeSelection);
  const saveMessage = stepPage.details.getByTestId(ids.saveMessage);
  const submitButton = stepPage.details.getByTestId(ids.submit);
  const cancelButton = page.getByTestId(ids.cancel);

  const dialogsRaised: Array<string> = [];
  /** The confirms a step was waiting for, each with its message. */
  const leavePrompts: Array<string> = [];
  /** How the next confirm is answered, while a step waits for one. */
  let awaitedLeaveAnswer: EditorLeaveAnswer | undefined;

  /**
   * Answer the confirm a step is waiting for as that step said, and record it apart from the other dialogs. Any other dialog is recorded and, where nothing else answers it, dismissed, which is what the browser does with a dialog nobody listens for. The dismissal waits one turn of the event loop, so a listener that answers the dialog itself has done so first; a dialog can be answered once.
   */
  async function recordDialog(dialog: Dialog): Promise<void> {
    if (awaitedLeaveAnswer !== undefined && dialog.type() === 'confirm') {
      const answer = awaitedLeaveAnswer;
      awaitedLeaveAnswer = undefined;
      leavePrompts.push(dialog.message());
      if (answer === 'leave') await dialog.accept();
      else await dialog.dismiss();
      return;
    }
    dialogsRaised.push(`${dialog.type()}: ${dialog.message()}`);
    await new Promise<void>((resolve) => setImmediate(resolve));
    // reason: the dialog may have been answered by another listener or closed with its page; either leaves nothing to dismiss, and the record above is what the fixture asserts.
    await dialog.dismiss().catch(() => undefined);
  }
  page.on('dialog', (dialog) => void recordDialog(dialog));

  /**
   * The id of a row of the suite's project, by its external id.
   * @throws If the table holds no such row, or more than one.
   */
  async function idOf(collection: 'elections' | 'constituencies', externalId: string): Promise<string> {
    const { data, error } = await admin.query(collection).eq('external_id', externalId);
    if (error) throw new Error(`contestantNominationEditor: reading ${collection} failed: ${error.message}`);
    if (!data || data.length !== 1)
      throw new Error(`contestantNominationEditor: ${collection} holds no single row with external id ${externalId}`);
    return data[0].id as string;
  }

  /**
   * The address of a step under `entity`, in the form the default locale is served at, with `selection` in the editor's search params.
   */
  async function stepAddress(
    entity: EntityGrantTarget,
    step: NominationEditorStep,
    selection: NominationEditorSelection = {}
  ): Promise<string> {
    const entityId = await admin.entityId(entity);
    const home = buildRoute({
      route: 'ContestantAppEntityHome',
      locale: 'en',
      params: { entityType: entity.entityType, entityId }
    });
    const search = new URLSearchParams();
    for (const externalId of selection.elections ?? [])
      search.append(ELECTION_PARAM, await idOf('elections', externalId));
    for (const id of selection.electionIds ?? []) search.append(ELECTION_PARAM, id);
    for (const externalId of selection.constituencies ?? [])
      search.append(CONSTITUENCY_PARAM, await idOf('constituencies', externalId));
    for (const id of selection.constituencyIds ?? []) search.append(CONSTITUENCY_PARAM, id);
    const query = search.toString();
    return `${home}${STEP_SUB_PATH[step]}${query ? `?${query}` : ''}`;
  }

  /** The checkbox of the election of that name. */
  function electionOption(name: string): Locator {
    return electionsList
      .getByTestId(testIds.voter.elections.option)
      .and(page.getByRole('checkbox', { name, exact: true }));
  }

  /** Wait until the election step lists its elections: the list's place holds none while the elections are being read. */
  async function expectElectionsListed(): Promise<void> {
    await expect(electionLabels).not.toHaveCount(0, { timeout: TIMEOUTS.slowPage });
  }

  /**
   * The picker of a constituency: the one picker of the step, or the picker under the heading that names `electionName`.
   */
  function pickerOf(electionName?: string): Locator {
    if (electionName === undefined) return constituenciesList.getByRole('combobox');
    const heading = constituenciesList.getByRole('heading', { level: 3 }).filter({ hasText: electionName });
    // reason: a picker's section has no role and carries no test id; it is the parent of the heading that names its election, reached by the parent axis, which reads no translated string.
    // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
    return heading.locator('xpath=..').getByRole('combobox');
  }

  /** Wait until the details step says it is ready: its cards are shown with their options, and the page takes what is done on it. */
  async function expectReady(): Promise<void> {
    await expect(stepPage.details).toHaveAttribute('data-editor-state', 'ready', { timeout: TIMEOUTS.slowPage });
  }

  /** The card a reference names, which may match no card or several. */
  function cardOf(ref: EditorCardRef): Locator {
    let found = cards.filter({
      has: page.getByTestId(ids.cardElection).and(page.getByRole('heading', { name: ref.election, exact: true }))
    });
    if (ref.constituency !== undefined)
      found = found.filter({
        has: page.getByTestId(ids.cardConstituency).filter({ hasText: beginsWith(ref.constituency) })
      });
    return ref.nth === undefined ? found : found.nth(ref.nth);
  }

  /** The one card a reference names, once it is shown. A reference that names no card, or several, fails here. */
  async function shownCard(ref: EditorCardRef): Promise<Locator> {
    const card = cardOf(ref);
    await expect(card, `${describeCard(ref)} is one card`).toHaveCount(1, { timeout: TIMEOUTS.slowPage });
    return card;
  }

  /** The one card a reference names, on a page that takes what is done on it. */
  async function operableCard(ref: EditorCardRef): Promise<Locator> {
    await expectReady();
    return shownCard(ref);
  }

  /** The parent group of a card. */
  function parentGroupOf(card: Locator): Locator {
    return card.getByTestId(ids.parent);
  }

  /** The row of the option whose radio has that accessible name. */
  function optionRowByName(group: Locator, name: string): Locator {
    return group.getByTestId(selector.option).filter({ has: page.getByRole('radio', { name, exact: true }) });
  }

  /** The row of the option of that kind. */
  function optionRowByKind(group: Locator, kind: ParentOptionKind): Locator {
    // reason: an option's kind is the value of a state attribute of its row, and neither getByTestId nor getByRole selects by an attribute's value. The selector reads a test id and that attribute, neither of which is a translated string.
    // eslint-disable-next-line playwright/no-restricted-locators
    return group.locator(`[data-testid="${selector.option}"][data-option-kind="${kind}"]`);
  }

  /** Fill a single-line field and leave it, which is when the page takes the value. */
  async function commit(field: Locator, text: string): Promise<void> {
    await expect(field).toBeEnabled({ timeout: TIMEOUTS.page });
    await field.fill(text);
    await field.blur();
  }

  /**
   * Empty a single-line field, type `text` into it key by key and leave it. A key press is what a field's own limit applies to, so the field ends with no more than the limit lets through.
   */
  async function keyIn(field: Locator, text: string): Promise<void> {
    await expect(field).toBeEnabled({ timeout: TIMEOUTS.page });
    await field.clear();
    await field.pressSequentially(text);
    await field.blur();
  }

  /** Assert that an element of a page that is shown is there, or that the page holds none. */
  async function expectPresence(element: Locator, shown: boolean): Promise<void> {
    if (shown) await expect(element).toBeVisible({ timeout: TIMEOUTS.page });
    else await expect(element).toHaveCount(0, { timeout: TIMEOUTS.page });
  }

  /** Assert that `button` is described by the text `sentence` shows. */
  async function expectDescribedBy(button: Locator, sentence: Locator): Promise<void> {
    const text = normalized(await sentence.textContent());
    expect(text, 'the describing sentence holds text').not.toBe('');
    await expect(button).toHaveAccessibleDescription(text, { timeout: TIMEOUTS.page });
  }

  return {
    /**
     * Load the editor's entry address under `entity`, as a new document. The application forwards from there to the step that has something to choose.
     */
    async open(entity: EntityGrantTarget): Promise<void> {
      await page.goto(await stepAddress(entity, 'elections'));
    },

    /**
     * Load the address of `step` under `entity`, as a new document, with `selection` as the editor's own search params.
     */
    async openStep(
      entity: EntityGrantTarget,
      step: NominationEditorStep,
      selection?: NominationEditorSelection
    ): Promise<void> {
      await page.goto(await stepAddress(entity, step, selection));
    },

    /**
     * Assert that `step` is the page shown: its container is visible, the URL is that step's under an entity, and the page holds neither of the other two steps.
     */
    async expectStep(step: NominationEditorStep): Promise<void> {
      await expect(stepPage[step]).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page).toHaveURL(contestantUrlRe(STEP_SUB_PATH[step]), { timeout: TIMEOUTS.page });
      for (const other of STEPS) {
        if (other !== step) await expect(stepPage[other]).toHaveCount(0);
      }
    },

    /**
     * Assert that no page of the editor is shown: the URL is one of the Contestant App that is none of the three steps', and the page holds no step's container. Which page is shown instead is for that page's own fixture to say.
     */
    async expectNoStep(): Promise<void> {
      const steps = STEPS.map((step) => escapeRegExp(STEP_SUB_PATH[step])).join('|');
      await expect(page).toHaveURL(
        new RegExp(`/contestant(?=[/?#]|$)(?!${ENTITY_SEGMENT_SOURCE}?(?:${steps})(?=[/?#]|$))`),
        { timeout: TIMEOUTS.slowPage }
      );
      await expect(anyStepPage).toHaveCount(0, { timeout: TIMEOUTS.page });
    },

    /**
     * Assert that the page shown reads `text` nowhere: the text a user can read on it does not contain it. For a page that is already shown; the step waits for nothing.
     */
    async expectNoTextOnPage(text: string): Promise<void> {
      const shown = await page.evaluate(() => document.body.innerText);
      expect(shown, 'the page shows text').not.toBe('');
      expect(shown, `the page reads "${text}" nowhere`).not.toContain(text);
    },

    /**
     * Assert the elections the election step lists, by name and in order.
     */
    async expectElections(names: ReadonlyArray<string>): Promise<void> {
      await expectElectionsListed();
      await expect(electionLabels).toHaveText([...names], { timeout: TIMEOUTS.page });
    },

    /**
     * Assert which of the listed elections are checked, by name and in the list's order. An empty list means none is.
     */
    async expectChecked(names: ReadonlyArray<string>): Promise<void> {
      await expectElectionsListed();
      const checked = electionLabels.filter({ has: page.getByRole('checkbox', { checked: true }) });
      if (names.length === 0) await expect(checked).toHaveCount(0, { timeout: TIMEOUTS.page });
      else await expect(checked).toHaveText([...names], { timeout: TIMEOUTS.page });
    },

    /**
     * Check or uncheck the election of that name, through its own checkbox.
     */
    async setElection(name: string, checked: boolean): Promise<void> {
      await expectElectionsListed();
      const option = electionOption(name);
      await expect(option, `the election ${name} is listed once`).toHaveCount(1, { timeout: TIMEOUTS.page });
      await option.setChecked(checked);
      await expect(option).toBeChecked({ checked, timeout: TIMEOUTS.page });
    },

    /**
     * Assert that the election step shows the sentence saying no election is chosen, and that the sentence is what describes Continue; or that the step holds no such sentence.
     */
    async expectElectionsHint(shown: boolean): Promise<void> {
      await expectElectionsListed();
      await expectPresence(electionsHint, shown);
      if (shown) await expectDescribedBy(electionsContinue, electionsHint);
    },

    /**
     * Assert that Continue of the election step can be pressed, or that it cannot.
     */
    async expectElectionsContinue(enabled: boolean): Promise<void> {
      await expectElectionsListed();
      await expect(electionsContinue).toBeEnabled({ enabled, timeout: TIMEOUTS.page });
    },

    /**
     * Press Continue of the election step and wait until the step has been left. The press is a navigation inside the application.
     */
    async continueFromElections(): Promise<void> {
      await expect(electionsContinue).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      await electionsContinue.click();
      await expect(stepPage.elections).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert the pickers of the constituency step: one per election named, in order. Several pickers are each headed by their election; a single picker has no heading, so one name asserts that the step holds one picker and no heading.
     */
    async expectConstituencyPickers(electionNames: ReadonlyArray<string>): Promise<void> {
      await expect(constituenciesList).toBeVisible({ timeout: TIMEOUTS.slowPage });
      const headings = constituenciesList.getByRole('heading', { level: 3 });
      if (electionNames.length > 1) {
        await expect(headings).toContainText([...electionNames], { timeout: TIMEOUTS.page });
      } else {
        expect(electionNames, 'the constituency step is never shown with no picker').toHaveLength(1);
        await expect(headings).toHaveCount(0, { timeout: TIMEOUTS.page });
        await expect(pickerOf()).toHaveCount(1, { timeout: TIMEOUTS.page });
      }
    },

    /**
     * Assert that the constituency step holds one picker, under no heading, and that the picker is the one over the constituency group of that name: the form the step takes while a constituency group is chosen first. A picker is named for its group.
     */
    async expectGroupPicker(groupName: string): Promise<void> {
      await expect(constituenciesList).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(constituenciesList.getByRole('heading', { level: 3 })).toHaveCount(0, { timeout: TIMEOUTS.page });
      await expect(pickerOf()).toHaveCount(1, { timeout: TIMEOUTS.page });
      await expect(pickerOf()).toHaveAccessibleName(new RegExp(escapeRegExp(groupName)), { timeout: TIMEOUTS.page });
    },

    /**
     * Choose the constituency of that name: in the step's one picker, or in the picker headed by `electionName`. A picker is the control the selector renders for a group of several constituencies; its options open in a list.
     */
    async chooseConstituency(constituencyName: string, electionName?: string): Promise<void> {
      const picker = pickerOf(electionName);
      await expect(picker, 'the constituency is chosen in one picker').toHaveCount(1, { timeout: TIMEOUTS.slowPage });
      await picker.click();
      const options = page.getByRole('listbox');
      await expect(options).toBeVisible({ timeout: TIMEOUTS.page });
      await options.getByRole('option', { name: constituencyName, exact: true }).click();
      await expect(picker).toHaveValue(endsWith(constituencyName), { timeout: TIMEOUTS.page });
    },

    /**
     * Assert that the step's one picker, or the picker headed by `electionName`, shows the constituency of that name as chosen.
     */
    async expectChosenConstituency(constituencyName: string, electionName?: string): Promise<void> {
      const picker = pickerOf(electionName);
      await expect(picker, 'the constituency is read from one picker').toHaveCount(1, { timeout: TIMEOUTS.slowPage });
      await expect(picker).toHaveValue(endsWith(constituencyName), { timeout: TIMEOUTS.page });
    },

    /**
     * Assert that the constituency step shows, for the election of that name, the section that stands in for a picker.
     */
    async expectKept(electionName: string): Promise<void> {
      const kept = stepPage.constituencies
        .getByTestId(ids.constituenciesKept)
        .filter({ has: page.getByRole('heading', { name: electionName, exact: true }) });
      await expect(kept).toHaveCount(1, { timeout: TIMEOUTS.slowPage });
      await expect(kept).toBeVisible();
    },

    /**
     * Assert that the constituency step shows the sentence saying the chosen constituency holds no election the entity can stand in, and that the sentence is what describes Continue; or that the step holds no such sentence.
     */
    async expectNoElectionSentence(shown: boolean): Promise<void> {
      await expect(constituenciesList).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expectPresence(noElectionSentence, shown);
      if (shown) await expectDescribedBy(constituenciesContinue, noElectionSentence);
    },

    /**
     * Assert that Continue of the constituency step can be pressed, or that it cannot.
     */
    async expectConstituenciesContinue(enabled: boolean): Promise<void> {
      await expect(constituenciesList).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(constituenciesContinue).toBeEnabled({ enabled, timeout: TIMEOUTS.page });
    },

    /**
     * Press Continue of the constituency step and wait until the step has been left. The press is a navigation inside the application.
     */
    async continueFromConstituencies(): Promise<void> {
      await expect(constituenciesContinue).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      await constituenciesContinue.click();
      await expect(stepPage.constituencies).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert what the details page says of itself.
     */
    async expectEditorState(state: NominationEditorState): Promise<void> {
      await expect(stepPage.details).toHaveAttribute('data-editor-state', state, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert the cards of the details step, in order: each one's election and constituency as text, and its state, its confirmed flag and its moved flag as the card states them. On a moved card the constituency is the one its value begins with.
     */
    async expectCards(expected: ReadonlyArray<ExpectedEditorCard>): Promise<void> {
      await expect(cards).toHaveCount(expected.length, { timeout: TIMEOUTS.slowPage });
      for (const [index, card] of expected.entries()) {
        const shown = cards.nth(index);
        await expect(shown.getByTestId(ids.cardElection)).toHaveText(card.election);
        await expect(shown.getByTestId(ids.cardConstituency)).toHaveText(
          card.moved ? beginsWith(card.constituency) : card.constituency
        );
        await expect(shown).toHaveAttribute('data-card-state', card.state);
        await expect(shown).toHaveAttribute('data-confirmed', String(card.confirmed));
        await expect(shown).toHaveAttribute('data-moved', String(card.moved));
      }
    },

    /**
     * Assert that the details step shows the link back to the selection, or holds none.
     */
    async expectChangeSelection(shown: boolean): Promise<void> {
      await expectReady();
      await expectPresence(changeSelectionLink, shown);
    },

    /**
     * Follow the link back to the selection and wait until the details step has been left.
     */
    async changeSelection(): Promise<void> {
      await expectReady();
      await changeSelectionLink.click();
      await expect(stepPage.details).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Follow the link back to the selection from a page that asks before it is left, and answer the question: with "stay" the details step is still shown afterwards, with "leave" it has been left. The one confirm the press raises is answered here and counted by `expectLeavePrompts`; a press that raises none fails the step.
     * @param answer - Whether the user stays on the page or leaves it.
     */
    async leaveByChangingSelection(answer: EditorLeaveAnswer): Promise<void> {
      await expectReady();
      const asked = leavePrompts.length;
      awaitedLeaveAnswer = answer;
      await changeSelectionLink.click();
      await expect
        .poll(() => leavePrompts.length, {
          message: 'the page asked once before it was left',
          timeout: TIMEOUTS.page
        })
        .toBe(asked + 1);
      expect(leavePrompts[asked], 'the question holds a message').not.toBe('');
      if (answer === 'stay') await expect(stepPage.details).toBeVisible({ timeout: TIMEOUTS.page });
      else await expect(stepPage.details).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert how many times the page has asked before it was left since the fixture was created: the confirms `leaveByChangingSelection` answered. A confirm no step was waiting for is not among them, and fails `expectNoDialog`.
     */
    async expectLeavePrompts(count: number): Promise<void> {
      expect(leavePrompts, 'the confirms raised on leaving the page').toHaveLength(count);
    },

    /**
     * Assert what the main button of the details step does, and which label it reads. The label is read in English, so the page is one opened in that locale.
     */
    async expectSubmit(action: EditorSubmitAction, label: EditorSubmitLabel): Promise<void> {
      await expect(submitButton).toHaveAttribute('data-action', action, { timeout: TIMEOUTS.slowPage });
      await expect(submitButton).toHaveText(SUBMIT_LABEL_TEXT[label], { timeout: TIMEOUTS.page });
    },

    /**
     * Press the main button of the details step, once the page is ready. What the press led to is for the next step to assert: another page, or a message.
     */
    async submit(): Promise<void> {
      await expectReady();
      await submitButton.click();
    },

    /**
     * Press Cancel on whichever step is shown, and wait until no step is.
     */
    async cancel(): Promise<void> {
      await expect(anyStepPage).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await cancelButton.click();
      await expect(anyStepPage).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert the outcome the message region of the details step carries, and that it shows a message; or, for `null`, that the page holds no message and no outcome. A region with none is what a page shows before anything was pressed, so `null` is asserted once the press has been seen to lead somewhere.
     */
    async expectSaveMessage(outcome: EditorSaveOutcome | null): Promise<void> {
      await expect(stepPage.details).toBeVisible({ timeout: TIMEOUTS.slowPage });
      if (outcome !== null) {
        await expect(saveMessage).toHaveAttribute('data-outcome', outcome, { timeout: TIMEOUTS.slowPage });
        await expect(saveMessage).not.toBeEmpty();
        return;
      }
      await expect
        .poll(
          () =>
            saveMessage.evaluateAll((regions) =>
              regions
                .map((region) => ({
                  outcome: region.getAttribute('data-outcome') ?? '',
                  text: (region.textContent ?? '').trim()
                }))
                .filter((region) => region.outcome !== '' || region.text !== '')
            ),
          { message: 'the message region holds no message', timeout: TIMEOUTS.page }
        )
        .toEqual([]);
    },

    /**
     * Assert which lines a card holds: the one saying its nomination is confirmed, the one saying it is new, the one saying it is about to be removed, and the one naming the constituency it moves from.
     */
    async expectNotes(ref: EditorCardRef, notes: ExpectedEditorNotes): Promise<void> {
      const card = await shownCard(ref);
      await expectPresence(card.getByTestId(ids.confirmedNote), notes.confirmed);
      await expectPresence(card.getByTestId(ids.newNote), notes.new);
      await expectPresence(card.getByTestId(ids.removedNote), notes.removed);
      const previous = card.getByTestId(ids.cardPreviousConstituency);
      if (notes.previousConstituency === null) await expect(previous).toHaveCount(0, { timeout: TIMEOUTS.page });
      else await expect(previous).toContainText(notes.previousConstituency, { timeout: TIMEOUTS.page });
    },

    /**
     * Assert a card's status row: that it reads confirmed or pending, with the card's own flag saying the same; or, for `null`, that the card has no status row. The row is read in English.
     */
    async expectStatus(ref: EditorCardRef, value: EditorCardStatus | null): Promise<void> {
      const card = await shownCard(ref);
      const row = card.getByTestId(ids.cardState);
      if (value === null) {
        await expect(row).toHaveCount(0, { timeout: TIMEOUTS.page });
        return;
      }
      await expect(row).toHaveText(STATUS_TEXT[value], { timeout: TIMEOUTS.page });
      await expect(card).toHaveAttribute('data-confirmed', String(value === 'confirmed'));
    },

    /**
     * Type `text` into a card's symbol field and leave the field.
     */
    async typeSymbol(ref: EditorCardRef, text: string): Promise<void> {
      const card = await operableCard(ref);
      await commit(card.getByTestId(ids.symbolInput), text);
    },

    /**
     * Type `text` into a card's symbol field key by key, as a keyboard does, and leave the field. What the field then holds is for `expectSymbol` to say: a text longer than the field's limit is not held whole.
     */
    async keySymbol(ref: EditorCardRef, text: string): Promise<void> {
      const card = await operableCard(ref);
      await keyIn(card.getByTestId(ids.symbolInput), text);
    },

    /**
     * Assert the value of a card's symbol field.
     */
    async expectSymbol(ref: EditorCardRef, text: string): Promise<void> {
      const card = await shownCard(ref);
      await expect(card.getByTestId(ids.symbolInput)).toHaveValue(text, { timeout: TIMEOUTS.page });
    },

    /**
     * Assert a card's parent group: that the card holds none; or that it is shown, says whether a choice is required, names the kind chosen, and lists exactly the options given, each by its kind and the accessible name of its radio, in order.
     */
    async expectParentGroup(ref: EditorCardRef, facts: ExpectedParentGroup): Promise<void> {
      const card = await shownCard(ref);
      const group = parentGroupOf(card);
      if (!facts.shown) {
        await expect(group).toHaveCount(0, { timeout: TIMEOUTS.page });
        return;
      }
      await expect(group).toBeVisible({ timeout: TIMEOUTS.page });
      if (facts.required) await expect(group).toHaveAttribute('aria-required', 'true');
      else await expect(group).not.toHaveAttribute('aria-required', 'true');
      await expect(group).toHaveAttribute('data-selected-kind', facts.chosen ?? '');
      const rows = group.getByTestId(selector.option);
      await expect(rows).toHaveCount(facts.options.length, { timeout: TIMEOUTS.page });
      for (const [index, option] of facts.options.entries()) {
        const row = rows.nth(index);
        await expect(row).toHaveAttribute('data-option-kind', option.kind);
        await expect(row.getByTestId(selector.optionInput)).toHaveAccessibleName(option.name);
      }
    },

    /**
     * Choose a parent option of a card: an entity by the accessible name of its radio, any other option by its kind. The option's row is the pointer target, so the row is what is pressed.
     * @param name - The name of the entity. Required for an entity, and read for no other kind.
     * @throws If an entity is to be chosen and no name is given.
     */
    async chooseParent(ref: EditorCardRef, kind: ParentOptionKind, name?: string): Promise<void> {
      if (kind === 'entity' && name === undefined)
        throw new Error('contestantNominationEditor: an entity is chosen by its name');
      const card = await operableCard(ref);
      const group = parentGroupOf(card);
      const row = kind === 'entity' ? optionRowByName(group, name as string) : optionRowByKind(group, kind);
      await expect(row, `${describeCard(ref)} holds one such option`).toHaveCount(1, { timeout: TIMEOUTS.page });
      await expect(row).toHaveAttribute('data-option-kind', kind);
      await row.click();
      await expect(row.getByTestId(selector.optionInput)).toBeChecked({ timeout: TIMEOUTS.page });
      await expect(group).toHaveAttribute('data-selected-kind', kind, { timeout: TIMEOUTS.page });
    },

    /**
     * Assert that the option of that name carries a hint which is what describes its radio, or that it carries none.
     */
    async expectParentHint(ref: EditorCardRef, name: string, shown: boolean): Promise<void> {
      const card = await shownCard(ref);
      const row = optionRowByName(parentGroupOf(card), name);
      await expect(row, `${describeCard(ref)} holds one option named ${name}`).toHaveCount(1, {
        timeout: TIMEOUTS.page
      });
      const hint = row.getByTestId(selector.optionHint);
      await expectPresence(hint, shown);
      if (shown) await expectDescribedBy(row.getByTestId(selector.optionInput), hint);
    },

    /**
     * Assert that a card's parent group shows the line saying no entity is listed, or holds no such line.
     */
    async expectParentEmptyLine(ref: EditorCardRef, shown: boolean): Promise<void> {
      const card = await shownCard(ref);
      const group = parentGroupOf(card);
      await expect(group).toBeVisible({ timeout: TIMEOUTS.page });
      await expectPresence(group.getByTestId(selector.empty), shown);
    },

    /**
     * Type `text` into a card's name field of "Other" and leave the field.
     */
    async typeOtherName(ref: EditorCardRef, text: string): Promise<void> {
      const card = await operableCard(ref);
      await commit(card.getByTestId(ids.otherInput), text);
    },

    /**
     * Type `text` into a card's name field of "Other" key by key, as a keyboard does, and leave the field. What the field then holds is for `expectOtherName` to say: a text longer than the field's limit is not held whole.
     */
    async keyOtherName(ref: EditorCardRef, text: string): Promise<void> {
      const card = await operableCard(ref);
      await keyIn(card.getByTestId(ids.otherInput), text);
    },

    /**
     * Assert the value of a card's name field of "Other", or, for `null`, that the card shows no such field.
     */
    async expectOtherName(ref: EditorCardRef, text: string | null): Promise<void> {
      const card = await shownCard(ref);
      const field = card.getByTestId(ids.otherInput);
      if (text === null) await expect(field).toHaveCount(0, { timeout: TIMEOUTS.page });
      else await expect(field).toHaveValue(text, { timeout: TIMEOUTS.page });
    },

    /**
     * Assert that a field of a card is in error: it says it is invalid, its message is shown, and the message is what describes it. The parent group is described by its message alone; the name field also by its info line.
     */
    async expectError(ref: EditorCardRef, field: EditorErrorField): Promise<void> {
      const card = await shownCard(ref);
      const group = parentGroupOf(card);
      const control = field === 'parent' ? group : card.getByTestId(ids.otherInput);
      const error = field === 'parent' ? group.getByTestId(selector.error) : card.getByTestId(ids.otherError);
      await expect(error).toBeVisible({ timeout: TIMEOUTS.page });
      await expect(control).toHaveAttribute('aria-invalid', 'true');
      const message = normalized(await error.textContent());
      expect(message, 'the error holds a message').not.toBe('');
      await expect(control).toHaveAccessibleDescription(
        field === 'parent' ? message : new RegExp(escapeRegExp(message))
      );
    },

    /**
     * Press a card's Remove and wait until the card says its nomination is about to be removed.
     */
    async remove(ref: EditorCardRef): Promise<void> {
      const card = await operableCard(ref);
      await card.getByTestId(ids.remove).click();
      await expect(card).toHaveAttribute('data-card-state', 'removed', { timeout: TIMEOUTS.page });
    },

    /**
     * Press a card's Keep and wait until the card says its nomination is kept.
     */
    async keep(ref: EditorCardRef): Promise<void> {
      const card = await operableCard(ref);
      await card.getByTestId(ids.keep).click();
      await expect(card).toHaveAttribute('data-card-state', 'kept', { timeout: TIMEOUTS.page });
    },

    /**
     * Assert where keyboard focus is.
     */
    async expectFocusOn(target: EditorFocusTarget): Promise<void> {
      if (target.on === 'heading') {
        await expect(anyStepPage).toBeVisible({ timeout: TIMEOUTS.slowPage });
        await expect(page.getByRole('heading', { level: 1 })).toBeFocused({ timeout: TIMEOUTS.page });
        return;
      }
      if (target.on === 'submit') {
        await expect(submitButton).toBeFocused({ timeout: TIMEOUTS.page });
        return;
      }
      const card = await shownCard(target.card);
      const focused: Readonly<Record<typeof target.on, Locator>> = {
        remove: card.getByTestId(ids.remove),
        keep: card.getByTestId(ids.keep),
        firstParentOption: parentGroupOf(card).getByTestId(selector.optionInput).first(),
        otherName: card.getByTestId(ids.otherInput)
      };
      await expect(focused[target.on]).toBeFocused({ timeout: TIMEOUTS.page });
    },

    /**
     * Put focus on the tab stop of a card's parent group — the radio that is chosen, or the first while none is — press `keys` one after the other, and report which option is then chosen and where focus is. The step asserts nothing of the outcome: the caller does.
     * @param keys - Key names as the keyboard takes them, such as `ArrowDown` or `Space`.
     */
    async parentByKeyboard(ref: EditorCardRef, keys: ReadonlyArray<string>): Promise<ParentKeyboardOutcome> {
      const card = await operableCard(ref);
      const group = parentGroupOf(card);
      await expect(group).toBeVisible({ timeout: TIMEOUTS.page });
      const chosen = group.getByRole('radio', { checked: true });
      const tabStop = (await chosen.count()) === 1 ? chosen : group.getByTestId(selector.optionInput).first();
      await tabStop.focus();
      await expect(tabStop).toBeFocused({ timeout: TIMEOUTS.page });
      for (const key of keys) await page.keyboard.press(key);

      return card.evaluate(
        (root, { optionId, inputId, otherInputId }) => {
          const optionOf = (row: Element): { kind: string; name: string; input: HTMLInputElement | null } => {
            const input = row.querySelector<HTMLInputElement>(`[data-testid="${inputId}"]`);
            return {
              kind: row.getAttribute('data-option-kind') ?? '',
              name: (input?.labels?.[0]?.textContent ?? '').replace(/\s+/g, ' ').trim(),
              input
            };
          };
          const options = [...root.querySelectorAll(`[data-testid="${optionId}"]`)].map(optionOf);
          const active = document.activeElement;
          const chosenOption = options.find((option) => option.input?.checked);
          const focusedOption = options.find((option) => option.input !== null && option.input === active);
          const onOtherName =
            active !== null && root.contains(active) && active.getAttribute('data-testid') === otherInputId;
          return {
            chosen: chosenOption ? { kind: chosenOption.kind, name: chosenOption.name } : null,
            focused: focusedOption
              ? { kind: focusedOption.kind, name: focusedOption.name }
              : onOtherName
                ? ('otherName' as const)
                : null
          };
        },
        { optionId: selector.option, inputId: selector.optionInput, otherInputId: ids.otherInput }
      ) as Promise<ParentKeyboardOutcome>;
    },

    /**
     * Count the radios of a card's parent group that the Tab key stops on: with Tab from the control before the group until focus has left the group's radios, and with Shift+Tab from the control after it. Each walk begins on the group's tab stop — the radio that is chosen, or the first while none is — and first steps out of the radios against its own direction. The step chooses nothing and asserts nothing of the counts: the caller does.
     */
    async parentTabStops(ref: EditorCardRef): Promise<ParentTabStops> {
      const card = await operableCard(ref);
      const group = parentGroupOf(card);
      await expect(group).toBeVisible({ timeout: TIMEOUTS.page });
      const radios = group.getByTestId(selector.optionInput);
      const radioCount = await radios.count();
      expect(radioCount, `${describeCard(ref)} holds a parent option`).toBeGreaterThan(0);

      /** Whether focus is on a radio of the group. */
      const onRadio = (): Promise<boolean> =>
        group.evaluate((root, inputId) => {
          const active = document.activeElement;
          return active !== null && root.contains(active) && active.getAttribute('data-testid') === inputId;
        }, selector.optionInput);

      /** The radios `into` stops on, entering the group from the control `outOf` leads to. Neither loop presses more often than the group has radios. */
      const walk = async (into: string, outOf: string): Promise<number> => {
        const chosen = group.getByRole('radio', { checked: true });
        const tabStop = (await chosen.count()) === 1 ? chosen : radios.first();
        await tabStop.focus();
        await expect(tabStop).toBeFocused({ timeout: TIMEOUTS.page });
        for (let presses = 0; presses < radioCount && (await onRadio()); presses++) await page.keyboard.press(outOf);
        expect(await onRadio(), `${outOf} has led out of the radios of the group`).toBe(false);
        await page.keyboard.press(into);
        let stops = 0;
        while (stops <= radioCount && (await onRadio())) {
          stops++;
          await page.keyboard.press(into);
        }
        return stops;
      };

      return { forward: await walk('Tab', 'Shift+Tab'), backward: await walk('Shift+Tab', 'Tab') };
    },

    /**
     * Assert that the page has raised no browser dialog — no alert, confirm or prompt — since the fixture was created, which is before the test's first step. A confirm that `leaveByChangingSelection` was waiting for and answered is not counted.
     */
    async expectNoDialog(): Promise<void> {
      expect(dialogsRaised, 'the page raised no browser dialog').toEqual([]);
    },

    /**
     * Mark the document the page shows. The mark is a member of the document's window object, which a navigation inside the application keeps and a full page load does not.
     */
    async markDocument(): Promise<void> {
      await page.evaluate((mark) => {
        (window as unknown as Record<string, unknown>)[mark] = true;
      }, DOCUMENT_MARK);
    },

    /**
     * Assert that the document the page shows is the one `markDocument` marked: every navigation since was made inside the application, and none loaded a new document.
     */
    async expectSameDocument(): Promise<void> {
      const marked = await page.evaluate(
        (mark) => (window as unknown as Record<string, unknown>)[mark] === true,
        DOCUMENT_MARK
      );
      expect(marked, 'the document shown is the one that was marked').toBe(true);
    },

    /**
     * Hand over a card and its parts for the geometry steps: the card, the row of each parent option, the containers of the name field of "Other" and of the symbol field, Remove and Keep. The parts are those the card renders when the step is called.
     */
    async boxesOf(ref: EditorCardRef): Promise<EditorCardBoxes> {
      const card = await shownCard(ref);
      await expect(card).toBeVisible({ timeout: TIMEOUTS.page });
      const rows = parentGroupOf(card).getByTestId(selector.option);
      const optionRows = Array.from({ length: await rows.count() }, (_, index) => rows.nth(index));
      const rendered = async (part: Locator): Promise<Locator | null> => ((await part.count()) === 1 ? part : null);
      return {
        card,
        optionRows,
        otherName: await rendered(card.getByTestId(ids.other)),
        symbol: await rendered(card.getByTestId(ids.symbol)),
        remove: await rendered(card.getByTestId(ids.remove)),
        keep: await rendered(card.getByTestId(ids.keep))
      };
    },

    /**
     * Hand over, for the geometry steps, the element in which a card's parent group shows the name of the listed entity of that name. The element reads exactly that name; whether all of it can be seen is for the geometry steps to say.
     */
    async parentNameBoxOf(ref: EditorCardRef, name: string): Promise<Locator> {
      const card = await shownCard(ref);
      const row = optionRowByName(parentGroupOf(card), name);
      await expect(row, `${describeCard(ref)} holds one option named ${name}`).toHaveCount(1, {
        timeout: TIMEOUTS.page
      });
      await expect(row).toHaveAttribute('data-option-kind', 'entity');
      const shownName = row.getByTestId(testIds.voter.results.cardTitle);
      await expect(shownName).toHaveText(name, { timeout: TIMEOUTS.page });
      return shownName;
    },

    /**
     * Hand over, for the geometry steps, the label of the election of that name on the election step: the checkbox together with the name beside it.
     */
    async electionLabelBoxOf(name: string): Promise<Locator> {
      await expectElectionsListed();
      const label = electionLabels.filter({ has: page.getByRole('checkbox', { name, exact: true }) });
      await expect(label, `the election ${name} is listed once`).toHaveCount(1, { timeout: TIMEOUTS.page });
      return label;
    }
  };
}

/** The steps of the nomination-editor fixture. */
export type ContestantNominationEditorFixture = ReturnType<typeof createContestantNominationEditor>;
