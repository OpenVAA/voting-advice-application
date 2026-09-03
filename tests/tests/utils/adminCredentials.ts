import path from 'path';
import { TESTS_DIR } from './testsDir';

/**
 * Shared credentials for the runtime-minted E2E Admin App identity.
 *
 * Used by the `admin-auth-setup` project (tests/tests/setup/admin/admin-auth.setup.ts), the `data-teardown-admin-access` project, and the `admin-access` spec.
 *
 * The values are self-contained literals rather than being derived at module load from a dev-seed template — deriving them threw at import time once the source template was retired, crashing every consumer. The candidate sibling `testCredentials.ts` carries the same posture for the same reason; this module mirrors it rather than inventing a second convention.
 *
 * ## What an admin identity IS in this system, and why the seed cannot express it
 *
 * An Admin App identity is exactly TWO rows: one `auth.users` account, and one `user_roles` row carrying an admin-side role, `scope_type: 'project'` and `scope_id` equal to the project the data is seeded into. There is NO candidate row and NO `auth_user_id` link — the candidate machinery is irrelevant to it.
 *
 * The seed structurally CANNOT express this. `packages/dev-seed/src/template/permittedKeys.ts` declares exactly twelve authorable collections — elections, constituency_groups, constituencies, organizations, alliances, factions, candidates, question_categories, questions, nominations, app_settings, feedback — and `user_roles` is not among them, nor is `auth.users` (which lives in the `auth` schema, outside PostgREST's reach entirely). So minting the identity is a RUNTIME act performed by `SupabaseAdminClient.forceRegisterAdmin`, exactly as candidate registration is. This is not an omission in the dataset and must not be "fixed" by adding a template block: there is no block to add.
 *
 * The role assignment is what makes the identity visible to the application at all. `custom_access_token_hook` (`apps/supabase/supabase/migrations/00001_initial_schema.sql`) reads `user_roles` on every token issue and injects the rows into the JWT's `user_roles` claim; `hasAnyRole(claims, ADMIN_ROLES)` in `apps/frontend/src/lib/auth/roles.ts` is what the admin login gate and `requireAdminIdentity` then test. An account with no role row logs in and is bounced.
 *
 * SECURITY: these are LOCAL/E2E-only credentials on the `test.openvaa.local` domain, the same posture and the same domain as the candidate sibling. No production code path references them, and the identity is minted only against a local Supabase instance.
 */

/** Email minted for the runtime E2E admin (candidate-sibling naming convention). */
export const TEST_ADMIN_EMAIL = 'test-e2e-admin@test.openvaa.local';

/** tests/-only password constant used by `forceRegisterAdmin` + the admin login form. */
export const TEST_ADMIN_PASSWORD = 'Password1!';

/**
 * Where the admin session the setup project mints is stored.
 *
 * DECLARED HERE, ONCE, and re-exported by `playwright.config.ts` as `ADMIN_STORAGE_STATE` — the setup that WRITES it and the project that READS it must name the same file, and the candidate pair's habit of spelling its own path twice (once in the config, once in `auth.setup.ts`) is a drift waiting to happen. Two projects writing one file, or one project reading a file another never wrote, is a race with no symptom until it produces a confident wrong answer about a login page.
 *
 * DISTINCT from the candidate `../playwright/.auth/user.json` on purpose. The identities are different, their role claims are different, and a shared file would let whichever setup ran last decide who the other project's spec was.
 */
export const ADMIN_STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/admin.json');
