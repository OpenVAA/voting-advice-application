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

/**
 * The `sub` claim the mock OIDC issuer mints for the journey identity
 * (`tests/tests/support/mockOidcIssuer.ts` → `IDURA_CLAIMS.sub`). The
 * identity-callback Edge Function matches/creates the bank-auth `auth.users`
 * row by this `sub` and derives a placeholder email from it (see below) — the
 * candidate the journey creates carries the PLACEHOLDER email, NOT
 * `BANK_AUTH_JOURNEY_EMAIL` (which the user merely types into the preregister
 * email form; the Supabase id_token-callback path does not persist it as the
 * auth user's email).
 *
 * MUST stay in sync with `IDURA_CLAIMS.sub` in the mock issuer.
 */
export const BANK_AUTH_JOURNEY_SUB = 'test-bank-auth-journey-sub-001';

/**
 * The placeholder email the identity-callback Edge Function derives for the
 * bank-auth user (`${identityMatchValue}@bank-auth.placeholder`, see
 * `apps/supabase/supabase/functions/identity-callback/index.ts`). This is the
 * address the created `auth.users` row actually carries, so the setup pre-clean
 * and teardown delete the journey's auth-user cascade by THIS email (not by
 * `BANK_AUTH_JOURNEY_EMAIL`).
 */
export const BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL = `${BANK_AUTH_JOURNEY_SUB}@bank-auth.placeholder`;
