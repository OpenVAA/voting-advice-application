/**
 * Test constants for the candidate journey spec.
 *
 * Single source of truth for:
 *   - Unregistered candidate identity (email + external_id) — the `test-e2e-base-ca-aa-unregistered` row in the `e2e/base` dataset has NO `email` column (the candidates table has no email), so this file is the canonical home for the candidate's email string that the registration-via-email flow targets.
 *   - Passwords used by the registration → forgot-password → login flow. PASSWORD_1 is the initial password set after opening the mailed sign-in link; PASSWORD_2 is the new password set on the password-reset page, which the mailed recovery link leads to. Both meet the candidate password complexity gates (≥8 chars with mixed-case + number + special char per the PasswordValidator component).
 *   - OPEN_ANSWER_1 — the open-answer (info) text submitted on the first opinion question in the candidate journey.
 *   - INFO_QUESTION_ANSWERS — externalId → value map for filling the editable info questions on the candidate profile page.
 *
 * The registration mail and the recovery mail are the `account-access` function's, whose exact subjects are `SIGN_IN_LINK_EMAIL_SUBJECT` and `RECOVERY_LINK_EMAIL_SUBJECT` in `invitationConstants.ts`.
 *
 * Naming follows the UPPER_SNAKE convention for constants.
 */

import { RUN_ADDRESS_TAG, runScopedAddress } from './runAddressTag';

/**
 * Email for the unregistered candidate (`test-e2e-base-ca-aa-unregistered` in the `e2e/base` dataset).
 *
 * The candidates table has NO email column in the schema, so the email string lives exclusively here (not on the seeded row). The registration flow:
 *   1. The spec calls `client.inviteByEmail({ entityType: 'candidate', externalId: UNREGISTERED_CANDIDATE_EXTERNAL_ID, email: UNREGISTERED_CANDIDATE_EMAIL, locale: 'en', confirmEntity: true, nominations: [await client.invitationNomination({ ...UNREGISTERED_CANDIDATE_NOMINATION, confirmed: false })] })`, which seeds an email invitation promising the candidate's editor grant, confirms the candidate and creates its one nomination unconfirmed, so voters never see it, and asks the `account-access` Edge Function for a sign-in link. Seeding creates no user and no grant; asking for the link creates the auth user and mails the link.
 *   2. The spec opens the mailed link as received, on the run's origin. The auth callback verifies it, claims the invitation, which writes the grant that links the user to the candidate, and refreshes the session; the user then sets a password.
 *   3. The teardown calls `unregisterCandidate(UNREGISTERED_CANDIDATE_EMAIL)`, which deletes the invitation and the auth.users row. The user's grant and the terms-of-use acceptance the journey records go with the user, so the next cold-start run is clean. The nomination the invitation created carries the base dataset's prefix and goes with the dataset's prefix teardown.
 *
 * The address carries the run tag of `runAddressTag.ts`: the journey asks for a sign-in link and a recovery link on every run, and each run asks for them under an address of its own.
 */
export const UNREGISTERED_CANDIDATE_EMAIL = runScopedAddress('unregistered-aa-', RUN_ADDRESS_TAG);

/**
 * External ID of the unregistered candidate row in the `e2e/base` dataset.
 *
 * Source of truth: packages/dev-seed/src/templates/e2e/base.ts.
 */
export const UNREGISTERED_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-aa-unregistered';

/**
 * The nomination the journey's invitation states for the unregistered candidate, by external ids of the `e2e/base` dataset: under party AA in Region North of the regional election, with the election symbol "999". The dataset seeds no nomination for the candidate.
 *
 * The nomination's own external id carries the base dataset's prefix, so the dataset's teardown removes it.
 */
export const UNREGISTERED_CANDIDATE_NOMINATION = Object.freeze({
  election: 'test-e2e-base-el-reg',
  constituency: 'test-e2e-base-co-reg-n',
  parentOrganization: 'test-e2e-base-or-aa',
  symbol: '999',
  externalId: 'test-e2e-base-nom-reg-n-ca-aa-unregistered'
});

