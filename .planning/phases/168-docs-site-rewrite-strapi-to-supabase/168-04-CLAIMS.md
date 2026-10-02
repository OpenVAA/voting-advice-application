# 168-04 Claims Ledger — Quick start, Architecture, Development, Configuration, Deployment, Troubleshooting

Pages written by plan 168-04, every old page merged into them, and one content-anchored row per command, env name,
file path, port and flow the pages state. `node .planning/phases/168-docs-site-rewrite-strapi-to-supabase/scripts/check-claims.mjs ledger`
re-checks every `## Claims` row with `git grep -F` of the quoted anchor in its anchor file (D-09). Anchors are copied
from code or configuration at the execution HEAD; README and CLAUDE.md prose is never an anchor.

Page keys used in the Claims table (routes under `/developers-guide/`): `quick-start`, `architecture`,
`development/requirements`, `development/running-the-development-environment`, `development/monorepo`,
`development/testing`, `configuration/intro`, `configuration/environmental-variables`, `configuration/static-settings`,
`configuration/app-customization`, `deployment`, `troubleshooting`.

## Page verdicts

| Old route | New route | Verdict | What changed | RQ |
| --- | --- | --- | --- | --- |
| `/developers-guide/quick-start` | `/developers-guide/quick-start` | updated | The Docker Compose run, the swapped ports (app on 1337, backend on 5173) and the Strapi `admin`/`admin` login are replaced by the Supabase-CLI sequence: `yarn install`, the root `.env` from `.env.example` (the preset `PUBLIC_PROJECT_ID`, the local stack's keys from `supabase status -o env`), `yarn dev` (what it starts, the port, `strictPort`), `yarn db:seed:default` / `yarn db:reset-with-data`, and the Studio and email-testing ports. | 0 |
| `/developers-guide/app-and-repo-structure` | redirect stub → `/developers-guide/architecture` | merged → /developers-guide/architecture | Kept: the workspace list (re-derived from the 15 workspace manifests; every entry still exists and none was missing) and its grouping. Changed: directory links use `/tree/main/`, each entry gained a one-line role from its manifest, the LLM group is tied to the Admin app. | 0 |
| `/developers-guide/architecture` | `/developers-guide/architecture` | updated | Added the dependency graph read from the manifests (`core` → `data`/`matching`/`filters` → `app-shared` → `frontend`, plus the LLM, dev-seed and backend edges) and the data flow: `createDataProvider` and the three writer factories over a named Supabase client, RLS and `PUBLIC_PROJECT_ID` scoping, Edge Functions, and the `dataAdapter.type` setting with the unselected `apiRoute` / `local` adapters. Links Data API and adapters for detail. | 0 |
| `/developers-guide/development/requirements` | `/developers-guide/development/requirements` | updated | "Yarn 4", "Docker (unless you plan to run the app outside of Docker)" and "ports 1337, 5173 and 5432" are replaced by: Node per `engines` (and the `preinstall` / `lint:check` check), Yarn per `packageManager` and the committed `yarnPath`, a container runtime for the Supabase CLI, the CLI as a workspace dependency, Playwright browsers for E2E only, and the real ports. No version numbers. | 0 |
| `/developers-guide/development/running-the-development-environment` | `/developers-guide/development/running-the-development-environment` | updated | Banner and the Docker hot-reloading section (a `backend/vaa-strapi` compose file) removed. Now: the `db:*` / `dev:*` script tables from the root manifest, what `yarn dev` runs step by step, running the database, frontend or watcher alone, ports and `FRONTEND_PORT`, `.env` restart, resetting. Kept from the old page: `yarn install`, root `.env` only, `yarn db:stop`, `yarn db:reset`, the Seed data link. | 0 |
| `/developers-guide/development/intro` | redirect stub → `/developers-guide/development/running-the-development-environment` | merged → /developers-guide/development/running-the-development-environment | Its one paragraph (nav title "Docker": run everything in Docker containers with LocalStack, or the frontend/backend separately) is obsolete except the idea of running the whole stack or parts of it, which is the "Running the parts separately" section. | 0 |
| `/developers-guide/backend/running-the-backend-separately` | redirect stub → `/developers-guide/development/running-the-development-environment` | merged → /developers-guide/development/running-the-development-environment | Its Strapi steps (`docker compose … up postgres`, `yarn dev`/`yarn start` of Strapi) become "The database only: `yarn db:start` / `yarn db:stop`". The Node-version and `.env` steps are covered by Requirements and Quick start. | 0 |
| `/developers-guide/backend/preparing-backend-dependencies` | redirect stub → `/developers-guide/development/running-the-development-environment` | merged → /developers-guide/development/running-the-development-environment | Its only still-true point, that a workspace run on its own needs the shared packages built first, is the `yarn build` step of "The frontend only" (and the Module resolution section of Monorepo and Turborepo). The Strapi-specific part (`@openvaa/strapi` needing `@openvaa/app-shared` built) has no equivalent: `@openvaa/supabase` depends on no workspace. | 0 |
| `/developers-guide/development/monorepo` | `/developers-guide/development/monorepo` | updated | Audited against `turbo.json` and the root scripts. Added a Turborepo section (task ordering, caching, `lint:check`). `yarn workspaces foreach -A build` replaced by `yarn build`. The watch claim corrected: `yarn watch:shared` (`turbo watch build` over `packages/*`) rebuilds packages; the claim that the frontend is restarted is dropped (the dev server's restart plugin watches only the root `.env`). Runtime resolution now names the `exports` → `dist/` mechanism and the two source-exporting packages (`dev-seed`, `supabase-types`). Placeholder command reworded to `<workspace-name> <script-name>`. | 0 |
| `/developers-guide/development/testing` | `/developers-guide/development/testing` | updated | Banner and the `GENERATE_MOCK_DATA_ON_RESTART` sentence removed; the "run `yarn build` first" step dropped (turbo's `test:unit` depends on `build`). Added the unit-coverage assertion, per-workspace tests, pgTAP (`test:db`), Edge Function tests, and E2E through `tests/scripts/e2e-run.sh` (`--run-dir`, `--no-db-reset`, `--project`). The old "`yarn dev`, then `yarn test:e2e`" recipe was wrong (a plain `yarn dev` serves the default project and the preflight aborts); it now starts the dev server with the suite's `PUBLIC_PROJECT_ID`. The Playwright-project detail moved to a `tests/README.md` link. | 0 |

## Claims

| # | Page | Kind | Claim | Anchor file | Anchor |
| --- | --- | --- | --- | --- | --- |
| 1 | quick-start | command | `yarn install` installs the Supabase CLI as a dependency of `@openvaa/supabase` | apps/supabase/package.json | `"supabase": "catalog:"` |
| 2 | quick-start | fact | The backend workspace is `@openvaa/supabase` | apps/supabase/package.json | `"name": "@openvaa/supabase"` |
| 3 | quick-start | path | The env template is the root `.env.example` | .env.example | - |
| 4 | quick-start | flow | The frontend reads the repo-root `.env` | apps/frontend/svelte.config.js | `dir: repoRoot` |
| 5 | quick-start | flow | The seed tool reads the repo-root `.env` | packages/dev-seed/src/cli/seed.ts | `process.loadEnvFile(new URL('../../../../.env', import.meta.url).pathname);` |
| 6 | quick-start | flow | The E2E harness (Playwright config) loads `.env` | tests/playwright.config.ts | `dotenv.config();` |
| 7 | quick-start | env | `PUBLIC_PROJECT_ID` is preset to the default project id in the template | .env.example | `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001` |
| 8 | quick-start | fact | `seed.sql` creates the default project with that id | apps/supabase/supabase/seed.sql | `'Default Project',` |
| 9 | quick-start | fact | The default project is created open for voters | apps/supabase/supabase/seed.sql | `open_for_voters` |
| 10 | quick-start | flow | An empty `PUBLIC_PROJECT_ID` makes the adapter throw | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `PUBLIC_PROJECT_ID is required but not set.` |
| 11 | quick-start | flow | A non-UUID `PUBLIC_PROJECT_ID` makes the adapter throw | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `must be a canonical 8-4-4-4-12 hexadecimal uuid` |
| 12 | quick-start | fact | The throw message names the documented default value | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `const DOCUMENTED_DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000001';` |
| 13 | quick-start | env | The anon key is a placeholder in the template | .env.example | `PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>` |
| 14 | quick-start | env | The un-prefixed anon key is a placeholder in the template | .env.example | `SUPABASE_ANON_KEY=<your-supabase-anon-key>` |
| 15 | quick-start | env | The service-role key is a placeholder in the template | .env.example | `SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>` |
| 16 | quick-start | command | `yarn db:start` starts the local stack | package.json | `"db:start": "yarn workspace @openvaa/supabase start"` |
| 17 | quick-start | command | The keys come from `yarn workspace @openvaa/supabase supabase status -o env` | .env.example | `# Get it with: yarn workspace @openvaa/supabase supabase status -o env` |
| 18 | quick-start | flow | `ANON_KEY` from the status output goes into `PUBLIC_SUPABASE_ANON_KEY` | tests/scripts/ci-write-local-keys.sh | `PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY` |
| 19 | quick-start | flow | `ANON_KEY` goes into `SUPABASE_ANON_KEY` too | tests/scripts/ci-write-local-keys.sh | `SUPABASE_ANON_KEY=$ANON_KEY` |
| 20 | quick-start | flow | `SERVICE_ROLE_KEY` goes into `SUPABASE_SERVICE_ROLE_KEY` | tests/scripts/ci-write-local-keys.sh | `SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY` |
| 21 | quick-start | fact | The service-role key bypasses row-level security | .env.example | `BYPASSES ROW-LEVEL SECURITY entirely` |
| 22 | quick-start | fact | Nothing in the frontend reads the service-role key; local tooling does | .env.example | `reads it; only local tooling and the test harness do.` |
| 23 | quick-start | command | `yarn dev` runs `yarn db:start` first, then the concurrent dev processes | package.json | `"dev": "yarn db:start && yarn _dev:concurrent"` |
| 24 | quick-start | command | The concurrent step clears the frontend first | package.json | `"_dev:concurrent": "yarn dev:clean && concurrently` |
| 25 | quick-start | command | `dev:clean` runs the frontend `clean` script | package.json | `"dev:clean": "yarn workspace @openvaa/frontend clean"` |
| 26 | quick-start | fact | `clean` removes `.svelte-kit` and the Vite cache | apps/frontend/package.json | `"clean": "rm -rf .svelte-kit node_modules/.vite"` |
| 27 | quick-start | fact | The two processes are the shared-package watcher and the frontend dev server | package.json | `concurrently -n watch,frontend` |
| 28 | quick-start | command | The watcher rebuilds the packages under `packages/` | package.json | `"watch:shared": "turbo watch build --filter='./packages/*'"` |
| 29 | quick-start | env | The dev server port comes from `FRONTEND_PORT` | apps/frontend/vite.config.ts | `Number(env.FRONTEND_PORT)` |
| 30 | quick-start | env | `FRONTEND_PORT` is 5173 in the template | .env.example | `FRONTEND_PORT=5173` |
| 31 | quick-start | fact | The dev server uses `strictPort` | apps/frontend/vite.config.ts | `strictPort: true` |
| 32 | quick-start | fact | `seed.sql` creates no elections or questions (it inserts accounts, projects, app settings, two auth users, one candidate and grants) | apps/supabase/supabase/seed.sql | `-- Default project for single-tenant deployment` |
| 33 | quick-start | command | `yarn db:seed:default` seeds the `default` template | package.json | `"db:seed:default": "yarn db:seed --template default"` |
| 34 | quick-start | fact | `default` is a built-in dev-seed template | packages/dev-seed/src/templates/index.ts | `default: defaultTemplate,` |
| 35 | quick-start | command | `yarn db:reset-with-data` resets, then seeds the default template | package.json | `"db:reset-with-data": "yarn db:reset && yarn db:seed:default"` |
| 36 | quick-start | flow | A database reset runs `seed.sql` | apps/supabase/supabase/config.toml | `# If enabled, seeds the database after migrations during a db reset.` |
| 37 | quick-start | flow | Seeding needs `SUPABASE_SERVICE_ROLE_KEY` (the writer throws without it) | packages/dev-seed/src/writer.ts | `'SUPABASE_SERVICE_ROLE_KEY env var is required but not set. ' +` |
| 38 | quick-start | fact | `seed.sql` creates the test admin user | apps/supabase/supabase/seed.sql | `'admin@openvaa.test',` |
| 39 | quick-start | fact | `seed.sql` creates the test candidate user | apps/supabase/supabase/seed.sql | `'candidate@openvaa.test',` |
| 40 | quick-start | fact | Supabase Studio is on port 54323 | apps/supabase/supabase/config.toml | `port = 54323` |
| 41 | quick-start | fact | The email testing server is on port 54324 | apps/supabase/supabase/config.toml | `port = 54324` |
| 42 | quick-start | fact | The email testing server catches the stack's email instead of sending it | apps/supabase/supabase/config.toml | `Emails sent with the local dev setup are not actually sent` |
| 43 | architecture | fact | `packages/*` are workspaces | package.json | `"packages/*",` |
| 44 | architecture | fact | `apps/*` are workspaces | package.json | `"apps/*"` |
| 45 | architecture | fact | Workspace `@openvaa/core` | packages/core/package.json | `"name": "@openvaa/core"` |
| 46 | architecture | fact | Workspace `@openvaa/data` | packages/data/package.json | `"name": "@openvaa/data"` |
| 47 | architecture | fact | Workspace `@openvaa/matching` | packages/matching/package.json | `"name": "@openvaa/matching"` |
| 48 | architecture | fact | Workspace `@openvaa/filters` | packages/filters/package.json | `"name": "@openvaa/filters"` |
| 49 | architecture | fact | Workspace `@openvaa/app-shared` | packages/app-shared/package.json | `"name": "@openvaa/app-shared"` |
| 50 | architecture | fact | Workspace `@openvaa/frontend` | apps/frontend/package.json | `"name": "@openvaa/frontend"` |
| 51 | architecture | fact | Workspace `@openvaa/supabase` | apps/supabase/package.json | `"name": "@openvaa/supabase"` |
| 52 | architecture | fact | Workspace `@openvaa/llm` | packages/llm/package.json | `"name": "@openvaa/llm"` |
| 53 | architecture | fact | Workspace `@openvaa/argument-condensation` | packages/argument-condensation/package.json | `"name": "@openvaa/argument-condensation"` |
| 54 | architecture | fact | Workspace `@openvaa/question-info` | packages/question-info/package.json | `"name": "@openvaa/question-info"` |
| 55 | architecture | fact | Workspace `@openvaa/dev-seed` | packages/dev-seed/package.json | `"name": "@openvaa/dev-seed"` |
| 56 | architecture | fact | Workspace `@openvaa/dev-tools` | packages/dev-tools/package.json | `"name": "@openvaa/dev-tools"` |
| 57 | architecture | fact | Workspace `@openvaa/shared-config` | packages/shared-config/package.json | `"name": "@openvaa/shared-config"` |
| 58 | architecture | fact | Workspace `@openvaa/supabase-types` | packages/supabase-types/package.json | `"name": "@openvaa/supabase-types"` |
| 59 | architecture | fact | Workspace `@openvaa/docs` | apps/docs/package.json | `"name": "@openvaa/docs"` |
| 60 | architecture | fact | core: core types, interfaces and utilities | packages/core/package.json | `Core types, interfaces, and utilities` |
| 61 | architecture | fact | data: the data model for elections, candidates, questions and answers | packages/data/package.json | `Universal data model for elections, candidates, questions, and answers` |
| 62 | architecture | fact | matching: algorithms with several distance metrics | packages/matching/package.json | `Generic matching algorithms with multiple distance metrics` |
| 63 | architecture | fact | filters: filtering by properties and answers | packages/filters/package.json | `Entity filtering by properties and answers` |
| 64 | architecture | fact | app-shared: settings and utilities shared by the frontend and the tooling | packages/app-shared/package.json | `Settings and utilities shared between OpenVAA frontend and backend` |
| 65 | architecture | path | The frontend holds the candidate app routes | apps/frontend/src/routes/candidate | - |
| 66 | architecture | path | The frontend holds the admin app routes | apps/frontend/src/routes/admin | - |
| 67 | architecture | path | The backend holds the schema | apps/supabase/supabase/schema | - |
| 68 | architecture | path | The backend holds the migrations | apps/supabase/supabase/migrations | - |
| 69 | architecture | path | The backend holds the pgTAP tests | apps/supabase/supabase/tests/database | - |
| 70 | architecture | path | The backend holds the Edge Functions | apps/supabase/supabase/functions | - |
| 71 | architecture | flow | The Admin app uses `@openvaa/argument-condensation` | apps/frontend/src/lib/server/admin/features/condenseArguments.ts | `import { handleQuestion } from '@openvaa/argument-condensation';` |
| 72 | architecture | flow | The Admin app uses `@openvaa/question-info` | apps/frontend/src/lib/server/admin/features/generateQuestionInfo.ts | `from '@openvaa/question-info';` |
| 73 | architecture | fact | dev-seed: template-driven seed data | packages/dev-seed/package.json | `Template-driven dev data generator` |
| 74 | architecture | fact | dev-tools: key generation, JWKS utilities | packages/dev-tools/package.json | `key generation, JWKS utilities` |
| 75 | architecture | fact | shared-config exports ESLint, Prettier and TypeScript configuration | packages/shared-config/package.json | `"./eslint"` |
| 76 | architecture | fact | supabase-types is generated from the database schema | packages/supabase-types/package.json | `"generate":` |
| 77 | architecture | fact | docs is this site | apps/docs/package.json | `OpenVAA Documentation Site` |
| 78 | architecture | fact | core depends on no other workspace (its manifest lists only `@openvaa/shared-config`, a devDependency) | packages/core/package.json | `"@openvaa/shared-config": "workspace:^"` |
| 79 | architecture | fact | data depends on core | packages/data/package.json | `"@openvaa/core": "workspace:^"` |
| 80 | architecture | fact | matching depends on core | packages/matching/package.json | `"@openvaa/core": "workspace:^"` |
| 81 | architecture | fact | filters depends on core | packages/filters/package.json | `"@openvaa/core": "workspace:^"` |
| 82 | architecture | fact | filters depends on data | packages/filters/package.json | `"@openvaa/data": "workspace:^"` |
| 83 | architecture | fact | app-shared depends on data | packages/app-shared/package.json | `"@openvaa/data": "workspace:^"` |
| 84 | architecture | fact | llm depends on core | packages/llm/package.json | `"@openvaa/core": "workspace:^"` |
| 85 | architecture | fact | llm depends on app-shared | packages/llm/package.json | `"@openvaa/app-shared": "workspace:^"` |
| 86 | architecture | fact | question-info builds on llm | packages/question-info/package.json | `"@openvaa/llm": "workspace:^"` |
| 87 | architecture | fact | argument-condensation builds on llm | packages/argument-condensation/package.json | `"@openvaa/llm": "workspace:^"` |
| 88 | architecture | fact | frontend depends on app-shared | apps/frontend/package.json | `"@openvaa/app-shared": "workspace:^"` |
| 89 | architecture | fact | frontend depends on matching | apps/frontend/package.json | `"@openvaa/matching": "workspace:^"` |
| 90 | architecture | fact | frontend depends on filters | apps/frontend/package.json | `"@openvaa/filters": "workspace:^"` |
| 91 | architecture | fact | frontend depends on the LLM packages | apps/frontend/package.json | `"@openvaa/question-info": "workspace:^"` |
| 92 | architecture | fact | frontend depends on supabase-types | apps/frontend/package.json | `"@openvaa/supabase-types": "workspace:^"` |
| 93 | architecture | fact | dev-seed depends on core | packages/dev-seed/package.json | `"@openvaa/core": "workspace:^"` |
| 94 | architecture | fact | dev-seed depends on matching | packages/dev-seed/package.json | `"@openvaa/matching": "workspace:^"` |
| 95 | architecture | fact | dev-seed depends on app-shared | packages/dev-seed/package.json | `"@openvaa/app-shared": "workspace:^"` |
| 96 | architecture | fact | dev-seed depends on supabase-types | packages/dev-seed/package.json | `"@openvaa/supabase-types": "workspace:^"` |
| 97 | architecture | fact | The backend workspace depends on no other workspace (its manifest has only the `jose`, `supabase` and `vitest` devDependencies) | apps/supabase/package.json | `"jose":` |
| 98 | architecture | command | `yarn db:types` regenerates supabase-types | package.json | `"db:types": "yarn workspace @openvaa/supabase-types generate"` |
| 99 | architecture | flow | The browser client is built from the public Supabase URL and the anon key | apps/frontend/src/lib/supabase/browser.ts | `constants.PUBLIC_SUPABASE_ANON_KEY` |
| 100 | architecture | flow | Reads go through `createDataProvider` | apps/frontend/src/lib/api/dataProvider.ts | `export function createDataProvider(source: AdapterSource): SupabaseDataProvider` |
| 101 | architecture | flow | Client source 1: the request's cookie-bearing client on the server (`locals`) | apps/frontend/src/lib/api/dataProvider.ts | `if ('locals' in source) return { ...locales, fetch: source.fetch, client: source.locals.supabase };` |
| 102 | architecture | flow | Client source 2: a client the caller holds | apps/frontend/src/lib/api/dataProvider.ts | `if ('client' in source) return { ...locales, fetch: source.fetch, client: source.client };` |
| 103 | architecture | flow | Client source 3: the browser tab's single client | apps/frontend/src/lib/api/dataProvider.ts | `if ('browser' in source) return { ...locales, fetch: source.fetch, client: createSupabaseBrowserClient() };` |
| 104 | architecture | flow | Project-scoped queries use the adapter's resolved `PUBLIC_PROJECT_ID` | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `this.#projectId = resolveProjectId(config.projectId);` |
| 105 | architecture | flow | `createDataWriter` returns the data writer | apps/frontend/src/lib/api/dataWriter.ts | `export function createDataWriter(source: AdapterSource): SupabaseDataWriter` |
| 106 | architecture | flow | `createAdminWriter` returns the admin writer | apps/frontend/src/lib/api/adminWriter.ts | `export function createAdminWriter(source: AdapterSource): SupabaseAdminWriter` |
| 107 | architecture | flow | `createFeedbackWriter` returns the feedback writer | apps/frontend/src/lib/api/feedbackWriter.ts | `export function createFeedbackWriter(source: AdapterSource): SupabaseFeedbackWriter` |
| 108 | architecture | path | Edge Function `identity-callback` | apps/supabase/supabase/functions/identity-callback/index.ts | - |
| 109 | architecture | path | Edge Function `invite-candidate` | apps/supabase/supabase/functions/invite-candidate/index.ts | - |
| 110 | architecture | path | Edge Function `send-email` | apps/supabase/supabase/functions/send-email/index.ts | - |
| 111 | architecture | fact | `dataAdapter.type` is `supabase` in the static settings | packages/app-shared/src/settings/staticSettings.ts | `type: 'supabase',` |
| 112 | architecture | fact | An `apiRoute` adapter exists in the tree | apps/frontend/src/lib/api/adapters/apiRoute/apiRouteAdapter.ts | `export function apiRouteAdapterMixin` |
| 113 | architecture | fact | The `local` server adapter is selected only by the `local` adapter type | apps/frontend/src/lib/server/api/dataProvider.ts | `case 'local':` |
| 114 | architecture | env | The `local` server adapter reads JSON files from `LOCAL_DATA_DIR` | apps/frontend/src/lib/server/api/adapters/local/localPaths.ts | `path.join(constants.LOCAL_DATA_DIR,` |
| 115 | development/requirements | fact | The Node range is under `engines` in the root manifest | package.json | `"engines": {` |
| 116 | development/requirements | command | `preinstall` checks the Node version | package.json | `"preinstall": "node scripts/assert-node-engine.mjs"` |
| 117 | development/requirements | flow | A non-zero `preinstall` fails a fresh-clone install; a repeat install over an unchanged tree does not re-run it | scripts/assert-node-engine.mjs | `IS run by this Yarn release` |
| 118 | development/requirements | command | `yarn lint:check` re-checks the Node version on every run | package.json | `yarn assert:node-engine` |
| 119 | development/requirements | fact | The Yarn version is in `packageManager` | package.json | `"packageManager": "yarn@` |
| 120 | development/requirements | fact | The repository ships its Yarn release (`yarnPath`) | .yarnrc.yml | `yarnPath: .yarn/releases/` |
| 121 | development/requirements | fact | The Supabase CLI needs a running container runtime | tests/scripts/e2e-run.sh | `Docker is running.` |
| 122 | development/requirements | fact | The Supabase CLI is a dependency of `@openvaa/supabase` | apps/supabase/package.json | `"supabase": "catalog:"` |
| 123 | development/requirements | command | `yarn playwright install` installs the browsers for E2E | tests/scripts/e2e-run.sh | `Playwright browsers are installed` |
| 124 | development/requirements | fact | Playwright is a root dependency (so `yarn playwright` resolves) | package.json | `"@playwright/test": "catalog:"` |
| 125 | development/requirements | env | `FRONTEND_PORT` is 5173 in the template | .env.example | `FRONTEND_PORT=5173` |
| 126 | development/running-the-development-environment | command | `yarn db:start` = `supabase start` in `@openvaa/supabase` | apps/supabase/package.json | `"start": "supabase start"` |
| 127 | development/running-the-development-environment | command | `yarn db:stop` | package.json | `"db:stop": "yarn workspace @openvaa/supabase stop"` |
| 128 | development/running-the-development-environment | command | `yarn db:status` | package.json | `"db:status": "yarn workspace @openvaa/supabase status"` |
| 129 | development/running-the-development-environment | fact | The status output includes the service-role key | .env.example | `# Get it with: yarn workspace @openvaa/supabase supabase status -o env` |
| 130 | development/running-the-development-environment | command | `yarn db:reset` starts the stack, then resets | package.json | `"db:reset": "yarn db:start && yarn workspace @openvaa/supabase reset"` |
| 131 | development/running-the-development-environment | command | The reset is `supabase db reset` | apps/supabase/package.json | `"reset": "supabase db reset"` |
| 132 | development/running-the-development-environment | flow | The reset runs `seed.sql` | apps/supabase/supabase/config.toml | `seeds the database after migrations during a db reset` |
| 133 | development/running-the-development-environment | command | `yarn db:seed` runs the dev-seed CLI | package.json | `"db:seed": "yarn workspace @openvaa/dev-seed seed"` |
| 134 | development/running-the-development-environment | fact | The seed CLI takes `--template` | packages/dev-seed/src/cli/seed.ts | `template: { type: 'string', short: 't' },` |
| 135 | development/running-the-development-environment | command | `yarn db:seed:default` | package.json | `"db:seed:default": "yarn db:seed --template default"` |
| 136 | development/running-the-development-environment | command | `yarn db:reset-with-data` | package.json | `"db:reset-with-data": "yarn db:reset && yarn db:seed:default"` |
| 137 | development/running-the-development-environment | command | `yarn db:seed:teardown` | package.json | `"db:seed:teardown": "yarn workspace @openvaa/dev-seed seed:teardown"` |
| 138 | development/running-the-development-environment | fact | Teardown deletes by external-id prefix | packages/dev-seed/src/cli/teardown.ts | `const prefix = values.prefix ?? values['external-id-prefix'] ?? 'seed_';` |
| 139 | development/running-the-development-environment | command | `yarn db:types` | package.json | `"db:types": "yarn workspace @openvaa/supabase-types generate"` |
| 140 | development/running-the-development-environment | command | `yarn dev` | package.json | `"dev": "yarn db:start && yarn _dev:concurrent"` |
| 141 | development/running-the-development-environment | command | `yarn dev:clean` | package.json | `"dev:clean": "yarn workspace @openvaa/frontend clean"` |
| 142 | development/running-the-development-environment | fact | `clean` deletes `.svelte-kit` and the Vite cache | apps/frontend/package.json | `"clean": "rm -rf .svelte-kit node_modules/.vite"` |
| 143 | development/running-the-development-environment | command | `yarn dev:reset` | package.json | `"dev:reset": "yarn db:reset && yarn dev"` |
| 144 | development/running-the-development-environment | command | `yarn dev:reset-with-data` | package.json | `"dev:reset-with-data": "yarn db:reset-with-data && yarn dev"` |
| 145 | development/running-the-development-environment | flow | `yarn dev` runs `dev:clean`, then `concurrently` with `watch` and `frontend` | package.json | `"_dev:concurrent": "yarn dev:clean && concurrently -n watch,frontend` |
| 146 | development/running-the-development-environment | fact | `--kill-others-on-fail` | package.json | `--kill-others-on-fail` |
| 147 | development/running-the-development-environment | command | `watch` = `yarn watch:shared` | package.json | `"watch:shared": "turbo watch build --filter='./packages/*'"` |
| 148 | development/running-the-development-environment | command | The frontend dev script is `vite dev` | apps/frontend/package.json | `"dev": "vite dev"` |
| 149 | development/running-the-development-environment | flow | The frontend imports built `dist/` output of the shared packages | packages/core/package.json | `"default": "./dist/index.js"` |
| 150 | development/running-the-development-environment | command | `yarn build` runs the `build` task through Turborepo | package.json | `"build": "turbo run build"` |
| 151 | development/running-the-development-environment | env | `FRONTEND_PORT` sets the port | apps/frontend/vite.config.ts | `Number(env.FRONTEND_PORT)` |
| 152 | development/running-the-development-environment | env | 5173 when unset | apps/frontend/vite.config.ts | `5173,` |
| 153 | development/running-the-development-environment | fact | `strictPort` | apps/frontend/vite.config.ts | `strictPort: true` |
| 154 | development/running-the-development-environment | env | A shell value overrides `.env` | apps/frontend/vite.config.ts | `still overrides a persistent value in the root` |
| 155 | development/running-the-development-environment | fact | Supabase ports are literals in `config.toml` | apps/supabase/supabase/config.toml | `# Every port below is a literal, not an environment lookup.` |
| 156 | development/running-the-development-environment | flow | Editing the root `.env` restarts the dev server | apps/frontend/vite.config.ts | `restart: ['../../.env']` |
| 157 | development/monorepo | fact | Workspaces are `packages/*` and `apps/*` | package.json | `"workspaces": [` |
| 158 | development/monorepo | path | One `yarn.lock` at the root | yarn.lock | - |
| 159 | development/monorepo | command | `yarn workspace @openvaa/app-shared build` | packages/app-shared/package.json | `"build": "tsup && tsc --emitDeclarationOnly --outDir dist"` |
| 160 | development/monorepo | fact | `build` depends on dependencies' build | turbo.json | `"dependsOn": ["^build"],` |
| 161 | development/monorepo | fact | `build` outputs are `build/` and `dist/` | turbo.json | `"outputs": ["build/**", "dist/**"],` |
| 162 | development/monorepo | fact | `test:unit` depends on the workspace's own build and is not cached | turbo.json | `"dependsOn": ["build"],` |
| 163 | development/monorepo | fact | `test:unit` is never cached | turbo.json | `"cache": false` |
| 164 | development/monorepo | fact | `lint` depends on dependencies' lint | turbo.json | `"dependsOn": ["^lint"],` |
| 165 | development/monorepo | command | `yarn typecheck` | package.json | `"typecheck": "turbo run typecheck"` |
| 166 | development/monorepo | command | `yarn lint:check` runs `turbo run lint`, then repository checks including the type checks | package.json | `"lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck` |
| 167 | development/monorepo | command | `yarn watch:shared` | package.json | `"watch:shared": "turbo watch build --filter='./packages/*'"` |
| 168 | development/monorepo | fact | `workspace:^` dependency syntax | packages/data/package.json | `"@openvaa/core": "workspace:^"` |
| 169 | development/monorepo | fact | tsconfig project reference | packages/data/tsconfig.json | `"references": [{ "path": "../core/tsconfig.json" }]` |
| 170 | development/monorepo | fact | core exports `dist/` | packages/core/package.json | `"default": "./dist/index.js"` |
| 171 | development/monorepo | fact | data exports `dist/` | packages/data/package.json | `"default": "./dist/index.js"` |
| 172 | development/monorepo | fact | app-shared exports `dist/` | packages/app-shared/package.json | `"default": "./dist/index.js"` |
| 173 | development/monorepo | fact | dev-seed exports its sources | packages/dev-seed/package.json | `".": "./src/index.ts"` |
| 174 | development/monorepo | fact | dev-seed has no build step | packages/dev-seed/package.json | `"build": "echo 'Nothing to build.'"` |
| 175 | development/monorepo | fact | supabase-types exports its sources and has no build step | packages/supabase-types/package.json | `Raw .ts source` |
| 176 | development/testing | command | `yarn test:unit` runs the coverage assertion, then turbo | package.json | `"test:unit": "yarn assert:unit-coverage && turbo run test:unit"` |
| 177 | development/testing | fact | The assertion checks declared `test:unit` scripts | scripts/assert-unit-test-coverage.mjs | `Check 1 — declared coverage` |
| 178 | development/testing | fact | The assertion checks that turbo runs them | scripts/assert-unit-test-coverage.mjs | `Check 2 — turbo execution` |
| 179 | development/testing | fact | `test:unit` builds the workspace first | turbo.json | `"dependsOn": ["build"],` |
| 180 | development/testing | command | `yarn workspace @openvaa/matching test:unit` | packages/matching/package.json | `"test:unit": "vitest run"` |
| 181 | development/testing | command | `yarn test:unit:watch` runs Vitest over `packages/` | package.json | `NB! Running only tests in /packages` |
| 182 | development/testing | fact | The root Vitest workspace covers `packages/` | vitest.workspace.ts | `'packages/**/vitest.config.ts'` |
| 183 | development/testing | path | pgTAP tests directory | apps/supabase/supabase/tests/database | - |
| 184 | development/testing | command | `yarn workspace @openvaa/supabase test:db` | apps/supabase/package.json | `"test:db": "supabase test db"` |
| 185 | development/testing | fact | Edge Function tests are `supabase/functions/**/*.test.ts` | apps/supabase/vitest.config.ts | `include: ['supabase/functions/**/*.test.ts']` |
| 186 | development/testing | command | `yarn workspace @openvaa/supabase test:unit` (also run by the root `test:unit`) | apps/supabase/package.json | `"test:unit": "vitest run"` |
| 187 | development/testing | fact | The suite's project is `00000000-0000-0000-0000-0000000000e2` | packages/dev-seed/src/supabaseAdminClient.ts | `export const E2E_PROJECT_ID = '00000000-0000-0000-0000-0000000000e2';` |
| 188 | development/testing | fact | The wrapper uses the same project id by default | tests/scripts/e2e-run.sh | `E2E_PROJECT_ID_DEFAULT="00000000-0000-0000-0000-0000000000e2"` |
| 189 | development/testing | command | `--run-dir` is required and receives every artifact | tests/scripts/e2e-run.sh | `Where every artifact for this run lands.` |
| 190 | development/testing | command | `--no-db-reset` skips the reset | tests/scripts/e2e-run.sh | `Skip the database reset` |
| 191 | development/testing | command | `--project` restricts the run | tests/scripts/e2e-run.sh | `--project <name>   OPTIONAL.` |
| 192 | development/testing | flow | The wrapper starts Supabase itself | tests/scripts/e2e-run.sh | `This script starts Supabase itself` |
| 193 | development/testing | flow | The wrapper spawns its own dev server | tests/scripts/e2e-run.sh | `SPAWNS AND OWNS its own dev server` |
| 194 | development/testing | env | The wrapper's default port is 5273 | tests/scripts/e2e-run.sh | `FRONTEND_PORT="${FRONTEND_PORT:-5273}"` |
| 195 | development/testing | path | `tests/e2e-runs/` is gitignored | .gitignore | `tests/e2e-runs/` |
| 196 | development/testing | command | `yarn test:e2e` excludes the probes | package.json | `--grep-invert @probe` |
| 197 | development/testing | command | `yarn test:e2e:probes` | package.json | `"test:e2e:probes": "playwright test -c ./tests/playwright.config.ts --project=_probes"` |
| 198 | development/testing | flow | Preflight clause 1: the served app is this checkout (`/@fs`) | tests/tests/support/preflight.ts | `export const SUCCESS_HEADLINE = 'E2E PREFLIGHT OK';` |
| 199 | development/testing | flow | The preflight runs in Playwright's global setup | tests/playwright.config.ts | `globalSetup: './global-setup.ts',` |
| 200 | development/testing | flow | Preflight clause 2: the served project equals the suite's project | tests/global-setup.ts | `const SERVED_PROJECT_ATTRIBUTE = 'data-project-id';` |
| 201 | development/testing | flow | The suite resolves its project id from `E2E_PROJECT_ID` or the default | tests/global-setup.ts | `resolveE2eProjectId` |

## Findings for todos

| # | Finding | Evidence (anchor file: anchor) | Disposition |
| --- | --- | --- | --- |

## Sweep exceptions

| Page | Hit | Reason |
| --- | --- | --- |
| `development/requirements` | "A container runtime such as Docker" (one line) | The Supabase CLI runs the local Supabase services as containers, so a running container runtime is a requirement; this is the D-21 "Docker for Supabase" case the plan names. |
