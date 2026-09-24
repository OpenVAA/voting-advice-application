---
created: '2026-08-28T00:00:00.000Z'
title: CI writes the repo-root .env, but the frontend dev server reads apps/frontend/.env
area: infra
priority: high
files:
  - .github/workflows/main.yaml
  - apps/frontend/vite.config.ts
  - .env.example
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
