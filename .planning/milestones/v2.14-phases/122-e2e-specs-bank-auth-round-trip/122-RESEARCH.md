# Phase 122: E2E Specs — Bank-Auth Round-Trip - Research

**Researched:** 2026-06-17
**Domain:** Playwright E2E for OIDC (Idura/Signicat FTN) bank-auth — deterministic, no live IdP. Two specs: Edge-Function seam (EFLOW-10, retarget) + full-browser journey via local mock OIDC issuer (EFLOW-10b, new).
**Confidence:** HIGH (all production seams, the existing spec, the Playwright DAG, the seed registry, and package versions verified against the live codebase this session)

## Summary

Phase 122 has two complementary deliverables, both gated on `PLAYWRIGHT_BANK_AUTH=1`, both deterministic (no live IdP, no real network), both must pass 3×:

1. **EFLOW-10 — retarget `candidate-bank-auth.spec.ts` to Idura-only and make it deterministically green.** The spec already POSTs a synthetic JWE id_token directly to the `identity-callback` Edge Function (no browser, no live IdP). The two changes are: (a) assert the Idura claim model (`sub`-based identity match, `hetu`/`country`/`birthdate` extra claims) and drop Signicat assertions; (b) make the keys-configured create path run EVERY time by configuring `IDENTITY_PROVIDER_DECRYPTION_JWKS` to the test `encPrivJwk` so the probe's `keysConfigured` branch is taken deterministically (today it's env-gated and skips → a "did not run" is a cardinal failure). `buildTestIdToken` is extracted to a shared util (D-03).

2. **EFLOW-10b — NEW full-browser self-registration journey via an Option-B local mock OIDC issuer.** The real OIDC code→token exchange and JWE decryption run in the **SvelteKit Node server** (callback `+server.ts` → `provider.exchangeCodeForToken()`; `+layout.server.ts` → `getIdTokenClaims()`), NOT the browser — so `page.route()` cannot stub them. Option B (LOCKED) stands up a tiny local HTTP issuer serving authorize/token/JWKS, points the existing env vars at it, and runs the real authorize→callback→exchange→decrypt→claims→preregister chain UNMODIFIED. The journey then drives election → constituency → email + ToU → `preregister()` → registration-key email → set password → logged-in.

**Primary recommendation:** Build EFLOW-10 first (smaller, lower-risk; only assertion retarget + a `beforeAll` JWKS configuration). For EFLOW-10b, seed with the existing **`perm-not-located-2e2cg`** template (2 elections × 2 disjoint CGs × 2 COs — the only existing shape that forces BOTH the election AND the constituency selector to render), spawn the mock issuer as a Playwright `webServer` entry, and set the Idura env vars test-side to point at it. The decisive architectural fact (verified): there is currently **NO Playwright `webServer`** in the config and **NO `globalSetup`** — the SvelteKit Node dev server is launched manually (`yarn dev`), so EFLOW-10b must set the IdP-pointing env vars in the SAME process environment that runs the SvelteKit server, which has a concrete consequence documented in Pitfall 1.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Synthetic JWE id_token construction (test) | Test process (Node, `jose`) | — | `buildTestIdToken` runs in the Playwright worker; shared util consumed by both the EFLOW-10 spec and the EFLOW-10b mock issuer's token endpoint. |
| OIDC authorize URL (JAR) construction | Frontend Server (SvelteKit Node) | — | `/api/oidc/authorize` `+server.ts` → `iduraProvider.getAuthorizeUrl()` signs the JAR with the server-held signing key; never reaches the browser. |
| Code→token exchange (`private_key_jwt`) | Frontend Server (SvelteKit Node) | — | `/api/oidc/callback` `+server.ts` → `provider.exchangeCodeForToken()` is a server-side `fetch` to the IdP token endpoint. **`page.route()` cannot intercept it** — this is why Option B (env-pointed mock issuer) is required, not browser routing. |
| JWE decrypt + JWT verify (claims) | Frontend Server (SvelteKit Node) | — | `+layout.server.ts` → `getIdTokenClaims()` decrypts with `IDENTITY_PROVIDER_DECRYPTION_JWKS`, verifies against `IDENTITY_PROVIDER_JWKS_URI`, validates `IDENTITY_PROVIDER_ISSUER`. |
| User/candidate create + magic-link session | API / Backend (Supabase Edge Function) | DB | `identity-callback` Edge Function decrypts again (its own copy of jose), matches by `identity_match_value`, creates `auth.users` + `candidates` + `user_roles`, returns `session.action_link`. |
| Election/constituency/email/ToU UI | Browser (SvelteKit client) | Frontend Server (load) | Post-auth `(authenticated)/` pages render client-side from `candCtx.dataRoot` — seed-dependent. |
| Registration-key email → set password → login | Backend (email) + Browser | — | Mailpit (`:54324`) receives the preregister email; the journey extracts the registration key, sets a password, logs in. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.58.2 | E2E runner, project DAG, `webServer` | The whole suite is Playwright; verified via `node -e` on the installed package. `[VERIFIED: node_modules/@playwright/test/package.json]` |
| `jose` | 6.2.1 (frontend) | JWE encrypt/decrypt, JWS sign/verify in the test + mock issuer | Already the production crypto lib; the spec's `buildTestIdToken` uses it (RSA-OAEP-256 enc + RS256 sig). `[VERIFIED: apps/frontend/package.json + node_modules/jose/package.json]` |
| `@supabase/supabase-js` | (catalog) | Admin client in the spec (`createClient`) for candidate/user verification + cleanup | Already imported in `candidate-bank-auth.spec.ts`. `[VERIFIED: spec import]` |

> The Edge Function uses its OWN jose import (`https://deno.land/x/jose@v5.9.6`) — a Deno URL import, NOT the npm package. `[VERIFIED: identity-callback/index.ts:27]` This version skew (v5 in the function, v6 in the frontend/test) is benign for the token shapes used (RSA-OAEP-256 / RS256 / A256GCM) but is worth noting: the synthetic token built with frontend jose v6 must decrypt under function jose v5. The existing spec already exercises exactly this path successfully when keys are configured, so it is proven compatible.

