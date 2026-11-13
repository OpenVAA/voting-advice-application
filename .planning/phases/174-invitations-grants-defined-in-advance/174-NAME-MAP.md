# Phase 174 — Name and Fact Map

**Written by:** plan 174-01, Task 1 (the `## Baseline` section by Task 2).

tree_read: 2297c643969493a765a22bb9ea4a6a6b004b5841

branch: `feat/entity-signup-multi-grant` — the tree as Phases 170 to 173 left it. The last commit outside `.planning/` is `2ea3b9d8d` (`git log -1 --format=%h -- . ':(exclude).planning'`); every commit after it, the two driver commits of this plan included, touches `.planning/` alone.

The ten plans of this phase were written while Phase 172 was executing and before Phase 173 started. **Where a plan and this file disagree, this file is the authority and no plan is edited.** Every count below is a snapshot for later comparison, never a target.

Abbreviations: `F` = `apps/frontend/src`, `P` = `apps/frontend/src/routes/contestant/(protected)`, `S` = `apps/supabase/supabase`, `T` = `tests/tests`. `git grep -E` on this host understands neither `\b` nor `\s`; the commands use `-F` or `-P`.

**Verdict:** every cited name resolves to something on the tree. Three rows of `## Names` are marked DIFFERS and three rows of `## Facts re-measured` say `differs:`; the ones that change what a later task does are listed under `## What differs and which plan it touches` at the end, with the notes that are not differences but that a later plan will trip over without them.

## Preconditions

| Phase directory | `ls <dir> \| grep -c -- '-PLAN.md'` | `ls <dir> \| grep -c -- '-SUMMARY.md'` | Verdict |
|---|---|---|---|
| `.planning/phases/172-terms-of-use-per-user-and-project/` | 9 | 9 | executed in full |
| `.planning/phases/173-multi-entity-grants-entity-selection/` | 13 | 13 | executed in full |

Node: `$HOME/.nvm/versions/node/v24.21.0/bin` exists; `node --version` prints `v24.21.0`. `174-RESEARCH.md` and `COVERAGE.md` are in this phase's directory (`ls`), with `174-VALIDATION.md` and `174-proto/`.

**Phase 175 has not executed and is not planned.** `ls -d .planning/phases/175*` matches nothing; `ROADMAP.md` has `### Phase 175: Organization Editing — Profile, Questions & Preview`. PLAN count 0, SUMMARY count 0. Schema edits are serial: this phase regenerates the migration after Phase 173, and Phase 175 will regenerate it after this one (O-11).

