/**
 * @file contestant-nominations.spec.ts — perm-chain spec.
 *
 * The editor of a candidate and of a party on the entity's nominations in the Contestant App, against the `perm-contestant-nominations` dataset (seeded by the data-setup-perm-contestant-nominations project): three elections of three types, a candidate and a party with no nomination row, a candidate and a party with nominations, and the parties and alliances a nomination can stand under.
 *
 * Sessions: the file runs under stored sessions, each selected by a describe — the editor of the unnominated candidate, of the unnominated party, of the nominated candidate and of the nominated party. All four sessions are this dataset's own: its setup writes them and nothing else reads them, so a test may edit and save under them. No test reads a session of the base dataset.
 *
 * Order and state: the tests run in file order in one worker, and no test depends on a test before it. Every test begins with the state steps that write, with the service role as an administrator would, the state it reads: the entity's nominations, a lock, an election's type, whether a party is confirmed. A page is opened only after its state steps, because the entity's nominations, the elections and the settings are read when a page is loaded. A test that changes a setting of the project, an election's type or an entity's confirmation puts the seeded value back in a `finally`. When the file's tests have run, the nominations the application wrote are removed: the setup of the chain's next link deletes this dataset's rows by prefix before this dataset's own teardown runs, and a row with no external id that stands under a seeded nomination would refuse that delete.
 *
 * Titles carry the prefix of the surface they are about. `dataset:` is the dataset, its identities and its state steps. `define:` is the editor for an entity with no nomination, from its entry address to the nominations the database then holds. `steps:` is which of the editor's steps an entity with no nomination meets, and in which order. `edit:` is the editor for an entity that has nominations: what it starts from, what a card shows and what a save stores. `remove:` is a card that is to be removed, kept again, or removed by the save. `button:` is what the main button of the details step says and where a press of it leads. `refused:` is a save the database did not store, and what the page shows of it. `leave:` is leaving the details step with changes that are not saved. `stale:` is a save from an editor that was opened before nominations were locked. `closing:` is a save made after answers were locked. `saved:` is where a stored save leads: to the nominations view, which lists what was stored and leads on or home, and where the user stays when reading the data again has moved them to another step. `nominations-view:` is the nominations view: what it says and offers in each of its states, and that every address of the editor leads to it while nominations cannot be edited. `entry:` is the way from the home into the editor. `holds:` is where the home's nomination task leads when it does not lead into the editor. `follow:` is the home, the nominations view and the questions after a save, with no new document loaded in between. `phone 320:` and `phone 390:` are a page of the editor, or the nominations view, at that width. `keys:` is the parent group under the keyboard. `focus:` is where focus is after a navigation inside the editor.
 *
 * Scans: thirteen states of the editor's three steps and of the nominations view, each in the light and the dark theme, declared through `declareScans` of `tests/tests/utils/contestantAxeScan.ts` and so through the one shared gate. They are here and not in the scan project because only this dataset holds what the states need: an entity with no nomination, several elections of several types, parties and alliances to stand under, and a lock or an election's type that is changed for the whole project. Each entry's `reach` sets its state through the state steps, walks to the state through the fixtures' steps — a full page load after every state step — and ends on the steps that assert the state, before the reach proof and the scan. The describe that declares a session's entries puts back, after each scan, both locks, the type of each election an entry changes, and the entity's answers and nominations. A state of the details step is scanned under one entity type: the other type's cards are the same markup with other sentences and other options, asserted by the tests above.
 *
 * Widths: the `phone 320:` and `phone 390:` tests run at that width, in English. A page's width is measured against its viewport, and a box against the box that must hold it, through the steps of `fixtures/shared/pageGeometry.fixture.ts`: an accessibility scan reports neither. A fixture hands over the boxes; the test names what must lie inside what. A phone test of a later step loads that step's own address, so that it measures its own step and reads nothing of the steps before it; the election step's test also checks an election and reads that Continue can then be pressed.
 *
 * Rigidity contract: every assertion is hard, with no soft assertion, no try/catch around an assertion and no fallback on an assertion-bearing step. Every element of a page sits behind a fixture: a test body speaks in the steps of `fixtures/contestant/perm-contestant-nominations.ts` and addresses none of its own.
 */

import {
  addNomination,
  clearWrittenNominations,
  contestantNominationsPagesOf,
  electionTypeOf,
  entityConfirmedOf,
  expect,
  nominationsOf,
  setAnswers,
  setAnswersLocked,
  setElectionSelectionDisallowed,
  setElectionType,
  setEntityConfirmed,
  setNominations,
  setNominationsLocked,
  test
} from '../../fixtures/contestant/perm-contestant-nominations';
import { declareScans } from '../../utils/contestantAxeScan';
import {
  CANDIDATE_ONLY_ELECTION_EXTERNAL_ID,
  CANDIDATE_ONLY_ELECTION_NAME,
  CANDIDATE_ONLY_NATION_CONTEST,
  CHILD_CANDIDATE,
  COAST_ALLIANCE_NAME,
  CONTESTANT_NOMINATIONS_PREFIX,
  EDIT_CANDIDATE_ELECTION_SYMBOL,
  EDIT_CANDIDATE_GRANT,
  EDIT_CANDIDATE_NOMINATION_EXTERNAL_ID,
  EDIT_CANDIDATE_SECOND_NOMINATION_EXTERNAL_ID,
  EDIT_CANDIDATE_STORAGE_STATE,
  EDIT_ORGANIZATION_ELECTION_SYMBOL,
  EDIT_ORGANIZATION_GRANT,
  EDIT_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID,
  EDIT_ORGANIZATION_NAME,
  EDIT_ORGANIZATION_OPEN_NOMINATION_EXTERNAL_ID,
  EDIT_ORGANIZATION_STORAGE_STATE,
  GREEN_ORGANIZATION,
  GREEN_ORGANIZATION_NAME,
  INLAND_ALLIANCE,
  INLAND_ALLIANCE_NAME,
  LIST_ELECTION_EXTERNAL_ID,
  LIST_ELECTION_NAME,
  LIST_NORTH_CONTEST,
  LIST_OPINION_QUESTION_LABEL,
  LIST_SOUTH_CONTEST,
  LONG_ORGANIZATION,
  LONG_ORGANIZATION_NAME,
  NATION_CONSTITUENCY_NAME,
  NEW_CANDIDATE_GRANT,
  NEW_CANDIDATE_STORAGE_STATE,
  NEW_ORGANIZATION_GRANT,
  NEW_ORGANIZATION_NAME,
  NEW_ORGANIZATION_STORAGE_STATE,
  NORTH_CONSTITUENCY_EXTERNAL_ID,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_EXTERNAL_ID,
  OPEN_ELECTION_NAME,
  OPEN_NATION_CONTEST,
  OPEN_OPINION_QUESTION_LABEL,
  OPINION_QUESTION_EXTERNAL_IDS,
  PENDING_ORGANIZATION,
  SEEDED_ELECTION_TYPES,
  SHARED_OPINION_QUESTION_LABEL,
  SOUTH_CONSTITUENCY_NAME
} from '../../utils/permContestantNominationsData';
import { PHONE_VIEWPORTS, phoneUse } from '../../utils/phoneViewports';
import { testIds } from '../../utils/testIds';
import type {
  ContestantNominationEditorFixture,
  EditorCardBoxes
} from '../../fixtures/contestant/contestantNominationEditor.fixture';
import type { NominationsState } from '../../fixtures/contestant/perm-contestant-nominations';
import type { PageGeometryFixture } from '../../fixtures/shared/pageGeometry.fixture';
import type { ContestantAxeRoute } from '../../utils/contestantAxeScan';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

/** A party name as an entity's editor types it, for a party the project does not list. */
const TYPED_PARTY_NAME = 'A Party the Editor Typed';

/** The nominated candidate's one seeded nomination, as the database holds it. */
const EDIT_CANDIDATE_SEEDED_NOMINATION = Object.freeze({
  externalId: EDIT_CANDIDATE_NOMINATION_EXTERNAL_ID,
  contest: LIST_NORTH_CONTEST,
  electionSymbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
  confirmed: true,
  parentEntityExternalId: GREEN_ORGANIZATION.externalId,
  requestedParent: null
});

/** The parties a candidate's card lists, in the order of their English names: the confirmed parties of the dataset. */
const LISTED_PARTIES = Object.freeze(
  [EDIT_ORGANIZATION_NAME.en, GREEN_ORGANIZATION_NAME.en, LONG_ORGANIZATION_NAME.en, NEW_ORGANIZATION_NAME.en].map(
    (name) => Object.freeze({ kind: 'entity' as const, name })
  )
);

/** The option of a candidate's card that names no party, and the option that opens the field for a party that is not listed. */
const NO_PARTY_OPTION = Object.freeze({ kind: 'none' as const, name: 'Independent / no party' });
const OTHER_PARTY_OPTION = Object.freeze({ kind: 'other' as const, name: 'Other' });

/** Two ids in the form of a row's id that name no row: no election and no constituency. */
const UNKNOWN_ELECTION_ID = '0d1e2f30-4a5b-4c6d-8e7f-9a0b1c2d3e4f';
const UNKNOWN_CONSTITUENCY_ID = '1f2e3d4c-5b6a-4978-8695-a4b3c2d1e0f9';

/** An election symbol as a user may type it, and as it is stored. */
const TYPED_SYMBOL = '  77  ';
const STORED_SYMBOL = '77';

/** An election symbol a test types over a stored one. */
const CHANGED_SYMBOL = '88';

/** The nominated party's two seeded nominations, as the database holds them. */
const EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION = Object.freeze({
  externalId: EDIT_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID,
  contest: LIST_NORTH_CONTEST,
  electionSymbol: null,
  confirmed: true,
  parentEntityExternalId: null,
  requestedParent: null
});
const EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION = Object.freeze({
  externalId: EDIT_ORGANIZATION_OPEN_NOMINATION_EXTERNAL_ID,
  contest: OPEN_NATION_CONTEST,
  electionSymbol: EDIT_ORGANIZATION_ELECTION_SYMBOL,
  confirmed: true,
  parentEntityExternalId: null,
  requestedParent: null
});

/** External ids of the nominations a test adds as an administrator would. None of them is seeded. */
const EDIT_ORGANIZATION_SOUTH_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-or-edit-list-south`;
const EDIT_CANDIDATE_SAME_CONTEST_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-list-north-second`;
const EDIT_CANDIDATE_OTHER_ROUND_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-open-round-2`;
const EDIT_CANDIDATE_CLOSED_ELECTION_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-cand`;

const EDIT_CANDIDATE_TYPED_PARTY_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-open-typed`;
const EDIT_CANDIDATE_OPEN_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-open`;

/** A round of the open election that is not its current one. */
const OTHER_ELECTION_ROUND = 2;

/** The symbol of the nomination a test adds for the nominated party in the closed-list election's southern region. */
const SOUTH_NOMINATION_SYMBOL = '9';

/** The alliances a party's card lists, in the order of their English names: every alliance of the dataset, confirmed or not. */
const LISTED_ALLIANCES = Object.freeze(
  [COAST_ALLIANCE_NAME.en, INLAND_ALLIANCE_NAME.en].map((name) => Object.freeze({ kind: 'entity' as const, name }))
);

/** The option of a party's card that names no alliance, and the option that opens the field for an alliance that is not listed. */
const NO_ALLIANCE_OPTION = Object.freeze({ kind: 'none' as const, name: 'None' });
const OTHER_ALLIANCE_OPTION = Object.freeze({ kind: 'other' as const, name: 'Other' });

/** The green party as an option of a candidate's card, and the arrow presses that lead from it to the last option of a group that requires a party. */
const GREEN_PARTY_OPTION = Object.freeze({ kind: 'entity' as const, name: GREEN_ORGANIZATION_NAME.en });
const ARROWS_FROM_GREEN_TO_OTHER = LISTED_PARTIES.slice(
  LISTED_PARTIES.findIndex((party) => party.name === GREEN_ORGANIZATION_NAME.en)
).map(() => 'ArrowDown');

/** The lines of a card whose nomination is confirmed and kept where it is, and of one that is not confirmed. */
const CONFIRMED_KEPT_NOTES = Object.freeze({ confirmed: true, new: false, removed: false, previousConstituency: null });
const PENDING_KEPT_NOTES = Object.freeze({ confirmed: false, new: false, removed: false, previousConstituency: null });

/** The lines of a card that is about to be removed. */
const REMOVED_NOTES = Object.freeze({ confirmed: false, new: false, removed: true, previousConstituency: null });

/** The card of the nominated candidate's one seeded nomination, kept. */
const EDIT_CANDIDATE_LIST_CARD = Object.freeze({
  election: LIST_ELECTION_NAME.en,
  constituency: NORTH_CONSTITUENCY_NAME.en,
  state: 'kept' as const,
  confirmed: true,
  moved: false
});

/** The cards of the nominated party's two seeded nominations, each kept. */
const EDIT_ORGANIZATION_LIST_CARD = Object.freeze({
  election: LIST_ELECTION_NAME.en,
  constituency: NORTH_CONSTITUENCY_NAME.en,
  state: 'kept' as const,
  confirmed: true,
  moved: false
});
const EDIT_ORGANIZATION_OPEN_CARD = Object.freeze({
  election: OPEN_ELECTION_NAME.en,
  constituency: NATION_CONSTITUENCY_NAME.en,
  state: 'kept' as const,
  confirmed: true,
  moved: false
});

/** The nominated party's two seeded nominations as the nominations view lists them. */
const EDIT_ORGANIZATION_LIST_VIEW_CARD = Object.freeze({
  election: LIST_ELECTION_NAME.en,
  constituency: NORTH_CONSTITUENCY_NAME.en,
  symbol: null,
  parent: null,
  confirmed: true
});
const EDIT_ORGANIZATION_OPEN_VIEW_CARD = Object.freeze({
  election: OPEN_ELECTION_NAME.en,
  constituency: NATION_CONSTITUENCY_NAME.en,
  symbol: EDIT_ORGANIZATION_ELECTION_SYMBOL,
  parent: null,
  confirmed: true
});