### Supporting (mock OIDC issuer — EFLOW-10b)
| Approach | Purpose | When to Use |
|----------|---------|-------------|
| Node `http.createServer` (built-in) | Tiny authorize/token/JWKS issuer | RECOMMENDED — no new dependency. The issuer needs only 3 trivial routes (302 redirect, JSON token, JSON JWKS); a raw `http` server keeps the package-legitimacy surface at zero. |
| Playwright `webServer` config entry | Spawn the issuer as part of the run | RECOMMENDED over a global-setup spawn — Playwright manages lifecycle (start/wait-for-port/teardown) and `reuseExistingServer`. CONTEXT.md D-01 allows either; `webServer` is the lower-ceremony path. |

**No new npm packages are required.** The mock issuer is built from Node built-ins (`http`) + the already-present `jose`. See Package Legitimacy Audit (it is empty by design).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Option B (env-pointed mock issuer) | Option C (server-side `MOCK_MODE` flag) | REJECTED + LOCKED-OUT by operator: Option C injects a test-only branch into production auth code and skips the real exchange path. Do not propose. |
| Raw `http` issuer | `oauth2-mock-server` / `mock-oidc` npm pkg | A dedicated package adds a slopsquat-surface + a JWKS/issuer-metadata contract you must still wire to `buildTestIdToken`. The 3 routes are trivial; a raw server is less code and zero new deps. |
| Reuse `perm-not-located-2e2cg` (D-04) | New dedicated 2-election data-setup pair | CONTEXT.md D-04 LOCKS reuse-an-existing-2-election-shape. `perm-not-located-2e2cg` is the correct one (see Seed section). |

**Installation:** None. (No new packages.)

## Package Legitimacy Audit

> This phase installs **NO external packages**. The mock OIDC issuer is built from Node built-ins (`http`, `crypto`) plus the already-installed `jose@6.2.1` and `@playwright/test@1.58.2`. There is nothing to audit.

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| (none) | — | — | No new dependencies introduced. |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*If the planner decides during build to pull in a dedicated OIDC-mock package instead of the raw-`http` recommendation, that package MUST go through the Package Legitimacy Gate and be gated behind a `checkpoint:human-verify` task. The research recommendation is to avoid it.*

## Architecture Patterns

### System Architecture Diagram — EFLOW-10 (Edge-Function seam)

```
[Playwright worker]
  buildTestIdToken(IDURA claims, sigPriv, encPubJwk)   ← shared util (D-03)
        │  synthetic JWE (RSA-OAEP-256 / A256GCM, inner RS256 JWT)
        ▼
  POST ${SUPABASE_URL}/functions/v1/identity-callback   (direct fetch — NO browser, NO IdP)
        │   { id_token }
        ▼
[identity-callback Edge Function]  (served --no-verify-jwt)
  decryptJweToken  ──reads──►  IDENTITY_PROVIDER_DECRYPTION_JWKS   ← MUST be set to test encPrivJwk (D-02)
  verifyJwt        ──reads──►  IDENTITY_PROVIDER_JWKS_URI          (remote JWKS of sig key)
  extractIdentityClaims(payload, IDURA config)  → matchValue = sub
  find/create auth.users (app_metadata.identity_match_prop='sub', identity_match_value=<sub>)
  create candidates + user_roles
  generateLink(magiclink) → session.action_link
        │   200 { success, user_id, candidate_id, given_name, family_name, session.action_link }
        ▼
  [spec asserts]  sub-match metadata · hetu/country flow-through · action_link contains token=
```

The reject/CORS paths (`OPTIONS` preflight; missing/invalid id_token → 400/401) stay as-is.

### System Architecture Diagram — EFLOW-10b (full-browser journey via mock issuer)

```
[Playwright browser]                          [SvelteKit Node server (yarn dev :5173)]      [Mock OIDC issuer (webServer)]
  /candidate/preregister
  click preregister-start  ──fetch POST──►  /api/oidc/authorize +server.ts
                                              iduraProvider.getAuthorizeUrl()
                                              signs JAR, sets oidc_state/oidc_nonce cookies
                            ◄──{authorizeUrl}──┘   authorizeUrl → https://<MOCK>/oauth2/authorize?...
  window.location = authorizeUrl ───────────────────────────────────────────────────────►  GET /oauth2/authorize
                                                                                             302 → /api/oidc/callback?code=X&state=<echo>
  browser follows 302 ──────────────────────►  /api/oidc/callback +server.ts
                                              verify state == oidc_state cookie
                                              provider.exchangeCodeForToken() ──server fetch──►  POST /oauth2/token
                                                                                                 returns { id_token: buildTestIdToken(...) }  ← shared util
                                              getIdTokenClaims(idToken):
                                                JWE decrypt (IDENTITY_PROVIDER_DECRYPTION_JWKS)
                                                JWT verify  (IDENTITY_PROVIDER_JWKS_URI) ──fetch──►  GET /.well-known/...jwks  (sig pub key)
                                              set id_token httpOnly cookie; 303 → /candidate/preregister
  /candidate/preregister (claims populated)
  preregister-continue → elections → constituencies → email+ToU
  preregister-email-submit → POST /api/candidate/preregister
                                              invoke identity-callback Edge Function
                                              verifyOtp(action_link token) → session
  registration email → Mailpit (:54324) → extract registrationKey
  /candidate/register?registrationKey=... → set password → logged-in candidate
```

