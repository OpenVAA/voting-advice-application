# Bank Auth — Manual Full-Flow Testing Runbook (Idura)

This runbook covers setting up the candidate **bank authentication** (Idura
OpenID Connect) flow for **manual, full-flow testing** — i.e. actually
redirecting to the Idura broker, authenticating, and returning with a real
candidate session.

> The E2E specs never reach the real provider: `contestant-bank-auth.spec.ts` calls the
> `identity-callback` Edge Function with a _synthetic_ token, and
> `contestant-identity-provider.spec.ts` walks the browser through a _mock_ issuer (both
> described at the end of this runbook). This runbook is for exercising the **real**
> redirect flow.

## Flow overview

```
/contestant/register  →  POST /api/oidc/authorize   (entity type checked; server signs a JAR with your signing key)
   →  redirect to https://{IDURA_DOMAIN}/oauth2/authorize   (state, nonce + entity type stored in httpOnly cookies)
   →  (user authenticates)  →  GET /api/oidc/callback?code=…&state=…
        (server checks state, exchanges the code at https://{IDURA_DOMAIN}/oauth2/token using
         private_key_jwt, decrypts and verifies the id_token, checks the entity type again)
   →  identity-callback Edge Function, with the server's secret in x-identity-callback-secret
        (verifies the id_token again, finds or creates the account and the candidate or party,
         answers a sign-in token; the id_token never reaches the browser)
   →  session (verifyOtp)  →  /contestant  →  the identity provider's view: the sign-in address
   →  confirmation mail (account-access confirm-address)  →  terms of use  →  the entity's home
```

Every failure lands on `/contestant/register/identity-provider/error?error=<code>`
(see Troubleshooting).

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
PUBLIC_IDENTITY_PROVIDER_TYPE=idura-ftn
PUBLIC_IDENTITY_PROVIDER_CLIENT_ID=urn:my:application:identifier:<NNN>   # your Idura application URN

# Idura-specific
IDURA_DOMAIN=<your-subdomain>.idura.broker
IDURA_SIGNING_JWKS=<private signing JWK array from Step 1>
IDURA_SIGNING_KEY_KID=openvaa-signing-1        # must match the kid in IDURA_SIGNING_JWKS

# Shared (verification/decryption)
IDENTITY_PROVIDER_DECRYPTION_JWKS=<private encryption JWK array from Step 1>
IDENTITY_PROVIDER_JWKS_URI=https://<your-subdomain>.idura.broker/.well-known/jwks
IDENTITY_PROVIDER_ISSUER=https://<your-subdomain>.idura.broker

# The frontend server's credential towards identity-callback (generate: openssl rand -hex 32)
IDENTITY_CALLBACK_SERVER_SECRET=<a random value of at least 32 bytes>
```

> **`IDENTITY_CALLBACK_SERVER_SECRET`** is what the identity provider's callback sends to
> `identity-callback` in the `x-identity-callback-secret` header. The function answers the
> frontend server alone and refuses every call without it (`401 {"result":"refused"}`), and
> the callback refuses to call the function while it is unset (`configuration_error`). The
> function must hold the **same** value (Step 3). It is not a `PUBLIC_` variable.

> **The JWKS path is `/.well-known/jwks`, not `/.well-known/openid-configuration/jwks`.**
> A live tenant's own `.well-known/openid-configuration` names `jwks_uri` as
> `https://{IDURA_DOMAIN}/.well-known/jwks`. The wrong path costs a 404 at the signature-verify
> step, surfacing as `ERR_JWKS_URI_HTTP_STATUS` / `stage=jwks-fetch`. Still take the value from
> **your** tenant's live discovery document rather than from this line — and note that the local
> mock issuer (Step E-2 below) serves the other shape, so a green E2E run does not confirm this path.

> You do **not** set `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT`,
> `IDENTITY_PROVIDER_TOKEN_ENDPOINT`, or `IDENTITY_PROVIDER_CLIENT_SECRET` for
> Idura — the provider derives `/oauth2/authorize` and `/oauth2/token` from
> `IDURA_DOMAIN` and authenticates with `private_key_jwt`.

## Step 3 — Make the Edge Function see its env (the main gotcha)

