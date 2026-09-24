---
created: 2026-08-22T09:05:00.000Z
title: 'candidate/preregister/+layout.server.ts has no unit test, so its ID-token repoint got no negative-control pair'
area: apps/frontend — auth / OIDC / test coverage
severity: medium
source: Phase 142.1 (D-02c — the reason the repoint's only evidence is an E2E project)
files:
  - apps/frontend/src/routes/candidate/preregister/+layout.server.ts
  - apps/frontend/src/lib/api/utils/auth/providers/index.ts
  - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
---

## Problem

`apps/frontend/src/routes/candidate/preregister/+layout.server.ts` has **no unit test at all**.

Phase 142.1 repointed its ID-token call from the deleted standalone helper to
`getActiveProvider().getIdTokenClaims(idToken)` (`8889be52b`). The route does real work on that
result — on `!claims.success` it **deletes the `id_token` cookie** with a specific option set
(`httpOnly`, `secure`, `sameSite: 'strict'`, `path: '/'`) and returns `{ claims: undefined }`; on
success it narrows to `firstName` / `lastName` only. None of that is asserted anywhere at the unit
level.

**The consequence is recorded rather than glossed:** every other site the collapse touched got a
freshly measured negative-control pair (8 pairs, both halves, in
`142.1-NEGATIVE-CONTROL-LEDGER.md`). This one got **none**, because there was no assertion to make
blind and then make sighted. Its only evidence is the `bank-auth-journey` E2E project, which walks
`preregister → /api/oidc/authorize → mock IdP 302 → /api/oidc/callback` end to end — real evidence,
but coarse: it exercises the **success** path and would not notice the cookie-deletion branch
regressing.

Writing the test *inside* Phase 142.1 would have been the coverage addition D-05 explicitly puts out
of scope (ASSERT-11 remediates assertions that exist; it does not write missing ones), which is why
this is filed rather than absorbed. **The omission was reasoned, not accidental** — that reasoning is
the point of this todo.

## Solution

A small server-load unit test in the frontend's vitest setup, asserting **observable output**, not
wiring:

1. No `id_token` cookie → returns `{ claims: undefined }` and deletes nothing.
2. `getIdTokenClaims` fails → `cookies.delete('id_token', …)` called **with the full option set**
   (a bare "delete was called" assertion is the wiring-only shape this milestone exists to remove),
   and `{ claims: undefined }` returned.
3. `getIdTokenClaims` succeeds → returns **exactly** `{ claims: { firstName, lastName } }` — asserting
   the narrowing, so a future change that leaks the whole claims object fails.
4. `preRegistration.enabled` false → 303 redirect to `CandAppLogin`.

Assert against the shared core's coded failures where relevant, so the test cannot pass on an uncoded
throw.

## Related

- Ledger: `.planning/phases/142.1-provider-getidtokenclaims-duplication-make-a-07-reach-produc/142.1-NEGATIVE-CONTROL-LEDGER.md`
- Sibling coverage gap on the same path: `.planning/todos/pending/getidtokenclaims-negative-tests.md` (D-05)
- Repoint commit: `8889be52b`