**Env vars the SvelteKit server reads (must point at the mock issuer for EFLOW-10b)** `[VERIFIED: idura.ts + getIdTokenClaims.ts + constants reads]`:
- `IDURA_DOMAIN` — used to build `https://${IDURA_DOMAIN}/oauth2/authorize` and `/oauth2/token`. Set to the mock host (e.g. `127.0.0.1:PORT`). NOTE the provider hard-codes the `https://` prefix and `/oauth2/authorize`|`/oauth2/token` paths — the mock issuer MUST serve those exact paths, and the server will call `https://127.0.0.1:PORT/...` (see Pitfall 2 for the TLS implication).
- `IDURA_SIGNING_JWKS` + `IDURA_SIGNING_KEY_KID` — the server signs the JAR and the `private_key_jwt` client assertion. The mock does NOT validate these (accept-any), but the env vars must be present and internally consistent or `getSigningKey()` throws `Idura signing key not found for kid`.
- `IDENTITY_PROVIDER_DECRYPTION_JWKS` — the private encryption JWK the server uses to JWE-decrypt the id_token. MUST be the private half of the `encPubJwk` the mock's token endpoint encrypts with.
- `IDENTITY_PROVIDER_JWKS_URI` — the server fetches this to verify the inner JWT signature. Point at the mock's JWKS endpoint serving the test signing PUBLIC key.
- `IDENTITY_PROVIDER_ISSUER` + `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` — `jwtVerify` validates `issuer` and `audience`. The synthetic inner JWT (in `buildTestIdToken`) currently sets `iss: 'https://test-idp.example.com'` and `aud: 'test-client-id'` — these MUST match `IDENTITY_PROVIDER_ISSUER` / `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` or verification fails (see Pitfall 4).
- `PUBLIC_IDENTITY_PROVIDER_TYPE=idura` — selects the Idura branch in `redirectToIdentityProvider()` (`+page.svelte:75`) so the browser POSTs to `/api/oidc/authorize` (server JAR path), not the Signicat client-PKCE path.

### Recommended Project Structure (new/changed files)
```
tests/
├── playwright.config.ts                         # ADD bank-auth-journey project + webServer entry
├── tests/
│   ├── specs/candidate/
│   │   ├── candidate-bank-auth.spec.ts           # EFLOW-10: retarget Idura-only + beforeAll JWKS config
│   │   └── candidate-bank-auth-journey.spec.ts   # EFLOW-10b: NEW full-browser journey
│   ├── utils/ (or fixtures/)
│   │   └── buildTestIdToken.ts                    # D-03: extracted shared token builder + generateTestKeys
│   ├── fixtures/candidate/
│   │   └── candidatePreregisterPage.fixture.ts    # NEW page-object for elections→constituencies→email/ToU
│   ├── support/ (new) or setup/
│   │   └── mockOidcIssuer.ts                      # NEW Option-B issuer (authorize/token/JWKS), webServer entry point
│   └── setup/candidate/
│       ├── bank-auth-journey.setup.ts             # NEW: seed perm-not-located-2e2cg + clean auth state
│       └── bank-auth-journey.teardown.ts          # NEW: teardown its prefix + created auth user
```

### Pattern 1: Deterministic-green Edge-Function gate (D-02)
**What:** Configure the Edge Function's decryption secret so the keys-configured create path runs on EVERY run (never the skip branch).
**When to use:** EFLOW-10 — the existing spec's `test.skip(!probe.keysConfigured, …)` must NOT skip.
**Mechanism (two viable wirings — pin one at build):**
- **Preferred — serve the function with an env-file the test writes/points to.** Per `IDURA-TEST-RUNBOOK.md` Step 3 Option A, the local Edge runtime reads UN-prefixed vars and does NOT auto-see root `.env`; serve with `--env-file`. The spec's `beforeAll` already documents `supabase secrets set IDENTITY_PROVIDER_DECRYPTION_JWKS=...` as the intended path (`candidate-bank-auth.spec.ts:147-150`).
- The run procedure must guarantee the function is served with `IDENTITY_PROVIDER_TYPE=idura`, `IDENTITY_PROVIDER_DECRYPTION_JWKS=<test encPrivJwk array>`, `IDENTITY_PROVIDER_JWKS_URI` (the sig-key JWKS — can be the mock issuer's JWKS or any reachable static JWKS), `IDENTITY_PROVIDER_CLIENT_ID=test-client-id` (matching the synthetic token's `aud`).

**Open design point the planner must settle:** the test keys are generated FRESH per run inside `generateTestKeys()` (`jose.generateKeyPair`). For the Edge Function to decrypt them, the function's `IDENTITY_PROVIDER_DECRYPTION_JWKS` must be the SAME key pair the test just generated. Two options:
1. **Fixed test key pair (RECOMMENDED for determinism):** commit a static test JWK pair (enc + sig) under `tests/` and have BOTH `generateTestKeys` (return the fixed pair) AND the served Edge Function env reference it. This removes the "generate fresh, then propagate to a separately-served process" coordination problem entirely and is the cleanest path to 3×-green.
2. **Generate-then-set-secret in `beforeAll`:** generate fresh, then `supabase secrets set`/restart the function in `beforeAll`. Higher flake surface (restart timing) — disfavored under the cardinal rule.

**Run command (documented, from spec header + coverage plan):**
```bash
PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5174 npx playwright test --project=bank-auth -c tests/playwright.config.ts
# with Edge Functions served:  cd apps/supabase/supabase && npx supabase functions serve identity-callback --no-verify-jwt --env-file <env-with-test-JWKS>
```

### Pattern 2: Option-B mock OIDC issuer (EFLOW-10b)
**What:** A tiny local HTTP server faking the three IdP endpoints the SvelteKit server contacts.
**Endpoints (derived from the verified server-side flow):**
- `GET /oauth2/authorize?client_id=…&request=<JAR>` → respond `302` to `<redirect_uri>?code=<any>&state=<the state from the signed JAR or echoed>`. The mock does NOT need to validate the JAR; it must echo back the `state` so `/api/oidc/callback` passes its `returnedState === storedState` check (the state lives in the `oidc_state` httpOnly cookie set by `/api/oidc/authorize`). **Decode the JAR `request` JWT (unverified) to read its `state` and `redirect_uri`** — both are inside the signed request object (`idura.ts:56-68`), not query params.
- `POST /oauth2/token` → respond `200 { id_token: await buildTestIdToken(IDURA_CLAIMS, sigPriv, encPubJwk) }`. Accept-any on the `client_assertion` (no validation).
- `GET /.well-known/...jwks` (whatever path `IDENTITY_PROVIDER_JWKS_URI` is set to) → respond the test signing PUBLIC JWK as `{ keys: [sigPubJwk] }` so the server's `createRemoteJWKSet` can verify the inner JWT.

