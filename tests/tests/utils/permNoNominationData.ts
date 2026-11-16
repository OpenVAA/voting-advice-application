import path from 'path';
import { TEST_CANDIDATE_PASSWORD } from './testCredentials';
import { TESTS_DIR } from './testsDir';
import type { EntityGrantTarget } from './supabaseAdminClient';

/**
 * The no-nomination dataset as the suite names it: the rows of the `perm-no-nomination` template a test addresses, what they are seeded with, and the three users that edit its entities.
 *
 * The dataset is seeded by `data-setup-perm-no-nomination` and removed by `data-teardown-perm-no-nomination`. It holds a candidate and an organization with no nomination row and a candidate with one, each confirmed and each with one editor of its own. Each editor has accepted the terms of use and edits that one entity alone, so signing in lands on the entity's home. No entity is seeded with an answer.
 *
 * A test gives an unnominated entity a nomination, or takes it away, through a state step. The rows such a step writes carry the external ids of this module, under the dataset's prefix, so the dataset's teardown removes them.
 *
 * The values are literals that repeat `packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts`, so that a change to the template cannot make this module throw at import. A drifted external id fails the setup's registration by name, and a drifted name fails the test that reads it.
 *
 * SECURITY: the emails are local, E2E-only addresses on the `test.openvaa.local` domain, registered against a local Supabase instance alone.
 */

/** The `external_id` prefix of every row of the dataset, and the prefix its teardown deletes. */
export const NO_NOMINATION_PREFIX = 'e2e-perm-no-nomination-';

/** The password of all three editors: the suite's shared test password. */
export const NO_NOMINATION_PASSWORD = TEST_CANDIDATE_PASSWORD;

// ---------------------------------------------------------------------------
// The election and the constituency every nomination of the dataset is in.
// ---------------------------------------------------------------------------

/** `external_id` of the dataset's one election. */
export const ELECTION_EXTERNAL_ID = `${NO_NOMINATION_PREFIX}el-1`;

/** The name the election is seeded with, by locale: the default locale and one other. */
export const ELECTION_NAME = Object.freeze({ en: '[EL-1] Nomination Election', fi: '[EL-1] Ehdokasasetteluvaalit' });

/** `external_id` of the dataset's one constituency. */
export const CONSTITUENCY_EXTERNAL_ID = `${NO_NOMINATION_PREFIX}co-1`;

/** The name the constituency is seeded with, by locale: the default locale and one other. */
export const CONSTITUENCY_NAME = Object.freeze({
  en: '[CO-1] Nomination Constituency',
  fi: '[CO-1] Ehdokasasettelun vaalipiiri'
});

/** The election round of every nomination of the dataset. */
export const NOMINATION_ELECTION_ROUND = 1;

// ---------------------------------------------------------------------------
// The candidate with no nomination row.
// ---------------------------------------------------------------------------

/** `external_id` of the candidate that is seeded with no nomination. */
export const UNNOMINATED_CANDIDATE_EXTERNAL_ID = `${NO_NOMINATION_PREFIX}ca-none`;

/** The first and last name the unnominated candidate is seeded with. */
export const UNNOMINATED_CANDIDATE_NAME = Object.freeze({
  firstName: '[CA-N] Unnominated',
  lastName: 'Candidate'
});

/** The entity the unnominated candidate's editor is registered on. */
export const UNNOMINATED_CANDIDATE_GRANT: EntityGrantTarget = Object.freeze({
  entityType: 'candidate',
  externalId: UNNOMINATED_CANDIDATE_EXTERNAL_ID
});

/** Email of the unnominated candidate's editor. */
export const UNNOMINATED_CANDIDATE_EDITOR_EMAIL = `${UNNOMINATED_CANDIDATE_EXTERNAL_ID}@test.openvaa.local`;

/** Where the session of the unnominated candidate's editor is stored. Written by the dataset's setup and removed by its teardown. */
export const UNNOMINATED_CANDIDATE_STORAGE_STATE = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-no-nomination-candidate-none.json'
);

/** `external_id` of the nomination a state step writes for the unnominated candidate. No such row is seeded. */
export const UNNOMINATED_CANDIDATE_NOMINATION_EXTERNAL_ID = `${NO_NOMINATION_PREFIX}nom-ca-none`;

// ---------------------------------------------------------------------------
// The organization with no nomination row.
// ---------------------------------------------------------------------------

/** `external_id` of the organization that is seeded with no nomination. */
export const UNNOMINATED_ORGANIZATION_EXTERNAL_ID = `${NO_NOMINATION_PREFIX}or-none`;

