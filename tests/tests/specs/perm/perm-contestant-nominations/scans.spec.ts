/**
 * @file scans.spec.ts — perm-chain spec, one surface of the `perm-contestant-nominations` project.
 *
 * Scans: fourteen states of the editor's three steps and of the nominations view, each in the light and the dark theme, declared through `declareScans` of `tests/tests/utils/contestantAxeScan.ts` and so through the one shared gate. They are here and not in the scan project because only this dataset holds what the states need: an entity with no nomination, several elections of several nomination shapes, parties and alliances to stand under, and a lock or an election's nomination shape that is changed for the whole project.
 *
 * Each entry's `reach` sets its state through the state steps, walks to the state through the fixtures' steps — a full page load after every state step — and ends on the steps that assert the state, before the reach proof and the scan. The describe that declares a session's entries puts back, after each scan, the contestant-editing setting, the nomination shape of each election an entry changes, and the entity's answers and nominations. A state of the details step is scanned under one entity type: the other type's cards are the same markup with other sentences and other options, asserted by the editor's other specs.
 *
 * The dataset, the sessions, the order of the tests and the rigidity contract every spec of this folder keeps are described in `helpers.ts`.
 */

import {
  ALLIANCE_OPTIONS,
  candidateToOpenCard,
  CHANGED_SYMBOL,
  CONFIRMED_KEPT_NOTES,
  continueToDetails,
  EDIT_CANDIDATE_LIST_CARD,
  EDIT_CANDIDATE_TYPED_PARTY_NOMINATION_EXTERNAL_ID,
  EDIT_ORGANIZATION_LIST_CARD,
  EDIT_ORGANIZATION_OPEN_CARD,
  ELECTIONS_THAT_ADMIT_A_CANDIDATE,
  ELECTIONS_THAT_ADMIT_A_PARTY,
  EVERYTHING_ANSWERED,
  LIST_PARTY_OPTIONS,
  NEW_LIST_CARD,
  NEW_OPEN_CARD,
  NOTHING_ANSWERED,
  OPEN_PARTY_OPTIONS,
  REMOVED_NOTES,
  TYPED_PARTY_NAME,
  VIEW_SENTENCE
} from './helpers';
import {
  addNomination,
  clearWrittenNominations,
  contestantNominationsPagesOf,
  setAnswers,
  setContestantEditing,
  setNominations,
  setNominationShape,
  startFrom,
  test
} from '../../../fixtures/contestant/perm-contestant-nominations';
import { declareScans } from '../../../utils/contestantAxeScan';
import {
  CHILD_CANDIDATE,
  EDIT_CANDIDATE_EDITOR,
  EDIT_CANDIDATE_ELECTION_SYMBOL,
  EDIT_ORGANIZATION_EDITOR,
  EDIT_ORGANIZATION_ELECTION_SYMBOL,
  LIST_ELECTION_NAME,
  LONG_ORGANIZATION_NAME,
  NATION_CONSTITUENCY_NAME,
  NEW_CANDIDATE_EDITOR,
  NEW_ORGANIZATION_EDITOR,
  NEW_ORGANIZATION_NAME,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_NAME,
  OPEN_NATION_CONTEST,
  SEEDED_NOMINATION_SHAPES
} from '../../../utils/permContestantNominationsData';
import { testIds } from '../../../utils/testIds';
import type { ContestantNominationEditorFixture } from '../../../fixtures/contestant/contestantNominationEditor.fixture';
import type { NominationsState } from '../../../fixtures/contestant/perm-contestant-nominations';
import type { ContestantAxeRoute } from '../../../utils/contestantAxeScan';
import type { EntityGrantTarget } from '../../../utils/supabaseAdminClient';

/** The lines of a card whose nomination is new. */
const NEW_NOTES = Object.freeze({ confirmed: false, new: true, removed: false, previousConstituency: null });

/**
 * Load the editor's entry address as the unnominated candidate's editor and go on to the details step with the closed-list election in its northern region and the open election chosen.
 * @param editor - The editor's fixture.
 */
