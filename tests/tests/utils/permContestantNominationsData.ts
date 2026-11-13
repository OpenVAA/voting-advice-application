import path from 'path';
import { TEST_CANDIDATE_PASSWORD } from './testCredentials';
import { TESTS_DIR } from './testsDir';
import type { EntityGrantTarget } from './supabaseAdminClient';

/**
 * The contestant-nominations dataset as the suite names it: the rows of the `perm-contestant-nominations` template a test addresses, what they are seeded with, and the four users that edit its entities.
 *
 * The dataset is seeded by `data-setup-perm-contestant-nominations` and removed by `data-teardown-perm-contestant-nominations`. It holds three elections of three types, a candidate and a party with no nomination row, a candidate and a party with nominations, and parties and alliances a nomination can name as its parent. Each of the four editors has accepted the terms of use and edits one entity alone, so signing in lands on the entity's home. No entity is seeded with an answer.
 *
 * A test writes the state it reads through a state step. A nomination such a step writes carries an external id under the dataset's prefix; a nomination the application writes carries none, and a state step removes it.
 *
 * The values are literals that repeat `packages/dev-seed/src/templates/e2e/perm/perm-contestant-nominations.ts`, so that a change to the template cannot make this module throw at import. A drifted external id fails the setup's registration by name, and a drifted name fails the test that reads it.
 *
 * SECURITY: the emails are local, E2E-only addresses on the `test.openvaa.local` domain, registered against a local Supabase instance alone.
 */

/** The `external_id` prefix of every row of the dataset, and the prefix its teardown deletes. */
export const CONTESTANT_NOMINATIONS_PREFIX = 'e2e-perm-contestant-nominations-';

/** The password of all four editors: the suite's shared test password. */
export const CONTESTANT_NOMINATIONS_PASSWORD = TEST_CANDIDATE_PASSWORD;

/** An entity of the dataset that can hold a nomination: its type and its `external_id`. */
export interface NominationEntityTarget {
  /** The entity's type. */
  entityType: 'candidate' | 'organization' | 'alliance';
  /** The entity's `external_id`. */
  externalId: string;
}

/** An election of the dataset and one of its constituencies, each by its `external_id`. */
export interface NominationContestTarget {
  /** The election's `external_id`. */
  electionExternalId: string;
  /** The constituency's `external_id`. */
  constituencyExternalId: string;
}

/** The type of an election, as the database names it. */
export type ElectionTypeName =
  'candidate_only' | 'organization_list' | 'organization_list_and_independents' | 'organization_only';

/** The election round of every nomination of the dataset. */
export const NOMINATION_ELECTION_ROUND = 1;

// ---------------------------------------------------------------------------
// The three elections, each of its own type.
// ---------------------------------------------------------------------------

/** `external_id` of the closed-list election, in which a candidate stands under a party. It is held over the two regions. */
export const LIST_ELECTION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}el-list`;

/** The name the closed-list election is seeded with, by locale. The English name is longer than a 320 px viewport is wide. */
export const LIST_ELECTION_NAME = Object.freeze({
  en: '[EL-LIST] Regional Assembly Election of the Northern and Southern Regions for Party Lists',
  fi: '[EL-LIST] Aluevaalit'
});

/** `external_id` of the election that admits every entity type with or without a parent. It is held over the whole country. */
export const OPEN_ELECTION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}el-open`;

/** The name the open election is seeded with, by locale. */
export const OPEN_ELECTION_NAME = Object.freeze({
  en: '[EL-OPEN] National Election',
  fi: '[EL-OPEN] Valtakunnalliset vaalit'
});

/** `external_id` of the election that admits candidates alone. It is held over the whole country. */
export const CANDIDATE_ONLY_ELECTION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}el-cand`;

/** The name the candidates-only election is seeded with, by locale. */
export const CANDIDATE_ONLY_ELECTION_NAME = Object.freeze({
  en: '[EL-CAND] Presidential Election',
  fi: '[EL-CAND] Presidentinvaalit'
});

/** The type each election is seeded with, by the election's `external_id`. */
export const SEEDED_ELECTION_TYPES: Readonly<Record<string, ElectionTypeName>> = Object.freeze({
  [LIST_ELECTION_EXTERNAL_ID]: 'organization_list',
  [OPEN_ELECTION_EXTERNAL_ID]: 'organization_list_and_independents',
  [CANDIDATE_ONLY_ELECTION_EXTERNAL_ID]: 'candidate_only'
});

// ---------------------------------------------------------------------------
// The three constituencies, and the four pairs of an election and a constituency.
// ---------------------------------------------------------------------------

/** `external_id` of the northern region, a constituency of the closed-list election. */
export const NORTH_CONSTITUENCY_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}co-north`;

