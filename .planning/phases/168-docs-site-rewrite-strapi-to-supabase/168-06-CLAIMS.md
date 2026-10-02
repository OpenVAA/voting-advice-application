# 168-06 Claims Ledger — Candidate app, Admin app and app settings

Pages written by plan 168-06, every old page merged into them, and one content-anchored row per route, handler,
function, env name, rule and settings key the pages state. `node .planning/phases/168-docs-site-rewrite-strapi-to-supabase/scripts/check-claims.mjs ledger`
re-checks every `## Claims` row with `git grep -F` of the quoted anchor in its anchor file (D-09). Anchors are copied
from code or configuration at the execution HEAD; README and CLAUDE.md prose is never an anchor.

Page keys used in the Claims table: `candidate-app/pre-registration-and-invitation`, `candidate-app/registration`,
`candidate-app/login-and-password-reset`, `candidate-app/bank-authentication`, `candidate-app/password-validation`
and `admin-app` (all under `/developers-guide/`), `configuration/app-settings` (`/developers-guide/configuration/app-settings`)
and `publishers/app-settings` (`/publishers-guide/app-settings`).

## Page verdicts

| Old route | New route | Verdict | What changed | RQ |
| --- | --- | --- | --- | --- |
| `/developers-guide/candidate-user-management/creating-a-new-candidate` | redirect stub → `/developers-guide/candidate-app/pre-registration-and-invitation` | merged → /developers-guide/candidate-app/pre-registration-and-invitation | Kept: the idea that a candidate account comes from an administrator or from bank-identity pre-registration. Dropped: the Strapi admin-panel steps (Content Manager, `registrationKey` field, manual `User` entry with `confirmed`/`blocked`/`role`), the `localhost:1337` URLs, "enabled with the `preRegistration.enabled` static setting" (it is a dynamic app setting), "the feature is partially supported" and the two PR links standing in for documentation. The registration-key contract moved to Registration. | 0 |
| `/developers-guide/candidate-app/pre-registration-and-invitation` | `/developers-guide/candidate-app/pre-registration-and-invitation` | updated | Rewritten for the post-166 flow: the grant as the only link, `invite-candidate`'s caller (`_preregister` via `preregisterWithApiToken`, no UI caller), the `user_can` authority check, the numbered function steps with both rollbacks, the missing nomination, the invite email and the auth callback (`token_hash` + `type` → `verifyOtp` → `CandAppSetPassword`), the `complete-registration` redirect target that has no page, the invite branch of the set-password page, and one paragraph on bank-authentication pre-registration. Legacy banner removed. | 0 |

## Claims