/** The sentences of the nominations view, as the English catalogue words them: above the nominations it lists, and in place of them. */
const VIEW_SENTENCE = Object.freeze({
  listedEditable: Object.freeze({
    organization:
      'These are your party’s nominations. You can change them, and add its election symbol and alliance, until nominations are closed.'
  }),
  listed: Object.freeze({
    organization:
      'These are the constituencies where your party is nominated. If the election symbol is missing, it will be added later by the administrator.'
  }),
  emptyEditable: Object.freeze({
    candidate:
      'You have not defined a nomination yet. A nomination says which election and constituency you are standing in.',
    organization:
      'No nomination has been defined for your party yet. A nomination says which election and constituency it is standing in.'
  }),
  emptyLocked: Object.freeze({
    candidate: 'No nomination has been defined for you yet. Please contact support to have one added.'
  }),
  emptyNoElection: Object.freeze({
    organization:
      'There is no election in this application in which a party can be nominated. If you think this is a mistake, please contact support.'
  })
});

/** What the home's nomination row and the view's way into the editor both read for an entity with no nomination. */
const DEFINE_NOMINATION_LABEL = 'Define your nomination';

/** The selection the address of a later step of the editor carries for the nominated candidate's seeded nomination. */
const EDIT_CANDIDATE_SELECTION = Object.freeze({
  elections: [LIST_ELECTION_EXTERNAL_ID],
  constituencies: [NORTH_CONSTITUENCY_EXTERNAL_ID]
});

/** The three addresses of the editor. */
const EDITOR_STEPS = ['elections', 'constituencies', 'details'] as const;

/** Both elections that admit a party, each with the type it is given so that it admits candidates alone. */
const ELECTIONS_THAT_ADMIT_A_PARTY = [LIST_ELECTION_EXTERNAL_ID, OPEN_ELECTION_EXTERNAL_ID] as const;

/**
 * Load the editor's entry address and go on to the details step, pressing Continue on the election step and on the constituency step with what each shows on arrival.
 * @param editor - The editor's fixture.
 * @param entity - An entity whose stored nominations lead through both steps.
 */
async function continueToDetails(editor: ContestantNominationEditorFixture, entity: EntityGrantTarget): Promise<void> {
  await editor.open(entity);
  await editor.expectStep('elections');
  await editor.continueFromElections();
  await editor.expectStep('constituencies');
  await editor.continueFromConstituencies();
  await editor.expectStep('details');
}

/** Every election that admits a candidate, by name and in the order the election step lists them. */
const ELECTIONS_THAT_ADMIT_A_CANDIDATE = Object.freeze([
  LIST_ELECTION_NAME.en,
  OPEN_ELECTION_NAME.en,
  CANDIDATE_ONLY_ELECTION_NAME.en
]);

/** The cards of an entity with no nomination that chose the closed-list election in its northern region and the open election. */
const NEW_LIST_CARD = Object.freeze({
  election: LIST_ELECTION_NAME.en,
  constituency: NORTH_CONSTITUENCY_NAME.en,
  state: 'new' as const,
  confirmed: false,
  moved: false
});
const NEW_OPEN_CARD = Object.freeze({
  election: OPEN_ELECTION_NAME.en,
  constituency: NATION_CONSTITUENCY_NAME.en,
  state: 'new' as const,
  confirmed: false,
  moved: false
});

/** The selections the addresses of the later steps carry for those cards: both elections for the constituency step, both with the northern region for the details step, and the open election alone, whose one constituency no address needs to name. */
const NEW_CARDS_ELECTIONS = Object.freeze({ elections: [LIST_ELECTION_EXTERNAL_ID, OPEN_ELECTION_EXTERNAL_ID] });
const NEW_CARDS_SELECTION = Object.freeze({
  elections: [LIST_ELECTION_EXTERNAL_ID, OPEN_ELECTION_EXTERNAL_ID],
  constituencies: [NORTH_CONSTITUENCY_EXTERNAL_ID]
});
const OPEN_CARD_SELECTION = Object.freeze({ elections: [OPEN_ELECTION_EXTERNAL_ID] });

/** The lines of a card whose nomination is new. */
const NEW_NOTES = Object.freeze({ confirmed: false, new: true, removed: false, previousConstituency: null });

/** The options of a candidate's card in the closed-list election, where a party is required, and in the open election, where standing under none is an option and the last one. */
const LIST_PARTY_OPTIONS = Object.freeze([...LISTED_PARTIES, OTHER_PARTY_OPTION]);
const OPEN_PARTY_OPTIONS = Object.freeze([...LISTED_PARTIES, OTHER_PARTY_OPTION, NO_PARTY_OPTION]);

/** The options of a party's card. */
const ALLIANCE_OPTIONS = Object.freeze([...LISTED_ALLIANCES, OTHER_ALLIANCE_OPTION, NO_ALLIANCE_OPTION]);

/** The arrow presses that lead from the first option of a candidate's card in the open election, a listed party, to "Other". */
const ARROWS_FROM_FIRST_PARTY_TO_OTHER = OPEN_PARTY_OPTIONS.slice(
  1,
  OPEN_PARTY_OPTIONS.indexOf(OTHER_PARTY_OPTION) + 1
).map(() => 'ArrowDown');

/** The answers of an entity with its profile and its questions still to do, and of one with nothing left to do. */
const NOTHING_ANSWERED = Object.freeze({ requiredInfo: false, opinions: [] });
const EVERYTHING_ANSWERED = Object.freeze({ requiredInfo: true, opinions: OPINION_QUESTION_EXTERNAL_IDS });

/** The most characters the symbol field and the name field of "Other" take. */
const SYMBOL_LIMIT = 50;
const OTHER_NAME_LIMIT = 100;

/** A symbol and a party name longer than their fields take, neither with a place to break a line at; and what each field holds of them. */
const OVERLONG_SYMBOL = '0123456789'.repeat(6);
const OVERLONG_PARTY_NAME = 'AbcdefghiJ'.repeat(12);
const SYMBOL_AT_LIMIT = OVERLONG_SYMBOL.slice(0, SYMBOL_LIMIT);
const PARTY_NAME_AT_LIMIT = OVERLONG_PARTY_NAME.slice(0, OTHER_NAME_LIMIT);

/**
 * A part of a card that the card must render, for a geometry step.
 * @param part - The part as the editor's fixture hands it over.
 * @param what - What the part is, for the failure message.
 * @throws If the card does not render the part.
 */
function rendered<TPart>(part: TPart | null, what: string): TPart {
  if (part === null) throw new Error(`contestant-nominations: the card renders no ${what}`);
  return part;
}

/**
 * Assert that a card holds every one of its option rows and its symbol field inside its own box.
 * @param pageGeometry - The geometry steps of the page.
 * @param boxes - The card and its parts, as the editor's fixture hands them over.
 * @param card - What the card is, for the failure messages.
 * @param optionCount - How many option rows the card holds.
 */
async function expectPartsInsideCard(
  pageGeometry: PageGeometryFixture,
  boxes: EditorCardBoxes,
  card: string,
  optionCount: number
): Promise<void> {
  expect(boxes.optionRows, `the option rows of ${card}`).toHaveLength(optionCount);
  for (const [index, row] of boxes.optionRows.entries())
    await pageGeometry.expectInside(row, boxes.card, `option ${index + 1} of ${card}`);
  await pageGeometry.expectInside(rendered(boxes.symbol, 'symbol field'), boxes.card, `the symbol field of ${card}`);
}

/**
 * Load the editor's entry address as the unnominated candidate's editor and go on to the details step with the closed-list election in its northern region and the open election chosen.
 * @param editor - The editor's fixture.
 */
async function candidateToNewCards(editor: ContestantNominationEditorFixture): Promise<void> {
  await editor.open(NEW_CANDIDATE_GRANT);
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
 * Load the editor's entry address as the unnominated candidate's editor and go on to the details step with the open election alone chosen. The election is held in one constituency, so Continue passes over the constituency step.
 * @param editor - The editor's fixture.
 */
async function candidateToOpenCard(editor: ContestantNominationEditorFixture): Promise<void> {
  await editor.open(NEW_CANDIDATE_GRANT);
  await editor.expectStep('elections');
  await editor.setElection(OPEN_ELECTION_NAME.en, true);
  await editor.continueFromElections();
  await editor.expectStep('details');
  await editor.expectCards([NEW_OPEN_CARD]);
}

/**
 * Put back what the reach of a scan may have changed, whether or not the scan passed: both locks, the type of each election an entry changes, and the answers and the nominations of the entity scanned.
 * @param entity - The entity the session's user edits.
 * @param nominations - The nominations the dataset seeds the entity with.
 */
async function restoreAfterScan(entity: EntityGrantTarget, nominations: NominationsState): Promise<void> {
  await setNominationsLocked(false);
  await setAnswersLocked(false);
  for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setElectionType(election, SEEDED_ELECTION_TYPES[election]);
  await setAnswers(entity, NOTHING_ANSWERED);
  await setNominations(entity, nominations);
}

test.afterAll(async () => {
  await clearWrittenNominations();
});

test.describe('contestant-nominations: the dataset, its identities and its state steps', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: NEW_CANDIDATE_STORAGE_STATE });

    test('dataset: a candidate with no nomination is on its home with the nomination task open', async ({
      contestantEntityHomePage,
      contestantHomePage,
      contestantNominationsPage
    }) => {
      await setNominationsLocked(false);
      await setNominations(NEW_CANDIDATE_GRANT, 'none');
      await contestantEntityHomePage.open();
      await contestantEntityHomePage.expectLanded(NEW_CANDIDATE_GRANT);
      await contestantHomePage.expectTaskList({ nomination: 'incomplete', profile: 'blocked', questions: 'blocked' });
      await contestantHomePage.expectNextStep('nomination');
      await contestantNominationsPage.open(NEW_CANDIDATE_GRANT);
      await contestantNominationsPage.expectState({ state: 'empty', locked: false });
      await contestantNominationsPage.expectCardCount(0);
    });
  });

  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_STORAGE_STATE });

    test("dataset: a party's seeded nominations are listed as confirmed", async ({ contestantNominationsPage }) => {
      await setNominationsLocked(false);
      await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
      await contestantNominationsPage.open(EDIT_ORGANIZATION_GRANT);
      await contestantNominationsPage.expectState({ state: 'listed', locked: false });
      await contestantNominationsPage.expectCardCount(2);
      await contestantNominationsPage.expectCard(0, {
        election: LIST_ELECTION_NAME.en,
        constituency: NORTH_CONSTITUENCY_NAME.en,
        symbol: null,
        parent: null,
        confirmed: true
      });
      await contestantNominationsPage.expectCard(1, {
        election: OPEN_ELECTION_NAME.en,
        constituency: NATION_CONSTITUENCY_NAME.en,
        symbol: EDIT_ORGANIZATION_ELECTION_SYMBOL,
        parent: null,
        confirmed: true
      });
    });
  });

  test('dataset: the state steps write and restore what they are given', async () => {
    const seededType = SEEDED_ELECTION_TYPES[CANDIDATE_ONLY_ELECTION_EXTERNAL_ID];
    try {
      await setElectionType(CANDIDATE_ONLY_ELECTION_EXTERNAL_ID, 'organization_only');
      expect(await electionTypeOf(CANDIDATE_ONLY_ELECTION_EXTERNAL_ID)).toBe('organization_only');
    } finally {
      await setElectionType(CANDIDATE_ONLY_ELECTION_EXTERNAL_ID, seededType);
    }
    expect(await electionTypeOf(CANDIDATE_ONLY_ELECTION_EXTERNAL_ID)).toBe(seededType);

    try {
      await setEntityConfirmed(PENDING_ORGANIZATION, true);
      expect(await entityConfirmedOf(PENDING_ORGANIZATION)).toBe(true);
    } finally {
      await setEntityConfirmed(PENDING_ORGANIZATION, false);
    }
    expect(await entityConfirmedOf(PENDING_ORGANIZATION)).toBe(false);

    await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
    await addNomination(EDIT_CANDIDATE_GRANT, LIST_SOUTH_CONTEST, {
      externalId: EDIT_CANDIDATE_SECOND_NOMINATION_EXTERNAL_ID,
      parent: { kind: 'other', name: TYPED_PARTY_NAME }
    });
    expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([
      EDIT_CANDIDATE_SEEDED_NOMINATION,
      {
        externalId: EDIT_CANDIDATE_SECOND_NOMINATION_EXTERNAL_ID,
        contest: LIST_SOUTH_CONTEST,
        electionSymbol: null,
        confirmed: false,
        parentEntityExternalId: null,
        requestedParent: TYPED_PARTY_NAME
      }
    ]);
    await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
    expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([EDIT_CANDIDATE_SEEDED_NOMINATION]);
  });
});