/** The name the northern region is seeded with, by locale. */
export const NORTH_CONSTITUENCY_NAME = Object.freeze({
  en: '[CO-NORTH] Northern Region',
  fi: '[CO-NORTH] Pohjoinen alue'
});

/** `external_id` of the southern region, a constituency of the closed-list election. No nomination is seeded in it. */
export const SOUTH_CONSTITUENCY_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}co-south`;

/** The name the southern region is seeded with, by locale. */
export const SOUTH_CONSTITUENCY_NAME = Object.freeze({
  en: '[CO-SOUTH] Southern Region',
  fi: '[CO-SOUTH] Eteläinen alue'
});

/** `external_id` of the whole country, the one constituency of the open election and of the candidates-only election. */
export const NATION_CONSTITUENCY_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}co-nation`;

/** The name the whole country is seeded with, by locale. */
export const NATION_CONSTITUENCY_NAME = Object.freeze({
  en: '[CO-NATION] Whole Country',
  fi: '[CO-NATION] Koko maa'
});

/** The closed-list election in the northern region. */
export const LIST_NORTH_CONTEST: NominationContestTarget = Object.freeze({
  electionExternalId: LIST_ELECTION_EXTERNAL_ID,
  constituencyExternalId: NORTH_CONSTITUENCY_EXTERNAL_ID
});

/** The closed-list election in the southern region, in which no nomination is seeded. */
export const LIST_SOUTH_CONTEST: NominationContestTarget = Object.freeze({
  electionExternalId: LIST_ELECTION_EXTERNAL_ID,
  constituencyExternalId: SOUTH_CONSTITUENCY_EXTERNAL_ID
});

/** The open election in its one constituency. */
export const OPEN_NATION_CONTEST: NominationContestTarget = Object.freeze({
  electionExternalId: OPEN_ELECTION_EXTERNAL_ID,
  constituencyExternalId: NATION_CONSTITUENCY_EXTERNAL_ID
});

/** The candidates-only election in its one constituency, in which no nomination is seeded. */
export const CANDIDATE_ONLY_NATION_CONTEST: NominationContestTarget = Object.freeze({
  electionExternalId: CANDIDATE_ONLY_ELECTION_EXTERNAL_ID,
  constituencyExternalId: NATION_CONSTITUENCY_EXTERNAL_ID
});

// ---------------------------------------------------------------------------
// The candidate with no nomination row, and its editor.
// ---------------------------------------------------------------------------

/** `external_id` of the candidate that is seeded with no nomination. */
export const NEW_CANDIDATE_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}ca-new`;

/** The first and last name the unnominated candidate is seeded with. */
export const NEW_CANDIDATE_NAME = Object.freeze({ firstName: '[CA-NEW] Unnominated', lastName: 'Candidate' });

/** The entity the unnominated candidate's editor is registered on. */
export const NEW_CANDIDATE_GRANT: EntityGrantTarget = Object.freeze({
  entityType: 'candidate',
  externalId: NEW_CANDIDATE_EXTERNAL_ID
});

/** Email of the unnominated candidate's editor. */
export const NEW_CANDIDATE_EDITOR_EMAIL = `${NEW_CANDIDATE_EXTERNAL_ID}@test.openvaa.local`;

/** Where the session of the unnominated candidate's editor is stored. Written by the dataset's setup and removed by its teardown. */
export const NEW_CANDIDATE_STORAGE_STATE = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-contestant-nominations-candidate-new.json'
);

// ---------------------------------------------------------------------------
// The party with no nomination row, and its editor.
// ---------------------------------------------------------------------------

/** `external_id` of the confirmed party that is seeded with no nomination. */
export const NEW_ORGANIZATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}or-new`;

/** The name the unnominated party is seeded with, by locale. */
export const NEW_ORGANIZATION_NAME = Object.freeze({
  en: '[OR-NEW] Unnominated Party',
  fi: '[OR-NEW] Ehdokkuudeton puolue'
});

/** The entity the unnominated party's editor is registered on. */
export const NEW_ORGANIZATION_GRANT: EntityGrantTarget = Object.freeze({
  entityType: 'organization',
  externalId: NEW_ORGANIZATION_EXTERNAL_ID
});

