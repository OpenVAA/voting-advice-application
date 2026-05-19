---
created: 2026-05-15T12:16:56.375Z
title: Refactor package scripts so db-prefixed scripts only affect the db
area: tooling
priority: high
files:
  - package.json
  - CLAUDE.md
---

## Problem

The current `db:*` scripts in root `package.json` bundle non-db concerns into their chains, breaking the principle-of-least-surprise that "db:X should only touch the database":

- `yarn db:reset` runs `supabase:reset && dev:clean` (db reset + **Vite cache wipe**)
- `yarn db:reset-with-data` runs `supabase:reset && db:seed && dev:clean` (db reset + seed + **Vite cache wipe**)
- `yarn db:start` runs `build + supabase start + dev` (db start + **package build + frontend dev server**)

Two concrete pain points already observed:

1. **Yarn arg-forwarding caveat (documented in CLAUDE.md)**: `yarn db:reset-with-data --likert-only` does NOT forward `--likert-only` to `db:seed` — yarn appends trailing args to the LAST command in the `&&` chain (which is `dev:clean`). The canonical workaround is to spell out the chain manually:
   ```bash
   yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean
   ```
   This was hit during Phase 87 Path A diagnosis (variant-multi-election cascade investigation, 2026-05-15) where a Likert-only cold-start was needed for manual e2e inspection.
2. **Mental model break**: A user running `yarn db:reset` reasonably expects only the database to change. Wiping the Vite cache is a side effect that surprises and complicates scripting — it also means `db:reset` cannot be composed safely inside a script that needs to control Vite cache lifetime separately.

The deprecated `dev:*` aliases (preserved through v2.10 per CLAUDE.md) already encode the right separation conceptually (`dev:clean` for Vite cache, `dev:start` for full dev orchestration). The `db:*` scripts should mirror that purity.

## Solution

Refactor root `package.json` so `db:*` scripts ONLY invoke Supabase / database operations. Move composite orchestration to differently-prefixed scripts (or document them as explicit chains).

Proposed surface (subject to discussion in plan-phase):

- `db:reset` → `supabase db reset` only (no `dev:clean`)
- `db:reset-with-data` → `supabase db reset && db:seed --template default` (no `dev:clean`)
- `db:start` → `supabase start` only (no build, no frontend)
- New `dev:up` (or rename existing `db:start`) → composite: build + `db:start` + frontend dev server
- New `dev:reset` (or use existing alias) → composite: `db:reset` + `dev:clean`
- Keep `db:seed`, `db:seed:teardown`, `db:status`, `db:stop`, `db:down`, `db:types`, `db:lint:sql` as pure db ops

Side benefits:

- Fixes the yarn arg-forwarding caveat for `db:reset-with-data --likert-only` automatically (the new pure `db:reset-with-data` only ends in `db:seed`, so trailing args land on the right command).
- Removes a documented footgun from CLAUDE.md.
- Lets composite scripts be deprecated/renamed without breaking pure-db consumers.

### Coordination notes

- v2.10 milestone-close (Phase 87) is in-flight as of capture date — do NOT land this mid-milestone-close. Queue for v2.11 or post-v2.10-ship.
- Deprecated `dev:*` aliases are preserved through v2.10; this refactor may overlap with the v2.10+ alias-removal sweep.
- Update CLAUDE.md "Supabase Commands" + "Seeding local data" sections in the same phase. The "Yarn arg-forwarding caveat" paragraph becomes obsolete after the fix.
- Verify all CI / docs / Playwright setup files that invoke `yarn db:*` still work (mainly `apps/supabase/`, `tests/`, GitHub Actions if any).
- Capture context: surfaced during 2026-05-15 Phase 87 Path A manual e2e re-run on `feat-gsd-roadmap`.
