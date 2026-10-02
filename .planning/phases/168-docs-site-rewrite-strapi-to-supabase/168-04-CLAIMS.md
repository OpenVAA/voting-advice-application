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

## Findings for todos

| # | Finding | Evidence (anchor file: anchor) | Disposition |
| --- | --- | --- | --- |

## Sweep exceptions

| Page | Hit | Reason |
| --- | --- | --- |
