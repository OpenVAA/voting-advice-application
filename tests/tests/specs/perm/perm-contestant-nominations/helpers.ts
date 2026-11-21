/**
 * @file helpers.ts — the walks, cards and constants the specs of `perm-contestant-nominations/` share.
 *
 * The specs of this folder are the `perm-contestant-nominations` project, one spec for each surface: the editor of a candidate and of a party on the entity's nominations in the Contestant App, against the `perm-contestant-nominations` dataset (seeded by the data-setup-perm-contestant-nominations project): three elections of three nomination shapes, a candidate and a party with no nomination row, a candidate and a party with nominations, and the parties and alliances a nomination can stand under.
 *
 * Sessions: the specs run under stored sessions, each selected by a describe — the editor of the unnominated candidate, of the unnominated party, of the nominated candidate and of the nominated party. All four sessions are this dataset's own: its setup writes them and nothing else reads them, so a test may edit and save under them. No test reads a session of the base dataset.
 *
 * Order and state: the project runs one spec at a time in one worker, and each spec's tests in file order; no test depends on a test before it. Every test begins with the state steps that write, with the service role as an administrator would, the state it reads: the entity's nominations, a lock, an election's nomination shape, whether a party is confirmed. A page is opened only after its state steps, because the entity's nominations, the elections and the settings are read when a page is loaded. A test that changes a setting of the project, an election's nomination shape or an entity's confirmation puts the seeded value back in a `finally`. When a spec's tests have run, its `afterAll` removes the nominations the application wrote: the setup of the chain's next link deletes this dataset's rows by prefix before this dataset's own teardown runs, and a row with no external id that stands under a seeded nomination would refuse that delete.
 *
 * Titles carry the prefix of the surface they are about; each spec's own docblock names the prefixes it holds.
 *
 * Rigidity contract: every assertion is hard, with no soft assertion, no try/catch around an assertion and no fallback on an assertion-bearing step. Every element of a page sits behind a fixture: a test body speaks in the steps of `fixtures/contestant/perm-contestant-nominations.ts` and addresses none of its own.
 */

import {
  CANDIDATE_ONLY_ELECTION_NAME,
  COAST_ALLIANCE_NAME,
  CONTESTANT_NOMINATIONS_PREFIX,
  EDIT_CANDIDATE_ELECTION_SYMBOL,
  EDIT_CANDIDATE_NOMINATION_EXTERNAL_ID,
  EDIT_ORGANIZATION_ELECTION_SYMBOL,
  EDIT_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID,
  EDIT_ORGANIZATION_NAME,
  EDIT_ORGANIZATION_OPEN_NOMINATION_EXTERNAL_ID,
  GREEN_ORGANIZATION,
  GREEN_ORGANIZATION_NAME,
  INLAND_ALLIANCE_NAME,
  LIST_ELECTION_EXTERNAL_ID,
  LIST_ELECTION_NAME,
  LIST_NORTH_CONTEST,
  LONG_ORGANIZATION_NAME,
  NATION_CONSTITUENCY_NAME,
  NEW_CANDIDATE_EDITOR,
  NEW_ORGANIZATION_NAME,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_EXTERNAL_ID,
  OPEN_ELECTION_NAME,
  OPEN_NATION_CONTEST,
  OPINION_QUESTION_EXTERNAL_IDS
} from '../../../utils/permContestantNominationsData';
import type { ContestantNominationEditorFixture } from '../../../fixtures/contestant/contestantNominationEditor.fixture';
import type { EntityGrantTarget } from '../../../utils/supabaseAdminClient';

/** A party name as an entity's editor types it, for a party the project does not list. */
export const TYPED_PARTY_NAME = 'A Party the Editor Typed';

/** The nominated candidate's one seeded nomination, as the database holds it. */
export const EDIT_CANDIDATE_SEEDED_NOMINATION = Object.freeze({
  externalId: EDIT_CANDIDATE_NOMINATION_EXTERNAL_ID,
  contest: LIST_NORTH_CONTEST,
  electionSymbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
  confirmed: true,
  parentEntityExternalId: GREEN_ORGANIZATION.externalId,
  requestedParent: null
});

