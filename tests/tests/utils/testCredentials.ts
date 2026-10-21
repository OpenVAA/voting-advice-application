import path from 'path';
import { PASSWORDLESS_SESSION_ADDRESS_PREFIX } from './invitationConstants';
import { TESTS_DIR } from './testsDir';

/**
 * Shared credentials for the E2E identities registered on the base dataset.
 *
 * Used by the `auth-setup` project (tests/tests/setup/shared/auth.setup.ts), by the base teardown, by the contestant a11y spec and the Playwright configuration (the session path of the terms-pending identity, which the configuration gives to the `contestant-terms-gate-phone` project), by the entity-selection setup, teardown and spec (the three identities at the end of this file) and by the perm-* setups (TEST_CANDIDATE_PASSWORD only).
 *
 * The values are self-contained literals rather than being derived at module load from a dev-seed template, so a change to a template can never make this module throw at import time and crash every consumer (including the default-suite perm-* setups that only need the password literal).
 *
 * ## The registered-base-candidate contract
 *
 * The `candidates` table has NO email column, so a base candidate is not "registered" by the seed — the seed only creates the candidate row. Registration is a RUNTIME act: `auth-setup` calls `SupabaseAdminClient.forceRegister(externalId, email, password)`, which mints the auth user, writes the candidate-editor grant linking it to the row named by the external id, and records the user's acceptance of the terms of use. This mirrors exactly what every perm-* setup already does; the emails below are therefore tests/-owned handles for that runtime registration, not seeded column values.
 *
 * `TEST_CANDIDATE_EXTERNAL_ID` points at CA-AA-1, the base dataset's perfect-match candidate: it has a full info + opinion answer set, so the candidate preview page has content to render for the visual baselines. Its user lands past the terms-of-use view after login because `forceRegister` records the acceptance; acceptance belongs to the user, and the candidate row carries nothing about it.
 *
 * ## The terms-pending identity
 *
 * `TEST_TERMS_PENDING_CANDIDATE_EXTERNAL_ID` names the candidate edited by a registered user who has NOT accepted the terms of use. `auth-setup` registers that user with `{ acceptTermsOfUse: false }` and nothing ever accepts for them, so at every protected URL they are shown the terms-of-use view. That is the state the contestant a11y spec scans and the `contestant-terms-gate-phone` project holds to two phone widths. Both only read the session: neither accepts for the user.
 *
 * ## The entity-selection identities
 *
 * Three users registered by `data-setup-entity-selection` (tests/tests/setup/contestant/entity-selection.setup.ts) on three base-dataset rows seeded for them, all unconfirmed and so invisible to voters. Each has accepted the terms of use.
 *
 *   - **multi** (`TEST_MULTI_ENTITY_EMAIL`) edits the two selection candidates and the selection organization. Its session is stored at `MULTI_ENTITY_STORAGE_STATE` and is READ-ONLY for the run: every reader loads the same file, so a spec that signed it out would end it for all of them.
 *   - **none** (`TEST_NO_ENTITY_EMAIL`) is registered as an editor of the selection organization, signed in, its session stored at `NO_ENTITY_STORAGE_STATE`, and its grant then removed. The login form refuses a user with nothing to edit, so the session cannot start without a grant; the application lists a user's entities from the grants table and not from the token, so the stored session shows the "nothing to edit" view for the whole run. READ-ONLY for the run, for the same reason.
 *   - **logout** (`TEST_LOGOUT_ENTITY_EMAIL`) is registered as an editor of the selection organization and has NO stored session: the one spec case that signs out signs this user in through the login form first, so no stored session is ever ended.
 *
 * An organization admits several editors, so the three share one; a candidate admits one, so the two selection candidates belong to the multi identity alone.
 *
 * ## The passwordless identity
 *
 * `TEST_PASSWORDLESS_EMAIL` is the address of a user who signed in through a mailed link and has never set a password, and `PASSWORDLESS_STORAGE_STATE` is where that user's session is stored. Every protected URL of the Contestant App shows such a user the set-password view. The address is as long as an address's local part can be, so a screen that shows it shows the longest one it will meet.
 *
 * ## The analytics terms identities
 *
 * Two users of the `perm-analytics-tracking` dataset, one for each of its member candidates, registered by the terms-tracking spec (`specs/contestant/contestant-terms-tracking.spec.ts`) with `{ acceptTermsOfUse: false }` and unregistered by the dataset's teardown. The **granting** user (`ANALYTICS_TERMS_GRANTING_EMAIL`) accepts the terms of use with the opt-out unticked, and the **refusing** user (`ANALYTICS_TERMS_REFUSING_EMAIL`) accepts with it ticked. Both use `TEST_CANDIDATE_PASSWORD`.
 *
 * SECURITY: these are LOCAL/E2E-only credentials on the `test.openvaa.local` domain, same posture as the existing perm-* registered candidates. No production code path references them (`grep -rn TEST_CANDIDATE_EMAIL apps packages` → no hits), and `e2e/base` is seeded only against a local Supabase instance.
 */

