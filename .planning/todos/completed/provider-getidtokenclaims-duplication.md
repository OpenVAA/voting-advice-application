---
created: 2026-08-21T09:30:00.000Z
title: '/api/oidc/token calls provider.getIdTokenClaims, not the helper A-07 fixed — and the only tests pinning it are wiring-only'
area: apps/frontend — auth / OIDC
severity: major
source: Phase 142 (P-2, surfaced by `142-04` Task 3; scope confirmed and widened at `142-06`)
resolves_phase: 142.1
resolved: 2026-08-22
files:
  - apps/frontend/src/routes/api/oidc/token/+server.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts
  - apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts
---

## Problem

**This is the highest-value follow-up of Phase 142.** It has two halves, and the
second was not in `142-04`'s original report.

### Half 1 — the fix does not reach the path production uses

Phase 142's **A-07** split `getIdTokenClaims`'s two failure incidents (an empty
JWK set vs. a kid mismatch) into distinct opaque error codes, so a
misconfiguration is distinguishable from a key rotation. That landed in
`0f8e99a68`, in the **shared helper** `getIdTokenClaims.ts`.

The production token endpoint does not call that helper:

- `apps/frontend/src/routes/api/oidc/token/+server.ts:26` calls
  **`provider.getIdTokenClaims(idToken)`**.
- `providers/idura.ts:114` and `providers/signicat.ts:77` each carry their **own
  duplicated copy** of the logic, including an identical **uncoded**
  `throw new Error(\`Cannot decode ID token: JWK not found: kid=${kid}.\`)` and
  their own `JSON.parse` of the same env var.

So on the real `/api/oidc/token` path the two incidents still collapse into one
indistinguishable failure. **A-07's phase criterion is met** — D-11 E6 asks that
F20-3's two *tests* differ observably, and they now do, against the helper they
exercise — **but the operational benefit does not yet reach production.**

### Half 2 — why the duplication drifted undetected (a fake guard, newly found)

`providers/idura.test.ts:90-91` and `providers/signicat.test.ts:54-55` read:

```ts
it('implements getIdTokenClaims as a function', () => {
  expect(typeof provider.getIdTokenClaims).toBe('function');
});
```

Under a title claiming the method is *implemented*, the assertion checks only
that a property of the object graph is callable. **That is a wiring-only
assertion of exactly the class ASSERT-07 remediates** — it was never part of the
twelve-finding corpus (the 2026-08-11 sweep did not enumerate these two files),
and it is almost certainly *why* the duplicated copies drifted from the helper
without anything going red. Both providers carry the same shape for
`getAuthorizeUrl` and `exchangeCodeForToken` too.

## Solution

Two independent pieces of work; the second is worth doing even if the first is
deferred.

1. **Collapse the duplication.** Have both providers delegate to the shared
   `getIdTokenClaims.ts` helper (or extract the common decrypt→verify→claims
   path), so the coded errors, the lazy env parse and any future hardening reach
   `/api/oidc/token`. Note that `getIdTokenClaims.ts:6`'s parse is already
   deferred to a getter (`0f8e99a68`), so a malformed
   `IDENTITY_PROVIDER_DECRYPTION_JWKS` surfaces as `ERR_JWKS_MALFORMED` rather
   than an uncatchable import-time `SyntaxError`; the provider copies do **not**
   have that property.
2. **Replace the wiring-only provider tests with output assertions** — assert
   the claims a provider actually returns for a known synthetic token, and the
   discriminating error code for each failure branch. Strengthening here is a
   **fresh negative-control pair**, not a carry-over from 139's record: no
   existing test asserts codes on the provider path, so there is nothing to cite
   and both halves must be measured.

## Scheduled

**Promoted to Phase 142.1** (ASSERT-11) on 2026-08-21, ahead of Phase 143 — it is a live gap on an
auth path and the same defect class the milestone is built around. See `.planning/ROADMAP.md`
Phase 142.1 for the six success criteria. This todo stays open until that phase closes; it is the
fuller record and the phase entry points back at it.

## Why it was not fixed in Phase 142

The `142-04` checkpoint approved a surface that named `getIdTokenClaims.ts`
specifically. Widening to the two providers and their test files is a fourth
product change plus a new pair, taken while the phase's evidence protocol was
mid-flight. Recorded rather than absorbed — see the ledger's *"New findings from
`142-04`"* section (P-2) and the F20 remediation annotation in
`.planning/audits/2026-08-11-fake-guard-sweep.md`.

---

## CLOSED — 2026-08-22, by Phase 142.1 (ASSERT-11). Both halves.