test.describe('contestant-nominations: defining nominations from none', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: NEW_CANDIDATE_STORAGE_STATE });

    test(
      'define: a candidate with no nomination chooses its elections and a constituency, names a party and independence, and continues to the profile',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(NEW_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(NEW_CANDIDATE_GRANT, 'none');
        try {
          // The entry address, as a new document: every election that admits a candidate, none of them chosen.
          await contestantNominationEditor.open(NEW_CANDIDATE_GRANT);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectElections([
            LIST_ELECTION_NAME.en,
            OPEN_ELECTION_NAME.en,
            CANDIDATE_ONLY_ELECTION_NAME.en
          ]);
          await contestantNominationEditor.expectChecked([]);
          await contestantNominationEditor.expectElectionsHint(true);
          await contestantNominationEditor.expectElectionsContinue(false);

          // Two elections are chosen. One of them has two constituencies, so the constituency step asks for that one alone.
          await contestantNominationEditor.setElection(LIST_ELECTION_NAME.en, true);
          await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, true);
          await contestantNominationEditor.expectElectionsHint(false);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.expectConstituencyPickers([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.expectConstituenciesContinue(false);
          await contestantNominationEditor.chooseConstituency(NORTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.continueFromConstituencies();

          // One new card for each pair, in the elections' order.
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            },
            {
              election: OPEN_ELECTION_NAME.en,
              constituency: NATION_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            }
          ]);
          await contestantNominationEditor.expectNotes(listCard, {
            confirmed: false,
            new: true,
            removed: false,
            previousConstituency: null
          });
          await contestantNominationEditor.expectStatus(listCard, null);
          await contestantNominationEditor.expectParentGroup(listCard, {
            shown: true,
            required: true,
            chosen: null,
            options: [...LISTED_PARTIES, OTHER_PARTY_OPTION]
          });
          await contestantNominationEditor.expectParentGroup(openCard, {
            shown: true,
            required: true,
            chosen: null,
            options: OPEN_PARTY_OPTIONS
          });
          await contestantNominationEditor.expectParentHint(listCard, GREEN_ORGANIZATION_NAME.en, false);
          await contestantNominationEditor.expectParentHint(listCard, NEW_ORGANIZATION_NAME.en, true);
          await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');

          // Continue with no party chosen where one is required: nothing is written, and the first group in error has focus.
          await contestantNominationEditor.submit();
          await contestantNominationEditor.expectSaveMessage('invalid');
          await contestantNominationEditor.expectError(listCard, 'parent');
          await contestantNominationEditor.expectFocusOn({ on: 'firstParentOption', card: listCard });
          await contestantNominationEditor.expectStep('details');
          expect(await nominationsOf(NEW_CANDIDATE_GRANT)).toEqual([]);

          // A listed party that is nominated at the pair, independence in the other election, and a symbol typed with spaces around it.
          await contestantNominationEditor.chooseParent(listCard, 'entity', GREEN_ORGANIZATION_NAME.en);
          await contestantNominationEditor.chooseParent(openCard, 'none');
          await contestantNominationEditor.typeSymbol(openCard, TYPED_SYMBOL);

          // Continue stores both and leads to the nominations view, whose Continue leads on to the next task, which is the profile.
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_GRANT);
          expect(await nominationsOf(NEW_CANDIDATE_GRANT)).toEqual([
            {
              externalId: null,
              contest: LIST_NORTH_CONTEST,
              electionSymbol: null,
              confirmed: false,
              parentEntityExternalId: GREEN_ORGANIZATION.externalId,
              requestedParent: null
            },
            {
              externalId: null,
              contest: OPEN_NATION_CONTEST,
              electionSymbol: STORED_SYMBOL,
              confirmed: false,
              parentEntityExternalId: null,
              requestedParent: null
            }
          ]);

          // The nominations view, as a new document, lists what was stored. The two rows state no order, so each card is named by its election.
          await contestantNominationsPage.open(NEW_CANDIDATE_GRANT);
          await contestantNominationsPage.expectState({ state: 'listed', locked: false });
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: NORTH_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: false
          });
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: STORED_SYMBOL,
            parent: null,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(NEW_CANDIDATE_GRANT, 'none');
        }
      }
    );

    test(
      "define: a candidate names a party that is not nominated at its pair, and the party's nomination is added",
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(NEW_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(NEW_CANDIDATE_GRANT, 'none');
        try {
          // The closed-list election in its southern region, where no party is nominated.
          await contestantNominationEditor.open(NEW_CANDIDATE_GRANT);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.setElection(LIST_ELECTION_NAME.en, true);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.chooseConstituency(SOUTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.continueFromConstituencies();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: SOUTH_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            }
          ]);

          // The party says under its name that it is not nominated there. Choosing it and continuing stores the candidate's nomination and adds the party's.
          await contestantNominationEditor.expectParentHint(listCard, LONG_ORGANIZATION_NAME.en, true);
          await contestantNominationEditor.chooseParent(listCard, 'entity', LONG_ORGANIZATION_NAME.en);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_GRANT);
          expect(await nominationsOf(NEW_CANDIDATE_GRANT)).toEqual([
            {
              externalId: null,
              contest: LIST_SOUTH_CONTEST,
              electionSymbol: null,
              confirmed: false,
              parentEntityExternalId: LONG_ORGANIZATION.externalId,
              requestedParent: null
            }
          ]);
          expect(await nominationsOf(LONG_ORGANIZATION)).toEqual([
            {
              externalId: null,
              contest: LIST_SOUTH_CONTEST,
              electionSymbol: null,
              confirmed: false,
              parentEntityExternalId: null,
              requestedParent: null
            }
          ]);

          // The nominations view, as a new document, names the party as the list.
          await contestantNominationsPage.open(NEW_CANDIDATE_GRANT);
          await contestantNominationsPage.expectState({ state: 'listed', locked: false });
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: SOUTH_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: LONG_ORGANIZATION_NAME.en,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await clearWrittenNominations();
          await setNominations(NEW_CANDIDATE_GRANT, 'none');
        }
      }
    );

    test(
      'order: the party options of a card end with Other and then No party',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_CANDIDATE_GRANT, 'none');
        await candidateToOpenCard(contestantNominationEditor);

        // In an election in which a candidate may stand under no party, the listed parties come first, then "Other", and the option of no party last.
        expect(await contestantNominationEditor.parentOptionKinds(openCard)).toEqual([
          ...LISTED_PARTIES.map((party) => party.kind),
          OTHER_PARTY_OPTION.kind,
          NO_PARTY_OPTION.kind
        ]);

        // The card asks for the party first and for the election symbol after it.
        await contestantNominationEditor.expectSymbolAfterParentGroup(openCard);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'saved: a nomination added is shown on the nominations view, whose Continue leads on and whose Return leads home',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(NEW_CANDIDATE_GRANT, NOTHING_ANSWERED);
        await setNominations(NEW_CANDIDATE_GRANT, 'none');
        try {
          await candidateToOpenCard(contestantNominationEditor);
          await contestantNominationEditor.chooseParent(openCard, 'none');
          await contestantNominationEditor.typeSymbol(openCard, TYPED_SYMBOL);

          // The save leads to the nominations view, which lists the nomination just stored.
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: STORED_SYMBOL,
            parent: null,
            confirmed: false
          });

          // Continue leads on to the next task, the profile; Return, beside it, leads to the home.
          await contestantNominationsPage.expectReturnAction();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_GRANT);
          await contestantNominationsPage.open(NEW_CANDIDATE_GRANT);
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.pressReturn();
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(NEW_CANDIDATE_GRANT, 'none');
        }
      }
    );
  });
});

test.describe('contestant-nominations: the steps an entity with no nomination meets', () => {
  test.describe("as the unnominated party's editor", () => {
    test.use({ storageState: NEW_ORGANIZATION_STORAGE_STATE });

    test(
      'steps: a party meets the election step with only the elections a party can stand in',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_ORGANIZATION_GRANT, 'none');
        await contestantNominationEditor.open(NEW_ORGANIZATION_GRANT);
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectElections([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
        await contestantNominationEditor.expectChecked([]);
        await contestantNominationEditor.expectElectionsHint(true);
        await contestantNominationEditor.expectElectionsContinue(false);
      }
    );

    test(
      'steps: one admissible election with one constituency leads straight to the cards',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_ORGANIZATION_GRANT, 'none');
        try {
          // The closed-list election admits candidates alone, so one election admits a party, and it has one constituency. The step after the change is a full page load.
          await setElectionType(LIST_ELECTION_EXTERNAL_ID, 'candidate_only');
          await contestantNominationEditor.open(NEW_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: OPEN_ELECTION_NAME.en,
              constituency: NATION_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            }
          ]);
        } finally {
          await setElectionType(LIST_ELECTION_EXTERNAL_ID, SEEDED_ELECTION_TYPES[LIST_ELECTION_EXTERNAL_ID]);
        }
      }
    );

    test(
      'steps: one admissible election with several constituencies shows the constituency step alone',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_ORGANIZATION_GRANT, 'none');
        try {
          // The open election admits candidates alone, so one election admits a party, and it has two constituencies. The step after the change is a full page load.
          await setElectionType(OPEN_ELECTION_EXTERNAL_ID, 'candidate_only');
          await contestantNominationEditor.open(NEW_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.expectConstituencyPickers([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.expectNoElectionSentence(false);
          await contestantNominationEditor.expectConstituenciesContinue(false);
          await contestantNominationEditor.chooseConstituency(NORTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.continueFromConstituencies();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            }
          ]);
        } finally {
          await setElectionType(OPEN_ELECTION_EXTERNAL_ID, SEEDED_ELECTION_TYPES[OPEN_ELECTION_EXTERNAL_ID]);
        }
      }
    );

    test(
      'steps: with no admissible election every editor address leads to the nominations view',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_ORGANIZATION_GRANT, 'none');
        try {
          // No election admits a party. Each step after the change is a full page load.
          await setElectionType(LIST_ELECTION_EXTERNAL_ID, 'candidate_only');
          await setElectionType(OPEN_ELECTION_EXTERNAL_ID, 'candidate_only');
          for (const step of ['elections', 'constituencies', 'details'] as const) {
            await contestantNominationEditor.openStep(NEW_ORGANIZATION_GRANT, step);
            await contestantNominationsPage.expectShown(NEW_ORGANIZATION_GRANT);
            await contestantNominationEditor.expectNoStep();
          }
        } finally {
          await setElectionType(LIST_ELECTION_EXTERNAL_ID, SEEDED_ELECTION_TYPES[LIST_ELECTION_EXTERNAL_ID]);
          await setElectionType(OPEN_ELECTION_EXTERNAL_ID, SEEDED_ELECTION_TYPES[OPEN_ELECTION_EXTERNAL_ID]);
        }
      }
    );
  });

  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: NEW_CANDIDATE_STORAGE_STATE });

    test(
      'steps: an address that names an unknown election or constituency leads back to the entry',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_CANDIDATE_GRANT, 'none');
        await contestantNominationEditor.openStep(NEW_CANDIDATE_GRANT, 'details', {
          electionIds: [UNKNOWN_ELECTION_ID],
          constituencyIds: [UNKNOWN_CONSTITUENCY_ID]
        });
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectElections([
          LIST_ELECTION_NAME.en,
          OPEN_ELECTION_NAME.en,
          CANDIDATE_ONLY_ELECTION_NAME.en
        ]);
        await contestantNominationEditor.expectChecked([]);
        await contestantNominationEditor.expectNoTextOnPage(UNKNOWN_ELECTION_ID);
        await contestantNominationEditor.expectNoTextOnPage(UNKNOWN_CONSTITUENCY_ID);
      }
    );

    test(
      "steps: disallowing election selection does not choose an entity's elections",
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_CANDIDATE_GRANT, 'none');
        try {
          // The setting implies every election for a voter. The step after the change is a full page load.
          await setElectionSelectionDisallowed(true);
          await contestantNominationEditor.open(NEW_CANDIDATE_GRANT);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectElections([
            LIST_ELECTION_NAME.en,
            OPEN_ELECTION_NAME.en,
            CANDIDATE_ONLY_ELECTION_NAME.en
          ]);
          await contestantNominationEditor.expectChecked([]);
          await contestantNominationEditor.expectElectionsHint(true);
          await contestantNominationEditor.expectElectionsContinue(false);
        } finally {
          await setElectionSelectionDisallowed(false);
        }
      }
    );
  });
});