/**
 * external_id of the base-dataset candidate that `auth-setup` force-registers.
 * Must exist in `packages/dev-seed/src/templates/e2e/base.ts`.
 */
export const TEST_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-aa-1';

/** Email minted for the registered base candidate (perm-* naming convention). */
export const TEST_CANDIDATE_EMAIL = `${TEST_CANDIDATE_EXTERNAL_ID}@test.openvaa.local`;

/** tests/-only password constant used by forceRegister + UI login flows. */
export const TEST_CANDIDATE_PASSWORD = 'Password1!';

/**
 * external_id of the base-dataset candidate edited by the user who has not accepted the terms of use.
 * Must exist in `packages/dev-seed/src/templates/e2e/base.ts`.
 *
 * Why this candidate: it is neither CA-AA-1, whose one editor grant the base session's user holds, nor the candidate the contestant journey registers through the email flow. It is seeded unconfirmed, so voters do not see it whether or not it has an editor.
 */
export const TEST_TERMS_PENDING_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-aa-hidden';

/** Email minted for the user who has not accepted the terms of use (perm-* naming convention). */
export const TEST_TERMS_PENDING_CANDIDATE_EMAIL = `${TEST_TERMS_PENDING_CANDIDATE_EXTERNAL_ID}@test.openvaa.local`;

/**
 * Where the session of the user who has not accepted the terms of use is stored.
 *
 * Declared here, once, and imported by the setup that writes the file (`auth.setup.ts`) and by its two readers, so none of them can name a different file: the spec that scans the view (`contestant-a11y.spec.ts`), and the Playwright configuration, which names it as the stored session of the `contestant-terms-gate-phone` project. Read-only for the run: nothing accepts the terms under this session and nothing signs it out.
 *
 * Distinct from the base candidate's `../playwright/.auth/user.json` on purpose: a shared file would let whichever setup test ran last decide which user every reader of the file is.
 */
export const TERMS_PENDING_STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/user-terms-pending.json');

/**
 * external_id of the first base-dataset candidate the multi-entity identity edits. Its displayed name sorts before the second's.
 * Must exist in `packages/dev-seed/src/templates/e2e/base.ts`, unconfirmed and with no other editor.
 */
export const TEST_SELECTION_CANDIDATE_A_EXTERNAL_ID = 'test-e2e-base-ca-sel-a';

/**
 * external_id of the second base-dataset candidate the multi-entity identity edits.
 * Must exist in `packages/dev-seed/src/templates/e2e/base.ts`, unconfirmed and with no other editor.
 */
export const TEST_SELECTION_CANDIDATE_B_EXTERNAL_ID = 'test-e2e-base-ca-sel-b';

/**
 * external_id of the base-dataset organization all three entity-selection identities are registered on.
 * Must exist in `packages/dev-seed/src/templates/e2e/base.ts`, unconfirmed.
 */
export const TEST_SELECTION_ORGANIZATION_EXTERNAL_ID = 'test-e2e-base-or-sel';

