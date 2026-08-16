# Bank Auth — Manual Full-Flow Testing Runbook (Idura)

This runbook covers setting up the candidate **bank authentication** (Idura
OpenID Connect) flow for **manual, full-flow testing** — i.e. actually
redirecting to the Idura broker, authenticating, and returning with a real
candidate session.

> The E2E spec (`tests/tests/specs/candidate/candidate-bank-auth.spec.ts`) only
> calls the `identity-callback` Edge Function with a _synthetic_ token — it skips
> the real provider. This runbook is for exercising the **real** redirect flow.

## Flow overview

```
/candidate/preregister  →  POST /api/oidc/authorize   (server signs a JAR with your signing key)
   →  redirect to https://{IDURA_DOMAIN}/oauth2/authorize   (state + nonce stored in httpOnly cookies)
   →  (user authenticates)  →  GET /api/oidc/callback?code=…&state=…
        (server exchanges code at https://{IDURA_DOMAIN}/oauth2/token using private_key_jwt; sets id_token cookie)
   →  /candidate/preregister  →  POST /api/candidate/preregister
   →  identity-callback Edge Function  (decrypts JWE id_token, verifies, creates candidate, returns magic link)
   →  candidate session  →  /candidate
```

**How Idura differs from Signicat:**

- **Two key pairs** required: a **signing** key (RS256 — used for both the JAR and
  `private_key_jwt` token-endpoint auth) and an **encryption** key
  (RSA-OAEP-256 — to decrypt the JWE id_token).
- **No client secret** — client authentication is `private_key_jwt` via your
  signing key.
- **No explicit authorize/token endpoint vars** — both are derived from
  `IDURA_DOMAIN` (`/oauth2/authorize`, `/oauth2/token`).
- `client_id` is the Idura **application URN** (e.g.
  `urn:my:application:identifier:498295`).

## Prerequisites

- An Idura broker tenant + an OIDC application (you'll get the **application URN**
  = client_id and the **broker domain**).
- Repo running locally (`yarn dev`).

## Step 1 — Generate BOTH key pairs

Follow `docs/key-generation.md` → "Step 1a (Recommended): Generate Key Pair In
Memory":

- **Signing key pair** (Idura JAR + `private_key_jwt`) → private JWK array →
  `IDURA_SIGNING_JWKS`; note its `kid` → `IDURA_SIGNING_KEY_KID`.
- **Encryption key pair** (Idura — RSA-OAEP-256) → private JWK array →
  `IDENTITY_PROVIDER_DECRYPTION_JWKS`.

Both **public** JWKs get registered with Idura (Step 4).

## Step 2 — Configure the root `.env`

```bash
PUBLIC_IDENTITY_PROVIDER_TYPE=idura
PUBLIC_IDENTITY_PROVIDER_CLIENT_ID=urn:my:application:identifier:<NNN>   # your Idura application URN

# Idura-specific
IDURA_DOMAIN=<your-subdomain>.idura.broker
IDURA_SIGNING_JWKS=<private signing JWK array from Step 1>
IDURA_SIGNING_KEY_KID=openvaa-signing-1        # must match the kid in IDURA_SIGNING_JWKS

# Shared (verification/decryption)
IDENTITY_PROVIDER_DECRYPTION_JWKS=<private encryption JWK array from Step 1>
IDENTITY_PROVIDER_JWKS_URI=https://<your-subdomain>.idura.broker/.well-known/openid-configuration/jwks
IDENTITY_PROVIDER_ISSUER=https://<your-subdomain>.idura.broker
```

> You do **not** set `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT`,
> `IDENTITY_PROVIDER_TOKEN_ENDPOINT`, or `IDENTITY_PROVIDER_CLIENT_SECRET` for
> Idura — the provider derives `/oauth2/authorize` and `/oauth2/token` from
> `IDURA_DOMAIN` and authenticates with `private_key_jwt`.

## Step 3 — Make the Edge Function see its env (the main gotcha)

`identity-callback` reads **un-prefixed** vars at runtime:
`IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`,
`IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_CLIENT_ID`, plus optional
`DEFAULT_PROJECT_ID`, `SITE_URL`. There is **no `functions/.env`** in the repo,
so the local edge runtime won't see your root `.env` automatically. Choose one
of the two options below.

> The Edge Function only needs the decryption/verify vars + type — **not** the
> signing key (signing happens in the SvelteKit server routes, not the function).