/** Email of the unnominated party's editor. */
export const NEW_ORGANIZATION_EDITOR_EMAIL = `${NEW_ORGANIZATION_EXTERNAL_ID}@test.openvaa.local`;

/** Where the session of the unnominated party's editor is stored. Written by the dataset's setup and removed by its teardown. */
export const NEW_ORGANIZATION_STORAGE_STATE = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-contestant-nominations-organization-new.json'
);

// ---------------------------------------------------------------------------
// The candidate with a nomination under a party, and its editor.
// ---------------------------------------------------------------------------

/** `external_id` of the candidate that is seeded with one nomination, under the green party's in the closed-list election. */
export const EDIT_CANDIDATE_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}ca-edit`;

/** The first and last name the nominated candidate is seeded with. */
export const EDIT_CANDIDATE_NAME = Object.freeze({ firstName: '[CA-EDIT] Nominated', lastName: 'Candidate' });

/** The entity the nominated candidate's editor is registered on. */
export const EDIT_CANDIDATE_GRANT: EntityGrantTarget = Object.freeze({
  entityType: 'candidate',
  externalId: EDIT_CANDIDATE_EXTERNAL_ID
});

/** Email of the nominated candidate's editor. */
export const EDIT_CANDIDATE_EDITOR_EMAIL = `${EDIT_CANDIDATE_EXTERNAL_ID}@test.openvaa.local`;

/** Where the session of the nominated candidate's editor is stored. Written by the dataset's setup and removed by its teardown. */
export const EDIT_CANDIDATE_STORAGE_STATE = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-contestant-nominations-candidate-edit.json'
);

/** `external_id` of the nominated candidate's one seeded nomination. */
export const EDIT_CANDIDATE_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-list-north`;

/** The election symbol the nominated candidate's nomination is seeded with. */
export const EDIT_CANDIDATE_ELECTION_SYMBOL = '34';

/** `external_id` of the nomination a state step writes for the nominated candidate in the closed-list election's southern region: its second in that election. No such row is seeded. */
export const EDIT_CANDIDATE_SECOND_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-edit-list-south`;

// ---------------------------------------------------------------------------
// The party with two nominations, and its editor.
// ---------------------------------------------------------------------------

/** `external_id` of the confirmed party that is seeded with two nominations, one of them with a candidate listed under it. */
export const EDIT_ORGANIZATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}or-edit`;

/** The name the nominated party is seeded with, by locale. */
export const EDIT_ORGANIZATION_NAME = Object.freeze({
  en: '[OR-EDIT] Nominated Party',
  fi: '[OR-EDIT] Ehdolla oleva puolue'
});

/** The entity the nominated party's editor is registered on. */
export const EDIT_ORGANIZATION_GRANT: EntityGrantTarget = Object.freeze({
  entityType: 'organization',
  externalId: EDIT_ORGANIZATION_EXTERNAL_ID
});

/** Email of the nominated party's editor. */
export const EDIT_ORGANIZATION_EDITOR_EMAIL = `${EDIT_ORGANIZATION_EXTERNAL_ID}@test.openvaa.local`;

/** Where the session of the nominated party's editor is stored. Written by the dataset's setup and removed by its teardown. */
export const EDIT_ORGANIZATION_STORAGE_STATE = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-contestant-nominations-organization-edit.json'
);

/** `external_id` of the nominated party's nomination in the open election, which is seeded with an election symbol. */
export const EDIT_ORGANIZATION_OPEN_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-or-edit-open`;

/** The election symbol the nominated party's nomination in the open election is seeded with. */
export const EDIT_ORGANIZATION_ELECTION_SYMBOL = '21';

/** `external_id` of the nominated party's nomination in the closed-list election, under which the listed candidate stands. */
export const EDIT_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-or-edit-list-north`;

// ---------------------------------------------------------------------------
// The entities no user edits: the parents a nomination can name, and the candidate listed under a party.
// ---------------------------------------------------------------------------

/** The confirmed party nominated in the closed-list election's northern region and in the open election, and at no other pair. */
export const GREEN_ORGANIZATION: NominationEntityTarget = Object.freeze({
  entityType: 'organization',
  externalId: `${CONTESTANT_NOMINATIONS_PREFIX}or-green`
});

