---
phase: 122-e2e-specs-bank-auth-round-trip
plan: 03
subsystem: testing
tags: [playwright, oidc, bank-auth, idura, mock-issuer, https, webserver, jose, jwe]

# Dependency graph
requires:
  - phase: 122-01
    provides: shared buildTestIdToken util (parameterized iss/aud) + fixed test key pair (testKeys.ts) — getTestKeys/sigPubJwk/encPubJwk consumed by the mock issuer
provides:
  - Option-B local mock OIDC issuer (authorize/token/JWKS over HTTPS, 127.0.0.1-only) — createMockOidcIssuer
  - Runnable webServer entrypoint (mockOidcIssuerEntry.ts) + committed self-signed localhost cert/key
  - bank-auth-journey Playwright project + data-setup/teardown entries + mock-issuer webServer (all PLAYWRIGHT_BANK_AUTH-gated, opt-in-isolated)
  - EFLOW-10b frontend-server IDP env propagation + scoped-TLS run procedure in IDURA-TEST-RUNBOOK.md
affects: [122-04, 122-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Option-B mock OIDC issuer at the env-pointed network seam — real authorize→exchange→decrypt→claims chain runs UNMODIFIED (no MOCK_MODE branch in prod auth code; Option C rejected/LOCKED)"
    - "Self-signed HTTPS localhost issuer (CN=127.0.0.1) + scoped NODE_TLS_REJECT_UNAUTHORIZED=0 for the frontend-server process only — resolves the hard-coded https:// reachability for BOTH the browser and server legs (A3/Pitfall 2)"
    - "iss/aud alignment via the mock reading IDENTITY_PROVIDER_ISSUER / PUBLIC_IDENTITY_PROVIDER_CLIENT_ID from its own env at token-mint time (Pitfall 4)"
    - "Opt-in Playwright project stands alone (own setup, NOT threaded into the perm serial chain) + conditional webServer spread gated on PLAYWRIGHT_BANK_AUTH"
    - "Scoped .gitignore negation to track a TEST-ONLY committed cert/key under the blanket *.pem rule"

key-files:
  created:
    - tests/tests/support/mockOidcIssuer.ts
    - tests/tests/support/mockOidcIssuerEntry.ts
    - tests/tests/support/mock-oidc-cert.pem
    - tests/tests/support/mock-oidc-key.pem
  modified:
    - tests/playwright.config.ts
    - tests/IDURA-TEST-RUNBOOK.md
    - .gitignore

key-decisions:
  - "Resolved A3/Pitfall 2 with Option (a): HTTPS issuer (committed self-signed CN=127.0.0.1 cert) + scoped NODE_TLS_REJECT_UNAUTHORIZED=0 — the only path that reaches the mock over the hard-coded https:// from BOTH the browser authorize leg and the server fetch leg"
  - "webServer wired as a conditional spread (...(PLAYWRIGHT_BANK_AUTH ? { webServer } : {})) so it never spawns in the default suite; readiness probe uses ignoreHTTPSErrors for the self-signed cert"
  - "Added a scoped .gitignore negation (!tests/tests/support/mock-oidc-*.pem) rather than git add -f, so the TEST-ONLY cert is cleanly tracked and shared across machines/CI"
  - "IDURA_CLAIMS in the issuer reuse the EFLOW-10 TEST_IDENTITY shape but with a distinct sub (test-bank-auth-journey-sub-001) so the journey's auth.users row never collides with the EFLOW-10 spec's probe user"

requirements-completed: []

# Metrics
duration: ~5min
completed: 2026-06-17
---

# Phase 122 Plan 03: Option-B Mock OIDC Issuer + bank-auth-journey Wiring Summary

**Built the Option-B local mock OIDC issuer (authorize/token/JWKS over HTTPS, 127.0.0.1-only, reusing the shared `buildTestIdToken` + fixed test keys), wired the opt-in-isolated `bank-auth-journey` Playwright project + setup/teardown entries + a gated `webServer` that spawns it, and documented the EFLOW-10b frontend-server IDP env propagation + scoped-TLS run procedure — resolving the three highest-uncertainty build-time decisions (A3 HTTPS reachability, Pitfall 1 env propagation, Pitfall 4 iss/aud alignment) up front. This unblocks 122-04 (setup/teardown + page-object) and 122-05 (journey spec).**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-17T11:26:07Z
- **Completed:** 2026-06-17T11:30:38Z
- **Tasks:** 3
- **Files modified:** 7 (4 created, 3 modified)

## Accomplishments

- **Task 1 — Mock OIDC issuer (A3/Pitfall 2/Pitfall 4).** `createMockOidcIssuer` serves three
  routes over HTTPS: `GET /oauth2/authorize` (decodes the signed JAR `request` param with
  `jose.decodeJwt` — decode, not verify — and 302s to `${redirect_uri}?code=test-code&state=${state}`
  echoing state for the callback's state-cookie check), `POST /oauth2/token` (returns
  `{ id_token }` via the shared `buildTestIdToken` with iss/aud read from
  `IDENTITY_PROVIDER_ISSUER`/`PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`), and `GET .../jwks`
  (`{ keys: [sigPubJwk] }`, kid `test-sig-1`). Binds `127.0.0.1` only. `mockOidcIssuerEntry.ts`
  is the runnable webServer entrypoint (fixed port 9443, ready line, SIGINT/SIGTERM shutdown).
  Committed self-signed cert/key (CN=127.0.0.1, SAN IP:127.0.0.1+DNS:localhost). A live smoke
  probe confirmed all three routes work over HTTPS and the minted id_token decrypts + verifies
  against the test keys with aligned iss/aud (`SMOKE_OK`).
- **Task 2 — Project + webServer wiring (Pitfall 3/A4).** Added `data-setup-bank-auth-journey`,
  `data-teardown-bank-auth-journey`, and `bank-auth-journey` projects (own `testMatch`, own
  `storageState: { cookies: [], origins: [] }`, `dependencies: ['data-setup-bank-auth-journey']`)
  inside a `PLAYWRIGHT_BANK_AUTH`-gated block, standing ALONE (NOT in the perm serial chain). Added
  a `webServer` entry (conditional spread, gated) spawning `tsx mockOidcIssuerEntry.ts` with an
  `ignoreHTTPSErrors` readiness probe on the JWKS URL. Confirmed `playwright test --list` WITHOUT
  the env var does NOT surface `bank-auth-journey` (`OPTIN_ISOLATED_OK`); no existing project's
  dependencies changed.
- **Task 3 — Runbook (Pitfall 1/Pitfall 2).** Appended a distinct `## EFLOW-10b` section to
  `IDURA-TEST-RUNBOOK.md` (kept below the EFLOW-10 section, not merged): the full IDP env table the
  SvelteKit server reads (`IDURA_DOMAIN=127.0.0.1:9443`, signing/decryption JWKS derived from
  `testKeys.ts`, iss/aud aligned), a derive-and-export helper writing a sourceable
  `/tmp/eflow10b.env`, the scoped `NODE_TLS_REJECT_UNAUTHORIZED=0` (frontend process only) with
  explicit TEST-ONLY / never-leak-to-prod scoping, and the two-terminal run procedure (the mock
  issuer auto-spawns via `webServer`).

## Task Commits

Each task was committed atomically:

1. **Task 1: Mock OIDC issuer + cert** — `66d8b7b45` (feat)
2. **Task 2: bank-auth-journey project + webServer** — `74e8a684b` (feat)
3. **Task 3: EFLOW-10b runbook section** — `aa5ade93e` (docs)

## Files Created/Modified

- `tests/tests/support/mockOidcIssuer.ts` (created) — `createMockOidcIssuer` factory; 3-route HTTPS issuer, 127.0.0.1-only, reuses `buildTestIdToken` + `getTestKeys`.
- `tests/tests/support/mockOidcIssuerEntry.ts` (created) — runnable webServer entrypoint (port 9443, ready line).
- `tests/tests/support/mock-oidc-cert.pem` / `mock-oidc-key.pem` (created) — committed self-signed localhost cert/key (TEST-ONLY).
- `tests/playwright.config.ts` (modified) — `bank-auth-journey` project + setup/teardown + gated `webServer`.
- `tests/IDURA-TEST-RUNBOOK.md` (modified) — appended `## EFLOW-10b` run procedure.
- `.gitignore` (modified) — scoped negation tracking the TEST-ONLY cert/key under the blanket `*.pem` rule.

## Decisions Made

- **A3/Pitfall 2 resolved with HTTPS + scoped TLS bypass.** `idura.ts` hard-codes the `https://`
  prefix for both the browser authorize leg and the server fetch leg, so the issuer MUST serve
  HTTPS. Used a committed self-signed CN=127.0.0.1 cert + `NODE_TLS_REJECT_UNAUTHORIZED=0` scoped to
  the frontend-server process only (documented as never-leak-to-prod).
- **Pitfall 4 resolved by env-reading at mint time.** The token endpoint reads
  `IDENTITY_PROVIDER_ISSUER`/`PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` from its own process env (not
  hard-coded), so iss/aud always match the server's `jwtVerify` provided both processes share the env.
- **Distinct `sub` for the journey identity** (`test-bank-auth-journey-sub-001`) so the journey's
  created `auth.users` row is isolated from the EFLOW-10 spec's probe user.
- **`.gitignore` negation over `git add -f`** — keeps the TEST-ONLY cert cleanly tracked and
  documents the threat disposition (T-122-09 accept) inline.

## Deviations from Plan

### Auto-fixed / adapted

**1. [Rule 3 - Blocking] `.pem` files were gitignored by the blanket `*.pem` rule**
- **Found during:** Task 1 (committing the cert/key).
- **Issue:** `.gitignore:8` (`*.pem`, a prod-key safety default) matched the TEST-ONLY localhost
  cert/key the plan REQUIRES committed.
- **Fix:** Added a scoped negation (`!tests/tests/support/mock-oidc-cert.pem` / `-key.pem`) with an
  inline comment documenting the test-only / never-trust-store / T-122-09-accept disposition. Did NOT
  use `git add -f` (leaves the ignore in place perpetually). The cert/key are now cleanly tracked.
- **Files modified:** `.gitignore`
- **Committed in:** `66d8b7b45`

**2. [Rule 3 - Blocking] Typecheck/lint target adaptation (inherited from 122-01/02)**
- The `tests/` dir has no `@openvaa/tests` workspace; typechecked via `npx tsc --noEmit -p tests/tsconfig.json`
  and linted via `npx eslint <file>` for every per-task verify. Both exit 0 after every task.

**3. [Lint] func-style + unused-disable fixups in the entrypoint**
- The first `mockOidcIssuerEntry.ts` draft used an arrow `const shutdown = ...` (the repo's
  `func-style` rule wants a function declaration) and an unneeded `no-console` disable on a
  `console.error` line. Fixed to a `function shutdown()` declaration and removed the stray disable;
  re-lint clean. Folded into the Task 1 commit.

## Verify-not-fully-green note (NOT a blocker for this plan)

The plan's Task 2 `<verify>` runs `playwright test --list` WITHOUT the env var and asserts
`bank-auth-journey` is absent — that passed (`OPTIN_ISOLATED_OK`). The opt-in `--list` (WITH
`PLAYWRIGHT_BANK_AUTH=1`) exits 1, but this is a **pre-existing, unrelated** throw: the EFLOW-10 spec
`candidate-bank-auth.spec.ts:49` throws at module-load when `SUPABASE_ANON_KEY` is absent (the
documented hard blocker at `playwright.config.ts:34`). With dummy anon/service keys present the config
loads cleanly (137 tests vs 131 default; the +6 are the EFLOW-10 bank-auth tests). The new
`bank-auth-journey` project matches 0 spec files until 122-05 lands its spec — Playwright does not
error on an empty project. The full browser journey itself is plan 122-05's deliverable, not this
plan's (per-task verifies here are typecheck/structural/smoke-probe only, as the plan scoped).

## Threat Flags

None new. The issuer binds 127.0.0.1-only and is PLAYWRIGHT_BANK_AUTH-gated (T-122-08 mitigated);
the scoped TLS bypass is documented as never-leak-to-prod (T-122-07 mitigated); the committed cert is
TEST-ONLY localhost, never trust-store-installed (T-122-09 accept). No production auth code touched
(T-122-06 mitigated — the mock lives entirely at the env-pointed network seam). No new packages
(T-122-SC — built from Node built-ins + jose@6.2.1).

## Next Phase Readiness

- **122-04** (setup/teardown + page-object): the `data-setup-bank-auth-journey` /
  `data-teardown-bank-auth-journey` project entries are wired and waiting for their FILES
  (`bank-auth-journey.setup.ts` / `.teardown.ts`). Reuse `perm-not-located-2e2cg` (D-04) + clean the
  journey's `sub` auth user.
- **122-05** (journey spec): the `bank-auth-journey` project matches
  `candidate-bank-auth-journey.spec.ts`; the mock issuer + webServer + the documented EFLOW-10b IDP
  env are all in place for the full browser round-trip. Run the 3× cardinal gate then.
- No blockers.

## Self-Check: PASSED

- Files: FOUND `mockOidcIssuer.ts`, `mockOidcIssuerEntry.ts`, `mock-oidc-cert.pem`, `mock-oidc-key.pem`, `122-03-SUMMARY.md`.
- Commits: FOUND `66d8b7b45` (feat), `74e8a684b` (feat), `aa5ade93e` (docs).
- Verifies: `ISSUER_OK`, `SMOKE_OK` (live 3-route HTTPS probe + decrypt/verify), `GREPS_OK`, `OPTIN_ISOLATED_OK`, `RUNBOOK_OK`. tsc exit 0; eslint exit 0 on all touched files.

---
*Phase: 122-e2e-specs-bank-auth-round-trip*
*Completed: 2026-06-17*