### Option A (recommended) — serve the function with the root env file

Add the un-prefixed type var to `.env`:

```bash
# in .env
IDENTITY_PROVIDER_TYPE=idura
```

Then serve the function explicitly (second terminal), pointing it at the root
`.env`:

```bash
cd apps/supabase/supabase
npx supabase functions serve identity-callback --no-verify-jwt --env-file ../../../.env
```

### Option B — dedicated `functions/.env`

Create `apps/supabase/supabase/functions/.env` so `supabase start` picks the vars
up automatically (no separate serve command needed):

```bash
# apps/supabase/supabase/functions/.env
IDENTITY_PROVIDER_TYPE=idura
IDENTITY_PROVIDER_DECRYPTION_JWKS=<private encryption JWK array from Step 1>
IDENTITY_PROVIDER_JWKS_URI=https://<your-subdomain>.idura.broker/.well-known/openid-configuration/jwks
IDENTITY_PROVIDER_CLIENT_ID=urn:my:application:identifier:<NNN>
# Optional:
# DEFAULT_PROJECT_ID=<project id>      # falls back to the seed project if unset
# SITE_URL=http://127.0.0.1:5173       # default already matches config.toml [auth].site_url
```

> `DEFAULT_PROJECT_ID` is optional (falls back to the seed project). `SITE_URL`
> defaults to `http://127.0.0.1:5173`, which matches `apps/supabase/supabase/config.toml`
> `[auth].site_url`.

## Step 4 — Register in the Idura dashboard

Per `docs/key-generation.md` Step 4 (Idura): **Application → OpenID Connect →
Client JWKS**, register **both** public keys (signing + encryption) as a single
JWKS.

- **Redirect URI** (exact match): `http://localhost:5173/api/oidc/callback`
  (`apps/frontend/src/lib/utils/route/route.ts` maps
  `CandAppPreregisterIdentityProviderCallback` here). ⚠️ Use one host
  consistently — `localhost` vs `127.0.0.1` must match what you browse with
  (state cookie + redirect-URI check).
- Ensure the application URN matches `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`.

## Step 5 — Run the stack

```bash
yarn dev                       # Supabase + frontend on :5173
# Option A: run the functions-serve command from Step 3 in a second terminal.
# Option B: no extra command — supabase start serves the function with functions/.env.
```

## Step 6 — Walk the flow

1. Open `http://localhost:5173/candidate/preregister`.
2. Click the bank-login / identify action → redirected to the Idura broker
   (`/oauth2/authorize` with your signed JAR).
3. Authenticate with an Idura **test identity**.
4. Land back on `/candidate/preregister`; the candidate is created/linked and a
   session is established → `/candidate`.

## Troubleshooting (Idura specifics)

- **`/candidate/preregister?error=…`** — the query param tells you the stage:
  - `invalid_state` → state cookie mismatch (don't switch host mid-flow; cookies
    are 10-min TTL).
  - `token_exchange_failed` → `private_key_jwt` assertion rejected: wrong
    `IDURA_SIGNING_JWKS` / `IDURA_SIGNING_KEY_KID`, or the **signing** public key
    isn't registered in Idura, or `IDURA_DOMAIN` is off.
  - `invalid_token` → issuer/audience/JWKS mismatch (`IDENTITY_PROVIDER_ISSUER`,
    `client_id`, `IDENTITY_PROVIDER_JWKS_URI`).
- **Edge Function "decryption failed"** → `IDENTITY_PROVIDER_DECRYPTION_JWKS`
  (RSA-OAEP-256) doesn't match the registered **encryption** public key, or the
  function didn't get its env (Step 3).
- **Authorize fails before redirect** → `IDURA_SIGNING_KEY_KID` not found in
  `IDURA_SIGNING_JWKS` (the provider throws `Idura signing key not found for
kid: …`).
- **Edge Function 401 on standalone serve** → keep `--no-verify-jwt` (the
  frontend invoke passes the anon key, but standalone serving defaults to
  requiring a JWT).
- **Secure cookies on `http://localhost`** → fine (localhost is a secure
  context); a custom `*.local` host would not be.

## Key files (for reference)