/** The name the green party is seeded with, by locale. */
export const GREEN_ORGANIZATION_NAME = Object.freeze({ en: '[OR-GREEN] Green Party', fi: '[OR-GREEN] Vihreä puolue' });

/** `external_id` of the green party's nomination in the closed-list election, under which the nominated candidate stands. */
export const GREEN_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-or-green-list-north`;

/** `external_id` of the green party's nomination in the open election. */
export const GREEN_ORGANIZATION_OPEN_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-or-green-open`;

/** The confirmed party with no nomination, whose name is longer than a 320 px viewport is wide. */
export const LONG_ORGANIZATION: NominationEntityTarget = Object.freeze({
  entityType: 'organization',
  externalId: `${CONTESTANT_NOMINATIONS_PREFIX}or-long`
});

/** The name the long-named party is seeded with, in the default locale alone. */
export const LONG_ORGANIZATION_NAME = Object.freeze({
  en: '[OR-LONG] Independent Association of Northern and Southern Regional Smallholders and Fishers'
});

/** The party with no nomination that no administrator has confirmed. */
export const PENDING_ORGANIZATION: NominationEntityTarget = Object.freeze({
  entityType: 'organization',
  externalId: `${CONTESTANT_NOMINATIONS_PREFIX}or-pending`
});

/** The name the unconfirmed party is seeded with, in the default locale alone. */
export const PENDING_ORGANIZATION_NAME = Object.freeze({ en: '[OR-PENDING] Unconfirmed Party' });

/** The confirmed alliance nominated in the open election, and at no other pair. */
export const COAST_ALLIANCE: NominationEntityTarget = Object.freeze({
  entityType: 'alliance',
  externalId: `${CONTESTANT_NOMINATIONS_PREFIX}al-coast`
});

/** The name the coastal alliance is seeded with, by locale. */
export const COAST_ALLIANCE_NAME = Object.freeze({
  en: '[AL-COAST] Coastal Alliance',
  fi: '[AL-COAST] Rannikon liitto'
});

/** `external_id` of the coastal alliance's nomination in the open election. */
export const COAST_ALLIANCE_OPEN_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-al-coast-open`;

/** The alliance with no nomination that no administrator has confirmed. */
export const INLAND_ALLIANCE: NominationEntityTarget = Object.freeze({
  entityType: 'alliance',
  externalId: `${CONTESTANT_NOMINATIONS_PREFIX}al-inland`
});

/** The name the inland alliance is seeded with, in the default locale alone. */
export const INLAND_ALLIANCE_NAME = Object.freeze({ en: '[AL-INLAND] Unconfirmed Inland Alliance' });

/** The candidate with no editor, listed under the nominated party's nomination in the closed-list election. */
export const CHILD_CANDIDATE: NominationEntityTarget = Object.freeze({
  entityType: 'candidate',
  externalId: `${CONTESTANT_NOMINATIONS_PREFIX}ca-child`
});

/** The first and last name the listed candidate is seeded with. */
export const CHILD_CANDIDATE_NAME = Object.freeze({ firstName: '[CA-CHILD] Listed', lastName: 'Candidate' });

/** `external_id` of the listed candidate's nomination, under the nominated party's in the closed-list election. */
export const CHILD_CANDIDATE_NOMINATION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}nom-ca-child-list-north`;

/** The entities of the dataset whose seeded confirmation is `false`, by `external_id`. Every other entity is seeded confirmed. */
export const SEEDED_UNCONFIRMED_ENTITY_EXTERNAL_IDS: ReadonlyArray<string> = Object.freeze([
  PENDING_ORGANIZATION.externalId,
  INLAND_ALLIANCE.externalId
]);

// ---------------------------------------------------------------------------
// The seven seeded nominations. Each is confirmed and states its place in the order; a parent is listed before the nomination that stands under it.
// ---------------------------------------------------------------------------

/** One nomination as the template seeds it. */
export interface SeededNomination {
  /** The nomination's `external_id`. */
  externalId: string;
  /** The entity nominated. */
  entity: NominationEntityTarget;
  /** The election and constituency it is in. */
  contest: NominationContestTarget;
  /** Its place among the nominations of the dataset: an entity's nominations are read in this order. */
  sortOrder: number;
  /** Its election symbol, when it is seeded with one. */
  electionSymbol?: string;
  /** The `external_id` of the nomination it stands under, when it has a parent. */
  parentExternalId?: string;
}