`identity-callback` reads **six un-prefixed** vars at runtime, and **every one of
them is required** — the function throws when any is unset:
`IDENTITY_CALLBACK_SERVER_SECRET`, `IDENTITY_PROVIDER_TYPE`,
`IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`,
`IDENTITY_PROVIDER_CLIENT_ID` and `IDENTITY_PROVIDER_ISSUER`.
There is **no `functions/.env`** in the repo, so the local edge runtime won't see
your root `.env` automatically. Choose one of the two options below.

> **The function reads no project from its environment.** The callback names the project
> in each request, and the function refuses a request that names none.

> **`IDENTITY_CALLBACK_SERVER_SECRET` must be the same value the root `.env` gives the
> frontend server** (Step 2). A call without the header is refused before the function
> reads anything; a call with the header and the variable unset answers
> `500 {"result":"configuration"}`, and the function's log names the variable.

> Nothing falls back: every one of the six throws when unset, and
> `IDENTITY_PROVIDER_CLIENT_ID` / `IDENTITY_PROVIDER_ISSUER` are bound on every
> verification — a deployment that configured neither would otherwise accept a token
> minted by any issuer for any relying party. All six are documented in
> `apps/supabase/supabase/functions/.env.example`.

> The Edge Function only needs the decryption/verify vars + type — **not** the
> signing key (signing happens in the SvelteKit server routes, not the function).

### Option A (recommended) — serve the function with the root env file

Add the un-prefixed type var to `.env`:

```bash
# in .env
IDENTITY_PROVIDER_TYPE=idura-ftn
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
IDENTITY_PROVIDER_TYPE=idura-ftn
IDENTITY_PROVIDER_DECRYPTION_JWKS=<private encryption JWK array from Step 1>
IDENTITY_PROVIDER_JWKS_URI=https://<your-subdomain>.idura.broker/.well-known/jwks
IDENTITY_PROVIDER_CLIENT_ID=urn:my:application:identifier:<NNN>
IDENTITY_PROVIDER_ISSUER=https://<your-subdomain>.idura.broker
IDENTITY_CALLBACK_SERVER_SECRET=<the same value as in the root .env>
```

> All six lines are required; none of them falls back. The same file serves the other
> functions too: copy the tracked template `apps/supabase/supabase/functions/.env.example`,
> which also carries `SITE_URL` and the `SMTP_*` values `account-access` reads and
> `PUBLIC_PROJECT_ID`, which `send-email` reads.

## Step 4 — Register in the Idura dashboard

Per `docs/key-generation.md` Step 4 (Idura): **Application → OpenID Connect →
Client JWKS**, register **both** public keys (signing + encryption) as a single
JWKS.

- **Redirect URI** (exact match): `http://localhost:5173/api/oidc/callback`
  (`apps/frontend/src/lib/routes/route.ts` maps
  `ContestantAppIdentityProviderCallback` here). The authorize endpoint builds
  the redirect URI from the origin it is reached on and that path; nothing the
  browser sends changes it. ⚠️ Use one host consistently — `localhost` vs
  `127.0.0.1` must match what you browse with (state cookie + redirect-URI check).
- Ensure the application URN matches `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`.

## Step 5 — Run the stack

```bash
yarn dev                       # Supabase + frontend on :5173
# Option A: run the functions-serve command from Step 3 in a second terminal.
# Option B: no extra command — supabase start serves the function with functions/.env.
```

## Step 6 — Walk the flow

1. Make sure the project allows the identity provider: its app settings'
   `contestantApp.registrationModes` holds `identity_provider` for `candidate`, for
   `organization` or for both, and `contestantApp.entityTypes` serves that type.
2. Open `http://localhost:5173/contestant/register`.
3. Choose the Bank ID option (when several are listed), choose what to register (when
   both types allow it) and press Continue → redirected to the Idura broker
   (`/oauth2/authorize` with your signed JAR).
4. Authenticate with an Idura **test identity**.
5. Land back on `/contestant`, signed in, on the identity provider's view: "Complete
   your registration" for a new identity, "You have already registered" for one the
   project already knows. A new candidate is created with the identity's name; a new
   party is created without a name, and the view asks for it.
6. Enter the address you will sign in with and press Continue → the terms of use and
   the entity's home, with no password asked. The home shows the address as awaiting
   confirmation.
