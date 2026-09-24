---
created: 2026-08-29T07:20:00.000Z
title: Two silent connection-target defaults in apps/supabase tooling — the SQL linter and the k6 benchmark config each substitute a loopback target for a missing env var
area: apps/supabase — schema linter and benchmark harness
severity: low
source: Phase 155 (edge-function-hardening) Plan 06 repo-wide port/loopback sweep — found by re-running the sweep rather than transcribing 155-RESEARCH's bucket A, which did not contain these
files:
  - apps/supabase/scripts/lint-schema.mjs
  - apps/supabase/benchmarks/k6/config.js
---

## Problem

The repo-wide sweep Phase 155 ran for `REVIEW-EDGE-02` found two silent connection-target defaults
that **`155-RESEARCH.md`'s bucket A did not contain**. Its bucket A enumerated eight hits, all under
`packages/dev-seed/src` plus one Edge Function site and one frontend mock; `apps/supabase/scripts/`
and `apps/supabase/benchmarks/` were outside the shape it searched.

Measured 2026-08-29 at HEAD `f1f575b62`:

```
apps/supabase/scripts/lint-schema.mjs:25
  const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

apps/supabase/benchmarks/k6/config.js:12
  export const SUPABASE_URL = __ENV.SUPABASE_URL || 'http://127.0.0.1:54321';
```

Reproduce with:

```bash
git grep -nIP '(process\.env|__ENV)\.[A-Z_]+ *(\?\?|\|\|)' -- apps/supabase/scripts apps/supabase/benchmarks
```

**Same class as REVIEW-EDGE-02, lower blast radius.** Both are developer tooling run by hand rather
than deployed code, so the consequence of a wrong target is a misleading result rather than a
misdirected user. But the failure is silent in the same way: an operator who meant to lint or
benchmark a remote instance and whose environment variable did not reach the process gets a clean,
plausible, wrong answer with no signal that it came from somewhere else.

`lint-schema.mjs` is the sharper of the two. It backs `yarn db:lint:sql`, whose live-database half is
already **pre-existing red** on three named PL/pgSQL warnings — so an operator debugging that redness
against a different database is exactly the person this default will mislead, and the failure looks
like a schema disagreement rather than a connection-target disagreement.

**The embedded credentials in `lint-schema.mjs:25` (`postgres:postgres`) are the Supabase CLI's
published local defaults**, not a secret, and are not the concern here. The concern is the host.

## Solution

Both take the same two-route choice as [[2026-08-29-dev-seed-silent-supabase-url-defaults]], and it
should be made once for all four sites rather than separately:

**(a) Throw naming the variable** — consistent with the seven Edge Function sites Phase 155 landed,
but it forces every local `yarn db:lint:sql` and every local benchmark run to export a variable that
is correct by default today.

**(b) Keep the default and make it loud** — a one-line `console.warn` naming the variable and the
target being used when the variable is unset, so the operator sees where the connection went. For
manually-invoked tooling that writes its result to a terminal the operator is already reading, this
gets nearly all the value at nearly none of the cost.

Route (b) is the better fit here. Whichever is chosen, use `127.0.0.1` rather than `localhost` —
these two sites already agree on that spelling, and `config.toml:93` (`api_url = "http://127.0.0.1"`)
is the source of truth they should match. The dev-seed pair does **not** agree with itself; see the
related item.

## Related

- [[2026-08-29-dev-seed-silent-supabase-url-defaults]] — the same class in `packages/dev-seed`, and the two should be decided together
- `.planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-PORT-LOCALHOST-SWEEP.md` § 4 bucket A and § 8 (the deviation that produced this fifth todo)
- `.planning/REQUIREMENTS.md` REVIEW-EDGE-02 — the criterion whose disposition rule routes these to a filed anchor
- `.planning/WINDOWS.md` window 17 — `yarn db:lint:sql` pre-existing red, the state that makes `lint-schema.mjs`'s wrong-target risk concrete
