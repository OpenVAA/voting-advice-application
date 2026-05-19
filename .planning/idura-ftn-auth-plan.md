# Idura FTN Auth Handler Plan

**Created:** 2026-03-26
**Status:** Planned (after Deno investigation)
**Priority:** Next after Deno feasibility study

## Context

Replace Signicat with Idura (formerly Criipto) as the OIDC identity provider for Finnish Trust Network (FTN) bank authentication in the candidate pre-registration flow.

- Idura docs: https://docs.idura.app/verify/e-ids/finnish-trust-network/
- Idura OIDC intro: https://docs.idura.app/verify/getting-started/oidc-intro/

## Analysis: Can Supabase's Built-in OAuth Be Used?

**No, not for FTN.** Finnish Trust Network security requirements (effective Aug 31, 2025) impose constraints that Supabase's custom OIDC provider cannot fulfill:

| FTN Requirement | Supabase Custom OIDC | Verdict |
|---|---|---|
| `private_key_jwt` client auth | Only `client_secret` | Blocked |
| Signed authorization requests (JAR) | Not supported | Blocked |
| JWE-encrypted token responses | Not handled | Blocked |
| Static JWKS registration | Uses dynamic JWKS fetch | Blocked |

Supabase custom providers work well for simpler OIDC providers, but FTN's elevated security requirements mean we need the same Edge Function architecture as the current Signicat integration.

## Architecture: What Changes, What Stays

The architecture is nearly identical to the current Signicat flow. Both Signicat and Idura are OIDC providers that return JWE-encrypted id_tokens with the same standard claims. The main differences are in how we authenticate to the provider and construct authorization requests.

**Current Signicat flow:**
```
Frontend -> PKCE redirect to Signicat -> Callback -> client_secret token exchange -> JWE cookie -> Edge Function -> Supabase user
```

**New Idura flow:**
```
Frontend -> Server-side JAR construction -> Redirect to Idura -> Callback -> private_key_jwt token exchange -> JWE cookie -> Edge Function -> Supabase user
```

## Key Differences from Signicat

| Aspect | Signicat (current) | Idura (new) |
|---|---|---|
| Authorization URL | Client-side PKCE redirect with query params | Server-side signed JWT request object (JAR) |
| Token exchange auth | `client_secret` in POST body | `private_key_jwt` client assertion JWT |
| Token encryption | JWE (RSA-OAEP) | JWE (RSA-OAEP-256) -- same jose code |
| Identity matching | `birthdate` as unique ID | `sub` (persistent pseudonym per tenant) -- more robust |
| Additional claims | given_name, family_name, birthdate | + `hetu` (Finnish SSN), `satu`, `country` |
| Key management | 1 key pair (encryption) | 2 key pairs (signing + encryption), static JWKS registered in dashboard |
| PKCE | Client-side challenge/verifier | Still possible alongside JAR, but FTN mandates JAR |

## Implementation Phases

### Phase 1: Key Generation & Idura Setup (manual/one-time)

- Generate RSA key pair for **signing** (request signing + `private_key_jwt`)
- Generate RSA key pair for **encryption** (JWE decryption)
- Register public JWKS (both keys) in Idura Dashboard under Application > OpenID Connect > Client JWKS
- Configure Idura Dashboard: set `id_token response strategy` and `User info response strategy` to `signedAndEncryptedJWT`
- Store private keys as Supabase secrets + SvelteKit env vars

### Phase 2: New Server-Side Authorization Route

**New file:** `apps/frontend/src/routes/api/oidc/authorize/+server.ts`

Purpose: Constructs a signed authorization request (JAR) and returns the redirect URL.

```
POST /api/oidc/authorize
-> Creates JWT request object signed with signing private key
-> Returns { authorizeUrl: "https://SUBDOMAIN.idura.broker/oauth2/authorize?client_id=X&request=SIGNED_JWT" }
```

The JWT payload contains: `response_type`, `response_mode`, `client_id`, `redirect_uri`, `state`, `scope`, `login_hint` (optional), `nonce`, `iss` (= client_id), `aud` (= Idura domain).

### Phase 3: Update Token Exchange Route

**Modify:** `apps/frontend/src/routes/api/oidc/token/+server.ts`

Replace `client_secret` auth with `private_key_jwt`:

```typescript
// Create client assertion JWT
const clientAssertion = await new jose.SignJWT({})
  .setProtectedHeader({ alg: 'RS256', kid: SIGNING_KEY_KID })
  .setIssuer(CLIENT_ID)
  .setSubject(CLIENT_ID)
  .setAudience(`https://${IDURA_DOMAIN}`)
  .setExpirationTime('5m')
  .setJti(crypto.randomUUID())
  .sign(signingKey);