/** The parties a candidate's card lists, in the order of their English names: the confirmed parties of the dataset. */
export const LISTED_PARTIES = Object.freeze(
  [EDIT_ORGANIZATION_NAME.en, GREEN_ORGANIZATION_NAME.en, LONG_ORGANIZATION_NAME.en, NEW_ORGANIZATION_NAME.en].map(
    (name) => Object.freeze({ kind: 'entity' as const, name })
  )
);

/** The option of a candidate's card that names no party, and the option that opens the field for a party that is not listed. */
export const NO_PARTY_OPTION = Object.freeze({ kind: 'none' as const, name: 'Independent / no party' });
export const OTHER_PARTY_OPTION = Object.freeze({ kind: 'other' as const, name: 'Other' });

/** An election symbol a test types over a stored one. */
export const CHANGED_SYMBOL = '88';

/** The nominated party's two seeded nominations, as the database holds them. */
export const EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION = Object.freeze({
  externalId: EDIT_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID,
  contest: LIST_NORTH_CONTEST,
  electionSymbol: null,
  confirmed: true,
  parentEntityExternalId: null,
  requestedParent: null
});
export const EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION = Object.freeze({
  externalId: EDIT_ORGANIZATION_OPEN_NOMINATION_EXTERNAL_ID,
  contest: OPEN_NATION_CONTEST,
  electionSymbol: EDIT_ORGANIZATION_ELECTION_SYMBOL,
  confirmed: true,
  parentEntityExternalId: null,
  requestedParent: null
});

/** External ids of the nominations a test adds as an administrator would. None of them is seeded. */
export const EDIT_ORGANIZATION_SOUTH_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-or-edit-list-south`;
export const EDIT_CANDIDATE_SAME_CONTEST_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-list-north-second`;
export const EDIT_CANDIDATE_OTHER_ROUND_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-open-round-2`;
export const EDIT_CANDIDATE_CLOSED_ELECTION_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-cand`;

export const EDIT_CANDIDATE_TYPED_PARTY_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-open-typed`;
export const EDIT_CANDIDATE_OPEN_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-open`;

/** The symbol of the nomination a test adds for the nominated party in the closed-list election's southern region. */
export const SOUTH_NOMINATION_SYMBOL = '9';

/** The alliances a party's card lists, in the order of their English names: every alliance of the dataset, confirmed or not. */
export const LISTED_ALLIANCES = Object.freeze(
  [COAST_ALLIANCE_NAME.en, INLAND_ALLIANCE_NAME.en].map((name) => Object.freeze({ kind: 'entity' as const, name }))
);

/** The option of a party's card that names no alliance, and the option that opens the field for an alliance that is not listed. */
export const NO_ALLIANCE_OPTION = Object.freeze({ kind: 'none' as const, name: 'None' });
export const OTHER_ALLIANCE_OPTION = Object.freeze({ kind: 'other' as const, name: 'Other' });

/** The lines of a card whose nomination is confirmed and kept where it is, and of one that is not confirmed. */
export const CONFIRMED_KEPT_NOTES = Object.freeze({
  confirmed: true,
  new: false,
  removed: false,
  previousConstituency: null
});
export const PENDING_KEPT_NOTES = Object.freeze({
  confirmed: false,
  new: false,
  removed: false,
  previousConstituency: null
});

/** The lines of a card that is about to be removed. */
export const REMOVED_NOTES = Object.freeze({ confirmed: false, new: false, removed: true, previousConstituency: null });

/** The card of the nominated candidate's one seeded nomination, kept. */
export const EDIT_CANDIDATE_LIST_CARD = Object.freeze({
  election: LIST_ELECTION_NAME.en,
  constituency: NORTH_CONSTITUENCY_NAME.en,
  state: 'kept' as const,
  confirmed: true,
  moved: false
});

/** The cards of the nominated party's two seeded nominations, each kept. */
export const EDIT_ORGANIZATION_LIST_CARD = Object.freeze({
  election: LIST_ELECTION_NAME.en,
  constituency: NORTH_CONSTITUENCY_NAME.en,
  state: 'kept' as const,
  confirmed: true,
  moved: false
});
export const EDIT_ORGANIZATION_OPEN_CARD = Object.freeze({
  election: OPEN_ELECTION_NAME.en,
  constituency: NATION_CONSTITUENCY_NAME.en,
  state: 'kept' as const,
  confirmed: true,
  moved: false
});