7. Open the confirmation mail in Inbucket (`http://127.0.0.1:54324`) and its link → the
   address becomes the account's, and the next protected page asks for a password.
   Until then, sign in with Bank ID again.

> The confirmation mail is sent by `account-access`, so `functions/.env` must carry
> `SITE_URL` and the `SMTP_*` values of the tracked template (Step 3, Option B).

## The provider's language (`ui_locales`)

The authorize request asks the provider to show its screens in the language the person
registers in. The registration screen posts to `/api/oidc/authorize` under its own locale's
prefix (`/fi/api/oidc/authorize` on the Finnish screen, no prefix on the English one), the
endpoint reads the request's locale (`locals.currentLocale`), and the provider is sent the
locale's language subtag alone as `ui_locales`: a two-letter ISO 639-1 code such as `fi`, `sv`
or `en`.

- **Idura** gets `ui_locales` inside the signed request object (JAR), beside `redirect_uri`
  and `state`. Idura documents `ui_locales` as a parameter of the authorize request, per
  request (docs.idura.app/verify/guides/choose-language). Whether it honours the parameter
  **inside a signed request object**, rather than on the query string, is **unconfirmed**. If
  it does not, the parameter is ignored and its screens open in Idura's default language;
  nothing fails.
- **Signicat** gets `ui_locales` as a query parameter of the authorize URL. Signicat documents
  honouring the request's `ui_locales`, as two-letter ISO 639-1 codes
  (developer.signicat.com/docs/eid-hub/concepts/localisation/).

**Checking it against Idura's test environment.** Walk the flow of Step 6 from the Finnish
registration screen (`http://localhost:5173/fi/contestant/register`) and note the language
Idura's screens open in; then walk it from the English screen. To see what was sent, take the
`request` parameter of the `/oauth2/authorize` address the browser was sent to and decode its
middle segment (base64url JSON): it holds `"ui_locales":"fi"` for the Finnish screen. When both
walks open in the same language, Idura is not reading the parameter from the request object;
record that here.

In the E2E suite, the mock issuer reports what it received: its authorize redirect sets the
cookie `mock_oidc_ui_locales` on its own origin to the request object's `ui_locales`, or to
`none`, and the test `the identity provider receives the locale of the registration` reads it.

## Troubleshooting (Idura specifics)

