# @openvaa/frontend

SvelteKit 2 frontend for OpenVAA Voting Advice Applications.

## Dev workflow

`yarn dev` (from repo root) starts three processes concurrently via `concurrently`:

1. **Local Supabase** (`yarn supabase:start`) — Postgres, Auth, Storage, Edge Functions, Inbucket
2. **Package watcher** (`yarn watch:shared`, which runs `turbo watch build --filter='./packages/*'`) — rebuilds shared `@openvaa/*` packages' `dist/` outputs whenever their source changes
3. **Frontend dev server** (`yarn workspace @openvaa/frontend dev`, which runs `vite dev`) — serves the SvelteKit app with HMR

### Autoreload behavior

When you edit a `@openvaa/*` package source file (e.g. `packages/data/src/foo.ts`):

- Turborepo rebuilds that package's `dist/`
- Vite (with `preserveSymlinks: true` in `vite.config.ts`) picks up the rebuilt `dist/` via its existing module graph
- Hot Module Replacement fires in the browser — no manual reload required

When you edit the root `.env`:

- `vite-plugin-restart` (configured in `apps/frontend/vite.config.ts`) detects the change
- The Vite server fully restarts (env snapshot must be re-seeded; HMR is insufficient for env vars)

### When autoreload misbehaves

If you see stale module errors after a fresh clone or after a long-running dev session:

- `yarn dev:reset` performs a clean Supabase reset and dev-server restart
- `yarn dev:start` runs `yarn build` first (cold `dist/` recovery), then starts Supabase + Vite

### Path aliases

- `$lib` → `apps/frontend/src/lib`
- `$types` → `apps/frontend/src/lib/types`
- `$voter` → `apps/frontend/src/lib/voter`
- `$candidate` → `apps/frontend/src/lib/candidate`

## Build

`yarn build --filter=@openvaa/frontend` (from repo root) produces the SvelteKit `adapter-node` server bundle in `apps/frontend/build/`.

## Tests

- `yarn workspace @openvaa/frontend test:unit` — Vitest unit tests
- `yarn test:e2e` (from repo root, requires `yarn dev` running) — Playwright E2E tests