/** Every nomination of the template, in the template's order. */
export const SEEDED_NOMINATIONS: ReadonlyArray<SeededNomination> = Object.freeze([
  {
    externalId: GREEN_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID,
    entity: GREEN_ORGANIZATION,
    contest: LIST_NORTH_CONTEST,
    sortOrder: 0
  },
  {
    externalId: GREEN_ORGANIZATION_OPEN_NOMINATION_EXTERNAL_ID,
    entity: GREEN_ORGANIZATION,
    contest: OPEN_NATION_CONTEST,
    sortOrder: 1
  },
  {
    externalId: COAST_ALLIANCE_OPEN_NOMINATION_EXTERNAL_ID,
    entity: COAST_ALLIANCE,
    contest: OPEN_NATION_CONTEST,
    sortOrder: 2
  },
  {
    externalId: EDIT_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID,
    entity: EDIT_ORGANIZATION_GRANT,
    contest: LIST_NORTH_CONTEST,
    sortOrder: 3
  },
  {
    externalId: EDIT_ORGANIZATION_OPEN_NOMINATION_EXTERNAL_ID,
    entity: EDIT_ORGANIZATION_GRANT,
    contest: OPEN_NATION_CONTEST,
    sortOrder: 4,
    electionSymbol: EDIT_ORGANIZATION_ELECTION_SYMBOL
  },
  {
    externalId: CHILD_CANDIDATE_NOMINATION_EXTERNAL_ID,
    entity: CHILD_CANDIDATE,
    contest: LIST_NORTH_CONTEST,
    sortOrder: 5,
    parentExternalId: EDIT_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID
  },
  {
    externalId: EDIT_CANDIDATE_NOMINATION_EXTERNAL_ID,
    entity: EDIT_CANDIDATE_GRANT,
    contest: LIST_NORTH_CONTEST,
    sortOrder: 6,
    electionSymbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
    parentExternalId: GREEN_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID
  }
]);

/** Every entity of the dataset that can hold a nomination. */
export const NOMINATION_ENTITIES: ReadonlyArray<NominationEntityTarget> = Object.freeze([
  NEW_CANDIDATE_GRANT,
  EDIT_CANDIDATE_GRANT,
  CHILD_CANDIDATE,
  NEW_ORGANIZATION_GRANT,
  EDIT_ORGANIZATION_GRANT,
  GREEN_ORGANIZATION,
  LONG_ORGANIZATION,
  PENDING_ORGANIZATION,
  COAST_ALLIANCE,
  INLAND_ALLIANCE
]);

// ---------------------------------------------------------------------------
// The questions. None states an entity type, so each is asked of candidates and of organizations.
// ---------------------------------------------------------------------------

/** `external_id` of the required, editable info question. */
export const REQUIRED_INFO_QUESTION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}qu-info-req`;

/** The text the required info question is shown with in the default locale. */
export const REQUIRED_INFO_QUESTION_LABEL = '[QU-INFO-REQ] Describe your campaign';

/** `external_id` of the opinion question asked in every election. */
export const SHARED_OPINION_QUESTION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}qu-opin-all`;

/** The text the opinion question asked in every election is shown with in the default locale. */
export const SHARED_OPINION_QUESTION_LABEL = '[QU-OPIN-ALL] Opinion asked in every election.';

/** `external_id` of the opinion question asked in the closed-list election alone. */
export const LIST_OPINION_QUESTION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}qu-opin-list`;

/** The text the closed-list election's opinion question is shown with in the default locale. */
export const LIST_OPINION_QUESTION_LABEL = '[QU-OPIN-LIST] Opinion asked in the regional election.';

/** `external_id` of the opinion question asked in the open election alone. */
export const OPEN_OPINION_QUESTION_EXTERNAL_ID = `${CONTESTANT_NOMINATIONS_PREFIX}qu-opin-open`;

/** The text the open election's opinion question is shown with in the default locale. */
export const OPEN_OPINION_QUESTION_LABEL = '[QU-OPIN-OPEN] Opinion asked in the national election.';

/** `external_id`s of the three opinion questions, in their order. Each is answered on a five-step scale and admits no open comment. */
export const OPINION_QUESTION_EXTERNAL_IDS: ReadonlyArray<string> = Object.freeze([
  SHARED_OPINION_QUESTION_EXTERNAL_ID,
  LIST_OPINION_QUESTION_EXTERNAL_ID,
  OPEN_OPINION_QUESTION_EXTERNAL_ID
]);
