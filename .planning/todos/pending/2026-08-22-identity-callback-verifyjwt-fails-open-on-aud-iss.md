---
created: 2026-08-22T16:00:00.000Z
title: identity-callback's verifyJwt fails OPEN on audience/issuer — the unfixed half of CR-01, on a publicly reachable endpoint
area: apps/supabase — identity-callback Edge Function / OIDC
severity: high
source: Phase 142.1 security audit (UF-01) — confirmed open, deliberately outside the fix brief
files:
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts
---

## Problem

`apps/supabase/supabase/functions/identity-callback/index.ts:70-91` builds its verify options
conditionally:

```ts
const verifyOptions: jose.JWTVerifyOptions = {};
if (clientId) { verifyOptions.audience = clientId; }
// …same shape for issuer
```

When either env var is unset the option is **omitted entirely**, and jose then performs *neither* a
presence check *nor* a value comparison for that claim
(`jose/dist/webapi/lib/jwt_claims_set.js:101-121`: presence is pushed only when the option is
`!== undefined`; the value is compared only under `if (audience && …)` / `if (issuer && …)`).

**This is the same defect class as CR-01, and it is worse than the version Phase 142.1 fixed.** The
frontend's pre-fix behaviour was `?? ''`, which at least kept jose's *presence* check alive. Omitting
the option drops that too. Measured on the frontend before its fix: a token carrying
`iss=https://evil-idp.example` and `aud=some-other-clients-id` was **ACCEPTED**; with the options
configured it is rejected `ERR_JWT_CLAIM_VALIDATION_FAILED`.

**Why this one matters more than its frontend twin did:**

- This endpoint is served `--no-verify-jwt` (`tests/README.md:186`) and is **publicly reachable**.
- It **provisions Supabase auth users** — `createUser`, role assignment, magic-link generation.
- The comment at `:85-88` explicitly chooses backward compatibility over failing closed, so the
  current behaviour is deliberate and will not be corrected by accident.

**Phase 142.1 fixed the frontend and left this open** (`3dcfd9b83`, `bc505fa97`). That asymmetry is
the point: the frontend now fails closed on unset `aud`/`iss` while this copy still fails open — a
fresh instance of exactly the two-copy divergence Phase 142.1 existed to eliminate, one layer down.
See [[2026-08-22-edge-function-fourth-idtoken-verifier-copy]], which is the structural cause.

## Solution

Mirror the frontend's fix: fail closed when either value is missing, rather than silently
downgrading verification.

1. Throw or return a coded failure when `clientId` or `issuer` is falsy, instead of omitting the
   option. Keep the response opaque to the caller — `42f463688` already established that bar for
   this file.
2. Decide the deployment story first: check whether any environment actually runs without
   `IDENTITY_PROVIDER_CLIENT_ID` / `IDENTITY_PROVIDER_ISSUER` set. The `:85-88` comment implies at
   least one did. Failing closed will break such an environment loudly — which is the intent, but it
   should be a knowing change, not a surprise.
3. **Testing is the hard part, and it is why this was not just fixed inline.** `index.ts` imports
   from `deno.land` / `esm.sh` URLs, so only `claimConfig.ts` is vitest-reachable; there is no
   in-tree harness that can drive the HTTP arms. Either extract `verifyJwt` into a URL-import-free
   module beside `claimConfig.ts` (the pattern that file already establishes), or add a Deno test
   task. Without one of those, any fix here is verified by inspection only — the same weakness
   recorded as UF-05.

## Related

- `.planning/phases/142.1-provider-getidtokenclaims-duplication-make-a-07-reach-produc/142.1-SECURITY.md` — UF-01, and UF-03/UF-04 for the lower-severity siblings
- `.planning/phases/142.1-provider-getidtokenclaims-duplication-make-a-07-reach-produc/142.1-REVIEW.md` — CR-01 with the measurement, and the orchestrator's provenance note
- The frontend fixes to mirror: `bc505fa97` (coded failures) and `3dcfd9b83` (guard made structural,
  after the first attempt turned out to be positional and untested in the position it occupied)