test.describe('contestant-nominations: editing existing nominations', () => {
  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_STORAGE_STATE });

    test(
      'edit: an entity with nominations starts from them',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        const openCard = { election: OPEN_ELECTION_NAME.en };
        const alliances = ALLIANCE_OPTIONS;
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');

        // Both elections the party stands in are checked on arrival, and the constituency it stands in is selected.
        await contestantNominationEditor.open(EDIT_ORGANIZATION_GRANT);
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectElections([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
        await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
        await contestantNominationEditor.expectElectionsHint(false);
        await contestantNominationEditor.continueFromElections();
        await contestantNominationEditor.expectStep('constituencies');
        await contestantNominationEditor.expectConstituencyPickers([LIST_ELECTION_NAME.en]);
        await contestantNominationEditor.expectChosenConstituency(NORTH_CONSTITUENCY_NAME.en);
        await contestantNominationEditor.continueFromConstituencies();

        // One card for each stored nomination, each with what is stored and the note that a change must be confirmed again.
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.expectNotes(listCard, CONFIRMED_KEPT_NOTES);
        await contestantNominationEditor.expectNotes(openCard, CONFIRMED_KEPT_NOTES);
        await contestantNominationEditor.expectStatus(listCard, 'confirmed');
        await contestantNominationEditor.expectStatus(openCard, 'confirmed');
        await contestantNominationEditor.expectSymbol(listCard, '');
        await contestantNominationEditor.expectSymbol(openCard, EDIT_ORGANIZATION_ELECTION_SYMBOL);
        await contestantNominationEditor.expectParentGroup(listCard, {
          shown: true,
          required: false,
          chosen: 'none',
          options: alliances
        });
        await contestantNominationEditor.expectParentGroup(openCard, {
          shown: true,
          required: false,
          chosen: 'none',
          options: alliances
        });
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'edit: saving an untouched set writes nothing and leaves a confirmed nomination confirmed',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_ORGANIZATION_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');

        await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_GRANT);
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.submit();
        await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_GRANT);
        await contestantNominationEditor.expectNoStep();
        await contestantNominationsPage.pressButton('continue');
        await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_GRANT);
        expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([
          EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
          EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
        ]);

        await contestantNominationsPage.open(EDIT_ORGANIZATION_GRANT);
        await contestantNominationsPage.expectCardCount(2);
        await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_LIST_VIEW_CARD);
        await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_OPEN_VIEW_CARD);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'edit: a changed symbol is stored and the nomination waits for confirmation again',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_ORGANIZATION_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        try {
          await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.typeSymbol(openCard, CHANGED_SYMBOL);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_GRANT);
          expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            { ...EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION, electionSymbol: CHANGED_SYMBOL, confirmed: false }
          ]);

          // The nomination that was changed is pending; the one nobody touched is still confirmed.
          await contestantNominationsPage.open(EDIT_ORGANIZATION_GRANT);
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_LIST_VIEW_CARD);
          await contestantNominationsPage.expectCardOf({
            ...EDIT_ORGANIZATION_OPEN_VIEW_CARD,
            symbol: CHANGED_SYMBOL,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        }
      }
    );

    test(
      'edit: a party names an alliance that has no nomination at its pair',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_ORGANIZATION_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        try {
          // The alliance that is nominated in the open election carries no hint there; the unconfirmed one, which is nominated nowhere, does.
          await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.expectParentHint(openCard, COAST_ALLIANCE_NAME.en, false);
          await contestantNominationEditor.expectParentHint(openCard, INLAND_ALLIANCE_NAME.en, true);
          await contestantNominationEditor.chooseParent(openCard, 'entity', INLAND_ALLIANCE_NAME.en);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_GRANT);
          expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            {
              ...EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION,
              confirmed: false,
              parentEntityExternalId: INLAND_ALLIANCE.externalId
            }
          ]);
          expect(await nominationsOf(INLAND_ALLIANCE)).toEqual([
            {
              externalId: null,
              contest: OPEN_NATION_CONTEST,
              electionSymbol: null,
              confirmed: false,
              parentEntityExternalId: null,
              requestedParent: null
            }
          ]);

          await contestantNominationsPage.open(EDIT_ORGANIZATION_GRANT);
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectCardOf({
            ...EDIT_ORGANIZATION_OPEN_VIEW_CARD,
            parent: INLAND_ALLIANCE_NAME.en,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await clearWrittenNominations();
          await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        }
      }
    );

    test(
      'edit: several nominations in one election are kept as they are',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const northCard = { election: LIST_ELECTION_NAME.en, constituency: NORTH_CONSTITUENCY_NAME.en };
        const southCard = { election: LIST_ELECTION_NAME.en, constituency: SOUTH_CONSTITUENCY_NAME.en };
        const openCard = { election: OPEN_ELECTION_NAME.en };
        const southNomination = {
          externalId: EDIT_ORGANIZATION_SOUTH_NOMINATION_EXTERNAL_ID,
          contest: LIST_SOUTH_CONTEST,
          electionSymbol: SOUTH_NOMINATION_SYMBOL,
          confirmed: false,
          parentEntityExternalId: null,
          requestedParent: null
        };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_ORGANIZATION_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        await addNomination(EDIT_ORGANIZATION_GRANT, LIST_SOUTH_CONTEST, {
          externalId: EDIT_ORGANIZATION_SOUTH_NOMINATION_EXTERNAL_ID,
          electionSymbol: SOUTH_NOMINATION_SYMBOL
        });
        try {
          // The election with two nominations is checked like the other. It has no constituency to choose, and the other election has one constituency, so Continue leads straight to the cards.
          await contestantNominationEditor.open(EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            EDIT_ORGANIZATION_LIST_CARD,
            {
              election: LIST_ELECTION_NAME.en,
              constituency: SOUTH_CONSTITUENCY_NAME.en,
              state: 'kept',
              confirmed: false,
              moved: false
            },
            EDIT_ORGANIZATION_OPEN_CARD
          ]);
          await contestantNominationEditor.expectStatus(northCard, 'confirmed');
          await contestantNominationEditor.expectNotes(northCard, CONFIRMED_KEPT_NOTES);
          await contestantNominationEditor.expectSymbol(northCard, '');
          await contestantNominationEditor.expectStatus(southCard, 'pending');
          await contestantNominationEditor.expectNotes(southCard, PENDING_KEPT_NOTES);
          await contestantNominationEditor.expectSymbol(southCard, SOUTH_NOMINATION_SYMBOL);
          await contestantNominationEditor.expectSymbol(openCard, EDIT_ORGANIZATION_ELECTION_SYMBOL);

          // A change to one of the two is stored on that one alone.
          await contestantNominationEditor.typeSymbol(southCard, CHANGED_SYMBOL);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_GRANT);
          expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            { ...southNomination, electionSymbol: CHANGED_SYMBOL },
            EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
          ]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        }
      }
    );
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: EDIT_CANDIDATE_STORAGE_STATE });

    test(
      'edit: a candidate replaces its party with a typed name, and later with a listed party',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          // The stored party is chosen on arrival. "Other" is reached with the arrow keys: focus stays on its radio, and the name field is the next tab stop.
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectParentGroup(listCard, {
            shown: true,
            required: true,
            chosen: 'entity',
            options: [...LISTED_PARTIES, OTHER_PARTY_OPTION]
          });
          expect(await contestantNominationEditor.parentByKeyboard(listCard, [])).toEqual({
            chosen: GREEN_PARTY_OPTION,
            focused: GREEN_PARTY_OPTION
          });
          expect(await contestantNominationEditor.parentByKeyboard(listCard, ARROWS_FROM_GREEN_TO_OTHER)).toEqual({
            chosen: OTHER_PARTY_OPTION,
            focused: OTHER_PARTY_OPTION
          });
          expect(await contestantNominationEditor.parentByKeyboard(listCard, ['Tab'])).toEqual({
            chosen: OTHER_PARTY_OPTION,
            focused: 'otherName'
          });
          await contestantNominationEditor.typeOtherName(listCard, TYPED_PARTY_NAME);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_CANDIDATE_GRANT);
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([
            {
              ...EDIT_CANDIDATE_SEEDED_NOMINATION,
              confirmed: false,
              parentEntityExternalId: null,
              requestedParent: TYPED_PARTY_NAME
            }
          ]);

          // Opened again, the card starts from the stored name. A listed party chosen in its place removes the name.
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectParentGroup(listCard, {
            shown: true,
            required: true,
            chosen: 'other',
            options: [...LISTED_PARTIES, OTHER_PARTY_OPTION]
          });
          await contestantNominationEditor.expectOtherName(listCard, TYPED_PARTY_NAME);
          await contestantNominationEditor.expectStatus(listCard, 'pending');
          await contestantNominationEditor.chooseParent(listCard, 'entity', GREEN_ORGANIZATION_NAME.en);
          await contestantNominationEditor.expectOtherName(listCard, null);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_CANDIDATE_GRANT);
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([
            { ...EDIT_CANDIDATE_SEEDED_NOMINATION, confirmed: false }
          ]);

          // Opened once more, the listed party is chosen and the card shows no name field.
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
          expect(await contestantNominationEditor.parentByKeyboard(listCard, [])).toEqual({
            chosen: GREEN_PARTY_OPTION,
            focused: GREEN_PARTY_OPTION
          });
          await contestantNominationEditor.expectOtherName(listCard, null);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        }
      }
    );

    test(
      'edit: a changed constituency moves the nomination and names the previous one',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          // The stored constituency is selected on arrival; the other one is selected in its place.
          await contestantNominationEditor.open(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.expectChosenConstituency(NORTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.chooseConstituency(SOUTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.continueFromConstituencies();

          // One card, at the new constituency, naming the previous one, with the symbol and the party that are stored. The party is not nominated in the new constituency and says so.
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: SOUTH_CONSTITUENCY_NAME.en,
              state: 'kept',
              confirmed: true,
              moved: true
            }
          ]);
          await contestantNominationEditor.expectNotes(listCard, {
            confirmed: true,
            new: false,
            removed: false,
            previousConstituency: NORTH_CONSTITUENCY_NAME.en
          });
          await contestantNominationEditor.expectSymbol(listCard, EDIT_CANDIDATE_ELECTION_SYMBOL);
          expect(await contestantNominationEditor.parentByKeyboard(listCard, [])).toEqual({
            chosen: GREEN_PARTY_OPTION,
            focused: GREEN_PARTY_OPTION
          });
          await contestantNominationEditor.expectParentHint(listCard, GREEN_ORGANIZATION_NAME.en, true);

          // The save leaves one nomination, at the new constituency, which waits for confirmation.
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_CANDIDATE_GRANT);
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([
            {
              externalId: null,
              contest: LIST_SOUTH_CONTEST,
              electionSymbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
              confirmed: false,
              parentEntityExternalId: GREEN_ORGANIZATION.externalId,
              requestedParent: null
            }
          ]);
          await contestantNominationsPage.open(EDIT_CANDIDATE_GRANT);
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: SOUTH_CONSTITUENCY_NAME.en,
            symbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await clearWrittenNominations();
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        }
      }
    );

    test(
      'edit: a party that is no longer listed stays chosen and is kept by a save',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        const listedWithoutGreen = LISTED_PARTIES.filter((party) => party.name !== GREEN_ORGANIZATION_NAME.en);
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          // The candidate's party is no longer confirmed, so a candidate is not offered it. The step after the change is a full page load.
          await setEntityConfirmed(GREEN_ORGANIZATION, false);
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectParentGroup(listCard, {
            shown: true,
            required: true,
            chosen: 'unlisted',
            options: [{ kind: 'unlisted', name: GREEN_ORGANIZATION_NAME.en }, ...listedWithoutGreen, OTHER_PARTY_OPTION]
          });
          await contestantNominationEditor.expectParentHint(listCard, GREEN_ORGANIZATION_NAME.en, true);

          // A save that changes the symbol leaves the party as it is.
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_CANDIDATE_GRANT);
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([
            { ...EDIT_CANDIDATE_SEEDED_NOMINATION, electionSymbol: CHANGED_SYMBOL, confirmed: false }
          ]);
          await contestantNominationsPage.open(EDIT_CANDIDATE_GRANT);
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: NORTH_CONSTITUENCY_NAME.en,
            symbol: CHANGED_SYMBOL,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
          await setEntityConfirmed(GREEN_ORGANIZATION, true);
        }
      }
    );

    test(
      'edit: two nominations at one contest cannot name the same list',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const secondCard = { election: LIST_ELECTION_NAME.en, nth: 1 };
        const secondNomination = {
          externalId: EDIT_CANDIDATE_SAME_CONTEST_NOMINATION_EXTERNAL_ID,
          contest: LIST_NORTH_CONTEST,
          electionSymbol: null,
          confirmed: false,
          parentEntityExternalId: EDIT_ORGANIZATION_GRANT.externalId,
          requestedParent: null
        };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        await addNomination(EDIT_CANDIDATE_GRANT, LIST_NORTH_CONTEST, {
          externalId: EDIT_CANDIDATE_SAME_CONTEST_NOMINATION_EXTERNAL_ID,
          parent: { kind: 'nomination', externalId: EDIT_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID }
        });
        try {
          // Two nominations in one election leave no constituency to choose, so Continue leads straight to the two cards.
          await contestantNominationEditor.open(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'kept',
              confirmed: true,
              moved: false
            },
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'kept',
              confirmed: false,
              moved: false
            }
          ]);

          // The second card is given the party the first one names: the press writes nothing and the second card's group says why.
          await contestantNominationEditor.chooseParent(secondCard, 'entity', GREEN_ORGANIZATION_NAME.en);
          await contestantNominationEditor.submit();
          await contestantNominationEditor.expectSaveMessage('invalid');
          await contestantNominationEditor.expectError(secondCard, 'parent');
          await contestantNominationEditor.expectFocusOn({ on: 'firstParentOption', card: secondCard });
          await contestantNominationEditor.expectStep('details');
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([
            EDIT_CANDIDATE_SEEDED_NOMINATION,
            secondNomination
          ]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        }
      }
    );

    test(
      "edit: a nomination outside the editor's reach has no card and survives a save",
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        const otherRoundNomination = {
          externalId: EDIT_CANDIDATE_OTHER_ROUND_NOMINATION_EXTERNAL_ID,
          contest: OPEN_NATION_CONTEST,
          electionSymbol: null,
          confirmed: false,
          parentEntityExternalId: null,
          requestedParent: null
        };
        const closedElectionNomination = {
          externalId: EDIT_CANDIDATE_CLOSED_ELECTION_NOMINATION_EXTERNAL_ID,
          contest: CANDIDATE_ONLY_NATION_CONTEST,
          electionSymbol: null,
          confirmed: true,
          parentEntityExternalId: null,
          requestedParent: null
        };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        await addNomination(EDIT_CANDIDATE_GRANT, OPEN_NATION_CONTEST, {
          externalId: EDIT_CANDIDATE_OTHER_ROUND_NOMINATION_EXTERNAL_ID,
          electionRound: OTHER_ELECTION_ROUND
        });
        await addNomination(EDIT_CANDIDATE_GRANT, CANDIDATE_ONLY_NATION_CONTEST, {
          externalId: EDIT_CANDIDATE_CLOSED_ELECTION_NOMINATION_EXTERNAL_ID,
          confirmed: true
        });
        try {
          // The election of the second added nomination no longer admits a candidate. The step after the change is a full page load.
          await setElectionType(CANDIDATE_ONLY_ELECTION_EXTERNAL_ID, 'organization_only');

          // The election of the other round is offered and not checked; the election that admits no candidate is not offered.
          await contestantNominationEditor.open(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectElections([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.continueFromConstituencies();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'kept',
              confirmed: true,
              moved: false
            }
          ]);

          // A save that changes the one card leaves both other nominations as they were.
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_CANDIDATE_GRANT);
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([
            closedElectionNomination,
            { ...EDIT_CANDIDATE_SEEDED_NOMINATION, electionSymbol: CHANGED_SYMBOL, confirmed: false },
            otherRoundNomination
          ]);
          await contestantNominationsPage.open(EDIT_CANDIDATE_GRANT);
          await contestantNominationsPage.expectCardCount(3);
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: null,
            confirmed: false
          });
          await contestantNominationsPage.expectCardOf({
            election: CANDIDATE_ONLY_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: null,
            confirmed: true
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
          await setElectionType(
            CANDIDATE_ONLY_ELECTION_EXTERNAL_ID,
            SEEDED_ELECTION_TYPES[CANDIDATE_ONLY_ELECTION_EXTERNAL_ID]
          );
        }
      }
    );
  });
});