async function candidateToNewCards(editor: ContestantNominationEditorFixture): Promise<void> {
  await editor.open(NEW_CANDIDATE_EDITOR.grant);
  await editor.expectStep('elections');
  await editor.setElection(LIST_ELECTION_NAME.en, true);
  await editor.setElection(OPEN_ELECTION_NAME.en, true);
  await editor.continueFromElections();
  await editor.expectStep('constituencies');
  await editor.chooseConstituency(NORTH_CONSTITUENCY_NAME.en);
  await editor.continueFromConstituencies();
  await editor.expectStep('details');
  await editor.expectCards([NEW_LIST_CARD, NEW_OPEN_CARD]);
}

/**
 * Put back what the reach of a scan may have changed, whether or not the scan passed: the contestant-editing setting, the nomination shape of each election an entry changes, and the answers and the nominations of the entity scanned.
 * @param entity - The entity the session's user edits.
 * @param nominations - The nominations the dataset seeds the entity with.
 */
async function restoreAfterScan(entity: EntityGrantTarget, nominations: NominationsState): Promise<void> {
  // The seeded shapes go back first, since a shape an entry changed can refuse a seeded nomination.
  for (const election of ELECTIONS_THAT_ADMIT_A_PARTY)
    await setNominationShape(election, SEEDED_NOMINATION_SHAPES[election]);
  await setAnswers(entity, NOTHING_ANSWERED);
  await startFrom(entity, nominations);
}

test.afterAll(async () => {
  await clearWrittenNominations();
});

/**
 * The states of the editor that are scanned under the session of the candidate with no nomination. Every entry's `reach` writes the state it reads and then loads the editor's entry address as a new document.
 */
const NEW_CANDIDATE_SCANS: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The election step with nothing checked: the group of every election that admits a candidate, one of them with a name longer than a phone is wide, the sentence that one must be selected, Continue disabled and described by that sentence, and Cancel.
    // Anchor on the list, which stands in the loading indicator's place once the elections are on the page.
    // Marker: the sentence under the group, which the step renders only while no election is checked.
    name: 'nomination-elections',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominationEditor.electionsList,
    postLoginTestId: testIds.contestant.nominationEditor.electionsHint,
    reach: async (page) => {
      const { contestantNominationEditor } = contestantNominationsPagesOf(page);
      await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
      await contestantNominationEditor.open(NEW_CANDIDATE_EDITOR.grant);
      await contestantNominationEditor.expectStep('elections');
      await contestantNominationEditor.expectElections(ELECTIONS_THAT_ADMIT_A_CANDIDATE);
      await contestantNominationEditor.expectChecked([]);
      await contestantNominationEditor.expectElectionsContinue(false);
      await contestantNominationEditor.expectElectionsHint(true);
    }
  },
  {
    // The constituency step with a constituency chosen: the picker of the one chosen election that is held in several constituencies, showing the region chosen, Continue enabled, and Cancel.
    // Anchor and marker: the picker, which stands in the loading indicator's place once the elections are on the page. The reach reads from the picker that a constituency is chosen and from Continue that it can be pressed.
    name: 'nomination-constituencies',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominationEditor.constituenciesList,
    postLoginTestId: testIds.contestant.nominationEditor.constituenciesList,
    reach: async (page) => {
      const { contestantNominationEditor } = contestantNominationsPagesOf(page);
      await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
      await contestantNominationEditor.open(NEW_CANDIDATE_EDITOR.grant);
      await contestantNominationEditor.expectStep('elections');
      await contestantNominationEditor.setElection(LIST_ELECTION_NAME.en, true);
      await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, true);
      await contestantNominationEditor.continueFromElections();
      await contestantNominationEditor.expectStep('constituencies');
      await contestantNominationEditor.expectConstituencyPickers([LIST_ELECTION_NAME.en]);
      await contestantNominationEditor.expectNoElectionSentence(false);
      await contestantNominationEditor.chooseConstituency(NORTH_CONSTITUENCY_NAME.en);
      await contestantNominationEditor.expectChosenConstituency(NORTH_CONSTITUENCY_NAME.en);
      await contestantNominationEditor.expectConstituenciesContinue(true);
    }
  },
  {
    // The details step with two new cards. One is of the election in which a candidate stands under a party: its group is required and nothing is chosen in it, so the legend carries the required mark, and it lists every confirmed party, the long-named one among them, two of them with the line that the party is not nominated there. The other is of the open election, with "Independent / no party" chosen. The main button says it saves and continues.
    // Anchor on a card, which stands in the loading indicator's place once the cards and their options are read.
    // Marker: the line under a party that is not nominated at the card's election and constituency, which the reach reads inside the card whose nomination is new.
    name: 'nomination-details-new',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominationEditor.card,
    postLoginTestId: testIds.shared.entitySelector.optionHint,
    reach: async (page) => {
      const { contestantNominationEditor } = contestantNominationsPagesOf(page);
      const listCard = { election: LIST_ELECTION_NAME.en };
      const openCard = { election: OPEN_ELECTION_NAME.en };
      await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
      await setAnswers(NEW_CANDIDATE_EDITOR.grant, NOTHING_ANSWERED);
      await candidateToNewCards(contestantNominationEditor);
      await contestantNominationEditor.chooseParent(openCard, 'none');
      await contestantNominationEditor.expectParentGroup(openCard, {
        shown: true,
        required: true,
        chosen: 'none',
        options: OPEN_PARTY_OPTIONS
      });
      await contestantNominationEditor.expectParentGroup(listCard, {
        shown: true,
        required: true,
        chosen: null,
        options: LIST_PARTY_OPTIONS
      });
      await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
      await contestantNominationEditor.expectNotes(listCard, NEW_NOTES);
      await contestantNominationEditor.expectParentHint(listCard, LONG_ORGANIZATION_NAME.en, true);
      await contestantNominationEditor.expectParentHint(listCard, NEW_ORGANIZATION_NAME.en, true);
    }
  },
  {
    // The details step after Continue was pressed with "Other" chosen and no name typed: the name field in error with its message, the message region saying that something is missing, and focus on the name field.
    // Anchor on the name field's message, which a card renders only while its name field is in error.
    // Marker: the message region, which holds nothing to see until a press of the main button stayed on the page. The reach reads from it that the outcome is a failed check.
    name: 'nomination-details-invalid',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominationEditor.otherError,
    postLoginTestId: testIds.contestant.nominationEditor.saveMessage,
    reach: async (page) => {
      const { contestantNominationEditor } = contestantNominationsPagesOf(page);
      const openCard = { election: OPEN_ELECTION_NAME.en };
      await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
      await setAnswers(NEW_CANDIDATE_EDITOR.grant, NOTHING_ANSWERED);
      await candidateToOpenCard(contestantNominationEditor);
      await contestantNominationEditor.chooseParent(openCard, 'other');
      await contestantNominationEditor.expectOtherName(openCard, '');
      await contestantNominationEditor.submit();
      await contestantNominationEditor.expectStep('details');
      await contestantNominationEditor.expectError(openCard, 'otherName');
      await contestantNominationEditor.expectFocusOn({ on: 'otherName', card: openCard });
      await contestantNominationEditor.expectSaveMessage('invalid');
    }
  }
];

