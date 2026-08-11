/**
 * Shared credentials for the registered E2E base candidate.
 *
 * Used by the opt-in `auth-setup` project (tests/tests/setup/shared/auth.setup.ts)
 * and the perm-* setups (TEST_CANDIDATE_PASSWORD only).
 *
 * The values are self-contained literals rather than being derived at module load
 * from a dev-seed template — deriving them threw at import time once the source
 * template was retired, crashing every consumer (including the default-suite perm-*
 * setups that only need the password literal).
 *
 * ## The registered-base-candidate contract (Phase 136 plan 05)
 *
 * The `candidates` table has NO email column (Phase 89-01 Wave 0 R8 verdict), so a
 * base candidate is not "registered" by the seed — the seed only creates the
 * candidate row. Registration is a RUNTIME act: `auth-setup` calls
 * `SupabaseAdminClient.forceRegister(externalId, email, password)`, which mints the
 * auth user, assigns the `candidate` role and links `auth_user_id` on the row named
 * by `TEST_CANDIDATE_EXTERNAL_ID`. This mirrors exactly what every perm-* setup
 * already does; the email below is therefore a tests/-owned handle for that runtime
 * registration, not a seeded column value.
 *
 * `TEST_CANDIDATE_EXTERNAL_ID` points at CA-AA-1, the base dataset's perfect-match
 * candidate: it carries `terms_of_use_accepted` (so the post-login ToU gate does not
 * intercept) and a full info + opinion answer set (so the candidate preview page has
 * content to render for the visual baselines).
 *
 * SECURITY: these are LOCAL/E2E-only credentials on the `test.openvaa.local` domain,
 * same posture as the existing perm-* registered candidates. No production code path
 * references them (`grep -rn TEST_CANDIDATE_EMAIL apps packages` → no hits), and
 * `e2e/base` is seeded only against a local Supabase instance.
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