test.describe('contestant-nominations: removing nominations', () => {
  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_STORAGE_STATE });

    test(
      'remove: a removed card says so, can be kept, and is deleted on Continue',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        const removedOpenCard = { ...EDIT_ORGANIZATION_OPEN_CARD, state: 'removed' as const };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_ORGANIZATION_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        try {
          await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.typeSymbol(openCard, CHANGED_SYMBOL);

          // Remove writes nothing: the card says it is to be removed, shows no field, and focus is on its Keep.
          await contestantNominationEditor.remove(openCard);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, removedOpenCard]);
          await contestantNominationEditor.expectNotes(openCard, REMOVED_NOTES);
          await contestantNominationEditor.expectParentGroup(openCard, { shown: false });
          await contestantNominationEditor.expectFocusOn({ on: 'keep', card: openCard });
          expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
          ]);

          // Keep restores the card with what was typed, and focus is on its Remove.
          await contestantNominationEditor.keep(openCard);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.expectNotes(openCard, CONFIRMED_KEPT_NOTES);
          await contestantNominationEditor.expectSymbol(openCard, CHANGED_SYMBOL);
          await contestantNominationEditor.expectFocusOn({ on: 'remove', card: openCard });

          // Removed again, the nomination is deleted by Continue.
          await contestantNominationEditor.remove(openCard);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_GRANT);
          expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION]);
          await contestantNominationsPage.open(EDIT_ORGANIZATION_GRANT);
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_LIST_VIEW_CARD);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        }
      }
    );

    test(
      'remove: unchecking an election starts its card as removed',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');

        await contestantNominationEditor.open(EDIT_ORGANIZATION_GRANT);
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
        await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, false);
        await contestantNominationEditor.continueFromElections();
        await contestantNominationEditor.expectStep('constituencies');
        await contestantNominationEditor.continueFromConstituencies();

        // The nomination of the unchecked election has its card, which says it is to be removed. Nothing has been written, and Keep puts the card back.
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectCards([
          EDIT_ORGANIZATION_LIST_CARD,
          { ...EDIT_ORGANIZATION_OPEN_CARD, state: 'removed' }
        ]);
        await contestantNominationEditor.expectNotes(openCard, REMOVED_NOTES);
        expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([
          EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
          EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
        ]);
        await contestantNominationEditor.keep(openCard);
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.expectSymbol(openCard, EDIT_ORGANIZATION_ELECTION_SYMBOL);
        await contestantNominationEditor.expectNoDialog();
      }
    );
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: EDIT_CANDIDATE_STORAGE_STATE });

    test(
      'remove: removing every nomination returns to the home with the first task open again',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantHomePage, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);

          // The one card is removed, and is still shown.
          await contestantNominationEditor.remove(listCard);
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'removed',
              confirmed: true,
              moved: false
            }
          ]);
          await contestantNominationEditor.expectNotes(listCard, REMOVED_NOTES);

          // Continue removes the nomination and leads to the nominations view, which offers a nomination to define and Return; Return leads to the home, where defining a nomination is the task to do.
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.expectButton('define');
          await contestantNominationsPage.pressReturn();
          await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_GRANT);
          await contestantHomePage.expectTaskList({
            nomination: 'incomplete',
            profile: 'blocked',
            questions: 'blocked'
          });
          await contestantHomePage.expectNextStep('nomination');
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        }
      }
    );
  });
});

test.describe('contestant-nominations: the main button, a refused save and leaving', () => {
  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: EDIT_CANDIDATE_STORAGE_STATE });

    test(
      'button: an untouched set reads Continue, a change Save and Continue, and every card removed Save and Return',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');

        // Nothing is changed and the profile is still to do: the button continues, and saves nothing.
        await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
        await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
        await contestantNominationEditor.expectSubmit('continue', 'continue');

        // A changed symbol is something to save; the stored symbol typed back is not.
        await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
        await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
        await contestantNominationEditor.typeSymbol(listCard, EDIT_CANDIDATE_ELECTION_SYMBOL);
        await contestantNominationEditor.expectSubmit('continue', 'continue');

        // With its one card removed the entity would be left with no nomination, so the button returns.
        await contestantNominationEditor.remove(listCard);
        await contestantNominationEditor.expectSubmit('return', 'saveAndReturn');

        // Cancel leaves without asking and saves nothing.
        await contestantNominationEditor.cancel();
        await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
        expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([EDIT_CANDIDATE_SEEDED_NOMINATION]);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'button: with no task left an untouched set reads Return, and a saved change returns to the home',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: true, opinions: OPINION_QUESTION_EXTERNAL_IDS });
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
          await contestantNominationEditor.expectSubmit('return', 'return');
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
          await contestantNominationEditor.expectSubmit('return', 'saveAndReturn');

          // The change is stored, and the press leads to the nominations view, whose main button returns to the entity's home with nothing left to do.
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('return');
          await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_GRANT);
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([
            { ...EDIT_CANDIDATE_SEEDED_NOMINATION, electionSymbol: CHANGED_SYMBOL, confirmed: false }
          ]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
          await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        }
      }
    );

    test(
      'refused: nominations removed elsewhere are shown as they now are and the draft is dropped',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);

          // While the editor is open, an administrator removes the nomination the card was built on.
          await setNominations(EDIT_CANDIDATE_GRANT, 'none');
          await contestantNominationEditor.submit();

          // Nothing was stored. The page says the nominations have changed and shows them as they now are: none, so the chosen election and constituency have a new card, with nothing of what was typed.
          await contestantNominationEditor.expectSaveMessage('changed');
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            { ...EDIT_CANDIDATE_LIST_CARD, state: 'new', confirmed: false }
          ]);
          await contestantNominationEditor.expectSymbol(listCard, '');
          await contestantNominationEditor.expectFocusOn({ on: 'submit' });
          await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        }
      }
    );

    test(
      'stale: a nominations lock that came on while the editor was open refuses the save and leads to the nominations view and its note',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);

          // While the editor is open, an administrator locks the nominations. The page still shows the editor.
          await setNominationsLocked(true);
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.submit();

          // The database refuses the save, and the user is on the nominations view, which says why. Nothing was stored.
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.expectState({ state: 'listed', locked: true });
          await contestantNominationsPage.expectLockedNote(true, 'nominationsLocked');
          await contestantNominationsPage.expectHeadingFocused();
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: NORTH_CONSTITUENCY_NAME.en,
            symbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: true
          });
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([EDIT_CANDIDATE_SEEDED_NOMINATION]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominationsLocked(false);
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        }
      }
    );

    test(
      'closing: an answers lock that came on while the editor was open refuses the save and leads to the nominations view and its note',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);

          // While the editor is open, an administrator locks the answers. The page still shows the editor.
          await setAnswersLocked(true);
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.submit();

          // The database refuses the save, and the user is on the nominations view, which says why and goes on to no task from there. Nothing was stored.
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.expectState({ state: 'listed', locked: true, editable: false });
          await contestantNominationsPage.expectLockedNote(true, 'nominationsAnswersLocked');
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: NORTH_CONSTITUENCY_NAME.en,
            symbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: true
          });
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([EDIT_CANDIDATE_SEEDED_NOMINATION]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setAnswersLocked(false);
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        }
      }
    );
  });

  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_STORAGE_STATE });

    test(
      'refused: a nomination with candidates listed under it cannot be removed, and the card stays as it was',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        const removedListCard = { ...EDIT_ORGANIZATION_LIST_CARD, state: 'removed' as const };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_ORGANIZATION_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        // A candidate is listed under the party's nomination in the closed-list election.
        await setNominations(CHILD_CANDIDATE, 'seeded');

        await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_GRANT);
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.remove(listCard);
        await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
        await contestantNominationEditor.submit();

        // The database refuses the removal. The page says why, the card is still about to be removed, and the button reads as it did.
        await contestantNominationEditor.expectSaveMessage('hasCandidates');
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectCards([removedListCard, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.expectNotes(listCard, REMOVED_NOTES);
        await contestantNominationEditor.expectFocusOn({ on: 'submit' });
        await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
        expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([
          EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
          EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
        ]);

        // Keep is still there and puts the card back. Nothing was stored: the view lists both nominations, confirmed.
        await contestantNominationEditor.keep(listCard);
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.cancel();
        await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_GRANT);
        await contestantNominationsPage.expectCardCount(2);
        await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_LIST_VIEW_CARD);
        await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_OPEN_VIEW_CARD);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'leave: leaving with unsaved changes asks first, staying keeps the draft, and Cancel leaves without asking',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');

        await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_GRANT);
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.typeSymbol(openCard, CHANGED_SYMBOL);

        // The link back to the selection asks first. Answered with "stay", the step is still shown with what was typed.
        await contestantNominationEditor.leaveByChangingSelection('stay');
        await contestantNominationEditor.expectLeavePrompts(1);
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectSymbol(openCard, CHANGED_SYMBOL);

        // Cancel discards the change without asking.
        await contestantNominationEditor.cancel();
        await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_GRANT);
        await contestantNominationEditor.expectLeavePrompts(1);
        expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([
          EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
          EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
        ]);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'saved: a save that removes one of several nominations in an election leads on to the next task',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const southCard = { election: LIST_ELECTION_NAME.en, constituency: SOUTH_CONSTITUENCY_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_ORGANIZATION_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        await addNomination(EDIT_ORGANIZATION_GRANT, LIST_SOUTH_CONTEST, {
          externalId: EDIT_ORGANIZATION_SOUTH_NOMINATION_EXTERNAL_ID,
          electionSymbol: SOUTH_NOMINATION_SYMBOL
        });
        try {
          // The election with two nominations has no constituency to choose, so Continue leads straight to the cards and the address names no constituency for it.
          await contestantNominationEditor.open(EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            EDIT_ORGANIZATION_LIST_CARD,
            { ...EDIT_ORGANIZATION_LIST_CARD, constituency: SOUTH_CONSTITUENCY_NAME.en, confirmed: false },
            EDIT_ORGANIZATION_OPEN_CARD
          ]);

          // With one of the two removed the election holds one nomination, and the address the save was made from no longer says where it is. The save is stored all the same, and leads on to the profile.
          await contestantNominationEditor.remove(southCard);
          await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_GRANT);
          expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
          ]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        }
      }
    );
  });
});

