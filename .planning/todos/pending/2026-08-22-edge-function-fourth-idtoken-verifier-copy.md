---
created: 2026-08-22T09:00:00.000Z
title: The Deno Edge Function carries a fourth copy of the decrypt→verify→claims path, outside the 142.1 collapse
area: apps/supabase — identity-callback Edge Function / OIDC
severity: medium
source: Phase 142.1 (D-03 — a NAMED boundary of the collapse, not an oversight)
files:
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
---

## Problem

Phase 142.1 collapsed **three** copies of the ID-token decrypt→verify→claims path in
`apps/frontend/src` onto one shared core (`decryptAndVerifyIdToken.ts`). A **fourth** copy survives,
in the Deno Edge Function: `apps/supabase/supabase/functions/identity-callback/index.ts:62,70-92`.

**This is filed so its survival is not later read as something Phase 142.1 missed.** It was named
and excluded on purpose (D-03), on grounds that are structural rather than convenient:

- **Separate runtime.** The Edge Function runs on Deno inside supabase-edge-runtime; it cannot import
  from `apps/frontend/src` and there is no module-sharing seam between the two today.
- **Its own hardening.** The Edge Function has its own error handling and its own threat surface; it
  is not a stale duplicate of the frontend copies so much as a peer implementation.
- **It already points at the frontend copies.** Its comment at `:81` names the frontend's equivalent
  verifier, and Phase 142.1 repointed that comment at the new core (`8889be52b`) rather than letting
  it dangle at the deleted `getIdTokenClaims.ts`.

So the duplication is **acknowledged and cross-referenced**, not silent. What is still true is that a
future hardening of `decryptAndVerifyIdToken.ts` — a new coded failure class, a leak-safety tightening,
a change to the JWKS lookup order — does **not** automatically reach this fourth copy, and nothing
fails when the two drift. That is the same property that let the three frontend copies drift in the
first place (Phase 142 P-2).

## Solution

Not "collapse it too" — that would need a cross-runtime module-sharing decision this todo does not
prejudge. Options, roughly in increasing cost:

1. **A drift guard.** A test that asserts the Edge Function and the core agree on the coded failure
   classes for the same synthetic inputs. Cheapest thing that makes divergence loud.
2. **A shared source of truth for the codes alone** (`ERR_JWKS_EMPTY` / `ERR_JWK_KID_MISMATCH` /
   `ERR_JWKS_MALFORMED`), published in a form both runtimes can consume.
3. **A genuine shared module**, which needs a Deno-consumable build of the core and a decision about
   where that build lives.

## Related

- Ledger: `.planning/phases/142.1-provider-getidtokenclaims-duplication-make-a-07-reach-produc/142.1-NEGATIVE-CONTROL-LEDGER.md`
- The collapse itself: `950c97aa2`, `8889be52b`
- `bank-auth` (the opt-in E2E project) exercises **this** Edge Function directly and never touches the
  frontend provider path — which is why Phase 142.1 recorded it as non-regression cover rather than as
  evidence.
