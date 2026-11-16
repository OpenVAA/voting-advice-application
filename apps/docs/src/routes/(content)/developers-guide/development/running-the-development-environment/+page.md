# Running the development environment

This page assumes you have the [requirements](/developers-guide/development/requirements) installed, have run `yarn install` and have a root `.env`, as in the [Quick start](/developers-guide/quick-start).

## Two families of scripts

The root [`package.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/package.json) has two families of scripts for local development. Run them from the repository root.

- **`db:*`** scripts act on the local Supabase stack only.
- **`dev:*`** scripts, and `yarn dev` itself, run the whole environment: the database, a watcher for the shared packages and the frontend dev server.

### Database scripts

| Command                       | What it does                                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn db:start`               | Starts the local Supabase stack (`supabase start` in `@openvaa/supabase`).                                                                     |
| `yarn db:stop`                | Stops it.                                                                                                                                      |
| `yarn db:status`              | Prints the running stack's URLs and keys. Keep this output to yourself: it includes the service-role key.                                      |
| `yarn db:reset`               | Starts the stack, then recreates the database from the migrations and runs `seed.sql`. **All data is lost.**                                   |
| `yarn db:seed`                | Runs the `@openvaa/dev-seed` CLI. Pass `--template <name>` to choose a template.                                                               |
| `yarn db:seed:default`        | Seeds the `default` demo template.                                                                                                             |
| `yarn db:reset-with-data`     | `yarn db:reset`, then `yarn db:seed:default`.                                                                                                  |
| `yarn db:reset-with-e2e-data` | Resets the database and seeds the `e2e/base` template into the default project. The E2E suite does not need it: it seeds a project of its own. |
| `yarn db:seed:teardown`       | Deletes seeded rows by their external-id prefix.                                                                                               |
| `yarn db:types`               | Regenerates `@openvaa/supabase-types` from the local database (see [Generated types](/developers-guide/backend/generated-types)).              |

[Seed data](/developers-guide/development/seed-data) covers the seed commands and their options.

### Whole-environment scripts

| Command                    | What it does                                                                     |
| -------------------------- | -------------------------------------------------------------------------------- |
| `yarn dev`                 | Starts everything; see below.                                                    |
| `yarn dev:clean`           | Deletes the frontend's `.svelte-kit` directory and its Vite cache.               |
| `yarn dev:reset`           | `yarn db:reset`, then `yarn dev`: an empty database with only `seed.sql` in it.  |
| `yarn dev:reset-with-data` | `yarn db:reset-with-data`, then `yarn dev`: a fresh database with the demo data. |

## What `yarn dev` does

1. It runs `yarn db:start`, which starts the local Supabase services as containers.
2. It runs `yarn dev:clean`.
3. It starts two processes side by side with `concurrently`, labelled `watch` and `frontend`:
   - `watch` is `yarn watch:shared`, which runs `turbo watch build` over the packages in `packages/` and rebuilds them when their sources change.
   - `frontend` is `yarn workspace @openvaa/frontend dev`, the Vite dev server.

   If either process fails, `concurrently` stops the other one too (`--kill-others-on-fail`).

Stopping `yarn dev` stops the watcher and the dev server, but not the database: the stack keeps running until you run `yarn db:stop`.

## Running the parts separately

- **The database only:** `yarn db:start`, and `yarn db:stop` when you are done. This is enough for the database tests and for `yarn db:seed`.
- **The frontend only:**

  ```bash
  yarn build
  yarn workspace @openvaa/frontend dev
  ```

  The frontend imports the built output of the shared packages, so build them once first. `yarn build` runs the `build` task of every workspace through Turborepo. The frontend also needs the database running.

- **The package watcher only:** `yarn watch:shared`.

## Ports

The frontend dev server listens on `FRONTEND_PORT` from the root `.env` (5173 in `.env.example`, and 5173 if the variable is unset). It uses Vite's `strictPort`, so if the port is taken it exits with an error rather than moving to the next free port. To use another port for a single run, prefix the command:

```bash
FRONTEND_PORT=5273 yarn dev
```

A value set in the shell overrides the one in `.env`. The local Supabase ports are fixed in `apps/supabase/supabase/config.toml`; see [Local services](/developers-guide/backend/intro#local-services).

The dev server restarts by itself when you edit the root `.env`.

## Resetting

`yarn db:reset` deletes every row, including anything you seeded, and rebuilds the database from the migrations and `seed.sql`. `yarn dev:reset` and `yarn dev:reset-with-data` do the same and then start `yarn dev`. Use them after a schema change or when local data has drifted into a state you no longer want.

If the frontend shows stale code after a dependency or branch change, `yarn dev:clean` (which `yarn dev` already runs on start) clears its caches. See [Troubleshooting](/developers-guide/troubleshooting) for other problems.
