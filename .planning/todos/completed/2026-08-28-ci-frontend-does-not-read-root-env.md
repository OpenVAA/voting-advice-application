---
created: '2026-08-28T00:00:00.000Z'
title: CI writes the repo-root .env, but the frontend dev server reads apps/frontend/.env
area: infra
priority: high
files:
  - .github/workflows/main.yaml
  - apps/frontend/vite.config.ts
  - .env.example
  - apps/frontend/svelte.config.js
resolved: '2026-09-27'
---

## Problem

**The mechanism is measured. The conclusion about CI is NOT confirmed, and the difference matters.**

Measured, from source:

- SvelteKit resolves its env files with `loadEnv(mode, kit.env.dir, '')`, and `kit.env.dir` defaults
  to `process.cwd()`. The frontend dev server is started as `yarn workspace @openvaa/frontend dev`,
  whose cwd is `apps/frontend`. So the file SvelteKit reads is `apps/frontend/.env`, which is
  gitignored and does not exist on a fresh runner.
- The CI `e2e-tests` job runs `cp .env.example .env`, which writes the **repo-root** file.
- The root `.env.example` ships `PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>`, a placeholder,
  so even a working copy of that file would not carry a usable value for that key.

NOT confirmed: that this actually breaks a CI run today. The `main.yaml` workflow triggers only on
`main`, and this branch has no green run of it to inspect — the newest runs belong to a different
tree. Anyone acting on this should re-measure against a real run rather than inherit the conclusion.

## Why it is filed rather than fixed

The plumbing added by `apps/frontend/vite.projectIdEnv.ts` makes the `PUBLIC_PROJECT_ID` half work in
both shapes: it reads the two project-id keys from the repo root explicitly and writes them into
`process.env`, which SvelteKit's own `loadEnv` then overlays. So the variable this phase introduces is
already immune. The remaining exposure is the OTHER root-only `PUBLIC_*` keys, which is the same
surface as the sibling todo about `envDir`.

## Solution

TBD — candidates, in increasing order of blast radius:

1. Have CI copy the template to `apps/frontend/.env` as well as the repo root.
2. Set `kit.env.dir` (or vite `envDir`) to the repo root, which is the sibling todo and carries a
   secret-exposure consequence that must be settled first.
3. Extend the explicit named-key plumbing to the other keys that need it.

## Resolution

Resolved 2026-09-27; the premise no longer holds at the tip. `apps/frontend/svelte.config.js` sets
`kit.env.dir` to the repo root (`env: { dir: repoRoot }`, with
`repoRoot = fileURLToPath(new URL('../../', import.meta.url))`), so the frontend reads the root
`.env` whatever its cwd. That is candidate 2 above; the secret-exposure concern is settled by
SvelteKit exposing only `PUBLIC_`-prefixed keys through `$env/*/public`. The CI `e2e-tests` and
`e2e-visual` jobs' `cp .env.example .env` therefore reaches the frontend.

The "triggers only on `main`" statement above was also wrong: `.github/workflows/main.yaml` runs on
pushes to `main` and to `ci-evidence/**`, and on pull requests.

The residual CI concern is the placeholder anon and service-role keys that `.env.example` carries.
Plan 165-14 owns that fix in `main.yaml`'s two E2E jobs: it takes the local stack's keys from
`supabase status -o env` and writes them over the placeholders.