/** The name the unnominated organization is seeded with, by locale: the default locale and one other. */
export const UNNOMINATED_ORGANIZATION_NAME = Object.freeze({
  en: '[OR-N] Unnominated Party',
  fi: '[OR-N] Ehdokkuudeton puolue'
});

/** The short name the unnominated organization is seeded with, by locale: the default locale alone. */
export const UNNOMINATED_ORGANIZATION_SHORT_NAME = Object.freeze({ en: 'ORN' });

/** The entity the unnominated organization's editor is registered on. */
export const UNNOMINATED_ORGANIZATION_GRANT: EntityGrantTarget = Object.freeze({
  entityType: 'organization',
  externalId: UNNOMINATED_ORGANIZATION_EXTERNAL_ID
});

/** Email of the unnominated organization's editor. */
export const UNNOMINATED_ORGANIZATION_EDITOR_EMAIL = `${UNNOMINATED_ORGANIZATION_EXTERNAL_ID}@test.openvaa.local`;

/** Where the session of the unnominated organization's editor is stored. Written by the dataset's setup and removed by its teardown. */
export const UNNOMINATED_ORGANIZATION_STORAGE_STATE = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-no-nomination-organization-none.json'
);

/** `external_id` of the nomination a state step writes for the unnominated organization. No such row is seeded. */
export const UNNOMINATED_ORGANIZATION_NOMINATION_EXTERNAL_ID = `${NO_NOMINATION_PREFIX}nom-or-none`;

/** The election symbol of a nomination a state step writes for either unnominated entity. */
export const WRITTEN_NOMINATION_ELECTION_SYMBOL = '12';

// ---------------------------------------------------------------------------
// The candidate with one nomination.
// ---------------------------------------------------------------------------

/** `external_id` of the candidate that is seeded with a nomination. */
export const NOMINATED_CANDIDATE_EXTERNAL_ID = `${NO_NOMINATION_PREFIX}ca-nominated`;

/** The first and last name the nominated candidate is seeded with. */
export const NOMINATED_CANDIDATE_NAME = Object.freeze({
  firstName: '[CA-Y] Nominated',
  lastName: 'Candidate'
});

/** The entity the nominated candidate's editor is registered on. */
export const NOMINATED_CANDIDATE_GRANT: EntityGrantTarget = Object.freeze({
  entityType: 'candidate',
  externalId: NOMINATED_CANDIDATE_EXTERNAL_ID
});

/** Email of the nominated candidate's editor. */
export const NOMINATED_CANDIDATE_EDITOR_EMAIL = `${NOMINATED_CANDIDATE_EXTERNAL_ID}@test.openvaa.local`;

/** Where the session of the nominated candidate's editor is stored. Written by the dataset's setup and removed by its teardown. */
export const NOMINATED_CANDIDATE_STORAGE_STATE = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-no-nomination-candidate-nominated.json'
);

/** `external_id` of the nominated candidate's one nomination, which is seeded confirmed. */
export const NOMINATED_CANDIDATE_NOMINATION_EXTERNAL_ID = `${NO_NOMINATION_PREFIX}nom-ca-nominated`;

/** The election symbol the nominated candidate's nomination is seeded with. */
export const SEEDED_NOMINATION_ELECTION_SYMBOL = '7';

// ---------------------------------------------------------------------------
// The questions. None states an entity type, so each is asked of candidates and of organizations.
// ---------------------------------------------------------------------------

/** `external_id` of the required, editable info question. */
export const REQUIRED_INFO_QUESTION_EXTERNAL_ID = `${NO_NOMINATION_PREFIX}qu-info-req`;

/** The text the required info question is shown with in the default locale. */
export const REQUIRED_INFO_QUESTION_LABEL = '[QU-INFO-REQ] Describe your campaign';

/** `external_id`s of the two opinion questions, in their order. Each is answered on a five-step scale and admits no open comment. */
export const OPINION_QUESTION_EXTERNAL_IDS: ReadonlyArray<string> = Object.freeze([
  `${NO_NOMINATION_PREFIX}qu-opin-1`,
  `${NO_NOMINATION_PREFIX}qu-opin-2`
]);

/** The texts the two opinion questions are shown with in the default locale, in the order of their `external_id`s. */
export const OPINION_QUESTION_LABELS: ReadonlyArray<string> = Object.freeze([
  '[QU-OPIN-1] No-nomination opinion 1.',
  '[QU-OPIN-2] No-nomination opinion 2.'
]);
