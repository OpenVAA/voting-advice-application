---
phase: 122-e2e-specs-bank-auth-round-trip
plan: 01
subsystem: testing
tags: [playwright, vitest, jose, jwe, oidc, bank-auth, idura, testids]

# Dependency graph
requires:
  - phase: prior-bank-auth-spec
    provides: in-spec buildTestIdToken/generateTestKeys + candidate-bank-auth.spec.ts probe harness
provides:
  - Shared parameterized buildTestIdToken util (iss/aud params, kid contract test-sig-1/test-enc-1)
  - Fixed committed test key pair (testKeys.ts) — single source of truth for worker + Edge Function + mock issuer
  - decryptionJwks [{...}] array export for the served Edge Function (122-02)
  - candidate.preregister testId block (10 verified raw strings)
affects: [122-02, 122-03, 122-04, 122-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fixed committed test key pair over per-run jose.generateKeyPair for 3x-green determinism (RESEARCH A2/Open-Q3)"
    - "Shared cross-spec token builder in tests/utils with named export, no .js extension"
    - "Vitest util unit tests (tests/utils/**/*.test.ts) coexist with Playwright specs via scoped eslint override"

key-files:
  created:
    - tests/tests/utils/testKeys.ts
    - tests/tests/utils/buildTestIdToken.ts
    - tests/tests/utils/buildTestIdToken.test.ts
  modified:
    - tests/tests/utils/testIds.ts
    - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
    - tests/eslint.config.mjs

key-decisions:
  - "Fixed committed test JWK pair (test-enc-1 enc / test-sig-1 sig) inlined as consts; getTestKeys() imports sigPriv as a jose v6 CryptoKey"
  - "buildTestIdToken parameterizes iss/aud with back-compat defaults (https://test-idp.example.com / test-client-id)"
  - "candidate.preregister testIds added with the 10 raw strings verified directly in the preregister page sources"

patterns-established:
  - "Pattern 1: One token builder + one fixed key pair removes per-run key propagation, the #1 bank-auth flake source"
  - "Pattern 2: Vitest unit tests for tests/ utils are eslint-scoped out of Playwright structure rules"

requirements-completed: [EFLOW-10]

# Metrics
duration: 5min
completed: 2026-06-17
---

# Phase 122 Plan 01: Bank-Auth Shared Test Foundation Summary

**Shared parameterized `buildTestIdToken` JWE id_token builder backed by a fixed committed test key pair (test-enc-1/test-sig-1), plus a `candidate.preregister` testId block — the Wave-0 prerequisite for the EFLOW-10/10b bank-auth round-trip specs.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-17T09:47:52Z
- **Completed:** 2026-06-17T09:52:48Z
- **Tasks:** 3
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments
- Fixed committed test key pair (`testKeys.ts`): enc `test-enc-1` (RSA-OAEP-256) + sig `test-sig-1` (RS256) JWKs, `getTestKeys()` accessor returning `sigPriv` as a jose v6 `CryptoKey`, and a `decryptionJwks` `[{...}]` array for the served Edge Function (122-02). Test-only doc-block (threat T-122-01).
- Shared `buildTestIdToken.ts` (D-03): extracted verbatim from the spec, parameterized `iss`/`aud` with back-compat defaults, kid contract preserved. Backed by a 4-case vitest round-trip test (decrypt + verify) proving the builder works against the fixed keys.
- `candidate.preregister` testId block with all 10 verified raw strings; `candidate-bank-auth.spec.ts` de-duplicated to import the shared util + keys (in-spec `buildTestIdToken`/`generateTestKeys` removed, ~57 lines deleted).

## Task Commits

Each task was committed atomically:

1. **Task 1: Add fixed committed test key pair (testKeys.ts)** - `681e3c509` (feat)
2. **Task 2 (TDD): Extract + parameterize buildTestIdToken** - `71ff6a8ec` (test, RED) → `8956ecf12` (feat, GREEN)
3. **Task 3: candidate.preregister testIds + dedupe spec builder** - `e05043710` (feat)

_TDD Task 2: RED (failing test) → GREEN (implementation). No refactor commit needed — implementation was minimal._

## Files Created/Modified
- `tests/tests/utils/testKeys.ts` (created) - Fixed enc/sig JWK pair + `getTestKeys()` + `decryptionJwks` array; test-only.
- `tests/tests/utils/buildTestIdToken.ts` (created) - Shared parameterized JWE id_token builder (D-03).
- `tests/tests/utils/buildTestIdToken.test.ts` (created) - Vitest round-trip test (4 cases): claims, default iss/aud, explicit opts, kid contract.
- `tests/tests/utils/testIds.ts` (modified) - Added `candidate.preregister` block (10 keys).
- `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` (modified) - Removed in-spec builder/keys; imports shared utils; `beforeAll` uses `getTestKeys()`.
- `tests/eslint.config.mjs` (modified) - Scoped Playwright structure rules out of vitest util unit tests.

## Decisions Made
- Inlined fixed JWKs (generated once locally via `jose.generateKeyPair`) rather than per-run generation, per RESEARCH A2/Open-Q3 — the determinism-preferred path for the 3×-green gate.
- `getTestKeys()` returns `sigPriv` via `jose.importJWK(..., 'RS256')` cast to `CryptoKey` (jose v6 removed the `KeyLike` alias).
- Left the EFLOW-10 retarget + deterministic-green gate (D-02) for 122-02 as the plan scoped — this plan only stops the duplication so the spec compiles against the shared util.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted the verify command's typecheck target**
- **Found during:** Task 1 (and all subsequent verifies)
- **Issue:** The plan's automated verify invokes `yarn workspace @openvaa/tests exec tsc ...`, but the `tests/` directory has no `package.json` and no `@openvaa/tests` workspace exists; the tests dir is typechecked via its own `tests/tsconfig.json`.
- **Fix:** Ran the equivalent `npx tsc --noEmit -p tests/tsconfig.json` (the canonical way the tests dir is typechecked) for every per-task verify. The verify intent (zero net-new type errors in touched files) was satisfied unchanged.
- **Files modified:** none (verification-command adaptation only)
- **Verification:** `tsc --noEmit -p tests/tsconfig.json` exits 0 on a clean baseline and after every task.
- **Committed in:** n/a (no source change)

**2. [Rule 3 - Blocking] Scoped Playwright eslint structure rules out of vitest util unit tests**
- **Found during:** Task 2 (TDD RED — linting the new vitest test)
- **Issue:** `tests/eslint.config.mjs` applies `eslint-plugin-playwright`'s `flat/recommended` rules to all `**/*.ts`. The new vitest unit test (`buildTestIdToken.test.ts`) uses vitest `describe`/`it`/`expect`, which the Playwright plugin misclassifies (`no-standalone-expect` errors) because it only recognizes Playwright `test()` blocks. Without this, the TDD test the plan mandates cannot lint clean.
- **Fix:** Added a scoped eslint override for `**/utils/**/*.test.ts` disabling `no-standalone-expect`, `expect-expect`, `no-conditional-in-test`, `no-conditional-expect` (the Playwright structure rules) for vitest util unit tests only. Playwright spec rules elsewhere are untouched.
- **Files modified:** `tests/eslint.config.mjs`
- **Verification:** `npx eslint tests/utils/buildTestIdToken.test.ts` exits 0; Playwright spec linting unchanged.
- **Committed in:** `71ff6a8ec` (Task 2 RED commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking)
**Impact on plan:** Both were verification/tooling adaptations required to satisfy the plan's own verify + TDD mandate. No source-behavior scope creep — the three task artifacts are exactly as specified.

## Issues Encountered
None — planned work proceeded cleanly. The two items above were tooling-environment adaptations (deviation Rule 3), not problems within planned work.

## User Setup Required
None - no external service configuration required for this plan. (122-02 will document the Edge Function test-JWKS env + run command for the EFLOW-10 green gate.)

## Next Phase Readiness
- 122-02 (EFLOW-10 green gate): consume `getTestKeys()` + `decryptionJwks` to set `IDENTITY_PROVIDER_DECRYPTION_JWKS`, retarget assertions to the Idura sub-match model, drop the keys-configured `test.skip`.
- 122-03 (mock issuer): import `buildTestIdToken` (with explicit `opts.issuer`/`opts.audience`) + `sigPubJwk` for the JWKS endpoint.
- 122-04 / 122-05 (journey support + spec): drive the new `testIds.candidate.preregister` keys from the candidate-preregister page-object.
- No blockers.

## Self-Check: PASSED

---
*Phase: 122-e2e-specs-bank-auth-round-trip*
*Completed: 2026-06-17*
