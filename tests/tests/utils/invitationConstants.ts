/**
 * Constants of the invitation, registration and recovery flows: the subjects of the sign-in mail and of the recovery mail, the dataset rows each test file promises grants on, and the addresses those tests invent, under one prefix per spec or setup.
 *
 * Plain module, no Playwright import, so setups, teardowns, fixtures and unit tests can all read it.
 */

/**
 * The subject of the sign-in mail in English, as the `account-access` Edge Function ships it.
 *
 * A literal, not an import of the function's templates: a test states the subject it expects, so a changed template fails here instead of being followed silently.
 */
export const SIGN_IN_LINK_EMAIL_SUBJECT = 'Sign-in link for the voting advice application';

/** The subject of the sign-in mail in Finnish, as the `account-access` Edge Function ships it. */
export const SIGN_IN_LINK_EMAIL_SUBJECT_FI = 'Kirjautumislinkki vaalikoneeseen';

/** The subject of the password-recovery mail in English. A literal, as the sign-in subject is, so a changed template fails here. */
export const RECOVERY_LINK_EMAIL_SUBJECT = 'Reset your password for the voting advice application';

/**
 * External id of the candidate reserved for invitation tests in the `e2e/base` dataset.
 *
 * Seeded unconfirmed, with both names and no nomination, answer or editor: it can never be public, and seeding an invitation for it confirms it. A candidate admits one editor, so at most one invitation for it can be claimed at a time.
 */
export const INVITATION_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-invitation';

/**
 * External id of the organization reserved for invitation tests in the `e2e/base` dataset.
 *
 * Seeded unconfirmed, with a name and no nomination, answer or editor. An organization admits several editors.
 */
export const INVITATION_ORGANIZATION_EXTERNAL_ID = 'test-e2e-base-or-invitation';

/**
 * External id of the candidate reserved for registration tests in the `e2e/base` dataset.
 *
 * Seeded unconfirmed, with both names and no nomination, answer or editor, so it can never be public. A candidate admits one editor, so at most one invitation for it can be claimed at a time.
 */
export const REGISTRATION_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-registration';

/**
 * External id of the organization reserved for registration tests in the `e2e/base` dataset.
 *
 * Seeded unconfirmed, with a name and no nomination, answer or editor, so it can never be public.
 */
export const REGISTRATION_ORGANIZATION_EXTERNAL_ID = 'test-e2e-base-or-registration';

/** External id of the candidate reserved for password-recovery tests in the `e2e/base` dataset. Seeded as the registration candidate is. */
export const RECOVERY_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-recovery';

/** External id of the candidate the scans of the signed-out entry screens seed an open registration code for. Seeded as the registration candidate is. */
export const ENTRY_SCAN_OPEN_CODE_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-scan-open';

/** External id of the candidate the scans of the signed-out entry screens seed a used registration code for. Seeded as the registration candidate is. */
export const ENTRY_SCAN_USED_CODE_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-scan-used';

/** The local-part prefix of every address the invitation contract spec invents; its cleanup removes the users whose address begins with it. */
export const INVITATION_TEST_ADDRESS_PREFIX = 'invitation-contract-';

/**
 * The local-part prefix of every address the invitation landing spec invents; its cleanup removes the users and the invitations whose address begins with it.
 *
 * A prefix of its own, of which the contract spec's is no beginning and which is no beginning of the contract spec's: the two specs run side by side, and each removes everything under its own prefix.
 */
export const INVITATION_LANDING_ADDRESS_PREFIX = 'invitation-landing-';

/** The local-part prefix of every address the email-registration spec invents. */
export const EMAIL_REGISTRATION_ADDRESS_PREFIX = 'email-registration-';

/** The local-part prefix of every address the code-registration spec invents. */
export const CODE_REGISTRATION_ADDRESS_PREFIX = 'code-registration-';

/** The local-part prefix of every address the password-recovery spec invents. */
export const PASSWORD_RECOVERY_ADDRESS_PREFIX = 'password-recovery-';

/** The local-part prefix of every address the scans of the signed-out entry screens invent. */
export const ENTRY_SCAN_ADDRESS_PREFIX = 'entry-scan-';

/** The local-part prefix of the address of the user whose stored session has no password. */
export const PASSWORDLESS_SESSION_ADDRESS_PREFIX = 'passwordless-session-';

/** The local-part prefix of every address the candidate accessibility scans invent: the users whose mailed links open the confirm page under the stored candidate session. */
export const CONTESTANT_A11Y_SCAN_ADDRESS_PREFIX = 'contestant-a11y-scan-';

/**
 * Every address prefix of this module, one per spec or setup.
 *
 * A cleanup removes the users and invitations whose address begins with its own prefix, so no member may be the beginning of another: the specs run side by side.
 */
export const INVITATION_ADDRESS_PREFIXES: ReadonlyArray<string> = Object.freeze([
  INVITATION_TEST_ADDRESS_PREFIX,
  INVITATION_LANDING_ADDRESS_PREFIX,
  EMAIL_REGISTRATION_ADDRESS_PREFIX,
  CODE_REGISTRATION_ADDRESS_PREFIX,
  PASSWORD_RECOVERY_ADDRESS_PREFIX,
  ENTRY_SCAN_ADDRESS_PREFIX,
  PASSWORDLESS_SESSION_ADDRESS_PREFIX,
  CONTESTANT_A11Y_SCAN_ADDRESS_PREFIX
]);

/**
 * A fresh address for one invitation test.
 *
 * Unique per call, so no request of a run meets the one-mail-per-address interval of another request or of an earlier run. Lower-case, which is how the database stores an invited address.
 *
 * @param prefix - The local-part prefix of the spec that invents the address; the contract spec's by default.
 * @returns `<prefix><uuid>@test.openvaa.local`.
 */
export function freshInvitationAddress(prefix: string = INVITATION_TEST_ADDRESS_PREFIX): string {
  return `${prefix}${crypto.randomUUID()}@test.openvaa.local`;
}
