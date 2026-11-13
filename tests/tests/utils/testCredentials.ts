/**
 * Shared credentials for the E2E identities registered on the base dataset.
 *
 * Used by the `auth-setup` project (tests/tests/setup/shared/auth.setup.ts), by the base teardown, by the contestant a11y spec and the Playwright configuration (the session path of the terms-pending identity, which the configuration gives to the `contestant-terms-gate-phone` project), by the entity-selection setup, teardown and spec (the three identities at the end of this file) and by the perm-* setups (TEST_CANDIDATE_PASSWORD only).
 *
 * The values are self-contained literals rather than being derived at module load from a dev-seed template, so a change to a template can never make this module throw at import time and crash every consumer (including the default-suite perm-* setups that only need the password literal). The two addresses that are asked a mailed link on every run, `TEST_PASSWORDLESS_EMAIL` and `L10N_POSITIVE_CANDIDATE_EMAIL`, carry the run tag of `runAddressTag.ts` instead, and the module throws at import time only when `E2E_RUN_ADDRESS_TAG` holds a malformed tag.
 *
 * ## The registered-base-candidate contract
 *
 * The `candidates` table has NO email column, so a base candidate is not "registered" by the seed — the seed only creates the candidate row. Registration is a RUNTIME act: `auth-setup` calls `SupabaseAdminClient.forceRegister(externalId, email, password)`, which mints the auth user, writes the candidate-editor grant linking it to the row named by the external id, and records the user's acceptance of the terms of use. This mirrors exactly what every perm-* setup already does; the emails below are therefore tests/-owned handles for that runtime registration, not seeded column values.
 *
 * `TEST_CANDIDATE_EXTERNAL_ID` points at CA-AA-1, the base dataset's registered test candidate: it has a full info + opinion answer set (the generic answers), so the candidate preview page has content to render for the visual baselines. Its user lands past the terms-of-use view after login because `forceRegister` records the acceptance; acceptance belongs to the user, and the candidate row carries nothing about it.
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
 * `TEST_PASSWORDLESS_EMAIL` is the address of a user who signed in through a mailed link and has never set a password, and `PASSWORDLESS_STORAGE_STATE` is where that user's session is stored. Every protected URL of the Contestant App shows such a user the set-password view. The address is as long as an address's local part can be, so a screen that shows it shows the longest one it will meet. It carries the run tag, so each run asks for the link of an address of its own.
 *
 * ## The localisation identity
 *
 * `L10N_POSITIVE_CANDIDATE_EMAIL` is the address the positive localisation walk (`specs/perm/perm-localisation-positive.spec.ts`) invites its candidate under. It carries the run tag for the same reason, so the walk's setup and teardown remove every user under its stable beginning, `L10N_POSITIVE_CANDIDATE_ADDRESS_PREFIX`, which reaches a user an interrupted earlier run left.
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