**When to use:** EFLOW-10b only. Spawn via Playwright `webServer`.

### Pattern 3: candidate-preregister page-object (Claude's discretion, D)
**What:** A fixture mirroring the existing candidate page-object convention (`createCandidate*Page(page)` returning step methods; rigidity contract: no `expect.soft`, no try/catch around `expect`, no `.catch(()=>null)`). `[VERIFIED: candidatePasswordSetter.fixture.ts]`
**Testids available (verified in the page sources):**
- `preregister-start`, `preregister-continue`, `preregister-return` (`+page.svelte:140,163,167`)
- `preregister-elections-list`, `preregister-elections-submit` (`elections/+page.svelte:33,41`)
- `preregister-constituencies-list`, `preregister-constituencies-submit` (`constituencies/+page.svelte:31,39`)
- `preregister-email-input`, `preregister-email-confirm`, `preregister-email-submit` (`email/+page.svelte:63,74,86`)
- Register/password: `testIds.candidate.password.field` / `.submit` (`set-password-submit`), `passwordSetter.password`/`.confirm`, `register.submit` (`register-submit`) `[VERIFIED: testIds.ts]`

**Reuse the email round-trip:** `createEmailBucket(page, recipientEmail)` + `toCallbackUrl()` talk directly to Mailpit REST (`:54324`), polling for the preregister email and extracting the link. `[VERIFIED: emailBucket.fixture.ts]` The preregister email template embeds `?registrationKey=<%= candidate.registrationKey %>` (`email/+page.svelte:31`) — the journey extracts `registrationKey` from the received email and navigates to `/candidate/register?registrationKey=…`.

### Anti-Patterns to Avoid
- **`page.route()` to stub the token exchange** — it runs server-side; browser routing cannot see it. (This is the entire rationale for Option B.)
- **A test-only branch in `idura.ts`/`signicat.ts`** — Option C, explicitly rejected + locked-out by operator. Do not add a `MOCK_MODE` env check to production auth code.
- **Leaving the EFLOW-10 keys-configured test env-gated** — a skipped test is a cardinal "did not run" failure. The whole point of D-02 is to make that branch run every time.
- **Per-run fresh keys without propagating to the served Edge Function / mock issuer** — leads to "No matching decryption key found for kid" 401s. Use a fixed test key pair (Pattern 1 option 1).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Synthetic JWE id_token | A new token builder | EXTRACT + reuse `buildTestIdToken` + `generateTestKeys` (D-03) | Already correct (RSA-OAEP-256 enc, A256GCM, RS256 inner JWT); both specs + the mock issuer must share ONE builder. |
| Email retrieval / link extraction | Polling Mailpit yourself | `createEmailBucket` + `toCallbackUrl` (`fixtures/shared/emailBucket.fixture.ts`) | Mature, already used by candidate-journey for the exact registration-email flow. |
| Multi-election seed with selectable constituencies | A new data-setup pair | Reuse `perm-not-located-2e2cg` template via `setupFromTemplate` | D-04 locks reuse; this shape is the one that forces both selector pages (verified topology). |
| Authenticated-candidate verification + cleanup | Raw SQL | `SupabaseAdminClient` + `createClient` admin (already in spec) | The spec's `afterAll` already deletes `user_roles`/`candidates`/`auth.users`. |
| OIDC issuer metadata/JWKS plumbing | A heavyweight OIDC mock lib | Raw `http.createServer` + `jose` (3 routes) | Zero new deps; the server only needs authorize-302, token-JSON, JWKS-JSON. |

**Key insight:** Everything load-bearing already exists in the repo (token builder, email bucket, admin client, multi-election seed, page-object + setup/teardown conventions, the entire serial-DAG wiring grammar). Phase 122 is overwhelmingly *assembly + retarget*, not net-new infrastructure — the only genuinely new artifact is the ~40-line mock OIDC issuer.

## Runtime State Inventory

> EFLOW-10b creates a real `auth.users` + `candidates` + `user_roles` row via the magic-link session. This is runtime state the spec must clean up.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `auth.users` row (identity_match_value=`sub`), `candidates` row, `user_roles` row created by the identity-callback Edge Function for the journey's test identity; `app_settings` singleton clobbered by the `perm-not-located-2e2cg` seed | Teardown: delete the created auth user (cascade) in `bank-auth-journey.teardown.ts`; the perm seed teardown clears its `e2e-perm-notloc-` prefix. EFLOW-10's existing `afterAll` already deletes its probe-created user. |
| Live service config | None — no external service config (mock issuer is ephemeral per-run via `webServer`). | None. |
| OS-registered state | None. | None — verified: no scheduled tasks/daemons involved. |
| Secrets/env vars | EFLOW-10b sets `IDURA_DOMAIN`/`IDENTITY_PROVIDER_*`/`PUBLIC_IDENTITY_PROVIDER_TYPE` test-side for the SvelteKit server process; EFLOW-10 sets `IDENTITY_PROVIDER_DECRYPTION_JWKS` for the served Edge Function. These are TEST-PROCESS env, not committed secrets. | Document the env-set procedure in the spec header + runbook; ensure they do not leak into a default `yarn dev` (only set under the bank-auth-journey run). |
| Build artifacts | None — no compiled package rename. `@openvaa/dev-seed` is already built (consumed by existing perm setups). | None. |

## Common Pitfalls