- **`/contestant/register/identity-provider/error?error=…`** — every failure of the
  flow lands on the error screen, and the query param tells you the stage. The
  screen shows the user only the class; the code is for you. No value the provider
  sent appears on the address: the callback maps it first.

  | Code                    | Class       | What failed                                                                                                                                                                                                                                    |
  | ----------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `cancelled`             | `cancelled` | The user cancelled at the provider (the provider answered `access_denied`).                                                                                                                                                                    |
  | `provider_error`        | `retry`     | The provider answered any other error value.                                                                                                                                                                                                   |
  | `missing_code`          | `retry`     | The callback arrived with neither a code nor an error.                                                                                                                                                                                         |
  | `invalid_state`         | `retry`     | The state cookie (Idura) or the PKCE verifier cookie (Signicat) was missing or did not match: don't switch host mid-flow; the flow cookies live 10 minutes.                                                                                    |
  | `token_exchange_failed` | `retry`     | The code could not be exchanged: the `private_key_jwt` assertion was rejected (wrong `IDURA_SIGNING_JWKS` / `IDURA_SIGNING_KEY_KID`, the **signing** public key not registered in Idura, or `IDURA_DOMAIN` off), or the token endpoint failed. |
  | `registration_failed`   | `retry`     | `identity-callback` was unavailable or gave no usable answer.                                                                                                                                                                                  |
  | `invalid_token`         | `noRetry`   | The id_token was rejected: issuer, audience or JWKS mismatch (`IDENTITY_PROVIDER_ISSUER`, `client_id`, `IDENTITY_PROVIDER_JWKS_URI`), or decryption failed.                                                                                    |
  | `mode_not_allowed`      | `noRetry`   | The project does not allow registration with the identity provider for the chosen entity type.                                                                                                                                                 |
  | `configuration_error`   | `noRetry`   | `identity-callback` refused the request or is misconfigured (its environment, or the server's credential).                                                                                                                                     |

  The server log names the stage of a rejected token without any value of it
  (`[oidc/callback] ID token claims rejected; …`).

- **Edge Function "decryption failed"** → `IDENTITY_PROVIDER_DECRYPTION_JWKS`
  (RSA-OAEP-256) doesn't match the registered **encryption** public key, or the
  function didn't get its env (Step 3).
- **Authorize fails before redirect** → `IDURA_SIGNING_KEY_KID` not found in
  `IDURA_SIGNING_JWKS` (the provider throws `Idura signing key not found for
kid: …`).
- **Edge Function `401 {"result":"refused"}`** → the callback sent no
  `x-identity-callback-secret`, or one that differs from the function's
  `IDENTITY_CALLBACK_SERVER_SECRET`: give the root `.env` and the function's environment the
  same value (Steps 2 and 3).
- **Edge Function 401 on standalone serve** → keep `--no-verify-jwt` (the
  frontend invoke passes the anon key, but standalone serving defaults to
  requiring a JWT).
- **Secure cookies on `http://localhost`** → fine (localhost is a secure
  context); a custom `*.local` host would not be.

## Key files (for reference)

| Concern                                                  | Path                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| Registration screen (entry point, the type choice)       | `apps/frontend/src/routes/contestant/register/+page.svelte`               |
| Authorize (checks the type, builds the signed JAR)       | `apps/frontend/src/routes/api/oidc/authorize/+server.ts`                  |
| Callback (code → id_token → identity-callback → session) | `apps/frontend/src/routes/api/oidc/callback/+server.ts`                   |
| Error codes and their classes                            | `apps/frontend/src/lib/contestant/utils/oidcError.ts`                     |
| Error screen                                             | `apps/frontend/src/routes/contestant/register/identity-provider/error/`   |
| The identity provider's view (the sign-in address)       | `apps/frontend/src/lib/contestant/gates/IdentityProviderGate.svelte`      |
| Its server endpoint (names, address, resend)             | `apps/frontend/src/lib/server/contestant/identityProviderRegistration.ts` |
| Idura provider implementation                            | `apps/frontend/src/lib/api/utils/auth/providers/idura.ts`                 |
| Identity-callback Edge Function                          | `apps/supabase/supabase/functions/identity-callback/index.ts`             |
| The address confirmation (the mail)                      | `apps/supabase/supabase/functions/account-access/addressConfirmation.ts`  |
| Callback route mapping                                   | `apps/frontend/src/lib/routes/route.ts`                                   |
| Key generation                                           | `docs/key-generation.md`                                                  |

---

## Deterministic E2E run (synthetic JWE → Edge Function, no live IdP)

This section is the **automated, deterministic** counterpart to the manual full-flow run
above. It drives `tests/tests/specs/contestant/contestant-bank-auth.spec.ts` (the `bank-auth`
Playwright project), which POSTs a **synthetic** Idura JWE id_token built from the **fixed
committed test key pair** (`tests/tests/utils/testKeys.ts`, kids `test-enc-1` / `test-sig-1`)
directly to the `identity-callback` Edge Function. There is **no browser and no real
provider** — only the Edge-Function decrypt → verify → match → create path runs.

The project is part of every E2E run, and the run is the wrapper's:

```bash
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset                      # the whole suite
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset --project bank-auth  # this project alone
```

Before it starts the dev server, `tests/scripts/e2e-run.sh` prepares the identity provider's
test environment from `testKeys.ts` and the mock issuer's constants (`MOCK_ISSUER` and
`MOCK_AUDIENCE` in `tests/tests/support/mockOidcIssuer.ts`), in a temporary directory outside
the repository that it removes on every exit:

- **the Edge file for `identity-callback`:** `IDENTITY_PROVIDER_TYPE=idura-ftn`, the test
  decryption JWK, `IDENTITY_PROVIDER_JWKS_URI=http://host.docker.internal:8777/jwks`, the mock's
  audience and issuer, the run's `IDENTITY_CALLBACK_SERVER_SECRET`, `PUBLIC_PROJECT_ID` set to
  the project the suite seeds, `SITE_URL` at the run's `FRONTEND_PORT`, and the three `SMTP_*`
  values of the tracked template `apps/supabase/supabase/functions/.env.example`;
- **the dev server's environment** (the table under "Full-browser journey" below);
- **Playwright's environment:** `IDENTITY_CALLBACK_SERVER_SECRET` alone, so that the spec calls
  the function as the dev server does;
