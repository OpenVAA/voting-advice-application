---
created: 2026-08-29T07:00:00.000Z
title: Thirteen non-null `Deno.env.get(...)!` assertions in the Edge Functions tree — REVIEW-EDGE-02's consequence class under a different operator, invisible to the new guard by design
area: apps/supabase — Edge Functions (identity-callback, invite-candidate, send-email)
severity: medium
source: Phase 155 (edge-function-hardening) Plan 06 sweep — surfaced by Plans 02 and 04, assigned to Plan 06, filed rather than fixed
files:
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/invite-candidate/index.ts
  - apps/supabase/supabase/functions/send-email/index.ts
  - scripts/assert-edge-env-defaults.mjs
---

## Problem

Phase 155 abolished the `Deno.env.get('X') ?? fallback` shape across all seven of its sites and wired
`scripts/assert-edge-env-defaults.mjs` into `lint:check` to hold it abolished. **A second shape with
the same consequence class survives untouched: the non-null assertion.**

Measured 2026-08-29 at HEAD `f1f575b62` — **13 assertions across 8 lines in 3 files**:

```
apps/supabase/supabase/functions/identity-callback/index.ts:54   JSON.parse(Deno.env.get('IDENTITY_PROVIDER_DECRYPTION_JWKS')!)
apps/supabase/supabase/functions/identity-callback/index.ts:72   const jwksUri = Deno.env.get('IDENTITY_PROVIDER_JWKS_URI')!;
apps/supabase/supabase/functions/identity-callback/index.ts:238  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
apps/supabase/supabase/functions/identity-callback/index.ts:318  const siteUrl = Deno.env.get('SUPABASE_URL')!.replace(/\/+$/, '');
apps/supabase/supabase/functions/invite-candidate/index.ts:65    createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { … })
apps/supabase/supabase/functions/invite-candidate/index.ts:103   createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
apps/supabase/supabase/functions/send-email/index.ts:96          createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { … })
apps/supabase/supabase/functions/send-email/index.ts:131         createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
```

Reproduce with:

```bash
git grep -nP "Deno\.env\.get\([^)]*\)\s*!" -- apps/supabase/supabase/functions
```

**Why this is the same consequence class as REVIEW-EDGE-02.** `!` is a TypeScript type assertion with
no runtime component. When the variable is unset the expression evaluates to `undefined` and the
failure surfaces one or more frames later as an unnamed `TypeError` or a `SyntaxError` — never as a
message naming the variable. The whole point of the seven `requireEnv` throws Phase 155 landed is
that a misconfigured deployment says *which* variable it is missing. These eight lines still say
`Cannot read properties of undefined` or `Unexpected token u in JSON at position 0`.

Line `:54` is the sharpest case: `JSON.parse(undefined!)` throws `SyntaxError: "undefined" is not
valid JSON`, which names neither the variable nor the fact that it is a configuration problem, on the
JWE-decryption path of a publicly reachable endpoint served `--no-verify-jwt`.

**The new guard does not see these, and that is deliberate.** `scripts/assert-edge-env-defaults.mjs`
check 1 matches `Deno.env.get(...)` followed by `??` or `||`. A non-null assertion is a different
operator, so the guard reports 0 violations over a tree that still contains 13 of these. That is the
correct scope for the guard as written — it is not a bug in the guard — but it means nothing will
flag this class in the meantime.

## Solution

**Do the two non-platform variables first.** They are the ones whose absence is a real deployment
mistake rather than an impossibility:

| Line | Variable | Why first |
|---|---|---|
| `identity-callback/index.ts:54` | `IDENTITY_PROVIDER_DECRYPTION_JWKS` | operator-supplied secret; unset today produces a `SyntaxError` from `JSON.parse` |
| `identity-callback/index.ts:72` | `IDENTITY_PROVIDER_JWKS_URI` | operator-supplied URL; unset today produces a fetch failure against `undefined` |

Both become `requireEnv('IDENTITY_PROVIDER_DECRYPTION_JWKS', Deno.env.get('IDENTITY_PROVIDER_DECRYPTION_JWKS'))`
using the existing `./envConfig.ts` helper already imported in that file. The throw surfaces at the
outer catch arm, which logs the real error and returns a fixed opaque string — verified by Plan 03 —
so the variable name does not reach the HTTP response body.

**The platform-injected trio has a different risk profile, per the function's own docstring.**
`identity-callback/index.ts:23-24` records that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
*"auto-set by Supabase"*; `SUPABASE_ANON_KEY` is injected by the same mechanism. An unset value there
means the Supabase runtime itself is broken, not that an operator forgot something, so converting
them buys a better message for a case that should not occur. Worth doing for uniformity, but not
worth doing first, and worth a comment saying which of the two classes each site is in — otherwise
the next reader cannot tell a deliberate exemption from an oversight.

**Consider extending the guard** with a fourth check once the conversion lands, so the class stays
closed. The existing check-1 machinery (whole-file scan, comment exclusion via
`scripts/lib/comment-spans.mjs`, line number derived from match index) applies unchanged; only the
pattern differs.

## Related

- `.planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-PORT-LOCALHOST-SWEEP.md` § 7
- `.planning/REQUIREMENTS.md` REVIEW-EDGE-02 — the criterion this class sits beside without being covered by
- `scripts/assert-edge-env-defaults.mjs` — the guard whose check 1 this shape evades
- `apps/supabase/supabase/functions/identity-callback/envConfig.ts` — `requireEnv`, already imported at every site that needs it
- Window 161 (`.planning/WINDOWS.md`) — `identity-callback/index.ts:318` is *also* a dead binding, so that one line is best removed rather than converted
