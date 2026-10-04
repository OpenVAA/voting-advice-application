# Troubleshooting

If you can't find an answer to your problem below, ask in the project's GitHub [Discussions](https://github.com/OpenVAA/voting-advice-application/discussions).

## `yarn dev` fails because the port is in use

The frontend dev server uses `strictPort`, so it exits with an error instead of moving to another port when its port is taken. Stop the other process on the port, or run on another one for this session:

```bash
FRONTEND_PORT=5273 yarn dev
```

To change the port permanently, set `FRONTEND_PORT` in the root `.env`. See [Ports](/developers-guide/development/running-the-development-environment#ports).

## The local Supabase stack does not start

- **The container runtime is not running.** The Supabase CLI runs its services as containers, so start your container runtime (see [Requirements](/developers-guide/development/requirements)) and run `yarn db:start` again.
- **A port is taken.** The local ports are fixed in `apps/supabase/supabase/config.toml` (see [Local services](/developers-guide/backend/intro#local-services)). Two checkouts of this repository cannot run their stacks at the same time, because both use the same ports: stop the other one with `yarn db:stop` in that checkout. If something unrelated holds a port, change the number in `config.toml` in your checkout.
- `yarn db:status` shows which services are running.

## `PUBLIC_PROJECT_ID is required but not set`

The Supabase adapter throws this when `PUBLIC_PROJECT_ID` is empty, and a similar error when the value is not a canonical UUID. Set it in the repo-root `.env`. For the local stack the value is `00000000-0000-0000-0000-000000000001`, the default project that `seed.sql` creates. The frontend reads only the root `.env`; an `apps/frontend/.env` is ignored. See [Environment variables](/developers-guide/configuration/environmental-variables#public_project_id).

## The app is empty

A fresh or reset database holds the default project but no elections or questions. Load the demo data with `yarn db:seed:default`. If the app is still empty, check that `PUBLIC_PROJECT_ID` names the project you seeded: `yarn db:seed` writes into the default project.

## `SUPABASE_SERVICE_ROLE_KEY env var is required but not set`

`yarn db:seed` needs the local stack's service-role key in the root `.env`. Print the keys with `yarn workspace @openvaa/supabase supabase status -o env` and copy `SERVICE_ROLE_KEY` into `SUPABASE_SERVICE_ROLE_KEY`, as in the [Quick start](/developers-guide/quick-start).

## An Edge Function answers `{"error":"Internal server error"}`

An Edge Function returns this fixed message when a variable it requires is missing, and names the variable only in its log. The local functions read `apps/supabase/supabase/functions/.env`, not the root `.env`. Create it from its template, run `yarn check:env-local`, and restart the stack with `yarn db:stop && yarn db:start`. See [Edge Functions](/developers-guide/backend/edge-functions#configuration).

## The frontend shows stale code

Vite's dependency cache or the generated `.svelte-kit` directory can go stale after a branch switch or a dependency update. Clear them with:

```bash
yarn dev:clean
```

`yarn dev` also runs it on every start. If a shared package seems stale, run `yarn build`.

## Starting over with a clean database

`yarn db:reset` deletes all data and rebuilds the database from the migrations and `seed.sql`. `yarn db:reset-with-data` also loads the demo data. `yarn dev:reset` and `yarn dev:reset-with-data` do the same and then start `yarn dev`. Do not reset while the E2E suite is running.

## Commit error: Husky hooks do not run or `husky` is not found

The Git hooks in `.husky/` are installed by the root `prepare` script, which runs `husky`. To install them again, run:

```bash
yarn prepare
```

If the hooks cannot find Node or Yarn, for example because Node comes from a version manager such as nvm that your Git client does not load, see the [Husky documentation](https://typicode.github.io/husky/) on configuring the hooks' environment.

## Playwright: the run stops with `E2E PREFLIGHT FAILED`

Before the first spec, the E2E suite checks that the server on the target port is this checkout's dev server and that it serves the project the suite seeds. The message names the cause and the fix. Usually another server holds the port, or the dev server was started without the suite's `PUBLIC_PROJECT_ID`. See [E2E tests](/developers-guide/development/testing#e2e-tests).

## Playwright: tests fail after changing the locales

Most E2E locators use test ids, but some specs assume the locales that `supportedLocales` in [staticSettings.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts) ships with: `en`, `fi` and `sv`. For example, the localisation permutation spec expects exactly these three. If you change the supported locales, expect those specs to fail.
