---
created: 2026-10-02
title: Deployment templates omit PUBLIC_PROJECT_ID; unused FRONTEND_URL vars; orphan frontend compose file; buckets only in local config
area: deployment
severity: follow-up
source: Phase 168 (docs-site rewrite), 168-04 findings F1, F2, F5, F6, filed by plan 168-08
related_phase: 168
files:
  - render.example.yaml
  - docker-compose.dev.yml
  - apps/frontend/docker-compose.dev.yml
  - apps/frontend/src/lib/utils/constants.ts
  - .env.example
  - apps/supabase/supabase/config.toml
  - apps/supabase/supabase/schema/400-storage.sql
---

## Why this exists

Phase 168 rewrote the Deployment and Environment variables pages from the code. It is docs-only (D-18), so where the configuration
templates disagreed with what the code needs, the pages tell the operator what to do and the configuration gap was recorded. Every item
was re-checked at the 168-08 HEAD. Item 1 is the most likely to break a real deployment.

## Items

### 1. Neither deployment template passes `PUBLIC_PROJECT_ID` (168-04 F1). Likely breaking

- `render.example.yaml` lists `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_DEBUG`, `PUBLIC_LOG_LEVEL` and the frontend URL
  pair. The production-test `docker-compose.dev.yml` lists the same set. `git grep -n PUBLIC_PROJECT_ID -- render.example.yaml docker-compose.dev.yml`
  exits 1.
- The Supabase adapter throws at construction when the value is empty:
  `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` has `PUBLIC_PROJECT_ID is required but not set.`
- So a service built from either template as written would fail on its first Supabase read. This was not run, so it is UNCONFIRMED.
  The Deployment page tells operators to add the variable.
- **Fix:** add `PUBLIC_PROJECT_ID` to both templates. The value is the project row the deployment's data lives under, which is the
  bootstrap project `00000000-0000-0000-0000-000000000001` for a single-tenant install. Then update CLAUDE.md § Deployment (see
  `2026-10-01-claude-md-stale-claims-found-by-docs-rewrite.md`, item 3).

### 2. `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL` have no consumer (168-04 F2)

- They are declared in `.env.example`, `render.example.yaml` (`# Check value after deployment`), `docker-compose.dev.yml` and
  `apps/frontend/src/lib/utils/constants.ts` (`PUBLIC_BROWSER_FRONTEND_URL: env.PUBLIC_BROWSER_FRONTEND_URL ?? '',`). Outside
  `constants.ts` they appear only in test mocks:
  `git grep -n -E 'PUBLIC_(BROWSER|SERVER)_FRONTEND_URL' -- apps/frontend/src` lists `constants.ts` and five test files.
- Whether they are reserved for future use or dead is UNCONFIRMED. The Environment variables page lists them without claiming a
  consumer. **Decide:** remove them from all four places, or wire them where an absolute frontend URL is built (for example the auth
  `redirectTo`).

### 3. `apps/frontend/docker-compose.dev.yml` is referenced by nothing (168-04 F5)

- It runs the Dockerfile's `development` target (`apps/frontend/Dockerfile`: `FROM frontend AS development`) with source volume mounts
  and a `./data` local-data mount. `git grep -n -l 'frontend/docker-compose.dev.yml' -- ':!.planning'` exits 1: no script, workflow or
  document uses it.
- It looks like a remnant of the Docker development stack, and the `./data` mount belongs to the unwired local adapter. Whether anyone
  still uses it is UNCONFIRMED. The docs do not describe it. **Decide:** delete it, together with the `development` Dockerfile target if
  nothing else uses that, or document it.

### 4. The Storage buckets exist only in the local `config.toml` (168-04 F6)

- `apps/supabase/supabase/schema/400-storage.sql` creates only the policies for `public-assets` and `private-assets`. The buckets
  themselves are declared only in `apps/supabase/supabase/config.toml` (`[storage.buckets.public-assets]`,
  `[storage.buckets.private-assets]`), which the hosted platform does not read. `git grep -n -E 'INSERT INTO storage\.buckets' -- apps/supabase/supabase/schema`
  exits 1.
- A hosted project therefore needs the buckets created by hand, and no repository script does it. The Deployment page states the
  manual step. **Option:** a migration that inserts the two buckets idempotently, or a deploy script. Either is a code-phase item.