/**
 * The states of the editor and of the nominations view that are scanned under the session of the party with two confirmed nominations. Every entry's `reach` writes the state it reads and then loads its page as a new document.
 */
const EDIT_ORGANIZATION_SCANS: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The constituency step as a party sees it: the regions of the closed-list election, each with a checkbox, in a group named for the constituency group, the region the party stands in checked, Continue enabled, and Cancel.
    // Anchor and marker: the list, which stands in the loading indicator's place once the elections are on the page.
    name: 'nomination-constituencies-several',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominationEditor.constituenciesList,
    postLoginTestId: testIds.contestant.nominationEditor.constituenciesList,
    reach: async (page) => {
      const { contestantNominationEditor } = contestantNominationsPagesOf(page);
      await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
      await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, NOTHING_ANSWERED);
      await contestantNominationEditor.open(EDIT_ORGANIZATION_EDITOR.grant);
      await contestantNominationEditor.expectStep('elections');
      await contestantNominationEditor.continueFromElections();
      await contestantNominationEditor.expectStep('constituencies');
      await contestantNominationEditor.expectConstituencyLists([LIST_ELECTION_NAME.en]);
      await contestantNominationEditor.expectCheckedConstituencies([NORTH_CONSTITUENCY_NAME.en]);
      await contestantNominationEditor.expectConstituenciesContinue(true);
    }
  },
  {
    // The details step of a party with two confirmed nominations, nothing changed: on each card the status row, the line that a change must be confirmed again, the symbol field — filled on one card — the alliance group with "None" chosen and both alliances listed, and Remove; above the cards the link back to the selection. The main button says Continue.
    // Anchor on a card. Marker: the line that a change must be confirmed again, which a card shows only for a confirmed nomination that is kept.
    name: 'nomination-details-existing',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominationEditor.card,
    postLoginTestId: testIds.contestant.nominationEditor.confirmedNote,
    reach: async (page) => {
      const { contestantNominationEditor } = contestantNominationsPagesOf(page);
      const openCard = { election: OPEN_ELECTION_NAME.en };
      await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
      await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, NOTHING_ANSWERED);
      await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_EDITOR.grant);
      await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
      await contestantNominationEditor.expectChangeSelection(true);
      await contestantNominationEditor.expectStatus(openCard, 'confirmed');
      await contestantNominationEditor.expectSymbol(openCard, EDIT_ORGANIZATION_ELECTION_SYMBOL);
      await contestantNominationEditor.expectParentGroup(openCard, {
        shown: true,
        required: false,
        chosen: 'none',
        options: ALLIANCE_OPTIONS
      });
      await contestantNominationEditor.expectSubmit('continue', 'continue');
      await contestantNominationEditor.expectNotes(openCard, CONFIRMED_KEPT_NOTES);
    }
  },
  {
    // The details step with both of the party's cards removed: each shows the warning line that its nomination will be removed and Keep, and no field. With no nomination left, the main button says it saves and returns.
    // Anchor on Keep, which a card shows only while its nomination is about to be removed. Marker: the warning line of a removed card.
    name: 'nomination-details-removed',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominationEditor.keep,
    postLoginTestId: testIds.contestant.nominationEditor.removedNote,
    reach: async (page) => {
      const { contestantNominationEditor } = contestantNominationsPagesOf(page);
      const listCard = { election: LIST_ELECTION_NAME.en };
      const openCard = { election: OPEN_ELECTION_NAME.en };
      await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
      await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, NOTHING_ANSWERED);
      await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_EDITOR.grant);
      await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
      await contestantNominationEditor.remove(listCard);
      await contestantNominationEditor.remove(openCard);
      await contestantNominationEditor.expectCards([
        { ...EDIT_ORGANIZATION_LIST_CARD, state: 'removed' },
        { ...EDIT_ORGANIZATION_OPEN_CARD, state: 'removed' }
      ]);
      await contestantNominationEditor.expectParentGroup(openCard, { shown: false });
      await contestantNominationEditor.expectSubmit('return', 'saveAndReturn');
      await contestantNominationEditor.expectFocusOn({ on: 'keep', card: openCard });
      await contestantNominationEditor.expectNotes(listCard, REMOVED_NOTES);
      await contestantNominationEditor.expectNotes(openCard, REMOVED_NOTES);
    }
  },
  {
    // The details step after a save the database refused because candidates are listed under the nomination that was to be removed: the message region with that message, the removed card still about to be removed, the other card kept, and focus on the main button, which says it saves and continues.
    // Anchor on the warning line of the removed card. Marker: the message region, from which the reach reads why the save was refused.
    name: 'nomination-details-has-candidates',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominationEditor.removedNote,
    postLoginTestId: testIds.contestant.nominationEditor.saveMessage,
    reach: async (page) => {
      const { contestantNominationEditor } = contestantNominationsPagesOf(page);
      const listCard = { election: LIST_ELECTION_NAME.en };
      await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
      await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, NOTHING_ANSWERED);
      // A candidate is listed under the party's nomination in the closed-list election.
      await setNominations(CHILD_CANDIDATE, 'seeded');
      await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_EDITOR.grant);
      await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
      await contestantNominationEditor.remove(listCard);
      await contestantNominationEditor.submit();
      await contestantNominationEditor.expectStep('details');
      await contestantNominationEditor.expectCards([
        { ...EDIT_ORGANIZATION_LIST_CARD, state: 'removed' },
        EDIT_ORGANIZATION_OPEN_CARD
      ]);
      await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
      await contestantNominationEditor.expectFocusOn({ on: 'submit' });
      await contestantNominationEditor.expectSaveMessage('hasCandidates');
    }
  },
  {
    // The nominations view of a party whose nominations are listed while no election admits a party: the sentence that says where the party is nominated, the two cards, and no link to the editor.
    // Anchor on a card. Marker: the list, of which the reach reads from the view's container that no entry to the editor is offered and no lock is on, and from the view that it holds no control but its main button.
    name: 'nominations-listed-no-election',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominations.card,
    postLoginTestId: testIds.contestant.nominations.list,
    reach: async (page) => {
      const { contestantNominationsPage } = contestantNominationsPagesOf(page);
      await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
      for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setNominationShape(election, 'candidate_only');
      // A full page load: an election's nomination shape is read when a page is loaded.
      await contestantNominationsPage.open(EDIT_ORGANIZATION_EDITOR.grant);
      await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_EDITOR.grant);
      await contestantNominationsPage.expectCardCount(2);
      await contestantNominationsPage.expectLockedNote(false);
      await contestantNominationsPage.expectDescription(VIEW_SENTENCE.listed.organization);
      await contestantNominationsPage.expectNoEditAction();
      await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: false });
    }
  }
];