test.describe('contestant-nominations: the nominations view, the way into the editor, and what follows a save', () => {
  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_STORAGE_STATE });

    test(
      'nominations-view: listed and editable — the sentence that they can be changed, Return under the main button, and no support button',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationsPage }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_ORGANIZATION_GRANT, NOTHING_ANSWERED);
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');

        await contestantNominationsPage.open(EDIT_ORGANIZATION_GRANT);
        await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
        await contestantNominationsPage.expectLockedNote(false);
        await contestantNominationsPage.expectDescription(VIEW_SENTENCE.listedEditable.organization);
        await contestantNominationsPage.expectCardCount(2);
        await contestantNominationsPage.expectSupportButtons(0);

        // The main button continues to the party's next task, and Return, after it, leads to the party's home.
        await contestantNominationsPage.expectButton('continue');
        await contestantNominationsPage.expectReturnAction();
        await contestantNominationsPage.pressReturn();
        await contestantEntityPages.expectOnHome(EDIT_ORGANIZATION_GRANT);
      }
    );

    test(
      'nominations-view: a nomination deleted from its card, after its confirmation, leaves the view',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_ORGANIZATION_GRANT, NOTHING_ANSWERED);
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        try {
          await contestantNominationsPage.open(EDIT_ORGANIZATION_GRANT);
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectCardActions(LIST_ELECTION_NAME.en, true);
          await contestantNominationsPage.expectCardActions(OPEN_ELECTION_NAME.en, true);

          // Edit leads to the details step with both nominations kept, and Cancel back to the view.
          await contestantNominationsPage.pressCardEdit(OPEN_ELECTION_NAME.en);
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.cancel();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_GRANT);

          // Delete asks in the card, and Cancel takes the question back: nothing is written.
          await contestantNominationsPage.pressCardDelete(OPEN_ELECTION_NAME.en);
          await contestantNominationsPage.cancelDelete(OPEN_ELECTION_NAME.en);
          await contestantNominationsPage.expectCardCount(2);
          expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
          ]);

          // Confirmed, the delete removes that nomination alone, and the view lists the other one.
          await contestantNominationsPage.pressCardDelete(OPEN_ELECTION_NAME.en);
          await contestantNominationsPage.confirmDelete(OPEN_ELECTION_NAME.en);
          await contestantNominationsPage.expectDeleted();
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_LIST_VIEW_CARD);
          expect(await nominationsOf(EDIT_ORGANIZATION_GRANT)).toEqual([EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        }
      }
    );

    test(
      'nominations-view: nominations listed but no election admissible — no Edit',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
        try {
          for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setElectionType(election, 'candidate_only');

          // A full page load after the types changed: the party's nominations are listed, and nothing leads to the editor.
          await contestantNominationsPage.open(EDIT_ORGANIZATION_GRANT);
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: false });
          await contestantNominationsPage.expectLockedNote(false);
          await contestantNominationsPage.expectDescription(VIEW_SENTENCE.listed.organization);
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectSupportButtons(0);
          await contestantNominationsPage.expectNoEditAction();

          // The editor's entry address, as a new document, leads back to the view.
          await contestantNominationEditor.open(EDIT_ORGANIZATION_GRANT);
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectNoStep();
        } finally {
          for (const election of ELECTIONS_THAT_ADMIT_A_PARTY)
            await setElectionType(election, SEEDED_ELECTION_TYPES[election]);
        }
      }
    );
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: EDIT_CANDIDATE_STORAGE_STATE });

    test(
      'nominations-view: under the nominations lock every editor address leads here, with the note and no Edit',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await setAnswersLocked(false);
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          await setNominationsLocked(true);

          // Each address of the editor, as a new document after the lock came on.
          for (const step of EDITOR_STEPS) {
            await contestantNominationEditor.openStep(EDIT_CANDIDATE_GRANT, step, EDIT_CANDIDATE_SELECTION);
            await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
            await contestantNominationsPage.expectState({ state: 'listed', locked: true, editable: false });
            await contestantNominationEditor.expectNoStep();
            await contestantNominationsPage.expectLockedNote(true, 'nominationsLocked');
            await contestantNominationsPage.expectSupportButtons(1);
            await contestantNominationsPage.expectNoEditAction();
            await contestantNominationsPage.expectCardCount(1);
          }
        } finally {
          await setNominationsLocked(false);
        }
      }
    );

    test(
      "nominations-view: under the answers lock alone every editor address leads here, and the note gives that lock's reason",
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await setNominationsLocked(false);
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          await setAnswersLocked(true);

          // Each address of the editor, as a new document after the lock came on.
          for (const step of EDITOR_STEPS) {
            await contestantNominationEditor.openStep(EDIT_CANDIDATE_GRANT, step, EDIT_CANDIDATE_SELECTION);
            await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
            await contestantNominationsPage.expectState({ state: 'listed', locked: true, editable: false });
            await contestantNominationEditor.expectNoStep();
            await contestantNominationsPage.expectLockedNote(true, 'nominationsAnswersLocked');
            await contestantNominationsPage.expectSupportButtons(1);
            await contestantNominationsPage.expectNoEditAction();
            await contestantNominationsPage.expectCardCount(1);
          }
        } finally {
          await setAnswersLocked(false);
        }
      }
    );

    test(
      "nominations-view: with both locks on the note gives the nominations lock's reason",
      { tag: '@nomination-definition' },
      async ({ contestantNominationsPage }) => {
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          await setNominationsLocked(true);
          await setAnswersLocked(true);

          // A full page load after both locks came on: one note, and one support button, which is the note's.
          await contestantNominationsPage.open(EDIT_CANDIDATE_GRANT);
          await contestantNominationsPage.expectState({ state: 'listed', locked: true, editable: false });
          await contestantNominationsPage.expectLockedNote(true, 'nominationsLocked');
          await contestantNominationsPage.expectSupportButtons(1);
          await contestantNominationsPage.expectNoEditAction();
        } finally {
          await setNominationsLocked(false);
          await setAnswersLocked(false);
        }
      }
    );

    test(
      'nominations-view: a typed party is shown on its row with the line that it was requested',
      { tag: '@nomination-definition' },
      async ({ contestantNominationsPage }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        await addNomination(EDIT_CANDIDATE_GRANT, OPEN_NATION_CONTEST, {
          externalId: EDIT_CANDIDATE_TYPED_PARTY_NOMINATION_EXTERNAL_ID,
          parent: { kind: 'other', name: TYPED_PARTY_NAME }
        });
        try {
          await contestantNominationsPage.open(EDIT_CANDIDATE_GRANT);
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
          await contestantNominationsPage.expectCardCount(2);

          // The nomination with a typed party shows the name on its parent row and says it is a request; the other shows its party as before.
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: null,
            confirmed: false,
            requestedParent: TYPED_PARTY_NAME
          });
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: NORTH_CONSTITUENCY_NAME.en,
            symbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: true
          });
        } finally {
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        }
      }
    );

    test(
      'nominations-view: Add a nomination is offered below the cards while another can be added',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(EDIT_CANDIDATE_GRANT, NOTHING_ANSWERED);
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        try {
          // Nominated in the closed-list election alone, the candidate can stand in two more: Add leads to the editor's entry, with its election chosen.
          await contestantNominationsPage.open(EDIT_CANDIDATE_GRANT);
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectAddAction(true);
          await contestantNominationsPage.pressAdd();
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en]);

          // Nominated in every election that admits a candidate, the candidate is offered no Add, and its cards keep Edit and Delete.
          await addNomination(EDIT_CANDIDATE_GRANT, OPEN_NATION_CONTEST, {
            externalId: EDIT_CANDIDATE_OPEN_NOMINATION_EXTERNAL_ID,
            confirmed: true
          });
          await addNomination(EDIT_CANDIDATE_GRANT, CANDIDATE_ONLY_NATION_CONTEST, {
            externalId: EDIT_CANDIDATE_CLOSED_ELECTION_NOMINATION_EXTERNAL_ID,
            confirmed: true
          });
          await contestantNominationsPage.open(EDIT_CANDIDATE_GRANT);
          await contestantNominationsPage.expectCardCount(3);
          await contestantNominationsPage.expectAddAction(false);
          await contestantNominationsPage.expectCardActions(LIST_ELECTION_NAME.en, true);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        }
      }
    );

    test(
      "holds: with a nomination the home's nomination row leads to the nominations view",
      { tag: '@nomination-definition' },
      async ({ contestantEntityHomePage, contestantEntityPages, contestantHomePage, contestantNominationsPage }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');

        await contestantEntityPages.openHome(EDIT_CANDIDATE_GRANT);
        await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_GRANT);
        await contestantHomePage.expectTaskList({
          nomination: 'complete',
          profile: 'incomplete',
          questions: 'incomplete'
        });
        expect(await contestantEntityHomePage.followNominationTask()).toBe('nominations');
        await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
        await contestantNominationsPage.expectCardCount(1);
      }
    );

    test(
      'follow: a question that no longer applies is neither asked nor counted, and its answer returns with the nomination',
      { tag: '@nomination-definition' },
      async ({
        contestantEntityHomePage,
        contestantEntityPages,
        contestantHomePage,
        contestantNominationEditor,
        contestantNominationsPage,
        contestantQuestionsOverviewPage,
        navMenu
      }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        const everyTaskComplete = { nomination: 'complete', profile: 'complete', questions: 'complete' } as const;
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
        await addNomination(EDIT_CANDIDATE_GRANT, OPEN_NATION_CONTEST, {
          externalId: EDIT_CANDIDATE_OPEN_NOMINATION_EXTERNAL_ID,
          confirmed: true
        });
        await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: true, opinions: OPINION_QUESTION_EXTERNAL_IDS });
        try {
          // The one full page load of the test. Nominated in both elections, the candidate is asked all three questions and has answered them.
          await contestantEntityPages.openHome(EDIT_CANDIDATE_GRANT);
          await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.markDocument();
          await contestantHomePage.expectTaskList(everyTaskComplete);
          await contestantHomePage.clickTask('opinions');
          await contestantEntityPages.expectOnQuestions(EDIT_CANDIDATE_GRANT);
          await contestantQuestionsOverviewPage.expectQuestionsListed([
            SHARED_OPINION_QUESTION_LABEL,
            LIST_OPINION_QUESTION_LABEL,
            OPEN_OPINION_QUESTION_LABEL
          ]);
          await contestantQuestionsOverviewPage.expectProgress({ answered: 3, total: 3 });

          // Through the view's Add, the national election is unchecked and its nomination removed by the save.
          await navMenu.goHome();
          expect(await contestantEntityHomePage.followNominationTask()).toBe('nominations');
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
          await contestantNominationsPage.expectAddAction(true);
          await contestantNominationsPage.pressAdd();
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
          await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, false);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.continueFromConstituencies();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            EDIT_CANDIDATE_LIST_CARD,
            {
              election: OPEN_ELECTION_NAME.en,
              constituency: NATION_CONSTITUENCY_NAME.en,
              state: 'removed',
              confirmed: true,
              moved: false
            }
          ]);
          await contestantNominationEditor.submit();

          // The save leads to the nominations view, which returns home with every task still complete: the national election's question is no longer asked, so two are listed and both are answered.
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('return');
          await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_GRANT);
          await contestantHomePage.expectTaskList(everyTaskComplete);
          await contestantHomePage.expectTaskCount('questions', null);
          expect(await nominationsOf(EDIT_CANDIDATE_GRANT)).toEqual([EDIT_CANDIDATE_SEEDED_NOMINATION]);
          await contestantHomePage.clickTask('opinions');
          await contestantEntityPages.expectOnQuestions(EDIT_CANDIDATE_GRANT);
          await contestantQuestionsOverviewPage.expectQuestionsListed([
            SHARED_OPINION_QUESTION_LABEL,
            LIST_OPINION_QUESTION_LABEL
          ]);
          await contestantQuestionsOverviewPage.expectProgress({ answered: 2, total: 2 });

          // Through Add again, the national election is checked and the candidate stands in it with no party.
          await navMenu.goHome();
          expect(await contestantEntityHomePage.followNominationTask()).toBe('nominations');
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.pressAdd();
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, true);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.continueFromConstituencies();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            EDIT_CANDIDATE_LIST_CARD,
            {
              election: OPEN_ELECTION_NAME.en,
              constituency: NATION_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            }
          ]);
          await contestantNominationEditor.chooseParent(openCard, 'none');
          await contestantNominationEditor.submit();

          // The save leads to the nominations view, which returns home with every task complete: the question is asked again, and the answer stored before is its answer, so three are listed and all three are answered.
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('return');
          await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_GRANT);
          await contestantHomePage.expectTaskList(everyTaskComplete);
          await contestantHomePage.expectTaskCount('questions', null);
          await contestantHomePage.clickTask('opinions');
          await contestantEntityPages.expectOnQuestions(EDIT_CANDIDATE_GRANT);
          await contestantQuestionsOverviewPage.expectQuestionsListed([
            SHARED_OPINION_QUESTION_LABEL,
            LIST_OPINION_QUESTION_LABEL,
            OPEN_OPINION_QUESTION_LABEL
          ]);
          await contestantQuestionsOverviewPage.expectProgress({ answered: 3, total: 3 });

          // The view lists the new nomination as not confirmed yet. The document is the one that was loaded at the start.
          await navMenu.goHome();
          expect(await contestantEntityHomePage.followNominationTask()).toBe('nominations');
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: null,
            confirmed: false
          });
          await contestantNominationEditor.expectSameDocument();
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
          await setAnswers(EDIT_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        }
      }
    );
  });

  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: NEW_CANDIDATE_STORAGE_STATE });

    test(
      "nominations-view: no nomination and editable — the sentence, no support button, and a button in the home's words that opens the editor",
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_CANDIDATE_GRANT, 'none');

        await contestantNominationsPage.open(NEW_CANDIDATE_GRANT);
        await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: true });
        await contestantNominationsPage.expectLockedNote(false);
        await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyEditable.candidate, 'define');
        await contestantNominationsPage.expectCardCount(0);
        await contestantNominationsPage.expectSupportButtons(0);
        await contestantNominationsPage.expectNoEditAction();

        // The main button reads what the home's nomination row reads, and leads to the election step with nothing chosen.
        await contestantNominationsPage.expectButton('define');
        await contestantNominationsPage.expectButtonText(DEFINE_NOMINATION_LABEL);
        await contestantNominationsPage.pressButton('define');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectChecked([]);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'nominations-view: no nomination under either lock — the note, the earlier sentence and Return',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationsPage }) => {
        await setNominations(NEW_CANDIDATE_GRANT, 'none');
        try {
          // A full page load after the nominations lock came on.
          await setAnswersLocked(false);
          await setNominationsLocked(true);
          await contestantNominationsPage.open(NEW_CANDIDATE_GRANT);
          await contestantNominationsPage.expectState({ state: 'empty', locked: true, editable: false });
          await contestantNominationsPage.expectLockedNote(true, 'nominationsLocked');
          await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyLocked.candidate, 'locked');
          await contestantNominationsPage.expectSupportButtons(1);
          await contestantNominationsPage.expectNoEditAction();
          await contestantNominationsPage.expectButton('return');

          // A full page load after the nominations lock went off and the answers lock came on.
          await setNominationsLocked(false);
          await setAnswersLocked(true);
          await contestantNominationsPage.open(NEW_CANDIDATE_GRANT);
          await contestantNominationsPage.expectState({ state: 'empty', locked: true, editable: false });
          await contestantNominationsPage.expectLockedNote(true, 'nominationsAnswersLocked');
          await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyLocked.candidate, 'locked');
          await contestantNominationsPage.expectSupportButtons(1);
          await contestantNominationsPage.expectNoEditAction();
          await contestantNominationsPage.pressButton('return');
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_GRANT);
        } finally {
          await setNominationsLocked(false);
          await setAnswersLocked(false);
        }
      }
    );

    test(
      "entry: with no nomination and nothing locked, the home's first task and its main action lead to the editor",
      { tag: '@nomination-definition' },
      async ({ contestantEntityHomePage, contestantEntityPages, contestantHomePage, contestantNominationEditor }) => {
        const noNomination = { nomination: 'incomplete', profile: 'blocked', questions: 'blocked' } as const;
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_CANDIDATE_GRANT, 'none');

        // The home says what it said of an entity with no nomination, and its main action leads to the election step with nothing chosen.
        await contestantEntityPages.openHome(NEW_CANDIDATE_GRANT);
        await contestantEntityPages.expectOnHome(NEW_CANDIDATE_GRANT);
        await contestantHomePage.expectTaskList(noNomination);
        await contestantHomePage.expectNextStep('nomination');
        await contestantHomePage.expectPreview('closed');
        await contestantHomePage.expectReason('noNomination');
        expect(await contestantEntityHomePage.followMainAction()).toBe('nominationElections');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectChecked([]);

        // The nomination row of the task list, from the home as a new document, leads to the same step.
        await contestantEntityPages.openHome(NEW_CANDIDATE_GRANT);
        await contestantEntityPages.expectOnHome(NEW_CANDIDATE_GRANT);
        await contestantHomePage.expectTaskList(noNomination);
        expect(await contestantEntityHomePage.followNominationTask()).toBe('nominationElections');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectChecked([]);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      "holds: with no nomination under either lock the home's first task leads to the nominations view",
      { tag: '@nomination-definition' },
      async ({ contestantEntityHomePage, contestantEntityPages, contestantHomePage, contestantNominationsPage }) => {
        await setNominations(NEW_CANDIDATE_GRANT, 'none');
        try {
          // The home as a new document after the nominations lock came on.
          await setAnswersLocked(false);
          await setNominationsLocked(true);
          await contestantEntityPages.openHome(NEW_CANDIDATE_GRANT);
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_GRANT);
          await contestantHomePage.expectNextStep('nomination');
          expect(await contestantEntityHomePage.followMainAction()).toBe('nominations');
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_GRANT);

          // The home as a new document after the nominations lock went off and the answers lock came on.
          await setNominationsLocked(false);
          await setAnswersLocked(true);
          await contestantEntityPages.openHome(NEW_CANDIDATE_GRANT);
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_GRANT);
          await contestantHomePage.expectNextStep('nomination');
          expect(await contestantEntityHomePage.followMainAction()).toBe('nominations');
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_GRANT);
        } finally {
          await setNominationsLocked(false);
          await setAnswersLocked(false);
        }
      }
    );

    test(
      'follow: after a first save the home, the nominations view and the questions follow without a full page load',
      { tag: '@nomination-definition' },
      async ({
        contestantEntityHomePage,
        contestantEntityPages,
        contestantHomePage,
        contestantNominationEditor,
        contestantNominationsPage,
        navMenu
      }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setAnswers(NEW_CANDIDATE_GRANT, { requiredInfo: false, opinions: [] });
        await setNominations(NEW_CANDIDATE_GRANT, 'none');
        try {
          // The one full page load of the test: the home, whose main action leads into the editor.
          await contestantEntityPages.openHome(NEW_CANDIDATE_GRANT);
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_GRANT);
          await contestantNominationEditor.markDocument();
          await contestantHomePage.expectTaskList({
            nomination: 'incomplete',
            profile: 'blocked',
            questions: 'blocked'
          });
          expect(await contestantEntityHomePage.followMainAction()).toBe('nominationElections');

          // The national election alone, which is held in one constituency, with no party.
          await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, true);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.chooseParent(openCard, 'none');
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_GRANT);

          // By the menu to the home: the nomination task is complete, the profile and the questions are open, and two questions are counted — the one asked in every election and the national election's, and not the regional election's.
          await navMenu.goHome();
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_GRANT);
          await contestantHomePage.expectTaskList({
            nomination: 'complete',
            profile: 'incomplete',
            questions: 'incomplete'
          });
          await contestantHomePage.expectTaskCount('nomination', null);
          await contestantHomePage.expectTaskCount('profile', 1);
          await contestantHomePage.expectTaskCount('questions', 2);
          await contestantHomePage.expectNextStep('profile');

          // The nomination row now leads to the view, which lists the stored nomination as not confirmed yet and continues to the profile.
          expect(await contestantEntityHomePage.followNominationTask()).toBe('nominations');
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: null,
            confirmed: false
          });
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_GRANT);

          // The document is the one that was loaded at the start.
          await contestantNominationEditor.expectSameDocument();
          await contestantNominationEditor.expectNoDialog();
          expect(await nominationsOf(NEW_CANDIDATE_GRANT)).toEqual([
            {
              externalId: null,
              contest: OPEN_NATION_CONTEST,
              electionSymbol: null,
              confirmed: false,
              parentEntityExternalId: null,
              requestedParent: null
            }
          ]);
        } finally {
          await setNominations(NEW_CANDIDATE_GRANT, 'none');
        }
      }
    );
  });

  test.describe("as the unnominated party's editor", () => {
    test.use({ storageState: NEW_ORGANIZATION_STORAGE_STATE });

    test(
      'nominations-view: a party with no nomination reads the same in its own words',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_ORGANIZATION_GRANT, 'none');

        await contestantNominationsPage.open(NEW_ORGANIZATION_GRANT);
        await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: true });
        await contestantNominationsPage.expectLockedNote(false);
        await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyEditable.organization, 'define');
        await contestantNominationsPage.expectSupportButtons(0);
        await contestantNominationsPage.expectNoEditAction();

        // The main button leads to the election step, which lists the elections a party can stand in with none chosen.
        await contestantNominationsPage.expectButtonText(DEFINE_NOMINATION_LABEL);
        await contestantNominationsPage.pressButton('define');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectElections([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
        await contestantNominationEditor.expectChecked([]);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'nominations-view: no election the party can stand in — the sentence, one support button, Return, and no way into the editor',
      { tag: '@nomination-definition' },
      async ({
        contestantEntityHomePage,
        contestantEntityPages,
        contestantNominationEditor,
        contestantNominationsPage
      }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_ORGANIZATION_GRANT, 'none');
        try {
          for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setElectionType(election, 'candidate_only');

          // A full page load after the types changed: no election admits a party.
          await contestantNominationsPage.open(NEW_ORGANIZATION_GRANT);
          await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: false });
          await contestantNominationsPage.expectLockedNote(false);
          await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyNoElection.organization, 'noElection');
          await contestantNominationsPage.expectSupportButtons(1);
          await contestantNominationsPage.expectNoEditAction();
          await contestantNominationsPage.expectButton('return');

          // The editor's entry address, as a new document, leads back to the view.
          await contestantNominationEditor.open(NEW_ORGANIZATION_GRANT);
          await contestantNominationsPage.expectShown(NEW_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: false });

          // Return leads home, and the home's main action leads to the view again and not round into the editor.
          await contestantNominationsPage.pressButton('return');
          await contestantEntityPages.expectOnHome(NEW_ORGANIZATION_GRANT);
          expect(await contestantEntityHomePage.followMainAction()).toBe('nominations');
          await contestantNominationsPage.expectShown(NEW_ORGANIZATION_GRANT);
          await contestantNominationsPage.expectButton('return');
        } finally {
          for (const election of ELECTIONS_THAT_ADMIT_A_PARTY)
            await setElectionType(election, SEEDED_ELECTION_TYPES[election]);
        }
      }
    );
  });
});

