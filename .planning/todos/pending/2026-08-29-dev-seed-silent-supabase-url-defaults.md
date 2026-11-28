---
created: 2026-08-29T07:05:00.000Z
title: dev-seed silently defaults an unset SUPABASE_URL to a loopback origin at two live sites — and the two disagree on the loopback spelling
area: packages/dev-seed — CLI and admin client
severity: medium
source: Phase 155 (edge-function-hardening) Plan 06 repo-wide port/loopback sweep — same defect class as REVIEW-EDGE-02, different package, out of phase scope
files:
  - packages/dev-seed/src/supabaseAdminClient.ts
  - packages/dev-seed/src/cli/seed.ts
---

## Problem

`REVIEW-EDGE-02` abolished the "missing configuration silently substituted with a host" shape inside
the Edge Functions. **The identical shape is live in `@openvaa/dev-seed`, at two sites, and this
phase did not touch it** — different package, outside the criterion's scope.

Measured 2026-08-29 at HEAD `f1f575b62`:

```
packages/dev-seed/src/supabaseAdminClient.ts:31
  const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';

packages/dev-seed/src/cli/seed.ts:184
  const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
```

Reproduce with:

```bash
git grep -nP "process\.env\.SUPABASE_URL\s*(\?\?|\|\|)" -- packages/dev-seed/src
```

**Why it matters.** `yarn db:seed` writes rows. An operator who exports a remote `SUPABASE_URL` in
one shell and runs the seed in another gets no error — the seed succeeds, against the local
instance, and the operator has no signal that it went somewhere other than where they meant. That is
exactly the "a misconfiguration becomes a wrong result rather than an error" argument that
`envConfig.ts`'s docstring makes for the Edge Functions. The blast radius here is smaller (a
developer machine rather than a deployment) but the failure mode is identical, and it is silent in
both directions.

**The two sites also disagree with each other on the loopback spelling** — one says `localhost`, the
other `127.0.0.1`. On a machine where `localhost` resolves to `::1` before `127.0.0.1` these are not
the same address, and the Supabase CLI binds v4. So the two defaults are not merely duplicated, they
can behave differently, and nothing in the tree records which one is intended. (This exact
v6-before-v4 shape is what `CLAUDE.md`'s E2E preflight section describes as a wildcard shadow-bind.)

**Two further sites in the same package are deliberately NOT part of this item**, and are recorded as
NO ACTION in the sweep so their absence here is legible rather than an omission:

- `packages/dev-seed/src/cli/teardown.ts:178` — the same `??` expression inside an error message
  (`Cannot reach Supabase at ${…}. Is 'supabase start' running?`). Printing the **effective** URL is
  the diagnostic's entire purpose.
- `packages/dev-seed/src/writer.ts:66`, `src/cli/help.ts:36`, `src/cli/teardown-help.ts:24` — help
  text and format examples.

## Solution

Two routes, and the choice is a real one rather than obvious:

**(a) Throw, matching the Edge Functions.** Most consistent with what Phase 155 just decided, and it
makes the failure name the variable. But `yarn db:seed` against a local Supabase is the overwhelmingly
common case, and requiring every developer to export `SUPABASE_URL` for it is a real ergonomic cost
that the Edge Function sites do not have to weigh.

**(b) Keep a default but make it loud and single-sourced.** One shared constant — spelled
`http://127.0.0.1:54321`, matching `config.toml`'s `api_url` and the majority spelling in the tree —
consumed by both sites, with a `console.warn` on the line naming the variable and the URL being used
when the variable is unset. The operator gets the convenience and a visible signal.

Route (b) is the better fit for a developer-tooling package, but it is a decision, not a default.
**Whichever is chosen, the two spellings must converge**; leaving one `localhost` and one
`127.0.0.1` is not defensible under either route.

`packages/dev-seed/tests/supabaseAdminClient.test.ts` and `tests/cli/teardown.test.ts` already
exercise these modules and will need the corresponding boundary cases (unset, empty string) pinned —
`requireEnv`'s missing-set of exactly `{undefined, ''}` is the precedent, and its test file
(`apps/supabase/supabase/functions/invite-candidate/envConfig.test.ts`) is worth copying the shape of.

## Related

- `.planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-PORT-LOCALHOST-SWEEP.md` § 4, bucket A
- `.planning/REQUIREMENTS.md` REVIEW-EDGE-02 — the criterion this is the out-of-scope twin of
- `apps/supabase/supabase/functions/invite-candidate/envConfig.ts` — the `requireEnv` shape route (a) would copy
- [[2026-08-29-supabase-tooling-silent-database-url-defaults]] — the same class in `apps/supabase/scripts` and `apps/supabase/benchmarks`
