# Bank Auth — Manual Full-Flow Testing Runbook (Idura)

This runbook covers setting up the candidate **bank authentication** (Idura
OpenID Connect) flow for **manual, full-flow testing** — i.e. actually
redirecting to the Idura broker, authenticating, and returning with a real
candidate session.

> The E2E spec (`tests/tests/specs/candidate/candidate-bank-auth.spec.ts`) only
> calls the `identity-callback` Edge Function with a *synthetic* token — it skips
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

| Concern | Path |
| --- | --- |
| Authorize (builds signed JAR) | `apps/frontend/src/routes/api/oidc/authorize/+server.ts` |
| Callback (code → id_token) | `apps/frontend/src/routes/api/oidc/callback/+server.ts` |
| Preregister UI (entry point) | `apps/frontend/src/routes/candidate/preregister/+page.svelte` |
| Preregister server (invokes Edge Function) | `apps/frontend/src/routes/api/candidate/preregister/+server.ts` |
| Idura provider implementation | `apps/frontend/src/lib/api/utils/auth/providers/idura.ts` |
| Identity-callback Edge Function | `apps/supabase/supabase/functions/identity-callback/index.ts` |
| Callback route mapping | `apps/frontend/src/lib/utils/route/route.ts` |
| Key generation | `docs/key-generation.md` |
