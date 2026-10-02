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
<!-- claims-continue -->

## Findings for todos

| # | Finding | Evidence (anchor file: anchor) | Disposition |
| --- | --- | --- | --- |
| F1 | `apps/supabase/README.md` § Tests says "11 pgTAP files" and runs them with `npx supabase test db`; the tree has 36 files under `tests/database/` and the workspace script is `test:db`. Its § "What `yarn db:lint:sql` does" names two `lint-schema.mjs` checks; the script implements three (0013, 0001, 9001). The docs page states the code's version. | `apps/supabase/scripts/lint-schema.mjs`: `9001 Read/write permission separation`; `apps/supabase/package.json`: `"test:db": "supabase test db"` | README drift, for a docs/README pass (168-08 or later); no code change (D-18). |
<!-- findings-continue -->

## Sweep exceptions

| Page | Hit | Reason |
| --- | --- | --- |
<!-- sweeps-continue -->