/** The nominated party's two seeded nominations as the nominations view lists them. */
export const EDIT_ORGANIZATION_LIST_VIEW_CARD = Object.freeze({
  election: LIST_ELECTION_NAME.en,
  constituency: NORTH_CONSTITUENCY_NAME.en,
  symbol: null,
  parent: null,
  confirmed: true
});
export const EDIT_ORGANIZATION_OPEN_VIEW_CARD = Object.freeze({
  election: OPEN_ELECTION_NAME.en,
  constituency: NATION_CONSTITUENCY_NAME.en,
  symbol: EDIT_ORGANIZATION_ELECTION_SYMBOL,
  parent: null,
  confirmed: true
});

/** The sentences of the nominations view, as the English catalogue words them: above the nominations it lists, and in place of them. */
export const VIEW_SENTENCE = Object.freeze({
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
export const DEFINE_NOMINATION_LABEL = 'Define your nomination';

/** Both elections that admit a party, each with the nomination shape it is given so that it admits candidates alone. */
export const ELECTIONS_THAT_ADMIT_A_PARTY = [LIST_ELECTION_EXTERNAL_ID, OPEN_ELECTION_EXTERNAL_ID] as const;

/**
 * Load the editor's entry address and go on to the details step, pressing Continue on the election step and on the constituency step with what each shows on arrival.
 * @param editor - The editor's fixture.
 * @param entity - An entity whose stored nominations lead through both steps.
 */
export async function continueToDetails(
  editor: ContestantNominationEditorFixture,
  entity: EntityGrantTarget
): Promise<void> {
  await editor.open(entity);
  await editor.expectStep('elections');
  await editor.continueFromElections();
  await editor.expectStep('constituencies');
  await editor.continueFromConstituencies();
  await editor.expectStep('details');
}

/** Every election that admits a candidate, by name and in the order the election step lists them. */
export const ELECTIONS_THAT_ADMIT_A_CANDIDATE = Object.freeze([
  LIST_ELECTION_NAME.en,
  OPEN_ELECTION_NAME.en,
  CANDIDATE_ONLY_ELECTION_NAME.en
]);

/** The cards of an entity with no nomination that chose the closed-list election in its northern region and the open election. */
export const NEW_LIST_CARD = Object.freeze({
  election: LIST_ELECTION_NAME.en,
  constituency: NORTH_CONSTITUENCY_NAME.en,
  state: 'new' as const,
  confirmed: false,
  moved: false
});
export const NEW_OPEN_CARD = Object.freeze({
  election: OPEN_ELECTION_NAME.en,
  constituency: NATION_CONSTITUENCY_NAME.en,
  state: 'new' as const,
  confirmed: false,
  moved: false
});

/** The options of a candidate's card in the closed-list election, where a party is required, and in the open election, where standing under none is an option and the last one. */
export const LIST_PARTY_OPTIONS = Object.freeze([...LISTED_PARTIES, OTHER_PARTY_OPTION]);
export const OPEN_PARTY_OPTIONS = Object.freeze([...LISTED_PARTIES, OTHER_PARTY_OPTION, NO_PARTY_OPTION]);

/** The options of a party's card. */
export const ALLIANCE_OPTIONS = Object.freeze([...LISTED_ALLIANCES, OTHER_ALLIANCE_OPTION, NO_ALLIANCE_OPTION]);

/** The answers of an entity with its profile and its questions still to do, and of one with nothing left to do. */
export const NOTHING_ANSWERED = Object.freeze({ requiredInfo: false, opinions: [] });
export const EVERYTHING_ANSWERED = Object.freeze({ requiredInfo: true, opinions: OPINION_QUESTION_EXTERNAL_IDS });

/**
 * Load the editor's entry address as the unnominated candidate's editor and go on to the details step with the open election alone chosen. The election is held in one constituency, so Continue passes over the constituency step.
 * @param editor - The editor's fixture.
 */
export async function candidateToOpenCard(editor: ContestantNominationEditorFixture): Promise<void> {
  await editor.open(NEW_CANDIDATE_EDITOR.grant);
  await editor.expectStep('elections');
  await editor.setElection(OPEN_ELECTION_NAME.en, true);
  await editor.continueFromElections();
  await editor.expectStep('details');
  await editor.expectCards([NEW_OPEN_CARD]);
}