| # | Page | Kind | Claim | Anchor file | Anchor |
| --- | --- | --- | --- | --- | --- |
| 1 | candidate-app/pre-registration-and-invitation | fact | The Candidate App loads the candidate through `get_candidate_user_data` with the adapter's project | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `rpc('get_candidate_user_data', { p_project_id: this.projectId, p_entity_type: 'candidate' })` |
| 2 | candidate-app/pre-registration-and-invitation | fact | `get_candidate_user_data` resolves the entity through the caller's editor grants | apps/supabase/supabase/schema/301-auth-functions.sql | `private.caller_entity_ids` |
| 3 | candidate-app/pre-registration-and-invitation | flow | `invite-candidate` invites the candidate by email | apps/supabase/supabase/functions/invite-candidate/index.ts | `supabaseAdmin.auth.admin.inviteUserByEmail(email, {` |
| 4 | candidate-app/pre-registration-and-invitation | flow | `identity-callback` creates the candidate for a new identity | apps/supabase/supabase/functions/identity-callback/index.ts | `const candidate = await createCandidate(supabaseAdmin, {` |
| 5 | candidate-app/pre-registration-and-invitation | fact | `seed.sql` creates a candidate user | apps/supabase/supabase/seed.sql | `'candidate@openvaa.test',` |
| 6 | candidate-app/pre-registration-and-invitation | fact | `seed.sql` writes the seeded users' grants | apps/supabase/supabase/seed.sql | `ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING;` |
| 7 | candidate-app/pre-registration-and-invitation | fact | `invite-candidate` writes with the service-role key | apps/supabase/supabase/functions/invite-candidate/index.ts | `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!` |
| 8 | candidate-app/pre-registration-and-invitation | flow | The email link is verified by a SvelteKit server route (`GET` handler) | apps/frontend/src/routes/api/candidate/auth/callback/+server.ts | `export async function GET({ url, locals }: RequestEvent): Promise<never> {` |
| 9 | candidate-app/pre-registration-and-invitation | fact | `invite-candidate` accepts only `POST` | apps/supabase/supabase/functions/invite-candidate/index.ts | `if (req.method !== 'POST') {` |
| 10 | candidate-app/pre-registration-and-invitation | fact | The four required body fields | apps/supabase/supabase/functions/invite-candidate/index.ts | `Missing required fields: firstName, lastName, email, and projectId are required` |
| 11 | candidate-app/pre-registration-and-invitation | fact | The caller's token arrives in the `Authorization` header | apps/supabase/supabase/functions/invite-candidate/index.ts | `const authHeader = req.headers.get('Authorization');` |
| 12 | candidate-app/pre-registration-and-invitation | flow | The data writer's `_preregister` invokes `invite-candidate` | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `this.supabase.functions.invoke('invite-candidate', {` |
| 13 | candidate-app/pre-registration-and-invitation | fact | `_preregister` fills in `projectId` from the adapter | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `projectId: this.projectId` |
| 14 | candidate-app/pre-registration-and-invitation | fact | The adapter's project id is `PUBLIC_PROJECT_ID` | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `constants.PUBLIC_PROJECT_ID` |
| 15 | candidate-app/pre-registration-and-invitation | flow | `_preregister` is reached through `preregisterWithApiToken` | apps/frontend/src/lib/api/base/universalDataWriter.ts | `return this._preregister(opts);` |
| 16 | candidate-app/pre-registration-and-invitation | fact | `preregisterWithApiToken` is declared on the universal writer (no route or component calls it; F2) | apps/frontend/src/lib/api/base/universalDataWriter.ts | `preregisterWithApiToken(opts: {` |
| 17 | candidate-app/pre-registration-and-invitation | flow | A missing `Authorization` header gives 401 | apps/supabase/supabase/functions/invite-candidate/index.ts | `Missing Authorization header` |
| 18 | candidate-app/pre-registration-and-invitation | flow | The token is checked with `auth.getUser()` | apps/supabase/supabase/functions/invite-candidate/index.ts | `await callerClient.auth.getUser();` |
| 19 | candidate-app/pre-registration-and-invitation | flow | A rejected token gives 401 | apps/supabase/supabase/functions/invite-candidate/index.ts | `Invalid or expired authentication token` |
| 20 | candidate-app/pre-registration-and-invitation | flow | The authority check is `project.edit_entities` on `projectId` | apps/supabase/supabase/functions/invite-candidate/index.ts | `callerMayOnProject(callerClient, projectId, 'project.edit_entities')` |
| 21 | candidate-app/pre-registration-and-invitation | fact | `user_can` is called through the caller's client | apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts | `await callerClient.rpc('user_can', args);` |
| 22 | candidate-app/pre-registration-and-invitation | fact | A blank project id is a denial | apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts | `projectId.trim() === '') return false;` |
| 23 | candidate-app/pre-registration-and-invitation | fact | An RPC error or a non-`true` answer is a denial | apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts | `return !error && data === true;` |
| 24 | candidate-app/pre-registration-and-invitation | flow | A denial gives 403 | apps/supabase/supabase/functions/invite-candidate/index.ts | `Forbidden: caller may not create candidates in this project` |
| 25 | candidate-app/pre-registration-and-invitation | fact | Project editors hold `project.edit_entities` | apps/supabase/supabase/schema/302-rls.sql | `also admit project editors, who hold project.edit_entities` |
| 26 | candidate-app/pre-registration-and-invitation | fact | The page links Grants on the authentication page; `project.edit_entities` is a member of the permission enum | apps/supabase/supabase/schema/000-enums.sql | `'project.edit_entities',` |
| 27 | candidate-app/pre-registration-and-invitation | flow | Step 1 inserts the candidate row | apps/supabase/supabase/functions/invite-candidate/index.ts | `.from('candidates')` |
| 28 | candidate-app/pre-registration-and-invitation | fact | The candidate row carries `first_name`, `last_name` and `project_id` | apps/supabase/supabase/functions/invite-candidate/index.ts | `first_name: firstName,` |
| 29 | candidate-app/pre-registration-and-invitation | fact | The invited user's metadata carries `candidate_id` and `project_id` | apps/supabase/supabase/functions/invite-candidate/index.ts | `data: { candidate_id: candidate.id, project_id: projectId },` |
| 30 | candidate-app/pre-registration-and-invitation | fact | The invitation's redirect target | apps/supabase/supabase/functions/invite-candidate/index.ts | `/candidate/complete-registration` |
| 31 | candidate-app/pre-registration-and-invitation | env | `SITE_URL` is required, with no fallback | apps/supabase/supabase/functions/invite-candidate/index.ts | `requireEnv('SITE_URL', Deno.env.get('SITE_URL'))` |
| 32 | candidate-app/pre-registration-and-invitation | flow | A failed invitation deletes the candidate row | apps/supabase/supabase/functions/invite-candidate/index.ts | `// Rollback: delete candidate record since invite failed` |
| 33 | candidate-app/pre-registration-and-invitation | flow | A failed invitation returns 500 | apps/supabase/supabase/functions/invite-candidate/index.ts | `Failed to send invite email` |
| 34 | candidate-app/pre-registration-and-invitation | flow | Step 3 writes the candidate grant with `writeEntityGrant` | apps/supabase/supabase/functions/invite-candidate/index.ts | `entityType: 'candidate',` |
| 35 | candidate-app/pre-registration-and-invitation | fact | The grant is at entity scope | apps/supabase/supabase/functions/invite-candidate/entityGrant.ts | `scope: 'entity',` |
| 36 | candidate-app/pre-registration-and-invitation | fact | The grant role is `editor` | apps/supabase/supabase/functions/invite-candidate/entityGrant.ts | `role: 'editor'` |
| 37 | candidate-app/pre-registration-and-invitation | fact | A grant that already exists counts as written | apps/supabase/supabase/functions/invite-candidate/entityGrant.ts | `const IDEMPOTENT_GRANT_KEY = 'grants_user_scope_target_role_key';` |
| 38 | candidate-app/pre-registration-and-invitation | flow | A failed grant write calls `rollbackInvite` | apps/supabase/supabase/functions/invite-candidate/index.ts | `await rollbackInvite(supabaseAdmin, { candidateId: candidate.id, userId: inviteData.user.id });` |
| 39 | candidate-app/pre-registration-and-invitation | flow | `rollbackInvite` deletes the invited auth user | apps/supabase/supabase/functions/invite-candidate/index.ts | `await supabaseAdmin.auth.admin.deleteUser(userId);` |
| 40 | candidate-app/pre-registration-and-invitation | fact | Deleting the auth user deletes its grants | apps/supabase/supabase/schema/300-auth-tables.sql | `user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,` |
| 41 | candidate-app/pre-registration-and-invitation | flow | A failed grant write returns 500 | apps/supabase/supabase/functions/invite-candidate/index.ts | `Failed to grant the invited candidate access to their own record` |
| 42 | candidate-app/pre-registration-and-invitation | flow | Success returns 201 | apps/supabase/supabase/functions/invite-candidate/index.ts | `{ status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }` |
| 43 | candidate-app/pre-registration-and-invitation | fact | The response carries `candidateId` and `userId` | apps/supabase/supabase/functions/invite-candidate/index.ts | `candidateId: candidate.id,` |
| 44 | candidate-app/pre-registration-and-invitation | flow | Any other error is logged and answered with a generic 500 | apps/supabase/supabase/functions/invite-candidate/index.ts | `console.error('invite-candidate error:', err);` |
| 45 | candidate-app/pre-registration-and-invitation | flow | A candidate without a nomination is turned away with `candidateNoNomination` | apps/frontend/src/routes/candidate/(protected)/+layout.server.ts | `return await handleError('candidateNoNomination');` |
| 46 | candidate-app/pre-registration-and-invitation | flow | The protected layout's error path signs the candidate out | apps/frontend/src/routes/candidate/(protected)/+layout.server.ts | `.signOut({ scope: 'local' })` |
| 47 | candidate-app/pre-registration-and-invitation | path | `bulk_import` exists | apps/supabase/supabase/schema/501-bulk-operations.sql | `CREATE OR REPLACE FUNCTION public.bulk_import (p_data jsonb)` |
| 48 | candidate-app/pre-registration-and-invitation | fact | The local stack uses Supabase Auth's default invite template | apps/supabase/supabase/config.toml | `# [auth.email.template.invite]` |
| 49 | candidate-app/pre-registration-and-invitation | flow | The callback reads `token_hash` | apps/frontend/src/routes/api/candidate/auth/callback/+server.ts | `url.searchParams.get('token_hash')` |
| 50 | candidate-app/pre-registration-and-invitation | flow | The callback reads `type` | apps/frontend/src/routes/api/candidate/auth/callback/+server.ts | `url.searchParams.get('type')` |
| 51 | candidate-app/pre-registration-and-invitation | flow | `verifyOtp` runs on the request's own client | apps/frontend/src/routes/api/candidate/auth/callback/+server.ts | `await locals.supabase.auth.verifyOtp({ token_hash, type });` |
| 52 | candidate-app/pre-registration-and-invitation | flow | An invite link redirects to `CandAppSetPassword` with the email | apps/frontend/src/routes/api/candidate/auth/callback/+server.ts | `buildRoute({ route: 'CandAppSetPassword', locale, email: user?.email ?? '' })` |
| 53 | candidate-app/pre-registration-and-invitation | path | `CandAppSetPassword` is `/candidate/register/password` | apps/frontend/src/lib/routes/route.ts | `${CANDIDATE}/register/password` |
| 54 | candidate-app/pre-registration-and-invitation | flow | A missing parameter or failed verification redirects to login with `authError` | apps/frontend/src/routes/api/candidate/auth/callback/+server.ts | `buildRoute({ route: 'CandAppLogin', locale, errorMessage: 'authError' })` |
| 55 | candidate-app/pre-registration-and-invitation | fact | The E2E email fixture rewrites the verify link to the callback with `token_hash` | tests/tests/fixtures/shared/emailBucket.fixture.ts | `export function toCallbackUrl(verifyLink: string, callbackPath = '/en/api/candidate/auth/callback'): string {` |
| 56 | candidate-app/pre-registration-and-invitation | flow | The set-password page's invite branch condition | apps/frontend/src/routes/candidate/register/password/+page.svelte | `const isInviteFlow = candCtx.isAuthenticated && email !== '' && registrationKey === '';` |
| 57 | candidate-app/pre-registration-and-invitation | flow | The invite branch calls `setPassword` | apps/frontend/src/routes/candidate/register/password/+page.svelte | `const result = await setPassword({ password }).catch((e) => {` |
| 58 | candidate-app/pre-registration-and-invitation | flow | `_setPassword` calls `updateUser({ password })` | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `const { error } = await this.supabase.auth.updateUser({ password });` |
| 59 | candidate-app/pre-registration-and-invitation | flow | The page hands the email to the login page | apps/frontend/src/routes/candidate/register/password/+page.svelte | `candCtx.newUserEmail = email;` |
| 60 | candidate-app/pre-registration-and-invitation | flow | The login page fills in the handed-over email | apps/frontend/src/routes/candidate/login/+page.svelte | `email = candCtx.newUserEmail;` |
| 61 | candidate-app/pre-registration-and-invitation | fact | `preRegistration.enabled` is an app setting | packages/app-shared/src/settings/dynamicSettings.type.ts | `Whether pre-registration is enabled for the Candidate App.` |
| 62 | candidate-app/pre-registration-and-invitation | flow | The login page shows the pre-registration button when the setting is on | apps/frontend/src/routes/candidate/login/+page.svelte | `Whether the pre-registration button is shown and the login details collapsed.` |
| 63 | candidate-app/pre-registration-and-invitation | path | Pre-registration lives at `/candidate/preregister` | apps/frontend/src/lib/routes/route.ts | `CandAppPreregister: ` |
| 64 | candidate-app/pre-registration-and-invitation | flow | `/api/oidc/callback` keeps the ID token in an `httpOnly` cookie | apps/frontend/src/routes/api/oidc/callback/+server.ts | `cookies.set(COOKIE.idToken, idToken, {` |
| 65 | candidate-app/pre-registration-and-invitation | path | The candidate chooses an email address on its own page | apps/frontend/src/lib/routes/route.ts | `${CANDIDATE}/preregister/email` |
| 66 | candidate-app/pre-registration-and-invitation | path | The candidate chooses elections | apps/frontend/src/lib/routes/route.ts | `${CANDIDATE}/preregister/elections` |
| 67 | candidate-app/pre-registration-and-invitation | path | The candidate chooses constituencies | apps/frontend/src/lib/routes/route.ts | `${CANDIDATE}/preregister/constituencies` |
| 68 | candidate-app/pre-registration-and-invitation | flow | `/api/candidate/preregister` sends the ID token to `identity-callback` | apps/frontend/src/routes/api/candidate/preregister/+server.ts | `body: { id_token: idToken }` |
| 69 | candidate-app/pre-registration-and-invitation | flow | `identity-callback` finds the auth user by identity | apps/supabase/supabase/functions/identity-callback/index.ts | `let userId = await findUserByIdentityMatch(supabaseAdmin, identityMatchValue);` |
| 70 | candidate-app/pre-registration-and-invitation | flow | `identity-callback` finds the candidate through the editor grant | apps/supabase/supabase/functions/identity-callback/candidateRecord.ts | `.eq('role', 'editor');` |
| 71 | candidate-app/pre-registration-and-invitation | flow | `identity-callback` returns a sign-in (magic) link | apps/supabase/supabase/functions/identity-callback/index.ts | `type: 'magiclink',` |
| 72 | candidate-app/pre-registration-and-invitation | flow | The server route redeems the link for a session | apps/frontend/src/routes/api/candidate/preregister/+server.ts | `const { error: verifyError } = await locals.supabase.auth.verifyOtp({` |

## Findings for todos

## Sweep exceptions

## Key coverage