| Concern                                    | Path                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| Authorize (builds signed JAR)              | `apps/frontend/src/routes/api/oidc/authorize/+server.ts`        |
| Callback (code → id_token)                 | `apps/frontend/src/routes/api/oidc/callback/+server.ts`         |
| Preregister UI (entry point)               | `apps/frontend/src/routes/candidate/preregister/+page.svelte`   |
| Preregister server (invokes Edge Function) | `apps/frontend/src/routes/api/candidate/preregister/+server.ts` |
| Idura provider implementation              | `apps/frontend/src/lib/api/utils/auth/providers/idura.ts`       |
| Identity-callback Edge Function            | `apps/supabase/supabase/functions/identity-callback/index.ts`   |
| Callback route mapping                     | `apps/frontend/src/lib/utils/route/route.ts`                    |
| Key generation                             | `docs/key-generation.md`                                        |

---

## EFLOW-10 — deterministic E2E run (synthetic JWE → Edge Function, no live IdP)

This section is the **automated, deterministic** counterpart to the manual full-flow run
above. It drives `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` (the `bank-auth`
Playwright project), which POSTs a **synthetic** Idura JWE id_token built from the **fixed
committed test key pair** (`tests/tests/utils/testKeys.ts`, kids `test-enc-1` / `test-sig-1`)
directly to the `identity-callback` Edge Function. There is **no browser and no real
provider** — only the Edge-Function decrypt → verify → match → create path runs.

> **D-02 (deterministic-green gate):** the spec asserts the keys-configured create path
> ran on EVERY run (it does **not** `test.skip`). A "did not run" is a **CARDINAL failure**
> (CLAUDE.md E2E Hard Rule). The gate holds only if the served Edge Function is wired with
> the **fixed test decryption JWK** AND a reachable JWKS endpoint serving the **test signing
> public key** (so `verifyJwt` succeeds). Both are produced below from `testKeys.ts` — the
> single source of truth — so there is no key drift.

> **TEST-ONLY keys — never replace the production secret.** The env file written below
> contains the committed _test_ private decryption JWK. It is for the opt-in `bank-auth`
> run **only**; it MUST NOT be placed in the root `.env`, in `functions/.env`, or in any
> non-test environment (threat T-122-01 / T-122-04). Write it to a gitignored scratch path
> (e.g. `/tmp`) and pass it via `--env-file`.

### Step E-1 — Generate the test env file + the test JWKS from `testKeys.ts`

Run from the repo root. This derives both artifacts from `tests/tests/utils/testKeys.ts`
(no hand-copied keys → no drift):

```bash
# (a) The Edge-Function env file (decryption JWK + Idura type + audience + JWKS URI).
#     IDENTITY_PROVIDER_JWKS_URI points at the static test-JWKS server started in Step E-2.
npx tsx -e '
import { decryptionJwks } from "./tests/tests/utils/testKeys";
const lines = [
  "IDENTITY_PROVIDER_TYPE=idura",
  "IDENTITY_PROVIDER_DECRYPTION_JWKS=" + JSON.stringify(decryptionJwks),
  "IDENTITY_PROVIDER_JWKS_URI=http://host.docker.internal:8777/jwks",
  "IDENTITY_PROVIDER_CLIENT_ID=test-client-id",
].join("\n") + "\n";
require("node:fs").writeFileSync("/tmp/eflow10.env", lines);
console.log("wrote /tmp/eflow10.env");
'

# (b) The static JWKS document serving the TEST signing public key (kid test-sig-1).
npx tsx -e '
import { sigPubJwk } from "./tests/tests/utils/testKeys";
require("node:fs").mkdirSync("/tmp/eflow10-jwks", { recursive: true });
require("node:fs").writeFileSync("/tmp/eflow10-jwks/jwks", JSON.stringify({ keys: [sigPubJwk] }));
console.log("wrote /tmp/eflow10-jwks/jwks");
'
```

> **JWKS URI host note.** The local Supabase Edge runtime runs inside Docker, so a JWKS
> server bound to the host is reached as `host.docker.internal` (not `localhost`) from
> inside the function. If your Edge runtime runs natively, use `http://localhost:8777/jwks`
> in `/tmp/eflow10.env` instead. `IDENTITY_PROVIDER_CLIENT_ID=test-client-id` matches the
> synthetic token's default `aud` (set by `buildTestIdToken`).

### Step E-2 — Serve the static test JWKS (Terminal A)