/**
 * The states of the editor and of the nominations view that are scanned under the session of the candidate nominated under a party. Every entry's `reach` writes the state it reads and then loads its page as a new document.
 */
const EDIT_CANDIDATE_SCANS: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The nominations view while answers are locked and nominations are not: the note that says nominations cannot be edited because answers are locked, with its one support button, above the candidate's card, and no link to the editor.
    // Anchor on the card. Marker: the note, from which the reach reads that its reason is the answers lock.
    name: 'nominations-answers-locked',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominations.card,
    postLoginTestId: testIds.contestant.nominations.lockedNote,
    reach: async (page) => {
      const { contestantNominationsPage } = contestantNominationsPagesOf(page);
      await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
      await setContestantEditing('locked');
      // A full page load: the lock is a setting, read when a page is loaded.
      await contestantNominationsPage.open(EDIT_CANDIDATE_EDITOR.grant);
      await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
      await contestantNominationsPage.expectState({ state: 'listed', locked: true, editable: false });
      await contestantNominationsPage.expectCardCount(1);
      await contestantNominationsPage.expectSupportButtons(1);
      await contestantNominationsPage.expectNoEditAction();
      await contestantNominationsPage.expectLockedNote(true, 'nominationsAnswersLocked');
    }
  },
  {
    // The nominations view listing a nomination under a party the candidate typed: its parent row shows the typed name and, under it, the line that the party was requested; the candidate's other card names its party as a listed one. The view offers Return after its main button.
    // Anchor on a card. Marker: the row of the typed name, which a card renders only for a nomination that names a party by a typed name.
    name: 'nominations-requested-parent',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominations.card,
    postLoginTestId: testIds.contestant.nominations.requestedParent,
    reach: async (page) => {
      const { contestantNominationsPage } = contestantNominationsPagesOf(page);
      await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
      await addNomination(EDIT_CANDIDATE_EDITOR.grant, OPEN_NATION_CONTEST, {
        externalId: EDIT_CANDIDATE_TYPED_PARTY_NOMINATION_EXTERNAL_ID,
        parent: { kind: 'other', name: TYPED_PARTY_NAME }
      });
      await contestantNominationsPage.open(EDIT_CANDIDATE_EDITOR.grant);
      await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
      await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
      await contestantNominationsPage.expectCardCount(2);
      await contestantNominationsPage.expectReturnAction();
      await contestantNominationsPage.expectCardOf({
        election: OPEN_ELECTION_NAME.en,
        constituency: NATION_CONSTITUENCY_NAME.en,
        symbol: null,
        parent: null,
        confirmed: false,
        requestedParent: TYPED_PARTY_NAME
      });
    }
  },
  {
    // The details step of a candidate with its stored party chosen and nothing left to do: one kept, confirmed card whose required group shows the party's row as the chosen one, and a main button that says Return.
    // Anchor on the card. Marker: the line that a change must be confirmed again. The reach reads from the group that a listed party is chosen and from the main button what it says.
    name: 'nomination-details-chosen-party',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominationEditor.card,
    postLoginTestId: testIds.contestant.nominationEditor.confirmedNote,
    reach: async (page) => {
      const { contestantNominationEditor } = contestantNominationsPagesOf(page);
      const listCard = { election: LIST_ELECTION_NAME.en };
      await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
      await setAnswers(EDIT_CANDIDATE_EDITOR.grant, EVERYTHING_ANSWERED);
      await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
      await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
      await contestantNominationEditor.expectNotes(listCard, CONFIRMED_KEPT_NOTES);
      await contestantNominationEditor.expectSymbol(listCard, EDIT_CANDIDATE_ELECTION_SYMBOL);
      await contestantNominationEditor.expectParentGroup(listCard, {
        shown: true,
        required: true,
        chosen: 'entity',
        options: LIST_PARTY_OPTIONS
      });
      await contestantNominationEditor.expectSubmit('return', 'return');
    }
  },
  {
    // The details step after a save that was not stored because the nominations had been changed elsewhere: the message region with that message, the cards as the nominations now are — one new card, with nothing of what was typed — and focus on the main button.
    // Anchor on the card. Marker: the message region, from which the reach reads that the nominations were changed.
    name: 'nomination-details-changed',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominationEditor.card,
    postLoginTestId: testIds.contestant.nominationEditor.saveMessage,
    reach: async (page) => {
      const { contestantNominationEditor } = contestantNominationsPagesOf(page);
      const listCard = { election: LIST_ELECTION_NAME.en };
      await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
      await setAnswers(EDIT_CANDIDATE_EDITOR.grant, NOTHING_ANSWERED);
      await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
      await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
      await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
      // While the editor is open, an administrator removes the nomination the card was built on.
      await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'none');
      await contestantNominationEditor.submit();
      await contestantNominationEditor.expectStep('details');
      await contestantNominationEditor.expectCards([{ ...EDIT_CANDIDATE_LIST_CARD, state: 'new', confirmed: false }]);
      await contestantNominationEditor.expectSymbol(listCard, '');
      await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
      await contestantNominationEditor.expectFocusOn({ on: 'submit' });
      await contestantNominationEditor.expectSaveMessage('changed');
    }
  }
];

