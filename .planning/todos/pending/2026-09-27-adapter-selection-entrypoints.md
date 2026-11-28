---
created: 2026-09-27
title: Adapter-selection entrypoints — static-settings adapter choice, lazy Supabase modules, adapter self-registration and hooks
area: frontend
severity: follow-up
files:
  - apps/frontend/src/lib/api/dataProvider.ts (re-exports `SUPABASE_COOKIE_PREFIX` and `createSupabaseUniversalClient` from `$lib/supabase/universal`)
  - apps/frontend/src/lib/api/dataWriter.ts (`createDataWriter` always builds a `SupabaseDataWriter`)
  - apps/frontend/src/lib/api/feedbackWriter.ts (the feedback-writer entrypoint)
  - apps/frontend/src/lib/supabase/ (the client factories: `anon.ts`, `browser.ts`, `job.ts`, `server.ts`, `universal.ts`)
  - apps/frontend/src/routes/+layout.server.ts, apps/frontend/src/routes/(voters)/(located)/+layout.server.ts, apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.server.ts, apps/frontend/src/routes/admin/(protected)/question-info/+layout.server.ts (route loaders importing `SUPABASE_COOKIE_PREFIX` from `$lib/api/dataProvider`)
---

## Source

PR #880 (`ship/v2.15-05-frontend-lib`), review thread 4105438045 on
`apps/frontend/src/lib/api/dataProvider.ts:1`, by the maintainer (`kaljarv`). The comment asks for the
work and then defers it: "let's do this on a follow up phase after the initial ship". Phase 165
records it as `deferred` (165-CONTEXT D-03) and makes no code change for it. The ledger row is
C-4105438045 in `.planning/phases/165-review-stack-comment-remediation/165-LEDGER.md`.

## Requirements

The complete list from the comment, plus the client move that phase 165 attached to this work (D-08):

1. The data provider, writer and feedbackWriter entrypoints check `staticSettings` for the adapter and use the local one when it is chosen.
2. Supabase modules are lazy-loaded depending on the chosen adapter.
3. Consider moving adapter registration to a build-time module or env.
4. Each adapter registers its own capabilities.
5. Adapters register hooks, so route loaders stop importing adapter-specific values such as `SUPABASE_COOKIE_PREFIX` from `$lib/api/dataProvider`. The comment's example:

   ```ts
   import { SUPABASE_COOKIE_PREFIX } from '$lib/api/dataProvider';
   ```

6. Move the Supabase client factories under `apps/frontend/src/lib/supabase/` and `Locals.supabase` behind the adapter. Until then, the client-type alias that plan 165-06 introduces (re-exported from the Supabase adapter instead of importing `@openvaa/supabase-types` directly) is the interim boundary (165-CONTEXT D-08, 165-RESEARCH assumption A6).

## Related pending todos

- `2026-08-28-reintroduce-the-local-data-adapter.md` — requirement 1 needs the local adapter to exist on the client side.
- `2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md` — the route-side Supabase auth code that requirement 5's hooks would absorb.
- `2026-08-28-hooks-supabase-handle-parameterisation.md` — `hooks.server.ts`'s Supabase handle, which requirement 6 moves behind the adapter.
- `2026-08-28-admin-login-supabase-independence.md` — the admin login's direct Supabase dependency.
- `adapter-package-loading.md` — the earlier package-based adapter loading idea, which overlaps requirement 3.

## Note (2026-10-02, Phase 167)

The `/api/cache` proxy was removed in Phase 167 (commit `837b895c4`), together with `cachifyUrl`, the `CACHE_*` and `PUBLIC_CACHE_ENABLED` settings and the `flat-cache` dependency. Any cache for static-data deployments should be designed together with the local adapter rather than restored from the removed route. This todo stays open.
