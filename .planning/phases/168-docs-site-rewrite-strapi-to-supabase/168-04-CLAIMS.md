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
| `/developers-guide/configuration/intro` | `/developers-guide/configuration/intro` | updated | Retained as the Configuration overview (168-01 decision). "Split into three parts" with four links becomes four layers with one paragraph each: environment variables (root `.env`, functions `.env`), static settings, app settings (`app_settings.settings`, linking 168-06's page) and app customization (`app_settings.customization`). Link texts corrected ("Environment variables", "App settings", "App customization"). | 0 |
| `/developers-guide/configuration/environmental-variables` | `/developers-guide/configuration/environmental-variables` | updated | Banner and the Strapi / LocalStack / SES / S3 / mock-data / disk-cache list removed. Rewritten for the post-167 model: the single repo-root `.env` read by SvelteKit (`kit.env.dir`), Vite, dev-seed and Playwright; the empty `apps/frontend/.env.example`; the separate `functions/.env`; the four twins and `yarn check:env-local`; `PUBLIC_PROJECT_ID` (mandatory, no fallback); the constants-module rule; every variable of the three templates by group, one line each. The `behind_cloudflare` pointer kept, its link fixed (no trailing slash). | 0 |
| `/developers-guide/frontend/environmental-variables` | redirect stub → `/developers-guide/configuration/environmental-variables` | merged → /developers-guide/configuration/environmental-variables | Kept: "variables are read only through `$lib/utils/constants` (public) and `$lib/server/constants` (private) and imported as the `constants` object", re-checked against the two modules (`$env/dynamic/public` / `$env/dynamic/private`; no other module imports `$env/*`). Dropped: the `PUBLIC_BROWSER_BACKEND_URL` example (removed in 167) and the unverified "production compilation intricacies" reason; the example now reads `PUBLIC_PROJECT_ID`. | 0 |
| `/developers-guide/configuration/static-settings` | `/developers-guide/configuration/static-settings` | updated | Audited against `staticSettings.ts` / `.type.ts`. Removed the "planned to be moved to dynamic settings" note (a plan, not code) and the "Candidate App pre-registration" bullet (no such setting in the type). Each remaining group now names its key (`admin.email`, `appVersion`, `dataAdapter` with `pageSize` = `max_rows`, `colors`, `font`, `supportedLocales`, `analytics`) and the rebuild requirement; the type file stays the reference. | 0 |
| `/developers-guide/configuration/app-customization` | `/developers-guide/configuration/app-customization` | updated | Banner and every Strapi step (content type, populate restrictions, `strapiDataProvider`, `StrapiAppCustomizationData`, `dynamic.json` preload) removed. Now: the fields, storage in `app_settings.customization` per project, the `StoredCustomizationSchema` shape, how `_getAppCustomization` validates/localizes/resolves image URLs, the overrides loaded first by the root layout, editing without an Admin-app editor, and the three-step recipe for a new option. | 0 |
| `/developers-guide/deployment` | `/developers-guide/deployment` | updated | Banner, the Costs section (its figures were for the Strapi + Render Postgres + AWS stack; no Supabase-era figure exists in the repo), the AWS/SES/S3 env block, Render Postgres, the Strapi backend service, the Strapi admin/API-token steps, the backend-URL pair and the Strapi build section removed. Now: Render frontend container (`render.example.yaml`, `apps/frontend/Dockerfile`, its env keys, `PUBLIC_PROJECT_ID` to add, service-role key never on the frontend) plus Supabase Cloud (migrations, buckets, access-token hook, auth URLs, SMTP, `max_rows`, account/project rows, `storage_config`, Edge Functions and secrets), the 167 operator note for older Render services, the feedback rate-limit section (kept, re-anchored), and `docker-compose.dev.yml` for a local production build. The custom-domain step kept. | 0 |
| `/developers-guide/troubleshooting` | `/developers-guide/troubleshooting` | updated | Banner, all Docker sections (frozen lockfile, base image, no space left, `extends`), all Strapi sections, the Strapi "Bad Request" registration section and the broken `#docker-error-no-space-left-on-device-…` self-anchor removed. Husky section rewritten for the `prepare: husky` setup; Playwright locale section corrected (locators are mostly test ids; the localisation spec expects `en`/`fi`/`sv`). Added: busy port (`strictPort`), Supabase not starting / ports in use, `PUBLIC_PROJECT_ID` errors, empty app, missing service-role key, Edge Function 500, stale Vite cache (`yarn dev:clean`), resetting, and the E2E preflight failure. | 0 |

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
| 202 | configuration/intro | path | Root env template | .env.example | - |
| 203 | configuration/intro | path | Edge Function env template | apps/supabase/supabase/functions/.env.example | - |
| 204 | configuration/intro | fact | Static settings hold the supported locales | packages/app-shared/src/settings/staticSettings.ts | `supportedLocales: [` |
| 205 | configuration/intro | fact | Static settings hold the colours | packages/app-shared/src/settings/staticSettings.ts | `colors: {` |
| 206 | configuration/intro | fact | Static settings hold the font | packages/app-shared/src/settings/staticSettings.ts | `font: {` |
| 207 | configuration/intro | fact | Static settings hold the data adapter | packages/app-shared/src/settings/staticSettings.ts | `dataAdapter: {` |
| 208 | configuration/intro | fact | Static settings hold analytics | packages/app-shared/src/settings/staticSettings.ts | `analytics: {` |
| 209 | configuration/intro | fact | Static settings hold the admin email | packages/app-shared/src/settings/staticSettings.ts | `admin: {` |
| 210 | configuration/intro | fact | App settings are the per-project `settings` column of `app_settings` | apps/supabase/supabase/schema/106-app-settings.sql | `settings jsonb NOT NULL DEFAULT '{}'::jsonb,` |
| 211 | configuration/intro | flow | Stored settings are merged over the shipped defaults | apps/supabase/supabase/schema/106-app-settings.sql | `the Supabase data provider merges it over the shipped defaults` |
| 212 | configuration/intro | fact | One `app_settings` row per project | apps/supabase/supabase/schema/106-app-settings.sql | `project_id uuid NOT NULL UNIQUE REFERENCES public.projects (id) ON DELETE CASCADE,` |
| 213 | configuration/intro | fact | App customization is the `customization` column of the same table | apps/supabase/supabase/schema/106-app-settings.sql | `customization jsonb DEFAULT '{}'::jsonb,` |
| 214 | configuration/environmental-variables | fact | `.env` files are ignored by Git | .gitignore | `.env.*` |
| 215 | configuration/environmental-variables | fact | `.env.example` templates are not ignored | .gitignore | `!.env.example` |
| 216 | configuration/environmental-variables | flow | SvelteKit's env loader points at the repo root | apps/frontend/svelte.config.js | `dir: repoRoot` |
| 217 | configuration/environmental-variables | fact | Only `PUBLIC_` variables reach the browser | apps/frontend/svelte.config.js | `so pointing the loader at a file full of secrets does not widen what reaches the browser` |
| 218 | configuration/environmental-variables | flow | The Vite config reads `FRONTEND_PORT` from the root file | apps/frontend/vite.config.ts | `const env = loadEnv(mode, repoRoot, 'FRONTEND_PORT');` |
| 219 | configuration/environmental-variables | env | A shell value overrides the file | apps/frontend/vite.config.ts | `still overrides a persistent value in the root` |
| 220 | configuration/environmental-variables | flow | The seed tool loads the root `.env` | packages/dev-seed/src/cli/seed.ts | `process.loadEnvFile(new URL('../../../../.env', import.meta.url).pathname);` |
| 221 | configuration/environmental-variables | flow | The Playwright config loads `.env` | tests/playwright.config.ts | `dotenv.config();` |
| 222 | configuration/environmental-variables | fact | `apps/frontend/.env.example` says an `apps/frontend/.env` is not read | apps/frontend/.env.example | `You do not need this file, and an` |
| 223 | configuration/environmental-variables | flow | The dev server restarts when the root `.env` changes | apps/frontend/vite.config.ts | `restart: ['../../.env']` |
| 224 | configuration/environmental-variables | fact | The local Edge runtime does not read the root `.env` | apps/supabase/supabase/functions/.env.example | `The local Supabase edge runtime does` |
| 225 | configuration/environmental-variables | command | Copy the functions template, then restart the stack | apps/supabase/supabase/functions/.env.example | `cp apps/supabase/supabase/functions/.env.example apps/supabase/supabase/functions/.env` |
| 226 | configuration/environmental-variables | flow | A running Edge runtime keeps its boot environment | apps/supabase/supabase/functions/.env.example | `Then restart the stack so the container picks it up` |
| 227 | configuration/environmental-variables | env | Functions var `IDENTITY_PROVIDER_TYPE` | apps/supabase/supabase/functions/.env.example | `IDENTITY_PROVIDER_TYPE=signicat-ftn` |
| 228 | configuration/environmental-variables | env | Functions var `IDENTITY_PROVIDER_DECRYPTION_JWKS` | apps/supabase/supabase/functions/.env.example | `IDENTITY_PROVIDER_DECRYPTION_JWKS=` |
| 229 | configuration/environmental-variables | env | Functions var `IDENTITY_PROVIDER_JWKS_URI` | apps/supabase/supabase/functions/.env.example | `IDENTITY_PROVIDER_JWKS_URI=` |
| 230 | configuration/environmental-variables | env | Functions var `IDENTITY_PROVIDER_CLIENT_ID` | apps/supabase/supabase/functions/.env.example | `IDENTITY_PROVIDER_CLIENT_ID=` |
| 231 | configuration/environmental-variables | env | Functions var `IDENTITY_PROVIDER_ISSUER` | apps/supabase/supabase/functions/.env.example | `IDENTITY_PROVIDER_ISSUER=` |
| 232 | configuration/environmental-variables | env | Functions var `PUBLIC_PROJECT_ID` | apps/supabase/supabase/functions/.env.example | `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001` |
| 233 | configuration/environmental-variables | env | Functions var `SITE_URL` | apps/supabase/supabase/functions/.env.example | `SITE_URL=http://127.0.0.1:5173` |
| 234 | configuration/environmental-variables | env | Functions var `SMTP_HOST` | apps/supabase/supabase/functions/.env.example | `SMTP_HOST=inbucket` |
| 235 | configuration/environmental-variables | env | Functions var `SMTP_PORT` | apps/supabase/supabase/functions/.env.example | `SMTP_PORT=2500` |
| 236 | configuration/environmental-variables | env | Functions var `SMTP_FROM` | apps/supabase/supabase/functions/.env.example | `SMTP_FROM=noreply@openvaa.org` |
| 237 | configuration/environmental-variables | fact | The runtime injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` | apps/supabase/supabase/functions/.env.example | `NOT LISTED HERE, ON PURPOSE` |
| 238 | configuration/environmental-variables | fact | The runtime injects `SUPABASE_ANON_KEY` in deployment | .env.example | `Injected automatically by the Edge runtime in deployment; the un-prefixed name is set here` |
| 239 | configuration/environmental-variables | fact | Four variables exist twice and must agree | .env.example | `Four variables exist TWICE, once per runtime` |
| 240 | configuration/environmental-variables | fact | The four twins | scripts/assert-env-pair-registry.mjs | `IDENTITY_PROVIDER_CLIENT_ID PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` |
| 241 | configuration/environmental-variables | command | `yarn check:env-local` compares the pairs and checks the functions file | package.json | `--deno-file apps/supabase/supabase/functions/.env --require-both && yarn assert:edge-function-env apps/supabase/supabase/functions/.env` |
| 242 | configuration/environmental-variables | fact | The pair checker prints no values | scripts/assert-env-pairs-agree.mjs | `NON-DISCLOSURE IS ABSOLUTE` |
| 243 | configuration/environmental-variables | fact | The function-env checker prints names only | scripts/assert-edge-function-env.mjs | `This checker reports variable NAMES and line numbers only.` |
| 244 | configuration/environmental-variables | command | `yarn lint:check` runs `assert:env-pair-registry` | package.json | `yarn assert:env-pair-registry` |
| 245 | configuration/environmental-variables | fact | The registry guard fails on an undocumented twin | .env.example | `fails if a new twin appears without an entry in this block` |
| 246 | configuration/environmental-variables | flow | `PUBLIC_PROJECT_ID` scopes the adapter | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `this.#projectId = resolveProjectId(config.projectId);` |
| 247 | configuration/environmental-variables | flow | Empty `PUBLIC_PROJECT_ID` throws | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `PUBLIC_PROJECT_ID is required but not set.` |
| 248 | configuration/environmental-variables | flow | Non-canonical `PUBLIC_PROJECT_ID` throws | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `must be a canonical 8-4-4-4-12 hexadecimal uuid` |
| 249 | configuration/environmental-variables | env | Local value of `PUBLIC_PROJECT_ID` | .env.example | `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001` |
| 250 | configuration/environmental-variables | flow | `identity-callback` reads the same name to assign a project | .env.example | `The identity-callback Edge Function reads this same variable` |
| 251 | configuration/environmental-variables | flow | The public constants module reads `$env/dynamic/public` | apps/frontend/src/lib/utils/constants.ts | `import { env } from '$env/dynamic/public';` |
| 252 | configuration/environmental-variables | flow | The server constants module reads `$env/dynamic/private` | apps/frontend/src/lib/server/constants.ts | `import { env } from '$env/dynamic/private';` |
| 253 | configuration/environmental-variables | fact | Unset values become empty strings | apps/frontend/src/lib/utils/constants.ts | `PUBLIC_PROJECT_ID: env.PUBLIC_PROJECT_ID ?? ''` |
| 254 | configuration/environmental-variables | fact | The constants modules never throw, because every importer would break | apps/frontend/src/lib/utils/constants.ts | `Deliberately the same flat` |
| 255 | configuration/environmental-variables | fact | The one default: `PUBLIC_IDENTITY_PROVIDER_TYPE` falls back to `signicat-ftn` | apps/frontend/src/lib/utils/constants.ts | `PUBLIC_IDENTITY_PROVIDER_TYPE: env.PUBLIC_IDENTITY_PROVIDER_TYPE ?? 'signicat-ftn',` |
| 256 | configuration/environmental-variables | flow | Identity-provider values are checked where used | apps/frontend/src/lib/api/utils/auth/providers/requireConfigured.ts | - |
| 257 | configuration/environmental-variables | env | `PUBLIC_SUPABASE_URL` (local value) | .env.example | `PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` |
| 258 | configuration/environmental-variables | env | `SUPABASE_URL` | .env.example | `SUPABASE_URL=http://127.0.0.1:54321` |
| 259 | configuration/environmental-variables | flow | The seed tool falls back from `SUPABASE_URL` to `PUBLIC_SUPABASE_URL` | packages/dev-seed/src/cli/seed.ts | `if (!process.env.SUPABASE_URL && process.env.PUBLIC_SUPABASE_URL) {` |
| 260 | configuration/environmental-variables | env | `PUBLIC_SUPABASE_ANON_KEY` | .env.example | `PUBLIC_SUPABASE_ANON_KEY=` |
| 261 | configuration/environmental-variables | env | `SUPABASE_ANON_KEY` | .env.example | `SUPABASE_ANON_KEY=` |
| 262 | configuration/environmental-variables | env | `SUPABASE_SERVICE_ROLE_KEY` | .env.example | `SUPABASE_SERVICE_ROLE_KEY=` |
| 263 | configuration/environmental-variables | fact | The service-role key bypasses RLS and has no `PUBLIC_` twin | .env.example | `BYPASSES ROW-LEVEL SECURITY entirely` |
| 264 | configuration/environmental-variables | fact | Nothing in the frontend reads the service-role key | .env.example | `reads it; only local tooling and the test harness do.` |
| 265 | configuration/environmental-variables | fact | The seed tool, the E2E wrapper and the bank-auth specs need it | .env.example | `Required by, and each of these fails loudly` |
| 266 | configuration/environmental-variables | command | `supabase status -o env` prints the local keys | .env.example | `# Get it with: yarn workspace @openvaa/supabase supabase status -o env` |
| 267 | configuration/environmental-variables | env | `E2E_PROJECT_ID` is commented out in the template | .env.example | `# E2E_PROJECT_ID=00000000-0000-0000-0000-0000000000e2` |
| 268 | configuration/environmental-variables | flow | The E2E harness reads `E2E_PROJECT_ID` as an override | packages/dev-seed/src/supabaseAdminClient.ts | `const raw = (process.env.E2E_PROJECT_ID ?? '').trim().toLowerCase();` |
| 269 | configuration/environmental-variables | env | `FRONTEND_PORT` | .env.example | `FRONTEND_PORT=5173` |
| 270 | configuration/environmental-variables | env | `PUBLIC_BROWSER_FRONTEND_URL` | .env.example | `PUBLIC_BROWSER_FRONTEND_URL=http://localhost:5173` |
| 271 | configuration/environmental-variables | env | `PUBLIC_SERVER_FRONTEND_URL` | .env.example | `PUBLIC_SERVER_FRONTEND_URL=http://localhost:5173` |
| 272 | configuration/environmental-variables | fact | The public constants module exposes the frontend URL pair | apps/frontend/src/lib/utils/constants.ts | `PUBLIC_BROWSER_FRONTEND_URL: env.PUBLIC_BROWSER_FRONTEND_URL ?? '',` |
| 273 | configuration/environmental-variables | env | `LOCAL_DATA_DIR` | .env.example | `LOCAL_DATA_DIR=/var/data/local` |
| 274 | configuration/environmental-variables | flow | `LOCAL_DATA_DIR` is used only by the `local` adapter | apps/frontend/src/lib/server/api/adapters/local/localPaths.ts | `path.join(constants.LOCAL_DATA_DIR,` |
| 275 | configuration/environmental-variables | env | `PUBLIC_DEBUG` | .env.example | `PUBLIC_DEBUG=false` |
| 276 | configuration/environmental-variables | flow | `PUBLIC_DEBUG=true` makes `debug` the default level | .env.example | `a dev build or when PUBLIC_DEBUG=true` |
| 277 | configuration/environmental-variables | env | `PUBLIC_LOG_LEVEL` | .env.example | `PUBLIC_LOG_LEVEL=warn` |
| 278 | configuration/environmental-variables | fact | Accepted log levels | .env.example | `Accepted values: debug, info, warn, error.` |
| 279 | configuration/environmental-variables | fact | Any other value, `silent` included, logs one error and falls back | .env.example | `INCLUDING the word` |
| 280 | configuration/environmental-variables | env | `PUBLIC_IDENTITY_PROVIDER_TYPE` | .env.example | `PUBLIC_IDENTITY_PROVIDER_TYPE=signicat-ftn` |
| 281 | configuration/environmental-variables | env | `IDENTITY_PROVIDER_TYPE` | .env.example | `IDENTITY_PROVIDER_TYPE=signicat-ftn` |
| 282 | configuration/environmental-variables | fact | Provider types `signicat-ftn` and `idura-ftn` | .env.example | `Provider type: 'signicat-ftn' or 'idura-ftn'` |
| 283 | configuration/environmental-variables | env | `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` | .env.example | `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID=` |
| 284 | configuration/environmental-variables | env | `IDENTITY_PROVIDER_CLIENT_ID` | .env.example | `IDENTITY_PROVIDER_CLIENT_ID=` |
| 285 | configuration/environmental-variables | flow | `identity-callback` checks the client id as the audience | .env.example | `verifies the un-prefixed value as the expected` |
| 286 | configuration/environmental-variables | env | `IDENTITY_PROVIDER_DECRYPTION_JWKS` | .env.example | `IDENTITY_PROVIDER_DECRYPTION_JWKS=` |
| 287 | configuration/environmental-variables | env | `IDENTITY_PROVIDER_JWKS_URI` | .env.example | `IDENTITY_PROVIDER_JWKS_URI=` |
| 288 | configuration/environmental-variables | env | `IDENTITY_PROVIDER_ISSUER` | .env.example | `IDENTITY_PROVIDER_ISSUER=` |
| 289 | configuration/environmental-variables | fact | Both providers read the shared three | .env.example | `The three variables in this block are read by BOTH providers` |
| 290 | configuration/environmental-variables | env | `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT` (Signicat) | .env.example | `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT=` |
| 291 | configuration/environmental-variables | env | `IDENTITY_PROVIDER_TOKEN_ENDPOINT` (Signicat) | .env.example | `IDENTITY_PROVIDER_TOKEN_ENDPOINT=` |
| 292 | configuration/environmental-variables | env | `IDENTITY_PROVIDER_CLIENT_SECRET` (Signicat) | .env.example | `IDENTITY_PROVIDER_CLIENT_SECRET=` |
| 293 | configuration/environmental-variables | fact | The Signicat-specific block | .env.example | `--- Signicat-specific` |
| 294 | configuration/environmental-variables | env | `IDURA_DOMAIN` (Idura) | .env.example | `IDURA_DOMAIN=` |
| 295 | configuration/environmental-variables | env | `IDURA_SIGNING_JWKS` (Idura) | .env.example | `IDURA_SIGNING_JWKS=` |
| 296 | configuration/environmental-variables | env | `IDURA_SIGNING_KEY_KID` (Idura) | .env.example | `IDURA_SIGNING_KEY_KID=` |
| 297 | configuration/environmental-variables | fact | The Idura-specific block | .env.example | `--- Idura-specific` |
| 298 | configuration/environmental-variables | path | Key-generation guide | docs/key-generation.md | - |
| 299 | configuration/environmental-variables | env | `SITE_URL` has no fallback | .env.example | `Throws when unset; there is no fallback origin.` |
| 300 | configuration/environmental-variables | env | `SMTP_HOST` | .env.example | `SMTP_HOST=inbucket` |
| 301 | configuration/environmental-variables | env | `SMTP_PORT` | .env.example | `SMTP_PORT=2500` |
| 302 | configuration/environmental-variables | env | `SMTP_FROM` | .env.example | `SMTP_FROM=noreply@openvaa.org` |
| 303 | configuration/environmental-variables | flow | The root `.env` carries the function variables for serving a function against it | .env.example | `A. Serve the function against THIS file` |
| 304 | configuration/environmental-variables | env | `LLM_OPENAI_API_KEY` | .env.example | `LLM_OPENAI_API_KEY=""` |
| 305 | configuration/environmental-variables | flow | The LLM features throw without the key | apps/frontend/src/lib/server/llm/llmProvider.ts | `throw new Error('Missing LLM_OPENAI_API_KEY in environment');` |
| 306 | configuration/environmental-variables | fact | `behind_cloudflare` is a database setting | apps/supabase/supabase/schema/107-feedback.sql | `behind_cloudflare boolean NOT NULL DEFAULT false` |
| 307 | configuration/static-settings | fact | Static settings are set only by editing the file | packages/app-shared/src/settings/staticSettings.type.ts | `These settings can only be set by editing the` |
| 308 | configuration/static-settings | flow | `@openvaa/app-shared` is consumed as built `dist/` output | packages/app-shared/package.json | `"default": "./dist/index.js"` |
| 309 | configuration/static-settings | command | The `yarn dev` watcher rebuilds the packages | package.json | `"watch:shared": "turbo watch build --filter='./packages/*'"` |
| 310 | configuration/static-settings | fact | `admin.email` is shown to users on errors | packages/app-shared/src/settings/staticSettings.type.ts | `When errors occur, users may be asked to contact this address.` |
| 311 | configuration/static-settings | fact | Older saved user data is reset | packages/app-shared/src/settings/staticSettings.type.ts | `If the app version in which user data is last saved is smaller than this, the data will be reset.` |
| 312 | configuration/static-settings | fact | `appVersion.source` | packages/app-shared/src/settings/staticSettings.type.ts | `The url of the source code for the app.` |
| 313 | configuration/static-settings | fact | `dataAdapter.type` can be `local` | packages/app-shared/src/settings/staticSettings.type.ts | `readonly type: 'local';` |
| 314 | configuration/static-settings | fact | `dataAdapter.type` can be `supabase` | packages/app-shared/src/settings/staticSettings.type.ts | `readonly type: 'supabase';` |
| 315 | configuration/static-settings | fact | `supportsCandidateApp` / `supportsAdminApp` | packages/app-shared/src/settings/staticSettings.type.ts | `readonly supportsAdminApp: true;` |
| 316 | configuration/static-settings | fact | `pageSize` must equal PostgREST `max_rows` | packages/app-shared/src/settings/staticSettings.type.ts | `Must equal PostgREST` |
| 317 | configuration/static-settings | fact | Local `max_rows` | apps/supabase/supabase/config.toml | `max_rows = 50000` |
| 318 | configuration/static-settings | fact | Colours per light and dark theme | packages/app-shared/src/settings/staticSettings.type.ts | `These have to be defined separately for both the light (default) and dark themes.` |
| 319 | configuration/static-settings | fact | Font style decides the fallback fonts | packages/app-shared/src/settings/staticSettings.type.ts | `which will decide the fallback fonts to use` |
| 320 | configuration/static-settings | fact | One default locale | packages/app-shared/src/settings/staticSettings.type.ts | `Only mark one language as the default language` |
| 321 | configuration/static-settings | fact | Umami is the supported analytics platform | packages/app-shared/src/settings/staticSettings.type.ts | `readonly name: 'umami';` |
| 322 | configuration/static-settings | fact | `trackEvents` | packages/app-shared/src/settings/staticSettings.type.ts | `readonly trackEvents: boolean;` |
| 323 | configuration/app-customization | fact | Fields of `AppCustomization` (publisher, posters, overrides, FAQ) | apps/frontend/src/lib/contexts/app/appCustomization.type.ts | `candidateAppFAQ?: Array<{ question: string; answer: string }>;` |
| 324 | configuration/app-customization | fact | Stored in `app_settings.customization`, default `{}` | apps/supabase/supabase/schema/106-app-settings.sql | `customization jsonb DEFAULT '{}'::jsonb,` |
| 325 | configuration/app-customization | fact | The stored shape is `StoredCustomizationSchema` | packages/app-shared/src/data/schemas/storedCustomization.schema.ts | `export const StoredCustomizationSchema = z.strictObject({` |
| 326 | configuration/app-customization | fact | `publisherName` is a localized string | packages/app-shared/src/data/schemas/storedCustomization.schema.ts | `publisherName: LocalizedStringSchema.optional(),` |
| 327 | configuration/app-customization | fact | Images are stored as paths | packages/app-shared/src/data/schemas/storedCustomization.schema.ts | `publisherLogo: StoredImageSchema.nullable().optional(),` |
| 328 | configuration/app-customization | fact | `candPoster` | packages/app-shared/src/data/schemas/storedCustomization.schema.ts | `candPoster: StoredImageSchema.nullable().optional(),` |
| 329 | configuration/app-customization | fact | Translation overrides map keys to localized strings | packages/app-shared/src/data/schemas/storedCustomization.schema.ts | `translationOverrides: z.record(z.string(), LocalizedStringSchema).optional(),` |
| 330 | configuration/app-customization | fact | FAQ entries are localized question/answer pairs | packages/app-shared/src/data/schemas/storedCustomization.schema.ts | `question: LocalizedStringSchema,` |
| 331 | configuration/app-customization | flow | The provider reads the column for the configured project | apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts | `this.scopedFrom('app_settings').select('customization').maybeSingle();` |
| 332 | configuration/app-customization | flow | Validation keeps the members that pass | apps/frontend/src/lib/api/adapters/supabase/utils/parseStoredCustomization.ts | `keeping the members the schema accepts when others are malformed` |
| 333 | configuration/app-customization | flow | Strings are localized | apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts | `getLocalized(stored.publisherName, locale, this.defaultLocale)` |
| 334 | configuration/app-customization | flow | Image paths become public URLs in `public-assets` | apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts | `/storage/v1/object/public/public-assets/` |
| 335 | configuration/app-customization | fact | The frontend type `AppCustomization` | apps/frontend/src/lib/contexts/app/appCustomization.type.ts | `export type AppCustomization = {` |
| 336 | configuration/app-customization | flow | The root layout loads the customization first, for the overrides | apps/frontend/src/routes/+layout.ts | `// Load app customization first, because it may contain translation overrides` |
| 337 | configuration/app-customization | flow | `app_settings` rows can be loaded through bulk import | apps/supabase/supabase/schema/501-bulk-operations.sql | `'nominations', 'app_settings'` |
| 338 | configuration/app-customization | fact | An `app_settings` import row may carry `customization` | packages/dev-seed/src/template/permittedKeys.ts | `app_settings: ['created_at', 'customization',` |
| 339 | configuration/app-customization | flow | Derivation happens in `_getAppCustomization` | apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts | `protected async _getAppCustomization(` |
| 340 | deployment | path | The frontend Dockerfile | apps/frontend/Dockerfile | - |
| 341 | deployment | path | The Render Blueprint template | render.example.yaml | - |
| 342 | deployment | flow | The frontend reads env at run time (`$env/dynamic`) | apps/frontend/src/lib/utils/constants.ts | `import { env } from '$env/dynamic/public';` |
| 343 | deployment | path | The migrations directory | apps/supabase/supabase/migrations | - |
| 344 | deployment | fact | `config.toml` declares the public `public-assets` bucket | apps/supabase/supabase/config.toml | `[storage.buckets.public-assets]` |
| 345 | deployment | fact | `config.toml` declares the private `private-assets` bucket | apps/supabase/supabase/config.toml | `[storage.buckets.private-assets]` |
| 346 | deployment | fact | The migrations create the bucket policies | apps/supabase/supabase/schema/400-storage.sql | `RLS policies on storage.objects for the public-assets and private-assets buckets` |
| 347 | deployment | fact | The access-token hook is enabled locally | apps/supabase/supabase/config.toml | `uri = "pg-functions://postgres/public/custom_access_token_hook"` |
| 348 | deployment | fact | The hook puts the grants into the token | apps/supabase/supabase/schema/301-auth-functions.sql | `projects public.grants into the JWT` |
| 349 | deployment | fact | The local site URL | apps/supabase/supabase/config.toml | `site_url = "http://127.0.0.1:5173"` |
| 350 | deployment | fact | The callback redirect URL is allow-listed | apps/supabase/supabase/config.toml | `http://localhost:5173/api/candidate/auth/callback` |
| 351 | deployment | fact | No SMTP server is configured locally (the block is commented out) | apps/supabase/supabase/config.toml | `# [auth.email.smtp]` |
| 352 | deployment | fact | Local mail goes to the email testing server | apps/supabase/supabase/config.toml | `Emails sent with the local dev setup are not actually sent` |
| 353 | deployment | fact | `pageSize` is 50000 | packages/app-shared/src/settings/staticSettings.ts | `pageSize: 50000` |
| 354 | deployment | fact | Local `max_rows` is 50000 | apps/supabase/supabase/config.toml | `max_rows = 50000` |
| 355 | deployment | fact | `seed.sql` creates test users with a known password | apps/supabase/supabase/seed.sql | `-- Passwords are all 'password123' (bcrypt-hashed).` |
| 356 | deployment | fact | `seed.sql` creates the default account | apps/supabase/supabase/seed.sql | `'Default Account'` |
| 357 | deployment | fact | `seed.sql` creates the default project | apps/supabase/supabase/seed.sql | `'Default Project',` |
| 358 | deployment | fact | Projects are closed to voters by default | apps/supabase/supabase/schema/100-tenancy.sql | `open_for_voters boolean NOT NULL DEFAULT false,` |
| 359 | deployment | fact | `storage_config` holds the Storage URL and service-role key for the cleanup triggers | apps/supabase/supabase/schema/400-storage.sql | `storage_config - the Storage API URL and service-role key the cleanup triggers use` |
| 360 | deployment | fact | Only `service_role` and `postgres` can read it | apps/supabase/supabase/schema/400-storage.sql | `-- Only service_role and postgres can access storage_config (not exposed via API)` |
| 361 | deployment | fact | Cleanup on delete | apps/supabase/supabase/schema/400-storage.sql | `cleanup_entity_storage_files() - AFTER DELETE trigger for entity tables` |
| 362 | deployment | fact | Cleanup on image replacement | apps/supabase/supabase/schema/400-storage.sql | `cleanup_old_image_file() - BEFORE UPDATE trigger for image columns` |
| 363 | deployment | fact | `seed.sql` fills local values, to be replaced in production | apps/supabase/supabase/seed.sql | `-- In production, update with actual Supabase URL and service role key.` |
| 364 | deployment | path | The Edge Functions directory | apps/supabase/supabase/functions | - |
| 365 | deployment | env | Functions need `PUBLIC_PROJECT_ID` | apps/supabase/supabase/functions/.env.example | `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001` |
| 366 | deployment | env | Functions need `SITE_URL` | apps/supabase/supabase/functions/.env.example | `SITE_URL=` |
| 367 | deployment | env | `SMTP_USER` and `SMTP_PASS` are optional, for servers that need a login | apps/supabase/supabase/functions/.env.example | `SMTP_USER and SMTP_PASS are read` |
| 368 | deployment | fact | Supabase injects the URL and service-role key | apps/supabase/supabase/functions/.env.example | `NOT LISTED HERE, ON PURPOSE` |
| 369 | deployment | fact | `identity-callback` runs without JWT verification | .env.example | `--no-verify-jwt` |
| 370 | deployment | fact | Template step: rename to `render.yaml` | render.example.yaml | `# 1. Rename to render.yaml` |
| 371 | deployment | fact | Placeholders | render.example.yaml | `<INSTANCE_BRANCH>         e.g. deploy-vaa` |
| 372 | deployment | fact | `# Check` markers | render.example.yaml | `# 3. Check default values marked with # Check` |
| 373 | deployment | fact | Docker runtime | render.example.yaml | `runtime: docker` |
| 374 | deployment | fact | Dockerfile path | render.example.yaml | `dockerfilePath: ./apps/frontend/Dockerfile` |
| 375 | deployment | fact | Build context is the repository root | render.example.yaml | `dockerContext: .` |
| 376 | deployment | fact | The image builds the shared packages | apps/frontend/Dockerfile | `RUN yarn build` |
| 377 | deployment | fact | The image builds the frontend | apps/frontend/Dockerfile | `RUN yarn workspace @openvaa/frontend build` |
| 378 | deployment | fact | The image runs the built server | apps/frontend/Dockerfile | `CMD node ./apps/frontend/build/index.js` |
| 379 | deployment | fact | Port 3000 | apps/frontend/Dockerfile | `EXPOSE 3000` |
| 380 | deployment | env | Template key `PUBLIC_SUPABASE_URL` | render.example.yaml | `- key: PUBLIC_SUPABASE_URL` |
| 381 | deployment | env | Template key `PUBLIC_SUPABASE_ANON_KEY` | render.example.yaml | `- key: PUBLIC_SUPABASE_ANON_KEY` |
| 382 | deployment | env | Values entered in Render | render.example.yaml | `sync: false` |
| 383 | deployment | env | Template key `PUBLIC_DEBUG` | render.example.yaml | `- key: PUBLIC_DEBUG` |
| 384 | deployment | env | Template key `PUBLIC_LOG_LEVEL` | render.example.yaml | `- key: PUBLIC_LOG_LEVEL` |
| 385 | deployment | env | Template key `PUBLIC_BROWSER_FRONTEND_URL` | render.example.yaml | `- key: PUBLIC_BROWSER_FRONTEND_URL` |
| 386 | deployment | env | Template key `PUBLIC_SERVER_FRONTEND_URL` | render.example.yaml | `- key: PUBLIC_SERVER_FRONTEND_URL` |
| 387 | deployment | env | Commented-out identity-provider group | render.example.yaml | `# - fromGroup: IDENTITY PROVIDER - PRODUCTION CLIENT` |
| 388 | deployment | flow | The adapter throws without `PUBLIC_PROJECT_ID` | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `PUBLIC_PROJECT_ID is required but not set.` |
| 389 | deployment | env | `LLM_OPENAI_API_KEY` for the LLM features | apps/frontend/src/lib/server/constants.ts | `LLM_OPENAI_API_KEY: env.LLM_OPENAI_API_KEY ?? ''` |
| 390 | deployment | fact | The service-role key bypasses RLS; nothing in the frontend reads it | .env.example | `reads it; only local tooling and the test harness do.` |
| 391 | deployment | fact | Custom domains | render.example.yaml | `domains:` |
| 392 | deployment | fact | Feedback limit: five per window | apps/supabase/supabase/schema/107-feedback.sql | `p_max_requests      integer  := 5;` |
| 393 | deployment | fact | Feedback window: five minutes | apps/supabase/supabase/schema/107-feedback.sql | `p_window_secs       interval := interval '5 minutes';` |
| 394 | deployment | flow | The trigger reads `behind_cloudflare` (missing row = false) | apps/supabase/supabase/schema/107-feedback.sql | `p_behind_cloudflare := COALESCE((SELECT behind_cloudflare FROM private.deployment_settings), false);` |
| 395 | deployment | flow | With the setting off, the key is the last `x-forwarded-for` hop | apps/supabase/supabase/schema/107-feedback.sql | `split_part(p_headers ->> 'x-forwarded-for', ',', -1)` |
| 396 | deployment | fact | The migration ships it false | apps/supabase/supabase/schema/107-feedback.sql | `behind_cloudflare boolean NOT NULL DEFAULT false` |
| 397 | deployment | command | The SQL that turns it on | apps/supabase/supabase/schema/107-feedback.sql | `UPDATE private.deployment_settings SET behind_cloudflare = true;` |
| 398 | deployment | fact | Hosted deployments must set it | apps/supabase/supabase/schema/107-feedback.sql | `That is why hosted deployments must set it.` |
| 399 | deployment | fact | The local stack turns it on in `seed.sql` | apps/supabase/supabase/seed.sql | `-- Feedback rate-limit trust for the local stack` |
| 400 | deployment | fact | The test compose builds the production target | docker-compose.dev.yml | `target: production` |
| 401 | deployment | fact | It serves on port 3000 | docker-compose.dev.yml | `"3000:3000"` |
| 402 | deployment | fact | Start Supabase first | docker-compose.dev.yml | `# Prerequisites: supabase start (for backend services)` |
| 403 | deployment | command | The compose command | docker-compose.dev.yml | `# Usage: docker compose -f docker-compose.dev.yml up --build` |
| 404 | deployment | env | Default API URL `host.docker.internal:54321` | docker-compose.dev.yml | `${PUBLIC_SUPABASE_URL:-http://host.docker.internal:54321}` |
| 405 | deployment | env | The anon key comes from the environment | docker-compose.dev.yml | `PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY}` |
| 406 | deployment | command | `yarn build` builds every workspace | package.json | `"build": "turbo run build"` |
| 407 | deployment | fact | The frontend uses the Node adapter | apps/frontend/svelte.config.js | `import adapter from '@sveltejs/adapter-node';` |
| 408 | troubleshooting | fact | `strictPort` | apps/frontend/vite.config.ts | `strictPort: true` |
| 409 | troubleshooting | env | Shell `FRONTEND_PORT` overrides `.env` | apps/frontend/vite.config.ts | `still overrides a persistent value in the root` |
| 410 | troubleshooting | fact | The Supabase CLI needs a running container runtime | tests/scripts/e2e-run.sh | `Docker is running.` |
| 411 | troubleshooting | fact | Local ports are literals in `config.toml` | apps/supabase/supabase/config.toml | `# Every port below is a literal, not an environment lookup.` |
| 412 | troubleshooting | fact | The stack's project name is fixed, so two checkouts collide on the same ports | apps/supabase/supabase/config.toml | `project_id = "openvaa-local"` |
| 413 | troubleshooting | command | `yarn db:stop` | package.json | `"db:stop": "yarn workspace @openvaa/supabase stop"` |
| 414 | troubleshooting | command | `yarn db:status` | package.json | `"db:status": "yarn workspace @openvaa/supabase status"` |
| 415 | troubleshooting | flow | The empty-id message | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `PUBLIC_PROJECT_ID is required but not set.` |
| 416 | troubleshooting | flow | The non-UUID message | apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts | `must be a canonical 8-4-4-4-12 hexadecimal uuid` |
| 417 | troubleshooting | flow | Only the root `.env` is read | apps/frontend/svelte.config.js | `dir: repoRoot` |
| 418 | troubleshooting | fact | A reset database has no elections or questions (`seed.sql` inserts none) | apps/supabase/supabase/seed.sql | `-- Default project for single-tenant deployment` |
| 419 | troubleshooting | command | `yarn db:seed:default` | package.json | `"db:seed:default": "yarn db:seed --template default"` |
| 420 | troubleshooting | flow | `yarn db:seed` writes into the default project | packages/dev-seed/src/supabaseAdminClient.ts | `export const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001';` |
| 421 | troubleshooting | flow | The seed writer's missing-key message | packages/dev-seed/src/writer.ts | `'SUPABASE_SERVICE_ROLE_KEY env var is required but not set. ' +` |
| 422 | troubleshooting | flow | An Edge Function's fixed 500 body | .env.example | `{"error":"Internal server error"}` |
| 423 | troubleshooting | flow | The variable name appears only in the log | .env.example | `The variable name appears ONLY in the container log.` |
| 424 | troubleshooting | command | `yarn check:env-local` | package.json | `"check:env-local": ` |
| 425 | troubleshooting | command | `yarn dev:clean` clears `.svelte-kit` and the Vite cache | apps/frontend/package.json | `"clean": "rm -rf .svelte-kit node_modules/.vite"` |
| 426 | troubleshooting | command | `yarn dev` runs `dev:clean` on start | package.json | `"_dev:concurrent": "yarn dev:clean && concurrently` |
| 427 | troubleshooting | command | `yarn db:reset` | package.json | `"db:reset": "yarn db:start && yarn workspace @openvaa/supabase reset"` |
| 428 | troubleshooting | command | `yarn dev:reset-with-data` | package.json | `"dev:reset-with-data": "yarn db:reset-with-data && yarn dev"` |
| 429 | troubleshooting | command | `yarn prepare` installs the Husky hooks | package.json | `"prepare": "husky"` |
| 430 | troubleshooting | path | The hooks live in `.husky/` | .husky/pre-commit | - |
| 431 | troubleshooting | flow | The preflight's failure headline | tests/tests/support/preflight.ts | `export const FAILURE_HEADLINE = 'E2E PREFLIGHT FAILED';` |
| 432 | troubleshooting | flow | The preflight checks the served project | tests/global-setup.ts | `const SERVED_PROJECT_ATTRIBUTE = 'data-project-id';` |
| 433 | troubleshooting | fact | E2E locators use test ids | tests/tests/utils/testIds.ts | - |
| 434 | troubleshooting | fact | The shipped locales are `en`, `fi` and `sv` | packages/app-shared/src/settings/staticSettings.ts | `code: 'sv',` |
| 435 | troubleshooting | fact | The localisation permutation spec expects these three | tests/tests/specs/perm/perm-localisation-positive.spec.ts | `The langSelector assertion expects 3 user-facing locales (en/fi/sv)` |
| 436 | architecture | path | The `local` server adapter is served through `/api/data/[collection]` | apps/frontend/src/routes/api/data/[collection]/+server.ts | `import { dataProvider as dataProviderPromise } from '$lib/server/api/dataProvider';` |
| 437 | architecture | flow | The `apiRoute` adapter reads that route | apps/frontend/src/lib/api/adapters/apiRoute/apiRoutes.ts | `/data/${collection}` |
| 438 | architecture | flow | `createDataProvider` always returns the Supabase provider | apps/frontend/src/lib/api/dataProvider.ts | `return new SupabaseDataProvider(resolveAdapterConfig(source));` |
| 439 | configuration/static-settings | fact | The client uses the Supabase data provider whatever `dataAdapter.type` names | packages/app-shared/src/settings/staticSettings.type.ts | `the client uses the Supabase data provider whatever` |
| 440 | development/running-the-development-environment | command | `yarn db:reset-with-e2e-data` resets and seeds `e2e/base` | package.json | `"db:reset-with-e2e-data": "yarn db:reset-with-data --template e2e/base"` |
| 441 | development/running-the-development-environment | flow | dev-seed writes into the default project | packages/dev-seed/src/supabaseAdminClient.ts | `this.projectId = projectId ?? TEST_PROJECT_ID;` |
| 442 | development/running-the-development-environment | fact | The E2E suite owns a different project | packages/dev-seed/src/supabaseAdminClient.ts | `export const E2E_PROJECT_ID = '00000000-0000-0000-0000-0000000000e2';` |

## Findings for todos

| # | Finding | Evidence (anchor file: anchor) | Disposition |
| --- | --- | --- | --- |
| F1 | Neither deployment template passes `PUBLIC_PROJECT_ID` to the frontend: `render.example.yaml` lists `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_DEBUG`, `PUBLIC_LOG_LEVEL` and the frontend URL pair, and the production-test `docker-compose.dev.yml` lists the same set. The Supabase adapter throws at construction when the value is empty, so a service built from either template as written would fail on its first Supabase read. Not run here, so the effect is UNCONFIRMED. The Deployment page tells operators to add the variable. | `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts`: `PUBLIC_PROJECT_ID is required but not set.`; `git grep -n PUBLIC_PROJECT_ID -- render.example.yaml docker-compose.dev.yml` exits 1 | Config todo candidate for a code phase (D-18: document, do not change). |
| F2 | `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL` are declared in `.env.example`, `render.example.yaml`, `docker-compose.dev.yml` and `$lib/utils/constants`, but no module reads them: outside `constants.ts` they appear only in test mocks. Whether they are reserved or dead is UNCONFIRMED. The Environment variables page lists them without claiming a consumer. | `git grep -n -E 'PUBLIC_(BROWSER\|SERVER)_FRONTEND_URL' -- apps/frontend/src` lists only `constants.ts` and five test files | Todo candidate (remove or wire); no change here. |
| F3 | Cross-reference to 168-03 F7: the `.env.example` comment says a live `E2E_PROJECT_ID` line would re-point `yarn db:seed:default`; 168-03 found the seed CLI does not read it. The Environment variables page says only that the E2E harness reads it as an override and that the template keeps it commented out. | `packages/dev-seed/src/supabaseAdminClient.ts`: `const raw = (process.env.E2E_PROJECT_ID ?? '').trim().toLowerCase();` | Same disposition as 168-03 F7 (comment pass). |
| F4 | Cross-reference to 168-03 F1 and F6. F1 (`apps/supabase/README.md` runs pgTAP with `npx supabase test db`): the Testing page uses the workspace script `yarn workspace @openvaa/supabase test:db`. F6 (CLAUDE.md "seeded automatically on `supabase start`"): Quick start and Running the development environment state only that `yarn db:reset` runs `seed.sql`, and make no first-start claim. F5 (README: `invite-candidate` "assigns the `candidate` role") is not restated on any 168-04 page. | `apps/supabase/package.json`: `"test:db": "supabase test db"`; `apps/supabase/supabase/config.toml`: `seeds the database after migrations during a db reset` | No new action; 168-08 handles F1/F5/F6. |
| F5 | `apps/frontend/docker-compose.dev.yml` (the Dockerfile's `development` target with source volume mounts and a `./data` local-data mount) is referenced by no script, workflow or document outside `.planning`. It looks like a remnant of the Docker development stack; whether anyone still uses it is UNCONFIRMED. The 168-04 pages do not document it. | `git grep -n -l 'frontend/docker-compose.dev.yml' -- ':!.planning'` exits 1; `apps/frontend/Dockerfile`: `FROM frontend AS development` | Todo candidate (keep or delete); no change here. |
| F6 | The migrations create no Storage bucket: `400-storage.sql` creates only the policies for `public-assets` and `private-assets`, and the buckets themselves exist only in the local `config.toml`. A hosted project needs them created by hand, and no repository script does it. The Deployment page states the manual step. | `git grep -n -E 'INSERT INTO storage\.buckets' -- apps/supabase/supabase/schema` exits 1; `apps/supabase/supabase/config.toml`: `[storage.buckets.public-assets]` | Observation; a deploy script would be a code-phase item. |
| F7 | The Admin app has no editor for `app_settings.customization`; nothing under `apps/frontend/src/routes/admin` mentions customization. The App customization page says to write the column directly. | `git grep -n -i customization -- apps/frontend/src/routes/admin` exits 1 | Observation for 168-06 (Admin app page); no action. |
| F8 | The base Troubleshooting page's Husky advice (`npx husky install`, editing `.husky/_/husky.sh`) is from an older Husky; the repo installs hooks with `"prepare": "husky"`. The page now says `yarn prepare` and links Husky's documentation for the version-manager case. | `package.json`: `"prepare": "husky"` | Done on the page; no action. |

## Sweep exceptions

| Page | Hit | Reason |
| --- | --- | --- |
| `development/requirements` | "A container runtime such as Docker" (one line) | The Supabase CLI runs the local Supabase services as containers, so a running container runtime is a requirement; this is the D-21 "Docker for Supabase" case the plan names. |
| `deployment` | `docker` / `Dockerfile` / `docker-compose.dev.yml` / `docker compose` (six lines: the frontend container intro, Render step 2, and the "Testing a production build locally" section) | D-21 permitted case: the frontend is deployed as a container built from `apps/frontend/Dockerfile`, Render runs it as a Docker web service, and `docker-compose.dev.yml` builds and runs the production image locally. No Docker development stack is described. |
| `deployment` | `CACHE_*`, `PUBLIC_CACHE_*`, `PUBLIC_*_BACKEND_URL`, "a backend API token", `/var/data/cache` (one paragraph, "Upgrading an older Render service") | Not a D-21 hit (no full removed name is spelled, so the 167-removed-name grep exits 1), recorded so 168-08 reads it as intended: it is the Phase 167 Render operator note (167-06 SUMMARY § Hand-offs), which tells existing services to detach the cache disk and delete those variables. It describes removal, not current configuration. |