// Token exchange POST body uses client_assertion instead of client_secret:
{
  grant_type: 'authorization_code',
  code: authorizationCode,
  redirect_uri: redirectUri,
  client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
  client_assertion: clientAssertion
}
```

### Phase 4: Update Frontend Preregister Page

**Modify:** `apps/frontend/src/routes/candidate/preregister/+page.svelte`

Change `redirectToIdentityProvider()` to call the server-side authorize endpoint instead of building the URL client-side:

```typescript
async function redirectToIdentityProvider() {
  const redirectUri = `${window.location.origin}${$getRoute('CandAppPreregisterIdentityProviderCallback')}`;
  const response = await fetch('/api/oidc/authorize', {
    method: 'POST',
    body: JSON.stringify({ redirectUri })
  });
  const { authorizeUrl } = await response.json();
  window.location.href = authorizeUrl;
}
```

This removes the client-side PKCE generation (JAR replaces it).

### Phase 5: New/Updated Edge Function

**Option A (preferred):** Make the existing `signicat-callback` provider-agnostic by renaming to `identity-callback` and switching on an env var:

```typescript
// IDENTITY_PROVIDER env var: 'signicat' | 'idura'
const provider = Deno.env.get('IDENTITY_PROVIDER') ?? 'signicat';
```

**Option B:** Create a parallel `idura-callback` Edge Function.

The Edge Function logic is nearly identical -- the only change is identity matching: use `sub` (persistent pseudonym) instead of `birthdate` for user lookup, since `sub` is a proper unique identifier per Idura tenant.

### Phase 6: Environment Variables

New env vars to add:

```env
# Idura FTN configuration
PUBLIC_IDENTITY_PROVIDER_TYPE=idura  # or 'signicat'
PUBLIC_IDURA_DOMAIN=your-subdomain.idura.broker
PUBLIC_IDENTITY_PROVIDER_CLIENT_ID=your_client_id
IDURA_SIGNING_JWKS='[{...private signing JWK...}]'
IDURA_SIGNING_KEY_KID=your_signing_key_kid
IDENTITY_PROVIDER_DECRYPTION_JWKS='[{...private encryption JWK...}]'
IDURA_JWKS_URI=https://your-subdomain.idura.broker/.well-known/jwks
IDURA_ISSUER=https://your-subdomain.idura.broker
```

### Phase 7: Provider Abstraction (optional, recommended)

Create a thin abstraction so the codebase can switch between Signicat and Idura via env config:

- `apps/frontend/src/lib/api/utils/auth/providers/signicat.ts`
- `apps/frontend/src/lib/api/utils/auth/providers/idura.ts`
- `apps/frontend/src/lib/api/utils/auth/providers/index.ts` -- exports active provider based on `PUBLIC_IDENTITY_PROVIDER_TYPE`

Each provider implements: `getAuthorizeUrl()`, `exchangeCodeForToken()`, `getIdTokenClaims()`.

## Files to Create/Modify

| File | Action | Purpose |
|---|---|---|
| `apps/frontend/src/routes/api/oidc/authorize/+server.ts` | **Create** | Server-side JAR construction |
| `apps/frontend/src/routes/api/oidc/token/+server.ts` | **Modify** | `private_key_jwt` token exchange |
| `apps/frontend/src/routes/candidate/preregister/+page.svelte` | **Modify** | Server-side redirect instead of client-side |
| `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts` | **Modify** | Support Idura's JWE format (RSA-OAEP-256) |
| `apps/frontend/src/lib/api/utils/auth/providers/` | **Create** | Provider abstraction |
| `apps/supabase/supabase/functions/signicat-callback/index.ts` | **Modify** | Provider-agnostic, `sub`-based identity matching |
| `apps/frontend/src/lib/server/constants.ts` | **Modify** | New Idura env vars |
| `apps/frontend/src/lib/utils/constants.ts` | **Modify** | New public Idura env vars |
| `.env.example` | **Modify** | Document Idura variables |

## Idura FTN Claims

```json
{
  "sub": "{persistent-pseudonym-uuid}",
  "given_name": "Vaino",
  "family_name": "Tunnistus",
  "birthdate": "1970-07-07",
  "country": "FI",
  "hetu": "070770-905D",
  "satu": "",
  "identityscheme": "fitupas"
}
```

The `sub` claim is a persistent pseudonym unique per Idura tenant -- this is the correct field for identity matching (replaces `birthdate` which is not unique).

## Testing

- Idura provides test users for all Finnish banks (Aktia, Nordea, OP, S-Pankki, etc.)
- Test mode available via Idura sandbox/test domain
- E2E tests would need to be adapted to mock the Idura OIDC flow (same approach as current Signicat tests)

## Production Requirements

A legal agreement with Idura is required for production FTN access, available via their dashboard at https://dashboard.idura.app/providers/FI_TELIA/contract. This is a business/legal step, not a technical one.

## Sources

- Idura FTN docs: https://docs.idura.app/verify/e-ids/finnish-trust-network/
- Idura OIDC intro: https://docs.idura.app/verify/getting-started/oidc-intro/
- Supabase custom OIDC providers: https://supabase.com/docs/guides/auth/custom-oauth-providers
- FTN security requirements PDF: https://www.kyberturvallisuuskeskus.fi/sites/default/files/media/file/Traficom_S213_2023_OIDC_Profile_v2_2_for_the_Finnish_Trust_Network_EN.pdf
