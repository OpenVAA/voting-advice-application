# Testing

The project has four kinds of tests:

- Vitest unit tests in the workspaces
- pgTAP tests for the database
- Vitest unit tests for the Edge Functions
- Playwright E2E tests in `tests/`

## Unit tests

Run every workspace's unit tests from the repository root:

```bash
yarn test:unit
```

This first runs `yarn assert:unit-coverage`, which fails if a workspace holds test files but declares no `test:unit` script, or declares one that `turbo run test:unit` does not run. It then runs `turbo run test:unit`, which builds each workspace before testing it, so you do not need a separate build.

To run one workspace's tests, use its own script:

```bash
yarn workspace @openvaa/matching test:unit
```

`yarn test:unit:watch` runs Vitest in watch mode over the tests in `packages/`.

## Database tests (pgTAP)

The pgTAP tests in `apps/supabase/supabase/tests/database/` run against the local database, so start it first:

```bash
yarn db:start
yarn workspace @openvaa/supabase test:db
```

[Tests and SQL lint](/developers-guide/backend/intro#tests-and-sql-lint) explains how the tests are written.

## Edge Function tests

The Vitest suites next to the Edge Functions (`apps/supabase/supabase/functions/**/*.test.ts`) need no running stack:

```bash
yarn workspace @openvaa/supabase test:unit
```

The root `yarn test:unit` includes them.

## E2E tests

The Playwright suite lives in [`tests/`](https://github.com/OpenVAA/voting-advice-application/tree/main/tests). It seeds its own data with `@openvaa/dev-seed` into a project of its own, `00000000-0000-0000-0000-0000000000e2`, not the default project your local app shows. Install the browsers once with `yarn playwright install`.

The simplest way to run it is the wrapper script, which starts Supabase and a dev server of its own on that project, runs the suite and writes every result into the run directory:

```bash
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/my-run --no-db-reset
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/my-run --no-db-reset --project voter-journey
```

Without `--no-db-reset` the wrapper also resets the database first; the suite does not need that, because it owns its project. The wrapper's dev server uses port 5273 unless you set `FRONTEND_PORT`, and that port must be free.

To drive your own dev server instead, start it on the suite's project and run Playwright in another shell:

```bash
PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2 yarn dev
yarn test:e2e
```

`yarn test:e2e` excludes the isolation probes; `yarn test:e2e:probes` runs them.

**Every run starts with a preflight.** Before the first spec, Playwright's global setup checks that the server on the target port is this checkout's own dev server, and that the project it serves is the project the suite seeds. If either check fails, the run stops and the message names the cause and the fix.

Do not run `yarn db:reset` while the suite is running: it deletes the data the suite is using. [`tests/README.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/tests/README.md) covers the preflight, the Playwright projects, the datasets and the common pitfalls in detail.