/** Email of the user who edits two candidates and one organization. */
export const TEST_MULTI_ENTITY_EMAIL = 'entity-selection-multi@test.openvaa.local';

/** Email of the user whose only grant is removed after sign-in, and who therefore has nothing to edit. */
export const TEST_NO_ENTITY_EMAIL = 'entity-selection-none@test.openvaa.local';

/** Email of the user a spec signs in through the login form and then signs out. No session is stored for it. */
export const TEST_LOGOUT_ENTITY_EMAIL = 'entity-selection-logout@test.openvaa.local';

/**
 * Where the session of the user who edits several entities is stored.
 *
 * Declared here, once, for the setup that writes the file (`entity-selection.setup.ts`), the Playwright project that loads it and the specs that read it, so none of them can name a different file. Read-only for the run: nothing signs this session out.
 */
export const MULTI_ENTITY_STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/user-multi-entity.json');

/**
 * Where the session of the user who has nothing to edit is stored.
 *
 * Declared here, once, for the setup that writes the file (`entity-selection.setup.ts`) and the specs that read it. Read-only for the run: nothing signs this session out.
 */
export const NO_ENTITY_STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/user-no-entity.json');

/**
 * external_id of the first member candidate of the `perm-analytics-tracking` dataset, edited by the user who accepts the terms of use without opting out of usage data.
 * Must exist in `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts`, with the dataset's prefix.
 */
export const ANALYTICS_TERMS_GRANTING_EXTERNAL_ID = 'e2e-perm-analytics-ca-1-1a';

/** Email of the user who accepts the terms of use without opting out (perm-* naming convention). */
export const ANALYTICS_TERMS_GRANTING_EMAIL = `${ANALYTICS_TERMS_GRANTING_EXTERNAL_ID}@test.openvaa.local`;

/**
 * Where the session of the user who accepts without opting out is stored. The terms-tracking spec writes it while the user has not yet accepted, so every context opened from it starts signed in; the acceptance itself is held on the server.
 */
export const ANALYTICS_TERMS_GRANTING_STORAGE_STATE = path.join(
  TESTS_DIR,
  '../playwright/.auth/analytics-terms-granting.json'
);

/**
 * external_id of the second member candidate of the `perm-analytics-tracking` dataset, edited by the user who accepts the terms of use with the opt-out ticked.
 * Must exist in `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts`, with the dataset's prefix.
 */
export const ANALYTICS_TERMS_REFUSING_EXTERNAL_ID = 'e2e-perm-analytics-ca-2-1a';

/** Email of the user who accepts the terms of use with the opt-out ticked (perm-* naming convention). */
export const ANALYTICS_TERMS_REFUSING_EMAIL = `${ANALYTICS_TERMS_REFUSING_EXTERNAL_ID}@test.openvaa.local`;

/** Where the session of the user who accepts with the opt-out ticked is stored. The terms-tracking spec writes it while the user has not yet accepted. */
export const ANALYTICS_TERMS_REFUSING_STORAGE_STATE = path.join(
  TESTS_DIR,
  '../playwright/.auth/analytics-terms-refusing.json'
);

/** The longest local part an email address can have, in characters. */
const LOCAL_PART_MAX_LENGTH = 64;

/**
 * Email of the user whose account has no password.
 *
 * Lower-case, under the address prefix reserved for this identity, and with a local part of exactly {@link LOCAL_PART_MAX_LENGTH} characters: the prefix, filled up with one fixed letter. The filler has no hyphen or dot, so nothing in it offers a line break.
 */
export const TEST_PASSWORDLESS_EMAIL = `${PASSWORDLESS_SESSION_ADDRESS_PREFIX.padEnd(LOCAL_PART_MAX_LENGTH, 'x')}@test.openvaa.local`;

/**
 * Where the session of the user who has no password is stored.
 *
 * Declared here, once, so that whatever writes the file and whatever reads it name the same file. Read-only for a run: a reader that set a password under this session, or signed it out, would change what every other reader of the file meets.
 */
export const PASSWORDLESS_STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/user-passwordless.json');
