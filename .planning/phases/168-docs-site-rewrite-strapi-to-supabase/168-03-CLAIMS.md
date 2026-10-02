# 168-03 Claims Ledger — Backend (Supabase) and Seed data

Pages written by plan 168-03, every old page merged into them, and one content-anchored row per command, env name,
file path and flow the pages state. `node .planning/phases/168-docs-site-rewrite-strapi-to-supabase/scripts/check-claims.mjs ledger`
re-checks every `## Claims` row with `git grep -F` of the quoted anchor in its anchor file (D-09). Anchors are copied
from code or configuration at the execution HEAD; README and CLAUDE.md prose is never an anchor.

Page keys used in the Claims table (routes under `/developers-guide/`): `backend/intro`, `backend/authentication`,
`backend/edge-functions`, `backend/email`, `backend/data-import-and-deletion`, `backend/generated-types`,
`development/seed-data`.

## Page verdicts

| Old route | New route | Verdict | What changed | RQ |
| --- | --- | --- | --- | --- |
| `/developers-guide/backend/intro` | `/developers-guide/backend/intro` | updated | The Strapi stub (one banner and a one-line "scheduled to be migrated" note) is replaced by a Supabase overview written from `apps/supabase`: the two SQL directories, the schema number ranges, the regenerate/reset/types sequence, the parity assertion, project scoping (`PUBLIC_PROJECT_ID`, `public.projects`), pgTAP and SQL lint, local ports, and a map of the section. | 0 |
| `/developers-guide/backend/customized-behaviour` | redirect stub → `/developers-guide/backend/intro` | deleted (no equivalent: Strapi code edits and the Strapi admin-tools plugin; the Supabase backend's behaviour is its schema, which the Backend overview describes) | Nothing carried over; the base page described only Strapi customisation. | 0 |
| `/developers-guide/backend/plugins` | redirect stub → `/developers-guide/backend/intro` | deleted (no equivalent: Strapi plugins for SES email, S3 upload and the admin-tools plugin; email is now the `send-email` function and Supabase Auth, uploads are Supabase Storage) | Nothing carried over; the email topic is covered on `/developers-guide/backend/email`. | 0 |
| `/developers-guide/backend/authentication` | `/developers-guide/backend/authentication` | updated | The Strapi permissions/`BACKEND_API_TOKEN`/route-policy text is replaced by the Supabase model: `@supabase/ssr` cookie sessions, `safeGetSession`, the PKCE callback route, `public.grants`, the role and permission matrix, the access-token hook, `user_can`, grant-only entity identity (`get_candidate_user_data`, `ERR_ENTITY_IDENTITY_AMBIGUOUS`, `idx_grants_one_candidate_editor`), RLS, column grants, storage policies and where the service-role key is used. Nothing from the base text was still correct. | 0 |
| `/developers-guide/backend/security` | redirect stub → `/developers-guide/backend/authentication` | replaced → /developers-guide/backend/authentication | The 211 lines of Strapi route policies (`filter-by-candidate`, `restrictPopulate`, …) are not translated; the RLS, column-grant and storage-policy sections of Authentication and authorisation replace them. | 0 |
| — (new page, 168-02 skeleton) | `/developers-guide/backend/edge-functions` | updated | Written from `functions/*/index.ts`: callers, caller checks, what each function writes, the env sources (`requireEnv`, `functions/.env.example`, `[edge_runtime.secrets]`, `check:env-local`), the post-166 grant-only flows, and tests. | 0 |
| — (new page, 168-02 skeleton) | `/developers-guide/backend/email` | updated | Written from `config.toml`, `send-email` and `502-email-helpers.sql`: Supabase Auth email (templates, links, SMTP), `send-email` variables and SMTP settings, and the local email testing server. Replaces the SES/LocalStack prose of the deleted Strapi pages. | 0 |
<!-- verdicts-continue -->

## Claims

| # | Page | Kind | Claim | Anchor file | Anchor |
| --- | --- | --- | --- | --- | --- |
| 1 | backend/intro | fact | The backend workspace is `@openvaa/supabase` in `apps/supabase` | apps/supabase/package.json | `"name": "@openvaa/supabase"` |
| 2 | backend/intro | fact | The local stack runs Auth | apps/supabase/supabase/config.toml | `[auth]` |
| 3 | backend/intro | fact | The local stack runs Storage | apps/supabase/supabase/config.toml | `[storage]` |
| 4 | backend/intro | fact | The local stack runs the Edge Functions runtime | apps/supabase/supabase/config.toml | `[edge_runtime]` |
| 5 | backend/intro | path | Edge Function `identity-callback` exists | apps/supabase/supabase/functions/identity-callback/index.ts | - |
| 6 | backend/intro | path | Edge Function `invite-candidate` exists | apps/supabase/supabase/functions/invite-candidate/index.ts | - |
| 7 | backend/intro | path | Edge Function `send-email` exists | apps/supabase/supabase/functions/send-email/index.ts | - |
| 8 | backend/intro | command | `yarn db:start` starts the stack through the workspace's `start` script | package.json | `"db:start": "yarn workspace @openvaa/supabase start"` |
| 9 | backend/intro | command | The workspace `start` script is `supabase start` (the Supabase CLI) | apps/supabase/package.json | `"start": "supabase start"` |
| 10 | backend/intro | command | `yarn dev` starts the stack before the frontend dev server | package.json | `"dev": "yarn db:start && yarn _dev:concurrent"` |
| 11 | backend/intro | fact | In production the frontend is configured with a hosted Supabase project's URL | render.example.yaml | `key: PUBLIC_SUPABASE_URL` |
| 12 | backend/intro | fact | The CLI never reads `schema/`: `schema_paths = []` | apps/supabase/supabase/config.toml | `schema_paths = []` |
| 13 | backend/intro | path | `migrations/` holds `00001_initial_schema.sql` | apps/supabase/supabase/migrations/00001_initial_schema.sql | - |
| 14 | backend/intro | fact | The migration is the `schema/` files concatenated in filename order | scripts/assert-schema-migration-parity.mjs | `(filename order` |
| 15 | backend/intro | fact | `supabase db reset` applies the migrations directory and nothing else | scripts/assert-schema-migration-parity.mjs | `applies these files and nothing else` |
| 16 | backend/intro | path | Schema group 000–011 ends with the validation functions | apps/supabase/supabase/schema/011-validation-functions.sql | - |
| 17 | backend/intro | path | Schema group 000–011 includes role settings | apps/supabase/supabase/schema/001-role-settings.sql | - |
| 18 | backend/intro | path | Schema group 100–108 starts with tenancy | apps/supabase/supabase/schema/100-tenancy.sql | - |
| 19 | backend/intro | path | Schema group 100–108 ends with admin jobs | apps/supabase/supabase/schema/108-admin-jobs.sql | - |
| 20 | backend/intro | path | Schema file 200 holds the indexes | apps/supabase/supabase/schema/200-indexes.sql | - |
| 21 | backend/intro | path | Schema group 300–303 ends with column grants | apps/supabase/supabase/schema/303-column-grants.sql | - |
| 22 | backend/intro | path | Schema file 400 holds storage | apps/supabase/supabase/schema/400-storage.sql | - |
| 23 | backend/intro | fact | Storage file covers buckets' policies and cleanup triggers | apps/supabase/supabase/schema/400-storage.sql | `Storage RLS policies, cleanup triggers, and helper functions` |
| 24 | backend/intro | path | Schema group 500–505 ends with question functions | apps/supabase/supabase/schema/505-question-rpcs.sql | - |
| 25 | backend/intro | path | Schema file 900 holds the pgTAP helpers | apps/supabase/supabase/schema/900-test-helpers.sql | - |
| 26 | backend/intro | command | `yarn schema:regenerate` rewrites the migration from `schema/` | package.json | `"schema:regenerate": "node scripts/assert-schema-migration-parity.mjs --write"` |
| 27 | backend/intro | command | `yarn db:reset` starts the stack and runs `supabase db reset` | package.json | `"db:reset": "yarn db:start && yarn workspace @openvaa/supabase reset"` |
| 28 | backend/intro | command | The workspace `reset` script is `supabase db reset` | apps/supabase/package.json | `"reset": "supabase db reset"` |
| 29 | backend/intro | command | `yarn db:types` regenerates the types package | package.json | `"db:types": "yarn workspace @openvaa/supabase-types generate"` |
| 30 | backend/intro | command | `yarn lint:check` runs `assert:schema-migration-parity` | package.json | `yarn assert:schema-migration-parity &&` |
| 31 | backend/intro | fact | The parity check fails on a single byte of difference | scripts/assert-schema-migration-parity.mjs | `is BYTE-IDENTICAL to` |
| 32 | backend/intro | fact | The parity check fails when a second `.sql` file appears in `migrations/` | scripts/assert-schema-migration-parity.mjs | `contains EXACTLY ONE` |
| 33 | backend/intro | fact | The parity check proves equality, not correctness | scripts/assert-schema-migration-parity.mjs | `WHAT THIS CHECK CANNOT DO` |
| 34 | backend/intro | fact | `100-tenancy.sql` defines `public.accounts` | apps/supabase/supabase/schema/100-tenancy.sql | `CREATE TABLE public.accounts (` |
| 35 | backend/intro | fact | `100-tenancy.sql` defines `public.projects` | apps/supabase/supabase/schema/100-tenancy.sql | `CREATE TABLE public.projects (` |
| 36 | backend/intro | fact | Every content table references a project through `project_id` | apps/supabase/supabase/schema/100-tenancy.sql | `All content tables reference projects via project_id` |
| 37 | backend/intro | fact | `open_for_voters` defaults to `false` and hides the project from anonymous readers | apps/supabase/supabase/schema/100-tenancy.sql | `open_for_voters boolean NOT NULL DEFAULT false` |
| 38 | backend/intro | env | `PUBLIC_PROJECT_ID` lives in the repo-root `.env`; its example value is the default project id | .env.example | `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001` |
| 39 | backend/intro | fact | `seed.sql` creates the default account | apps/supabase/supabase/seed.sql | `'Default Account'` |
| 40 | backend/intro | fact | `seed.sql` creates the default project, open for voters | apps/supabase/supabase/seed.sql | `Created OPEN FOR VOTERS` |
| 41 | backend/intro | fact | The default project's id is `00000000-0000-0000-0000-000000000001` | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `const DOCUMENTED_DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000001'` |
| 42 | backend/intro | flow | The adapter throws when `PUBLIC_PROJECT_ID` is unset | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `PUBLIC_PROJECT_ID is required but not set.` |
| 43 | backend/intro | flow | The adapter throws when `PUBLIC_PROJECT_ID` is not a canonical uuid | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `must be a canonical 8-4-4-4-12 hexadecimal uuid` |
| 44 | backend/intro | fact | The adapter has no fallback project id | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `There is deliberately NO fallback value` |
| 45 | backend/intro | flow | `identity-callback` reads `PUBLIC_PROJECT_ID` to choose the project a self-registered candidate joins | apps/supabase/supabase/functions/identity-callback/index.ts | `const projectId = requireEnv('PUBLIC_PROJECT_ID', Deno.env.get('PUBLIC_PROJECT_ID')?.trim());` |
| 46 | backend/intro | path | pgTAP tests live in `apps/supabase/supabase/tests/database/` | apps/supabase/supabase/tests/database | - |
| 47 | backend/intro | fact | Each pgTAP file builds fixtures with `create_test_data()` after BEGIN and rolls back at the end | apps/supabase/supabase/tests/database/00-helpers.test.sql | `Each subsequent test file calls create_test_data() after BEGIN, then ROLLBACK at end` |
| 48 | backend/intro | command | `yarn workspace @openvaa/supabase test:db` runs `supabase test db` | apps/supabase/package.json | `"test:db": "supabase test db"` |
| 49 | backend/intro | command | `yarn workspace @openvaa/supabase test:unit` runs Vitest | apps/supabase/package.json | `"test:unit": "vitest run"` |
| 50 | backend/intro | fact | The workspace's Vitest tests are the Edge Function helper tests | apps/supabase/vitest.config.ts | `supabase/functions/**/*.test.ts` |
| 51 | backend/intro | command | The root `yarn test:unit` runs every workspace's `test:unit` through Turborepo | package.json | `"test:unit": "yarn assert:unit-coverage && turbo run test:unit"` |
| 52 | backend/intro | command | `yarn db:lint:sql` runs the workspace's `lint:all` | package.json | `"db:lint:sql": "yarn workspace @openvaa/supabase lint:all"` |
| 53 | backend/intro | command | `lint:all` runs `supabase db lint` and then `lint-schema.mjs` | apps/supabase/package.json | `"lint:all": "yarn lint:sql && yarn lint:schema"` |
| 54 | backend/intro | command | `supabase db lint` runs over the `public` schema | apps/supabase/package.json | `"lint:sql": "supabase db lint --schema public --fail-on warning"` |
| 55 | backend/intro | fact | `supabase db lint` checks PL/pgSQL function bodies only | apps/supabase/scripts/lint-schema.mjs | `(PL/pgSQL-only) does not cover` |
| 56 | backend/intro | fact | `lint-schema.mjs` fails on a `public` table without RLS | apps/supabase/scripts/lint-schema.mjs | `0013 RLS disabled on public tables  (ERROR)` |
| 57 | backend/intro | fact | `lint-schema.mjs` fails when read and write permissions are not kept separate | apps/supabase/scripts/lint-schema.mjs | `9001 Read/write permission separation and mechanism reach (ERROR)` |
| 58 | backend/intro | fact | `lint-schema.mjs` warns about an unindexed foreign key | apps/supabase/scripts/lint-schema.mjs | `0001 Unindexed foreign keys         (WARNING)` |
| 59 | backend/intro | fact | `lint-schema.mjs` needs the local database running | apps/supabase/scripts/lint-schema.mjs | `Runs SQL queries against the local Supabase Postgres instance` |
| 60 | backend/intro | fact | API port 54321 | apps/supabase/supabase/config.toml | `port = 54321` |
| 61 | backend/intro | env | The API URL is `PUBLIC_SUPABASE_URL`, port 54321 locally | .env.example | `PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` |
| 62 | backend/intro | fact | PostgreSQL port 54322 | apps/supabase/supabase/config.toml | `port = 54322` |
| 63 | backend/intro | fact | Studio port 54323 | apps/supabase/supabase/config.toml | `port = 54323` |
| 64 | backend/intro | fact | Email testing server web interface port 54324 | apps/supabase/supabase/config.toml | `# Port to use for the email testing server web interface.` |
| 65 | backend/intro | fact | Email testing server web interface port value | apps/supabase/supabase/config.toml | `port = 54324` |
| 66 | backend/intro | command | `yarn db:status` runs `supabase status` | package.json | `"db:status": "yarn workspace @openvaa/supabase status"` |
| 67 | backend/intro | command | `yarn db:stop` stops the stack | package.json | `"db:stop": "yarn workspace @openvaa/supabase stop"` |
| 68 | backend/authentication | fact | The grants table is `public.grants` in 300-auth-tables.sql | apps/supabase/supabase/schema/300-auth-tables.sql | `CREATE TABLE public.grants (` |
| 69 | backend/authentication | flow | The access-token hook copies the user's grants into the token's `grants` claim | apps/supabase/supabase/schema/301-auth-functions.sql | `projects each public.grants row into the JWT` |
| 70 | backend/authentication | fact | RLS policies delegate their authority decisions to `user_can` | apps/supabase/supabase/schema/302-rls.sql | `Every authority decision in this file delegates to it.` |
| 71 | backend/authentication | fact | Reading an account asks `user_has_account_grant`, the one exception | apps/supabase/supabase/schema/302-rls.sql | `so it is the one structure-table predicate that is not a user_can call` |
| 72 | backend/authentication | fact | Storage policies ask `user_can` through `storage_path_can()` | apps/supabase/supabase/schema/400-storage.sql | `delegated to user_can` |
| 73 | backend/authentication | fact | Edge Functions ask `user_can` over RPC with the caller's own client | apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts | `The call goes through the CALLER'S OWN client` |
| 74 | backend/authentication | path | Server client factory `createSupabaseServerClient` in `$lib/supabase/server.ts` | apps/frontend/src/lib/supabase/server.ts | `export function createSupabaseServerClient(event: RequestEvent) {` |
| 75 | backend/authentication | fact | The server client uses `@supabase/ssr` with only the URL and anon key | apps/frontend/src/lib/supabase/server.ts | `return createServerClient<SupabaseDatabase>(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, {` |
| 76 | backend/authentication | flow | `hooks.server.ts` creates one client per request and puts it on `event.locals.supabase` | apps/frontend/src/hooks.server.ts | `event.locals.supabase = supabase;` |
| 77 | backend/authentication | fact | Session cookies are written with `httpOnly: false` | apps/frontend/src/lib/supabase/server.ts | `httpOnly: false, path: '/'` |
| 78 | backend/authentication | fact | Two server layouts forward the cookies into the page data | apps/frontend/src/lib/supabase/server.ts | `forward these cookies into the SSR payload` |
| 79 | backend/authentication | path | Browser client factory `createSupabaseBrowserClient` returns one shared client | apps/frontend/src/lib/supabase/browser.ts | `if (browserClient) return browserClient;` |
| 80 | backend/authentication | fact | The browser client uses only the URL and anon key | apps/frontend/src/lib/supabase/browser.ts | `constants.PUBLIC_SUPABASE_ANON_KEY` |
| 81 | backend/authentication | flow | `safeGetSession` reads the session with getSession and verifies it with getUser | apps/frontend/src/lib/supabase/safeGetSession.ts | `then verify its access token with` |
| 82 | backend/authentication | fact | The verification is memoised per access token within a request | apps/frontend/src/lib/supabase/safeGetSession.ts | `The verification is memoised per access token until` |
| 83 | backend/authentication | fact | `safeGetSession` is on `event.locals` | apps/frontend/src/hooks.server.ts | `event.locals.safeGetSession = safeGetSession;` |
| 84 | backend/authentication | flow | The auth callback route exchanges `token_hash` with `verifyOtp` | apps/frontend/src/routes/api/candidate/auth/callback/+server.ts | `await locals.supabase.auth.verifyOtp({ token_hash, type })` |
| 85 | backend/authentication | fact | The auth callback is the PKCE exchange route | apps/frontend/src/routes/api/candidate/auth/callback/+server.ts | `Auth callback route for Supabase PKCE token exchange.` |
| 86 | backend/authentication | flow | A recovery link redirects to the password reset page | apps/frontend/src/routes/api/candidate/auth/callback/+server.ts | `route: 'CandAppResetPassword'` |
| 87 | backend/authentication | flow | An invitation link redirects to the set-password page | apps/frontend/src/routes/api/candidate/auth/callback/+server.ts | `route: 'CandAppSetPassword'` |
| 88 | backend/authentication | fact | `site_url` is set in config.toml | apps/supabase/supabase/config.toml | `site_url = "http://127.0.0.1:5173"` |
| 89 | backend/authentication | fact | `additional_redirect_urls` is set in config.toml | apps/supabase/supabase/config.toml | `additional_redirect_urls = [` |
| 90 | backend/authentication | fact | `hooks.server.ts` is a session gate, not a role gate | apps/frontend/src/hooks.server.ts | `This is a session gate, not a role gate.` |
| 91 | backend/authentication | flow | A user without a session is redirected away from `(protected)` routes | apps/frontend/src/hooks.server.ts | `if (!session && isProtectedRoute(routeId)) {` |
| 92 | backend/authentication | fact | Scopes are global, account, project and entity | apps/supabase/supabase/schema/000-enums.sql | `CREATE TYPE public.grant_scope_type AS ENUM('global', 'account', 'project', 'entity');` |
| 93 | backend/authentication | fact | Roles are admin and editor | apps/supabase/supabase/schema/000-enums.sql | `CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor');` |
| 94 | backend/authentication | fact | A user's grants are deleted with the user | apps/supabase/supabase/schema/300-auth-tables.sql | `user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,` |
| 95 | backend/authentication | fact | `target_type` is set exactly when the scope is entity | apps/supabase/supabase/schema/300-auth-tables.sql | `CONSTRAINT grants_entity_scope_target_type_check CHECK ((target_type IS NOT NULL) = (scope = 'entity'))` |
| 96 | backend/authentication | fact | `target_id` is null exactly for a global grant | apps/supabase/supabase/schema/300-auth-tables.sql | `CONSTRAINT grants_target_id_scope_check CHECK ((target_id IS NULL) = (scope = 'global'))` |
| 97 | backend/authentication | fact | The four entity types | apps/supabase/supabase/schema/301-auth-functions.sql | `WHEN 'alliance' THEN EXISTS` |
| 98 | backend/authentication | fact | A grant is deleted with its target | apps/supabase/supabase/schema/300-auth-tables.sql | `cleanup_grants_on_delete: a grant does not outlive its target` |
| 99 | backend/authentication | fact | anon and authenticated have no access to `public.grants` | apps/supabase/supabase/schema/300-auth-tables.sql | `REVOKE ALL ON TABLE public.grants` |
| 100 | backend/authentication | fact | The service role manages grants | apps/supabase/supabase/schema/300-auth-tables.sql | `CREATE POLICY "service_role_manage_grants" ON public.grants FOR ALL TO service_role USING (true)` |
| 101 | backend/authentication | fact | `seed.sql` writes grants, as the service role | apps/supabase/supabase/seed.sql | `Seed data runs as service_role which bypasses RLS` |
| 102 | backend/authentication | fact | `seed.sql` writes the seeded users' grants | apps/supabase/supabase/seed.sql | `ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING;` |
| 103 | backend/authentication | fact | The Edge Functions write grants | apps/supabase/supabase/functions/invite-candidate/entityGrant.ts | `const { error } = await client.from('grants').insert({` |
| 104 | backend/authentication | fact | The E2E test harness writes grants | tests/tests/utils/supabaseAdminClient.ts | `await this.client.from('grants').insert({` |
| 105 | backend/authentication | fact | `grant_role_permissions` is the only place the matrix is written | apps/supabase/supabase/schema/301-auth-functions.sql | `This is the only function body that holds the matrix` |
| 106 | backend/authentication | fact | Permissions are the `public.grant_permission` enum | apps/supabase/supabase/schema/000-enums.sql | `CREATE TYPE public.grant_permission AS ENUM(` |
| 107 | backend/authentication | fact | Global admin: every permission | apps/supabase/supabase/schema/301-auth-functions.sql | `-- Root: every verb.` |
| 108 | backend/authentication | fact | Account admin: every permission within the account | apps/supabase/supabase/schema/301-auth-functions.sql | `-- Account: every verb, within the account.` |
| 109 | backend/authentication | fact | Project admin: every permission except the three account ones | apps/supabase/supabase/schema/301-auth-functions.sql | `-- ProjAdmin: every verb but the three account.* verbs.` |
| 110 | backend/authentication | fact | Project editor: project admin minus three permissions | apps/supabase/supabase/schema/301-auth-functions.sql | `-- ProjEditor: ProjAdmin minus project.manage_editors, project.edit_project_settings and nomination.confirm` |
| 111 | backend/authentication | fact | Organization editor permissions | apps/supabase/supabase/schema/301-auth-functions.sql | `WHEN (p_scope, p_role, p_target_type) = ('entity', 'editor', 'organization') THEN ARRAY[` |
| 112 | backend/authentication | fact | Organization editor alone holds `entity.invite_children` | apps/supabase/supabase/schema/301-auth-functions.sql | `plus entity.invite_children, which only this role holds` |
| 113 | backend/authentication | fact | Candidate, faction and alliance editor permissions | apps/supabase/supabase/schema/301-auth-functions.sql | `AND p_target_type IN ('candidate', 'faction', 'alliance') THEN ARRAY[` |
| 114 | backend/authentication | fact | Any other combination gives no permission | apps/supabase/supabase/schema/301-auth-functions.sql | `-- Everything else, including global+editor, account+editor and entity+admin: the empty set.` |
| 115 | backend/authentication | flow | The hook runs on every token issue and refresh | apps/supabase/supabase/schema/301-auth-functions.sql | `called by Supabase Auth on every token refresh/issue` |
| 116 | backend/authentication | fact | The claim holds scope, target_type, target_id and role per grant | apps/supabase/supabase/schema/301-auth-functions.sql | `'target_type', g.target_type::text,` |
| 117 | backend/authentication | fact | A user with no grants gets an empty array | apps/supabase/supabase/schema/301-auth-functions.sql | `COALESCE gives a user with no grant rows an empty array` |
| 118 | backend/authentication | fact | The hook is enabled in config.toml | apps/supabase/supabase/config.toml | `[auth.hook.custom_access_token]` |
| 119 | backend/authentication | fact | The hook URI | apps/supabase/supabase/config.toml | `uri = "pg-functions://postgres/public/custom_access_token_hook"` |
| 120 | backend/authentication | fact | Without the hook no token carries authority | apps/supabase/supabase/schema/300-auth-tables.sql | `Without it every token is issued with no authority` |
| 121 | backend/authentication | fact | A user with no grants can do nothing | apps/supabase/supabase/seed.sql | `so an identity with no grant row can do nothing` |
| 122 | backend/authentication | fact | `user_can` signature | apps/supabase/supabase/schema/301-auth-functions.sql | `CREATE OR REPLACE FUNCTION public.user_can (` |
| 123 | backend/authentication | fact | `user_can` reads only the caller's JWT grants claim | apps/supabase/supabase/schema/301-auth-functions.sql | `It reads only the caller's JWT` |
| 124 | backend/authentication | fact | A grant answers yes on verb and reach | apps/supabase/supabase/schema/301-auth-functions.sql | `-- Half 2: reach. Downward-or-equal from the grant's own target` |
| 125 | backend/authentication | fact | An account grant reaches the account's projects | apps/supabase/supabase/schema/301-auth-functions.sql | `IF v_account_id IS NOT NULL AND v_account_id = g_target_id THEN RETURN true; END IF;` |
| 126 | backend/authentication | fact | A project grant reaches the project's entities | apps/supabase/supabase/schema/301-auth-functions.sql | `IF v_project_id IS NOT NULL AND v_project_id = g_target_id THEN RETURN true; END IF;` |
| 127 | backend/authentication | fact | An entity grant reaches that entity | apps/supabase/supabase/schema/301-auth-functions.sql | `Reach is equality with the granted entity, type and id both` |
| 128 | backend/authentication | fact | Exception 1: `project.read_structure` on the entity's project | apps/supabase/supabase/schema/301-auth-functions.sql | `NAMED BRANCH 1, the project-read branch` |
| 129 | backend/authentication | fact | Exception 2: `nomination.read` on child nominees | apps/supabase/supabase/schema/301-auth-functions.sql | `NAMED BRANCH 2, the child-nominee branch` |
| 130 | backend/authentication | fact | At entity scope the object is type and id together | apps/supabase/supabase/schema/301-auth-functions.sql | `so an entity-scope question without a type denies.` |
| 131 | backend/authentication | fact | The editor grant is the only link from an auth user to the entity | apps/supabase/supabase/functions/identity-callback/candidateRecord.ts | `grant is the only link from an auth user to the candidate it edits` |
| 132 | backend/authentication | fact | The seeded candidate is linked to its user by the editor grant only | apps/supabase/supabase/seed.sql | `Test candidate record, linked to the test candidate user by the editor grant written below` |
| 133 | backend/authentication | fact | `get_candidate_user_data(p_project_id, p_entity_type)` | apps/supabase/supabase/schema/503-entity-rpcs.sql | `CREATE OR REPLACE FUNCTION public.get_candidate_user_data (` |
| 134 | backend/authentication | flow | It resolves the entity through `private.caller_entity_ids` | apps/supabase/supabase/schema/503-entity-rpcs.sql | `v_entity_ids := ARRAY (SELECT private.caller_entity_ids (p_project_id, p_entity_type));` |
| 135 | backend/authentication | fact | `caller_entity_ids` reads the table, not the token | apps/supabase/supabase/schema/301-auth-functions.sql | `It reads the table rather than the caller's token` |
| 136 | backend/authentication | fact | Only the editor grant makes the user the entity; admins resolve to no row | apps/supabase/supabase/schema/503-entity-rpcs.sql | `only the editor grant makes the caller that entity.` |
| 137 | backend/authentication | flow | More than one editor grant raises with hint `ERR_ENTITY_IDENTITY_AMBIGUOUS` | apps/supabase/supabase/schema/503-entity-rpcs.sql | `HINT = 'ERR_ENTITY_IDENTITY_AMBIGUOUS'` |
| 138 | backend/authentication | fact | A candidate has at most one editor | apps/supabase/supabase/schema/300-auth-tables.sql | `CREATE UNIQUE INDEX idx_grants_one_candidate_editor ON public.grants (target_id)` |
| 139 | backend/authentication | fact | An organization may have several editors | apps/supabase/supabase/schema/300-auth-tables.sql | `Organizations admit several editors` |
| 140 | backend/authentication | flow | The data writer calls `get_candidate_user_data` with the deployment's project id | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `.rpc('get_candidate_user_data', { p_project_id: this.projectId, p_entity_type: 'candidate' })` |
| 141 | backend/authentication | fact | RLS policies cover every public table, per operation | apps/supabase/supabase/schema/302-rls.sql | `Row Level Security: per-operation access policies for every public table.` |
| 142 | backend/authentication | fact | Anonymous visibility needs an open project, `confirmed` and a confirmed nomination | apps/supabase/supabase/schema/302-rls.sql | `An entity row is publicly visible when project_open_for_voters` |
| 143 | backend/authentication | fact | A candidate must also have accepted the terms of use | apps/supabase/supabase/schema/302-rls.sql | `AND terms_of_use_accepted IS NOT NULL` |
| 144 | backend/authentication | fact | `entity_update_own_candidates` lets the editor update its own row | apps/supabase/supabase/schema/302-rls.sql | `CREATE POLICY "entity_update_own_candidates" ON public.candidates` |
| 145 | backend/authentication | fact | Project admins and editors write entities with `project.edit_entities` | apps/supabase/supabase/schema/302-rls.sql | `user_can ('project', project_id, 'project.edit_entities')` |
| 146 | backend/authentication | fact | A policy cannot admit a row while withholding a column | apps/supabase/supabase/schema/302-rls.sql | `because row-level security cannot admit a row while withholding a column` |
| 147 | backend/authentication | fact | Updatable candidate columns | apps/supabase/supabase/schema/303-column-grants.sql | `short_name, info, color, image, subtype, custom_data, first_name, last_name, answers, terms_of_use_accepted, confirmed` |
| 148 | backend/authentication | fact | Table-level UPDATE is revoked, then granted on allowed columns | apps/supabase/supabase/schema/303-column-grants.sql | `REVOKE table-level UPDATE, then GRANT UPDATE only on allowed columns.` |
| 149 | backend/authentication | fact | `external_id` is protected | apps/supabase/supabase/schema/303-column-grants.sql | `- external_id - the import identity, owned by bulk_import` |
| 150 | backend/authentication | fact | `sort_order` is protected | apps/supabase/supabase/schema/303-column-grants.sql | `- sort_order - presentation order, admin-controlled` |
| 151 | backend/authentication | fact | State-dependent rules live in `enforce_entity_immutability()` | apps/supabase/supabase/schema/303-column-grants.sql | `enforce_entity_immutability()` |
| 152 | backend/authentication | fact | Bucket `public-assets` is public | apps/supabase/supabase/config.toml | `[storage.buckets.public-assets]` |
| 153 | backend/authentication | fact | Bucket `private-assets` exists | apps/supabase/supabase/config.toml | `[storage.buckets.private-assets]` |
| 154 | backend/authentication | fact | Entity object path format | apps/supabase/supabase/schema/400-storage.sql | `Path format: {project_id}/{entity_type}/{entity_id}/filename.ext` |
| 155 | backend/authentication | fact | Anonymous reads of `public-assets` follow `storage_path_is_public()` | apps/supabase/supabase/schema/400-storage.sql | `CREATE POLICY "anon_select_public_assets" ON storage.objects FOR` |
| 156 | backend/authentication | fact | The service-role key must never reach a browser | .env.example | `and this key must never reach a` |
| 157 | backend/authentication | fact | Nothing under `apps/frontend/src` reads the service-role key | .env.example | `reads it; only local tooling and the test harness do.` |
| 158 | backend/authentication | env | The Edge runtime sets `SUPABASE_SERVICE_ROLE_KEY` automatically | apps/supabase/supabase/functions/.env.example | `injects both automatically` |
| 159 | backend/authentication | flow | The functions create the service-role client only after their checks | apps/supabase/supabase/functions/invite-candidate/index.ts | `const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);` |
| 160 | backend/authentication | env | `yarn db:seed` requires `SUPABASE_SERVICE_ROLE_KEY` | .env.example | `SUPABASE_SERVICE_ROLE_KEY env var is required but not set.` |
| 161 | backend/authentication | env | The E2E harness requires `SUPABASE_SERVICE_ROLE_KEY` | .env.example | `tests/scripts/e2e-run.sh` |
| 162 | backend/authentication | fact | Only the service role and postgres can read `storage_config` | apps/supabase/supabase/schema/400-storage.sql | `Only service_role and postgres can access storage_config` |
| 163 | backend/authentication | fact | The cleanup triggers read the Storage API URL and key from `storage_config` | apps/supabase/supabase/schema/400-storage.sql | `The pg_net cleanup triggers read both to call the Storage API.` |
| 164 | backend/edge-functions | path | `identity-callback` index | apps/supabase/supabase/functions/identity-callback/index.ts | - |
| 165 | backend/edge-functions | path | `invite-candidate` index | apps/supabase/supabase/functions/invite-candidate/index.ts | - |
| 166 | backend/edge-functions | path | `send-email` index | apps/supabase/supabase/functions/send-email/index.ts | - |
| 167 | backend/edge-functions | flow | The preregister route invokes `identity-callback` | apps/frontend/src/routes/api/candidate/preregister/+server.ts | `await locals.supabase.functions.invoke('identity-callback', {` |
| 168 | backend/edge-functions | flow | The data writer's pre-registration method invokes `invite-candidate` | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `await this.supabase.functions.invoke('invite-candidate', {` |
| 169 | backend/edge-functions | flow | The admin writer's `sendEmail` invokes `send-email` | apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts | `await this.supabase.functions.invoke('send-email', {` |
| 170 | backend/edge-functions | flow | `invite-candidate` asks `project.edit_entities` on the project | apps/supabase/supabase/functions/invite-candidate/index.ts | `await callerMayOnProject(callerClient, projectId, 'project.edit_entities');` |
| 171 | backend/edge-functions | flow | `send-email` asks `project.edit_entities` on the project | apps/supabase/supabase/functions/send-email/index.ts | `await callerMayOnProject(callerClient, project_id, 'project.edit_entities');` |
| 172 | backend/edge-functions | fact | Each function directory deploys on its own | apps/supabase/supabase/functions/identity-callback/envConfig.ts | `Supabase treats each top-level function directory as its own deployment unit` |
| 173 | backend/edge-functions | command | `assert:edge-env-defaults` holds envConfig, jwtSegment and callerAuthority identical | scripts/assert-edge-env-defaults.mjs | `const DUPLICATED_MODULES = ['envConfig.ts', 'jwtSegment.ts', 'callerAuthority.ts'];` |
| 174 | backend/edge-functions | command | `yarn lint:check` runs `assert:edge-env-defaults` | package.json | `yarn assert:edge-env-defaults &&` |
| 175 | backend/edge-functions | fact | `requireEnv` treats unset and empty alike | apps/supabase/supabase/functions/identity-callback/envConfig.ts | `An absent value and an empty string are both treated as unconfigured` |
| 176 | backend/edge-functions | fact | A configuration error answers 500 with a fixed message | apps/supabase/supabase/functions/identity-callback/index.ts | `return new Response(JSON.stringify({ error: 'Internal server error' }), {` |
| 177 | backend/edge-functions | fact | The variable name appears only in the log | apps/supabase/supabase/functions/.env.example | `The variable name appears` |
| 178 | backend/edge-functions | env | The runtime injects `SUPABASE_URL` and `SUPABASE_ANON_KEY` | .env.example | `into deployed functions automatically` |
| 179 | backend/edge-functions | env | `IDENTITY_PROVIDER_TYPE` | apps/supabase/supabase/functions/identity-callback/index.ts | `requireEnv('IDENTITY_PROVIDER_TYPE', Deno.env.get('IDENTITY_PROVIDER_TYPE'))` |
| 180 | backend/edge-functions | env | `IDENTITY_PROVIDER_DECRYPTION_JWKS` | apps/supabase/supabase/functions/identity-callback/index.ts | `requireEnv('IDENTITY_PROVIDER_DECRYPTION_JWKS'` |
| 181 | backend/edge-functions | env | `IDENTITY_PROVIDER_JWKS_URI` | apps/supabase/supabase/functions/identity-callback/index.ts | `requireEnv('IDENTITY_PROVIDER_JWKS_URI'` |
| 182 | backend/edge-functions | env | `IDENTITY_PROVIDER_CLIENT_ID` | apps/supabase/supabase/functions/identity-callback/index.ts | `Deno.env.get('IDENTITY_PROVIDER_CLIENT_ID')` |
| 183 | backend/edge-functions | env | `IDENTITY_PROVIDER_ISSUER` | apps/supabase/supabase/functions/identity-callback/index.ts | `Deno.env.get('IDENTITY_PROVIDER_ISSUER')` |
| 184 | backend/edge-functions | env | `PUBLIC_PROJECT_ID` read by `identity-callback` | apps/supabase/supabase/functions/identity-callback/index.ts | `requireEnv('PUBLIC_PROJECT_ID', Deno.env.get('PUBLIC_PROJECT_ID')?.trim())` |
| 185 | backend/edge-functions | env | `PUBLIC_PROJECT_ID` read by `send-email` | apps/supabase/supabase/functions/send-email/index.ts | `const configuredProjectId = requireEnv('PUBLIC_PROJECT_ID', Deno.env.get('PUBLIC_PROJECT_ID')?.trim());` |
| 186 | backend/edge-functions | env | `SITE_URL` read by `identity-callback` | apps/supabase/supabase/functions/identity-callback/index.ts | `const redirectSiteUrl = requireEnv('SITE_URL', Deno.env.get('SITE_URL'));` |
| 187 | backend/edge-functions | env | `SITE_URL` read by `invite-candidate` | apps/supabase/supabase/functions/invite-candidate/index.ts | `const siteUrl = requireEnv('SITE_URL', Deno.env.get('SITE_URL'));` |
| 188 | backend/edge-functions | env | `SMTP_HOST` required | apps/supabase/supabase/functions/send-email/index.ts | `requireEnv('SMTP_HOST', Deno.env.get('SMTP_HOST'))` |
| 189 | backend/edge-functions | env | `SMTP_PORT` required | apps/supabase/supabase/functions/send-email/index.ts | `requireEnv('SMTP_PORT', Deno.env.get('SMTP_PORT'))` |
| 190 | backend/edge-functions | env | `SMTP_FROM` required | apps/supabase/supabase/functions/send-email/index.ts | `const senderAddress = requireEnv('SMTP_FROM', Deno.env.get('SMTP_FROM'));` |
| 191 | backend/edge-functions | env | `SMTP_USER` optional | apps/supabase/supabase/functions/send-email/index.ts | `const smtpUser = Deno.env.get('SMTP_USER');` |
| 192 | backend/edge-functions | env | `SMTP_PASS` optional | apps/supabase/supabase/functions/send-email/index.ts | `const smtpPass = Deno.env.get('SMTP_PASS');` |
| 193 | backend/edge-functions | command | Copy the function env template | apps/supabase/supabase/functions/.env.example | `cp apps/supabase/supabase/functions/.env.example apps/supabase/supabase/functions/.env` |
| 194 | backend/edge-functions | fact | The local Edge runtime does not read the root `.env` | apps/supabase/supabase/functions/.env.example | `NOT inherit the repo-root` |
| 195 | backend/edge-functions | command | Restart the stack after editing the env file | apps/supabase/supabase/functions/.env.example | `yarn db:stop && yarn db:start` |
| 196 | backend/edge-functions | env | `config.toml` passes `PUBLIC_PROJECT_ID` under `[edge_runtime.secrets]` | apps/supabase/supabase/config.toml | `PUBLIC_PROJECT_ID = "env(PUBLIC_PROJECT_ID)"` |
| 197 | backend/edge-functions | fact | Four variables exist twice and must agree | .env.example | `Four variables exist TWICE, once per runtime` |
| 198 | backend/edge-functions | env | Twin `SUPABASE_URL` | .env.example | `SUPABASE_URL=http://127.0.0.1:54321` |
| 199 | backend/edge-functions | env | Twin `SUPABASE_ANON_KEY` | .env.example | `SUPABASE_ANON_KEY=<your-supabase-anon-key>` |
| 200 | backend/edge-functions | env | Twin `IDENTITY_PROVIDER_CLIENT_ID` | .env.example | `IDENTITY_PROVIDER_CLIENT_ID=<provider-client-id>` |
| 201 | backend/edge-functions | env | Twin `IDENTITY_PROVIDER_TYPE` | .env.example | `IDENTITY_PROVIDER_TYPE=signicat-ftn` |
| 202 | backend/edge-functions | command | `yarn check:env-local` compares the twins and checks the required set | package.json | `"check:env-local": "yarn check:env-pairs-agree .env --deno-file apps/supabase/supabase/functions/.env --require-both && yarn assert:edge-function-env apps/supabase/supabase/functions/.env"` |
| 203 | backend/edge-functions | fact | `assert:edge-function-env` checks the required variables are declared | scripts/assert-edge-function-env.mjs | `Assert that every environment variable the Edge Functions REQUIRE is declared` |
| 204 | backend/edge-functions | command | The functions start with `yarn db:start` | apps/supabase/supabase/config.toml | `[edge_runtime]` |
| 205 | backend/edge-functions | fact | Functions are served under `/functions/v1/<name>` | apps/supabase/supabase/functions/identity-callback/index.ts | `POST /functions/v1/identity-callback` |
| 206 | backend/edge-functions | fact | In production the variables are Supabase secrets | apps/supabase/supabase/functions/identity-callback/index.ts | `Environment variables (set via Supabase secrets):` |
| 207 | backend/edge-functions | fact | Providers are `signicat-ftn` and `idura-ftn` | apps/supabase/supabase/functions/identity-callback/index.ts | `one of 'signicat-ftn' or 'idura-ftn'` |
| 208 | backend/edge-functions | flow | A body `project_id` is accepted only when it names the configured project | apps/supabase/supabase/functions/identity-callback/index.ts | `is honoured only when it names that same project` |
| 209 | backend/edge-functions | flow | A JWE token is decrypted first | apps/supabase/supabase/functions/identity-callback/index.ts | `async function decryptJweToken(jweToken: string): Promise<string> {` |
| 210 | backend/edge-functions | flow | The signature is verified with audience and issuer bound | apps/supabase/supabase/functions/identity-callback/index.ts | `await jose.jwtVerify(jwt, jose.createRemoteJWKSet(new URL(jwksUri)), { audience, issuer });` |
| 211 | backend/edge-functions | flow | Claims are read with the provider's claim mapping | apps/supabase/supabase/functions/identity-callback/index.ts | `claimResult = extractIdentityClaims(payload, config);` |
| 212 | backend/edge-functions | flow | The auth user is found by `app_metadata.identity_match_value` | apps/supabase/supabase/functions/identity-callback/index.ts | `u.app_metadata?.identity_match_value === identityMatchValue` |
| 213 | backend/edge-functions | flow | A new user gets a placeholder email address | apps/supabase/supabase/functions/identity-callback/index.ts | `@bank-auth.placeholder` |
| 214 | backend/edge-functions | flow | The candidate is found through the user's grants in the configured project | apps/supabase/supabase/functions/identity-callback/index.ts | `await findExistingCandidate(supabaseAdmin, { projectId, authUserId: userId });` |
| 215 | backend/edge-functions | flow | The lookup reads candidate editor grants | apps/supabase/supabase/functions/identity-callback/candidateRecord.ts | `.eq('target_type', 'candidate')` |
| 216 | backend/edge-functions | flow | A new candidate is created confirmed | apps/supabase/supabase/functions/identity-callback/index.ts | `The row is written CONFIRMED` |
| 217 | backend/edge-functions | flow | The grant write is idempotent on the grant's own key | apps/supabase/supabase/functions/identity-callback/entityGrant.ts | `const IDEMPOTENT_GRANT_KEY = 'grants_user_scope_target_role_key';` |
| 218 | backend/edge-functions | flow | A failed grant write deletes a newly created candidate | apps/supabase/supabase/functions/identity-callback/index.ts | `await deleteCandidate(supabaseAdmin, { projectId, candidateId })` |
| 219 | backend/edge-functions | flow | It returns a one-time (magic) login link | apps/supabase/supabase/functions/identity-callback/index.ts | `type: 'magiclink',` |
| 220 | backend/edge-functions | flow | The preregister route exchanges the link token with `verifyOtp` | apps/frontend/src/routes/api/candidate/preregister/+server.ts | `const { error: verifyError } = await locals.supabase.auth.verifyOtp({` |
| 221 | backend/edge-functions | fact | A rejected token answers 401 | apps/supabase/supabase/functions/identity-callback/index.ts | `JSON.stringify({ error: 'Token verification failed' })` |
| 222 | backend/edge-functions | flow | `invite-candidate` body fields | apps/supabase/supabase/functions/invite-candidate/index.ts | `const { firstName, lastName, email, projectId } = body as {` |
| 223 | backend/edge-functions | flow | The caller's token is verified with Supabase Auth | apps/supabase/supabase/functions/invite-candidate/index.ts | `} = await callerClient.auth.getUser();` |
| 224 | backend/edge-functions | flow | A caller without the permission gets 403 | apps/supabase/supabase/functions/invite-candidate/index.ts | `'Forbidden: caller may not create candidates in this project'` |
| 225 | backend/edge-functions | flow | The candidate is inserted with the service role | apps/supabase/supabase/functions/invite-candidate/index.ts | `const candidateInsert: Record<string, unknown> = {` |
| 226 | backend/edge-functions | flow | The invitation is sent with `inviteUserByEmail` | apps/supabase/supabase/functions/invite-candidate/index.ts | `await supabaseAdmin.auth.admin.inviteUserByEmail(email, {` |
| 227 | backend/edge-functions | fact | The invitation redirects to `/candidate/complete-registration` under `SITE_URL` | apps/supabase/supabase/functions/invite-candidate/index.ts | `/candidate/complete-registration` |
| 228 | backend/edge-functions | fact | The frontend has no page at `/candidate/complete-registration` (see Findings F3; the set-password page is `CandAppSetPassword`) | apps/frontend/src/lib/routes | `CandAppSetPassword` |
| 229 | backend/edge-functions | flow | A failed invitation deletes the candidate | apps/supabase/supabase/functions/invite-candidate/index.ts | `// Rollback: delete candidate record since invite failed` |
| 230 | backend/edge-functions | flow | A failed grant write rolls back the user and the candidate | apps/supabase/supabase/functions/invite-candidate/index.ts | `await rollbackInvite(supabaseAdmin, { candidateId: candidate.id, userId: inviteData.user.id });` |
| 231 | backend/edge-functions | fact | Deleting the auth user removes its grants | apps/supabase/supabase/functions/invite-candidate/index.ts | `which also removes any grant row it holds` |
| 232 | backend/edge-functions | fact | Success answers 201 with `candidateId` and `userId` | apps/supabase/supabase/functions/invite-candidate/index.ts | `candidateId: candidate.id,` |
| 233 | backend/edge-functions | flow | `send-email` body fields | apps/supabase/supabase/functions/send-email/index.ts | `const { templates, recipient_user_ids, project_id, from, dry_run } = body;` |
| 234 | backend/edge-functions | flow | `project_id` must be the configured project | apps/supabase/supabase/functions/send-email/index.ts | `project_id.trim().toLowerCase() !== configuredProjectId.toLowerCase()` |
| 235 | backend/edge-functions | flow | A `from` other than `SMTP_FROM` is refused | apps/supabase/supabase/functions/send-email/index.ts | `JSON.stringify({ error: 'Invalid from' })` |
| 236 | backend/edge-functions | flow | It calls `resolve_email_variables` with the service role | apps/supabase/supabase/functions/send-email/index.ts | `await supabaseAdmin.rpc('resolve_email_variables', {` |
| 237 | backend/edge-functions | flow | Template chosen by locale, falling back to the first | apps/supabase/supabase/functions/send-email/index.ts | `Select template matching recipient's preferred locale, fallback to first available` |
| 238 | backend/edge-functions | fact | `{{ key }}` placeholders | apps/supabase/supabase/functions/send-email/templateVars.ts | `const PLACEHOLDER_PATTERN =` |
| 239 | backend/edge-functions | fact | Values are HTML-escaped in the HTML part | apps/supabase/supabase/functions/send-email/index.ts | `The HTML part escapes every substituted value` |
| 240 | backend/edge-functions | flow | `dry_run` returns rendered messages without sending | apps/supabase/supabase/functions/send-email/index.ts | `if (dry_run === true) {` |
| 241 | backend/edge-functions | flow | A result per recipient is returned | apps/supabase/supabase/functions/send-email/index.ts | `status: 'sent'` |
| 242 | backend/edge-functions | command | Helper tests run with `yarn workspace @openvaa/supabase test:unit` | apps/supabase/package.json | `"test:unit": "vitest run"` |
| 243 | backend/edge-functions | fact | Vitest cannot import `index.ts` | apps/supabase/supabase/functions/identity-callback/index.ts | `resolves remote Deno specifiers and cannot be imported by vitest` |
| 244 | backend/edge-functions | fact | `flowConformance.test.ts` checks the source text of `index.ts` | apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts | `const INDEX_SOURCE = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');` |
| 245 | backend/edge-functions | fact | The bank-auth E2E specs are opt-in | tests/playwright.config.ts | `OPT-IN (PLAYWRIGHT_BANK_AUTH)` |
| 246 | backend/edge-functions | fact | The bank-auth E2E specs call `identity-callback` | tests/tests/specs/candidate/candidate-bank-auth.spec.ts | `/functions/v1/identity-callback` |
| 247 | backend/email | flow | The invitation is sent by Supabase Auth through `inviteUserByEmail` | apps/supabase/supabase/functions/invite-candidate/index.ts | `await supabaseAdmin.auth.admin.inviteUserByEmail(email, {` |
| 248 | backend/email | flow | The Candidate App requests recovery with `resetPasswordForEmail` | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `await this.supabase.auth.resetPasswordForEmail(email, {` |
| 249 | backend/email | flow | The recovery redirect target is the auth callback route | apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts | `buildRoute('CandAppAuthCallback')` |
| 250 | backend/email | fact | The Auth template sections are commented out locally | apps/supabase/supabase/config.toml | `# [auth.email.template.invite]` |
| 251 | backend/email | fact | A template is customised with `content_path` | apps/supabase/supabase/config.toml | `# content_path = "./supabase/templates/invite.html"` |
| 252 | backend/email | fact | `enable_confirmations = false` under `[auth.email]` | apps/supabase/supabase/config.toml | `# If enabled, users need to confirm their email address before signing in.` |
| 253 | backend/email | fact | `[auth.email.smtp]` is commented out | apps/supabase/supabase/config.toml | `# [auth.email.smtp]` |
| 254 | backend/email | fact | Locally sent email is caught by the testing server | apps/supabase/supabase/config.toml | `Emails sent with the local dev setup are not actually sent` |
| 255 | backend/email | fact | The testing server is the `[inbucket]` section | apps/supabase/supabase/config.toml | `[inbucket]` |
| 256 | backend/email | path | `resolve_email_variables` lives in 502-email-helpers.sql | apps/supabase/supabase/schema/502-email-helpers.sql | `CREATE OR REPLACE FUNCTION public.resolve_email_variables (` |
| 257 | backend/email | fact | It returns email, preferred locale and variables | apps/supabase/supabase/schema/502-email-helpers.sql | `Returns a row per user with their email, preferred_locale, and a flat JSONB object of resolved variables.` |
| 258 | backend/email | fact | Only the service role may call it | apps/supabase/supabase/schema/502-email-helpers.sql | `EXECUTE ON FUNCTION public.resolve_email_variables (uuid, uuid[], text, text) TO service_role;` |
| 259 | backend/email | fact | It reads `auth.users` | apps/supabase/supabase/schema/502-email-helpers.sql | `SECURITY DEFINER: it reads auth.users` |
| 260 | backend/email | flow | Recipients without a grant in the project are skipped | apps/supabase/supabase/schema/502-email-helpers.sql | `Recipients are bounded to the project` |
| 261 | backend/email | fact | Preferred locale defaults to `en` | apps/supabase/supabase/schema/502-email-helpers.sql | `COALESCE(au.raw_user_meta_data->>'preferred_locale', 'en')` |
| 262 | backend/email | fact | Variables come from candidate or organization grants | apps/supabase/supabase/schema/502-email-helpers.sql | `AND g.target_type IN ('candidate', 'organization')` |
| 263 | backend/email | fact | `candidate.first_name` | apps/supabase/supabase/schema/502-email-helpers.sql | `'candidate.first_name', c_first_name,` |
| 264 | backend/email | fact | `candidate.last_name` | apps/supabase/supabase/schema/502-email-helpers.sql | `'candidate.last_name', c_last_name` |
| 265 | backend/email | fact | `organization.name` | apps/supabase/supabase/schema/502-email-helpers.sql | `jsonb_build_object('organization.name', org_name)` |
| 266 | backend/email | fact | For a candidate, the organization is the one on the parent nomination | apps/supabase/supabase/schema/502-email-helpers.sql | `The organization is the one on the parent nomination.` |
| 267 | backend/email | fact | `nomination.constituency.name` | apps/supabase/supabase/schema/502-email-helpers.sql | `jsonb_build_object('nomination.constituency.name', nom_constituency_name)` |
| 268 | backend/email | fact | `nomination.election.name` | apps/supabase/supabase/schema/502-email-helpers.sql | `jsonb_build_object('nomination.election.name', nom_election_name)` |
| 269 | backend/email | fact | One nomination is used when there are several | apps/supabase/supabase/schema/502-email-helpers.sql | `from the first nomination found for this candidate` |
| 270 | backend/email | fact | A placeholder without a value is left as written | apps/supabase/supabase/functions/send-email/templateVars.ts | `leaves its placeholder in the output exactly as written` |
| 271 | backend/email | env | `SMTP_HOST` example value | apps/supabase/supabase/functions/.env.example | `SMTP_HOST=inbucket` |
| 272 | backend/email | env | `SMTP_PORT` example value | apps/supabase/supabase/functions/.env.example | `SMTP_PORT=2500` |
| 273 | backend/email | env | `SMTP_FROM` example value | apps/supabase/supabase/functions/.env.example | `SMTP_FROM=noreply@openvaa.org` |
| 274 | backend/email | env | `SMTP_FROM` is the sender of every message | apps/supabase/supabase/functions/send-email/index.ts | `from: senderAddress,` |
| 275 | backend/email | env | `SMTP_USER` and `SMTP_PASS` are optional | apps/supabase/supabase/functions/send-email/index.ts | `These two are genuinely optional and carry no default` |
| 276 | backend/email | fact | Without credentials the certificate is not verified | apps/supabase/supabase/functions/send-email/index.ts | `transportConfig.tls = { rejectUnauthorized: false };` |
| 277 | backend/email | fact | Testing server web interface port 54324 | apps/supabase/supabase/config.toml | `port = 54324` |
| 278 | backend/email | fact | Local services are on 127.0.0.1 | apps/supabase/supabase/config.toml | `api_url = "http://127.0.0.1"` |
<!-- claims-continue -->

## Findings for todos

| # | Finding | Evidence (anchor file: anchor) | Disposition |
| --- | --- | --- | --- |
| F1 | `apps/supabase/README.md` § Tests says "11 pgTAP files" and runs them with `npx supabase test db`; the tree has 36 files under `tests/database/` and the workspace script is `test:db`. Its § "What `yarn db:lint:sql` does" names two `lint-schema.mjs` checks; the script implements three (0013, 0001, 9001). The docs page states the code's version. | `apps/supabase/scripts/lint-schema.mjs`: `9001 Read/write permission separation`; `apps/supabase/package.json`: `"test:db": "supabase test db"` | README drift, for a docs/README pass (168-08 or later); no code change (D-18). |
| F2 | `invite-candidate` and `send-email` have adapter callers but no live UI caller at this HEAD. `invite-candidate` is invoked only by `SupabaseDataWriter._preregister`, reached through `preregisterWithApiToken`, which no route or component calls (`git grep -n preregisterWithApiToken -- apps` lists only the type, the base class, the writer's unit tests and a docs page). `SupabaseAdminWriter.sendEmail` is called by no route or component either. The Edge Functions page names the adapter methods as the callers, which is what the code shows. | `apps/frontend/src/lib/api/base/universalDataWriter.ts`: `return this._preregister(opts);`; `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts`: `functions.invoke('send-email'` | For 168-06 (Pre-registration and invitation page) and 168-08; whether these are dormant by design or unfinished wiring is UNCONFIRMED. No code change here (D-18). |
| F3 | `invite-candidate` sends the invitation with `redirectTo` = `${SITE_URL}/candidate/complete-registration`, but the frontend has no route at that path (`find apps/frontend/src/routes -name 'complete-registration*'` prints nothing); the auth callback sends `invite` links to `CandAppSetPassword` instead. With Supabase's default invite template the invitee would be redirected to a missing page — this effect is UNCONFIRMED (not run). | `apps/supabase/supabase/functions/invite-candidate/index.ts`: `/candidate/complete-registration`; `apps/frontend/src/routes/api/candidate/auth/callback/+server.ts`: `route: 'CandAppSetPassword'` | Code todo candidate for a code phase (D-18); the Edge Functions page states the path as the code has it and notes that no page exists there. |
| F4 | The auth callback route's docblock says only the hook's client "writes the httpOnly cookies back onto the response", but `createSupabaseCookieAdapter` sets `httpOnly: false` on every auth cookie. The page states `httpOnly: false`. | `apps/frontend/src/routes/api/candidate/auth/callback/+server.ts`: `writes the httpOnly cookies`; `apps/frontend/src/lib/supabase/server.ts`: `httpOnly: false, path: '/'` | Comment drift, for a code-comment pass; no code change here. |
| F5 | `apps/supabase/README.md` § Edge Functions says `invite-candidate` "assigns the `candidate` role"; the function writes an `(entity, candidate, <id>, editor)` grant and the role enum is `admin`/`editor` only. | `apps/supabase/supabase/schema/000-enums.sql`: `CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor');` | README drift, same pass as F1. |
<!-- findings-continue -->

## Sweep exceptions

| Page | Hit | Reason |
| --- | --- | --- |
<!-- sweeps-continue -->
