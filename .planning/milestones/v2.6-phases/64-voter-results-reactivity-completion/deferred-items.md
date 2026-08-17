# Phase 64 — Deferred Items

Out-of-scope discoveries logged during plan execution. NOT fixed by this phase; surfaced for
future planning.

## Plan 64-02 — 2026-04-27

### Pre-existing supabase SQL lint warnings (unrelated)

Running `yarn lint:check` exits non-zero because `@openvaa/supabase#lint` reports SQL "warning
extra" findings — `never read variable "p_key"` in `public.is_localized_string` and unused
parameters in `public.resolve_email_variables`. These pre-date Phase 64 and are not caused by
Plan 64-02 (which makes ZERO source-code changes outside `.planning/`). The supabase package
runs `fail-on=warning` in its lint config, so any "warning extra" promotes to a CI failure.

**Impact on Plan 64-02:** none. Plan 64-02's scope is empirical disambiguation of D-08 shapes
3+4 plus a no-op production code branch. The full unit test suite passes (646/646), the
targeted Playwright invocation passes 5/5 deterministically, and the D-01 acceptance gate
passes (0 svelte imports in `packages/filters/src/`). The supabase lint failure is unrelated
infrastructure debt that surfaces whenever `yarn lint:check` runs across the workspace.

**Recommended follow-up:** add a small chore phase to either (a) clean up the unused parameters
in those SQL functions, or (b) configure the supabase lint to exempt the specific warning
classes, depending on which is easier to verify against the upstream supabase migration history.

**Verification snapshot at Plan 64-02 close:**

```
yarn workspace @openvaa/supabase lint
→ exits 1 with "fail-on is set to warning, non-zero exit"
→ findings: never read variable "p_key" + 2 unused parameters in 2 SQL functions
```