### Pitfall 1: No `webServer`/`globalSetup` today — env-var propagation to the SvelteKit server
**What goes wrong:** EFLOW-10b sets `IDURA_DOMAIN`/`IDENTITY_PROVIDER_*` to point at the mock issuer, but the **SvelteKit Node server reads those at its own process startup**, not from the Playwright worker. If the dev server (`yarn dev`) was started without those vars, the server still tries to reach the real Idura domain (or throws on a missing signing key) and the journey fails.
**Why it happens:** `tests/playwright.config.ts` has NO `webServer` entry and NO `globalSetup` `[VERIFIED: full config read]` — the frontend is launched manually. The Idura env vars are consumed in `idura.ts`/`getIdTokenClaims.ts` via `$lib/server/constants` at the SvelteKit server, a SEPARATE process from the Playwright worker.
**How to avoid:** The EFLOW-10b run procedure must start the SvelteKit dev server with the IdP-pointing env in ITS environment (e.g. an `.env`/exported vars the `yarn dev` process inherits), and the mock issuer's URL/port must be fixed/known before the server starts. The Playwright `webServer` entry can spawn the mock issuer (a self-contained process needing no app env), but the FRONTEND server's env is the operator's responsibility — document it explicitly (mirror `IDURA-TEST-RUNBOOK.md` structure). Consider adding a dedicated `webServer` for the frontend in this opt-in project only, OR document the manual two-terminal procedure. Pin the mechanism at build.
**Warning signs:** journey redirect lands on `/candidate/preregister?error=token_exchange_failed` or `?error=invalid_token` (the callback's catch branches).

### Pitfall 2: `https://` is hard-coded — the mock issuer is contacted over TLS
**What goes wrong:** `iduraProvider` builds `https://${IDURA_DOMAIN}/oauth2/authorize` and `https://${IDURA_DOMAIN}/oauth2/token` (`idura.ts:65,71,84`). The server-side `exchangeCodeForToken` does `fetch('https://...')`. A plain-HTTP mock issuer is unreachable; a self-signed HTTPS issuer fails Node's cert check.
**Why it happens:** The prefix is not configurable for Idura (unlike Signicat which uses `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT`/`IDENTITY_PROVIDER_TOKEN_ENDPOINT`).
**How to avoid (pin one at build):**
- (a) Serve the mock issuer over HTTPS with a self-signed cert and set `NODE_TLS_REJECT_UNAUTHORIZED=0` (or `NODE_EXTRA_CA_CERTS`) in the SvelteKit server's env — simplest, but a process-wide TLS relaxation.
- (b) **Run EFLOW-10b under the Signicat branch** (`PUBLIC_IDENTITY_PROVIDER_TYPE=signicat`) which reads explicit `*_AUTHORIZATION_ENDPOINT`/`*_TOKEN_ENDPOINT` env (can be plain `http://`) — but CONTEXT.md says retarget to Idura-only, so this conflicts with the phase intent; only consider if (a)/(c) are rejected.
- (c) Map a hosts-file/`IDURA_DOMAIN`-style alias to localhost and serve HTTPS. The browser's authorize redirect (`window.location = https://<mock>/oauth2/authorize`) ALSO needs to reach the mock over HTTPS — the browser leg is the harder constraint and points toward (a)/HTTPS for the issuer regardless.
**Recommendation:** Option (a) — HTTPS mock issuer + scoped `NODE_TLS_REJECT_UNAUTHORIZED=0` for the frontend server process in this opt-in run only. The browser leg also needs the issuer reachable, so HTTPS is required either way; document the env scoping so it never reaches a default run. **This is the highest-uncertainty design point — flag for the planner to resolve early in EFLOW-10b.**

### Pitfall 3: A new spec file alone never runs (serial-DAG grammar)
**What goes wrong:** Dropping `candidate-bank-auth-journey.spec.ts` into `tests/specs/candidate/` runs nothing.
**Why it happens:** Every spec is its own Playwright project with explicit `testMatch` + `dependencies`. `[VERIFIED: playwright.config.ts]`
**How to avoid:** Add a `bank-auth-journey` project (`testMatch: /candidate-bank-auth-journey\.spec\.ts/`, gated on `PLAYWRIGHT_BANK_AUTH`, `dependencies: ['data-setup-bank-auth-journey']`), plus a `data-setup-bank-auth-journey` (seeds `perm-not-located-2e2cg`, `teardown: data-teardown-bank-auth-journey`) and its teardown. Because it seeds a perm-shaped dataset that clobbers the `app_settings` singleton, it must either join the perm serial chain tail OR be opt-in-isolated (it already is, via `PLAYWRIGHT_BANK_AUTH` — like `bank-auth`, opt-in projects pull only their own setup, not the perm family). Pin chain placement at build; the existing `bank-auth` project depends on `data-setup-base` only, so `bank-auth-journey` should similarly stand alone with its own setup, NOT thread into the perm chain.

### Pitfall 4: issuer/audience mismatch in the synthetic token
**What goes wrong:** `jose.jwtVerify` in both `getIdTokenClaims` and the Edge Function's `verifyJwt` validates `issuer`/`audience`. The shared `buildTestIdToken` currently sets `iss: 'https://test-idp.example.com'`, `aud: 'test-client-id'` (`candidate-bank-auth.spec.ts:98-99`).
**Why it happens:** EFLOW-10's Edge Function path may pass `IDENTITY_PROVIDER_CLIENT_ID=test-client-id` (matching). But EFLOW-10b's SvelteKit verify uses `IDENTITY_PROVIDER_ISSUER` and `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` — if those env values don't equal `https://test-idp.example.com` / `test-client-id`, verification fails.
**How to avoid:** Make the shared `buildTestIdToken` accept `iss`/`aud` params (or export the constants) and set the env vars to MATCH. Keep the `kid`s aligned: enc `test-enc-1`, sig `test-sig-1` are baked into the builder; the JWKS endpoint + decryption JWK arrays must carry the same `kid`s (the lookup is `kid`-based in both `getIdTokenClaims` and `decryptJweToken`).
**Warning signs:** 401 "Token verification failed" from the Edge Function; `invalid_token` redirect from the callback.

### Pitfall 5: Two `getIdTokenClaims` implementations
**What goes wrong:** There are TWO claim extractors: the standalone `$lib/api/utils/auth/getIdTokenClaims.ts` (used by `+layout.server.ts`; maps `identifier` to **`birthdate`** and ignores Idura's `sub`/`hetu`/`country`) and the provider's `iduraProvider.getIdTokenClaims` (in `idura.ts`; uses `IDURA_AUTH_CONFIG` → `sub` + extra claims). The callback `+server.ts` calls `provider.getIdTokenClaims()` (correct, Idura-aware); the layout calls the standalone one (legacy, birthdate-based) but only uses `firstName`/`lastName` for display, so it is benign for the journey. `[VERIFIED: both files]`
**How to avoid:** EFLOW-10b only needs `firstName`/`lastName` to populate the success page — the standalone extractor suffices for the layout's display. Do NOT "fix" the standalone extractor as part of this phase (out of scope; would be a production change). Just be aware the layout's `claims.identifier` is birthdate-derived and not asserted by the journey.

## Code Examples

### EFLOW-10 — Idura sub-match assertions (retarget)
```typescript
// Source: candidate-bank-auth.spec.ts:222-228 (existing) — RETARGET to assert sub-based match
const { data: { user } } = await adminClient.auth.admin.getUserById(captured.body.user_id as string);
expect(user?.app_metadata?.identity_provider).toBe('idura');              // was generic toBeTruthy
expect(user?.app_metadata?.identity_match_prop).toBe('sub');              // Idura matches on sub
expect(user?.app_metadata?.identity_match_value).toBe(TEST_IDENTITY.sub); // not birthdate
// Idura extra-claim flow-through (IDURA_AUTH_CONFIG.extractClaims = ['birthdate','hetu','country']):
expect(user?.app_metadata?.hetu).toBe(TEST_IDENTITY.hetu);
expect(user?.app_metadata?.country).toBe(TEST_IDENTITY.country);
expect(user?.app_metadata?.birthdate).toBe(TEST_IDENTITY.birthdate);
```

### Shared token builder (D-03 — extracted, parameterized iss/aud)
```typescript
// Source: candidate-bank-auth.spec.ts:88-111 (move to tests/tests/utils/buildTestIdToken.ts)
// ADD iss/aud params so EFLOW-10b can align them with IDENTITY_PROVIDER_ISSUER / PUBLIC_..._CLIENT_ID.
export async function buildTestIdToken(
  claims: Record<string, string>, sigPriv: CryptoKey, encPubJwk: jose.JWK,
  opts: { issuer: string; audience: string } = { issuer: 'https://test-idp.example.com', audience: 'test-client-id' }
) { /* RS256 inner JWT (kid test-sig-1) → CompactEncrypt RSA-OAEP-256/A256GCM (kid test-enc-1) */ }
```

### Mock OIDC issuer skeleton (EFLOW-10b)
```typescript
// Source: NEW — pattern derived from the verified server-side flow (idura.ts + callback +server.ts)
import http from 'node:http';
import * as jose from 'jose';
import { buildTestIdToken } from '../utils/buildTestIdToken';
// keys: fixed test enc/sig pair shared with the SvelteKit server env (decryption JWK = enc priv; JWKS = sig pub)
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url!, 'https://localhost');
  if (u.pathname === '/oauth2/authorize') {
    // request= is the signed JAR; decode (no verify) to read state + redirect_uri
    const jar = jose.decodeJwt(u.searchParams.get('request')!);
    res.writeHead(302, { Location: `${jar.redirect_uri}?code=test-code&state=${jar.state}` }).end();
  } else if (u.pathname === '/oauth2/token' && req.method === 'POST') {
    const id_token = await buildTestIdToken(IDURA_CLAIMS, sigPriv, encPubJwk,
      { issuer: process.env.IDENTITY_PROVIDER_ISSUER!, audience: process.env.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID! });
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ id_token }));
  } else if (u.pathname.endsWith('/jwks')) {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ keys: [sigPubJwk] }));
  } else { res.writeHead(404).end(); }
});
// served over HTTPS (self-signed) per Pitfall 2; spawned as a Playwright webServer entry.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Signicat (`birthdate` identity match) | Idura (`sub` persistent pseudonym + `hetu`/`country`) | `idura-ftn-auth-plan.md` (2026-03) | EFLOW-10 asserts the Idura claim model; the Edge Function is provider-agnostic via `IDENTITY_PROVIDER_TYPE`. |
| `jose` KeyLike type | `jose` v6 → WebCrypto `CryptoKey` | jose v6 (frontend on 6.2.1) | The extracted builder already types `sigPriv: CryptoKey` (spec comment lines 90-91). |
| Two old per-app perm specs | Consolidated nodes, full perm serial chain | Phase 120-121 | The perm chain tail is now `perm-analytics-tracking`; `bank-auth-journey` stays opt-in-isolated, not threaded into it. |

**Deprecated/outdated:**
- The `apps/frontend/tests/` path for the E2E suite — the suite is at the repo-root `tests/` (coverage-plan §CRITICAL).
- `bare e2e` seed template — retired Phase 93; use `e2e/base` or a named perm template.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `perm-not-located-2e2cg` (2 elections × 2 disjoint CGs × 2 COs) is the right reuse target to force BOTH selector pages | Seed / Don't Hand-Roll | LOW — its header explicitly states "forces both selector pages to render"; verify at build that the candidate-preregister selectors (not just the voter ones) render against it. Fallback: `perm-2e-asymmetric`. |
| A2 | A fixed/committed test key pair is preferable to per-run fresh keys for the EFLOW-10 green gate | Pattern 1 | MEDIUM — affects how `generateTestKeys` is refactored. If the operator prefers fresh keys, the `beforeAll` secret-propagation path (option 2) is the fallback but is flakier. |
| A3 | The mock issuer must be served over HTTPS because `idura.ts` hard-codes `https://` AND the browser authorize leg needs it reachable | Pitfall 2 | HIGH — this is the single biggest implementation uncertainty. If a plain-HTTP path is somehow viable (it is not for the Idura branch as written), the mock is simpler. Resolve EARLY. |
| A4 | `bank-auth-journey` should be an opt-in-isolated project (own setup, like `bank-auth`), NOT threaded into the perm serial chain | Pitfall 3 / Project wiring | LOW — matches the existing opt-in `bank-auth` precedent; verify the `perm-not-located-2e2cg` seed's `app_settings` clobber does not collide with a concurrently-running default suite (it won't, since bank-auth runs are opt-in and separate). |
| A5 | The synthetic inner JWT's `iss`/`aud` must be made to match the server's `IDENTITY_PROVIDER_ISSUER`/`PUBLIC_..._CLIENT_ID` env | Pitfall 4 | LOW — directly verified from `jwtVerify` options in both extractors; the fix is parameterizing the builder. |

**These five assumptions need confirmation/early-resolution during planning — A3 most urgently.**

## Open Questions

1. **HTTPS for the mock issuer (A3).**
   - What we know: `idura.ts` hard-codes `https://${IDURA_DOMAIN}/oauth2/...`; the browser also redirects to that URL; the server-side `fetch` enforces TLS.
   - What's unclear: cleanest way to make a localhost mock reachable over HTTPS for BOTH the browser leg and the server `fetch` leg without a process-wide TLS bypass leaking beyond this opt-in run.
   - Recommendation: self-signed HTTPS mock + `NODE_TLS_REJECT_UNAUTHORIZED=0` scoped to the frontend server process for this run; document env scoping. Resolve in the first EFLOW-10b plan task with a spike if needed.

2. **Frontend env propagation without a frontend `webServer` (Pitfall 1).**
   - What we know: no `webServer`/`globalSetup` exists; `yarn dev` is manual.
   - What's unclear: whether to add a frontend `webServer` entry for this opt-in project or document a manual multi-terminal procedure (matching `IDURA-TEST-RUNBOOK.md`).
   - Recommendation: document the manual procedure first (lowest risk, mirrors the existing runbook + the EFLOW-10 manual run), consider a `webServer` only if it can carry the IdP env cleanly.

3. **EFLOW-10 fixed vs fresh keys (A2).**
   - Recommendation: fixed committed test key pair shared between `generateTestKeys` and the served Edge Function env. Settle in the EFLOW-10 plan.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@playwright/test` | both specs | ✓ | 1.58.2 | — |
| `jose` | token builder + mock issuer | ✓ | 6.2.1 (frontend) | — |
| Supabase local stack (Postgres/Auth/Edge/Mailpit) | both specs | ✓ (per project memory: `-gsd` repo runs clean via host Vite + local Supabase) | — | — |
| `identity-callback` Edge Function served `--no-verify-jwt` | EFLOW-10 (+ EFLOW-10b via `/api/candidate/preregister`) | ✓ (served on demand) | — | — |
| Node `http`/`crypto`/TLS | mock issuer | ✓ (built-in) | Node runtime | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — all required infra is present locally; the only new artifact is in-repo code (mock issuer).

## Validation Architecture

> nyquist_validation is enabled (no `workflow.nyquist_validation: false` found). This is a deterministic E2E correctness phase — the validation IS the deliverable.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 (project-DAG serial wiring) |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth -c tests/playwright.config.ts` (EFLOW-10 only) |
| Full (both) command | `PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth --project=bank-auth-journey -c tests/playwright.config.ts` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EFLOW-10 | Edge-Function round-trip: synthetic Idura JWE → candidate created with `sub`-based `identity_match`, `hetu`/`country` flow-through, magic-link `action_link` | E2E (Edge-Function, direct POST) | `--project=bank-auth` | ✅ retarget `candidate-bank-auth.spec.ts` |
| EFLOW-10 (success-criterion 2: deterministic) | keys-configured create path runs EVERY run (no skip) via `beforeAll` JWKS config | E2E gate | `--project=bank-auth` ×3 | ❌ Wave 0: `beforeAll` JWKS configuration + fixed test keys |
| EFLOW-10b (operator) | full-browser journey: preregister → mock IdP 302 → server exchange+decrypt → authenticated → election → constituency → email+ToU → preregister() → registration-key → set password → logged-in | E2E (browser, mocked IdP) | `--project=bank-auth-journey` | ❌ Wave 0: new spec + mock issuer + page-object + setup/teardown + project wiring |
| EFLOW-10 + 10b (success-criterion: 3×-green, cardinal rule) | both pass 3× on fresh server + clean DB, no live IdP/network | full-suite gate | run ×3 | ❌ verified at phase gate |

### Sampling Rate
- **Per task commit:** the touched project (`--project=bank-auth` or `--project=bank-auth-journey`).
- **Per wave merge:** both bank-auth projects.
- **Phase gate:** both projects pass **3×** on fresh dev server + `yarn db:reset` (cardinal-rule + success-criterion 2). Then confirm the DEFAULT suite (`yarn test:e2e`) still green (the opt-in projects must not perturb it).

### Wave 0 Gaps
- [ ] `tests/tests/utils/buildTestIdToken.ts` — extract + parameterize `buildTestIdToken`/`generateTestKeys` (D-03); both consumers import it.
- [ ] Fixed test key pair (enc + sig JWKs) shared by the test, the served Edge Function env (EFLOW-10), and the mock issuer (EFLOW-10b).
- [ ] `tests/tests/support/mockOidcIssuer.ts` (+ HTTPS cert handling) — Option-B issuer (authorize/token/JWKS).
- [ ] `tests/tests/fixtures/candidate/candidatePreregisterPage.fixture.ts` — elections→constituencies→email/ToU page-object.
- [ ] `tests/tests/setup/candidate/bank-auth-journey.setup.ts` + `.teardown.ts` — seed `perm-not-located-2e2cg` + clean/own the created auth user.
- [ ] `tests/playwright.config.ts` — `bank-auth-journey` project + `data-setup-bank-auth-journey`/teardown + `webServer` for the mock issuer.
- [ ] `candidate-bank-auth-journey.spec.ts` — the new journey spec.

## Security Domain

> `security_enforcement` not disabled in config (absent = enabled). This phase touches the FTN bank-auth flow, but only TEST code + a TEST mock — it must NOT weaken production auth.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | The flow under test IS authentication (OIDC FTN). Control: do NOT add test-only branches to production auth code (Option C rejected); the mock lives entirely in `tests/`. |
| V3 Session Management | yes (observed, not modified) | `id_token` httpOnly+secure+strict cookie; magic-link `verifyOtp` session. The journey asserts the authenticated session lands; it does not alter the cookie contract. |
| V5 Input Validation | yes | `getIdTokenClaims`/`verifyJwt` validate issuer/audience/signature — the synthetic token must satisfy these legitimately (no validation bypass). |
| V6 Cryptography | yes | JWE RSA-OAEP-256 / A256GCM + RS256 via `jose` (never hand-rolled). Test keys are TEST-ONLY and must never reach a non-test env. |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Test-only auth bypass leaking to prod | Elevation of Privilege | Option B (env-pointed mock) chosen specifically to avoid any prod-code branch; LOCKED. |
| `NODE_TLS_REJECT_UNAUTHORIZED=0` leaking beyond the test run | Tampering / Spoofing | Scope the TLS relaxation to the opt-in `bank-auth-journey` frontend-server process only; never in a default `yarn dev`/CI default run. Document explicitly. |
| Test JWK pair committed + reused in prod | Spoofing | Keep test keys under `tests/`, clearly named test-only; production keys come from real env/secrets and are never the committed pair. |

## Project Constraints (from CLAUDE.md)

- **E2E Hard Rule (CARDINAL FAILURE):** no task completes while any E2E test is failing; "did not run" counts as failure. This is the *raison d'être* of D-02 (the EFLOW-10 keys-configured path must RUN, not skip). No "known-flaky" exemptions — the 3× gate is mandatory.
- **Prefer running the whole suite** for interim verification; a full opt-in run (both bank-auth projects) is the trusted signal. Also confirm the default `yarn test:e2e` stays green.
- **TypeScript strict, no `any`;** WCAG 2.1 AA (the journey UI is existing, unchanged — no new a11y surface).
- **Localization:** the journey runs on a locale-prefixed route (`/en/...` per `toCallbackUrl` default `/en/candidate/auth/callback`); assert on testids, not localized strings, per existing candidate-journey precedent.
- **Rigidity contract for specs/fixtures** (per existing candidate fixtures): 0 `expect.soft`, 0 try/catch around `expect`, 0 `.catch(()=>null)` on assertion-bearing interactions.
- **Worktree commit caveat (project memory):** `-gsd` is a linked worktree with a `core.hooksPath=/dev/null` override — plain commits work; if a gsd-tools doc commit is aborted by a hook, use `git commit --no-verify`.
- **E2E execution prereqs (project memory):** one fresh dev server on `:5173` (no Playwright webServer for the frontend; a stale server steals the port) + clean DB (`yarn db:reset`) before the full-suite gate. NOTE this interacts with EFLOW-10b's need for IdP env on the frontend server (Pitfall 1).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EFLOW-10 | Bank-auth (Idura OIDC) round-trip runs deterministically as E2E | EFLOW-10 (Edge-Function retarget + D-02 green gate) AND EFLOW-10b (full-browser journey via Option-B mock issuer) together satisfy the requirement. Edge-Function seam: §Architecture Diagram EFLOW-10, Pattern 1, Code Examples. Full-browser journey: §Architecture Diagram EFLOW-10b, Patterns 2-3, Pitfalls 1-5. Both deterministic / no live IdP (cardinal-rule safe). |

## Sources

### Primary (HIGH confidence — verified against live code this session)
- `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` — existing spec, `buildTestIdToken`, probe/keysConfigured, assertions, run command.
- `tests/playwright.config.ts` — full project DAG; confirmed NO `webServer`/`globalSetup`; opt-in `bank-auth` project shape.
- `apps/frontend/src/routes/api/oidc/{authorize,callback}/+server.ts`, `.../lib/api/utils/auth/providers/idura.ts`, `authConfig.ts`, `getIdTokenClaims.ts` — server-side OIDC flow + env-var reads.
- `apps/frontend/src/routes/candidate/preregister/**` — entry page, `(authenticated)/{elections,constituencies,email}/+page.svelte`, `(authenticated)/+layout.svelte`, `+layout.server.ts`, `/api/candidate/preregister/+server.ts` — testids + flow + claims display.
- `apps/supabase/supabase/functions/identity-callback/index.ts` + `claimConfig.ts` — Edge Function decrypt/verify/match/create + Idura claim config; jose v5.9.6 (Deno).
- `packages/dev-seed/src/templates/index.ts` + `e2e/perm/perm-{2e-shared,2e-asymmetric,not-located-2e2cg}.ts` — template registry keys + topologies (D-04 seed selection).
- `tests/tests/setup/{candidate/candidate-journey.setup.ts, shared/setupFromTemplate.ts}`, `fixtures/{candidate/candidatePasswordSetter.fixture.ts, shared/emailBucket.fixture.ts}`, `utils/{testIds.ts, testCredentials.ts}` — setup/teardown grammar, page-object + email-bucket conventions, testids.
- `node_modules/{@playwright/test,jose}/package.json` — versions 1.58.2 / 6.2.1.
- `.planning/v2.14-E2E-COVERAGE-PLAN.md` §EFLOW-10 + §Bank-Auth Build List; `.planning/idura-ftn-auth-plan.md`; `tests/IDURA-TEST-RUNBOOK.md` — authoritative WHAT-to-build + Idura claim model + manual run procedure.

### Secondary / Tertiary
- None — all claims grounded in repo files; no external web sources needed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified on installed packages; no new deps.
- Architecture (server-side flow + seams): HIGH — every seam read line-by-line.
- Seed selection (D-04): HIGH for the registry key + topology; MEDIUM that `perm-not-located-2e2cg` renders the *candidate-preregister* selectors specifically (A1 — verify at build).
- Mock-issuer HTTPS/env mechanics: MEDIUM — the constraint (hard-coded `https://`, no `webServer`) is HIGH-confidence verified; the cleanest resolution (A3) is a build-time design decision flagged as the top open question.
- Pitfalls: HIGH — each derived from a verified code path.

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (stable repo internals; re-verify if the OIDC provider abstraction or the Playwright DAG is refactored before build).