- **the JWKS document** holding the test signing public key, served on port `8777`. The edge
  runtime runs inside Docker, so it reaches that server as `host.docker.internal`; it can
  neither reach the mock issuer on the host's `127.0.0.1:9443` nor trust its certificate. The
  server listens on one address, never on every interface: `127.0.0.1` on macOS, where Docker
  Desktop forwards `host.docker.internal` to the host's loopback, and on Linux the address
  `host.docker.internal` resolves to inside the edge-runtime container
  (`getent hosts host.docker.internal`), the bridge through which the stack reaches the host. A
  Linux lookup that answers no address refuses the run with status 9.

It then runs `supabase functions serve identity-callback --no-verify-jwt --env-file <the Edge file>`
and waits until the edge-runtime container carries the file's issuer and the function answers.
Then, before Playwright starts, it proves that the edge runtime reaches the key server: from
inside that container, bash's `/dev/tcp` asks `host.docker.internal:8777` for `/jwks`, and the
status line must hold `200`, or the run ends with status 9. The issuer read back from the
container, the key server's address (`jwks_bind=`) and the probe's status line
(`jwks_reachable_from_edge=`) are recorded in `idp-env.txt` in the run directory, and the last
two are printed in the wrapper's output too. No key and no value of the generated environment
is printed or kept.

> **The server's secret is generated per run.** `IDENTITY_CALLBACK_SERVER_SECRET` is 32 random
> bytes in hex, made by the generator for this run alone and written into the Edge file, the
> dev server's environment and Playwright's. It is never printed, never put on a command line
> and never written into the run directory, and it is removed with the temporary directory.