/**
 * The state of the nominations view that is scanned under the session of the party with no nomination. Its `reach` writes the state it reads and then loads the view as a new document.
 */
const NEW_ORGANIZATION_SCANS: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The nominations view of a party with no nomination while no election admits a party: the sentence that says so, one support button, and a main button that returns to the home.
    // Anchor and marker: the sentence in place of the nominations, from which the reach reads that it is the one for no election to stand in.
    name: 'nominations-no-election',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominations.empty,
    postLoginTestId: testIds.contestant.nominations.empty,
    reach: async (page) => {
      const { contestantNominationsPage } = contestantNominationsPagesOf(page);
      await startFrom(NEW_ORGANIZATION_EDITOR.grant, 'none');
      for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setNominationShape(election, 'candidate_only');
      // A full page load: an election's nomination shape is read when a page is loaded.
      await contestantNominationsPage.open(NEW_ORGANIZATION_EDITOR.grant);
      await contestantNominationsPage.expectShown(NEW_ORGANIZATION_EDITOR.grant);
      await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: false });
      await contestantNominationsPage.expectLockedNote(false);
      await contestantNominationsPage.expectSupportButtons(1);
      await contestantNominationsPage.expectButton('return');
      await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyNoElection.organization, 'noElection');
    }
  }
];

test.describe('contestant-nominations: the accessibility scans', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: NEW_CANDIDATE_EDITOR.storageStatePath });

    test.afterEach(async () => {
      await restoreAfterScan(NEW_CANDIDATE_EDITOR.grant, 'none');
    });

    for (const entry of NEW_CANDIDATE_SCANS) {
      declareScans(entry);
    }
  });

  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_EDITOR.storageStatePath });

    test.afterEach(async () => {
      await restoreAfterScan(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
    });

    for (const entry of EDIT_ORGANIZATION_SCANS) {
      declareScans(entry);
    }
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: EDIT_CANDIDATE_EDITOR.storageStatePath });

    test.afterEach(async () => {
      await restoreAfterScan(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
    });

    for (const entry of EDIT_CANDIDATE_SCANS) {
      declareScans(entry);
    }
  });

  test.describe("as the unnominated party's editor", () => {
    test.use({ storageState: NEW_ORGANIZATION_EDITOR.storageStatePath });

    test.afterEach(async () => {
      await restoreAfterScan(NEW_ORGANIZATION_EDITOR.grant, 'none');
    });

    for (const entry of NEW_ORGANIZATION_SCANS) {
      declareScans(entry);
    }
  });
});