test.describe('contestant-nominations: the parent group under the keyboard, and focus after a navigation', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: NEW_CANDIDATE_STORAGE_STATE });

    test(
      'keys: the parent group is one tab stop, the arrow keys move and choose, and Other chosen by arrow leaves focus on its radio',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        const [firstParty, secondParty] = LISTED_PARTIES;
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_CANDIDATE_GRANT, 'none');
        await candidateToOpenCard(contestantNominationEditor);
        await contestantNominationEditor.expectParentGroup(openCard, {
          shown: true,
          required: true,
          chosen: null,
          options: OPEN_PARTY_OPTIONS
        });

        // With nothing chosen the Tab key stops on one radio of the group, in either direction, and chooses nothing.
        expect(await contestantNominationEditor.parentTabStops(openCard)).toEqual({ forward: 1, backward: 1 });
        expect(await contestantNominationEditor.parentByKeyboard(openCard, [])).toEqual({
          chosen: null,
          focused: firstParty
        });

        // An arrow key moves to the next option and chooses it, and the opposite arrow moves back and chooses that one.
        expect(await contestantNominationEditor.parentByKeyboard(openCard, ['ArrowDown'])).toEqual({
          chosen: secondParty,
          focused: secondParty
        });
        expect(await contestantNominationEditor.parentByKeyboard(openCard, ['ArrowUp'])).toEqual({
          chosen: firstParty,
          focused: firstParty
        });

        // "Other" is reached with the arrow keys: it is chosen, its name field is shown, and focus is still on its radio.
        expect(await contestantNominationEditor.parentByKeyboard(openCard, ARROWS_FROM_FIRST_PARTY_TO_OTHER)).toEqual({
          chosen: OTHER_PARTY_OPTION,
          focused: OTHER_PARTY_OPTION
        });
        await contestantNominationEditor.expectOtherName(openCard, '');

        // The group is one tab stop with an option chosen too, and the name field is the stop after it.
        expect(await contestantNominationEditor.parentTabStops(openCard)).toEqual({ forward: 1, backward: 1 });
        expect(await contestantNominationEditor.parentByKeyboard(openCard, ['Tab'])).toEqual({
          chosen: OTHER_PARTY_OPTION,
          focused: 'otherName'
        });
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      "focus: the heading of each step takes focus after the navigation that opens it, a skip included, and the nominations view's after Cancel",
      { tag: '@nomination-definition' },
      async ({
        contestantEntityHomePage,
        contestantEntityPages,
        contestantNominationEditor,
        contestantNominationsPage
      }) => {
        await setNominationsLocked(false);
        await setAnswersLocked(false);
        await setNominations(NEW_CANDIDATE_GRANT, 'none');

        // From the home through every step: each navigation inside the application leaves focus on the heading of the step it opens.
        await contestantEntityPages.openHome(NEW_CANDIDATE_GRANT);
        await contestantEntityPages.expectOnHome(NEW_CANDIDATE_GRANT);
        expect(await contestantEntityHomePage.followNominationTask()).toBe('nominationElections');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectFocusOn({ on: 'heading' });
        await contestantNominationEditor.setElection(LIST_ELECTION_NAME.en, true);
        await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, true);
        await contestantNominationEditor.continueFromElections();
        await contestantNominationEditor.expectStep('constituencies');
        await contestantNominationEditor.expectFocusOn({ on: 'heading' });
        await contestantNominationEditor.chooseConstituency(NORTH_CONSTITUENCY_NAME.en);
        await contestantNominationEditor.continueFromConstituencies();
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectCards([NEW_LIST_CARD, NEW_OPEN_CARD]);
        await contestantNominationEditor.expectFocusOn({ on: 'heading' });

        // Cancel leads to the nominations view, with focus on its heading.
        await contestantNominationEditor.cancel();
        await contestantNominationsPage.expectShown(NEW_CANDIDATE_GRANT);
        await contestantNominationsPage.expectHeadingFocused();

        // From the home again, with the open election alone: it is held in one constituency, so Continue passes over the constituency step and focus is on the heading of the details step.
        await contestantEntityPages.openHome(NEW_CANDIDATE_GRANT);
        await contestantEntityPages.expectOnHome(NEW_CANDIDATE_GRANT);
        expect(await contestantEntityHomePage.followNominationTask()).toBe('nominationElections');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectFocusOn({ on: 'heading' });
        await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, true);
        await contestantNominationEditor.continueFromElections();
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectCards([NEW_OPEN_CARD]);
        await contestantNominationEditor.expectFocusOn({ on: 'heading' });
        await contestantNominationEditor.expectNoDialog();
      }
    );
  });
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setNominations(NEW_CANDIDATE_GRANT, 'none');
      await contestantNominationEditor.open(NEW_CANDIDATE_GRANT);
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setNominations(NEW_CANDIDATE_GRANT, 'none');
      await contestantNominationEditor.open(NEW_CANDIDATE_GRANT);
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setAnswers(NEW_CANDIDATE_GRANT, NOTHING_ANSWERED);
      await setNominations(NEW_CANDIDATE_GRANT, 'none');
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setAnswers(NEW_CANDIDATE_GRANT, NOTHING_ANSWERED);
      await setNominations(NEW_CANDIDATE_GRANT, 'none');
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setAnswers(EDIT_ORGANIZATION_GRANT, NOTHING_ANSWERED);
      await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
      await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_GRANT);
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setAnswers(EDIT_ORGANIZATION_GRANT, NOTHING_ANSWERED);
      await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
      await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_GRANT);
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setAnswers(EDIT_ORGANIZATION_GRANT, NOTHING_ANSWERED);
      await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
      // A candidate is listed under the party's nomination in the closed-list election.
      await setNominations(CHILD_CANDIDATE, 'seeded');
      await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_GRANT);
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
      for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setElectionType(election, 'candidate_only');
      // A full page load: an election's type is read when a page is loaded.
      await contestantNominationsPage.open(EDIT_ORGANIZATION_GRANT);
      await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_GRANT);
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
      await setNominationsLocked(false);
      await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
      await setAnswersLocked(true);
      // A full page load: the lock is a setting, read when a page is loaded.
      await contestantNominationsPage.open(EDIT_CANDIDATE_GRANT);
      await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
      await addNomination(EDIT_CANDIDATE_GRANT, OPEN_NATION_CONTEST, {
        externalId: EDIT_CANDIDATE_TYPED_PARTY_NOMINATION_EXTERNAL_ID,
        parent: { kind: 'other', name: TYPED_PARTY_NAME }
      });
      await contestantNominationsPage.open(EDIT_CANDIDATE_GRANT);
      await contestantNominationsPage.expectShown(EDIT_CANDIDATE_GRANT);
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setAnswers(EDIT_CANDIDATE_GRANT, EVERYTHING_ANSWERED);
      await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
      await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setAnswers(EDIT_CANDIDATE_GRANT, NOTHING_ANSWERED);
      await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
      await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
      await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
      await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
      // While the editor is open, an administrator removes the nomination the card was built on.
      await setNominations(EDIT_CANDIDATE_GRANT, 'none');
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
      await setNominationsLocked(false);
      await setAnswersLocked(false);
      await setNominations(NEW_ORGANIZATION_GRANT, 'none');
      for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setElectionType(election, 'candidate_only');
      // A full page load: an election's type is read when a page is loaded.
      await contestantNominationsPage.open(NEW_ORGANIZATION_GRANT);
      await contestantNominationsPage.expectShown(NEW_ORGANIZATION_GRANT);
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
    test.use({ storageState: NEW_CANDIDATE_STORAGE_STATE });

    test.afterEach(async () => {
      await restoreAfterScan(NEW_CANDIDATE_GRANT, 'none');
    });

    for (const entry of NEW_CANDIDATE_SCANS) {
      declareScans(entry);
    }
  });

  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_STORAGE_STATE });

    test.afterEach(async () => {
      await restoreAfterScan(EDIT_ORGANIZATION_GRANT, 'seeded');
    });

    for (const entry of EDIT_ORGANIZATION_SCANS) {
      declareScans(entry);
    }
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: EDIT_CANDIDATE_STORAGE_STATE });

    test.afterEach(async () => {
      await restoreAfterScan(EDIT_CANDIDATE_GRANT, 'seeded');
    });

    for (const entry of EDIT_CANDIDATE_SCANS) {
      declareScans(entry);
    }
  });

  test.describe("as the unnominated party's editor", () => {
    test.use({ storageState: NEW_ORGANIZATION_STORAGE_STATE });

    test.afterEach(async () => {
      await restoreAfterScan(NEW_ORGANIZATION_GRANT, 'none');
    });

    for (const entry of NEW_ORGANIZATION_SCANS) {
      declareScans(entry);
    }
  });
});

