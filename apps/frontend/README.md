# @openvaa/frontend

SvelteKit 2 frontend for OpenVAA Voting Advice Applications.

## Dev workflow

`yarn dev` (from repo root) first starts local Supabase (`yarn db:start`), then runs the package watcher and the Vite dev server concurrently via `concurrently`:

1. **Local Supabase** (`yarn db:start`) — Postgres, Auth, Storage, Edge Functions, Inbucket
2. **Package watcher** (`yarn watch:shared`, which runs `turbo watch build --filter='./packages/*'`) — rebuilds shared `@openvaa/*` packages' `dist/` outputs whenever their source changes
3. **Frontend dev server** (`yarn workspace @openvaa/frontend dev`, which runs `vite dev`) — serves the SvelteKit app with HMR

### Autoreload behavior

When you edit a `@openvaa/*` package source file (e.g. `packages/data/src/foo.ts`):

- Turborepo rebuilds that package's `dist/`
- Vite (with `preserveSymlinks: true` in `vite.config.ts`) picks up the rebuilt `dist/` via its existing module graph
- Hot Module Replacement fires in the browser — no manual reload required

When you edit the root `.env`:

- The `restartOnRootEnv` plugin (`apps/frontend/vite.restartOnRootEnv.ts`, wired in `vite.config.ts`) detects the change
- The Vite server fully restarts (env snapshot must be re-seeded; HMR is insufficient for env vars)

### When autoreload misbehaves

If you see stale module errors after a fresh clone or after a long-running dev session:

- `yarn dev:reset` resets the database, then relaunches the full stack (Supabase + watcher + Vite, with the vite cache wiped on startup)
- For a cold `dist/` recovery, run `yarn build` first, then `yarn dev`

### Path aliases

- `$lib` → `apps/frontend/src/lib`
- `$types` → `apps/frontend/src/lib/types`
- `$contestant` → `apps/frontend/src/lib/contestant`
- `$layouts` → `apps/frontend/src/lib/layouts`

## Build

`yarn build --filter=@openvaa/frontend` (from repo root) produces the SvelteKit `adapter-node` server bundle in `apps/frontend/build/`.

## Tests

- `yarn workspace @openvaa/frontend test:unit` — Vitest unit tests
- `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` (from repo root) — Playwright E2E tests; to drive a server you started yourself, see [`tests/README.md` § Run](../../tests/README.md#run)
