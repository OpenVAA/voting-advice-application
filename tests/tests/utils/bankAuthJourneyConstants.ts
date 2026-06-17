/**
 * Test constants for the EFLOW-10b bank-auth journey spec (122-05) + its
 * setup/teardown pair.
 *
 * Single source of truth for the journey's recipient email — the address the
 * preregistration invite email is sent to and the bank-auth-journey teardown
 * cleans up. No pre-seeded candidate row carries this address: the journey
 * itself creates the `auth.users` + `candidates` + `user_roles` row via the
 * identity-callback + preregistration-invite flow, and the teardown removes it
 * by email (idempotent cascade).
 *
 * Naming follows the UPPER_SNAKE convention for constants.
 */

/**
 * Recipient address for the bank-auth journey's preregistration invite email.
 *
 * Used by:
 *   - `candidate-bank-auth-journey.ts` (composition root) — default value of
 *     the `recipientEmail` option fixture wired through `emailBucket`.
 *   - `bank-auth-journey.setup.ts` — idempotent pre-clean target.
 *   - `bank-auth-journey.teardown.ts` — created-auth-user delete target.
 */
export const BANK_AUTH_JOURNEY_EMAIL = 'bank-auth-journey@test.openvaa.local';