for (const viewport of PHONE_VIEWPORTS) {
  test.describe(`contestant-nominations: at ${viewport.width}px wide`, () => {
    test.use(phoneUse(viewport));

    test.describe("as the unnominated candidate's editor", () => {
      test.use({ storageState: NEW_CANDIDATE_STORAGE_STATE });

      test(
        `phone ${viewport.width}: the election step fits the viewport with a long election name`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationEditor, pageGeometry }) => {
          await setNominationsLocked(false);
          await setAnswersLocked(false);
          await setNominations(NEW_CANDIDATE_GRANT, 'none');
          await contestantNominationEditor.open(NEW_CANDIDATE_GRANT);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectElections(ELECTIONS_THAT_ADMIT_A_CANDIDATE);
          await contestantNominationEditor.expectElectionsHint(true);
          await pageGeometry.expectNoHorizontalOverflow();

          // The page's own width does not show a name that a clipping container holds beyond the viewport's edge: the label's box does.
          const longNamed = await contestantNominationEditor.electionLabelBoxOf(LIST_ELECTION_NAME.en);
          await pageGeometry.expectWithinViewportWidth(longNamed, 'the label of the long-named election');
          await pageGeometry.expectShowsWholeText(longNamed, 'the label of the long-named election');

          // The checkbox beside the long name can be reached and checked, and Continue can then be pressed.
          await contestantNominationEditor.setElection(LIST_ELECTION_NAME.en, true);
          await contestantNominationEditor.expectElectionsHint(false);
          await contestantNominationEditor.expectElectionsContinue(true);
          await pageGeometry.expectNoHorizontalOverflow();
        }
      );

      test(
        `phone ${viewport.width}: the constituency step fits the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationEditor, pageGeometry }) => {
          await setNominationsLocked(false);
          await setAnswersLocked(false);
          await setNominations(NEW_CANDIDATE_GRANT, 'none');

          // The step's own address, as a new document, with both elections chosen.
          await contestantNominationEditor.openStep(NEW_CANDIDATE_GRANT, 'constituencies', NEW_CARDS_ELECTIONS);
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.expectConstituencyPickers([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.expectConstituenciesContinue(false);
          await pageGeometry.expectNoHorizontalOverflow();

          // With a constituency chosen the picker shows its name, and Continue can be pressed.
          await contestantNominationEditor.chooseConstituency(NORTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.expectConstituenciesContinue(true);
          await pageGeometry.expectNoHorizontalOverflow();
        }
      );

      test(
        `phone ${viewport.width}: new cards fit the viewport, and each option row, the name field and the symbol field lie inside their card`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationEditor, pageGeometry }) => {
          const listCard = { election: LIST_ELECTION_NAME.en };
          const openCard = { election: OPEN_ELECTION_NAME.en };
          await setNominationsLocked(false);
          await setAnswersLocked(false);
          await setNominations(NEW_CANDIDATE_GRANT, 'none');

          // The step's own address, as a new document, with both elections and the northern region chosen.
          await contestantNominationEditor.openStep(NEW_CANDIDATE_GRANT, 'details', NEW_CARDS_SELECTION);
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([NEW_LIST_CARD, NEW_OPEN_CARD]);
          await contestantNominationEditor.expectParentHint(listCard, LONG_ORGANIZATION_NAME.en, true);
          await contestantNominationEditor.chooseParent(listCard, 'other');
          await contestantNominationEditor.expectOtherName(listCard, '');

          // The card with "Other" chosen: every option row, the name field and the symbol field lie inside it, and the long-named party is shown whole.
          const list = await contestantNominationEditor.boxesOf(listCard);
          await expectPartsInsideCard(pageGeometry, list, 'the closed-list card', LIST_PARTY_OPTIONS.length);
          await pageGeometry.expectInside(
            rendered(list.otherName, 'name field'),
            list.card,
            'the name field of the closed-list card'
          );
          const longNamed = await contestantNominationEditor.parentNameBoxOf(listCard, LONG_ORGANIZATION_NAME.en);
          await pageGeometry.expectShowsWholeText(longNamed, 'the name of the long-named party');
          await pageGeometry.expectInside(longNamed, list.card, 'the name of the long-named party');

          // The card with nothing chosen.
          const open = await contestantNominationEditor.boxesOf(openCard);
          await expectPartsInsideCard(pageGeometry, open, 'the open card', OPEN_PARTY_OPTIONS.length);
          await pageGeometry.expectNoHorizontalOverflow();

          // After a failed check both cards are in error and the page says so above its main button.
          await contestantNominationEditor.submit();
          await contestantNominationEditor.expectSaveMessage('invalid');
          await contestantNominationEditor.expectError(listCard, 'otherName');
          await contestantNominationEditor.expectError(openCard, 'parent');
          const listInError = await contestantNominationEditor.boxesOf(listCard);
          await pageGeometry.expectInside(
            rendered(listInError.otherName, 'name field'),
            listInError.card,
            'the name field in error'
          );
          await pageGeometry.expectNoHorizontalOverflow();
          await contestantNominationEditor.expectNoDialog();
        }
      );

      test(
        `phone ${viewport.width}: the nominations view with "Define your nomination" fits the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationsPage }) => {
          await setNominationsLocked(false);
          await setAnswersLocked(false);
          await setNominations(NEW_CANDIDATE_GRANT, 'none');
          await contestantNominationsPage.open(NEW_CANDIDATE_GRANT);
          await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: true });
          await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyEditable.candidate, 'define');
          await contestantNominationsPage.expectButton('define');
          await contestantNominationsPage.expectButtonText(DEFINE_NOMINATION_LABEL);
          await contestantNominationsPage.expectFitsViewport();
        }
      );

      test(
        `phone ${viewport.width}: a symbol and a typed name at their limits are stored whole and shown in full on the nominations view`,
        { tag: '@nomination-definition' },
        async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage, pageGeometry }) => {
          const openCard = { election: OPEN_ELECTION_NAME.en };
          await setNominationsLocked(false);
          await setAnswersLocked(false);
          await setAnswers(NEW_CANDIDATE_GRANT, NOTHING_ANSWERED);
          await setNominations(NEW_CANDIDATE_GRANT, 'none');
          try {
            // The step's own address, as a new document, with the open election chosen.
            await contestantNominationEditor.openStep(NEW_CANDIDATE_GRANT, 'details', OPEN_CARD_SELECTION);
            await contestantNominationEditor.expectStep('details');
            await contestantNominationEditor.expectCards([NEW_OPEN_CARD]);
            await contestantNominationEditor.chooseParent(openCard, 'other');

            // More is typed than either field takes: each holds its limit and no more, and lies inside the card with it.
            await contestantNominationEditor.keyOtherName(openCard, OVERLONG_PARTY_NAME);
            await contestantNominationEditor.expectOtherName(openCard, PARTY_NAME_AT_LIMIT);
            await contestantNominationEditor.keySymbol(openCard, OVERLONG_SYMBOL);
            await contestantNominationEditor.expectSymbol(openCard, SYMBOL_AT_LIMIT);
            const filled = await contestantNominationEditor.boxesOf(openCard);
            await pageGeometry.expectInside(
              rendered(filled.symbol, 'symbol field'),
              filled.card,
              'the symbol field at its limit'
            );
            await pageGeometry.expectInside(
              rendered(filled.otherName, 'name field'),
              filled.card,
              'the name field at its limit'
            );
            await pageGeometry.expectNoHorizontalOverflow();

            // Continue stores both as the fields held them.
            await contestantNominationEditor.submit();
            await contestantNominationsPage.expectShown(NEW_CANDIDATE_GRANT);
            await contestantNominationEditor.expectNoStep();
            await contestantNominationsPage.pressButton('continue');
            await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_GRANT);
            expect(await nominationsOf(NEW_CANDIDATE_GRANT)).toEqual([
              {
                externalId: null,
                contest: OPEN_NATION_CONTEST,
                electionSymbol: SYMBOL_AT_LIMIT,
                confirmed: false,
                parentEntityExternalId: null,
                requestedParent: PARTY_NAME_AT_LIMIT
              }
            ]);

            // The nominations view, as a new document, shows both whole: neither has a place to break a line at, and each stays inside its card.
            await contestantNominationsPage.open(NEW_CANDIDATE_GRANT);
            await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
            await contestantNominationsPage.expectCardCount(1);
            await contestantNominationsPage.expectCardOf({
              election: OPEN_ELECTION_NAME.en,
              constituency: NATION_CONSTITUENCY_NAME.en,
              symbol: SYMBOL_AT_LIMIT,
              parent: null,
              confirmed: false,
              requestedParent: PARTY_NAME_AT_LIMIT
            });
            await contestantNominationsPage.expectCardValuesInsideCard(0);
            await contestantNominationsPage.expectFitsViewport();
            await contestantNominationEditor.expectNoDialog();
          } finally {
            await clearWrittenNominations();
            await setNominations(NEW_CANDIDATE_GRANT, 'none');
          }
        }
      );
    });

    test.describe("as the nominated party's editor", () => {
      test.use({ storageState: EDIT_ORGANIZATION_STORAGE_STATE });

      test(
        `phone ${viewport.width}: an existing card and a removed card fit the viewport, with Remove and Keep inside their card, and so does the message of a refused removal`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationEditor, pageGeometry }) => {
          const listCard = { election: LIST_ELECTION_NAME.en };
          const openCard = { election: OPEN_ELECTION_NAME.en };
          await setNominationsLocked(false);
          await setAnswersLocked(false);
          await setAnswers(EDIT_ORGANIZATION_GRANT, NOTHING_ANSWERED);
          await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
          // A candidate is listed under the party's nomination in the closed-list election.
          await setNominations(CHILD_CANDIDATE, 'seeded');
          await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_GRANT);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.expectChangeSelection(true);

          // A kept card: its option rows, its filled symbol field and Remove lie inside it.
          const kept = await contestantNominationEditor.boxesOf(openCard);
          await expectPartsInsideCard(pageGeometry, kept, 'the kept card', ALLIANCE_OPTIONS.length);
          await pageGeometry.expectInside(rendered(kept.remove, 'Remove'), kept.card, 'Remove of the kept card');
          await pageGeometry.expectNoHorizontalOverflow();

          // A removed card: Keep lies inside it, under the line that says the nomination will be removed.
          await contestantNominationEditor.remove(listCard);
          await contestantNominationEditor.expectNotes(listCard, REMOVED_NOTES);
          const removed = await contestantNominationEditor.boxesOf(listCard);
          await pageGeometry.expectInside(rendered(removed.keep, 'Keep'), removed.card, 'Keep of the removed card');
          await pageGeometry.expectNoHorizontalOverflow();

          // The database refuses the removal, and the page says why above its main button.
          await contestantNominationEditor.submit();
          await contestantNominationEditor.expectSaveMessage('hasCandidates');
          await contestantNominationEditor.expectStep('details');
          await pageGeometry.expectNoHorizontalOverflow();
          await contestantNominationEditor.expectNoDialog();
        }
      );

      test(
        `phone ${viewport.width}: the nominations view with Return fits the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationsPage }) => {
          await setNominationsLocked(false);
          await setAnswersLocked(false);
          await setAnswers(EDIT_ORGANIZATION_GRANT, NOTHING_ANSWERED);
          await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
          await contestantNominationsPage.open(EDIT_ORGANIZATION_GRANT);
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
          await contestantNominationsPage.expectDescription(VIEW_SENTENCE.listedEditable.organization);
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectReturnAction();
          await contestantNominationsPage.expectCardValuesInsideCard(0);
          await contestantNominationsPage.expectCardValuesInsideCard(1);
          await contestantNominationsPage.expectFitsViewport();
        }
      );

      test(
        `phone ${viewport.width}: nominations listed while no election admits a party fit the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationsPage }) => {
          await setNominationsLocked(false);
          await setAnswersLocked(false);
          await setNominations(EDIT_ORGANIZATION_GRANT, 'seeded');
          try {
            for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setElectionType(election, 'candidate_only');

            // A full page load after the types changed.
            await contestantNominationsPage.open(EDIT_ORGANIZATION_GRANT);
            await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: false });
            await contestantNominationsPage.expectDescription(VIEW_SENTENCE.listed.organization);
            await contestantNominationsPage.expectCardCount(2);
            await contestantNominationsPage.expectNoEditAction();
            await contestantNominationsPage.expectFitsViewport();
          } finally {
            for (const election of ELECTIONS_THAT_ADMIT_A_PARTY)
              await setElectionType(election, SEEDED_ELECTION_TYPES[election]);
          }
        }
      );
    });

    test.describe("as the nominated candidate's editor", () => {
      test.use({ storageState: EDIT_CANDIDATE_STORAGE_STATE });

      test(
        `phone ${viewport.width}: the nominations view under the answers lock fits the viewport, and its note holds the support button`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationsPage, notEditableNote }) => {
          await setNominationsLocked(false);
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
          try {
            await setAnswersLocked(true);

            // A full page load: the lock is a setting, read when a page is loaded.
            await contestantNominationsPage.open(EDIT_CANDIDATE_GRANT);
            await contestantNominationsPage.expectState({ state: 'listed', locked: true, editable: false });
            await contestantNominationsPage.expectLockedNote(true, 'nominationsAnswersLocked');
            await contestantNominationsPage.expectCardCount(1);
            await contestantNominationsPage.expectCardValuesInsideCard(0);
            await notEditableNote.expectSupportButtonInsideNote();
            await contestantNominationsPage.expectFitsViewport();
          } finally {
            await setAnswersLocked(false);
          }
        }
      );

      test(
        `phone ${viewport.width}: the message that the nominations were changed elsewhere fits the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationEditor, pageGeometry }) => {
          const listCard = { election: LIST_ELECTION_NAME.en };
          await setNominationsLocked(false);
          await setAnswersLocked(false);
          await setAnswers(EDIT_CANDIDATE_GRANT, NOTHING_ANSWERED);
          await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
          try {
            await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_GRANT);
            await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);

            // A kept card of a candidate: its party's row is the chosen one, and every row lies inside the card.
            const kept = await contestantNominationEditor.boxesOf(listCard);
            await expectPartsInsideCard(pageGeometry, kept, "the candidate's kept card", LIST_PARTY_OPTIONS.length);
            await pageGeometry.expectNoHorizontalOverflow();

            // While the editor is open, an administrator removes the nomination the card was built on. The save is not stored, and the page says so above its main button.
            await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
            await setNominations(EDIT_CANDIDATE_GRANT, 'none');
            await contestantNominationEditor.submit();
            await contestantNominationEditor.expectSaveMessage('changed');
            await contestantNominationEditor.expectCards([
              { ...EDIT_CANDIDATE_LIST_CARD, state: 'new', confirmed: false }
            ]);
            await pageGeometry.expectNoHorizontalOverflow();
            await contestantNominationEditor.expectNoDialog();
          } finally {
            await setNominations(EDIT_CANDIDATE_GRANT, 'seeded');
          }
        }
      );
    });

    test.describe("as the unnominated party's editor", () => {
      test.use({ storageState: NEW_ORGANIZATION_STORAGE_STATE });

      test(
        `phone ${viewport.width}: the nominations view with no election to stand in fits the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationsPage }) => {
          await setNominationsLocked(false);
          await setAnswersLocked(false);
          await setNominations(NEW_ORGANIZATION_GRANT, 'none');
          try {
            for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setElectionType(election, 'candidate_only');

            // A full page load after the types changed.
            await contestantNominationsPage.open(NEW_ORGANIZATION_GRANT);
            await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: false });
            await contestantNominationsPage.expectEmptySentence(
              VIEW_SENTENCE.emptyNoElection.organization,
              'noElection'
            );
            await contestantNominationsPage.expectSupportButtons(1);
            await contestantNominationsPage.expectFitsViewport();
          } finally {
            for (const election of ELECTIONS_THAT_ADMIT_A_PARTY)
              await setElectionType(election, SEEDED_ELECTION_TYPES[election]);
          }
        }
      );
    });
  });
}
