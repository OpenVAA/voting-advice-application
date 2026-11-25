import { permEditor } from '../setup/shared/registerAndStoreSession';
import type { PermEditor } from '../setup/shared/registerAndStoreSession';

/**
 * The organization-editing dataset as the suite names it: the rows of the `perm-organization-editing` template a test addresses, what they are seeded with, and the three users that edit them.
 *
 * The dataset is seeded by `data-setup-perm-organization-editing` and removed by `data-teardown-perm-organization-editing`. It holds one confirmed organization, one unconfirmed organization and one unconfirmed candidate, each with one nomination and one editor of its own. Each editor has accepted the terms of use and edits that one entity alone, so signing in lands on the entity's home.
 *
 * The values are literals that repeat `packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts`, so that a change to the template cannot make this module throw at import. A drifted external id fails the setup's registration by name, and a drifted name fails the test that reads it.
 *
 * SECURITY: the emails are local, E2E-only addresses on the `test.openvaa.local` domain, registered against a local Supabase instance alone.
 */

/** The `external_id` prefix of every row of the dataset, and the prefix its teardown deletes. */
export const ORGANIZATION_EDITING_PREFIX = 'e2e-perm-organization-editing-';

// ---------------------------------------------------------------------------
// The confirmed organization: visible to voters, its two names frozen.
// ---------------------------------------------------------------------------

/** `external_id` of the confirmed organization. */
export const CONFIRMED_ORGANIZATION_EXTERNAL_ID = `${ORGANIZATION_EDITING_PREFIX}or-confirmed`;

/** The name the confirmed organization is seeded with, by locale: the default locale and one other. */
export const CONFIRMED_ORGANIZATION_NAME = Object.freeze({
  en: '[OR-A] Confirmed Party',
  fi: '[OR-A] Vahvistettu puolue'
});

/** The short name the confirmed organization is seeded with, by locale. */
export const CONFIRMED_ORGANIZATION_SHORT_NAME = Object.freeze({
  en: 'ORA',
  fi: 'ORA-FI'
});

/** The confirmed organization's editor: the entity it is registered on, its address and where its session is stored. The session is written by the dataset's setup and removed by its teardown. */
export const CONFIRMED_ORGANIZATION_EDITOR = permEditor(
  'organization',
  CONFIRMED_ORGANIZATION_EXTERNAL_ID,
  'perm-organization-editing-confirmed.json'
);

// ---------------------------------------------------------------------------
// The unconfirmed organization: hidden from voters, its two names editable.
// ---------------------------------------------------------------------------

/** `external_id` of the unconfirmed organization. */
export const UNCONFIRMED_ORGANIZATION_EXTERNAL_ID = `${ORGANIZATION_EDITING_PREFIX}or-unconfirmed`;

/** The name the unconfirmed organization is seeded with, by locale: one locale that is not the default one. It is seeded with no short name. */
export const UNCONFIRMED_ORGANIZATION_NAME = Object.freeze({
  fi: '[OR-B] Vahvistamaton puolue'
});

/** The unconfirmed organization's editor: the entity it is registered on, its address and where its session is stored. The session is written by the dataset's setup and removed by its teardown. */
export const UNCONFIRMED_ORGANIZATION_EDITOR = permEditor(
  'organization',
  UNCONFIRMED_ORGANIZATION_EXTERNAL_ID,
  'perm-organization-editing-unconfirmed.json'
);

// ---------------------------------------------------------------------------
// The questions. Every opinion question is addressed to organizations alone.
// ---------------------------------------------------------------------------

/** `external_id`s of the three opinion questions, in their order. The confirmed organization is seeded with an answer to the first two. */
export const OPINION_QUESTION_EXTERNAL_IDS: ReadonlyArray<string> = Object.freeze([
  `${ORGANIZATION_EDITING_PREFIX}qu-opin-1`,
  `${ORGANIZATION_EDITING_PREFIX}qu-opin-2`,
  `${ORGANIZATION_EDITING_PREFIX}qu-opin-3`
]);

/** `external_id` of the editable info question addressed to organizations. Nobody is seeded with an answer to it. */
export const ORGANIZATION_INFO_QUESTION_EXTERNAL_ID = `${ORGANIZATION_EDITING_PREFIX}qu-info-org`;

/** `external_id` of the info question addressed to organizations that its custom data locks. Nobody answers it. */
export const ORGANIZATION_LOCKED_INFO_QUESTION_EXTERNAL_ID = `${ORGANIZATION_EDITING_PREFIX}qu-info-org-locked`;

/** `external_id` of the editable info question addressed to candidates. An organization is not asked it. */
export const CANDIDATE_INFO_QUESTION_EXTERNAL_ID = `${ORGANIZATION_EDITING_PREFIX}qu-info-cand`;

// ---------------------------------------------------------------------------
// The unconfirmed candidate: hidden from voters, its names editable, and with no opinion question to answer. One block: nothing above depends on it.
// ---------------------------------------------------------------------------

/** `external_id` of the unconfirmed candidate. */
export const UNCONFIRMED_CANDIDATE_EXTERNAL_ID = `${ORGANIZATION_EDITING_PREFIX}ca-unconfirmed`;

/** The first and last name the unconfirmed candidate is seeded with. */
export const UNCONFIRMED_CANDIDATE_NAME = Object.freeze({
  firstName: '[CA-U] Unconfirmed',
  lastName: 'Candidate'
});

/** The unconfirmed candidate's editor: the entity it is registered on, its address and where its session is stored. The session is written by the dataset's setup and removed by its teardown. */
export const UNCONFIRMED_CANDIDATE_EDITOR = permEditor(
  'candidate',
  UNCONFIRMED_CANDIDATE_EXTERNAL_ID,
  'perm-organization-editing-candidate.json'
);

/** The dataset's three editors, as its setup stores their sessions and its teardown removes them. */
export const EDITORS: ReadonlyArray<PermEditor> = Object.freeze([
  CONFIRMED_ORGANIZATION_EDITOR,
  UNCONFIRMED_ORGANIZATION_EDITOR,
  UNCONFIRMED_CANDIDATE_EDITOR
]);