/**
 * Initial password set in the PasswordSetter a first-time invitee lands on.
 * Meets the candidate password complexity gate (≥8 chars + mixed-case + number + special char).
 */
export const PASSWORD_1 = 'OldPass!Word123';

/**
 * Replacement password set via the forgot-password reset flow.
 * Same complexity profile as PASSWORD_1 but a distinct value so the wrong-password assertion in step 9 (login with PASSWORD_1 → error) exercises the rejection branch.
 */
export const PASSWORD_2 = 'NewPass!Word456';

/**
 * Open-answer text submitted on the first opinion question (step 16).
 * Used to assert the value round-trips on the questions overview (step 17) and post-edit (step 18).
 */
export const OPEN_ANSWER_1 = '[OPEN-1] My take on the first base opinion question.';

/**
 * Replacement open-answer text used in step 18 (edit-first-question) to prove the round-trip on edit.
 */
export const OPEN_ANSWER_1_EDITED = '[OPEN-1-EDITED] My revised take.';

/**
 * Map of info-question externalId → value for filling the candidate profile in step 13.
 *
 * IMPORTANT: these keys are deliberately `test-qu-info-*`, NOT the DB external_ids (`test-e2e-base-qu-info-*`). They are internal map keys that the spec consumes via `externalId.replace(/^test-/, '')` → `qu-info-*`, then matches the RENDERED question name label `[qu-info-*]` (base.ts question `name` tokens, e.g. `[qu-info-text] Info: …`). Rewriting them to the `test-e2e-base-` prefix would make `.replace(/^test-/)` yield `e2e-base-qu-info-*` and break the label regex — so they keep the `test-qu-info-` prefix on purpose.
 *
 * Step 13 fills ALL listed answers EXCEPT `test-qu-info-text` (the required one — deliberately left blank to exercise the required-empty submit-disabled gate) AND the first listed info question (fill all other questions except the required one and the first one). Step 14 then revisits the profile, fills the required field, and submits.
 *
 * The mun-only + south-only filtered info questions are NOT included — the unregistered candidate is in CO-Reg-N (north), so those questions are filtered out of the profile surface entirely. The north-only filtered question (`test-qu-info-filt-co-reg-n`) IS visible and listed here.
 */
export const INFO_QUESTION_ANSWERS: Readonly<Record<string, string>> = Object.freeze({
  'test-qu-info-text': '[INFO-TEXT] Short biography for the unregistered candidate.',
  'test-qu-info-text-longText': '[INFO-LONGTEXT] An extended biography in long-form text.',
  'test-qu-info-text-link': 'https://example.test/unregistered-candidate',
  'test-qu-info-number': '42',
  // NOTE: test-qu-info-multipleText is NOT in this map because its answer is a string[] (a row list), which cannot live in this Record<string,string>. It is filled explicitly in step 13 via MULTIPLE_TEXT_ANSWERS (below) + contestantProfilePage.fillMultipleTextQuestion, and round-tripped in step 21 (candidate leg). It is required:false, so leaving it out of the completion-gate map does not affect the required-empty submit choreography.
  'test-qu-info-filt-co-reg-n': '[INFO-FILT-CO-REG-N] Answer for the north-only filtered info question.'
});

/**
 * The multipleText info question (`test-qu-info-multipleText`) answer: a list of exactly 2 distinct ASCII marker values. Filled on the candidate profile (step 13) via `contestantProfilePage.fillMultipleTextQuestion` and asserted verbatim in the preview (step 21) — closing the candidate round-trip.
 *
 * The values live in a `string[]` (not the INFO_QUESTION_ANSWERS Record<string,string> map) because the multipleText answer is a row list. The distinct `[MULTITEXT-1]` / `[MULTITEXT-2]` bracket-token markers make the round-trip assertion a VERBATIM equality check — no locale / normalization / encoding ambiguity can silently pass a mangled value.
 */
export const MULTIPLE_TEXT_ANSWERS: ReadonlyArray<string> = Object.freeze([
  '[MULTITEXT-1] First list value.',
  '[MULTITEXT-2] Second list value.'
]);