The Edge Function's `verifyJwt` fetches `IDENTITY_PROVIDER_JWKS_URI` to verify the inner
RS256 signature. Serve the JWKS document from Step E-1 with any zero-dependency static
server on port `8777`:

```bash
cd /tmp/eflow10-jwks
python3 -m http.server 8777          # serves /tmp/eflow10-jwks/jwks at http://<host>:8777/jwks
```

### Step E-3 — Serve the Edge Function with the test env file (Terminal B)

```bash
cd apps/supabase/supabase
npx supabase functions serve identity-callback --no-verify-jwt --env-file /tmp/eflow10.env
```

`--no-verify-jwt` is required when serving standalone (the spec passes the anon key, but
standalone serving otherwise requires a platform JWT — see Troubleshooting above).

### Step E-4 — Run the `bank-auth` project (Terminal C)

```bash
# SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY must be in the environment
# (the spec throws if absent). Get them from `yarn db:status` / supabase output.
PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5174 \
  npx playwright test --project=bank-auth -c tests/playwright.config.ts
```

> The dev server has to be on 5174 for this run as well — start it with the same prefix (`FRONTEND_PORT=5174 yarn dev`) or put a `FRONTEND_PORT=5174` line in the root `.env`, which moves both the dev server and Playwright. Otherwise the E2E preflight aborts the run before the first spec; see [`tests/README.md`](./README.md) § Run for what it asserts and how to read its failure message.

**Expected:** all `bank-auth` tests pass with the keys-configured create path **TAKEN**
(no skipped / did-not-run). The spec asserts `identity_provider='idura'`,
`identity_match_prop='sub'`, `identity_match_value=<sub>`, the `hetu`/`birthdate` claim
flow-through, and a magic-link `action_link` containing `token=`. If the keys-configured
path did not run, the spec FAILS loudly (it points back here) rather than skipping.

> The plan 122-03 (EFLOW-10b full-browser journey via the mock OIDC issuer) will append a
> separate **EFLOW-10b** section below this one — do not merge the two.

---

## EFLOW-10b — full-browser journey (mock OIDC issuer, no live IdP)

This is the **automated, deterministic** full-browser counterpart to the manual full-flow
run at the top of this runbook. It drives the `bank-auth-journey` Playwright project (the
NEW journey spec lands in plan 122-05), walking the REAL
`/candidate/preregister → /api/oidc/authorize → (mock IdP) 302 → /api/oidc/callback
(server-side exchange + decrypt) → authenticated → election/constituency → email + ToU →
preregister() → registration-key → set password → logged-in` chain. The **only** thing faked
is the IdP at the env-pointed network seam — the real authorize→callback→exchange→decrypt→
claims chain runs **UNMODIFIED** (D-01 Option B; Option C — a test-only branch in production
auth code — was rejected + operator-LOCKED).

### The mock OIDC issuer

`tests/tests/support/mockOidcIssuer.ts` (+ `mockOidcIssuerEntry.ts`) is a self-contained
Node `https` server serving exactly three routes:

