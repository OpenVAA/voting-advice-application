/**
 * Shared credentials for the primary test candidate (Test Candidate Alpha).
 *
 * Used by the opt-in auth-setup project (tests/tests/setup/shared/auth.setup.ts) and the perm-* setups (TEST_CANDIDATE_PASSWORD only).
 *
 * The email is a self-contained literal rather than being derived at module load from a dev-seed template — deriving it threw at import time once the source template was retired, crashing every consumer (including the default-suite perm-* setups that only need the password literal).
 *
 * NOTE (deferred architectural item): the merged base dataset (`e2e/base`) does NOT seed a `test-candidate-alpha` row and the base candidates carry no email column, so the opt-in `auth-setup` project (visual/bank chain) has no registered candidate to log in as against base. Repointing auth-setup to `data-setup-base` keeps the project graph resolving, but a follow-up that rewrites the opt-in/auth chain against the base dataset must establish a registered base-candidate + email contract (forceRegister) before the visual/bank opt-in runs can pass.
 */

/** Email for the primary registered test candidate (Test Candidate Alpha). */
export const TEST_CANDIDATE_EMAIL = 'mock.candidate.2@openvaa.org';

/** tests/-only password constant used by forceRegister + UI login flows. */
export const TEST_CANDIDATE_PASSWORD = 'Password1!';
