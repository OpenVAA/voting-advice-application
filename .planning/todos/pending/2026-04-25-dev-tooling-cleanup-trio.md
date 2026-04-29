---
title: Dev tooling cleanup trio — frontend autoreload, lint imports, retire Deno linting
priority: low
area: dev-tooling
created: 2026-04-25
promoted: 2026-04-29
resolves_phase: 68
context: Three small dev-tooling cleanup notes captured 2026-04-25 (`frontend-autoreload-on-package-env-changes`, `lint-all-imports`, `remove-deno-linting-except-edge-funcs`). Grouped into a single low-priority "dev cleanup" todo at the user's request during v2.6 milestone close — the work is small enough per-item that splitting into three separate todos is administrative overhead.
---

# Dev tooling cleanup — three small items

## 1. Frontend autoreload when package code or envs change

The Vite dev server doesn't reliably autoreload the frontend when
either:

- A `@openvaa/*` package's source files change (the package needs
  to rebuild, and Vite needs to invalidate the dependent module
  graph).
- Env vars change (a `.env` file edit doesn't always restart
  the server's env snapshot).

Both currently require a manual `yarn dev:reset` or restart. Investigate:

- Whether Vite's HMR can watch package outputs (`packages/*/dist/`)
  and trigger module graph invalidation.
- Whether `vite-plugin-restart` or similar fits.
- Whether Turborepo `--watch` mode for packages composes with Vite's
  HMR (likely yes — `yarn build --filter=@openvaa/foo --watch` then
  Vite picks up the rebuilt dist).

## 2. Lint all imports

Codebase has inconsistent import styles:

- Mixed `import type` vs inline-typed-imports.
- Mixed `.js` extension presence/absence in TypeScript files.
- Mixed alias usage (`$lib/...` vs relative path) for the same target.
- Possible unused imports that no rule currently catches.

Audit eslint config; add or tune rules covering:

- `@typescript-eslint/consistent-type-imports`
- `import/order` and `import/newline-after-import`
- `import/no-duplicates`
- Project-specific rule: prefer `$lib/...` over deep relative imports.
- Remove unused imports.

## 3. Retire Deno linting from non-edge-function code

v2.2 introduced Deno tooling; v2.2 was paused but Deno linting
artifacts may still be configured for non-edge-function code paths.
Edge Functions in `apps/supabase/functions/` legitimately run on
Deno and need Deno linting. Everything else in the monorepo
runs on Node 22 and should not.

Audit:

- Top-level `deno.json` / `deno.jsonc` / `deno.lock` (if present at
  repo root or in non-edge-function directories) — keep only those
  scoped to `apps/supabase/functions/*`.
- VSCode `deno.enable` / `deno.enablePaths` config — confirm scoped
  to edge-functions only.
- Any CI step running `deno lint` or `deno check` on non-edge code.

## Acceptance

- Frontend autoreloads on package source change without manual
  intervention (item 1).
- ESLint catches every cross-cutting import inconsistency listed in
  item 2; fixes applied.
- Deno tooling is scoped strictly to `apps/supabase/functions/` (item 3).

## Related

- `.planning/todos/pending/sql-linting-formatting.md` — sibling
  CI hygiene work (low priority too).