> **A run replaces and restores the shared stack's edge runtime.** `supabase functions serve
--env-file` replaces the edge runtime's environment for **every** function, not only for
> `identity-callback`; that is why the Edge file carries the three `SMTP_*` lines, since
> `account-access` mails the sign-in links of the rest of the suite during the same run.
> Stopping the function server removes the edge-runtime container, and `yarn db:start` alone
> does not bring it back, so at its end — every way out, an interrupt included — the wrapper
> runs `yarn db:stop` then `yarn db:start` (about 30 s on the development host), confirms that
> every function answers and that ports 8777 and 9443 are free, and writes `restore.txt`, whose
> last line is `restore: ok` only when every check held. Before that, it stops a listener on
> 9443 whose command line holds this checkout's absolute path to
> `tests/tests/support/mockOidcIssuerEntry.ts`: the mock issuer Playwright started, which
> outlives a Playwright the wrapper stopped, as on a void or interrupted run. A listener is
> never matched by the port alone, since another checkout's run may hold it; one whose command
> line does not hold the path is left alone. The top of `restore.txt` says which. A run that cannot prepare the
> environment, or cannot put the stack back, exits **9**: not a test failure, and not a green
> run.

> **The suite never reads `apps/supabase/supabase/functions/.env`.** That untracked file is
> yours: it holds what the default local stack serves between runs — a real test tenant, for
> instance — and nothing in it reaches a run. The reverse holds too: the committed test keys
> and the mock's issuer belong in no non-test configuration, neither the root `.env` nor
> `functions/.env`, nor any template, workflow or deployment file.
> `yarn assert:test-keys-scope`, part of `yarn lint:check`, fails on a tracked file outside the
> test tree that names them.

**Expected:** all `bank-auth` tests pass with the keys-configured create path **TAKEN**
(no skipped / did-not-run). The spec asserts `identity_provider='idura-ftn'`,
`identity_match_prop='sub'`, `identity_match_value=<sub>`, that `hetu` and `birthdate` are
**absent** from `app_metadata` (and removed from an older account that still holds them), and
that a success answers exactly `result` and `token`. It also asserts that a call without the
server's secret, and a call with another secret, answer `401 {"result":"refused"}` and create
no account. If the keys-configured path did not run, the spec FAILS loudly rather than
skipping.

> **Your own server fails these specs.** `yarn test:e2e` against a dev server and a stack you
> started yourself runs the identity-provider projects without their environment, and they
> fail rather than skip. A run that has to be green is a wrapper run.

> The full-browser journey (via the mock OIDC issuer) has its own
> section below this one — do not merge the two.

---

## Full-browser journey (mock OIDC issuer, no live IdP)

This is the **automated, deterministic** full-browser counterpart to the manual full-flow
run at the top of this runbook. It drives the `contestant-identity-provider` Playwright project
(`tests/tests/specs/contestant/contestant-identity-provider.spec.ts`), walking the REAL
`/contestant/register → /api/oidc/authorize → (mock IdP) 302 → /api/oidc/callback
(server-side exchange + decrypt, then identity-callback with the server's secret) → session →
the identity provider's view → terms of use → the entity's home` chain. The **only** thing faked
is the IdP at the env-pointed network seam — the real authorize→callback→exchange→decrypt→
claims chain runs **UNMODIFIED**, with no test-only branch in production auth code.

### The mock OIDC issuer

`tests/tests/support/mockOidcIssuer.ts` (+ `mockOidcIssuerEntry.ts`) is a self-contained
Node `https` server serving exactly three routes:

- `GET  /oauth2/authorize` — decodes the signed JAR `request` param (decode, NOT verify) and
  302-redirects to the request's `redirect_uri` with a code and the same `state` (so the
  callback's `returnedState === oidc_state cookie` check passes). A test chooses the identity
  and the outcome — a cancel, a provider error, a refused exchange — with a cookie of its own
  browser context; see the module's docblock.
- `POST /oauth2/token` — returns `{ id_token }` built by the shared `buildTestIdToken`
  (`tests/tests/utils/buildTestIdToken.ts`) using the fixed committed test key pair
  (`tests/tests/utils/testKeys.ts`), with the issuer `MOCK_ISSUER` and the audience
  `MOCK_AUDIENCE`.
- `GET  /.well-known/openid-configuration/jwks` — returns `{ keys: [sigPubJwk] }`
  (kid `test-sig-1`) so the server's `createRemoteJWKSet` verifies the inner JWT signature.
  **This path deliberately does NOT match real Idura's `/.well-known/jwks`.**
  The mock serves whatever path the env var names, so the suite stays green either way, and a
  green E2E run says nothing about the real tenant's path. Treat this endpoint as testing the _mechanism_, never the provider's URL shape. Aligning it with
  Idura's real path would need this line, the `IDENTITY_PROVIDER_JWKS_URI` the wrapper gives
  the dev server and the `webServer` readiness url in `tests/playwright.config.ts` changed
  together, or the harness hangs waiting on a 404.

It is spawned **automatically**, in every run, by the Playwright `webServer` entry in
`tests/playwright.config.ts` — you do **not** start it by hand. It binds **`127.0.0.1` only**,
on **port 9443**, over **HTTPS** with a committed self-signed localhost cert
(`tests/tests/support/mock-oidc-cert.pem`, subject alternative names `127.0.0.1` and
`localhost`).

> **HTTPS is mandatory, and certificate verification is never disabled.** `idura.ts`
> hard-codes the `https://` prefix for BOTH the browser authorize leg AND the server `fetch`
> token/JWKS leg, so a plain-HTTP mock is unreachable. The SvelteKit server trusts the
> committed certificate through `NODE_EXTRA_CA_CERTS`, which the wrapper sets for the dev
> server's process alone; the browser trusts it through `ignoreHTTPSErrors` on the projects
> that navigate to the mock.

### The dev server's environment

The SvelteKit Node server reads the IdP env at **its own process startup**, in a separate
process from the Playwright worker, so the wrapper exports the following into the dev
server's process and into nothing else. A server started without it tries to reach the real
Idura domain (or throws on a missing signing key), and the journey lands on
`/contestant/register/identity-provider/error?error=token_exchange_failed|invalid_token`.

The JWK-bearing values come from `tests/tests/utils/testKeys.ts` and the issuer and audience
from the mock's constants, so nothing is hand-copied. The mock issuer at `127.0.0.1:9443` is
the host all the `https://${IDURA_DOMAIN}/...` URLs resolve to:

| Env var                              | Journey value                                                  | Read by                                               | Note                                                                                            |
| ------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `PUBLIC_IDENTITY_PROVIDER_TYPE`      | `idura-ftn`                                                    | `+page.svelte`                                        | selects the Idura server-JAR branch (NOT the Signicat client-PKCE path)                         |
| `IDURA_DOMAIN`                       | `127.0.0.1:9443`                                               | `idura.ts`                                            | the server builds `https://127.0.0.1:9443/oauth2/authorize` and `/oauth2/token`                 |
| `IDURA_SIGNING_JWKS`                 | `<JSON array containing sigPrivJwk from testKeys.ts>`          | `idura.ts` `getSigningKey()`                          | the mock does NOT validate it, but `getSigningKey()` THROWS if the kid is absent/mismatched     |
| `IDURA_SIGNING_KEY_KID`              | `test-sig-1`                                                   | `idura.ts` `getSigningKey()`                          | must equal the `kid` in `IDURA_SIGNING_JWKS`                                                    |
| `IDENTITY_PROVIDER_DECRYPTION_JWKS`  | `<decryptionJwks ([encPrivJwk]) from testKeys.ts>`             | `decryptAndVerifyIdToken.ts`                          | the private enc JWK the server JWE-decrypts the id_token with                                   |
| `IDENTITY_PROVIDER_JWKS_URI`         | `https://127.0.0.1:9443/.well-known/openid-configuration/jwks` | `decryptAndVerifyIdToken.ts`                          | the mock's JWKS endpoint (serves `sigPubJwk`)                                                   |
| `IDENTITY_PROVIDER_ISSUER`           | `https://127.0.0.1:9443`                                       | `decryptAndVerifyIdToken.ts` `jwtVerify`              | `MOCK_ISSUER`: the `iss` every token the mock mints carries                                     |
| `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` | `test-client-id`                                               | `idura.ts` + `decryptAndVerifyIdToken.ts` `jwtVerify` | `MOCK_AUDIENCE`: the `aud` every token the mock mints carries                                   |
| `NODE_EXTRA_CA_CERTS`                | `tests/tests/support/mock-oidc-cert.pem`                       | Node, at process start                                | trusts the mock's certificate for the token and JWKS fetches                                    |
| `IDENTITY_CALLBACK_SERVER_SECRET`    | `<generated for the run>`                                      | `$lib/server/constants` → `/api/oidc/callback`        | sent to `identity-callback` in `x-identity-callback-secret`; the Edge file holds the same value |

> **iss/aud alignment:** the mock issuer stamps its own constants `MOCK_ISSUER` and
> `MOCK_AUDIENCE` onto every id_token it mints; it reads no environment for them. The wrapper
> writes the same two constants into the dev server's environment and into the Edge file, so
> the minted token's `iss`/`aud` match both verifiers by construction.

> **TEST-ONLY.** This environment — the test JWKs and the `127.0.0.1:9443` domain — exists only
> in the wrapper's temporary directory and the dev server process it starts. It MUST NOT be
> placed in the root `.env`, in `functions/.env`, or in any non-test environment. The committed
> test cert/key are never installed into a trust store and are never used by production.

### Run

```bash
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset --project contestant-identity-provider
```

The wrapper serves `identity-callback` and starts the dev server with the environment above;
Playwright starts the mock OIDC issuer (`webServer` entry → `tsx mockOidcIssuerEntry.ts`),
waits for `https://127.0.0.1:9443/.well-known/openid-configuration/jwks` (with
`ignoreHTTPSErrors`), runs the journey, and tears the issuer down; the wrapper then restores the
stack. When the wrapper stops Playwright itself, on a void or interrupted run, the issuer
outlives it, and the wrapper stops it, matched by its command line.

> **This project is not fast on its own.** `data-setup-identity-provider`
> depends on `voter-prefs-tracking`, the tail of the perm serial chain, so
> `--project=contestant-identity-provider` pulls the ENTIRE chain transitively — expect full-suite
> wall-clock, not seconds. This is deliberate:
> the setup does an authoritative `app_settings` REPLACE, the singleton needs mutual
> exclusion rather than mere ordering, and being in the serial chain is how this config
> spells that. There is no requirement that this journey be runnable quickly in isolation.
>
> Consequently many datasets (base, every perm dataset) are live in the DB while the specs
> walk. Each test mints an identity of its own and asserts the entity its own account edits,
> so another dataset cannot be mistaken for its own.

> **Cardinal rule (CLAUDE.md):** the journey must pass — a "did not run" counts as a failure.
> It is part of every full run, so a green full run is the green point for the round trip.