**D-07, read-only — verdict: record already corrected.** Neither sentence carries the text `UNRESOLVED` (`grep -n "UNRESOLVED" .planning/ROADMAP.md .planning/REQUIREMENTS.md` hits `REG-05` and a criterion of Phase 179, and neither sentence below). Neither file was edited, and no task of this phase edits `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, `CLAUDE.md` or `CAND-APP-PLAN.md`.

- `REQUIREMENTS.md` INV-02: "A duplicate invitation is refused and the first is left unchanged: a second invitation in the project carrying the same email for the same grant target `(scope, target type, target id)`, whatever role it promises, or carrying a code the project already holds, whatever its target. (amended 2026-10-06, 174-A3 (c), 174-B3)"
- `ROADMAP.md` § Phase 174, criterion 2: "A duplicate invitation is refused, and the first is left unchanged: a second invitation in the project carrying the same email for the same grant target `(scope, target type, target id)`, whatever role it promises, or carrying a code the project already holds, whatever its target (INV-02). (amended 2026-10-06, 174-A3 (c), 174-B3)"

## Names

One row per role. A row whose tree name differs from the name these plans use carries the word DIFFERS.

### What Phase 172 left

| Role | Name these plans use | Name found on the tree | Command that found it |
|---|---|---|---|
| Terms-of-use table | `public.terms_of_use_acceptances` and its schema file | `public.terms_of_use_acceptances (user_id uuid DEFAULT auth.uid() → auth.users ON DELETE CASCADE, project_id uuid → public.projects ON DELETE CASCADE, accepted_at timestamptz DEFAULT now(), PRIMARY KEY (user_id, project_id))` in `S/schema/304-terms-of-use-acceptances.sql`; `idx_terms_of_use_acceptances_project_id` | `git grep -n -A8 -E "CREATE TABLE.*terms_of_use_acceptances" -- apps/supabase/supabase/schema` |
| Forced registration | `forceRegister` with its options parameter and the acceptance opt-out | `async forceRegister(candidateExternalId, email, password, options: { acceptTermsOfUse?: boolean } = {})` in `T/utils/supabaseAdminClient.ts`; acceptance is recorded unless `options.acceptTermsOfUse === false` (`options.acceptTermsOfUse !== false`). Beside it `forceRegisterUser(email, password, options: { entityGrants?: ReadonlyArray<EntityGrantTarget>; acceptTermsOfUse?: boolean } = {})` and `forceRegisterAdmin(email, password)` | `git grep -n -F "acceptTermsOfUse" -- tests/tests/utils/supabaseAdminClient.ts` |
| Public acceptance helper | the public acceptance helper | `async acceptTermsOfUse(email)`, which calls the protected `insertTermsOfUseAcceptance(userId, caller)` (the one shared write, into `terms_of_use_acceptances`) | same |
| Cleanup helpers | `unregisterCandidate`, `deleteAllTestUsers`; whether either still resets a terms-of-use column | both there; neither resets a column. The only terms-of-use text near them is `unregisterCandidate`'s docblock: "The user's terms-of-use acceptances go with the auth user" (the cascade) | `git grep -n -i -E "terms_of_use\|termsOfUse" -- tests/tests/utils/supabaseAdminClient.ts` |
| Gate list of the protected layout | the ordered gate list | `CONTESTANT_GATES` (one entry: `{ id: 'termsOfUse', isNeeded: (user) => user.termsOfUseAccepted == null }`), `ContestantGateId = 'termsOfUse'`, `ContestantGate`, `firstNeededGate` in `F/lib/contestant/gates/gates.ts`; `GATE_VIEWS` in `gateViews.ts`; imported as `$contestant/gates/gates` | `git grep -n -E "^export " -- apps/frontend/src/lib/contestant/gates` |

### What Phase 173 left

| Role | Name these plans use | Name found on the tree | Command that found it |
|---|---|---|---|
| User-level list function | `get_user_entities` | `public.get_user_entities (p_project_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER`; returns one object `{ entities: [...] }`, one row even for a caller with no entity | `grep -n -E "^CREATE (OR REPLACE )?FUNCTION\|SECURITY (INVOKER\|DEFINER)" S/schema/503-entity-rpcs.sql` |
| One-entity read | `get_entity_user_data` | `public.get_entity_user_data (p_project_id, p_entity_type, p_entity_id) … LANGUAGE sql STABLE SECURITY INVOKER`; at most one row. Its condition is `id IN (the caller's …)` through `private.caller_entity_ids` (`301-auth-functions.sql`), the one definer call on the path | same |
| Contestant entry shapes | `CONTESTANT_GRANTS` | `CONTESTANT_GRANTS = [{ scope: 'entity', role: 'editor', target_type: 'candidate' }, { scope: 'entity', role: 'editor', target_type: 'organization' }]` in `F/lib/auth/roles.ts` | `grep -n -A8 -E "^export const (CONTESTANT_GRANTS\|ADMIN_GRANTS)" F/lib/auth/roles.ts` |
| Admin entry shapes | `ADMIN_GRANTS` | `ADMIN_GRANTS = [{ scope: 'global', role: 'admin' }, { scope: 'account', role: 'admin' }, { scope: 'project', role: 'admin' }]`; no editor shape | same |
| Other exports of `roles.ts` | — | `hasAnyGrant`, `readGrants`, `GrantClaim`, `GrantShape = { scope; role; target_type? }`, `GRANT_SCOPES`, `GRANT_ROLES`, `GrantScope`, `GrantRole` | `git grep -n -P "^export (const\|function\|type)" -- apps/frontend/src/lib/auth/roles.ts` |
| Password login | `passwordLogin`, `PasswordLoginContext`, `PasswordLoginOutcome` in `passwordLogin.ts`; the `$lib/auth` barrel | all three in `F/lib/auth/passwordLogin.ts`. `PasswordLoginContext = { auth: { signInWithPassword(…), signOut({ scope: 'local' }) }, getSession(): Promise<{ session: { access_token } \| null; user: { id } \| null }> }`. `PasswordLoginOutcome` = `{ ok: true; session; user }` \| `400 invalidCredentials` \| `500 noSession` \| `403 grantNotAllowed`. Order inside: sign in → `context.getSession()` → `hasAnyGrant(readGrants(token), allowedGrants)`, else `signOut` and 403. The barrel `F/lib/auth/index.ts` re-exports `getUserData`, `passwordLogin`, `roles` | `sed -n '26,110p' apps/frontend/src/lib/auth/passwordLogin.ts`; `cat apps/frontend/src/lib/auth/index.ts` |
| The two login actions | `F/routes/contestant/login/+page.server.ts`, `F/routes/admin/login/+page.server.ts` and the context each passes | both there; each passes `context: { auth: locals.supabase.auth, getSession: locals.safeGetSession }`, with `allowedGrants: CONTESTANT_GRANTS` and `ADMIN_GRANTS`; each redirects 303 to a validated `redirectTo` or its app's home | `grep -n -E "passwordLogin\|allowedGrants\|context:" <the two files>` |
| User-level load | the user-level server load under `P` | `P/+layout.server.ts`. Stages: session (none → 307 to `ContestantAppLogin`); `dataWriter.getBasicUserData()` (failure → `signOutToLogin(locals, lang, 'loginFailed')`); `firstNeededGate(user)` (a gate → `return { gate, user }`); `getUserEntities({ locale })` filtered by `getServedEntityTypes(appSettings)`; returns `{ gate: null, user, entities }` | `sed -n '36,90p' "P/+layout.server.ts"` |
| Root load and its three outcomes | the root's three outcomes | `P/+page.server.ts`: a pending gate → `{}`; exactly one entity → `redirect` to its home; else `{ view: entities.length === 0 ? 'nothingToEdit' : 'select' }` | `grep -n -E "redirect\(\|return \{\|entities" "P/+page.server.ts"` |
| Entity-level load | the entity-level server load | `P/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts`: not listed → 307 to the app root; `getEntityUserData({ type, id, loadNominations: true })`; no nomination → `signOutToLogin(…, 'candidateNoNomination')` | `grep -n -E "getEntityUserData\|redirect\(\|signOutToLogin" <the file>` |
| Sign-out helper | `signOutToLogin` | `export async function signOutToLogin(…)` in `F/lib/server/contestant/signOutToLogin.ts` | `git grep -n -E "export (async )?function signOutToLogin" -- apps/frontend/src` |
| "Nothing to edit" view | the view component, its test ids, the registry keys | `F/lib/contestant/components/nothingToEdit/NothingToEdit.svelte` (takes `title` and `children`); test ids `contestant-nothing-to-edit` (the view), `contestant-nothing-to-edit-logout` (its `LogoutButton`), `contestant-nothing-to-edit-email`; registry `testIds.contestant.nothingToEdit.{container,email,logout}` in `T/utils/testIds.ts` | `grep -n "data-testid" <the component>`; `git grep -n -A6 -F "nothingToEdit" -- tests/tests/utils/testIds.ts` |
| Grant helpers on the E2E admin client | `grantEntity` | `async grantEntity(email, target: EntityGrantTarget)` and `async revokeEntityGrant(email, target)`; the private `grantEntityToUser(userId, target, caller)` is the one insert into `grants` | `git grep -n -P "(grantEntity\|revokeEntityGrant\|grantEntityToUser)\(" -- tests/tests/utils/supabaseAdminClient.ts` |
| Tests' entity-URL helper | the tests' entity-URL helper | `T/utils/contestantEntityUrl.ts`: `ENTITY_SEGMENT_SOURCE`, `contestantUrlRe(subPath, tail)`, `contestantUrlOutsideRe`, `contestantHomeUrlRe`, `isContestantHomePath`, `contestantAppRootUrlRe`, `isContestantAppRootPath`, `dropEntitySegments`, `buildEntityLessRoute` | `git grep -n -E "^export " -- tests/tests/utils/contestantEntityUrl.ts` |
| Stored-session helper | `registerAndStoreSession` | exported from the plain module `T/setup/shared/registerAndStoreSession.ts`, with `StoredSessionIdentity` (its `acceptTermsOfUse: boolean` is required) | `git grep -n -E "^export " -- tests/tests/setup/shared/registerAndStoreSession.ts` |
| The three identities and the projects | the three identities and the Playwright projects Phase 173 added | `TEST_MULTI_ENTITY_EMAIL`, `TEST_NO_ENTITY_EMAIL`, `TEST_LOGOUT_ENTITY_EMAIL` with `MULTI_ENTITY_STORAGE_STATE` and `NO_ENTITY_STORAGE_STATE` in `T/utils/testCredentials.ts`; projects `data-setup-entity-selection`, `data-teardown-entity-selection`, `contestant-entity-selection` in `tests/playwright.config.ts`; the setup is `T/setup/contestant/entity-selection.setup.ts` (three `setup(…)` tests) | `git grep -n -E "^export const" -- tests/tests/utils/testCredentials.ts`; `git grep -n -P "name: '(data-setup\|data-teardown\|contestant)-entity-selection'" -- tests/playwright.config.ts` |
| Dedicated dataset rows | the rows Phase 173 added to `packages/dev-seed/src/templates/e2e/base.ts` | `test-e2e-base-ca-sel-a`, `test-e2e-base-ca-sel-b` (candidates) and `test-e2e-base-or-sel` (organization), each `confirmed: false`. The older unconfirmed row `test-e2e-base-ca-aa-unregistered` is the journey's (`UNREGISTERED_CANDIDATE_EXTERNAL_ID`) | `git grep -n -i -E "confirmed: false" -- packages/dev-seed/src/templates/e2e/base.ts` |
| Dev-seed tests that pin rows of the base dataset | the dev-seed tests that pin row counts | `packages/dev-seed/tests/templates/base.test.ts` (pins `fixedOf('elections')` 2, `constituency_groups` 2, `constituencies` 6, `alliances` 2, `question_categories` 8, one nomination per candidate, and relations; no candidate or organization count), `base-app-settings.test.ts`, `built-in-templates-contestant-app.test.ts`. The counts 8 and 327 in `default.test.ts` and the integration test are the `default` template's | `git grep -n -P "toHaveLength\(\d+\)\|toBe\(\d+\)" -- packages/dev-seed/tests/templates/base.test.ts` |
| Gated integration test | the adapter-level integration test, its variable, its command | `F/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts`: `describe.skipIf(!process.env.SUPABASE_URL)`; `CONTESTANT_WRITER_INTEGRATION_REQUIRED=1` makes an unset `SUPABASE_URL` a failure. Command from its docblock: `SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… CONTESTANT_WRITER_INTEGRATION_REQUIRED=1 yarn workspace @openvaa/frontend vitest run supabaseDataWriter.integration`. Its seven tests are the 7 skipped of the default unit run | `grep -n -E "CONTESTANT_WRITER_INTEGRATION\|SUPABASE_" <the file>` |
| Pending todo for this phase | the todo that names Phase 174 and the token refresh | `.planning/todos/pending/2026-10-06-173-refresh-the-session-after-a-claim.md` | `ls .planning/todos/pending \| grep 173` |
| Phase 173's drivers | `173-gates.sh`, `173-e2e.sh`, `173-verdict.mjs`, their rows and flags | twelve rows (`typecheck lint types-regen types-clean sql-lint pgtap unit check-frontend build format docs-links name-gate-self-test`), `types-regen` being the reset followed by the types; flags `--rows`; `--project`; `--allow-slice`, `--min-total-of`, `--same-projects-as`, `--except`, `--expect-project`; subcommands `gates`, `e2e`, `greps`, `exemptions`. **DIFFERS in this phase's copies by design:** fifteen rows, the reset is its own row `db-reset`, `pgtap` precedes `sql-lint`, and `greps` takes `--only` | the three files' headers |

### The schema

| Role | Name these plans use | Name found on the tree | Command that found it |
|---|---|---|---|
| Grants table | `public.grants`, its four spec columns | `scope grant_scope_type NOT NULL`, `target_type entity_type` (nullable), `target_id uuid` (nullable), `role grant_role_type NOT NULL`; also `id`, `user_id uuid NOT NULL → auth.users ON DELETE CASCADE`, `created_at`. Enums: `grant_scope_type ('global','account','project','entity')`, `grant_role_type ('admin','editor')`, `entity_type` (`000-enums.sql`) | `awk '/^CREATE TABLE public\.grants/{f=1} f{print} f&&/^\);/{exit}' S/schema/300-auth-tables.sql` |
| Its constraints | `grants_user_scope_target_role_key`, `grants_entity_scope_target_type_check`, `grants_target_id_scope_check` | `UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role)`; `CHECK ((target_type IS NOT NULL) = (scope = 'entity'))`; `CHECK ((target_id IS NULL) = (scope = 'global'))` | same |
| One-editor index | `idx_grants_one_candidate_editor` | `CREATE UNIQUE INDEX idx_grants_one_candidate_editor ON public.grants (target_id) …` (kept); also `idx_grants_scope_target (scope, target_type, target_id)` | `grep -n -E "CREATE (UNIQUE )?INDEX" S/schema/300-auth-tables.sql` |
| Privileges on `grants` | not writable by an API role | `REVOKE ALL ON TABLE public.grants …`; policies `auth_admin_read_grants` (SELECT, `supabase_auth_admin`) and `service_role_manage_grants` (ALL, `service_role`) | `grep -n -E "(REVOKE\|CREATE POLICY)" S/schema/300-auth-tables.sql` |
| Cleanup trigger | `cleanup_grants_on_delete` and its tables | `public.cleanup_grants_on_delete () … SECURITY DEFINER`, six triggers of that name: `('account')`, `('project')`, `('entity', 'candidate')`, `('entity', 'organization')`, `('entity', 'faction')`, `('entity', 'alliance')` | `grep -n "cleanup_grants_on_delete" S/schema/300-auth-tables.sql` |
| Token hook | `custom_access_token_hook` and the four keys | `public.custom_access_token_hook (p_event jsonb) RETURNS jsonb`; `jsonb_build_object('scope', …, 'target_type', …, 'target_id', …, 'role', …)` | `grep -n -A5 "jsonb_build_object" S/schema/301-auth-functions.sql` |
| Role permissions | `grant_role_permissions`, argument order, the empty-set shapes | `public.grant_role_permissions (p_scope grant_scope_type, p_role grant_role_type, p_target_type …)`; the last arm: "Everything else, including global+editor, account+editor and entity+admin: the empty set" → `ARRAY[]::public.grant_permission[]` | `awk '/FUNCTION public\.grant_role_permissions/{f=1} f{print}' S/schema/301-auth-functions.sql` |
| Authority predicate | `user_can` | `public.user_can (p_scope grant_scope_type, p_target_id uuid, p_permission grant_permission, p_target_type entity_type DEFAULT NULL) RETURNS boolean … STABLE SECURITY DEFINER`; it reads the token's `grants` claim | `grep -n -A6 "FUNCTION public.user_can" S/schema/301-auth-functions.sql` |
| Entity → project | `private.entity_project_id` | there, in `301-auth-functions.sql`; beside it `private.caller_entity_ids`, `private.entity_has_confirmed_nomination`, `public.project_open_for_voters`, `public.user_has_account_grant` | `grep -n -E "^CREATE (OR REPLACE )?FUNCTION" S/schema/301-auth-functions.sql` |
| Immutability trigger | `enforce_entity_immutability` | `public.enforce_entity_immutability () RETURNS TRIGGER … SECURITY INVOKER` in `011-validation-functions.sql`; `IF current_user <> 'authenticated' THEN` returns early; a change of `confirmed` asks `user_can('entity', NEW.id, 'entity.confirm', v_entity_type)`; on a confirmed row the columns named in `TG_ARGV` ask `entity.edit_immutable`. Attached `BEFORE UPDATE OF …` in `102-entities.sql` (`('name')` on organizations, `first_name, …` on candidates) | `sed -n '489,520p' S/schema/011-validation-functions.sql` |
| Rate-limit precedent | `private.feedback_rate_limits` and its take function | table `private.feedback_rate_limits`; `private.feedback_client_ip (p_headers json, p_trust_cf_connecting_ip boolean)`; the trigger function `public.check_feedback_rate_limit () … SECURITY DEFINER`; `private.deployment_settings.behind_cloudflare` | `grep -n -E "CREATE TABLE\|CREATE (OR REPLACE )?FUNCTION" S/schema/107-feedback.sql` |
| Mail variables | `resolve_email_variables` with its REVOKE and GRANT block | `public.resolve_email_variables (uuid, uuid[], text, text)`; `REVOKE EXECUTE … FROM …` then `GRANT EXECUTE … TO service_role` | `grep -n -E "resolve_email_variables\|^REVOKE\|^GRANT" S/schema/502-email-helpers.sql` |
| `external_id` inside a project | how `501-bulk-operations.sql` resolves it | `'SELECT id FROM public.%I WHERE project_id = $1 AND external_id = $2'`; upsert `ON CONFLICT (project_id, external_id) WHERE external_id IS NOT NULL` | `grep -n -i "external_id" S/schema/501-bulk-operations.sql` |
| Name columns of the four entity tables | — | `organizations`: `name jsonb`, `short_name jsonb`; `candidates`: `first_name text NOT NULL`, `last_name text NOT NULL`, `short_name jsonb`; `factions` and `alliances`: `name jsonb`, `short_name jsonb`. `confirmed boolean NOT NULL DEFAULT false` on all four | `grep -n -E "^CREATE TABLE\|^\s+(name\|short_name\|first_name\|last_name\|confirmed)\b" S/schema/102-entities.sql` |
| Free schema numbers | 305 and 506 | highest `3xx` is `304-terms-of-use-acceptances.sql`, highest `5xx` is `505-question-rpcs.sql`: **305 and 506 are free**, as planned. 27 schema files | `git ls-tree --name-only HEAD apps/supabase/supabase/schema/` |
| Free pgTAP number | 39 | highest is `38-contestant-app-public-config.test.sql`; 36 and 37 are Phase 173's and Phase 172's: **39 is free**, as planned. 38 files (no file 13) | `git ls-tree --name-only HEAD apps/supabase/supabase/tests/database/` |

### The database tests and the linter

| Role | Name these plans use | Name found on the tree | Command that found it |
|---|---|---|---|
| Definer census | `07-rpc-security.test.sql`, the section, both strings, both lists | "Section 8c: the SECURITY DEFINER surface PostgREST publishes". `anon`: `'contestant_app_public_config,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant'`, described `'census: the SECURITY DEFINER functions in public that anon can execute are exactly the six allow-listed ones'`. `authenticated`: the same six with `get_entity_basic_data` after `contestant_app_public_config` (seven, comma-joined, sorted), described `'census: the SECURITY DEFINER functions in public that authenticated can execute are the same six plus get_entity_basic_data'` | `git grep -n -E "exactly the six allow-listed ones\|same six plus\|^    'contestant_app_public_config," -- S/tests/database/07-rpc-security.test.sql` |
| Enforcement census | `m17_unenforced_ratified`, its members, the comment above | six members: `account.manage_admins`, `project.manage_editors`, `entity.invite_children`, `entity.edit_immutable`, `entity.confirm`, `nomination.confirm`. Comment: "account.manage_admins: grant administration; public.grants carries no user-facing policy at all." / "project.manage_editors: the same." / "entity.invite_children: the same, at entity scope …" | `sed -n '176,203p' S/tests/database/25-matrix-conformance.test.sql` |
| Linter allow-lists | `SAME_PERMISSION_ALLOW`, `MECHANISM_HELPERS`, `REACHES_NEITHER_ALLOW`, the form of an entry | `apps/supabase/scripts/lint-schema.mjs`. `SAME_PERMISSION_ALLOW`: one entry, `['public', 'admin_jobs', 'project.edit_questions']` (`[schema, table, permission]`, a `//` reason line above). `MECHANISM_HELPERS`: five names (`project_open_for_voters`, `entity_has_confirmed_nomination`, `storage_path_is_public`, `storage_path_can`, `user_has_account_grant`). `REACHES_NEITHER_ALLOW`: ten entries `[schema, table, policy]`, two of them for `terms_of_use_acceptances` | `awk` over each `const … = [` block of the file |
| pgTAP helpers | `create_test_data`, `set_test_user`, `reset_role`, `test_user_id`, `test_id`, `test_user_grants` | all in `00-helpers.test.sql`. `test_user_id` names `admin_a`, `admin_b`, `candidate_a`, `candidate_b`, `organization_a`, `super_admin`, `account_admin_a`, `candidate_a2`. `set_test_user (p_role text, p_user_id uuid DEFAULT NULL, p_user_grants jsonb DEFAULT '[]'::jsonb)`. Also `test_seed_identity_grants`, `test_seed_fixture_grants`, `test_grants_claim`, `set_test_grants`, `test_rls_digest` | `grep -n -E "^CREATE (OR REPLACE )?FUNCTION" S/tests/database/00-helpers.test.sql` |

### The configuration

| Role | Name these plans use | Name found on the tree | Command that found it |
|---|---|---|---|
| Auth keys of `S/config.toml` | `[auth] enable_signup`, `[auth.email] enable_signup`, `[auth.email] enable_confirmations`, `[auth] site_url`, `additional_redirect_urls` | `[auth]`: `site_url = "http://127.0.0.1:5173"`, `additional_redirect_urls = ["https://127.0.0.1:3000", "http://localhost:5173/api/auth/callback", "http://localhost:5173/*/api/auth/callback"]`, `jwt_expiry = 3600`, `enable_signup = true`, `minimum_password_length = 6`. `[auth.rate_limit]`: `email_sent = 2`, `sign_in_sign_ups = 30`, `token_verifications = 30`. `[auth.email]`: `enable_signup = true`, `double_confirm_changes = true`, `enable_confirmations = false`, `max_frequency = "1s"`, `otp_expiry = 3600`. A second `enable_signup = false` / `enable_confirmations = false` pair further down belongs to another provider table, so an edit anchors on the table header, never on the key alone | `grep -n -E "^\[\|^(enable_signup\|enable_confirmations\|site_url\|additional_redirect_urls\|policy\|…) =" S/config.toml` |
| Edge runtime keys | `[edge_runtime] policy`, `[edge_runtime.secrets]`, any `[functions.*]` | `[edge_runtime]` with `policy = "oneshot"`; `[edge_runtime.secrets]` exists; **no `[functions.*]` table** | `grep -n -E "^\[functions\|^\[edge_runtime" S/config.toml` |
| Root template | `.env.example`: `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` and the comments above | `SITE_URL=http://127.0.0.1:5173` under "identity-callback and invite-candidate: origin used to build post-login redirects and invite links. Throws when unset; there is no fallback origin."; `SMTP_HOST=inbucket`, `SMTP_PORT=1025`, `SMTP_FROM=noreply@openvaa.org` under "send-email: local mail catcher (Mailpit, reached by its `inbucket` network alias on its in-network SMTP port 1025 …). Each of the three throws when unset." | `grep -n -B3 -E "^(SITE_URL\|SMTP_HOST\|SMTP_PORT\|SMTP_FROM)=" .env.example` |
| Functions' template | `S/functions/.env.example`, the same four lines | `SITE_URL=http://127.0.0.1:5173` under "The site origin candidate links are addressed to. Must match `config.toml` `[auth].site_url`. There is deliberately no fallback: an invite link …"; `SMTP_HOST=inbucket`, `SMTP_PORT=1025`, `SMTP_FROM=noreply@openvaa.org` | the same command on that file |

### The Edge Functions

| Role | Name these plans use | Name found on the tree | Command that found it |
|---|---|---|---|
| Function directories | the directories under `S/functions/` | `identity-callback`, `invite-candidate`, `send-email`, each with an `index.ts` | `ls apps/supabase/supabase/functions` |
| Duplicated modules | the copies of `envConfig.ts` (and `jwtSegment.ts`, `callerAuthority.ts`) | `envConfig.ts` ×3 (all three functions); `jwtSegment.ts` ×2 and `callerAuthority.ts` ×2 (`invite-candidate`, `send-email`). Tests: `envConfig.test.ts` and `callerAuthority.test.ts` exist in `invite-candidate` only; `jwtSegment.test.ts` in both | `find apps/supabase/supabase/functions -name envConfig.ts -o -name jwtSegment.ts -o -name callerAuthority.ts \| sort`; `ls` of each directory |
| `send-email` imports and transport | the two `npm:` import lines, the block that builds the transport | `import { createClient } from 'npm:@supabase/supabase-js@2.117.2';` and `import nodemailer from 'npm:nodemailer@10.0.11';`; `requireEnv('SMTP_HOST' \| 'SMTP_PORT' \| 'SMTP_FROM', Deno.env.get(…))`, `parseInt(…, 10)` for the port, then `nodemailer.createTransport(transportConfig)` | `grep -n -E "from 'npm:\|createTransport\|requireEnv\(" S/functions/send-email/index.ts` |
| `identity-callback` link | the `generateLink` call | `supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: placeholderEmail, options: { redirectTo: \`${redirectSiteUrl}/contestant\` } })`, `redirectSiteUrl = requireEnv('SITE_URL', …)`; its user is created with `auth.admin.createUser({ email: placeholderEmail, email_confirm: true, app_metadata: … })` | `grep -n -B2 -A6 "generateLink" S/functions/identity-callback/index.ts` |
| Duplicated-module gate | `DUPLICATED_MODULES` and check 3 | `const DUPLICATED_MODULES = ['envConfig.ts', 'jwtSegment.ts', 'callerAuthority.ts'];` in `scripts/assert-edge-env-defaults.mjs`; `if (copies.length < 2)` fails; "Check 3 — every module that has a test beside it stays reachable from vitest" | `grep -n -E "DUPLICATED_MODULES\|copies\.length\|Check 3" scripts/assert-edge-env-defaults.mjs` |
| Project-scoping gate lists | `PROJECT_SCOPED_EDGE_FUNCTIONS`, `PROJECT_SCOPED_RPCS`, `PROJECT_SCOPED_TABLES`, `NON_PROJECT_SCOPED_TABLES` | in `scripts/assert-project-scoped-queries.mjs`. Functions: `'invite-candidate': 'requires a project term'`, `'send-email': 'requires a project term'`, `'identity-callback': 'scoped-by-deployment: PUBLIC_PROJECT_ID'`. RPCs (nine): `get_nominations`, `get_questions`, `get_user_entities`, `get_entity_user_data`, `project_open_for_voters`, `contestant_app_public_config` (each `'requires p_project_id'`), `upsert_answers`, `merge_question_custom_data`, `user_can` (each `'scoped-by-identity: …'`). Tables (fourteen): `admin_jobs`, `alliances`, `app_settings`, `candidates`, `constituencies`, `constituency_groups`, `elections`, `factions`, `feedback`, `nominations`, `organizations`, `question_categories`, `questions`, `terms_of_use_acceptances`. Not project-scoped (six): `accounts`, `constituency_group_constituencies`, `election_constituency_groups`, `projects`, `storage_config`, `grants`. The gate scans `apps/frontend/src` | `awk` over each `const … = ` block of the file |
| Function-name loop of the gate's test | the loop in `packages/dev-seed/tests/projectScopingGate.test.ts` | `for (const fn of ['invite-candidate', 'identity-callback', 'send-email']) {` | `grep -n -F "invite-candidate" packages/dev-seed/tests/projectScopingGate.test.ts` |
| Vitest include of `apps/supabase` | — | `include: ['supabase/functions/**/*.test.ts']` in `apps/supabase/vitest.config.ts`; 15 files, 206 tests in the baseline | `grep -n include apps/supabase/vitest.config.ts` |

### The frontend

| Role | Name these plans use | Name found on the tree | Command that found it |
|---|---|---|---|
| Auth callback and its arms | `F/routes/api/auth/callback/+server.ts` | `GET`: reads `token_hash`, `type` (`EmailOtpType`), `next`; `locals.supabase.auth.verifyOtp({ token_hash, type })`; arms: `recovery` → `ContestantAppResetPassword`; `invite` → `ContestantAppSetPassword` with `email`; `email` / `signup` → `safeRedirectTarget(next)` or `ContestantAppHome`; anything else and every failure → `ContestantAppLogin` with `errorMessage: 'authError'`. No `magiclink` arm; it never claims and never refreshes | `grep -n -E "type ===\|verifyOtp\|redirect\(\|case " <the file>` |
| Session read | `safeGetSession` | `event.locals.safeGetSession`, made by `createSafeGetSession(supabase)` (`F/lib/supabase/safeGetSession`) in `supabaseHandle` of `F/hooks.server.ts`; typed in `F/app.d.ts` | `git grep -n -F "safeGetSession" -- apps/frontend/src/hooks.server.ts apps/frontend/src/app.d.ts` |
| Writer factory | `createDataWriter`, `AdapterSource` | `export function createDataWriter(source: AdapterSource): SupabaseDataWriter` in `F/lib/api/dataWriter.ts`; `export type AdapterSource` in `F/lib/api/dataProvider.ts` | `git grep -n -E "export (function\|type) (createDataWriter\|AdapterSource)" -- apps/frontend/src/lib` |
| Writer contract | `preregisterWithApiToken`, `checkRegistrationKey`, `register`, `CheckRegistrationData` in `dataWriter.type.ts` | all four; `CheckRegistrationData = DataApiActionResult & { email: string; firstName: string; lastName: string }` | `git grep -n -P "^\s+(preregisterWithApiToken\|checkRegistrationKey\|register)\b\|CheckRegistrationData" -- apps/frontend/src/lib/api/base/dataWriter.type.ts` |
| Public and abstract pairs | the public method and abstract `_`-method of each, in `universalDataWriter.ts` | `checkRegistrationKey` / `_checkRegistrationKey`; `register` / `_register`; `preregisterWithApiToken` / **`_preregister`** — DIFFERS from a same-named pair: the abstract twin drops `WithApiToken` | `git grep -n -P "(preregister\|checkRegistrationKey\|register)\w*\(" -- apps/frontend/src/lib/api/base/universalDataWriter.ts` |
| Supabase writer | `_preregister`, `scopedFrom`, `projectId`, one `.rpc(` call with its project argument | `_preregister` calls `this.supabase.functions.invoke('invite-candidate', { body: { …, projectId: this.projectId } })`; `this.scopedFrom('<table>')` for tables; `this.supabase.rpc('get_user_entities', { p_project_id: this.projectId, … })`; `_checkRegistrationKey` throws "checkRegistrationKey is not supported by the Supabase adapter. Use invite-based registration." `_getBasicUserData` tests `ADMIN_GRANTS` first, then `CONTESTANT_GRANTS`: `role` is `'admin'`, `'contestant'` or `null` | `grep -n -E "_preregister\|scopedFrom\(\|\.rpc\(\|functions\.invoke" F/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` |
| Adapter `utils/` and a zod-narrowing file | the adapter's `utils/` directory and one zod-narrowing file with its test | `F/lib/api/adapters/supabase/utils/`; `userEntities.ts` (zod, with `userEntities.test.ts`) is the newest example, `parseOutcome.ts` (`parseWithPartialPreserve`, with its test) the shared helper | `git grep -l -E "from 'zod'" -- apps/frontend/src/lib/api/adapters/supabase/utils` |
| Adapter boundary allow-list | `ADAPTER_BOUNDARY_ALLOWLIST` and the comment citing `SupabaseDataWriter._preregister` | in `apps/frontend/eslint.config.mjs`, fourteen entries, among them `src/routes/api/auth/callback/+server.ts`, `src/lib/server/contestant/signOutToLogin.ts`, both login actions, `src/routes/api/contestant/preregister/+server.ts`, `src/hooks.server.ts`. The comment: "158-MEDIUM: `functions.invoke('identity-callback')` plus `auth.verifyOtp`; `SupabaseDataWriter._preregister` already establishes the Edge-Function pattern." `F/lib/auth/passwordLogin.ts` is not on the list | `grep -n -E "ADAPTER_BOUNDARY_ALLOWLIST\|_preregister" apps/frontend/eslint.config.mjs` |
| Registration-code leg | `isRegistrationCodeLeg` and the set-password page's invitation leg | `export function isRegistrationCodeLeg({ isSetPasswordRoute, hasRegistrationKey })` in `F/routes/contestant/register/registrationCodeGuard.ts`, called by `register/+layout.server.ts`; `false` only for the set-password route without a key (the invitation leg) | `git grep -n -F "isRegistrationCodeLeg" -- apps/frontend/src` |
| Route keys | `AuthCallback`, `ContestantAppHome`, `ContestantAppLogin`, `ContestantAppSetPassword`, `ContestantAppResetPassword`, `AdminAppLogin`, `AdminAppHome` | all in `F/lib/routes/route.ts`: `AuthCallback: \`${API_ROOT}/auth/callback\``, `ContestantAppHome: CONTESTANT`, `ContestantAppLogin: …/login`, `ContestantAppSetPassword: …/register/password`, `ContestantAppResetPassword: …/password-reset`, `AdminAppHome: ADMIN`, `AdminAppLogin: …/login`; also `AuthLogout`, `ContestantAppForgotPassword`, `ContestantAppRegister`, six `ContestantAppPreregister*` keys | `git grep -n -P "^\s+(AuthCallback\|ContestantApp(Home\|Login\|SetPassword\|ResetPassword)\|AdminApp(Login\|Home)):" -- apps/frontend/src/lib/routes/route.ts` |

### The gates

| Role | Name these plans use | Name found on the tree | Command that found it |
|---|---|---|---|
| Name gate, exemption list | `EXEMPT` with every entry | two entries: `/invite-candidate/g, // the invitation Edge Function — see phase 174` and `/(?<=['"])(?:Candidate app\|Party app\|Candidate and party app)(?=['"])/g // the three shown names of the app, as whole quoted strings — see phase 171` | `grep -n -A3 "^const EXEMPT = \[" scripts/assert-no-candidate-app-names.mjs` |
| Sentences that state the count | every sentence of `git grep -n -i -E "exactly (one\|two\|three)"` | two: the docblock's "EXEMPTIONS: exactly two entries, each masked before matching …" and "/** The exemption list. Exactly two entries; each is masked before matching. */". Both become "exactly one" when the function's entry is deleted | `git grep -n -i -E "exactly (one\|two\|three)" -- scripts/assert-no-candidate-app-names.mjs` |
| Name gate's fixture | every line of `scripts/fixtures/assert-no-candidate-app-names.input.ts` that names the function | four lines: `// @as apps/supabase/supabase/functions/invite-candidate/index.ts`; `const e02 = functions.invoke('invite-candidate') && data.candidateUserData;`; `const n11 = functions.invoke('invite-candidate');`; `import n12 from '../invite-candidate/callerAuthority.ts';` | `git grep -n -F "invite" -- scripts/fixtures/assert-no-candidate-app-names.input.ts` |
| Lint chain | the `lint:check` chain and every prose statement of a link's position | twenty links: 1 `turbo run lint`, 2 `eslint tests`, 3 `yarn typecheck:tests`, 4 `yarn typecheck`, 5 `assert:i18n-catalog-namespaces`, 6 `assert:a11y-scan-wiring`, 7 `assert:comment-hygiene`, 8 `assert:no-candidate-app-names`, 9 `assert:edge-env-defaults`, 10 `assert:declared-binaries`, 11 `assert:node-engine`, 12 `assert:env-pair-registry`, 13 `assert:schema-migration-parity`, 14 `assert:adapter-casts`, 15 `assert:cookie-names`, 16 `assert:no-session-in-loads`, 17 `assert:rpc-nullability`, 18 `assert:project-scoped-queries`, 19 `assert:grant-permission-enum`, 20 `assert:edge-function-env`. Positions stated in prose: "link 6 of" (`.claude/skills/components/SKILL.md`, the a11y wiring), "link 13 of" (`.claude/skills/database/SKILL.md` and `apps/supabase/README.md`, the schema parity). The three other hits of the search are not about this chain | `git grep -n -i -E "link [0-9]+ of" -- . ':!.planning'`; `node -e` over `package.json` |

### The E2E harness

| Role | Name these plans use | Name found on the tree | Command that found it |
|---|---|---|---|
| Admin client methods | `sendEmail`, `sendForgotPassword`, `forceRegisterAdmin`, `getAuthUserByEmail`; the base class | all four on `class SupabaseAdminClient extends DevSeedAdminClient` in `T/utils/supabaseAdminClient.ts`; the base is `export class SupabaseAdminClient` in `packages/dev-seed/src/supabaseAdminClient.ts`. `sendEmail(params)` calls `auth.admin.inviteUserByEmail` and writes the grant; `sendForgotPassword(email)` calls `auth.resetPasswordForEmail` | `git grep -n -P "^\s+(async )?(sendEmail\|sendForgotPassword\|forceRegisterAdmin\|getAuthUserByEmail)\(" -- tests/tests/utils/supabaseAdminClient.ts` |
| Mail fixture | `createEmailBucket`, `getLinksInEmail`, `toCallbackUrl` with every call site | `createEmailBucket(_page, recipientEmail)` returns `{ expectEmail, getEmail, getLinksInEmail }` (**`getLinksInEmail` is a member of the bucket, not an export** — DIFFERS in form only); `export function toCallbackUrl(verifyLink, callbackPath = '/en/api/auth/callback')`. Call sites of `toCallbackUrl`: `contestant-journey.spec.ts` twice (registration, reset) and `perm-localisation-positive.spec.ts` once, plus one docs line | `git grep -n -F "toCallbackUrl" -- . ':!.planning'` |
| Journey constants | `REGISTRATION_EMAIL_SUBJECT_REGEX`, `RESET_EMAIL_SUBJECT_REGEX`, `UNREGISTERED_CANDIDATE_EMAIL`, `UNREGISTERED_CANDIDATE_EXTERNAL_ID` | all four in `T/utils/contestantJourneyConstants.ts`: `/invite\|invited\|registration\|confirm\|signup\|welcome\|verify/i`, `/reset\|recovery\|recover\|password/i`, `'unregistered-aa@test.openvaa.local'`, `'test-e2e-base-ca-aa-unregistered'`; also `PASSWORD_1`, `PASSWORD_2` | `git grep -n -E "^export const" -- tests/tests/utils/contestantJourneyConstants.ts` |
| Journey spec | the steps that send, open and reset, and its teardown | `T/specs/contestant/contestant-journey.spec.ts`, one test `'full candidate journey end-to-end'`: `client.sendEmail({…})` then `toCallbackUrl(links[0])` (registration), later `toCallbackUrl(links[0])` (reset). Setup and teardown `T/setup/contestant/contestant-journey.{setup,teardown}.ts`, each `client.unregisterCandidate(UNREGISTERED_CANDIDATE_EMAIL)` | `grep -n -E "sendEmail\|toCallbackUrl" <the spec>` |
| Localisation spec | its registration step and teardown | `T/specs/perm/perm-localisation-positive.spec.ts`: `client.unregisterCandidate(RECIPIENT_EMAIL)`, `client.sendEmail({…})`, `client.acceptTermsOfUse(RECIPIENT_EMAIL)`, `toCallbackUrl(links[0])`, `contestantPasswordSetter.setPassword(PASSWORD_1)`; teardown `T/setup/perm/perm-localisation-positive.teardown.ts` calls `client.unregisterCandidate(RECIPIENT_EMAIL)` | `grep -n -E "sendEmail\|toCallbackUrl\|unregisterCandidate\|acceptTermsOfUse" <the two files>` |
| Admin login setup | `T/setup/admin/admin-auth.setup.ts` | `client.forceRegisterAdmin(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)`, `page.goto(loginRoute)`, fills the email and `testIds.contestant.password.field`, clicks submit, stores `ADMIN_STORAGE_STATE` | `grep -n -E "goto\|fill\|click\|forceRegisterAdmin\|storageState" <the file>` |
| How a spec reads a key | `dotenv.config()`, `SUPABASE_ANON_KEY`, `PUBLIC_SUPABASE_ANON_KEY` | `dotenv.config()` at the top of `tests/playwright.config.ts`; `contestant-bank-auth.spec.ts` reads `process.env.SUPABASE_ANON_KEY` and throws when it is unset. No spec reads `PUBLIC_SUPABASE_ANON_KEY` | `git grep -n -E "SUPABASE_ANON_KEY" -- tests/tests`; `grep -n dotenv tests/playwright.config.ts` |
| Base URL | `use.baseURL` | `process.env.FRONTEND_PORT ? \`http://localhost:${process.env.FRONTEND_PORT}\` : 'http://localhost:5173'` | `grep -n baseURL tests/playwright.config.ts` |
| Tests' vitest include | the include pattern of `tests/vitest.config.ts` | `include: ['tests/utils/**/*.test.ts']` (5 files, 73 tests at Phase 173's close; in no gate row) | `grep -n include tests/vitest.config.ts` |

## Facts re-measured

One row for each of A1 to A11 of the research's *Assumptions Log*, one for each of the 23 baseline facts of `174-CONTEXT.md`, two for the facts the research tags `[READ: 172 plan]` and `[READ: 173 plan]`, and five the research does not number.

| Id | Claim | Verdict | Command or file read |
|---|---|---|---|
| A1 | The CLI maps `[auth] enable_signup = false` to `GOTRUE_DISABLE_SIGNUP=true` and `[auth.email] enable_confirmations = true` to `GOTRUE_MAILER_AUTOCONFIRM=false` | deferred to 174-03 Task 2 (`174-stack-probe.sh after --only auth` reads both variables by name after the restart) | — |
| A2 | A hosted project exposes the two switches in its dashboard, and `config.toml` does not set them | not measurable here: the operator | — |
| A3 | The Edge runtime accepts a call carrying only the anon key when no `[functions.<name>]` block exists | deferred to 174-05 Task 2. Measured now: `config.toml` has no `[functions.*]` table | `grep -n -E "^\[functions" S/config.toml` |
| A4 | Under `policy = "oneshot"` a `waitUntil` task is cut off locally, and under `per_worker` it completes | deferred to 174-05 Task 2. Measured now: the tree says `policy = "oneshot"` | `grep -n "^policy" S/config.toml` |
| A5 | `auth.setSession` on the server client writes the cookies as `verifyOtp` and `refreshSession` do | deferred to 174-08 Task 3. Measured now: no `auth.setSession` or `auth.refreshSession` call exists outside a comment in `apps/frontend/src` or `tests` | the ninth population below |
| A6 | The dev server does not answer on `127.0.0.1` | not needed: under ruling 8 no test opens a page on `127.0.0.1` | — |
| A7 | `supabase-js` surfaces GoTrue's `error_code` as `error.code` | deferred to 174-05 Task 2 | — |
| A8 | Phase 172 leaves `forceRegister` recording acceptance by default and removes the terms-of-use resets from the two cleanup helpers; Phase 173 renames `CANDIDATE_GRANTS` to `CONTESTANT_GRANTS`, adds `grantEntity`, `get_user_entities`, `get_entity_user_data` and the `NothingToEdit` view, and deletes the name gate's `get_candidate_user_data` exemption | holds, clause by clause: (1) `forceRegister` records unless `acceptTermsOfUse === false`; (2) neither `unregisterCandidate` nor `deleteAllTestUsers` resets a column; (3) `CONTESTANT_GRANTS` exists and `CANDIDATE_GRANTS` has no hit; (4) `grantEntity` exists, with `revokeEntityGrant` and `forceRegisterUser`; (5) and (6) both functions exist, `SECURITY INVOKER`; (7) `NothingToEdit.svelte` exists; (8) `EXEMPT` holds two entries and none names the deleted function (`174-verdict.mjs exemptions`: "no entry names 'get_candidate_user_data'") | `## Names`; `git grep -c -F CANDIDATE_GRANTS -- apps tests packages` (no hit) |
| A9 | The function directory can hold a pure templates module and its test without tripping any gate other than check 3 of `assert-edge-env-defaults.mjs` | deferred to 174-05 Task 3 | — |
| A10 | The hosted platform configures a GoTrue rate-limit header | not measurable here: the operator | — |
| A11 | Storage-related pgTAP files (06, 20, 28, 31) are unaffected by a table that has no storage policy | deferred to 174-02 Task 3. Measured now: all four are green on the real stack in the baseline (`pgtap` row, 38 files, 1447 tests) | `tests/e2e-runs/174-gates/174-01-baseline/06-pgtap.log` |
| R-172 | `304-terms-of-use-acceptances.sql` holds its own table, so the invitation table belongs in a new `3xx` file after it and the RPCs in a new `5xx` file | holds: 304 is the highest `3xx`, 505 the highest `5xx` | `git ls-tree --name-only HEAD apps/supabase/supabase/schema/` |
| R-173 | Phase 173 deletes the `get_candidate_user_data` entry, so the exemption list goes to one when this phase deletes its own | holds: the list holds two entries now and both count sentences say "exactly two"; one remains after 174-07 | `174-verdict.mjs exemptions` |
| 1 | `invite-candidate` inserts a `candidates` row, calls `auth.admin.inviteUserByEmail` and writes the `(entity, candidate, editor)` grant; gated on `project.edit_entities` through `callerMayOnProject` | holds | `grep -n -E "inviteUserByEmail\|from\('candidates'\)\|writeEntityGrant\|callerMayOnProject\(" S/functions/invite-candidate/index.ts` |
| 2 | Its redirect targets a route that does not exist: `${siteUrl}/contestant/complete-registration` | holds: `const redirectTo = \`${siteUrl}/contestant/complete-registration\`;` and no such route directory | `git grep -n -F "complete-registration" -- . ':!.planning'` |
| 3 | It has no caller: only `_preregister`, reached only through `preregisterWithApiToken`, which nothing calls outside its own unit test; the E2E `sendEmail` calls `inviteUserByEmail` and inserts the grant itself | holds: nine hits of `preregisterWithApiToken`, five in `supabaseDataWriter.test.ts`, two in the writer contract and its base, two in docs | the fourth population below |
| 4 | There is no invitation model | holds: no line of `S/schema/` contains "invitation" | `git grep -n -i "invitation" -- apps/supabase/supabase/schema` (exit 1) |
| 5 | `grants` cannot be written by any API role; six cleanup triggers; `grants_user_scope_target_role_key` is `UNIQUE NULLS NOT DISTINCT`; `idx_grants_one_candidate_editor` is kept | holds | `## Names`, the schema |
| 6 | A grant reaches the token only when a token is issued: the hook projects exactly `scope`, `target_type`, `target_id`, `role`; `user_can` reads the claim; `jwt_expiry = 3600`; the two user-data functions are `SECURITY INVOKER` | holds. Phase 173 refined the last clause, and it binds plans 174-08 and 174-09 (see *The stale-token rule* below) | `## Names`; `S/tests/database/36-entity-identity.test.sql` |
| 7 | `passwordLogin` signs out a session whose token matches none of the allowed shapes (403, `grantNotAllowed`); expected after 173: renamed and widened; a user with no editable entity sees "nothing to edit" | holds as expected after 173: the constant is `CONTESTANT_GRANTS` with candidate and organization editors; `userNoCandidate` has no hit. The login gate still refuses a user with no contestant grant (row X4) | `sed -n '26,60p' F/lib/auth/passwordLogin.ts` |
| 8 | `confirmed` defaults to `false` on all four entity tables; an entity is public only when the project is open, `confirmed` is true and it has a confirmed nomination; Phase 172 removed the terms-of-use conjunct | holds: `confirmed boolean NOT NULL DEFAULT false` four times; `anon_select_candidates` asks `project_open_for_voters (project_id)`; `terms_of_use` has no hit in `302-rls.sql` or `301-auth-functions.sql` | `git grep -c -i "terms_of_use" -- S/schema/302-rls.sql S/schema/301-auth-functions.sql` (no hit) |
| 9 | Confirming freezes the name for the entity's own user: `BEFORE UPDATE`, `authenticated` only; `entity.confirm`; `entity.edit_immutable`; project admin and project editor hold both, entity editors neither | holds | `sed -n '489,520p' S/schema/011-validation-functions.sql`; the `('project', 'editor')` arm of `grant_role_permissions` |
| 10 | `bulk_import` has no slot for invitations or users: `SECURITY INVOKER`, requires `external_id` and `project_id`, returns counts | holds: `public.bulk_import (p_data jsonb) RETURNS jsonb … SECURITY INVOKER`; "external_id is required for bulk import"; "project_id is required in each item" | `grep -n -E "bulk_import\|is required" S/schema/501-bulk-operations.sql` |
| 11 | `send-email` cannot reach an invitee: it takes `recipient_user_ids`, and `resolve_email_variables` returns only users who hold a grant; `nodemailer` with `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | holds | `grep -n recipient_user_ids S/functions/send-email/index.ts`; `grep -n "FROM public.grants" S/schema/502-email-helpers.sql` |
| 12 | Auth configuration as listed | holds, value by value (see `## Names`, the configuration). The redirect list also admits `https://127.0.0.1:3000`. What the RUNNING service carries was not read in this plan: the stack probe first runs in 174-03 | `grep` over `S/config.toml` |
| 13 | The frontend holds no service-role key | holds: no hit outside test files | `git grep -n -i "SERVICE_ROLE" -- apps/frontend/src ':!*.test.ts'` (exit 1) |
| 14 | `checkRegistrationKey` throws, and its contract discloses `email`, `firstName`, `lastName`; `register/+page.svelte` forwards them in the URL | holds: the page forwards `firstName` (as `username`) and `email` | `sed -n '274,279p' F/lib/api/base/dataWriter.type.ts`; `grep -n -E "email\|firstName" "F/routes/contestant/register/+page.svelte"` |
| 15 | A new public definer function trips the census; six names for `anon`, the same plus `get_entity_basic_data` for `authenticated` | holds: six and seven | `## Names`, the database tests |
| 16 | A per-client rate limit exists as a precedent, keyed on the address derived from PostgREST's request headers, with `behind_cloudflare` deciding which header is trusted | holds | `grep -n -E "feedback_client_ip\|behind_cloudflare" S/schema/107-feedback.sql` |
| 17 | The E2E admin client builds registrations by hand; two specs turn the mailed verify link into a hand-built callback URL with `toCallbackUrl` | holds: three call sites in two specs | `git grep -n -F "toCallbackUrl" -- tests` |
| 18 | The auth callback verifies a `token_hash` and nothing else; `invite` → set password with the email in the query string; `email` / `signup` → validated `next` or home; never claims, never refreshes | holds | `F/routes/api/auth/callback/+server.ts` |
| 19 | `identity-callback` creates its users already email-confirmed, with no password | holds for the call: `createUser({ email: placeholderEmail, email_confirm: true, app_metadata })` passes no password. What the auth service then stores is not a fact of the tree: ruling 7, from the research's RQ-2, says such a user carries a generated password hash; not re-measured here | the eighth population below |
| 20 | No hashing extension is declared; the only `CREATE EXTENSION` is `pg_net` | holds | `git grep -n -i "create extension" -- apps/supabase/supabase/schema` |
| 21 | Three permissions that no policy enforces reserve grant administration; a project editor holds `project.edit_entities` and `entity.confirm` and not `project.manage_editors`; `entity+admin`, `global+editor`, `account+editor` map to the empty set | holds: no policy file names any of the three; the `('project', 'editor')` arm lists `project.edit_entities`, `entity.confirm`, `entity.edit_immutable` and `entity.invite_children`, and neither `project.manage_editors` nor `account.manage_admins` | `git grep -n -E "account\.manage_admins\|project\.manage_editors\|entity\.invite_children" -- S/schema/302-rls.sql S/schema/303-column-grants.sql S/schema/304-terms-of-use-acceptances.sql S/schema/400-storage.sql` (exit 1); `sed -n '181,200p' S/schema/301-auth-functions.sql` |
| 22 | Phase 171's settings code says an invitation is not a registration mode | holds: "An invitation sent by an administrator is not a registration mode and needs no entry." in the docblock of the registration modes | `git grep -n -F "is not a registration mode" -- packages/app-shared/src/settings/contestantAppConfig.ts` |
| 23 | `invite-candidate` is cross-referenced by gates and sibling functions | holds: 34 files outside `.planning/` name it | the first two populations below |
| X1 | Does `ADMIN_GRANTS` admit a project editor? | differs: no. It lists the three admin shapes only, so a claimed `(project, editor)` promise opens neither app: the Admin App's login gate refuses it (403) and so does the Contestant App's. Ruling 18 records it for Phase 178 | `grep -n -A4 "^export const ADMIN_GRANTS" F/lib/auth/roles.ts` |
| X2 | Does the request hook's app gate let a signed-in user whose token carries no contestant grant reach the Contestant App's protected routes? | holds: yes. `appGateHandle` asks `safeGetSession()` for a session and nothing about its grants: a session on a protected route passes, a session on the login route is sent to `ContestantAppHome`, and no session on a protected route is sent to login | `sed -n '82,111p' F/hooks.server.ts`; `CONTESTANT_GATE` in `F/lib/routes/appGates.ts` |
| X3 | What does the root load then do for such a user? | holds: the user-level load reads `getBasicUserData()` (`role: null`, no failure), applies the gates (the terms of use first, if not accepted), lists the entities (none), and the root returns `{ view: 'nothingToEdit' }`. Nobody is signed out on this path | `"P/+layout.server.ts"`, `"P/+page.server.ts"` |
| X4 | Does the Contestant App's login gate admit a user with no contestant grant? | differs: no. `passwordLogin` with `allowedGrants: CONTESTANT_GRANTS` signs the session out and returns 403 `grantNotAllowed`. So a first-time invitee who signs in by password before the claim and the refresh is refused; "nothing to edit" is reached only by a user who already holds a session (the callback, or a removed grant). This is why the order session → claim → refresh → gate of 174-08 is load-bearing, and ruling 18's second fact | `sed -n '26,60p' F/lib/auth/passwordLogin.ts` |
| X5 | Was pgTAP last run green on a database holding E2E data? | differs: no, and never in Phases 172 to 174. Every gate run reset the database in the row before the types and pgTAP (this phase's `db-reset` row; Phase 173's `types-regen`), so the suite has only been shown green on migrations plus `seed.sql`. A pgTAP run on a database holding E2E rows or the `default` dataset is unmeasured | `173-NAME-MAP.md` row X1; `tests/e2e-runs/174-gates/174-01-baseline/summary.tsv` |

**The stale-token rule, binding on plans 174-08 and 174-09.** Pinned by pgTAP file `36-entity-identity.test.sql` and filed as `.planning/todos/pending/2026-10-06-173-refresh-the-session-after-a-claim.md`. A grant written after the token was issued behaves in three ways: when the entity is not publicly visible it is neither listed nor readable; when the entity is publicly visible it is listed and readable, and EVERY WRITE IS REFUSED; and a grant that was removed stops being listed at once although the token still carries it. The claim flow of this phase is therefore **session → `claim_invitations` → `refreshSession()` → gates**, in that order, at every entry point that can sign an invitee in (the callback and both login actions), and no read or write of entity data happens between the claim and the refresh. A claim on a candidate that already has an editor fails on `idx_grants_one_candidate_editor` and is a refusal, not an error. Neither database function may be changed without re-running file 36: the root's redirect and the entity-level load's redirect rely on their agreement.

## Populations at the start

Each command was run on the tree named at the top (script `t174-1-populations.sh` in the session scratchpad; output pasted as it was, lines over 220 characters cut and ended with " …"). They are snapshots for later comparison, never targets.

`git grep -c -F "invite-candidate" -- . ':!.planning'` — exit 0, 34 line(s)

```text
.claude/skills/database/SKILL.md:9
.env.example:1
CLAUDE.md:2
apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md:1
apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md:4
apps/docs/src/routes/(content)/developers-guide/backend/email/+page.md:1
apps/docs/src/routes/(content)/developers-guide/backend/intro/+page.md:1
apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md:8
apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md:1
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:4
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:2
apps/supabase/README.md:1
apps/supabase/supabase/functions/identity-callback/entityGrant.ts:1
apps/supabase/supabase/functions/identity-callback/envConfig.ts:2
apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts:2
apps/supabase/supabase/functions/invite-candidate/entityGrant.ts:1
apps/supabase/supabase/functions/invite-candidate/envConfig.ts:2
apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts:3
apps/supabase/supabase/functions/invite-candidate/index.ts:3
apps/supabase/supabase/functions/invite-candidate/jwtSegment.test.ts:2
apps/supabase/supabase/functions/invite-candidate/jwtSegment.ts:2
apps/supabase/supabase/functions/send-email/callerAuthority.ts:2
apps/supabase/supabase/functions/send-email/envConfig.ts:2
apps/supabase/supabase/functions/send-email/flowConformance.test.ts:3
apps/supabase/supabase/functions/send-email/index.ts:1
apps/supabase/supabase/functions/send-email/jwtSegment.test.ts:1
apps/supabase/supabase/functions/send-email/jwtSegment.ts:2
packages/dev-seed/tests/projectScopingGate.test.ts:1
scripts/assert-edge-env-defaults.mjs:2
scripts/assert-no-candidate-app-names.mjs:2
scripts/assert-project-scoped-queries.mjs:1
scripts/fixtures/assert-no-candidate-app-names.input.ts:4
scripts/fixtures/project-scoped-queries/clean.fixture.ts:2
scripts/fixtures/project-scoped-queries/violation.fixture.ts:1
```

`git grep -l -F "invite-candidate" -- . ':!.planning'` — exit 0, 34 line(s)

```text
.claude/skills/database/SKILL.md
.env.example
CLAUDE.md
apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md
apps/docs/src/routes/(content)/developers-guide/backend/email/+page.md
apps/docs/src/routes/(content)/developers-guide/backend/intro/+page.md
apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md
apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
apps/supabase/README.md
apps/supabase/supabase/functions/identity-callback/entityGrant.ts
apps/supabase/supabase/functions/identity-callback/envConfig.ts
apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts
apps/supabase/supabase/functions/invite-candidate/entityGrant.ts
apps/supabase/supabase/functions/invite-candidate/envConfig.ts
apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
apps/supabase/supabase/functions/invite-candidate/index.ts
apps/supabase/supabase/functions/invite-candidate/jwtSegment.test.ts
apps/supabase/supabase/functions/invite-candidate/jwtSegment.ts
apps/supabase/supabase/functions/send-email/callerAuthority.ts
apps/supabase/supabase/functions/send-email/envConfig.ts
apps/supabase/supabase/functions/send-email/flowConformance.test.ts
apps/supabase/supabase/functions/send-email/index.ts
apps/supabase/supabase/functions/send-email/jwtSegment.test.ts
apps/supabase/supabase/functions/send-email/jwtSegment.ts
packages/dev-seed/tests/projectScopingGate.test.ts
scripts/assert-edge-env-defaults.mjs
scripts/assert-no-candidate-app-names.mjs
scripts/assert-project-scoped-queries.mjs
scripts/fixtures/assert-no-candidate-app-names.input.ts
scripts/fixtures/project-scoped-queries/clean.fixture.ts
scripts/fixtures/project-scoped-queries/violation.fixture.ts
```

`git grep -n -F "inviteUserByEmail" -- . ':!.planning'` — exit 0, 15 line(s)

```text
apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md:57:3. It sends the invitation with Supabase Auth's `inviteUserByEmail`, with `/contestant/complete-registration` under `SITE_URL` as the red …
apps/docs/src/routes/(content)/developers-guide/backend/email/+page.md:7:| Candidate invitation                  | Supabase Auth, when the `invite-candidate` Edge Function calls `inviteUserByEmail` |
apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md:36:2. **Invitation.** It calls Supabase Auth's `inviteUserByEmail` for the email address. The invited user's metadat …
apps/supabase/supabase/functions/invite-candidate/index.ts:128:    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
tests/tests/setup/perm/perm-localisation-positive.teardown.ts:6: * Also owns the auth.users row created by the spec's registration-via-email step (`client.sendEmail` → `inviteUserByEmail` in perm-localisation-positive. …
tests/tests/specs/contestant/contestant-journey.spec.ts:371:      // SupabaseAdminClient.sendEmail (since no candidate-editor grant names the candidate yet) invokes inviteUserByEmail under the hood, then writes the grant …
tests/tests/specs/perm/perm-localisation-positive.spec.ts:165:    // ============== Step 3: candidate registration via Inbucket =========== The seeded candidate has no auth.users row. Drive registration via sendEmail (wh …
tests/tests/specs/perm/perm-localisation-positive.spec.ts:167:    // Defensive self-heal: if a PRIOR run crashed before its teardown ran, the invited auth user leaks and inviteUserByEmail below fails with "already regist …
tests/tests/utils/contestantJourneyConstants.ts:19: *   2. SupabaseAdminClient.sendEmail (since no candidate-editor grant names the candidate yet) invokes `inviteUserByEmail(email)` to create the auth user and email the  …
tests/tests/utils/supabaseAdminClient.ts:850:   * For test purposes, this uses `auth.admin.inviteUserByEmail` which sends an invite/magic link email via Inbucket in local dev. The invite email contains a link the candida …
tests/tests/utils/supabaseAdminClient.ts:852:   * A candidate is registered exactly when a candidate-editor grant names it. A registered candidate gets a magic link instead (since inviteUserByEmail would fail for existin …
tests/tests/utils/supabaseAdminClient.ts:895:      // No grant names the candidate yet -- use inviteUserByEmail to create the user and send an invite email via Inbucket, then write the candidate-editor grant that links t …
tests/tests/utils/supabaseAdminClient.ts:903:      // Use inviteUserByEmail to create the user and send the invite email.
tests/tests/utils/supabaseAdminClient.ts:906:      const { data: inviteData, error: inviteError } = await this.client.auth.admin.inviteUserByEmail(email, {
tests/tests/utils/supabaseAdminClient.ts:909:      if (inviteError) throw new Error(`sendEmail: inviteUserByEmail failed: ${inviteError.message}`);
```

`git grep -n -F "preregisterWithApiToken" -- . ':!.planning'` — exit 0, 9 line(s)

```text
apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md:20:In the frontend, the Supabase data writer's `_preregister` method calls it with `supabase.functions.invoke('invit …
apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md:51:| `preregisterWithApiToken` | invokes the `invite-candidate` Edge Function (see [Pre-registration and invitation](/developers-guide/ …
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:1243:  describe('preregisterWithApiToken (invite-candidate)', () => {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:1250:      const result = await writer.preregisterWithApiToken({
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:1280:        writer.preregisterWithApiToken({
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:1409:    it('preregisterWithApiToken sends the configured project id and reaches no table', async () => {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:1412:      await writer.preregisterWithApiToken({
apps/frontend/src/lib/api/base/dataWriter.type.ts:71:  preregisterWithApiToken: (opts: {
apps/frontend/src/lib/api/base/universalDataWriter.ts:96:  preregisterWithApiToken(opts: {
```

`git grep -n -F "complete-registration" -- . ':!.planning'` — exit 0, 4 line(s)

```text
apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md:57:3. It sends the invitation with Supabase Auth's `inviteUserByEmail`, with `/contestant/complete-registration` under `SITE_URL` as the red …
apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md:36:2. **Invitation.** It calls Supabase Auth's `inviteUserByEmail` for the email address. The invited user's metadat …
apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md:52:The frontend has no page at `/contestant/complete-registration`, the redirect target `invite-candidate` passes. T …
apps/supabase/supabase/functions/invite-candidate/index.ts:126:    const redirectTo = `${siteUrl}/contestant/complete-registration`;
```

`git grep -n -F "toCallbackUrl" -- . ':!.planning'` — exit 0, 8 line(s)

```text
apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md:52:The frontend has no page at `/contestant/complete-registration`, the redirect target `invite-candidate` passes. T …
tests/tests/fixtures/shared/emailBucket.fixture.ts:14: * Also exports `toCallbackUrl(verifyLink)` — a pure transform that rewrites a Supabase Auth verify link (extracted from an email via `getLinksInEmail`) into a dire …
tests/tests/fixtures/shared/emailBucket.fixture.ts:198:export function toCallbackUrl(verifyLink: string, callbackPath = '/en/api/auth/callback'): string {
tests/tests/specs/contestant/contestant-journey.spec.ts:51:import { toCallbackUrl } from '../../fixtures/shared/emailBucket.fixture';
tests/tests/specs/contestant/contestant-journey.spec.ts:384:      registrationCallbackUrl = toCallbackUrl(links[0]);
tests/tests/specs/contestant/contestant-journey.spec.ts:447:      resetCallbackUrl = toCallbackUrl(links[0]);
tests/tests/specs/perm/perm-localisation-positive.spec.ts:47:import { toCallbackUrl } from '../../fixtures/shared/emailBucket.fixture';
tests/tests/specs/perm/perm-localisation-positive.spec.ts:183:    const registrationCallbackUrl = toCallbackUrl(links[0]);
```

`git grep -n -P '\bauth\s*\.\s*(signUp|signInWithOtp|signInAnonymously|signInWithOAuth|signInWithIdToken)\b' -- . ':!.planning' ':!*.md' ':!apps/docs' ':!.claude'` — exit 1, 0 line(s)

```text
(no output)
```

`git grep -n -A4 'auth\.admin\.createUser' -- tests/tests/utils/supabaseAdminClient.ts apps/supabase/supabase/functions/identity-callback/index.ts` — exit 0, 17 line(s)

```text
apps/supabase/supabase/functions/identity-callback/index.ts:275:      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
apps/supabase/supabase/functions/identity-callback/index.ts-276-        email: placeholderEmail,
apps/supabase/supabase/functions/identity-callback/index.ts-277-        email_confirm: true,
apps/supabase/supabase/functions/identity-callback/index.ts-278-        app_metadata: {
apps/supabase/supabase/functions/identity-callback/index.ts-279-          identity_provider: providerType,
--
tests/tests/utils/supabaseAdminClient.ts:603:    const { data: createData, error: createError } = await this.client.auth.admin.createUser({
tests/tests/utils/supabaseAdminClient.ts-604-      email,
tests/tests/utils/supabaseAdminClient.ts-605-      password,
tests/tests/utils/supabaseAdminClient.ts-606-      email_confirm: true
tests/tests/utils/supabaseAdminClient.ts-607-    });
--
tests/tests/utils/supabaseAdminClient.ts:703:    const { data: createData, error: createError } = await this.client.auth.admin.createUser({
tests/tests/utils/supabaseAdminClient.ts-704-      email,
tests/tests/utils/supabaseAdminClient.ts-705-      password,
tests/tests/utils/supabaseAdminClient.ts-706-      email_confirm: true
tests/tests/utils/supabaseAdminClient.ts-707-    });
```

`git grep -n -P '\bauth\s*\.\s*(signInWithPassword|resetPasswordForEmail|updateUser|verifyOtp|refreshSession|setSession)\b' -- apps/frontend/src tests ':!*.test.ts'` — exit 0, 12 line(s)

```text
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:99:    const { error } = await this.supabase.auth.signInWithPassword({
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:128:    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:139:    const { error } = await this.supabase.auth.updateUser({ password });
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:145:    const { error } = await this.supabase.auth.updateUser({ password });
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:147:    // `auth.updateUser({ password })` rotates the access token, and the browser-side `createBrowserClient` instance adopts the new token t …
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:148:    // The remedy is `await this.supabase.auth.refreshSession()` here, mirrored in `_resetPassword` and `_register`. It is not added by def …
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:197:    const { error } = await this.supabase.auth.updateUser({ password });
apps/frontend/src/lib/auth/passwordLogin.ts:120:  const { error } = await context.auth.signInWithPassword({ email, password });
apps/frontend/src/routes/api/auth/callback/+server.ts:32:    const { error } = await locals.supabase.auth.verifyOtp({ token_hash, type });
apps/frontend/src/routes/api/contestant/preregister/+server.ts:49:        const { error: verifyError } = await locals.supabase.auth.verifyOtp({
tests/tests/utils/supabaseAdminClient.ts:927:   * Alternatively uses `auth.resetPasswordForEmail` which sends the actual recovery email via GoTrue/Inbucket.
tests/tests/utils/supabaseAdminClient.ts:935:    const { error } = await this.client.auth.resetPasswordForEmail(email, {
```

`git grep -n -F "same six plus get_entity_basic_data" -- apps/supabase/supabase/tests/database/07-rpc-security.test.sql` — exit 0, 1 line(s)

```text
apps/supabase/supabase/tests/database/07-rpc-security.test.sql:401:    'census: the SECURITY DEFINER functions in public that authenticated can execute are the same six plus get_entity_basic_data'
```

`git grep -n -E "exactly the six allow-listed ones|^    'contestant_app_public_config," -- apps/supabase/supabase/tests/database/07-rpc-security.test.sql` — exit 0, 3 line(s)

```text
apps/supabase/supabase/tests/database/07-rpc-security.test.sql:376:    'contestant_app_public_config,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
apps/supabase/supabase/tests/database/07-rpc-security.test.sql:377:    'census: the SECURITY DEFINER functions in public that anon can execute are exactly the six allow-listed ones'
apps/supabase/supabase/tests/database/07-rpc-security.test.sql:400:    'contestant_app_public_config,get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
```

`git grep -n -F "m17_unenforced_ratified" -- apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql` — exit 0, 4 line(s)

```text
apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql:189:CREATE TEMP TABLE m17_unenforced_ratified (m text) ON
apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql:194:  m17_unenforced_ratified
apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql:225:    $$SELECT m FROM m17_unenforced_derived EXCEPT SELECT m FROM m17_unenforced_ratified$$,
apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql:231:    $$SELECT m FROM m17_unenforced_ratified EXCEPT SELECT m FROM m17_unenforced_derived$$,
```

`git grep -n -E "SAME_PERMISSION_ALLOW|MECHANISM_HELPERS|REACHES_NEITHER_ALLOW" -- apps/supabase/scripts/lint-schema.mjs` — exit 0, 6 line(s)

```text
apps/supabase/scripts/lint-schema.mjs:46:const SAME_PERMISSION_ALLOW = [
apps/supabase/scripts/lint-schema.mjs:53:const MECHANISM_HELPERS = [
apps/supabase/scripts/lint-schema.mjs:68:const REACHES_NEITHER_ALLOW = [
apps/supabase/scripts/lint-schema.mjs:168:helper AS (SELECT unnest(${sqlTextArray(MECHANISM_HELPERS)}) AS h),
apps/supabase/scripts/lint-schema.mjs:169:same_perm AS (SELECT * FROM (VALUES ${sqlTuples(SAME_PERMISSION_ALLOW.length ? SAME_PERMISSION_ALLOW : [['', '', '']])}) v(sch, tbl, perm)),
apps/supabase/scripts/lint-schema.mjs:170:neither_ok AS (SELECT * FROM (VALUES ${sqlTuples(REACHES_NEITHER_ALLOW.length ? REACHES_NEITHER_ALLOW : [['', '', '']])}) v(sch, tbl, pol)),
```

`git ls-tree --name-only HEAD apps/supabase/supabase/schema/ apps/supabase/supabase/tests/database/` — exit 0, 65 line(s)

```text
apps/supabase/supabase/schema/000-enums.sql
apps/supabase/supabase/schema/001-role-settings.sql
apps/supabase/supabase/schema/010-utility-functions.sql
apps/supabase/supabase/schema/011-validation-functions.sql
apps/supabase/supabase/schema/100-tenancy.sql
apps/supabase/supabase/schema/101-elections.sql
apps/supabase/supabase/schema/102-entities.sql
apps/supabase/supabase/schema/103-questions.sql
apps/supabase/supabase/schema/104-nominations.sql
apps/supabase/supabase/schema/105-answers.sql
apps/supabase/supabase/schema/106-app-settings.sql
apps/supabase/supabase/schema/107-feedback.sql
apps/supabase/supabase/schema/108-admin-jobs.sql
apps/supabase/supabase/schema/200-indexes.sql
apps/supabase/supabase/schema/300-auth-tables.sql
apps/supabase/supabase/schema/301-auth-functions.sql
apps/supabase/supabase/schema/302-rls.sql
apps/supabase/supabase/schema/303-column-grants.sql
apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql
apps/supabase/supabase/schema/400-storage.sql
apps/supabase/supabase/schema/500-external-id.sql
apps/supabase/supabase/schema/501-bulk-operations.sql
apps/supabase/supabase/schema/502-email-helpers.sql
apps/supabase/supabase/schema/503-entity-rpcs.sql
apps/supabase/supabase/schema/504-admin-rpcs.sql
apps/supabase/supabase/schema/505-question-rpcs.sql
apps/supabase/supabase/schema/900-test-helpers.sql
apps/supabase/supabase/tests/database/00-helpers.test.sql
apps/supabase/supabase/tests/database/01-tenant-isolation.test.sql
apps/supabase/supabase/tests/database/02-candidate-self-edit.test.sql
apps/supabase/supabase/tests/database/03-anon-read.test.sql
apps/supabase/supabase/tests/database/04-admin-crud.test.sql
apps/supabase/supabase/tests/database/05-organization-admin.test.sql
apps/supabase/supabase/tests/database/06-storage-rls.test.sql
apps/supabase/supabase/tests/database/07-rpc-security.test.sql
apps/supabase/supabase/tests/database/08-triggers.test.sql
apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
apps/supabase/supabase/tests/database/11-question-rpcs.test.sql
apps/supabase/supabase/tests/database/12-user-can.test.sql
apps/supabase/supabase/tests/database/14-grants-migration.test.sql
apps/supabase/supabase/tests/database/15-visibility-flags.test.sql
apps/supabase/supabase/tests/database/16-anon-visibility.test.sql
apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql
apps/supabase/supabase/tests/database/18-entity-policies.test.sql
apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
apps/supabase/supabase/tests/database/20-storage-authority.test.sql
apps/supabase/supabase/tests/database/21-entity-organization.test.sql
apps/supabase/supabase/tests/database/22-content-policies.test.sql
apps/supabase/supabase/tests/database/23-nominations-write.test.sql
apps/supabase/supabase/tests/database/24-legacy-removal.test.sql
apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
apps/supabase/supabase/tests/database/26-uniqueness-keys.test.sql
apps/supabase/supabase/tests/database/27-parent-nomination-queue.test.sql
apps/supabase/supabase/tests/database/28-storage-table-parity.test.sql
apps/supabase/supabase/tests/database/29-authenticated-disjunct-order.test.sql
apps/supabase/supabase/tests/database/30-closed-project.test.sql
apps/supabase/supabase/tests/database/31-storage-cleanup.test.sql
apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql
apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql
apps/supabase/supabase/tests/database/34-feedback-project-guard.test.sql
apps/supabase/supabase/tests/database/35-feedback-rate-limit-key.test.sql
apps/supabase/supabase/tests/database/36-entity-identity.test.sql
apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql
apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql
```

`git grep -n -i "create extension" -- apps/supabase/supabase/schema` — exit 0, 1 line(s)

```text
apps/supabase/supabase/schema/400-storage.sql:25:CREATE EXTENSION IF NOT EXISTS pg_net
```

`ls apps/frontend/messages` — exit 0, 8 line(s)

```text
da
en
et
fi
fr
lb
README.md
sv
```

`git grep -n -E "^\s+name: '" -- tests/playwright.config.ts` — exit 1, 0 line(s)

```text
(no output)
```

`git grep -c -P "^\s+name: '" -- tests/playwright.config.ts` — exit 0, 1 line(s)

```text
tests/playwright.config.ts:109
```

`git grep -h -o -P "^\s+name: '[^']+'" -- tests/playwright.config.ts | sed -E "s/^ +name: //" | tr '\n' ' '` — exit 0, 1 line(s)

```text
'auth-setup' 'visual-regression' 'performance' 'a11y-smoke' 'contestant-a11y-scan' 'bank-auth' 'data-setup-bank-auth-journey' 'data-teardown-bank-auth-journey' 'bank-auth-journey' 'data-setup-base' 'data-teardown-base' ' …
```

`git grep -n -F "SITE_URL=http://127.0.0.1:5173" -- . ':!.planning'` — exit 0, 4 line(s)

```text
.env.example:233:SITE_URL=http://127.0.0.1:5173
apps/supabase/supabase/functions/.env.example:89:SITE_URL=http://127.0.0.1:5173
tests/IDURA-TEST-RUNBOOK.md:134:SITE_URL=http://127.0.0.1:5173
tests/IDURA-TEST-RUNBOOK.md:251:  "SITE_URL=http://127.0.0.1:5173",
```

`ls apps/supabase/supabase/functions` — exit 0, 3 line(s)

```text
identity-callback
invite-candidate
send-email
```

`find apps/supabase/supabase/functions -name envConfig.ts -o -name jwtSegment.ts -o -name callerAuthority.ts | sort` — exit 0, 7 line(s)

```text
apps/supabase/supabase/functions/identity-callback/envConfig.ts
apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts
apps/supabase/supabase/functions/invite-candidate/envConfig.ts
apps/supabase/supabase/functions/invite-candidate/jwtSegment.ts
apps/supabase/supabase/functions/send-email/callerAuthority.ts
apps/supabase/supabase/functions/send-email/envConfig.ts
apps/supabase/supabase/functions/send-email/jwtSegment.ts
```

## Baseline

**Written by:** plan 174-01, Task 2. Both runs were made on one tree, before this phase edited any source file: the gate set recorded head `f3b651333` and the E2E run `97c6a91e3`, which differ under `.planning/` alone, and both equal the last commit outside `.planning/`, `2ea3b9d8d` (`git diff --quiet <head> HEAD -- . ':(exclude).planning'` exits 0 for each).

base_rev: 97c6a91e37c5bdbc72efe492d0073789e5be2097

label: `174-01-baseline`

**Gate set — `tests/e2e-runs/174-gates/174-01-baseline`, exit 0, 13 rows, every status 0.** Run with `--rows` naming the thirteen `BASE_ROWS`: `auth-config` and `stack` exist only from 174-03 on. Window 2026-10-06 22:34:28 to 2026-10-06 22:38:10 local, on AC power under `caffeinate -dimsu`; `power.txt` records `sleep_entries_in_window: 0`. `node …/174-verdict.mjs gates 174-01-baseline --rows <the thirteen>` exits 0. It was the first attempt.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 49 |
| db-reset | 0 | 29 |
| types-regen | 0 | 3 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 3 |
| unit | 0 | 65 |
| check-frontend | 0 | 10 |
| build | 0 | 17 |
| format | 0 | 20 |
| docs-links | 0 | 1 |
| name-gate-self-test | 0 | 0 |

Read from the rows' logs: pgTAP 38 files and 1447 tests, `Result: PASS`; frontend unit tests 2546 passed and 7 skipped in 159 files and one skipped file (the seven are the gated writer integration test without its variables); dev-seed 1015 in 67 files; supabase functions 206 in 15; app-shared 141 in 10; data 244 in 47; the schema linter's census "policies examined: 104, tables partitioned: 20, permission members: 23", `0 error(s), 3 warning(s)`. Every one equals the figure Phase 173 closed on.

**E2E — `tests/e2e-runs/174-e2e/174-01-baseline`, the full default suite, wrapper status 0, Playwright status 0.**

baseline_e2e_counts: total 198, passed 198, failed 0, flaky 0, skipped 0, didNotRun 0 — 103 projects, 1 preflight success, 0 preflight failures

Window 2026-10-06 22:38:42 to 2026-10-06 22:44:46 local, on AC power under `caffeinate -dimsu`; `sleep_entries_in_window: 0`. `node …/174-verdict.mjs e2e 174-01-baseline` exits 0. It was the first attempt. Every project holds the total it had in Phase 173's closing run `173-13-final` (103 projects compared, none differing), and every project passed every test. The dev server was ready in 35.9 s, a cold start after the gate set; its log holds `Error formatting nomination` three times, as in every full run since `173-07-split`.

Per-project totals (`summary.json` `byProject`; every one fully passed):

| Project | Total |
|---|---|
| `a11y-smoke` | 16 |
| `admin-access` | 1 |
| `auth-setup` | 2 |
| `cold-entry-dataroot` | 3 |
| `cold-entry-dataroot-contestant` | 1 |
| `contestant-a11y-scan` | 22 |
| `contestant-entity-selection` | 8 |
| `contestant-journey` | 1 |
| `data-setup-admin-auth` | 1 |
| `data-setup-base` | 1 |
| `data-setup-contestant-journey` | 1 |
| `data-setup-entity-selection` | 3 |
| `data-setup-perm-1e1cg1co` | 1 |
| `data-setup-perm-2e-asymmetric` | 1 |
| `data-setup-perm-2e-shared` | 1 |
| `data-setup-perm-access-disable` | 1 |
| `data-setup-perm-analytics-tracking` | 1 |
| `data-setup-perm-answers-locked` | 1 |
| `data-setup-perm-closed-project` | 1 |
| `data-setup-perm-disable-allow-open` | 1 |
| `data-setup-perm-disable-election-1co` | 1 |
| `data-setup-perm-disable-election-2co` | 1 |
| `data-setup-perm-disjoint-1co` | 1 |
| `data-setup-perm-header-show-help` | 1 |
| `data-setup-perm-hide-all-nominations` | 1 |
| `data-setup-perm-hide-category-tags` | 1 |
| `data-setup-perm-hide-election-tags` | 1 |
| `data-setup-perm-hide-hero` | 1 |
| `data-setup-perm-hide-if-missing-answers` | 1 |
| `data-setup-perm-interactive-info` | 1 |
| `data-setup-perm-localisation-positive` | 1 |
| `data-setup-perm-missing-nominations` | 1 |
| `data-setup-perm-not-located-2e2cg` | 1 |
| `data-setup-perm-org-matching` | 1 |
| `data-setup-perm-per-app-notifications` | 1 |
| `data-setup-perm-question-video` | 1 |
| `data-setup-perm-show-feedback-survey` | 1 |
| `data-setup-perm-startfromcg` | 1 |
| `data-teardown-admin-access` | 1 |
| `data-teardown-base` | 1 |
| `data-teardown-contestant-journey` | 1 |
| `data-teardown-entity-selection` | 1 |
| `data-teardown-perm-1e1cg1co` | 1 |
| `data-teardown-perm-2e-asymmetric` | 1 |
| `data-teardown-perm-2e-shared` | 1 |
| `data-teardown-perm-access-disable` | 1 |
| `data-teardown-perm-analytics-tracking` | 1 |
| `data-teardown-perm-answers-locked` | 1 |
| `data-teardown-perm-closed-project` | 1 |
| `data-teardown-perm-disable-allow-open` | 1 |
| `data-teardown-perm-disable-election-1co` | 1 |
| `data-teardown-perm-disable-election-2co` | 1 |
| `data-teardown-perm-disjoint-1co` | 1 |
| `data-teardown-perm-header-show-help` | 1 |
| `data-teardown-perm-hide-all-nominations` | 1 |
| `data-teardown-perm-hide-category-tags` | 1 |
| `data-teardown-perm-hide-election-tags` | 1 |
| `data-teardown-perm-hide-hero` | 1 |
| `data-teardown-perm-hide-if-missing-answers` | 1 |
| `data-teardown-perm-interactive-info` | 1 |
| `data-teardown-perm-localisation-positive` | 1 |
| `data-teardown-perm-missing-nominations` | 1 |
| `data-teardown-perm-not-located-2e2cg` | 1 |
| `data-teardown-perm-org-matching` | 1 |
| `data-teardown-perm-per-app-notifications` | 1 |
| `data-teardown-perm-question-video` | 1 |
| `data-teardown-perm-show-feedback-survey` | 1 |
| `data-teardown-perm-startfromcg` | 1 |
| `eperm07-term-trigger` | 1 |
| `performance` | 1 |
| `perm-1e1cg1co` | 1 |
| `perm-2e-asymmetric` | 1 |
| `perm-2e-shared` | 2 |
| `perm-access-disable` | 3 |
| `perm-answers-locked` | 3 |
| `perm-closed-project` | 11 |
| `perm-disable-allow-open` | 3 |
| `perm-disable-election-1co` | 1 |
| `perm-disable-election-2co` | 1 |
| `perm-disjoint-1co` | 2 |
| `perm-header-show-help` | 1 |
| `perm-hide-all-nominations` | 1 |
| `perm-hide-category-tags` | 1 |
| `perm-hide-election-tags` | 1 |
| `perm-hide-hero` | 1 |
| `perm-hide-if-missing-answers` | 1 |
| `perm-interactive-info` | 4 |
| `perm-localisation-positive` | 2 |
| `perm-missing-nominations` | 1 |
| `perm-not-located-2e2cg` | 5 |
| `perm-org-matching` | 3 |
| `perm-per-app-notifications` | 2 |
| `perm-question-video` | 4 |
| `perm-show-feedback-survey` | 6 |
| `perm-startfromcg` | 2 |
| `storage-cleanup` | 3 |
| `voter-alliance` | 1 |
| `voter-dark-mode` | 1 |
| `voter-journey` | 2 |
| `voter-journey-mobile` | 1 |
| `voter-nominations` | 1 |
| `voter-prefs-tracking` | 3 |
| `voter-results-redraw` | 5 |

**Not part of this baseline.** The two opt-in bank-auth projects and the visual project were not run. Plan 174-03 is the first plan of this phase to run the bank-auth projects (item 15 of the list at the end). The tests' utility suite (`tests/vitest.config.ts`, 73 tests in 5 files at Phase 173's close) is in no gate row and was not run here.

**The two closing verdicts on this tree, as the starting state.** Both are expected to fail until 174-07 and 174-09 have removed the old path.

`node …/174-verdict.mjs greps` — exit 1:

```text
1. 'invite-candidate': 75 hit(s) in 33 file(s)
2. 'inviteUserByEmail': 15 hit(s) in 9 file(s)
3. 'preregisterWithApiToken': 9 hit(s) in 5 file(s)
4. 'complete-registration': 4 hit(s) in 3 file(s)
174-verdict greps: FAIL (4)
FAIL 'invite-candidate': 75 hit(s) on the committed tree
FAIL 'inviteUserByEmail': 15 hit(s) on the committed tree
FAIL 'preregisterWithApiToken': 9 hit(s) on the committed tree
FAIL 'complete-registration': 4 hit(s) on the committed tree
```

The hits themselves are the second to fifth populations above (the first literal by file, the other three by line; `CLAUDE.md`, which the verdict excludes, accounts for one of the 34 files of the first).

`node …/174-verdict.mjs exemptions` — exit 1:

```text
EXEMPT holds 2 entries:
  /invite-candidate/g, // the invitation Edge Function — see phase 174
  /(?<=['"])(?:Candidate app|Party app|Candidate and party app)(?=['"])/g // the three shown names of the app, as whole quoted strings — see phase 171
no entry names 'get_candidate_user_data'
line 16 states 'exactly two entries': agrees with the array
line 55 states 'Exactly two entries': agrees with the array
174-verdict exemptions: FAIL (1)
FAIL EXEMPT still names 'invite-candidate' (1 entry)
```

**The hygiene verdict.** `node …/174-verdict.mjs hygiene` — exit 0:

```text
scan (i): 5 script(s), comment lines removed
  174-bankauth.sh: 0 hit(s)
  174-e2e.sh: 0 hit(s)
  174-gates.sh: 0 hit(s)
  174-stack-probe.sh: 0 hit(s)
  174-verdict.mjs: 0 hit(s)
  scripts/assert-auth-signup-closed.mjs: not on the tree yet
scan (ii): 10 plan file(s)
  advisory 174-01-PLAN.md:414 (action): the environment-printing command with no variable name after it: - `hygiene`: two scans, each listing the file and the line of every hit, exit 0 only with no hit. Scan (i) reads th …
  advisory 174-01-PLAN.md:414 (action): a container log read without a filter: - `hygiene`: two scans, each listing the file and the line of every hit, exit 0 only with no hit. Scan (i) reads this phase's scripts — every …
  174-01-PLAN.md: 2 action(s), 2 automated verify command(s), 1 verification block(s): 0 hit(s)
  174-02-PLAN.md: 4 action(s), 4 automated verify command(s), 1 verification block(s): 0 hit(s)
  174-03-PLAN.md: 6 action(s), 6 automated verify command(s), 2 verification block(s): 0 hit(s)
  174-04-PLAN.md: 5 action(s), 5 automated verify command(s), 1 verification block(s): 0 hit(s)
  174-05-PLAN.md: 7 action(s), 7 automated verify command(s), 1 verification block(s): 0 hit(s)
  174-06-PLAN.md: 5 action(s), 5 automated verify command(s), 1 verification block(s): 0 hit(s)
  174-07-PLAN.md: 5 action(s), 5 automated verify command(s), 1 verification block(s): 0 hit(s)
  174-08-PLAN.md: 4 action(s), 4 automated verify command(s), 1 verification block(s): 0 hit(s)
  174-09-PLAN.md: 4 action(s), 4 automated verify command(s), 1 verification block(s): 0 hit(s)
  174-10-PLAN.md: 4 action(s), 4 automated verify command(s), 1 verification block(s): 0 hit(s)
hits: 0; advisory lines (no verdict): 2
174-verdict hygiene: PASS
```

The two advisory lines are this plan's own description of the forbidden forms, in an action, where the container forms are not hits. A negative control was run once and removed: a throwaway script and a throwaway plan file holding every form gave exit 1 with fifteen hits — three file forms and seven container forms in the script, two file forms in the action, two container forms in the automated verify command, one in the verification block — and no hit for a comment line, for the tracked template's name, for a read of one named variable, for a filtered log, or for the action of a checkpoint task.

**State left behind.** The gate set reset the local database; after the E2E run `yarn db:seed:default` exited 0 (752 rows). No dev server: nothing listens on 5173 or 5273.

## What differs and which plan it touches

Differences from what a plan states, then notes a later plan needs although nothing differs.

1. **`git grep -n -E "^\s+name: '"` prints nothing on this host** (Populations). `-E` understands neither `\b` nor `\s` here; the Playwright project names are read with `-P`: 109 `name:` lines in `tests/playwright.config.ts`, 103 projects in the default run. Touches every plan that adds a Playwright project and re-derives the list: 174-03 (`auth-service-contract`), 174-06 (`invitation-contract`), 174-09 (`invitation-landing`).
2. **`ls apps/frontend/messages` lists eight entries, not seven** (Populations): `da en et fi fr lb sv` and `README.md`. A test that compares the mail templates' locale set with "the directory listing" must list directories only. Touches 174-05 (the templates module's test).
3. **`getLinksInEmail` is a member of the object `createEmailBucket` returns, not an export** (Names, the E2E harness). A helper that needs it takes a bucket. Touches 174-06 and 174-09.
4. **The abstract twin of `preregisterWithApiToken` is `_preregister`** (Names, the frontend). The pair to delete is those two names, the type member, and the five test cases. Touches 174-07.
5. **`ADMIN_GRANTS` admits no editor, and the Contestant App's login gate refuses a user with no contestant grant** (Facts X1, X4). A claimed `(project, editor)` promise opens neither app; a first-time invitee is admitted only if the claim and the refresh precede the gate. Touches 174-08 (the admission sequence) and 174-09 (the landing spec); ruling 18 hands both to Phase 178.
6. **`_getBasicUserData` tests the admin shapes first** (Names, the frontend): a user who holds a project-admin grant and an entity-editor grant has `role: 'admin'`. The role does not decide the gates or the list. Touches 174-08 only where a test asserts the role of a claimed user.
7. **pgTAP has only been shown green on a freshly reset database** (Fact X5). Unchanged by this phase's drivers; a later plan that runs `pgtap` through `--rows` without `db-reset` is judged on whatever the database holds, as the driver's header says. Touches 174-02 and 174-04, which close on gate rows.

Notes, nothing differing:

8. **The only test of `envConfig.ts` on the tree is `invite-candidate/envConfig.test.ts`**, and `callerAuthority.test.ts` exists there alone. When the directory is deleted, `envConfig.ts` (still three copies if the new function carries one) and `send-email/callerAuthority.ts` have no test beside any copy, and `DUPLICATED_MODULES` must lose `jwtSegment.ts` and `callerAuthority.ts` (one copy each remains) or the gate fails with "expected at least two copies". Touches 174-05 (which copies the new function carries, with or without the test) and 174-07.
9. **The lint chain has twenty links, and three prose sentences state a position in it** ("link 6 of" once, "link 13 of" twice). A gate added to the chain goes at the end, or the sentences after its position are corrected in the same commit. Touches 174-03 (`scripts/assert-auth-signup-closed.mjs`).
10. **`PROJECT_SCOPED_RPCS` and `PROJECT_SCOPED_EDGE_FUNCTIONS` are closed lists read against `apps/frontend/src`.** A new adapter `.rpc('claim_invitations', …)` or `functions.invoke('account-access', …)` needs its entry with a project term, and the loop in `projectScopingGate.test.ts` names the three functions literally. Touches 174-05, 174-07 and 174-08.
11. **Two `enable_signup` and two `enable_confirmations` keys exist in `config.toml`.** The ones this phase changes are under `[auth]` and `[auth.email]`; the pair further down belongs to another provider table. An edit and a gate anchor on the table header. Touches 174-03.
12. **`SAME_PERMISSION_ALLOW` holds one entry and `m17_unenforced_ratified` six.** After 174-02 they hold three and four, if and only if the linter and the test report exactly the two expected permissions on the applied schema (ruling 2).
13. **The census strings to edit in 174-04** are the description `'… are the same six plus get_entity_basic_data'` and the seven-name list above it; the `anon` pair is not touched.
14. **The gate set of this phase resets the database in its `db-reset` row.** Order for every plan that runs it: gate set, then the E2E run, then `yarn db:seed:default`. `174-gates.sh` refuses to start with `db-reset` selected while anything listens on the wrapper's port or a run directory was started within ten minutes and has not ended.
15. **The two opt-in bank-auth projects are not in this plan's baseline.** They were last green at Phase 172's close (8 of 8 and 134 of 134) and have not run since Phase 173 changed the login gate, the app root and the route tree; `identity-callback` redirects to `/contestant`, now the root's three-way decision. **Plan 174-03 is the first to run them** (`174-bankauth.sh 174-03`). A red there before 174-03's own change takes effect is Phase 173's to explain, not this phase's to absorb; 174-03 changes the auth configuration in the same plan, so a red is first diagnosed from the trace against both causes.
16. **`174-stack-probe.sh` and `174-bankauth.sh` were not run in this plan**, as the plan directs: they passed `bash -n`, their usage refusals and the hygiene verdict, and the probe's parsing helpers were exercised on sample input. Their first live run is 174-03's (Task 1 step 1: `174-stack-probe.sh before`). What the running edge container carries for `SITE_URL`, `SMTP_HOST` and `SMTP_PORT` is therefore unmeasured here; the research read `SMTP_PORT=2500` there on 2026-10-06.

## Measurements

Facts measured by a plan after 174-01, on the real local stack. Each row names the plan that measured it; counts are snapshots, never targets.

| Id | Plan | Claim or question | Result | Command or evidence |
|---|---|---|---|---|
| A11 | 174-02 Task 3 | Storage-related pgTAP files (06, 20, 28, 31) are unaffected by a table that has no storage policy | **holds.** With `public.invitations`, its three policies and `create_invitations` applied, on a freshly reset database: `06-storage-rls`, `20-storage-authority`, `28-storage-table-parity` and `31-storage-cleanup` each `ok`; the whole suite 39 files, 1569 tests, `Result: PASS` (1447 before, plus the 122 of `39-invitations`). Nothing in any storage file moved | `yarn db:reset && yarn db:types && git diff --exit-code -- packages/supabase-types/src/database.ts && yarn workspace @openvaa/supabase test:db` (exit 0) |
| M1 | 174-02 Task 1 | What `25-matrix-conformance` reports once the three invitation policies are applied and the list is untouched | exactly the expected finding and no other: `Failed test 3: "enforcement census: no permission member on the unenforced list is read by any policy"`, `Unexpected records: (project.manage_editors) (account.manage_admins)`; 1 of 40 failed in that file, every other one of the 38 files green (1447 tests) | `yarn workspace @openvaa/supabase test:db` (exit 1), before the list edit |
| M2 | 174-02 Task 1 | What `lint-schema.mjs` check 9001 reports on the same schema | exactly the expected finding and no other: `public.invitations: read and write permission sets intersect on 'account.manage_admins'` and `… on 'project.manage_editors'`; no `reaches neither` row, no other table; `supabase db lint` itself `No schema errors found`. Census `policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)`, `2 error(s), 3 warning(s)` before the edit and `0 error(s), 3 warning(s)` after | `yarn db:lint:sql` (exit 1, then 0) |
| M3 | 174-02 Task 1 | Can the three code functions be revoked from `authenticated`, as the plan's action says, while the insert trigger is `SECURITY INVOKER`? | **no.** With `EXECUTE` revoked from `authenticated`, a project editor's insert of a code row raises `42501 permission denied for function generate_invitation_code` from `prepare_invitation()`; the same for `service_role` when it is not granted. The tree therefore revokes the three from `PUBLIC` and `anon` and grants them to `authenticated` and `service_role`. They are in `private`, which PostgREST does not expose | a rolled-back `psql` transaction applying the schema file, then `REVOKE … FROM authenticated` and an insert as that role |
| M4 | 174-02 Task 3 | Do the new assertions discriminate? | yes. On a database deliberately weakened in four ways (the `INSERT` policy reduced to `project.edit_entities` alone; `INSERT` on the five server-side columns, table `UPDATE` and table `SELECT` granted to `authenticated`; `private.localized_has_text` always true), 27 of the 122 assertions of `39-invitations` failed and no other file moved. The two self-promotion cases through `create_invitations` stayed green on that database while their direct-insert twins failed: the function's `INSERT … RETURNING id` also has to pass the `SELECT` policy, so the direct insert is the case that isolates the `INSERT` policy. The database was reset afterwards | `yarn workspace @openvaa/supabase test:db` on the mutated database (exit 1), then `yarn db:reset` |

**Gate set `174-02-close` — `tests/e2e-runs/174-gates/174-02-close`, exit 0, 8 rows, every status 0.** Written by plan 174-02, Task 4. Run with `--rows typecheck,lint,db-reset,types-regen,types-clean,pgtap,sql-lint,unit` on head `3fd1c9ad1` (the last commit of that plan outside `.planning/`). Window 2026-10-06 23:14:25 to 23:17:09 local, on AC power under `caffeinate -dimsu`; `power.txt` records `sleep_entries_in_window: 0`. `node …/174-verdict.mjs gates 174-02-close --rows <the eight>` exits 0 ("8 expected (the named subset), 8 recorded"; "not stale"). It was the first attempt. It is a subset: it is never read as the full gate set, and it holds no `check-frontend`, `build`, `format`, `docs-links` or `name-gate-self-test` row.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 19 |
| lint | 0 | 46 |
| db-reset | 0 | 29 |
| types-regen | 0 | 3 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 3 |
| unit | 0 | 59 |

Read from the rows' logs: pgTAP **39 files and 1569 tests**, `Result: PASS` (38 and 1447 in the baseline; the difference is `39-invitations.test.sql` with `plan (122)`, and `25-matrix-conformance` still plans 40); the schema linter's census "policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)", `0 error(s), 3 warning(s)` (104 and 20 in the baseline; the three warnings are the baseline's); unit totals equal to the baseline's in every workspace (frontend 2546 passed and 7 skipped in 159 files and one skipped file, dev-seed 1015 in 67, supabase functions 206 in 15, app-shared 141 in 10, data 244 in 47). Schema files 29 (27 before), one migration of 7105 lines.

**The hygiene verdict after 174-02.** `node …/174-verdict.mjs hygiene` exits 0: 0 hits, the same two advisory lines as at the baseline.

**State left behind by 174-02.** The gate set reset the local database; `yarn db:seed:default` was run after it. No dev server was started.

### Plan 174-03

The same columns as the table above. Plan start `ef110d349`.

| Id | Plan | Claim or question | Result | Command or evidence |
|---|---|---|---|---|
| S1 | 174-03 Task 1 | What the RUNNING stack is, before any edit | as the research measured: container `GOTRUE_DISABLE_SIGNUP=false`, `GOTRUE_MAILER_AUTOCONFIRM=true`; served settings `disable_signup false`, `mailer_autoconfirm true`; a live `POST /signup` answered 200 and a live `POST /otp` with `create_user` answered 200; two probe users found and deleted, 0 left. Edge container: `SITE_URL http://127.0.0.1:5173` (EQUAL to the template as it then stood), `SMTP_HOST inbucket` (EQUAL), **`SMTP_PORT 2500` against the template's `1025` (DIFFERS)**. This was the first live run of `174-stack-probe.sh`; no defect in the driver | `bash …/174-stack-probe.sh before` (exit 0) → `tests/e2e-runs/174-gates/174-03-probe-before.txt`. The first attempt (23:24:03 local, kept as `174-03-probe-before-attempt1.txt`, identical rows) fell inside a DarkWake interval of the host (`pmset -g log`: `23:20:00 Sleep … Entering DarkWake state due to 'Idle Sleep'`, `23:24:40 Wake … DarkWake to FullWake`), so the evidence file was made again at 23:31:18 under `caffeinate`, outside any such interval |
| S2 | 174-03 Task 1 | Fallout command 1: does product or test code sign up publicly or ask the auth service for an OTP? | **no.** The search prints nothing (exit 1). A wider search for `signUp(` / `signInWithOtp(` anywhere outside `.planning`, markdown and `.claude`, and one for a hand-built request to `auth/v1/signup` or `auth/v1/otp`, print nothing either | `git grep -n -P '\bauth\s*\.\s*(signUp\|signInWithOtp\|signInAnonymously\|signInWithOAuth\|signInWithIdToken)\b' -- ':!.planning' ':!*.md' ':!apps/docs' ':!.claude'` |
| S3 | 174-03 Task 1 | Fallout command 2: does every service-side user creation vouch for the address? | **yes, four sites, each with `email_confirm: true`**: `identity-callback/index.ts` (one), `tests/tests/utils/supabaseAdminClient.ts` (two), and `supabaseDataWriter.integration.test.ts` (one; the research's command named the first two files only) | `git grep -n -P 'admin\s*\.\s*createUser' -- . ':!.planning' ':!*.md' ':!apps/docs' ':!.claude'`, each read with `-A4` |
| S4 | 174-03 Task 1 | Fallout command 3: what still talks to the auth service with the anon key? | password sign-in (`supabaseDataWriter.ts`, `passwordLogin.ts`), `resetPasswordForEmail` (the writer and the E2E admin client), `updateUser({ password })` (three sites of the writer), `verifyOtp` (the auth callback and the preregister route). None creates a user | `git grep -n -P '\bauth\s*\.\s*(signInWithPassword\|resetPasswordForEmail\|updateUser\|verifyOtp)\b' -- apps/frontend/src tests ':!*.test.ts'` |
| S5 | 174-03 Task 1 | The tracked mentions of the old `SITE_URL` value, each decided | four lines. The two templates (`.env.example`, `apps/supabase/supabase/functions/.env.example`) now hold `http://localhost:5173`. `tests/IDURA-TEST-RUNBOOK.md` Option B quotes the functions' template and follows it; its sentence that the value matches `[auth].site_url` now says it is the template's value. The runbook's step E-1 line builds the bank-auth run's own generated file and keeps `http://127.0.0.1:5173`. Nothing in code reads or asserts the value | `git grep -n -F "SITE_URL=http://127.0.0.1:5173" -- . ':!.planning'` (one line left, the generated one) |
| S6 | 174-03 Task 1 | Does the gate reject the configuration as it stood? | yes. Run over the configuration of `ef110d349` it exits 1 naming `[auth] enable_signup is true` and `[auth.email] enable_confirmations is false`; with no file to read it exits 1; on the tree it exits 0; `--self-test` passes seven cases (the required text, and six that must each report exactly one key). The chain has 21 links and ends with `yarn assert:auth-signup-closed`; the three sentences that state a link's position ("link 6 of", "link 13 of" twice) are unmoved | a scratch copy of the script beside `git show ef110d349:apps/supabase/supabase/config.toml`; `node scripts/assert-auth-signup-closed.mjs --self-test` |
| S7 | 174-03, an addition before Task 1's edits | Are the two opt-in bank-auth projects green on the tree and stack as Phases 172 and 173 left them, before this plan changes the auth configuration? | **yes, both.** `174-03-pre-bank-auth`: total 8, passed 8; project `bank-auth` 6 of 6; issuer `https://test-idp.example.com`. `174-03-pre-bank-auth-journey`: total 152, passed 152, 90 projects; project `bank-auth-journey` 1 of 1; issuer `https://127.0.0.1:9443`. Failed, flaky, skipped and did-not-run 0 in both; head `ef110d349`; `sleep_entries_in_window: 0` in both. The restore passed (`yarn db:stop` 0, `yarn db:start` 0, the three functions answering `OPTIONS` 200, ports 5273, 8777 and 9443 free) and both probes exited 0 (`170-allowlist-probe.sh after`, `174-stack-probe.sh before`). So a red in either project after this plan's restart is this plan's configuration, not Phase 173's change of the login gate, the app root or the route tree. This was the first live run of `174-bankauth.sh`; no defect in the driver | `bash …/174-bankauth.sh 174-03-pre before` (exit 0), window 23:24:42 to 23:30:53 local, under `caffeinate`; `node …/174-verdict.mjs e2e 174-03-pre-bank-auth --allow-slice --expect-project bank-auth` and `… 174-03-pre-bank-auth-journey --allow-slice --expect-project bank-auth-journey` (both exit 0); evidence under `tests/e2e-runs/174-e2e/_drivers/174-03-pre.bankauth.*` |
| A1 | 174-03 Task 2 | The CLI maps `[auth] enable_signup = false` to `GOTRUE_DISABLE_SIGNUP=true` and `[auth.email] enable_confirmations = true` to `GOTRUE_MAILER_AUTOCONFIRM=false` | **holds.** After `yarn db:stop` (exit 0) and `yarn db:start` (exit 0) on head `814f0a32e`: container `GOTRUE_DISABLE_SIGNUP true`, `GOTRUE_MAILER_AUTOCONFIRM false`; served settings `disable_signup true`, `mailer_autoconfirm false`; a live `POST /signup` answered `422 signup_disabled` and a live `POST /otp` with `create_user` answered `422 signup_disabled`; probe users `0 found, 0 left`. Every row OK. The allowlist probe, run first, exits 0 with every row OK | `bash …/174-stack-probe.sh after --only auth` (exit 0) → `tests/e2e-runs/174-gates/174-03-probe-auth.txt`; `bash …/170-allowlist-probe.sh after` (exit 0); 23:35:03 to 23:35:06 local, under `caffeinate` |
| S8 | 174-03 Task 2 | What the edge runtime was started with, for the three variables the sign-in mail depends on | **exit 1: two rows DIFFER.** `SITE_URL`: container `http://127.0.0.1:5173`, tracked template `http://localhost:5173`, DIFFERS. `SMTP_HOST`: `inbucket` both, EQUAL. `SMTP_PORT`: container `2500`, tracked template `1025`, DIFFERS. The three functions answer `OPTIONS` 200 under `policy = "per_worker"`, and the container's `PUBLIC_PROJECT_ID` is the default project `00000000-0000-0000-0000-000000000001` | `bash …/174-stack-probe.sh after --only edge` (exit 1) → `tests/e2e-runs/174-gates/174-03-edge-env.txt` |
| S9 | 174-03 Task 3 | Was the operator's checkpoint needed? | **needed.** Two of the three rows of S8 read DIFFERS, so the plan stops at Task 3 for the operator to set, in this host's untracked function environment file, `SITE_URL=http://localhost:5173`, `SMTP_HOST=inbucket` and `SMTP_PORT=1025` (the tracked template's values). No command of the executor named, opened or changed that file. Task 4 restarts the stack and reads the three variables again | `tests/e2e-runs/174-gates/174-03-edge-env.txt` |
| S10 | 174-03 Task 3 | The checkpoint's outcome | **operator confirmed done, 2026-10-07**: the three lines are set in this host's untracked function environment file. The confirmation was relayed to the executor that resumed the plan; no command of either executor named, opened or changed that file. S11 is the verification | the operator's reply `done` |
| S11 | 174-03 Task 4 | After the operator's change and one restart, what the running stack is | **every row OK, three edge rows EQUAL.** `yarn db:stop` (exit 0), `yarn db:start` (exit 0), on a tree equal to `814f0a32e` outside `.planning/`. Auth part unchanged from A1: container `GOTRUE_DISABLE_SIGNUP true`, `GOTRUE_MAILER_AUTOCONFIRM false`; served settings `disable_signup true`, `mailer_autoconfirm false`; live `POST /signup` and live `POST /otp` with `create_user` each `422 signup_disabled`; probe users `0 found, 0 left`. Edge part: `SITE_URL` container `http://localhost:5173`, template `http://localhost:5173`, EQUAL; `SMTP_HOST` `inbucket` both, EQUAL; `SMTP_PORT` container `1025`, template `1025`, EQUAL. The allowlist probe, run first, exits 0 with every row OK | `bash …/170-allowlist-probe.sh after` (exit 0); `bash …/174-stack-probe.sh after` (exit 0) → `tests/e2e-runs/174-gates/174-03-probe-after.txt`; 2026-10-07 10:54:50 to 10:55:33 local, under `caffeinate -dimsu`; `pmset -g log` holds no Sleep, Wake or DarkWake entry after 10:50 |
| S12 | 174-03 Task 4 | Does a mail sent by an Edge Function reach the local catcher? | **yes.** `174-mail-probe.mjs`, eight steps, every one PASS: both keys captured; the edge runtime serves `00000000-0000-0000-0000-000000000001` (one named read); a user `r174-probe-mail-<epoch>@test.openvaa.local` created through the admin API with a confirmed address; one `(project, that project, admin)` grant inserted through REST (201); a password sign-in issued a session; `send-email` answered 200 with `sent 1, failed 0`; a message whose subject carries the nonce reached the catcher's API on port 54324 within 0 s of the first poll; the user deleted and confirmed gone (404). It was the script's first run | `node …/174-mail-probe.mjs` (exit 0) → `tests/e2e-runs/174-gates/174-03-mail-probe.txt`; 10:56:47 local |
| S13 | 174-03 Task 4 | The wider effect of `[edge_runtime] policy = "per_worker"` on the three existing functions | three measurements, no finding. **(1)** an `OPTIONS` request to `identity-callback`, `invite-candidate` and `send-email` each answers 200. **(2)** the mail probe of S12 passed under the policy. **(3)** `git grep -n -E "^(let\|var) " -- 'apps/supabase/supabase/functions/*/index.ts'` prints nothing (exit 1): no `index.ts` declares a module-level `let` or `var`. A wider look, not asked by the plan, at every module-level `const` of the functions' non-test sources finds fifteen, all immutable in use: three `corsHeaders` literals, string and array constants of the grant vocabulary, `PROVIDER_CONFIGS` (read only), and one global regular expression, `PLACEHOLDER_PATTERN` in `send-email/templateVars.ts`, used only through `String.prototype.replace`, which starts from index 0 on every call and so carries nothing from one request into the next. Whether a background task completes after the response is not measured here; it is 174-05's | the three `curl -X OPTIONS` calls; `git grep -n -E "^(export )?const [A-Za-z_]+" -- 'apps/supabase/supabase/functions/*/*.ts' ':!*.test.ts'` |
| S14 | 174-03 Task 5 | Does the suite observe the running service refuse? | **yes, on the closed stack; not observed red.** Project `auth-service-contract` (`testDir ./tests/specs/auth`, `testMatch /public-signup-closed\.spec\.ts/`, no dependency, no `use` block), two tests, both passed: slice `174-03-contract-slice` total 2, passed 2, failed, flaky, skipped and did-not-run 0, one preflight success, head `5d02cf0f4`, window 11:00:46 to 11:01:01 local, `sleep_entries_in_window: 0`. The spec was never run against an open stack; that it would be red there follows from S1 (both requests answered 200 before the change), since each test first asserts status 422. The anon key reaches the test from the process environment the Playwright configuration already loads (`SUPABASE_ANON_KEY`, else `PUBLIC_SUPABASE_ANON_KEY`); the helper is called only from inside a test body, and `playwright test --project=auth-service-contract --list` lists exactly the two tests (listing without a key in the environment was not tried). **A limit of the second assertion:** `getAuthUserByEmail` reads the first page of the admin user list (the client's default page size) and treats a failed listing as an empty one, so "no user for the address" is weaker than the refusal it follows; the stack probe's own cleanup row pages through every user | `bash …/174-e2e.sh 174-03-contract-slice --project auth-service-contract` (exit 0); `node …/174-verdict.mjs e2e 174-03-contract-slice --allow-slice --expect-project auth-service-contract` (exit 0); `yarn typecheck:tests`, ESLint on the three files, `yarn assert:comment-hygiene`, `yarn lint:check` (each exit 0) |
| S15 | 174-03 Task 6 | The docs, and `CLAUDE.md` read against the change | three files, one commit (`e6de08acb`). The authentication page gains "Who can create an account" (both keys, the gate, the E2E project, the restart); the deployment page gains "Auth settings of a hosted project" (both dashboard switches, the `/auth/v1/settings` read with `disable_signup` and `mailer_autoconfirm`, and that the database has no guard of its own) and one bullet under step 2's Auth item; `apps/supabase/README.md` gains "Local auth and Edge runtime configuration" (the three keys, one restart after a pull that changes them, the functions' `SITE_URL`). The docs workspace's formatter realigned the one new table and reflowed nothing else, so there is no reflow commit. **`CLAUDE.md`: no sentence made false.** It names neither switch, nor `SITE_URL`, nor the edge runtime's policy, and states no count or position of `lint:check` links. It does not say that a change to `config.toml` or to the function environment needs a stack restart; that is an omission, not a contradiction | `yarn workspace @openvaa/docs validate:links --check` (exit 0, 0 findings); `node scripts/assert-no-candidate-app-names.mjs` (exit 0); `git diff --stat ef110d349..HEAD -- CLAUDE.md` prints nothing; `grep -n -i "sign-up\|signup\|SITE_URL\|per_worker\|oneshot\|confirm\|SMTP\|restart" CLAUDE.md` matches only the E2E wrapper line |

**The close of 174-03 — the head the runs describe is `5a63296e2`** (the last commit of the plan outside `.planning/`; every run's recorded head is tree-equal to it outside `.planning/`). Written by plan 174-03, Task 7. Every run was a first attempt under its label, on AC power under `caffeinate -dimsu`; no run is void and none was repeated.

**Gate set `174-03-close` — `tests/e2e-runs/174-gates/174-03-close`, exit 0, 15 rows, every status 0.** Window 2026-10-07 11:03:38 to 11:07:11 local; `sleep_entries_in_window: 0`. `node …/174-verdict.mjs gates 174-03-close` exits 0 ("15 expected (the full gate set), 15 recorded"; "not stale"). It is the first run that holds the rows `auth-config` and `stack`.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 45 |
| db-reset | 0 | 30 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 4 |
| unit | 0 | 61 |
| check-frontend | 0 | 9 |
| build | 0 | 15 |
| format | 0 | 18 |
| docs-links | 0 | 2 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

Read from the rows' logs: pgTAP 39 files and 1569 tests, `Result: PASS`; the schema linter's census "policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)", `0 error(s), 3 warning(s)` — all as at `174-02-close`; unit test files as there (frontend 159 passed and 1 skipped, dev-seed 67, supabase functions 15, app-shared 10, data 47); the `auth-config` row "3 key(s) hold in apps/supabase/supabase/config.toml".

**Default E2E run `174-03-close` — `tests/e2e-runs/174-e2e/174-03-close`, exit 0.** Counts: **total 200, passed 200, failed 0, flaky 0, skipped 0, did not run 0; 104 projects**; one preflight success, no preflight failure; scope the full default suite. Window 11:07:23 to 11:13:04 local; `sleep_entries_in_window: 0`. `node …/174-verdict.mjs e2e 174-03-close --same-projects-as 174-01-baseline --except auth-service-contract=2 --expect-project auth-service-contract` exits 0: "per project: 104 compared, 0 not as expected" (the 103 projects of the baseline each at its baseline total; `auth-service-contract` 0 + 2 = 2), "project auth-service-contract: 2/2 passed". The baseline held 198 tests in 103 projects. This run is also the boundary proof 174-02 left open: no spec that reads or writes entities, grants or the database types moved.

**Bank-auth driver `174-03` — exit 0.** `bash …/174-bankauth.sh 174-03 after`, 11:13:20 to 11:19:03 local.

| Run | Counts | Project | Issuer read back | Window (local) | `sleep_entries_in_window` | Verdict |
|---|---|---|---|---|---|---|
| `174-03-bank-auth` | total 8, passed 8, failed 0, flaky 0, skipped 0, did not run 0; 3 projects | `bank-auth` 6 of 6 | `https://test-idp.example.com` | 11:13:24 to 11:13:39 | 0 | `e2e 174-03-bank-auth --allow-slice --expect-project bank-auth` exits 0 |
| `174-03-bank-auth-journey` | total 152, passed 152, failed 0, flaky 0, skipped 0, did not run 0; 90 projects | `bank-auth-journey` 1 of 1 | `https://127.0.0.1:9443` | 11:13:47 to 11:18:24 | 0 | `e2e 174-03-bank-auth-journey --allow-slice --expect-project bank-auth-journey` exits 0 |

The same counts as the two runs made before the configuration changed (S7). So `identity-callback`, which creates its user through the admin API with `email_confirm: true`, is unaffected by closed sign-up and required confirmation, under the per-worker policy.

**The restore, and both probes after it** (`tests/e2e-runs/174-e2e/_drivers/174-03.bankauth.restore.txt`): `yarn db:stop` exit 0, `yarn db:start` exit 0, the edge-runtime container running, `OPTIONS` 200 from `identity-callback`, `invite-candidate` and `send-email`, ports 5273, 8777 and 9443 free; `170-allowlist-probe.sh after` **exit 0**, every row OK; `174-stack-probe.sh after` **exit 0**, every auth row OK and the three edge rows EQUAL (`SITE_URL http://localhost:5173`, `SMTP_HOST inbucket`, `SMTP_PORT 1025`). Both probes were run once more by hand after the driver ended and exit 0 again; `GOTRUE_DISABLE_SIGNUP` reads `true` and `GOTRUE_MAILER_AUTOCONFIRM` reads `false`, each by name.

**The hygiene verdict after 174-03.** `node …/174-verdict.mjs hygiene` exits 0: 7 scripts and 10 plan files scanned, 0 hits, the same two advisory lines as at the baseline.

**State left behind by 174-03.** The gate set reset the local database; `yarn db:seed:default` was run after the last run (exit 0). The stack is up, restarted by the bank-auth driver's restore. No dev server is running. The mail probe's one message (S12) is no longer in the mail catcher, which holds no message after the restore's restart; no `r174-probe-` user exists.

**For every later plan of this phase.** A change under `apps/supabase/supabase/functions/` or to `config.toml` reaches the running services only through `yarn db:stop` then `yarn db:start`, and is followed by both probes: `bash …/170-allowlist-probe.sh after` and `bash …/174-stack-probe.sh after`.

### Plan 174-04

The same columns as the tables above. Plan start `91dcf4321`. One commit that is not this plan's landed on the branch after it and before the plan's first commit: `c1d049136` (`docs(claude-md): add the void run to the E2E hard rule`, the operator's, 12:01 local); it changes `CLAUDE.md` alone.

| Id | Plan | Claim or question | Result | Command or evidence |
|---|---|---|---|---|
| C1 | 174-04 Task 1 | Do the service-side helpers move either definer census, the linter or any other file? | **no.** With the two `private` tables, `private.invitation_throttle_take`, the trigger function and the six `public` helpers applied, on a freshly reset database and with `07-rpc-security.test.sql` unmodified: 39 files, 1569 tests, `Result: PASS`; `supabase db lint` `No schema errors found`; the schema linter's census unchanged, "policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)", `0 error(s), 3 warning(s)`. The generated types gain exactly six `Functions` entries | `yarn schema:regenerate` (0), `yarn assert:schema-migration-parity` (0), `yarn db:reset` (0), `yarn db:types` (0), `yarn workspace @openvaa/supabase test:db` (0), `yarn db:lint:sql` (0), `yarn typecheck` (0) |
| C2 | 174-04 Task 2 | The precondition: does the running auth service refuse public sign-up, at the task's start and at its end? | **yes, both times.** Every auth row OK (`GOTRUE_DISABLE_SIGNUP true`, `GOTRUE_MAILER_AUTOCONFIRM false`, served `disable_signup true`, `mailer_autoconfirm false`, live `POST /signup` and live `POST /otp` with `create_user` each `422 signup_disabled`, probe users `0 found, 0 left`) and the three edge rows EQUAL | `bash …/174-stack-probe.sh after` (exit 0, twice) → `tests/e2e-runs/174-gates/174-04-probe-task2-start.txt` and `174-04-probe-task2-end.txt` |
| C3 | 174-04 Task 2 | What pgTAP reports once `claim_invitations` is applied and the census is untouched | exactly the expected finding and no other: `Failed test 20: "census: the SECURITY DEFINER functions in public that authenticated can execute are the same six plus get_entity_basic_data"`, `have: claim_invitations,contestant_app_public_config,get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant`; 1 of 39 failed in that file, every other one of the 39 files green. The `anon` assertion did not move. After the edit (one name added to the one list, and its description now ends "the same six plus claim_invitations and get_entity_basic_data"): 39 files, 1569 tests, PASS; linter census unchanged; the types gain one entry, `claim_invitations: { Args: { p_project_id: string }; Returns: Json }` | `yarn workspace @openvaa/supabase test:db` (exit 1, then 0); `yarn db:lint:sql` (0) |
| C4 | 174-04 Tasks 3 and 4 | Do the new assertions discriminate? | yes. On a database deliberately weakened in nine ways, 34 of the 259 assertions of `39-invitations` failed, plus the `authenticated` census of file 07, and no other file moved. Each mutation is caught by at least one assertion: the claim reading the token's `email` claim and ignoring `email_confirmed_at` (143, 144); ignoring `expires_at` (145); not re-asking the target's project (163, 164); reading the candidate-editor collision as fulfilled (156, 157); `used` defined as `claimed_by IS NOT NULL` (187); the link request with no rebinding interval (213 to 215), with any grant anywhere making an address eligible (194 to 196) and without the confirmation test (197); the look-up budget raised to 100 (217 to 219); the witness completed by an upsert (233, 235, 237, 238); the release deleting no slot (223, 227); the throttle-cleanup trigger dropped (258, 259); `EXECUTE` on two helpers granted to `authenticated` (239, 249, 250, and file 07) and on the claim to `service_role` (125, 127). The other three, 148, 149 and 201, fail as consequences of the same mutations (a grant written, an invitation claimed, a slot taken). The database was reset afterwards | the mutations as SQL: `tests/e2e-runs/174-gates/174-04-negative-control-mutant.sql`; the run: `174-04-negative-control-pgtap.log` (exit 1); then `yarn db:reset` (0) |
| C5 | 174-04 Task 3 | Which constraint is named when the caller already holds the candidate editor's grant an invitation promises (both unique rules are violated)? | `grants_user_scope_target_role_key`, as the research measured: the row is returned as claimed, marked claimed, and the candidate has one grant afterwards. pgTAP pins it ("an invitation for a grant its user already holds on a candidate is returned as claimed …") | Section 13 of `39-invitations.test.sql` |
| C6 | 174-04 Task 3 | Can a candidate be moved to another project under an open invitation, so that the claim's own re-ask is what refuses it? | yes. The fixture role's `UPDATE public.candidates SET project_id = …` succeeds (no trigger refuses it for that role), the invitation row survives with its old `project_id`, and the claim skips it with `target_not_in_project`, leaving it open and writing no grant | Section 13 |
| C7 | 174-04 Task 1 | What is left in `private.invitation_throttle` when a used code's row is deleted? | the `code:` key goes; **the `link:` key of the claimant's address stays** for the rest of its 60 seconds, because the claim clears the row's pending address and the trigger deletes the keys of the addresses the row still holds. A test that deletes a claimed code row and asks for a link to the same claimant address within a minute calls `invitation_link_release` first, or uses a fresh address | a rolled-back `psql` transaction: after `DELETE FROM public.invitations`, one key left |

**Gate set `174-04-close` — `tests/e2e-runs/174-gates/174-04-close`, exit 0, 10 rows, every status 0.** Written by plan 174-04, Task 5. Run with `--rows typecheck,lint,db-reset,types-regen,types-clean,pgtap,sql-lint,unit,auth-config,stack` on head `37dea9256` (the last commit of the plan outside `.planning/`). Window 2026-10-07 12:21:32 to 12:24:16 local, on AC power under `caffeinate -dimsu`; `power.txt` records `sleep_entries_in_window: 0` and no line calls the run void. `node …/174-verdict.mjs gates 174-04-close --rows <the ten>` exits 0 ("10 expected (the named subset), 10 recorded"; "not stale: head 37dea9256 is tree-equal to HEAD outside .planning/"; "power: no Sleep entry inside the run window"). It was the first attempt. It is a subset and is never read as the full gate set: it holds no `check-frontend`, `build`, `format`, `docs-links` or `name-gate-self-test` row. No E2E run was made by this plan; its boundary proof is the full run that closes 174-06.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 45 |
| db-reset | 0 | 30 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 3 |
| unit | 0 | 57 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

Read from the rows' logs: pgTAP **39 files and 1706 tests**, `Result: PASS` (1569 at `174-03-close`; the difference is `39-invitations.test.sql`, `plan (122)` → `plan (259)`: 53 assertions on the claim and 84 on the helpers; `07-rpc-security` still plans 39); the schema linter `No schema errors found` and its census "policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)", `0 error(s), 3 warning(s)`, all as at `174-03-close` (the two new tables are in `private`, which neither count scans); unit test files as there (frontend 159 passed and 1 skipped, dev-seed 67, supabase functions 15, app-shared 10, data 47); the `auth-config` row "3 key(s) hold in apps/supabase/supabase/config.toml"; the `stack` row "every row OK". Schema files 29, one migration of 7651 lines (7105 after 174-02).

**The server contract in SQL.** All seven are in `apps/supabase/supabase/schema/506-invitation-rpcs.sql`, in `public`, `SECURITY DEFINER` with `search_path = ''`, and each has exactly one signature. 174-05, 174-06 and 174-08 read this table.

| Function | Signature | Who may execute it | What it returns |
|---|---|---|---|
| `claim_invitations` | `(p_project_id uuid) RETURNS jsonb` | `authenticated` only; `anon` and `service_role` get `42501 permission denied for function claim_invitations` | `{"claimed": [...], "skipped": [...], "password_set": <boolean>}`. Each element is `{scope, target_type, target_id, role}`, `target_type` null on a project-scope one; a skipped element also has `reason`, one of `candidate_has_editor` and `target_not_in_project`. `password_set` is present whatever was claimed. The caller and its confirmed address come from `auth.uid()` and `auth.users`; nothing else is an input. A second call returns an empty `claimed`; a row skipped for `candidate_has_editor` is returned in `skipped` again on every later call, because it stays open |
| `invitation_code_status` | `(p_project_id uuid, p_code text) RETURNS text`, `STABLE` | `service_role` only | exactly one of `valid`, `used`, `unknown`. The code is compared as typed (case, spaces and hyphens are normalised inside) |
| `invitation_link_request` | `(p_project_id uuid, p_email text DEFAULT NULL, p_code text DEFAULT NULL) RETURNS text` | `service_role` only | the address a sign-in mail may go to, trimmed and lower-cased, or null for "do nothing". A non-null answer has taken the address's 60-second slot and, for an open code, bound the address. With a used code the answer is the claimant's own address as `auth.users` holds it and `p_email` is ignored. A null answer has changed no invitation row |
| `invitation_link_release` | `(p_project_id uuid, p_email text, p_code text DEFAULT NULL) RETURNS void` | `service_role` only | nothing. Deletes the slot of `p_email` in the project and, when `p_code` names an open row whose pending address is `p_email`, clears that row's `pending_email_at`. `p_email` is the address the request returned, which for a used code is the claimant's and not the typed one |
| `invitation_code_claimant_email` | `(p_project_id uuid, p_code text) RETURNS text` | `service_role` only | the claimant's address for a used code whose claimant exists, else null; null from the eleventh answer inside fifteen minutes |
| `invitation_link_witness_open` | `() RETURNS uuid` | `service_role` only | the id of a new open record; records opened more than a day ago are deleted first |
| `invitation_link_witness` | `(p_id uuid, p_outcome text DEFAULT NULL) RETURNS text` | `service_role` only | the record's outcome: `sent`, `not-sent`, or null when the record does not exist or is still open. With `p_outcome` (`sent` or `not-sent`; anything else raises `22023`, message `invitation_link_witness: p_outcome must be sent or not-sent`) it first completes the record if it exists and is open; a completed record keeps its first outcome |

Notes for the callers:

- **The generated types say `Returns: string` where the function can answer null** (`invitation_link_request`, `invitation_code_claimant_email`, `invitation_link_witness`), and `Returns: undefined` for the release. A caller tests for null whatever the type says.
- **Both the claimant look-up and a link request with a used code count against the same key**, `code:<project id>:<code hash>`, ten per fifteen minutes. A release does not give a look-up back.
- **The slot is keyed on the address a mail would go to**, `link:<project id>:<sha256 hex of the lower-cased, trimmed address>`. Two requests for one address inside 60 seconds answer the address and then null, whether or not a code was presented, and a rebinding of one code inside 60 seconds answers null before any slot is asked.
- **Time inside one transaction does not move** (`now()`), so a pgTAP file moves a window by rewriting `window_start` or `pending_email_at` as the fixture role; over PostgREST each call is its own transaction and the intervals are real.
- **Also in the file, not callable through the API:** `private.user_password_set(uuid) RETURNS boolean` (no API role holds `EXECUTE`; Phase 178 can call it from a definer function), `private.invitation_throttle_take(text, integer, interval) RETURNS boolean`, the tables `private.invitation_throttle` and `private.invitation_link_witness` (row-level security enabled, no policy, no privilege for `anon`, `authenticated` or `service_role`), and the trigger `cleanup_invitation_throttle` on `public.invitations` with its function `public.cleanup_invitation_throttle_on_delete()`.

**State left behind by 174-04.** The gate set reset the local database; `yarn db:seed:default` was run after it (exit 0, 752 rows). The stack was not restarted (no file under `apps/supabase/supabase/functions/` and no `config.toml` changed). No dev server was started and nothing listens on 5173 or 5273.

### Plan 174-05

The same columns as the tables above. Plan start `46571050d`. Rows E1 to E8 were measured by Tasks 1 and 2 through an uncommitted probe function, `r174-probe`, served between two restarts of the stack (12:31 and 12:36 local, 2026-10-07) and asked by `174-edge-facts.mjs`; the function's directory no longer exists and its endpoint answers 404. Everything here is the LOCAL stack: Supabase CLI `v2.118.0`, `[edge_runtime] policy = "per_worker"`, `supabase-js` `2.117.2` inside the function.

| Id | Plan | Claim or question | Result | Command or evidence |
|---|---|---|---|---|
| E1 (A3) | 174-05 Task 2 | Does the edge runtime accept a call carrying only the anon key when no `[functions.<name>]` table exists? | **yes.** A `POST` with the anon key as `apikey` and as bearer: 200, reached the function. A `POST` with the `apikey` header alone and no `Authorization`: 200, reached the function. A `POST` with no key: **401, did not reach the function**. **What later tasks do with it:** Task 6 adds no `[functions.account-access]` table and does not touch `config.toml`. Not measured: a hosted project, where the gateway's own JWT check is the platform's | `node …/174-edge-facts.mjs` (exit 0) → `tests/e2e-runs/174-gates/174-05-edge-facts.txt`, the three `A3` lines |
| E2 (A4) | 174-05 Task 2 | Under `per_worker`, does a task handed to `EdgeRuntime.waitUntil` complete after the response? | **yes.** The answer came after **5 ms**; the task waits 3000 ms and then sends one mail; the mail with the request's nonce reached the catcher **3559 ms after the answer**. The checkpoint the plan reserves for "the mail did not arrive" was not needed. **What later tasks do with it:** `request-link` answers first and does all its work in `EdgeRuntime.waitUntil` (Task 5). Under `policy = "oneshot"` this was not measured; the research cites the platform's documentation for the cut-off there | the two `A4` lines of the same file |
| E3 (A7) | 174-05 Task 2 | Which key of the error object of `auth.admin.generateLink({ type: 'invite' })` carries `email_exists` for a confirmed user? | **`code`.** The error's own enumerable keys: `__isAuthError=true`, `name="AuthApiError"`, `status=422`, `code="email_exists"`; `message` (not enumerable) reads "A user with this email address has already been registered". **What later tasks do with it:** `createPasswordlessUser` swallows an error only when `error.code === 'email_exists'`, and Task 6's conformance test pins that this is the only code compared | the two `A7` lines |
| E4 | 174-05 Task 2 | The redirect question: what does the auth service's `Location` say for an admitted and for a refused callback URL? | `GET /auth/v1/verify?token=<invalid>&type=magiclink&redirect_to=<url>` with the anon key, redirects not followed, each **303**. For `<SITE_URL>/en/api/auth/callback` (`http://localhost:5173/en/api/auth/callback`): `Location` without its query and fragment is **that same URL**. For `https://not-allowed.example/en/api/auth/callback`: `Location` without its query and fragment is **`http://127.0.0.1:5173`**, the auth service's own `site_url`, with no path. **The rule:** a callback URL is admitted exactly when the `Location` names it, that is, has the requested URL's origin and the requested URL's path; any other URL, and an absent header, is a refusal. `isRedirectAdmitted` of Task 3 implements exactly this, and its test also covers a `Location` on another origin with the same path | the two `redirect` lines |
| E5 | 174-05 Task 2 | The served settings as the function reads them | `GET <SUPABASE_URL>/auth/v1/settings` with the anon key answers 200; **`disable_signup` is the boolean `true`, `mailer_autoconfirm` is the boolean `false`**. `isSignUpClosed` of Task 3 accepts those two booleans and nothing else (not the strings) | the `settings` line |
| E6 (re-issue) | 174-05 Task 2 | Does a later `magiclink` token for one address invalidate the unopened one before it? | **yes.** Two tokens issued in a row for one confirmed address through `POST /auth/v1/admin/generate_link` (`verification_type magiclink` both, the two hashes differ). Verifying the FIRST afterwards (`POST /auth/v1/verify`, `type: magiclink`): **403 `otp_expired`**. Verifying the SECOND after that: 200 with a session. **Consequence, for 174-10's todo and for Phase 178's "email sent" screen: a later link for the same address makes the earlier unopened one stop working, so a third party who knows the address can invalidate the user's unclicked link once a minute (residual R-c of 174-01).** The per-address interval of 174-04 is what bounds it to once a minute. Phase 178's screen should say that only the newest mail's link works | the three `re-issue` lines |
| E7 | 174-05 Task 2 | What does the function observe of its caller? | Header names seen (the call with both keys): `accept`, `accept-encoding`, `accept-language`, `apikey`, `authorization`, `connection`, `content-length`, `content-type`, `host`, `sec-fetch-mode`, `user-agent`, `x-forwarded-for`, `x-forwarded-host`, `x-forwarded-path`, `x-forwarded-port`, `x-forwarded-prefix`, `x-forwarded-proto`, `x-real-ip`; the call with `apikey` alone lacks `authorization` and is otherwise the same. `x-forwarded-for` and `x-real-ip`: **`192.168.65.1` in both calls that reached the function** (the container network's gateway, not a client address); `cf-connecting-ip` and `sb-forwarded-for`: absent in both. The third call (no key) never reached the function, so there is no third value. **This is the local topology only (residual R-d of 174-01)**: every local caller looks the same, and on a hosted project these headers are the platform's and unmeasured. It goes into the todo of 174-10. Nothing in the function reads any of them (Task 6, conformance assertion (v)) | the `caller` lines |
| E8 | 174-05 Task 2 | Is a code change served without a restart under `per_worker`? | **no, not within the ten seconds measured.** With one literal of the probe's answer changed on disk and no restart, the first call after the edit and a call ten seconds later both answered the OLD literal. Whether a worker that has been idle for longer reloads the file was not measured. **What later tasks do with it:** every change to the function is followed by `yarn db:stop` then `yarn db:start` before it is observed, as the rule 174-03 left already says; a fix after a red live run is never judged without the restart | the lines after "code-change check" in the same file; `node …/174-edge-facts.mjs marker` |

**After the probe's removal** (Task 2, second restart): `ls apps/supabase/supabase/functions` lists `identity-callback`, `invite-candidate`, `send-email`; `git status --porcelain -- apps/supabase/supabase/functions` prints nothing; `OPTIONS /functions/v1/r174-probe` answers 404 and the three functions answer 200; `170-allowlist-probe.sh after` exits 0 (every row OK); `174-stack-probe.sh after` exits 0 (every auth row OK, the three edge rows EQUAL, probe users `0 found, 0 left`). Each restart was `yarn db:stop` (exit 0) then `yarn db:start` (exit 0). The mail catcher holds no message after a restart (`GET /api/v1/messages` on port 54324: `total 0`), so the probe's one mail is gone.

**E9 (A9), 174-05 Task 3 — can the function directory hold pure modules and their tests without tripping a gate other than check 3 of `assert-edge-env-defaults.mjs`? Holds: no gate moved.** With `account-access/` holding `envConfig.ts` (a byte-identical fourth copy), `contract.ts`, `mailTemplates.ts`, `signInLink.ts`, `deploymentChecks.ts` and the four tests beside them, and no `index.ts` yet: `yarn workspace @openvaa/supabase test:unit` 19 files and 403 tests (15 and 206 before; the four new files hold 197: contract 54, mailTemplates 70, signInLink 46, deploymentChecks 27); `yarn assert:edge-env-defaults` exit 0, "files scanned: 40; checks live: 3 of 3 … 0 violation(s)" with the script unmodified (check 2 accepts a fourth copy of `envConfig.ts`; check 3 finds no remote specifier and no `Deno` global in a module with a test beside it); `yarn assert:comment-hygiene`, `node scripts/assert-no-candidate-app-names.mjs` (2794 tracked files, 0 findings), `yarn assert:unit-coverage`, `yarn assert:edge-function-env`, `yarn assert:env-pair-registry`, `yarn assert:project-scoped-queries` and `yarn prettier --check` on the directory each exit 0. No list, allow-list or count in any gate was edited. The name gate reads tracked files only, so it was run again after `git add`. One sentence is transiently inexact and is 174-07's to reword in all copies at once: the docblock of `envConfig.ts` says its copies live in three directories, and there are four until `invite-candidate` is deleted.

**E10, 174-05 Task 6 — the function is served (third restart, 12:55 local).** `yarn db:stop` (exit 0), `yarn db:start` (exit 0) on head `2016c2871`. `OPTIONS /functions/v1/account-access` 200; `r174-probe` 404; `identity-callback`, `invite-candidate`, `send-email` 200; `170-allowlist-probe.sh after` exit 0 (every row OK); `174-stack-probe.sh after` exit 0 (every auth row OK, the three edge rows EQUAL, probe users `0 found, 0 left`). `config.toml` is not touched by this plan (E1). A first look by hand, each with the anon key as `apikey` and bearer: `GET` → 405 `{"error":"method-not-allowed"}`; a body that is not JSON → 400 `{"error":"bad-request"}`; a `project_id` that is not a uuid → 400 the same; `check-code` for a string that names nothing → 200 `{"status":"unknown"}`; `code-sign-in` for the same → 200 `{"result":"invalid-credentials"}`; `request-link` for an uninvited address → 200 `{"accepted":true}`. The function's log, read through the filter for its prefix, held no line.

**E11, 174-05 Task 7 — one live run of the whole contract: exit 0, twelve steps, every one PASS.** `node …/174-fn-probe.mjs` → `tests/e2e-runs/174-gates/174-05-fn-probe.txt`, 12:58:21 to 12:58:25 local, under `caffeinate -dimsu`, head `2016c2871` (the script itself committed as `5c952583a`). It was the script's first run. The function's log, read afterwards through the filter for its prefix over fifteen minutes, held no line. The lines, addresses shortened to their letter (each is `r174-probe-fn-<letter>-1791367102-966652@test.openvaa.local`):

```
PASS 1 keys — both captured
PASS 2 seed — four (project, editor) invitations in 00000000-0000-0000-0000-000000000001: by email for A, D and E, and one with a code
PASS 3 check-code — the code answers valid; a string that names nothing answers unknown
PASS 4 request-link, an invited address — answered 200 { accepted: true } in 4 ms; the witness read sent; one mail for A with the English subject; its only link is http://localhost:5173/en/api/auth/callback with token_hash and type=magiclink
PASS 5 request-link, the same address again — the same answer in 9 ms; the witness read not-sent; then still one mail for A
PASS 6 request-link, an address nobody invited — the same answer in 5 ms; the witness read not-sent; then no mail and no account for B (3 users read)
TIME request-link answered in 4 ms for the invited address and in 5 ms for the uninvited one
PASS 7 the link, the claim and the refresh — the token verified to a session with an empty grants claim; the claim returned one (project, editor) and password_set false; the refreshed token carries exactly that grant
PASS 8 request-link with a code, then the claim — the witness read sent; one mail for C; its token verified; the claim returned the code’s (project, editor); check-code now answers used
PASS 9 code sign-in — the right password answers signed-in with two tokens and nothing else; a wrong password and an unknown code answer the same invalid-credentials body
PASS 10 the origin of the link — with Origin and X-Forwarded-Host naming evil.example, the mail for D links to http://localhost:5173, as A’s does
PASS 11 a witness nobody opened — answered like any other; after its mail and a later request’s finished witness, the service role reads no record for that id
PASS 12 cleanup — 4 seeded invitation(s) and 4 user(s) deleted; none remains
174-fn-probe: PASS
```

- **The two answer times of `request-link`: 4 ms for the invited address A, 5 ms for the uninvited address B** (one sample each, local, measured by the caller around the whole HTTP exchange). The repeated request for A answered in 9 ms. The work that differs between them (two auth admin calls and an SMTP conversation for A, none for B) happens after the answer.
- **A second run, made by the task's own verify command** (`tests/e2e-runs/174-gates/174-05-fn-probe-verify.txt`, 13:02 local, same tree, no restart between): exit 0, the same twelve steps PASS with fresh addresses; `request-link` answered in 6 ms for the invited address and in 8 ms for the uninvited one. The function's log held no line after it either. The catcher then holds eight mails.
- **Every negative follows a witness.** Steps 5 and 6 read the catcher and the accounts only after their own request's witness read `not-sent`. Step 11's request names an unopened witness and so has none of its own; its read follows that request's own mail and the finished witness of a later request for the same address. That order is observed, not enforced: nothing proves the first request's last database call precedes the read, and the database half of the claim (a witness is completed by `UPDATE` only) is pinned by pgTAP (C4, the upsert mutation).
- **Not shown red.** The live run passed on its first attempt and was not repeated against a deliberately broken function; the two source-level tests were (below). The release of a slot after a failed send is covered by `linkIssue.test.ts` only: no live step makes the transport fail.
- **Negative controls, both restored afterwards.** `linkIssue.test.ts` (65 tests) against six mutations of `linkIssue.ts` (no release; no witness; the address in a log line; the release with the typed address; mint before create; the sign-up check ignored): 8, 16, 6, 5, 4 and 5 tests failed. `flowConformance.test.ts` (31 tests) against twelve mutations of `index.ts` (an `await` before the return; a module-level boolean; a module-level `Map`; the claimant in a log call; the `origin` header read; a project from the environment; a negative answer remembered; the user created by a `magiclink`; a second swallowed error code; a session kept; a mail sent outside the link issue; the sign-up memory given the redirect lifetime): each failed at least one test.

**Gate set `174-05-close` — `tests/e2e-runs/174-gates/174-05-close`, exit 0, 7 rows, every status 0.** Run with `--rows typecheck,lint,unit,format,name-gate-self-test,auth-config,stack` on head `5c952583a` (tree-equal outside `.planning/` to `2016c2871`, the last commit of the plan outside it). Window 2026-10-07 12:58:58 to 13:00:52 local, on AC power under `caffeinate -dimsu`; `power.txt` records `sleep_entries_in_window: 0` and the directory holds no void marker. `node …/174-verdict.mjs gates 174-05-close --rows <the seven>` exits 0 ("7 expected (the named subset), 7 recorded"; "not stale: head 5c952583a is tree-equal to HEAD outside .planning/"; "power: no Sleep entry inside the run window"). It was the first attempt. It is a subset and is never read as the full gate set: no `db-reset`, `types-regen`, `types-clean`, `pgtap`, `sql-lint`, `check-frontend`, `build` or `docs-links` row, because this plan changes no schema file, no migration, no generated type, no pgTAP file, no `config.toml`, nothing under `apps/frontend` and nothing under `tests` (`git diff --stat 46571050d..HEAD` over those paths prints nothing). The database was not reset, so nothing was re-seeded. No E2E run was made by this plan; its boundary proof is the run that closes 174-06.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 19 |
| lint | 0 | 44 |
| unit | 0 | 31 |
| format | 0 | 18 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

Read from the rows' logs: unit — supabase functions **21 files and 499 tests** (15 and 206 at `174-04-close`; the six new files hold 293: contract 54, mailTemplates 70, signInLink 46, deploymentChecks 27, linkIssue 65, flowConformance 31), frontend 159 files passed and 1 skipped with 2546 tests passed and 7 skipped, dev-seed 67 files and 1015 tests, app-shared 10 and 141, data 47 and 244, as at `174-04-close`; `auth-config` "3 key(s) hold in apps/supabase/supabase/config.toml"; `stack` "every row OK". `node …/174-verdict.mjs hygiene` exits 0: 9 scripts and 10 plan files scanned, 0 hits, the same two advisory lines as at the baseline.

**State left behind by 174-05.** The stack is up, restarted three times by this plan, and serves four functions (`account-access`, `identity-callback`, `invite-candidate`, `send-email`). The database was not reset and holds the `default` dataset as 174-04 left it; no invitation and no user of a probe remains. The mail catcher holds the four mails of the live run, for A, C, D and E (`GET /api/v1/messages`: `total 4`, all with the English subject), and those of any later run of the probe, until the next restart. Witness records the probe opened stay until the next `invitation_link_witness_open` call made more than a day later. No dev server was started.

### Plan 174-06

The same columns as the tables above. Plan start `cebe14793`. Everything here is the LOCAL stack as 174-05 left it; this plan changed no file under `apps/supabase/` and restarted nothing.

| Id | Plan | Claim or question | Result | Command or evidence |
|---|---|---|---|---|
| F1 | 174-06 Task 1 | Does the project-scoping gate ask for a disposition of `create_invitations`? | **no; the script is not touched.** `yarn assert:project-scoped-queries` exits 0 with the tree's lists as they were ("17 guarded source(s) … 0 violation(s)"): the gate scans `apps/frontend/src`, and the one caller of the RPC is the dev-seed admin client. `PROJECT_SCOPED_RPCS` gains its entry when an adapter under `apps/frontend/src` first calls the function | `yarn assert:project-scoped-queries` (exit 0) |
| F2 | 174-06 Task 1 | The two dataset rows as seeded, and the pins that moved | `e2e/base` holds a candidate `test-e2e-base-ca-invitation` (`first_name: 'Invited'`, `last_name: 'Entity Three'`, `confirmed: false`, `sort_order: 17`, no organization, no answers) and an organization `test-e2e-base-or-invitation` (`name.en: '[or-invitation] Party Invitation'`, `short_name.en: 'INV'`, a colour, `confirmed: false`, `sort_order: 6`). **Neither has a nomination**: the template's validation does not require one for a candidate, so none was added. Pins re-measured in `packages/dev-seed/tests/templates/base.test.ts`: organizations 6 → 7, candidates 32 → 33, nominations 64 (unchanged), the list of candidates that state `confirmed` (four → five) and of organizations that do (one → two). dev-seed unit totals 67 files and 1015 tests → 68 and 1030 | `yarn workspace @openvaa/dev-seed test:unit` (exit 0) |
| F3 | 174-06 Task 2 | Does the token the plan prescribes for the origin helper's test (`%2B`, `-`, `_`) detect a helper that parses and rebuilds the link? | **no.** A parse-and-rebuild through `URL` and `URLSearchParams` returns `ab%2Bcd-ef_gh` unchanged, so that test passes on such a helper. A second case was added with a token a rebuild alters (`ab%2bcd%7Eef~gh` comes back as `ab%2Bcd%7Eef%7Egh`). Negative control: with `toRunOrigin` replaced by a parse-and-rebuild, 1 of 22 tests fails, the added one; the plan's own token case passes on the mutant. The source was restored and compared byte for byte | `yarn vitest run --config tests/vitest.config.ts mailedLink` on the mutant (exit 1) and on the tree (exit 0, 22 tests) |
| F4 | 174-06 Task 4 | Does `fetch` on this runtime send `Origin` and `X-Forwarded-Host` as given? | **yes**, Node `v24.21.0`: a local listener received `origin: https://evil.example` and `x-forwarded-host: evil.example` from a `fetch` that set them. The spec does not rest on this measurement: its hostile-headers test first sends the same headers to a listener of its own and asserts that they arrived (`expectHeadersLeaveThisProcess`). What the gateway hands on to the function is not observable from a test and was not measured | a one-off `node -e` with `http.createServer`; the step in `invitationFlow.fixture.ts` |
| F5 | 174-06 Task 4 | The two slice runs | **both green on their first attempt.** `174-06-contract-slice`: total 17, passed 17, failed, flaky, skipped and did-not-run 0; `invitation-contract` 15 of 15; window 13:30:55 to 13:31:43 local. `174-06-contract-slice-again`: the same counts; window 13:31:52 to 13:32:11 local, started **9 seconds** after the first ended, with no restart, no reset and no release between them. Head `2c107fee3` in both; `sleep_entries_in_window: 0` in both; one preflight success each. The other two tests of each total are `data-setup-base` and `data-teardown-base` | `bash …/174-e2e.sh <label> --project invitation-contract` (exit 0, twice); `node …/174-verdict.mjs e2e <label> --allow-slice --expect-project invitation-contract` (exit 0, twice) |
| F6 | 174-06 Task 4, an addition | Is the spec ever red? | **yes, against three one-function mutations of the local database, each on exactly the test that names the property.** (1) `claim_invitations` taking every open email invitation of the project, whoever it is addressed to: `nobody else claims an invitation…` fails, the other user's claim returning the organization's grant; counts total 17, passed 7, failed 1, skipped 9. (2) `invitation_link_request` taking every address as eligible: `an address with no invitation is answered like an invited one, and gets no mail and no account` fails, its witness reading `sent`; passed 8, failed 1, skipped 8. (3) `private.invitation_throttle_take` never refusing: `a second request for one address inside the interval…` fails, its witness reading `sent`; passed 9, failed 1, skipped 7. The skipped tests are the rest of the serial walk. After each run the three original definitions were re-applied and their `md5(pg_get_functiondef(…))` read equal to the values before; the gate set's `db-reset` row then rebuilt the database from the migration. **These three runs are red by design and are not attempts at a green run** | labels `174-06-contract-slice-mutant-claim`, `-mutant-eligibility`, `-mutant-throttle` under `tests/e2e-runs/174-e2e/` (driver exit 1 each); the mutations and the per-run logs: `tests/e2e-runs/174-gates/174-06-negative-control-*` |
| F7 | 174-06 Tasks 4 and 5 | What a run of the spec leaves behind | **no user and no invitation.** After both slices, after the three mutant runs and after the full run: `auth.users` with an address beginning `invitation-contract-` 0; `public.invitations` 0 rows. The spec's `afterAll` asserts the same (`leftovers()` equal to `{ invitations: 0, users: 0 }`). **It leaves mails**: seven sign-in mails per green run stay in the catcher until the next stack restart (27 for the prefix after this plan's six runs, 38 in all). Their users are deleted, so their tokens verify to nothing. It also leaves finished witness records (nine after the full run, none open) and two rows of `private.invitation_throttle` after the full run. Which keys those two are was not read; by the cleanup trigger's code they are the slots of the claimant and of the returning user, whose addresses no invitation row holds when it is deleted | `docker exec supabase_db_openvaa-local psql …` counts; `GET /api/v1/search?query=to:invitation-contract-` on port 54324 |
| F8 | 174-06 Task 4 | The function's log during the runs | no line: `docker logs --since … supabase_edge_runtime_openvaa-local 2>&1 \| grep -F "account-access:"` printed nothing after the slices and nothing after the full run | that command, twice |

**Three things the tree holds that the plan does not list.** (a) `emailBucket.fixture.ts` gains `listSubjects()`, which reads the catcher once and throws when it cannot be read, and `createEmailBucket` accepts `null` for its unused page: the existing read answers a failed request with an empty list, on which "no mail" would pass while the catcher is down. (b) The E2E admin client gains `releaseLinkSlot`, `hasAuthUser`, `grantRowsForUser`, `countUsersByEmailPrefix` and `removeUsersByEmailPrefix`; the last four page through every auth user and fail when a page fails, because `safeListUsers` reads one page and answers a failed listing with an empty one. (c) `invitationConstants.ts` gains `SIGN_IN_LINK_EMAIL_SUBJECT_FI` and `freshInvitationAddress()`.

**One step of the spec is ordered differently from the plan's sentence, to the same assertion.** "A used code grants nothing twice" asserts that the request of another address reads `not-sent`. With a used code the mail would go to the claimant, so that outcome holds only while the claimant's 60-second slot is taken. The test therefore gives the claimant's slot back (`invitation_link_release`) and takes it again with a request that presents the code alone (witness `sent`, the claimant's second mail), and only then makes the request under test. Without that, the assertion would pass or fail by the time since the claimant's own mail in the test before.

**The close of 174-06 — the head the runs describe is `2c107fee3`** (the last commit of the plan outside `.planning/`). Every run named here was a first attempt under its label, on AC power under `caffeinate -dimsu`; none is void and no green run was repeated. No void marker exists in any directory this plan made.

**Gate set `174-06-close` — `tests/e2e-runs/174-gates/174-06-close`, exit 0, 15 rows, every status 0.** Window 2026-10-07 13:35:39 to 13:39:03 local; `sleep_entries_in_window: 0`. `node …/174-verdict.mjs gates 174-06-close` exits 0 ("15 expected (the full gate set), 15 recorded"; "not stale: head 2c107fee3 is tree-equal to HEAD outside .planning/"; "power: no Sleep entry inside the run window").

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 18 |
| lint | 0 | 44 |
| db-reset | 0 | 30 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 3 |
| unit | 0 | 57 |
| check-frontend | 0 | 8 |
| build | 0 | 16 |
| format | 0 | 17 |
| docs-links | 0 | 2 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

Read from the rows' logs: pgTAP 39 files and 1706 tests, `Result: PASS`; the schema linter's census "policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)", `0 error(s), 3 warning(s)`, all as at `174-04-close`; unit — dev-seed **68 files and 1030 tests** (67 and 1015 at `174-05-close`: one new file of 4 tests and 11 more in `base.test.ts`), supabase functions 21 and 499, frontend 159 files passed and 1 skipped with 2546 tests passed and 7 skipped, app-shared 10 and 141, data 47 and 244, as at `174-05-close`; `auth-config` "3 key(s) hold in apps/supabase/supabase/config.toml"; `stack` "every row OK". The tests-utility vitest run is in no gate row: 6 files and 95 tests, exit 0, run by hand (5 and 73 at Phase 173's close; the new file holds 22).

**Default E2E run `174-06-close` — `tests/e2e-runs/174-e2e/174-06-close`, exit 0.** Counts: **total 215, passed 215, failed 0, flaky 0, skipped 0, did not run 0; 105 projects**; one preflight success, no preflight failure; scope the full default suite. Window 13:39:15 to 13:44:44 local; `sleep_entries_in_window: 0`. `node …/174-verdict.mjs e2e 174-06-close --same-projects-as 174-03-close --except invitation-contract=+ --expect-project invitation-contract --expect-project auth-service-contract` exits 0: "per project: 105 compared, 0 not as expected", "project invitation-contract: 15/15 passed", "project auth-service-contract: 2/2 passed". The verdict's whole output is kept as `tests/e2e-runs/174-gates/174-06-close-e2e-verdict.txt`.

Per project, this run against `174-03-close` (200 tests, 104 projects): **one project moved, `invitation-contract`, 0 → 15**; each of the other 104 is at its total there. The same holds against the operator's run `tests/e2e-runs/c6-heartbeat-close` at head `674b056db` (200 tests, 104 projects), read from the two `summary.json` files: the only project whose total differs is `invitation-contract` (absent there, 15 here). The totals, as `name this-run/174-03-close`:

```
a11y-smoke 16/16; admin-access 1/1; auth-service-contract 2/2; auth-setup 2/2; cold-entry-dataroot 3/3;
cold-entry-dataroot-contestant 1/1; contestant-a11y-scan 22/22; contestant-entity-selection 8/8;
contestant-journey 1/1; eperm07-term-trigger 1/1; invitation-contract 15/0; performance 1/1; perm-1e1cg1co
1/1; perm-2e-asymmetric 1/1; perm-2e-shared 2/2; perm-access-disable 3/3; perm-answers-locked 3/3;
perm-closed-project 11/11; perm-disable-allow-open 3/3; perm-disable-election-1co 1/1;
perm-disable-election-2co 1/1; perm-disjoint-1co 2/2; perm-header-show-help 1/1; perm-hide-all-nominations
1/1; perm-hide-category-tags 1/1; perm-hide-election-tags 1/1; perm-hide-hero 1/1;
perm-hide-if-missing-answers 1/1; perm-interactive-info 4/4; perm-localisation-positive 2/2;
perm-missing-nominations 1/1; perm-not-located-2e2cg 5/5; perm-org-matching 3/3; perm-per-app-notifications
2/2; perm-question-video 4/4; perm-show-feedback-survey 6/6; perm-startfromcg 2/2; storage-cleanup 3/3;
voter-alliance 1/1; voter-dark-mode 1/1; voter-journey 2/2; voter-journey-mobile 1/1; voter-nominations 1/1;
voter-prefs-tracking 3/3; voter-results-redraw 5/5;
the 30 data-setup-* projects 1/1 each except data-setup-entity-selection 3/3;
the 30 data-teardown-* projects 1/1 each
```

This run is also the boundary proof 174-04 and 174-05 left open: with the claim, the six helpers and the function exercised by a spec of the suite, no project that reads or writes entities, grants, sessions or mail moved.

**Both probes after the close:** `bash …/170-allowlist-probe.sh after` **exit 0** ("every row OK") and `bash …/174-stack-probe.sh after` **exit 0** ("every row OK"), kept as `tests/e2e-runs/174-gates/174-06-allowlist-probe-after.txt` and `174-06-stack-probe-after.txt`. `OPTIONS` answers 200 from `account-access`, `identity-callback`, `invite-candidate` and `send-email`. `node …/174-verdict.mjs hygiene` exits 0: 0 hits, the same two advisory lines as at the baseline.

**State left behind by 174-06.** The gate set reset the local database; `yarn db:seed:default` was run after the E2E run (exit 0, 752 rows). The stack was not restarted. `auth.users` holds the two users `seed.sql` creates; `public.invitations` is empty; no dev server is running and nothing listens on 5173 or 5273. The mail catcher holds 38 mails until the next restart.

**For 174-07 to 174-09.** `unregisterCandidate` and `deleteAllTestUsers` remove a user's invitations with the user, and `unregisterCandidate` removes the invitations addressed to an email that has no user. `inviteByEmail` first removes the address's invitation on that entity and gives the address's slot back, so the journey may call it with its fixed address on back-to-back runs. A spec that opens a mailed link in a browser passes it through `assertSignInLinkShape` and then `toRunOrigin(link, runOriginFromEnv())`. `sendEmail` and `toCallbackUrl` are still on the tree and still used by the journey and the localisation spec.

### Plan 174-07

The same columns as the tables above. Plan start `b43946d0f`. The stack was restarted once by this plan (13:59:57 to 14:00:28 local, 2026-10-07), after the commit that deletes the function directory.

| Id | Plan | Claim or question | Result | Command or evidence |
|---|---|---|---|---|
| G1 | 174-07 Task 2 | What do the function directories and the running stack hold after the deletion and the restart? | `ls apps/supabase/supabase/functions`: `account-access`, `identity-callback`, `send-email`. `OPTIONS /functions/v1/invite-candidate` **404**; `account-access`, `identity-callback` and `send-email` **200**; `r174-probe` 404. `yarn db:stop` exit 0, `yarn db:start` exit 0; `170-allowlist-probe.sh after` exit 0 ("every row OK"); `174-stack-probe.sh after` exit 0 ("every row OK", the three edge rows EQUAL). `174-mail-probe.mjs` exit 0, eight steps PASS: `send-email` answered 200, sent 1, and the message reached the catcher | `tests/e2e-runs/174-gates/174-07-allowlist-probe-after.txt`, `174-07-stack-probe-after.txt`, `174-07-mail-probe.txt` |
| G2 | 174-07 Task 2 | Which modules exist as several copies, and which tests went where? | `envConfig.ts` ×3 (`account-access`, `identity-callback`, `send-email`), byte-identical (`cmp`, twice 0). `jwtSegment.ts`, `callerAuthority.ts` and `entityGrant.ts` exist once each. **DIFFERS from the plan, which deletes ten files:** eight are deleted and two are moved, `callerAuthority.test.ts` and `envConfig.test.ts`, from `invite-candidate/` to `send-email/` (`git mv`, content unchanged), because each was the only test of a module that remains. `DUPLICATED_MODULES` is `['envConfig.ts']` | `find apps/supabase/supabase/functions -name '*.ts' -exec basename {} \; \| sort \| uniq -c`; `git show --stat 287a2b97d` |
| G3 | 174-07 Task 2 | The Supabase function unit totals, file by file | **18 files and 462 tests** (21 and 499 before). Gone with the directory: `entityGrant.test.ts` 11 (its byte-identical twin stays in `identity-callback`), `flowConformance.test.ts` 19, `jwtSegment.test.ts` 6: 36 tests in 3 files. Moved to `send-email/`: `callerAuthority.test.ts` 23, `envConfig.test.ts` 5: 28 tests, counted before and after. `send-email/flowConformance.test.ts` 16 → 15 (the byte-identity test). 499 − 36 − 1 = 462; 21 − 3 = 18 | `yarn vitest run --reporter=json` in `apps/supabase`, before and after |
| G4 | 174-07 Task 5 | The name gate's exemption list and its fixture | `EXEMPT` holds one entry, the three shown names; both count sentences say "exactly one entry". **Four** fixture lines named the function, not three: the `// @as` directive, `e02`, `n11` and `n12`; each is edited in place (`git diff --numstat`: 4 added, 4 removed). `--self-test`: "82 finding(s) on the fixture, 82 expected"; the `.expected.ts.violations` file did not change. The gate over the tree: 2798 tracked files, 0 findings | `node scripts/assert-no-candidate-app-names.mjs --self-test` (exit 0); the verdict below |
| G5 | 174-07 Task 4 | Is `bash .claude/scripts/audit-skill-links.sh database` green? | **no, and it was not before this plan.** It exits 1 on citations in files this plan does not touch (`extension-patterns.md` 11 dangling, `rls-policy-map.md` 5; both unchanged since `b43946d0f`) and on `SKILL.md`'s package-relative citations. `SKILL.md` alone: 16 dangling before this plan's edit of it, 14 after, none of the 14 written by this plan (the two that went named the deleted directory). **The same command is in 174-10's verify and will exit 1 there unless the 30 citations are repaired or exempted** | `bash .claude/scripts/audit-skill-links.sh .claude/skills/database/SKILL.md` on the file at `d773474ba` and at `be12bbed4` |
| G6 | 174-07 Task 1 | Where does a verified `magiclink` land in the frontend at this commit? | `apps/frontend/src/routes/api/auth/callback/+server.ts` has arms for `recovery`, `invite` and `email` / `signup`; any other verified type takes the `default` arm and is redirected to `ContestantAppHome`. Only a missing parameter or a failed verification goes to the login page with `authError`. **Refines the row "Auth callback and its arms" of `## Names`**, which says "anything else and every failure" goes to the login page. The route calls no claim and no refresh | the file, read |

**The verdicts on the committed tree** (head `340e1a0a1`), kept as `tests/e2e-runs/174-gates/174-07-exemptions-verdict.txt` and `174-07-greps-verdict.txt`:

```
EXEMPT holds 1 entry:
  /(?<=['"])(?:Candidate app|Party app|Candidate and party app)(?=['"])/g // the three shown names of the app, as whole quoted strings — see phase 171
no entry names 'invite-candidate'
no entry names 'get_candidate_user_data'
line 16 states 'exactly one entry': agrees with the array
line 55 states 'Exactly one entry': agrees with the array
174-verdict exemptions: PASS

2. 'inviteUserByEmail': left out by --only
1. 'invite-candidate': no hit (exit 1)
3. 'preregisterWithApiToken': no hit (exit 1)
4. 'complete-registration': no hit (exit 1)
174-verdict greps --only 1,3,4: PASS
```

The fourth literal, position 2, has 11 hits in 5 files under `tests/tests/` (`utils/supabaseAdminClient.ts` 6, `specs/perm/perm-localisation-positive.spec.ts` 2, `specs/contestant/contestant-journey.spec.ts` 1, `utils/contestantJourneyConstants.ts` 1, `setup/perm/perm-localisation-positive.teardown.ts` 1): the E2E helper and its callers, which 174-09 re-points. Outside `.planning/` the function's name is left in `CLAUDE.md` alone, twice (§ *Backend (Supabase)*), which no plan of this phase edits.

**Gate set `174-07-close` — `tests/e2e-runs/174-gates/174-07-close`, exit 0, 15 rows, every status 0.** Head `340e1a0a1` (the last commit of the plan outside `.planning/`). Window 2026-10-07 14:13:09 to 14:16:37 local, on AC power under `caffeinate -dimsu`; `power.txt` records `sleep_entries_in_window: 0` and the directory holds no void marker. `node …/174-verdict.mjs gates 174-07-close` exits 0 ("15 expected (the full gate set), 15 recorded"; "not stale: head 340e1a0a1 is tree-equal to HEAD outside .planning/"; "power: no Sleep entry inside the run window"). It was the first attempt.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 19 |
| lint | 0 | 46 |
| db-reset | 0 | 29 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 3 |
| unit | 0 | 59 |
| check-frontend | 0 | 8 |
| build | 0 | 16 |
| format | 0 | 18 |
| docs-links | 0 | 1 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

Read from the rows' logs: pgTAP 39 files and 1706 tests, `Result: PASS`; the schema linter's census "policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)", `0 error(s), 3 warning(s)`, all as at `174-06-close`; unit — supabase functions **18 files and 462 tests** (21 and 499 at `174-06-close`; row G3), frontend 159 files passed and 1 skipped with **2543 tests passed** and 7 skipped (2546 at `174-06-close`: the three cases of the removed writer member), dev-seed 68 and 1030, app-shared 10 and 141, data 47 and 244, as at `174-06-close`; `auth-config` "3 key(s) hold in apps/supabase/supabase/config.toml"; `stack` "every row OK"; `name-gate-self-test` "82 finding(s) on the fixture, 82 expected". `node …/174-verdict.mjs hygiene` exits 0: 0 hits, the same two advisory lines as at the baseline.

**No E2E run was made by this plan.** It removes a function nothing calls, a writer member nothing calls, gate entries and comments. Its boundary proof is the full default run that closes 174-08.

**For 174-08: a failure of its run in which a function's endpoint answers 404, or in which the edge runtime does not answer, points back to this plan** (the deletion and the restart of G1), and is diagnosed there before anything in 174-08 is changed. So does a red of `yarn assert:edge-env-defaults` naming a module with fewer than two copies: a module joins `DUPLICATED_MODULES` only when a second directory holds it.

**For 174-09 and 174-10.** The registration docs page says the auth callback redirects a verified link of type `invite` to the set-password page; that sentence is true until 174-09 removes the arm and is not in any later plan's file list. The invitation docs page ends with a section "Callers" that says the frontend calls neither `account-access` nor `claim_invitations`; it is true until 174-08 and is 174-10's to replace. `send-email/jwtSegment.ts` is imported by no `index.ts`: with its sibling copy gone, its own test is its only reader.

**State left behind by 174-07.** The stack is up, restarted once, and serves three functions. The gate set reset the local database; `yarn db:seed:default` was run after it (exit 0, 752 rows). After the close `170-allowlist-probe.sh after` and `174-stack-probe.sh after` each exit 0 once more (`tests/e2e-runs/174-gates/174-07-allowlist-probe-close.txt`, `174-07-stack-probe-close.txt`), and `OPTIONS` answers 404 from `invite-candidate` and 200 from the three functions. The mail catcher holds the one mail of the mail probe. No dev server was started and nothing listens on 5173 or 5273.

### Plan 174-08

The same columns as the tables above. Plan start `e5b89f924`. Everything here is the LOCAL stack as 174-07 left it; this plan changed no file under `apps/supabase/` and restarted nothing.

| Id | Plan | Claim or question | Result | Command or evidence |
|---|---|---|---|---|
| H1 (A5) | 174-08 Task 3 | Does `auth.setSession` on the `@supabase/ssr` server client write the cookies as `verifyOtp` and `refreshSession` were measured to? | **yes: A5 holds.** Over a `createServerClient` whose `getAll` / `setAll` keep a jar and record the names of every write, built against the local stack with the anon key, `SupabaseDataWriter.signInWithInvitationCode` with the right password resolves to `{ type: 'success' }`; read with no wait after the call, **one cookie write has happened, of one cookie, `sb-127-auth-token`**; `getSession()` on that client returns the user's session; and a second server client reading only that jar is verified by the auth service as the same user (`getUser()`). With a wrong password the call resolves to `{ type: 'failure' }`, **no cookie is written** and `getSession()` returns no session. `checkInvitationCode` answers `used` for the claimed code, and `claimInvitations()` under the new session returns `{ claimed: [], skipped: [], passwordSet: true }`. So the writer method hands a session to a form action as designed: the action builds the writer over the request's own client and the cookies land on its response. The count and the cookie's name were read once through a temporary assertion that was not committed; the committed test asserts at least one write and that every written name begins `sb-` | `SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… CONTESTANT_WRITER_INTEGRATION_REQUIRED=1 yarn workspace @openvaa/frontend vitest run supabaseDataWriter.integration --reporter=default --reporter=json --outputFile.json=…/tests/e2e-runs/174-gates/174-08-integration.json` (exit 0): 11 tests, 11 passed, 0 failed, 0 skipped; the four of the group `SupabaseDataWriter and the invitation contract against the local stack` passed. The keys were read from `supabase status -o env` into variables and printed nowhere |
| H2 | 174-08 Task 3 | What the integration group leaves behind | **nothing.** After its three runs (two made to read H1's count, of which the first printed nothing and the second failed by design on a temporary assertion that showed the record, and one for the report): `auth.users` with an address beginning `writer-integration-` 0; `public.invitations` 0 rows; `auth.users` 2 (the two of `seed.sql`); no grant without a user. The group's teardown deletes its invitation and its user and fails when either is left. It sends no mail: the code invitation is marked claimed by the service role, so no link is requested | `docker exec supabase_db_openvaa-local psql -U postgres -At -c "select … count(*) …"` |
| H3 | 174-08 Task 1 | Which lists of the project-scoping gate does a new adapter source move? | two, one of them unlisted by the plan. `PROJECT_SCOPED_RPCS` gains `claim_invitations: 'requires p_project_id'` (ten entries), as planned. **`GUARDED_SOURCES` gains `utils/invitationAccess.ts`** (eighteen entries): check 5 keeps the list exhaustive against the adapter directory, and without the entry the gate exits 1 with "issues adapter calls but is in neither GUARDED_SOURCES nor DEFERRED_SOURCES". `PROJECT_SCOPED_EDGE_FUNCTIONS` and the loop in `projectScopingGate.test.ts` already named `account-access` (174-05). Negative control: with the RPC's entry removed the gate exits 1 with "rpc 'claim_invitations' has no disposition in PROJECT_SCOPED_RPCS"; restored, exit 0. The writer has **one** `functions.invoke('account-access', …)` site, a private method whose body literal carries `operation` and `project_id: this.projectId`; the gate counts 2 Edge Function invocations in the adapter (`send-email` and this one) | `yarn assert:project-scoped-queries` (exit 1, then 0): "18 guarded source(s), 0 deferred, 18 adapter source(s) on disk, 10 raw client call(s) examined, 2 Edge Function invocation(s) … 0 violation(s)" |
| H4 | 174-08 Tasks 2 and 3 | Are the new tests ever red? | **yes, each on the property it names.** `admitSession` without the refresh: 7 of the 43 tests under `src/lib/auth` fail, among them "admits a first-time invitee whose token carries no grant until the refresh". `admitSession` reading the session before the claim: 12 fail. The callback never refreshing: 2 of 14 fail ("verifies, claims on the request client, refreshes and only then redirects when a grant was claimed" is one). The callback not dropping the session when the claim throws on the `magiclink` arm: 1 fails, the test of that arm. Each source was restored and compared byte for byte (`cmp`), and the suites are green on the tree | `yarn workspace @openvaa/frontend vitest run src/lib/auth` and `… src/routes/api/auth/callback` on four mutants (exit 1 each) and on the tree (exit 0) |
| H5 | 174-08 Task 3 | Where does each verified type land in the callback now? | `recovery` → `ContestantAppResetPassword`; `invite` → `ContestantAppSetPassword` with `email`; `magiclink` → `ContestantAppSetPassword` with `email` and no registration key when the claim says `passwordSet: false`, else the validated `next` path or `ContestantAppHome`, and `ContestantAppLogin` with `errorMessage: 'authError'` after a local sign-out when the claim threw; `email` / `signup` → the validated `next` path or `ContestantAppHome`; any other type → `ContestantAppHome`. Every arm runs after `claimInvitations()` and, when `claimed` is not empty, `refreshSession()`. **Replaces row G6 and the row "Auth callback and its arms" of `## Names`** | the file, and `server.test.ts` beside it (14 tests) |

**The close of 174-08 — the head the runs describe is `352f9793e`** (the last commit of the plan outside `.planning/`). Both runs were first attempts under their labels, on AC power under `caffeinate -dimsu`; neither is void, no green run was repeated, and no void marker exists in either directory.

**Gate set `174-08-close` — `tests/e2e-runs/174-gates/174-08-close`, exit 0, 15 rows, every status 0.** Window 2026-10-07 14:41:36 to 14:44:40 local; `sleep_entries_in_window: 0`. `node …/174-verdict.mjs gates 174-08-close` exits 0 ("15 expected (the full gate set), 15 recorded"; "not stale: head 352f9793e is tree-equal to HEAD outside .planning/"; "power: no Sleep entry inside the run window").

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 19 |
| lint | 0 | 46 |
| db-reset | 0 | 29 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 4 |
| unit | 0 | 32 |
| check-frontend | 0 | 9 |
| build | 0 | 16 |
| format | 0 | 18 |
| docs-links | 0 | 2 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

Read from the rows' logs: pgTAP 39 files and 1706 tests, `Result: PASS`; the schema linter's census "policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)", `0 error(s), 3 warning(s)`, all as at `174-07-close`; unit — frontend **163 files passed and 1 skipped with 2616 tests passed and 11 skipped** (159 and 1, 2543 and 7 at `174-07-close`), supabase functions 18 and 462, dev-seed 68 and 1030, app-shared 10 and 141, data 47 and 244, as at `174-07-close`; `check-frontend` "2715 FILES 0 ERRORS 0 WARNINGS"; `auth-config` "3 key(s) hold in apps/supabase/supabase/config.toml"; `stack` "every row OK"; `name-gate-self-test` "82 finding(s) on the fixture, 82 expected". `node …/174-verdict.mjs hygiene` exits 0: 0 hits, the same two advisory lines as at the baseline.

The frontend's 73 more passing tests and 4 more skipped, file by file through the JSON reporter: `supabaseDataWriter.test.ts` 81 → 99 (18); `utils/invitationAccess.test.ts` 23 (new); `auth/sessionAdmission.test.ts` 10 (new); `auth/invitationCodeLogin.test.ts` 6 (new); `auth/passwordLogin.test.ts` 25 → 27 (2); `routes/api/auth/callback/server.test.ts` 14 (new). 18 + 23 + 10 + 6 + 2 + 14 = 73, in four new files. The 4 more skipped are the invitation group of the gated integration test, which the default unit run skips with the file's other 7.

**The integration report** `tests/e2e-runs/174-gates/174-08-integration.json` (head `352f9793e`'s test file, run before the commit on the same content): 11 tests, 11 passed, 0 failed, 0 skipped; the four tests whose full name holds "invitation" all passed (row H1).

**Default E2E run `174-08-close` — `tests/e2e-runs/174-e2e/174-08-close`, exit 0.** Counts: **total 215, passed 215, failed 0, flaky 0, skipped 0, did not run 0; 105 projects**; one preflight success, no preflight failure; scope the full default suite. Window 14:45:06 to 14:50:49 local; `sleep_entries_in_window: 0`. `node …/174-verdict.mjs e2e 174-08-close --same-projects-as 174-06-close --expect-project contestant-journey --expect-project invitation-contract` exits 0: "per project: 105 compared, 0 not as expected", "project contestant-journey: 1/1 passed", "project invitation-contract: 15/15 passed". The verdict's whole output is kept as `tests/e2e-runs/174-gates/174-08-close-e2e-verdict.txt`.

Per project, this run against `174-06-close` (215 tests, 105 projects): **no project moved.** Each of the 105 is at exactly its total there.

Read from the run's dev-server log: no line of "claiming invitations failed", of "session refresh after the claim failed" or of "sign-out after a failed claim". Its one login error line, "Candidate login failed: Invalid login credentials", is also in the log of `174-06-close`, once. So in every login action and callback of this run the claim answered. The function's log, read through the filter for its prefix over the twenty minutes that hold the run, held no line.

This run is also the boundary proof 174-07 left open: with `invite-candidate` gone, the gates re-pointed and the stack restarted once, no test met a 404 from a function or a silent edge runtime, and `invitation-contract`, which calls `account-access`, is at 15 of 15.

**Both probes after the close:** `bash …/170-allowlist-probe.sh after` **exit 0** ("every row OK") and `bash …/174-stack-probe.sh after` **exit 0** ("every row OK"), kept as `tests/e2e-runs/174-gates/174-08-allowlist-probe-close.txt` and `174-08-stack-probe-close.txt`. `OPTIONS` answers 200 from `account-access`, `identity-callback` and `send-email`, and 404 from `invite-candidate`.

**State left behind by 174-08.** The stack was not restarted and serves three functions. The gate set reset the local database; `yarn db:seed:default` was run after the E2E run (exit 0, 752 rows). `auth.users` holds the two users `seed.sql` creates; `public.invitations` is empty. No dev server is running and nothing listens on 5173 or 5273.

**For 174-09 and 174-10, and for Phase 178.** The callback's `invite` arm is still there and the journey still uses it. Four docs sentences describe the tree as it was before this plan and are in no file this plan lists: on the invitation page, "The frontend calls neither `account-access` nor `claim_invitations`." (§ Callers) and "The user is then signed in with a confirmed address, and holds no grant yet."; on the registration page, "The sign-in link of an invitation is of type `magiclink`, and the route sends it to the Contestant App home"; and the login page's four numbered steps of `passwordLogin`, which name no claim and no refresh between the sign-in and the session read. `invitationCodeLogin` has no caller in the application. A claimed `(project, admin)` promise opens the Admin App's login; a claimed `(project, editor)` promise opens neither login, and its holder who arrives by a mailed link lands in the Contestant App with nothing to edit (ruling 18). The bank-authentication endpoint `routes/api/contestant/preregister/+server.ts` establishes a session with `verifyOtp` and calls no claim; it is in no plan of this phase.

### Plan 174-09

The same columns as the tables above. Plan start `6a00e042c`. Everything here is the LOCAL stack as 174-08 left it; this plan changed no file under `apps/supabase/` and restarted nothing.

| Id | Plan | Claim or question | Result | Command or evidence |
|---|---|---|---|---|
| J1 | 174-09 Task 1 | Does seeding an invitation for the journey's candidate make that candidate public? | **yes.** `create_invitations` confirms a named entity, and every nomination the dev-seed writer imports is confirmed unless the template says otherwise, so `test-e2e-base-ca-aa-unregistered` (seeded `confirmed: false`, with one nomination) passes the three conjuncts of `anon_select_candidates` from the moment its invitation is seeded. Measured on a candidate of the default project in one rolled-back transaction: as `anon`, 0 rows while the candidate is unconfirmed; after `create_invitations` as `service_role`, `confirmed` true and 1 row; with the candidate's nominations then unconfirmed, 0 rows again. Nothing was left (`public.invitations` 0 for the probe's address). The plan does not mention this | `docker exec -i supabase_db_openvaa-local psql -U postgres -At -v ON_ERROR_STOP=1`, a `BEGIN … ROLLBACK` script |
| J2 | 174-09 Task 1 | What the journey does about J1 | `invitationFlow.whileHiddenFromVoters(entity, action)`: the entity's nominations are set unconfirmed, the action seeds the invitation and asks for the link, the entity is set unconfirmed again, and only then are the nominations given back the state they had. At every moment the entity or each of its nominations is unconfirmed, and the journey's remaining steps run on the row state they ran on before this plan. **Not observed:** any spec failing without the step. In `174-09-close` `voter-journey`, which pins party AA at five visible candidates, ended 88.3 s into the run and `contestant-journey` started at 97.9 s, beside `contestant-entity-selection` (98.2 s to 113.3 s) | the fixture; `results.json` of `174-09-close` |
| J3 | 174-09 Task 1 | Can a spec that reuses one address across runs read "the mail of this run" after `inviteByEmail`? | not as 174-06 left the helper: the function answers before it mails, and the catcher keeps every earlier run's sign-in mail for a fixed address, so a poll for the subject is satisfied by an old mail. `inviteByEmail` now carries a completion witness and returns once it reads `sent` (it throws on `not-sent`); on return the newest mail with the sign-in subject is the request's, and the invited address has its auth user, which `acceptTermsOfUse` straight after the call relies on in the localisation spec. A string subject is now the whole subject of a mail (`matchSubject`); its only string callers pass the full literal | `tests/tests/utils/supabaseAdminClient.ts`, `tests/tests/fixtures/shared/emailBucket.fixture.ts`; the two journey slices nine seconds apart |
| J4 | 174-09 Task 3 | Does anything issue a link of the type `invite`? | no. `git grep -n -e "type: 'invite'" -e "type=invite" -e "'invite'" -- apps tests packages` lists: the function's own first `generateLink` call, whose token is discarded, and the two lines of its conformance test; the callback's `REFUSED_TYPE` and the test of the refusal; two negative cases of `mailedLink.test.ts`; and the default of `toCallbackUrl` for a verify link with no `type`, which now names a type the callback refuses | the command |
| J5 | 174-09 Task 3 | Do `invitation-contract` and `invitation-landing` overlap in a run? | yes: 55.0 s to 60.3 s and 56.3 s to 60.8 s in `174-09-close`. The contract spec removes every user under `invitation-contract-` in `beforeAll` and `afterAll` and asserts that none is left, so the landing spec invents its addresses under a prefix of its own, `invitation-landing-`, where the plan names the contract spec's | `results.json` of `174-09-close`; `tests/tests/utils/invitationConstants.ts` |
| J6 | 174-09 Task 3 | Are the new and the re-pointed specs ever red? | **yes, each on the property it names**, against one function of the local database replaced, `claim_invitations`, re-applied and compared by checksum after every run (`cb08271334637fa452d4f60acfec9195` before, after each run and after the gate set's reset). A claim that finds nothing: landing test 1 fails on the grant rows (tests 2 and 3 skipped by the serial walk), and the journey fails in step 5, after the password was set: its user holds no contestant grant and is not let in. A claim that passes over admin promises: landing test 1 passes and test 2 fails, the address staying on the Admin App's login page. A claim that takes every open email invitation: landing tests 1 and 2 pass and test 3 fails on the stranger's grant rows. The callback's unit test of the refusal fails (1 of 15) with the refusal removed. No run was made against a weakened callback or login action | labels `174-09-landing-slice-mutant-claim-nothing`, `174-09-journey-slice-mutant-claim-nothing`, `174-09-landing-slice-mutant-claim-editor-only`, `174-09-landing-slice-mutant-claim-any-address`; `tests/e2e-runs/174-gates/174-09-negative-control*` |

**The slices of 174-09.** `174-09-journey-slice` (head `c3849a0eb`; 12:06:46 to 12:07:34 UTC): total 5, passed 5, failed 0, flaky 0, skipped 0, did not run 0; `contestant-journey` 1 of 1. `174-09-journey-slice-again` (the same head; 12:07:44 to 12:08:28 UTC, ten seconds after the first ended, with no reset between): the same counts. `174-09-landing-slice` (head `0c103ce3f`; 12:15:41 to 12:15:59 UTC): total 5, passed 5, failed 0, flaky 0, skipped 0, did not run 0; `invitation-landing` 3 of 3. Each verdict with `--allow-slice --expect-project <project>` exits 0, each run was a first attempt under its label, `sleep_entries_in_window: 0` in all three, and none holds a void marker. The four mutant runs above are negative controls, not attempts at a green run; each ended with driver exit 1 by design.

**The close of 174-09 — the head the runs describe is `e219189ae`** (the last commit of the plan outside `.planning/`). Both runs were first attempts under their labels, on AC power under `caffeinate -dimsu`; neither is void, no green run was repeated, and no void marker exists in either directory.

`node …/174-verdict.mjs greps` exits 0 on that head: `'invite-candidate'`, `'inviteUserByEmail'`, `'preregisterWithApiToken'` and `'complete-registration'` each "no hit (exit 1)". `node …/174-verdict.mjs exemptions` exits 0: one entry, both count sentences agree. `node …/174-verdict.mjs hygiene` exits 0: 0 hits, two advisory lines.

**Gate set `174-09-close` — `tests/e2e-runs/174-gates/174-09-close`, exit 0, 15 rows, every status 0.** Window 2026-10-07 15:19:28 to 15:22:56 local; `sleep_entries_in_window: 0`. `node …/174-verdict.mjs gates 174-09-close` exits 0 ("15 expected (the full gate set), 15 recorded"; "not stale: head e219189ae is tree-equal to HEAD outside .planning/"; "power: no Sleep entry inside the run window").

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 18 |
| lint | 0 | 46 |
| db-reset | 0 | 29 |
| types-regen | 0 | 3 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 4 |
| unit | 0 | 58 |
| check-frontend | 0 | 8 |
| build | 0 | 16 |
| format | 0 | 17 |
| docs-links | 0 | 2 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

Read from the rows' logs: pgTAP 39 files and 1706 tests, `Result: PASS`; the schema linter's census "policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)", `0 error(s), 3 warning(s)`, all as at `174-08-close`; unit — frontend **163 files passed and 1 skipped with 2617 tests passed and 11 skipped** (2616 and 11 at `174-08-close`: `routes/api/auth/callback/server.test.ts` 14 → 15, the case of the `invite` and `email` arms being two cases now), supabase functions 18 and 462, dev-seed 68 and 1030, app-shared 10 and 141, data 47 and 244, as at `174-08-close`; `check-frontend` "2715 FILES 0 ERRORS 0 WARNINGS"; `auth-config` "3 key(s) hold in apps/supabase/supabase/config.toml"; `stack` "every row OK"; `name-gate-self-test` "82 finding(s) on the fixture, 82 expected". The tests-utility vitest run, which is in no gate row, is 6 files and 95 tests (exit 0, by hand, on Task 1's tree).

**Default E2E run `174-09-close` — `tests/e2e-runs/174-e2e/174-09-close`, exit 0.** Counts: **total 218, passed 218, failed 0, flaky 0, skipped 0, did not run 0; 106 projects**; one preflight success, no preflight failure; scope the full default suite. Window 12:23:06 to 12:28:48 UTC (15:23:06 to 15:28:48 local); `sleep_entries_in_window: 0`. `node …/174-verdict.mjs e2e 174-09-close --same-projects-as 174-08-close --except invitation-landing=+ --expect-project invitation-landing --expect-project contestant-journey --expect-project invitation-contract --expect-project perm-localisation-positive` exits 0: "per project: 106 compared, 0 not as expected", "project invitation-landing: 3/3 passed", "project contestant-journey: 1/1 passed", "project invitation-contract: 15/15 passed", "project perm-localisation-positive: 2/2 passed". The verdict's whole output is kept as `tests/e2e-runs/174-gates/174-09-close-e2e-verdict.txt`.

Per project, this run against `174-08-close` (215 tests, 105 projects): **one project moved.** `invitation-landing` 0 → 3. Each of the other 105 is at exactly its total there. 215 + 3 = 218; 105 + 1 = 106.

Read from the run's dev-server log: no line of "claiming invitations failed", of "session refresh after the claim failed" or of "sign-out after a failed claim". Its one "Candidate login failed: Invalid login credentials" line is also in the logs of `174-06-close` and `174-08-close`, once each. The function's log, read through the filter for its prefix over the twenty minutes that hold the run, held no line: every mail of the run was sent, and no request was refused by the deployment checks.

**Both probes after the close:** `bash …/170-allowlist-probe.sh after` **exit 0** ("every row OK") and `bash …/174-stack-probe.sh after` **exit 0** ("every row OK"), kept as `tests/e2e-runs/174-gates/174-09-allowlist-probe-close.txt` and `174-09-stack-probe-close.txt`. `OPTIONS` answers 200 from `account-access`, `identity-callback` and `send-email`, and 404 from `invite-candidate`.

**State left behind by 174-09.** The stack was not restarted and serves three functions. The gate set reset the local database; `yarn db:seed:default` was run after the E2E run (exit 0, 752 rows). `auth.users` holds the two users `seed.sql` creates; `public.invitations` is empty; `claim_invitations` is the migration's (`md5` as above). No dev server is running and nothing listens on 5173 or 5273. The mail catcher keeps the run's mails, the sign-in mails of the journey's and the localisation spec's fixed addresses among them; their users are deleted.

**For 174-10 and Phase 178.** The callback refuses `type=invite` unverified; `toCallbackUrl` has one caller, the journey's password-reset step, and Phase 178 removes it with the recovery mail. A first-time invitee whose claim writes no contestant grant sets a password and is then refused by the login form (the journey under the claim-nothing mutant, step 5): ruling 18's case, seen once and not asserted by any test. A claimed `(project, editor)` promise lands a returning user on "nothing to edit" through the callback, and a claimed `(project, admin)` promise opens the Admin App's login in the request that claimed it. Docs sentences in files 174-10 lists that this plan made incomplete: the authentication page's "then redirects by link type: a recovery link goes to the password reset page, and a sign-in link to the Contestant App", and the login page's "A missing parameter or a failed verification", neither of which names the refused type.

## The server contract for Phase 178

Written by plan 174-05, Task 7. What an anonymous visitor's screen can ask of the server, and what stands behind each answer. Phase 178 builds screens on this; 174-06 turns it into a spec of the suite; 174-08 adds the adapter methods that call it.

One endpoint, `POST /functions/v1/account-access` (the Edge Function `account-access`), JSON in and out, called with the anon key as `apikey` (a call with no key is refused by the gateway with 401 and never reaches the function, E1). Every body carries `operation` and `project_id` (a uuid, either case). The function reads no project from its environment: the caller names the project it is in.

| Operation | Further fields | Answer | The SQL function behind it |
|---|---|---|---|
| `check-code` | `code` (1 to 64 characters) | 200 `{ "status": "valid" }`, `{ "status": "used" }` or `{ "status": "unknown" }` | `invitation_code_status(p_project_id, p_code)` |
| `request-link` | `email` (3 to 320 characters, holding `@`) and/or `code`; optional `locale`; optional `witness` (a uuid) | 200 `{ "accepted": true }`, always, returned before any work | `invitation_link_request(p_project_id, p_email, p_code)` decides whom a mail may go to; `invitation_link_release(p_project_id, p_email, p_code)` gives the slot back when nothing was mailed; `invitation_link_witness(p_id, p_outcome)` completes a witness |
| `code-sign-in` | `code`, `password` (1 to 1024 characters) | 200 `{ "result": "signed-in", "access_token": …, "refresh_token": … }` or 200 `{ "result": "invalid-credentials" }` | `invitation_code_claimant_email(p_project_id, p_code)`, then the auth service's password grant for that address, inside the function |

Other answers, none of which depends on whether an address, a code or an account exists: 400 `{ "error": "bad-request" }` for a body that is not JSON, names no known operation, carries no uuid as `project_id`, lacks a field its operation requires, or has a field of the wrong type or over its length bound; 405 `{ "error": "method-not-allowed" }` for a method other than `POST` and `OPTIONS`; 500 `{ "error": "internal" }` when the database call of `check-code` fails. `OPTIONS` answers 200 with the CORS headers `send-email` uses. Unknown keys are ignored. The claim itself is not here: `claim_invitations(p_project_id)` is an RPC the signed-in user's own session calls (174-04, 174-08).

What a screen can rely on, and what it cannot:

- **`request-link` says nothing.** Its status, body and timing are the same for an invited address, an uninvited one, a repeated request inside the 60-second interval, a valid code, a used code and an unknown code (4 ms and 5 ms for an invited and an uninvited address, E11). A screen shows the same "if this address is invited, a mail is on its way" text in every case and cannot show an error for an unknown address.
- **A later link makes the earlier unopened one stop working** (E6): a later link for the same address makes the earlier unopened one stop working, so a third party who knows the address can invalidate the user's unclicked link once a minute (residual R-c of 174-01). The "email sent" screen should say that only the newest mail's link works, and a "send again" control is bound by the server to one mail per address per 60 seconds whatever the screen does.
- **`request-link` with a code and no address** asks for a link to the claimant's own address when the code is used. The address is never returned or shown. With a used code and a typed address the typed address is ignored.
- **`check-code` answers three words and nothing else.** `used` means claimed. A code whose only row was skipped at the claim stays `valid`.
- **`code-sign-in` has one failure answer** for an unknown code, a wrong password, a claimant who never set a password and a spent budget (ten claimant look-ups per used code per fifteen minutes, shared with link requests that name the code). The tokens are for a SvelteKit action to put on its own response (`auth.setSession`, measured in 174-08); they are never logged.
- **The mail.** Fixed text in seven locales (`da`, `en`, `et`, `fi`, `fr`, `lb`, `sv`); `locale` is resolved against that set and anything else, or nothing, gives `en`. The caller supplies no text, subject, sender or origin. The link is `<SITE_URL>/<locale>/api/auth/callback?token_hash=…&type=magiclink`: the type is `magiclink` for a first-time and for a returning user alike, so the callback needs a `magiclink` arm and cannot tell the two apart by the type (174-08). A user created by a link has no password until they set one; `claim_invitations` returns `password_set`.
- **The subjects**, none of which the auth service uses for a mail of its own: `en` "Sign-in link for the voting advice application"; `fi` "Kirjautumislinkki vaalikoneeseen"; `sv` "Inloggningslänk till valkompassen"; `da` "Loginlink til valgtesten"; `et` "Sisselogimislink valimiskompassi"; `fr` "Lien de connexion à la boussole électorale"; `lb` "Umelllink fir de Wal-Kompass". The six non-English texts are constructed, not taken from a catalogue, and await a native-speaker review (filed by 174-10).
- **No link is issued** on a deployment whose served auth settings do not say `disable_signup: true` and `mailer_autoconfirm: false`, or whose auth service does not admit `<SITE_URL>/<locale>/api/auth/callback` as a redirect target. Both refusals are silent to the caller and are one log line each, prefixed `account-access:`. A positive answer to the first is believed for at most 60 seconds, to the second for at most ten minutes per callback URL.

**`witness` is a service-role field. No screen sends it.** It exists so that a test can assert "no mail was sent" and "no account was created" after the request's background work is known to be over, instead of after a wait. How a test uses it, each call with the service-role key:

1. `rpc('invitation_link_witness_open')` returns the id of a new open record.
2. The test sends `request-link` with `"witness": "<that id>"`. The answer is unchanged.
3. The test polls `rpc('invitation_link_witness', { p_id })` until it reads `sent` or `not-sent` (null means still open; the live run polls every 250 ms with a ceiling of 30 seconds, and its twelve steps, six witnesses among them, took four seconds in all). `sent` means a mail was handed to SMTP; `not-sent` means none was, for any reason.
4. Only then does it read the mail catcher or the accounts.

A `witness` that is not a uuid is dropped; one that names no record changes nothing and creates none (the function completes a witness by an `UPDATE` of a record the service role opened). An anonymous caller learns nothing from the field. By the handler's code and not by a measurement: a witness that never finishes means the function could not start its work at all, which is the case when building its dependencies throws, in practice when `SITE_URL` is unset; that case is one log line and no link.

## Obligations to later phases

Written by plan 174-10, Task 3. One row per obligation O-1 to O-13 of `174-CONTEXT.md` `<cross_phase>`, then what the phase hands to Phases 175, 178 and 179 and to the operator beyond those. Every todo named is in `.planning/todos/pending/`; "T:" abbreviates that directory.

| Id | To | What this phase did about it | Where the result is |
|---|---|---|---|
| O-1 | from 173 (hard) | **Done.** Every entry point that can sign an invitee in runs session → claim → refresh → gates: the auth callback and, through `admitSession`, both login actions and `invitationCodeLogin`. Nothing reads or writes entity data between the claim and the refresh. Each caller's order was shown red under a mutant (H4) | `apps/frontend/src/lib/auth/sessionAdmission.ts` (`admitSession`); `claimAndRefresh` in `apps/frontend/src/routes/api/auth/callback/+server.ts`; `sessionAdmission.test.ts`, `server.test.ts`; E2E `invitation-landing` test 2. Phase 173's todo is discharged (last row of the second table) |
| O-2 | to 170 | **Done.** The `invite-candidate` exemption is deleted from the name gate, both count sentences say "exactly one", and the fixture's four lines are re-pointed in place | `scripts/assert-no-candidate-app-names.mjs` (`EXEMPT`), `scripts/fixtures/assert-no-candidate-app-names.input.ts`; `174-verdict.mjs exemptions` |
| O-3 | to 178 | **Done, as endpoints.** `account-access` serves `check-code`, `request-link` and `code-sign-in` and passes its own unit, source and E2E tests; `claim_invitations` is an RPC. No screen, countdown, recovery mail or "password set" field was built. The premise "a link-created user has no password" holds for users `account-access` creates and NOT for users `identity-callback` creates | § *The server contract for Phase 178* above; E2E `invitation-contract` (15 tests); T: `2026-10-07-174-identity-provider-accounts-read-as-password-set.md` |
| O-4 | to 171 / 178 | **Kept as a seam, not built.** No function of this phase reads the registration-mode matrix. The target's entity type and the project are available where 178 would add the condition: `invitation_code_status` and `invitation_link_request` both find the row by `(project_id, code_hash)` or `(project_id, email)` and so have `i.target_type` and `i.project_id` in hand; a project-scope promise has no entity type for the matrix to judge. The contradiction with Phase 171's "an invitation is not a registration mode" is unsettled | `apps/supabase/supabase/schema/506-invitation-rpcs.sql`; `packages/app-shared/src/settings/contestantAppConfig.ts` (the sentence); the Publishers' Guide says an invitation works whatever the modes are |
| O-5 | to 173 / 178 | **Holds for a returning user, not for a first-time one.** A returning user whose claim wrote nothing they can edit lands on the app root and sees "nothing to edit" (E2E `invitation-landing` test 1). A first-time invitee in the same position sets a password and is then refused by the login form | `NothingToEdit.svelte`; T: `2026-10-07-174-first-time-invitee-with-no-contestant-grant-is-refused-after-setting-a-password.md` |
| O-6 | to 172 | **Built as stated, and it bit the dataset.** `create_invitations` confirms a named entity, so an invited, never-signed-in entity with a confirmed nomination is public once its project is open (J1). `inviteByEmail`, which replaces `sendEmail`, records no acceptance | pgTAP Section 6 "seeding confirms a named entity"; `tests/tests/utils/supabaseAdminClient.ts` (`inviteByEmail`); T: `2026-10-07-174-seeding-an-invitation-makes-a-hidden-entity-public.md` |
| O-7 | to 175 | **Built for all four entity types; the decision is open.** A named candidate, organization, faction and alliance are confirmed when an invitation is seeded for them. The fallback of ruling 19 is one type test in the confirming `CASE` of `create_invitations` and its pgTAP rows. A confirmed organization's `name` is frozen for its own user and `short_name` is not: the pre-existing trigger, unchanged here | `create_invitations` in `506-invitation-rpcs.sql`; `enforce_entity_immutability` in `011-validation-functions.sql`; the same todo as O-6 |
| O-8 | to 179 (security) | **Not this phase's to build; filed.** The claim trusts only a confirmed address, and `identity-callback` still creates its user with `email_confirm: true` on a generated placeholder. A typed address stored confirmed would let anyone claim another person's invitation | T: `2026-10-07-174-typed-address-of-an-identity-provider-user-must-stay-unconfirmed.md` |
| O-9 | todo filed here | **Filed.** Identity-provider registration never claims an invitation; a seeded person who registers through the provider becomes a duplicate an admin resolves by hand | T: `2026-10-07-174-identity-provider-registration-never-claims-an-invitation.md`; stated in the docs under "What this does not do" |
| O-10 | todo filed here | **Filed.** Seeding sends nothing; announcing invitations by mail belongs beside the Admin App's seeding screens | T: `2026-10-07-174-announcing-invitations-by-mail.md`; the Publishers' Guide says the publisher informs the candidates |
| O-11 | schema seriality | **Holds: 174 regenerated after 173, and 175 has not run.** The two schema files and the single migration were regenerated last at `de0cc2808` (174-04, the last commit that touches `apps/supabase/supabase/schema/` or `migrations/`; `git log -1 --format=%h -- apps/supabase/supabase/schema apps/supabase/supabase/migrations`), and are unchanged at the head the closing gate names. Phase 175 regenerates after this one | `apps/supabase/supabase/migrations/00001_initial_schema.sql` (7651 lines); gate rows `types-clean` and `lint` (the parity gate) |
| O-12 | docs and skills | **Done, in three plans.** 174-03 (auth configuration), 174-07 (the removal: invitation, registration, email, Edge Functions, authentication, architecture and environment pages, `apps/supabase/README.md`, both `.env.example` templates, the skill's function list), 174-10 (the model end to end, the controls and residuals, the deployment obligations, the database skill and its two references). `CLAUDE.md` was corrected by the operator (`78a9ff95b`) | `apps/docs/src/routes/(content)/developers-guide/`; `.claude/skills/database/`; `## For the operator` below |
| O-13 | the stack restart | **Done and documented.** The auth keys and `[edge_runtime] policy` are read at stack start; every gate run's `stack` row reads the running service. Under `per_worker` a change to a function's source also needs the restart (E8) | `apps/supabase/README.md` § *Local auth and Edge runtime configuration*; the authentication docs page; `174-stack-probe.sh` |

Beyond O-1 to O-13:

| For | What | Where it lives |
|---|---|---|
| Phase 178 | **The wire contract.** One endpoint, three operations, their bodies and answers | § *The server contract for Phase 178* above; `apps/supabase/supabase/functions/account-access/contract.ts`; the Edge Functions docs page |
| Phase 178 | **Four writer methods**: `checkInvitationCode`, `requestSignInLink`, `signInWithInvitationCode`, `claimInvitations`, each with a public and an abstract `_` twin. The three function calls go through one private method that adds `operation` and `project_id` | `apps/frontend/src/lib/api/base/dataWriter.type.ts`, `universalDataWriter.ts`, `adapters/supabase/dataWriter/supabaseDataWriter.ts`, `adapters/supabase/utils/invitationAccess.ts` |
| Phase 178 | **`invitationCodeLogin` has no caller.** A form action passes `signInWithInvitationCode: async (c) => (await writer.signInWithInvitationCode(c)).type === 'success'` with `writer = createDataWriter({ fetch, locals })`, the members the login actions pass, and its own grant shapes | `apps/frontend/src/lib/auth/invitationCodeLogin.ts`; 174-08-SUMMARY § *For Phase 178* |
| Phase 178 | **`witness` is a service-role field no screen sends.** It exists so a test can assert "no mail" after the request's background work is known to be over | the last paragraphs of § *The server contract for Phase 178* |
| Phase 178 | **A slot is given back when no mail was handed to SMTP**, so a "send again" after a failed send is not answered with a 60-second silence. Shown by `linkIssue.test.ts` and pgTAP Section 19, not on a served function | `linkIssue.ts`; `invitation_link_release` |
| Phase 178 | **The re-issue measurement (E6).** A later link makes the earlier unopened one stop working; only the newest mail works; a third party can cause it once a minute | T: `2026-10-07-174-a-later-sign-in-link-makes-the-earlier-one-stop-working.md` |
| Phase 178 | **No operation takes a purpose parameter.** A recovery request is a NEW operation of the same function, not a flag on `request-link`; `contract.ts` parses a closed set of operations | `contract.ts` (the discriminated body) |
| Phase 178 | **The registration-mode matrix is not consulted** by the four calls, and **the invitation leg of the set-password page is exempt from the registration-code guard** (`isRegistrationCodeLeg` is false for the set-password route without a key) | row O-4; `apps/frontend/src/routes/contestant/register/registrationCodeGuard.ts` |
| Phase 178 | **A mailed link carries no `next`.** The callback honours a validated `next` on the `magiclink` arm for a user with a password, but the function's link sets none, so such a user lands on the app root | the callback; `signInLink.ts` |
| Phase 178 | **A refresh that fails after a successful claim** leaves the grant written and the token without it until the session is next reissued; the user is landed or gated on the token as it is | `admitSession`; `claimAndRefresh` |
| Phase 178 | **The callback's `signup` and `email` arms remain**; `toCallbackUrl` leaves with the recovery mail; the auth service's own `POST /otp`; the per-caller limit | T: `2026-10-07-174-callback-keeps-signup-and-email-arms.md`, `…-tocallbackurl-leaves-with-the-recovery-mail.md`, `…-auth-service-otp-endpoint-tells-registered-addresses.md`, `…-no-per-caller-limit-on-the-anonymous-invitation-operations.md` |
| Phase 178 and the Admin App's phase | **Two entry-gate facts (ruling 18).** `ADMIN_GRANTS` admits no editor; the Contestant App's login gate refuses a user with no contestant grant | T: `2026-10-07-174-admin-grants-admit-no-project-editor.md` and the first-time-invitee todo of row O-5 |
| Phase 175 | **The schema files and the single migration were regenerated last at `de0cc2808`** and are unchanged at the closing head (row O-11). Phase 175 edits `schema/*.sql` and regenerates after this phase | row O-11 |
| Phase 175 | **The INV-05 fallback of ruling 19**: if an invited organization is not to be confirmed, the change is the `WHEN 'organization'` arm of the confirming `CASE` in `create_invitations` (and by the same reasoning the faction and alliance arms), with the pgTAP rows "a named organization is confirmed from the moment it is seeded" and the Section 8 seeding of `inv-org-mail` | `506-invitation-rpcs.sql`; `39-invitations.test.sql` Sections 6 and 8 |
| Phase 175, and the operator | **OPEN, not settled: `invitationFlow.whileHiddenFromVoters`.** 174-09 added it because `create_invitations` confirms the invited entity, which makes an entity the dataset hides public once it has a confirmed nomination (confirmed in one rolled-back transaction: `anon` reads 0 rows, 1 after seeding, 0 once the nominations are unconfirmed). Under the wrapper the journey's invited candidate runs UNCONFIRMED. Any Phase 175 spec that invites a hidden entity needs the same wrapper. Whether the journey should instead run the real, confirmed path, and whether INV-05 holds for every entity type, is the operator's decision and has not been made | `tests/tests/fixtures/shared/invitationFlow.fixture.ts`; rows J1, J2; T: `2026-10-07-174-seeding-an-invitation-makes-a-hidden-entity-public.md` |
| Phase 179 | Identity-provider registration claims no invitation (O-9); a typed address must stay unconfirmed (O-8); identity-provider accounts read as password-set | the three todos named in rows O-3, O-8 and O-9 |
| The operator of a hosted project | Two dashboard switches, the allowlist entry, `SITE_URL` and the SMTP variables; `claim_invitations` has no in-database guard | T: `2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md`, `2026-10-07-174-claim-invitations-has-no-in-database-guard-on-public-sign-up.md`; the deployment docs page |
| The orchestrator | **Phase 173's pending todo on the token refresh is discharged by 174-08**: the claim is followed by `refreshSession()` before any gate or landing at every entry point, a claim on a candidate that already has an editor is a skip (`candidate_has_editor`) and not an error, and neither database function of file 36 was changed. One of its four asks is NOT met: no E2E case saves an answer on a claimed, confirmed entity in the session that claimed it (the journey writes its candidate's profile and answers only after a logout and a second login, its steps 7 and 9, so on a token issued after the claim anyway; and under `whileHiddenFromVoters` that candidate is unconfirmed). Close the todo or keep it open for that one case | `.planning/todos/pending/2026-10-06-173-refresh-the-session-after-a-claim.md` |

Other todos filed by this plan, none of which a row above names: `2026-10-07-174-native-speaker-review-sign-in-mail.md`; `2026-10-07-174-safelistusers-reads-one-page-and-answers-a-failure-with-empty.md`; `2026-10-07-174-e2e-drivers-write-db-start-output-with-the-local-keys.md`; `2026-10-07-174-nothing-type-checks-the-edge-functions.md`; `2026-10-07-174-allowlist-probe-reads-the-auth-container-environment-through-inspect.md`; `2026-10-07-174-send-email-jwtsegment-has-no-importer.md`; `2026-10-07-174-the-claim-and-refresh-pair-exists-twice.md`. Three older todos gained a dated update: `2026-09-02-deployment-guide-production-redirect-allowlist.md` (the paths as they are now), `2026-10-03-edge-email-functions-have-no-e2e-coverage.md` (`invite-candidate` is gone; `account-access` has E2E callers; `send-email` still has none) and `2026-09-07-typecheck-lint-and-format-the-project-scoped-query-fixtures.md` (the gate script itself has ESLint errors no gate reports).

## For the operator

Written by plan 174-10, Task 3.

### (a) `CLAUDE.md`, read against the tree at this plan's start

Read whole in § *Backend (Supabase)*, § *Development Environment*, § *Troubleshooting* and § *E2E Hard Rule*, at `a680690a4`. The operator's commit `78a9ff95b` had already replaced the two sentences 174-07 reported as false.

**No sentence was found false.** In particular: "**Edge Functions**: `apps/supabase/supabase/functions/` — `account-access`, `identity-callback`, `send-email`" matches `ls apps/supabase/supabase/functions`; the **Auth** bullet's description of an invitation (a row that promises a grant, `create_invitations` sends nothing, `account-access` mails a link when asked, `claim_invitations` writes the grants for the signed-in user's own confirmed address) matches the schema files and the function; the void-run bullet matches the wrapper's exit 8 and marker.

Two things it does not say, neither a contradiction:

- § *Development Environment* and § *Troubleshooting* do not say that a change to `config.toml`, to the functions' environment file or to a function's source reaches the running stack only after `yarn db:stop` and `yarn db:start`. A line that could be pasted under § *Troubleshooting*: `- **A change to an Edge Function, to apps/supabase/supabase/config.toml or to the functions' environment file has no effect**: the auth service and the Edge runtime read all three when the stack starts. Run yarn db:stop and then yarn db:start.`
- The **Auth** bullet says "bank authentication via OpenID Connect (Signicat)"; `identity-callback` serves two provider types, `signicat-ftn` and `idura-ftn`. True as far as it goes, and not this phase's.

`CLAUDE.md` was not edited by any plan of the phase (`git diff --stat a680690a4..HEAD -- CLAUDE.md` prints nothing for this plan; the two changes to it in the phase's range are the operator's `c1d049136` and `78a9ff95b`).

### (b) INV-02 and roadmap criterion 2

Neither carries the unresolved marker at this head (`grep -n "UNRESOLVED" .planning/ROADMAP.md .planning/REQUIREMENTS.md` hits `REG-05` and a criterion of Phase 179 only). Quoted:

- `REQUIREMENTS.md` line 36: "- [ ] **INV-02**: A duplicate invitation is refused and the first is left unchanged: a second invitation in the project carrying the same email for the same grant target `(scope, target type, target id)`, whatever role it promises, or carrying a code the project already holds, whatever its target. (amended 2026-10-06, 174-A3 (c), 174-B3)"
- `ROADMAP.md` § Phase 174, criterion 2: "A duplicate invitation is refused, and the first is left unchanged: a second invitation in the project carrying the same email for the same grant target `(scope, target type, target id)`, whatever role it promises, or carrying a code the project already holds, whatever its target (INV-02). (amended 2026-10-06, 174-A3 (c), 174-B3)"

The copy of criterion 2 inside `174-CONTEXT.md` `<domain>` still shows the older wording with the marker; it is the context document's snapshot and was not edited. `REQUIREMENTS.md` shows INV-01 to INV-05 unchecked and "Pending" in its traceability table; marking them is the orchestrator's.

### (c) The rulings of `174-01-PLAN.md`, with what happened to each

1. **OQ-1, the auth configuration.** Done in 174-03: `[auth] enable_signup = false`, `[auth.email] enable_confirmations = true`, one restart, the probe before and after, the gate `assert:auth-signup-closed`, the E2E project `auth-service-contract`, the function's fail-closed check (174-05), the default suite and both bank-auth projects green before and after. The hosted obligation is in the deployment page and two todos; the dashboard labels were never checked against a hosted project.
2. **J3 and OQ-9, the full authority map and two list edits.** Done in 174-02. The linter and file 25 reported exactly `project.manage_editors` and `account.manage_admins` and nothing else (M1, M2); `SAME_PERMISSION_ALLOW` went from one entry to three and `m17_unenforced_ratified` from six members to four.
3. **J1, the shape.** One row promises one grant; no child table.
4. **J2, the duplicate rule.** Two unique indexes as stated. The record's wording was already amended when the phase started (see (b)).
5. **No per-caller cap.** Not built, as ruled. Built: the 60-second slot per address with release, one binding per code per 60 seconds, ten look-ups per used code per fifteen minutes, 60-bit codes. The caller observation of 174-05 (E7) is the local stack's. Residuals R-a to R-d are in the docs and in one todo.
6. **J4, scope moved from 178.** The server-side interval and the mail in seven locales are built (174-04, 174-05). The native-speaker review is filed.
7. **OQ-5, `password_set`.** Returned by the claim and used by the callback's `magiclink` arm (174-04, 174-08). The correction to fact 19 is filed for 178 and 179; not re-measured on the local stack.
8. **OQ-4, the link's origin.** `SITE_URL` only, with the redirect question asked first and a yes believed for ten minutes (174-05, E4); both templates say `http://localhost:5173`; the E2E helper `toRunOrigin` replaces scheme, host and port only and asserts the rest as received (174-06). Shown on the running stack by the contract spec's hostile-header test.
9. **OQ-10, the SMTP port and the checkpoint.** The checkpoint was needed: the running edge container read `SITE_URL http://127.0.0.1:5173` and `SMTP_PORT 2500` against the template's values (S8). The operator set the three lines and confirmed on 2026-10-07 (S10); the next task read all three EQUAL and one mail through `send-email` arrived (S11, S12). No executor opened the untracked file.
10. **OQ-7, `per_worker`.** Set in 174-03's restart. Measured in 174-05: a background task completes after the response (the mail arrived 3559 ms after a 5 ms answer, E2), and a code change is not served without a restart within ten seconds (E8). The checkpoint reserved for "the mail did not arrive" was not needed.
11. **OQ-8, the project from the request.** Built; the function reads no project from its environment, and the project-scoping gate requires the term at the one invocation site.
12. **OQ-2, the alphabet.** Crockford's base 32, 60 bits, `O` read as `0` and `I`, `L` as `1`.
13. **OQ-3, `toCallbackUrl` not deleted.** One caller left, the journey's reset step; its default names the type the callback now refuses. Filed for 178.
14. **OQ-6, the auth service's `POST /otp`.** Accepted; filed for 178. The registered half was not re-measured on the local stack by this phase.
15. **Additions to the SQL contract.** All built as listed: `invitation_link_request` returns the address; one binding per code per 60 seconds; `invitation_link_release`; the throttle keys go with a deleted invitation; the witness pair. One fact beyond the list (C7): the claimant's `link:` key survives the deletion of a used code's row for the rest of its minute.
16. **The callback's `invite` arm removed and the type refused.** Done in 174-09 (`0c103ce3f`). The `signup` and `email` arms remain, although the research measured the same password effect for them; filed for 178.
17. **`CLAUDE.md` is not edited.** No plan edited it. The operator corrected it in `78a9ff95b`; see (a).
18. **Two entry-gate facts recorded, not changed.** Both hold as recorded. The first-time case was seen once, under a negative control (174-09); the landing spec asserts the returning-user case and the Admin App's login for a claimed `(project, admin)` promise. Two todos.
19. **INV-05 as D-11 states it.** Built for all four entity types; the decision is open (the obligations table above, and one todo).
20. **Plan shape.** Ten plans. Six closed on a full default E2E run (174-01, 03, 06, 08, 09, 10); 174-02, 04, 05 and 07 closed on gate rows. 174-03 carried the one checkpoint.
21. **Names.** As chosen, with these differences on the tree: one private writer method builds all three function calls (the plan described three `functions.invoke` sites); the landing spec's addresses have their own prefix, `invitation-landing-`; schema numbers 305 and 506 and pgTAP number 39 were free as planned.
22. **Two dedicated dataset rows.** Added in 174-06 for the contract spec (one candidate, one organization, unconfirmed, no nomination).
23. **The two deployment checks are never remembered for a worker's lifetime.** Built: 60 seconds for sign-up, ten minutes per callback URL for the redirect, a no never remembered, both before the database is asked. Unit and source tests only; neither refusal was observed on a served function.
24. **Negatives about mail wait on a witness.** Built and used by every negative of the contract spec; `inviteByEmail` waits on its own witness too (174-09).
25. **No executor reads a secret-bearing file or prints a container's environment.** Held by `174-verdict.mjs hygiene` at every close. Two slips and one standing exception, all reported: 174-05 redirected `yarn db:start`'s whole output into an evidence file once and replaced the line within the minute; `e2e-run.sh` and the bank-auth drivers do the same by design; `170-allowlist-probe.sh` reads the auth container's environment through `docker inspect` and `grep`. Two todos.

### (d) Decisions and observations left open, with no todo of their own

- **The `[db]` tag** is missing from three commit titles of 174-02 (`ea603b205`, `6c51d7589`, `3fd1c9ad1`), which `.agents/code-review-checklist.md` asks for; and `37dea9256` is a fix of 174-04's own two test commits. Retitling or folding needs a history rewrite, which no executor attempted. Apply when the branch is restructured for review.
- **A code-hash collision is not retried** (174-02): D-07 says the seeding call resolves a 2⁻⁶⁰ collision by generating again; the tree raises `23505` and undoes the batch, and the caller seeds again. A retry loop around the insert is the change if the sentence is wanted literally.
- **`authenticated` holds EXECUTE on the three private code functions and on `private.localized_has_text`** (174-02), where the plan's threat register assumed them revoked: the insert trigger is `SECURITY INVOKER` and calls them as the inserting role (M3). They are in `private`, read no table and return nothing secret.
- **There is no security page in the docs site.** `developers-guide/backend/security` is a redirect stub to the authentication page (`+page.ts`, `redirect(308, …)`), and this plan's file list names a `+page.md` there. The controls and the residuals are on the authentication page, under "Security of the invitation model" and "What this does not protect against". Making it a page of its own means replacing the stub and adding a navigation entry.
- **A browser test that opens a mailed link puts the link into Playwright's record of the `page.goto` call**, and into the trace when the test fails (174-09). The run directories are gitignored, the token is spent by that navigation and the user is deleted by the teardown.
- **`admin-auth.setup.ts` and `adminLoginPage.fixture.ts` hold the same two raw locators**, and the journey spec's header still says "22 named `test.step` segments" although the walk has more (174-09).
- **pgTAP has only ever been shown green on a freshly reset database** (fact X5): every gate run resets first.
- **The database skill holds statements this phase did not move and nobody re-measured**: "4 enums" (the applied schema has eight enum types), "11 content tables", and the fixture sizes of its pgTAP section. Its freshness record says so. `bash .claude/scripts/audit-skill-links.sh database` exits 1 with 30 dangling citations before and after this plan (the same 30 tokens); `bash .claude/scripts/audit-skill-routing.sh` exits 1 before and after with the same two findings (the spike-findings skill's depth, and the opening stem four skills share).

## Closing gate

Written by plan 174-10, Task 4. Local times are EEST (UTC+3).

**The head the closing runs describe is `d6ad5ed92`.** The last commit that touches anything outside `.planning/` is `8e0c421f0` (`git log -1 --format=%h -- . ':(exclude).planning'`); `d6ad5ed92` after it changes the bank-auth driver alone. Every run named as closing evidence below records `d6ad5ed92` as its head, and every verdict reports "not stale: head d6ad5ed92 is tree-equal to HEAD outside .planning/". The closing was made twice: once on `0b393f144`, where the bank-auth journey was red, and again in full on `d6ad5ed92` after the fix. Only the second set is evidence for the close; the first is kept and described under *What preceded it*.

### Gate set `174-10-final-r2` — exit 0, 15 rows, every status 0

`tests/e2e-runs/174-gates/174-10-final-r2`, window 2026-10-07 16:47:20 to 16:51:44 local, under `caffeinate -dimsu`, on battery power with the lid open; `sleep_entries_in_window: 0`; no void marker. `node …/174-verdict.mjs gates 174-10-final` (which resolves to the newest re-run) exits 0: "15 expected (the full gate set), 15 recorded"; "not stale"; "power: no Sleep entry inside the run window".

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 59 |
| db-reset | 0 | 32 |
| types-regen | 0 | 3 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 4 |
| unit | 0 | 81 |
| check-frontend | 0 | 11 |
| build | 0 | 23 |
| format | 0 | 19 |
| docs-links | 0 | 3 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 4 |

Read from the rows' logs: pgTAP **39 files and 1706 tests**, `Result: PASS`; the schema linter `No schema errors found`, census "policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)", `0 error(s), 3 warning(s)`; unit — frontend **163 files passed and 1 skipped, 2617 tests passed and 11 skipped**, supabase functions 18 files and 462 tests, dev-seed 68 and 1030, app-shared 10 and 141, data 47 and 244 (and core 3 and 8, matching 5 and 43, filters 1 and 22, llm 2 and 49, question-info 2 and 22, argument-condensation 6 and 31); `check-frontend` "2715 FILES 0 ERRORS 0 WARNINGS"; `name-gate-self-test` "82 finding(s) on the fixture, 82 expected"; `auth-config` "3 key(s) hold in apps/supabase/supabase/config.toml"; `stack` "every row OK". Every total equals `174-09-close`'s: this plan added no test, no schema and no source.

### The integration report — 11 of 11, the invitation group 4 of 4

`tests/e2e-runs/174-gates/174-10-integration-r2.json` (head `d6ad5ed92`, on the database the gate set had just reset): 11 tests, 11 passed, 0 failed, 0 skipped. The four tests whose full name holds "invitation" all passed: "answers used for the code of a claimed invitation"; "refuses a code sign-in with a wrong password, and writes no cookie"; "signs in with the code and the right password, and the session cookies are written when the call resolves"; "claims nothing for that session, whose invitation is already claimed, and reports that the user has a password". Afterwards `auth.users` held 2 rows and `public.invitations` 0. The keys were read from `supabase status -o env` into shell variables and printed nowhere; neither the log nor the report holds a key-shaped string (`grep -c eyJ`: 0 and 0).

### The three verdicts — each exit 0

- `174-verdict.mjs greps`: `'invite-candidate'`, `'inviteUserByEmail'`, `'preregisterWithApiToken'` and `'complete-registration'` each "no hit (exit 1)".
- `174-verdict.mjs exemptions`: `EXEMPT` holds 1 entry; no entry names `invite-candidate` or `get_candidate_user_data`; both count sentences agree with the array.
- `174-verdict.mjs hygiene`: 0 hits, the same two advisory lines as at the baseline. It scans `174-bankauth.sh` as changed by this plan's fix (0 hits).

### Default E2E run `174-10-final-r3` — exit 0

`tests/e2e-runs/174-e2e/174-10-final-r3`. Counts: **total 218, passed 218, failed 0, flaky 0, skipped 0, did not run 0; 106 projects**; scope the full default suite; window 16:52:28 to 16:58:21 local; `sleep_entries_in_window: 0`; no void marker. `node …/174-verdict.mjs e2e 174-10-final --same-projects-as 174-09-close --expect-project invitation-contract --expect-project invitation-landing --expect-project auth-service-contract --expect-project contestant-journey` exits 0: "per project: 106 compared, 0 not as expected"; `invitation-contract` 15/15, `invitation-landing` 3/3, `auth-service-contract` 2/2, `contestant-journey` 1/1. The verdict's whole output is `tests/e2e-runs/174-gates/174-10-final-r3-e2e-verdict.txt`.

Per project against `174-09-close` (218 tests, 106 projects): **no project moved.** Each of the 106 is at exactly its total there.

Read from the run's dev-server log: no line of "claiming invitations failed", "session refresh after the claim failed" or "sign-out after a failed claim"; one "Candidate login failed: Invalid login credentials", as in every close since `174-06-close`. The function's log, read through the filter for its prefix over the ten minutes that hold the run, held no line.

### Bank-auth driver `174-10-r2` — exit 0

`bash …/174-bankauth.sh 174-10-r2 after`, 13:59:06Z to 14:05:34Z.

| Run | Counts | Project | Issuer read back | Window (local) | `sleep_entries_in_window` | Verdict |
|---|---|---|---|---|---|---|
| `174-10-r2-bank-auth` | total 8, passed 8, failed 0, flaky 0, skipped 0, did not run 0; 3 projects | `bank-auth` 6 of 6 | `https://test-idp.example.com` | 16:59:11 to 16:59:40 | 0 | `e2e 174-10-r2-bank-auth --allow-slice --expect-project bank-auth` exits 0 |
| `174-10-r2-bank-auth-journey` | total 152, passed 152, failed 0, flaky 0, skipped 0, did not run 0; 90 projects | `bank-auth-journey` 1 of 1 | `https://127.0.0.1:9443` | 16:59:53 to 17:04:43 | 0 | `e2e 174-10-r2-bank-auth-journey --allow-slice --expect-project bank-auth-journey` exits 0 |

The journey slice holds `contestant-journey` and `perm-localisation-positive`, which register through `account-access`; the function's captured log for that run holds no `account-access:` line, so every mail of the slice was sent.

**The restore, and both probes after it** (`tests/e2e-runs/174-e2e/_drivers/174-10-r2.bankauth.restore.txt`): `yarn db:stop` exit 0, `yarn db:start` exit 0, the three functions answering `OPTIONS` below 500, ports 5273, 8777 and 9443 free; `170-allowlist-probe.sh after` exit 0, every row OK; `174-stack-probe.sh after` exit 0, every row OK. Both probes were run once more by hand after `yarn db:seed:default` (exit 0, 752 rows) and exit 0 again (`tests/e2e-runs/174-gates/174-10-allowlist-probe-close.txt`, `174-10-stack-probe-close.txt`). Read by name afterwards: `GOTRUE_DISABLE_SIGNUP=true`, `GOTRUE_MAILER_AUTOCONFIRM=false`. `OPTIONS` answers 200 from `account-access`, `identity-callback` and `send-email` and 404 from `invite-candidate`. Nothing listens on 5173, 5273, 8777 or 9443.

### What preceded it: one void run, one red run, one fix

1. **Gate set `174-10-final`** (head `0b393f144`, 16:01:27 to 16:05:04 local, on AC power): exit 0, 15 rows, every status 0, the same totals as above. Superseded by the fix, not red.
2. **Integration `174-10-integration.json`** (the same head): 11 of 11, the invitation group 4 of 4. Superseded.
3. **Default E2E `174-10-final` — VOID.** The wrapper exited 8 and left `VOID-host-suspend.txt`: `last_beat_before_gap_utc=2026-10-07T13:06:38Z`, `first_beat_after_gap_utc=2026-10-07T13:10:45Z`, `gap_ms=244909`. `power.txt` holds the host's own entry for the same moment, "16:06:38 Sleep, Entering Sleep state due to 'Clamshell Sleep'", with the power source changing from AC to battery inside the window: the lid was closed with the charger unplugged, which `caffeinate` does not hold off. The host then cycled between Maintenance Sleep and DarkWake until 16:32:37, when `pmset -g log` records a full wake on user activity; the lid read open at 16:33:08, still on battery. The run is evidence in neither direction; its directory is kept. `174-verdict.mjs e2e` was not asked to judge it by that label alone, since a label resolves to its newest re-run.
4. **Default E2E `174-10-final-r2`** (head `0b393f144`, 16:33:34 to 16:38:53 local, battery, lid open): exit 0, total 218, passed 218, 106 projects, "106 compared, 0 not as expected". Green, and superseded by the fix.
5. **Bank-auth `174-10`** (head `0b393f144`): `174-10-bank-auth` total 8, passed 8. **`174-10-bank-auth-journey` RED: total 152, passed 69, failed 1, flaky 0, skipped 0, did not run 82**; no void marker, `sleep_entries_in_window: 0`. The driver exited 1; its restore and both probes passed.
6. **The cause.** The one failed test is `contestant-journey`, "full candidate journey end-to-end", in step 3: `Error: inviteByEmail: the link request finished without handing a mail over` (`supabaseAdminClient.ts`, after 4 s). The function's own line in the driver's captured log, at 13:41:36Z, the same second: `[Error] account-access: a link could not be issued or mailed; its slot is given back {"name":"Error","code":"ERR_ENV_UNCONFIGURED"}`. The driver serves the functions with `supabase functions serve identity-callback --env-file <generated file>`, which replaces the function environment of every function; the generated file held the identity provider's five variables, `PUBLIC_PROJECT_ID` and `SITE_URL`, and no SMTP variable. `account-access` therefore created the user, could not mail, and the 82 tests behind the journey in the serial chain did not run. Bank-auth had last run at 174-03's close, before 174-09 re-pointed the journey at `account-access`; this was the first bank-auth run since.
   - **Read directly:** the failing test and its error; the function's log line with its code and second; the generated file's seven lines (the driver's source).
   - **Inferred:** that the unset variable is `SMTP_HOST`, from the order of the `requireEnv` calls in `sendMail`; the log line carries the code and not the name.
   - **Confirmed by the re-run, not in isolation:** with the three SMTP lines as the driver's only change, `174-10-r2-bank-auth-journey` is 152 of 152 and the function's log holds no line.
7. **The fix, two commits.** `d6ad5ed92`: both generated Edge files carry `SMTP_HOST`, `SMTP_PORT` and `SMTP_FROM`, read line for line from the tracked template `apps/supabase/supabase/functions/.env.example`. `8e0c421f0`: `tests/IDURA-TEST-RUNBOOK.md`, whose step E-1 the driver encodes, writes the same three lines and says why the journey's chain needs them; and the Edge Functions docs page says that `request-link` logs the code without the variable's name and that a file served with `--env-file` is the function environment of every function. Because `8e0c421f0` changes the tree outside `.planning/`, the gate set, the integration run, the default run and both bank-auth runs were all made again under new labels.
8. **A side effect worth keeping.** The red run is the first time the "slot is given back" branch ran on a served function, and the first time a served `account-access` met an unset variable. Only the log line was read. Filed as `.planning/todos/pending/2026-10-07-174-account-access-log-does-not-name-an-unset-variable.md`.

### The E2E counts of every label of the phase

Start times are UTC. `VOID` is the wrapper's marker.

| Label | Started (UTC) | Head | Total | Passed | Failed | Flaky | Skipped | Did not run | Projects | Wrapper exit | |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `174-01-baseline` | 10-06 19:38 | `97c6a91e3` | 198 | 198 | 0 | 0 | 0 | 0 | 103 | 0 |  |
| `174-03-pre-bank-auth` | 10-06 20:24 | `ef110d349` | 8 | 8 | 0 | 0 | 0 | 0 | 3 | 0 |  |
| `174-03-pre-bank-auth-journey` | 10-06 20:25 | `ef110d349` | 152 | 152 | 0 | 0 | 0 | 0 | 90 | 0 |  |
| `174-03-contract-slice` | 10-07 08:00 | `5d02cf0f4` | 2 | 2 | 0 | 0 | 0 | 0 | 1 | 0 |  |
| `174-03-close` | 10-07 08:07 | `f79393703` | 200 | 200 | 0 | 0 | 0 | 0 | 104 | 0 |  |
| `174-03-bank-auth` | 10-07 08:13 | `f79393703` | 8 | 8 | 0 | 0 | 0 | 0 | 3 | 0 |  |
| `174-03-bank-auth-journey` | 10-07 08:13 | `f79393703` | 152 | 152 | 0 | 0 | 0 | 0 | 90 | 0 |  |
| `174-06-contract-slice` | 10-07 10:30 | `2c107fee3` | 17 | 17 | 0 | 0 | 0 | 0 | 3 | 0 |  |
| `174-06-contract-slice-again` | 10-07 10:31 | `2c107fee3` | 17 | 17 | 0 | 0 | 0 | 0 | 3 | 0 |  |
| `174-06-contract-slice-mutant-claim` | 10-07 10:33 | `2c107fee3` | 17 | 7 | 1 | 0 | 9 | 0 | 3 | 1 | negative control |
| `174-06-contract-slice-mutant-eligibility` | 10-07 10:34 | `2c107fee3` | 17 | 8 | 1 | 0 | 8 | 0 | 3 | 1 | negative control |
| `174-06-contract-slice-mutant-throttle` | 10-07 10:34 | `2c107fee3` | 17 | 9 | 1 | 0 | 7 | 0 | 3 | 1 | negative control |
| `174-06-close` | 10-07 10:39 | `2c107fee3` | 215 | 215 | 0 | 0 | 0 | 0 | 105 | 0 |  |
| `174-08-close` | 10-07 11:45 | `352f9793e` | 215 | 215 | 0 | 0 | 0 | 0 | 105 | 0 |  |
| `174-09-journey-slice` | 10-07 12:06 | `c3849a0eb` | 5 | 5 | 0 | 0 | 0 | 0 | 5 | 0 |  |
| `174-09-journey-slice-again` | 10-07 12:07 | `c3849a0eb` | 5 | 5 | 0 | 0 | 0 | 0 | 5 | 0 |  |
| `174-09-landing-slice` | 10-07 12:15 | `0c103ce3f` | 5 | 5 | 0 | 0 | 0 | 0 | 3 | 0 |  |
| `174-09-landing-slice-mutant-claim-nothing` | 10-07 12:17 | `0c103ce3f` | 5 | 2 | 1 | 0 | 2 | 0 | 3 | 1 | negative control |
| `174-09-journey-slice-mutant-claim-nothing` | 10-07 12:17 | `0c103ce3f` | 5 | 4 | 1 | 0 | 0 | 0 | 5 | 1 | negative control |
| `174-09-landing-slice-mutant-claim-editor-only` | 10-07 12:17 | `0c103ce3f` | 5 | 3 | 1 | 0 | 1 | 0 | 3 | 1 | negative control |
| `174-09-landing-slice-mutant-claim-any-address` | 10-07 12:18 | `0c103ce3f` | 5 | 4 | 1 | 0 | 0 | 0 | 3 | 1 | negative control |
| `174-09-close` | 10-07 12:23 | `e219189ae` | 218 | 218 | 0 | 0 | 0 | 0 | 106 | 0 |  |
| `174-10-final` | 10-07 13:05 | `0b393f144` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | **VOID** |
| `174-10-final-r2` | 10-07 13:33 | `0b393f144` | 218 | 218 | 0 | 0 | 0 | 0 | 106 | 0 | green, superseded by the fix |
| `174-10-bank-auth` | 10-07 13:39 | `0b393f144` | 8 | 8 | 0 | 0 | 0 | 0 | 3 | 0 | green, superseded by the fix |
| `174-10-bank-auth-journey` | 10-07 13:40 | `0b393f144` | 152 | 69 | 1 | 0 | 0 | 82 | 90 | 1 | **RED**; cause and fix above |
| `174-10-final-r3` | 10-07 13:52 | `d6ad5ed92` | 218 | 218 | 0 | 0 | 0 | 0 | 106 | 0 | **the close** |
| `174-10-r2-bank-auth` | 10-07 13:59 | `d6ad5ed92` | 8 | 8 | 0 | 0 | 0 | 0 | 3 | 0 | **the close** |
| `174-10-r2-bank-auth-journey` | 10-07 13:59 | `d6ad5ed92` | 152 | 152 | 0 | 0 | 0 | 0 | 90 | 0 | **the close** |

No full default run of the phase was red, and one was void. The only red run that was not a deliberate negative control is `174-10-bank-auth-journey`.

### The six roadmap criteria, each with the evidence that shows it

1. **An admin seeds an invitation for a candidate or an organization with an email or a code, stating the grant; a caller without the authority is refused (INV-01).** pgTAP `39-invitations.test.sql` Section 2 "the authority map, through the function and through the table" and Section 5 "the code"; E2E `invitation-contract` "seeding an invitation confirms the named entity it promises a grant on" (seeds a candidate by email and an organization by code, and reads each promise back). The refusals are shown in pgTAP only: the E2E spec seeds as the service role.
2. **A duplicate is refused and the first is left unchanged (INV-02).** pgTAP Section 4 "duplicates"; E2E `invitation-contract` "a duplicate invitation is refused, and the first is left unchanged".
3. **A user who proves the email or the code holds exactly the promised grants, and nobody else does (INV-03).** pgTAP Sections 10 "exactly the promised grants", 11 "nobody else", 12 "the pending address" and 13 "each row by itself"; E2E `invitation-contract` "the mailed link signs in to a session that holds exactly the promised grant after the claim and a refresh", "nobody else claims an invitation: …" and "a code binds a fresh address, whose mailed link claims the grant the code promises; the code then answers used"; in a browser, `contestant-journey` step 5.5 and `invitation-landing` (three tests, the third "a signed-in stranger gains nothing from another person's invitation"); that public sign-up is closed, E2E `auth-service-contract` (two tests) and the gate rows `auth-config` and `stack`. On the local stack only: a hosted project's two switches are the operator's.
4. **A used code answers `used`, leads to password sign-in and grants nothing twice (INV-04).** pgTAP Section 16 "the used code"; E2E `invitation-contract` "a used code grants nothing twice: another address that presents it gets no mail, no account and no grant" and "a used code signs in with its claimant's password only, and no answer names the claimant"; the integration report's four tests for the writer's side. No screen leads anywhere yet: Phase 178 builds it.
5. **A named target is confirmed from seeding; one seeded without is not (INV-05).** pgTAP Section 6 "seeding confirms a named entity", which holds both halves; E2E `invitation-contract`'s first test for the confirming half (a candidate and an organization read unconfirmed before the seeding and confirmed after it). Built for all four entity types; the decision whether it should hold for every type is open (§ *Obligations to later phases*).
6. **The full E2E suite is green at close, the re-pointed registration specs and both bank-auth flows included (E2E-03).** `174-10-final-r3` 218 of 218 in 106 projects; `174-10-r2-bank-auth` 8 of 8; `174-10-r2-bank-auth-journey` 152 of 152; all on `d6ad5ed92`, with the gate set `174-10-final-r2` on the same head.

### State left behind

The stack is up, restarted by the bank-auth driver's restore, and serves three functions with public sign-up closed and confirmations on. The database was reset by the gate set and holds the `default` dataset (`yarn db:seed:default`, exit 0, 752 rows; `public.candidates` 328); `auth.users` holds the two users of `seed.sql`; `public.invitations` is empty; `claim_invitations` is the migration's (`md5` `cb08271334637fa452d4f60acfec9195`, as at 174-09's close). No dev server is running and nothing listens on 5173, 5273, 8777 or 9443. Nothing under `tests/e2e-runs/` was deleted. The working tree is clean but for the operator's untracked `CAND-APP-PLAN.md`.