Closed only after that phase's gates had actually run, not when its first commit landed.

**Ledger (the evidence, not a summary of it):**
`.planning/phases/142.1-provider-getidtokenclaims-duplication-make-a-07-reach-produc/142.1-NEGATIVE-CONTROL-LEDGER.md`
— **8 pairs · 8 OLD halves measured here · 8 NEW halves measured here · 0 cited · 0 withdrawn.**

**Commit range:** `950c97aa2 … fa5fc5ec7` (product + tests + measurement), plus `c00999a62` and
`f041a74b9` (the gate section) and this phase's closing commits.

### Half 1 — the fix now reaches the path production uses

`950c97aa2` extracted the shared core `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts`
and reduced both provider `getIdTokenClaims` bodies to *core → `authConfig` claim mapping*, with both
catch arms byte-unchanged and **zero** `compactDecrypt` calls left in either provider. `8889be52b`
repointed the third caller (`candidate/preregister/+layout.server.ts`) and **deleted** the standalone
helper, so exactly **one** entry point to decrypt→verify→claim mapping remains in `apps/frontend/src`.
`387c0b653` made the failure-class code visible at `/api/oidc/token` and `/api/oidc/callback` with the
HTTP surface, cookies and catch arms unchanged.

Consequences, each proven rather than asserted:

- An **empty JWK set** and a **kid mismatch** are now distinguishable **on the production path**
  (`ERR_JWKS_EMPTY` vs `ERR_JWK_KID_MISMATCH`) — ledger rows 3 and 4.
- The provider path **inherits the lazy env parse**: a malformed
  `IDENTITY_PROVIDER_DECRYPTION_JWKS` surfaces as `ERR_JWKS_MALFORMED` rather than an uncatchable
  import-time `SyntaxError`. All four shared default options are getters — ledger rows 5 and 6, and
  the repo's first `ERR_JWKS_MALFORMED` assertion anywhere.
- Error messages stay leak-safe as a **failing assertion** rather than a claim: the surfaced message
  carries the *incoming* kid and neither the configured kid, the issuer nor the audience.

### Half 2 — the wiring-only guards are gone

`f8b48347a` (signicat) and `0e0ddcca9` (idura) deleted all **six** `typeof … === 'function'` guards —
`getIdTokenClaims`, `getAuthorizeUrl` and `exchangeCodeForToken` in each provider — and replaced them
with claims deep-equality, per-branch coded-error assertions and real `exchangeCodeForToken`
request-body assertions. `grep -rn "toBe('function')" providers/*.test.ts` returns nothing.

**The blindness this todo suspected was measured, not assumed:** **8 of 8** OLD halves ran GREEN under
a live regression on the pre-collapse tree — not one guard saw the defect its own title promises to
catch — and **8 of 8** NEW halves ran RED, each naming its own strengthened assertion. Eleven
collateral reds were observed across six injection instances and **none** was credited.

### Gates

Five static gates (`yarn test:unit` 167 files / 1670 tests; `yarn lint:check`; `yarn format:check`;
`yarn build`; `yarn workspace @openvaa/frontend check` 2684 files 0/0) and three E2E runs 1× each under
CLAUDE.md's cardinal rule: `yarn test:e2e` **135 passed**, `bank-auth-journey` **115 passed**,
`bank-auth` **8 passed** — zero failed, zero skipped, zero "did not run".

### Residue — named, not silently dropped

Three things this phase deliberately did **not** do, each now a standing todo so its survival is not
mistaken for an oversight:

- `.planning/todos/pending/2026-08-22-edge-function-fourth-idtoken-verifier-copy.md` — the Deno Edge
  Function's fourth copy of the same path (a named runtime boundary, not an oversight).
- `.planning/todos/pending/getidtokenclaims-negative-tests.md` — the missing bad-signature / wrong-issuer
  / wrong-audience negative tests, **repointed** at the new core and widened to the provider path rather
  than duplicated.
- `.planning/todos/pending/2026-08-22-preregister-layout-server-has-no-unit-test.md` — the repoint's only
  evidence is an E2E project, because that route has no unit test.

Also filed from the same phase:
`.planning/todos/pending/2026-08-22-bank-auth-journey-setup-header-contradicts-config.md` and
`.planning/todos/pending/2026-08-22-format-check-gate-red-on-branch-hooks-bypassed.md`.

### Propagation

`.planning/audits/2026-08-11-fake-guard-sweep.md` § *Post-sweep addendum* records the new guard class
**and** the fact that the 2026-08-11 sweep never enumerated these two files — framed as a finding about
the sweep's own reach, since that omission is the likeliest reason the duplication drifted undetected.