- `GET  /oauth2/authorize` — decodes the signed JAR `request` param (decode, NOT verify) and
  302-redirects to `${redirect_uri}?code=test-code&state=${state}` (echoes `state` so the
  callback's `returnedState === oidc_state cookie` check passes).
- `POST /oauth2/token` — returns `{ id_token }` built by the shared `buildTestIdToken`
  (`tests/tests/utils/buildTestIdToken.ts`) using the fixed committed test key pair
  (`tests/tests/utils/testKeys.ts`), with `iss`/`aud` aligned to the server's verify (below).
- `GET  /.well-known/openid-configuration/jwks` — returns `{ keys: [sigPubJwk] }`
  (kid `test-sig-1`) so the server's `createRemoteJWKSet` verifies the inner JWT signature.

It is spawned **automatically** by the Playwright `webServer` entry in
`tests/playwright.config.ts` for the opt-in `PLAYWRIGHT_BANK_AUTH` run only — you do **not**
start it by hand. It binds **`127.0.0.1` only**, on **port 9443**, over **HTTPS** with a
committed self-signed localhost cert (`tests/tests/support/mock-oidc-cert.pem`, CN=127.0.0.1).

> **HTTPS is mandatory (A3 / Pitfall 2).** `idura.ts` hard-codes the `https://` prefix for
> BOTH the browser authorize leg AND the server `fetch` token/JWKS leg. A plain-HTTP mock is
> therefore unreachable; the issuer serves HTTPS, and because the cert is self-signed, the
> SvelteKit-server process must run with `NODE_TLS_REJECT_UNAUTHORIZED=0` (Step B-2 below).

### Step B-1 — IDP env the SvelteKit server must be started with (Pitfall 1)

There is **NO frontend Playwright `webServer` and NO `globalSetup`** — the SvelteKit Node
server reads the IdP env at **ITS OWN process startup**, in a SEPARATE process from the
Playwright worker. You MUST therefore start `yarn dev` (or the SvelteKit Node server) with the
following env in **its** environment, or the server will try to reach the real Idura domain
(or throw on a missing signing key) and the journey lands on
`/candidate/preregister?error=token_exchange_failed|invalid_token`.

Derive the JWK-bearing values from `tests/tests/utils/testKeys.ts` (single source of truth —
no hand-copied keys → no drift). The mock issuer at `127.0.0.1:9443` is the host all the
`https://${IDURA_DOMAIN}/...` URLs resolve to:

| Env var                              | EFLOW-10b value                                                | Read by                                        | Note                                                                                                     |
| ------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------ |
| `PUBLIC_IDENTITY_PROVIDER_TYPE`      | `idura`                                                        | `+page.svelte`                                 | selects the Idura server-JAR branch (NOT the Signicat client-PKCE path)                                  |
| `IDURA_DOMAIN`                       | `127.0.0.1:9443`                                               | `idura.ts`                                     | the server builds `https://127.0.0.1:9443/oauth2/authorize                                               | token` |
| `IDURA_SIGNING_JWKS`                 | `<JSON array containing sigPrivJwk from testKeys.ts>`          | `idura.ts` `getSigningKey()`                   | the mock does NOT validate it, but `getSigningKey()` THROWS if the kid is absent/mismatched              |
| `IDURA_SIGNING_KEY_KID`              | `test-sig-1`                                                   | `idura.ts` `getSigningKey()`                   | must equal the `kid` in `IDURA_SIGNING_JWKS`                                                             |
| `IDENTITY_PROVIDER_DECRYPTION_JWKS`  | `<decryptionJwks ([encPrivJwk]) from testKeys.ts>`             | `getIdTokenClaims.ts`                          | the private enc JWK the server JWE-decrypts the id_token with                                            |
| `IDENTITY_PROVIDER_JWKS_URI`         | `https://127.0.0.1:9443/.well-known/openid-configuration/jwks` | `getIdTokenClaims.ts`                          | the mock's JWKS endpoint (serves `sigPubJwk`)                                                            |
| `IDENTITY_PROVIDER_ISSUER`           | `https://127.0.0.1:9443`                                       | `getIdTokenClaims.ts` `jwtVerify`              | MUST equal the synthetic token's `iss` — the mock reads this same env when minting the token (Pitfall 4) |
| `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` | `test-client-id`                                               | `idura.ts` + `getIdTokenClaims.ts` `jwtVerify` | MUST equal the synthetic token's `aud` — the mock reads this same env when minting the token (Pitfall 4) |

> **iss/aud alignment (Pitfall 4):** the mock issuer's token endpoint reads
> `IDENTITY_PROVIDER_ISSUER` / `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` from its OWN process env
> and stamps them onto the synthetic id_token. Because the `webServer` spawns the issuer from
> the same shell that runs Playwright, set those two vars in **both** the frontend-server env
> AND the Playwright-run env so the minted token's `iss`/`aud` match the server's `jwtVerify`.

Concrete derive-and-export helper (run from the repo root; writes a sourceable env file):

```bash
npx tsx -e '
import { sigPrivJwk, decryptionJwks } from "./tests/tests/utils/testKeys";
const lines = [
  "export PUBLIC_IDENTITY_PROVIDER_TYPE=idura",
  "export IDURA_DOMAIN=127.0.0.1:9443",
  "export IDURA_SIGNING_JWKS=" + JSON.stringify(JSON.stringify([sigPrivJwk])),
  "export IDURA_SIGNING_KEY_KID=test-sig-1",
  "export IDENTITY_PROVIDER_DECRYPTION_JWKS=" + JSON.stringify(JSON.stringify(decryptionJwks)),
  "export IDENTITY_PROVIDER_JWKS_URI=https://127.0.0.1:9443/.well-known/openid-configuration/jwks",
  "export IDENTITY_PROVIDER_ISSUER=https://127.0.0.1:9443",
  "export PUBLIC_IDENTITY_PROVIDER_CLIENT_ID=test-client-id",
  "export NODE_TLS_REJECT_UNAUTHORIZED=0",
].join("\n") + "\n";
require("node:fs").writeFileSync("/tmp/eflow10b.env", lines);
console.log("wrote /tmp/eflow10b.env");
'
```

### Step B-2 — the scoped TLS bypass (Pitfall 2 — TEST-ONLY, never leak to prod)

The mock issuer's cert is self-signed, so the SvelteKit server's token/JWKS `fetch` legs would
otherwise fail Node's cert check. Set `NODE_TLS_REJECT_UNAUTHORIZED=0` **only** in the
frontend-server process for this opt-in run (it is included in `/tmp/eflow10b.env` above).

> **TEST-ONLY — never leak to a default run / prod / CI (threat T-122-07).** This entire env
> set — the test JWKs, the `127.0.0.1:9443` domain, and especially `NODE_TLS_REJECT_UNAUTHORIZED=0`
> — is for the opt-in `bank-auth-journey` run **only**. It MUST NOT be placed in the root
> `.env`, in `functions/.env`, or in any non-test environment, and MUST NOT leak into a default
> `yarn dev` or a CI default run. Write it to a gitignored scratch path (`/tmp`) and `source`
> it in the dedicated terminal only. The committed test cert/key (CN=127.0.0.1) are never
> installed into a trust store and are never used by production.

### Step B-3 — run procedure (two terminals; the mock issuer auto-spawns)

The project-memory E2E prereq still applies: **one fresh dev server on `:5173`** (no stale
server stealing the port) + a **clean DB** (`yarn db:reset`) before the run.

**Terminal 1 — SvelteKit server with the IDP env in its OWN environment:**

```bash
yarn db:reset                              # clean DB first (project-memory prereq)
source /tmp/eflow10b.env                   # the EFLOW-10b IdP env + scoped TLS bypass (Step B-1/B-2)
yarn dev                                   # SvelteKit on :5173 inherits the IdP env from this shell
# (also serve the identity-callback Edge Function with the test decryption JWKS — reuse the
#  EFLOW-10 Step E-1/E-2/E-3 procedure above; the journey's preregister() invokes it.)
```

**Terminal 2 — the Playwright bank-auth-journey run (the mock issuer auto-spawns via webServer):**

```bash
source /tmp/eflow10b.env                   # so the webServer-spawned mock issuer mints iss/aud-aligned tokens
PLAYWRIGHT_BANK_AUTH=1 \
  npx playwright test --project=bank-auth-journey -c tests/playwright.config.ts
```

Playwright starts the mock OIDC issuer (`webServer` entry → `tsx mockOidcIssuerEntry.ts`),
waits for `https://127.0.0.1:9443/.well-known/openid-configuration/jwks` (with
`ignoreHTTPSErrors`), then runs the journey, then tears the issuer down.

> **Since Phase 140 WR-03 this gate is NO LONGER FAST.** `data-setup-bank-auth-journey`
> depends on `voter-prefs-tracking`, the tail of the perm serial chain, so
> `--project=bank-auth-journey` pulls the ENTIRE chain transitively — expect full-suite
> wall-clock (~11 min per run, so ~35 min for the 3× gate), not seconds. This is deliberate:
> the setup does an authoritative `app_settings` REPLACE, the singleton needs mutual
> exclusion rather than mere ordering, and being in the serial chain is how this config
> spells that. RESEARCH A4 ("stands alone") is explicitly superseded — there is no
> requirement that this journey be runnable quickly in isolation.
>
> Consequently many datasets (base, every perm dataset) are live in the DB while the journey
> walks. That is SAFE because selection is identity-based since Phase 140 CR-01:
> `submitElection('[EL1]')` / `submitConstituency('[CO1')` assert on the dataset's own labels,
> so a foreign dataset fails the walk loudly instead of being silently preregistered into.
> Verified by trace — see `140-GATES.md` Gate 3.

> **Cardinal rule (CLAUDE.md):** the journey must pass — a "did not run" counts as a failure.
> Run the gate **3×** on a fresh dev server + clean DB, and confirm the DEFAULT suite
> (`yarn test:e2e`) stays green afterwards (the opt-in project must not perturb it).
