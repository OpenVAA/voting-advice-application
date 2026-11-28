---
created: 2026-08-20T12:00:01.000Z
updated: 2026-08-22T09:20:00.000Z
title: The ID-token verify path has no negative tests for bad signature / wrong issuer / wrong audience
area: testing / coverage
severity: major
source: Phase 142 discussion A2 (D-05, D-19 ii); scope widened to the provider path by Phase 142.1 (D-05)
files:
  - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts
  - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts
---

## ⚠ Repointed 2026-08-22 — this todo used to name a module that no longer exists

As filed on 2026-08-20 this todo's `files:` list named
`apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts` and its test file. **Phase 142.1 deleted
that module** (`8889be52b`): its logic became the shared core `decryptAndVerifyIdToken.ts`, its test
file was `git mv`-renamed onto the core, and both OIDC providers now reach the core rather than
carrying their own copies.

The gap this todo records **did not close** — it *widened*, because the same missing coverage now
applies to the provider path that production actually calls. So the todo is **repointed and its scope
widened**, not duplicated: Phase 142.1's D-05 explicitly required updating this record rather than
filing a near-twin against the new module names.

## Problem

The ID-token verify path covers **key-lookup** failures well and **validation** failures not at all.

What exists today (after Phase 142.1):

- `decryptAndVerifyIdToken.test.ts` — 5 tests: three payload tests plus two coded-failure tests
  (`ERR_JWKS_EMPTY`, `ERR_JWK_KID_MISMATCH`), the second also carrying the leak-safety assertion.
- `providers/idura.test.ts` (16) and `providers/signicat.test.ts` (15) — claims deep-equality, all
  three coded failure branches (`ERR_JWKS_EMPTY`, `ERR_JWK_KID_MISMATCH`, `ERR_JWKS_MALFORMED`), and
  real `exchangeCodeForToken` output assertions.

What is missing, at **every** level — core and both providers:

1. A token signed with a key **not in the JWKS** → signature verification failure.
2. A token whose **`iss`** does not match the configured issuer.
3. A token whose **`aud`** does not match the configured audience.

Originally recorded at `139-VERDICTS.md` § 7 limit 6.

This is a **coverage gap, not a fake guard** — which is exactly why both Phase 142 and Phase 142.1
declined it. ASSERT-07 and ASSERT-11 remediate assertions that *exist*; neither writes missing ones.
But an ID-token validator with no negative test for signature, issuer or audience is a real hole: a
regression that stopped verifying any of the three would pass the whole suite, and after the collapse
that single regression would reach **both** providers and every production call site at once.

## Solution

Add three negative tests, each asserting the **discriminating** failure rather than
`result.success === false` — the collapse gives you coded errors to assert on, so use them and add new
codes if the three validation failures do not currently discriminate:

1. Token signed with a key not in the JWKS → signature failure.
2. Token whose `iss` does not match the configured issuer.
3. Token whose `aud` does not match the configured audience.

Write them on the **core** (`decryptAndVerifyIdToken.test.ts`) — one copy now covers every caller,
which is the dividend of the 142.1 collapse — and add per-provider cases only where the provider's own
catch-arm mapping is what is under test.

Each addition wants a negative-control pair to be worth anything: inject the corresponding weakening
(skip signature verification / drop the `issuer` option / drop the `audience` option) and confirm the
new test goes red naming its own assertion. `142.1-NEGATIVE-CONTROL-LEDGER.md` is the shape to follow.

Belongs in a coverage-focused phase alongside any other auth-path gaps — notably
`.planning/todos/pending/2026-08-22-preregister-layout-server-has-no-unit-test.md`, which is the same
path's other untested site.

## Related

- Phase 142.1 ledger: `.planning/phases/142.1-provider-getidtokenclaims-duplication-make-a-07-reach-produc/142.1-NEGATIVE-CONTROL-LEDGER.md`
- The collapse: `950c97aa2`, `8889be52b`
- The fourth copy this coverage would still not reach:
  `.planning/todos/pending/2026-08-22-edge-function-fourth-idtoken-verifier-copy.md`
