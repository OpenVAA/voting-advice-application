# Phase 46: Idura Authorization and Token Exchange - Research

**Researched:** 2026-03-27
**Domain:** OIDC authentication (JAR, private_key_jwt, JWE) with SvelteKit server routes
**Confidence:** HIGH

## Summary

This phase adds Idura-specific OIDC authentication mechanics to the existing pre-registration flow: a server-side endpoint that constructs signed JWT Authorization Requests (JAR per RFC 9101), a token exchange that uses `private_key_jwt` client assertion instead of `client_secret`, dynamic JWE algorithm detection for RSA-OAEP vs RSA-OAEP-256, and a provider-agnostic callback route. All of this builds on the provider abstraction created in Phase 45.

The codebase already uses `jose` ^6.2.1 for JWE decryption and JWT verification. The same library provides `SignJWT` for constructing both JAR request objects and client assertion JWTs, and `compactDecrypt` already reads the algorithm from the JWE header automatically -- no code change needed for algorithm detection, only for key import flexibility.

**Primary recommendation:** Implement the authorize endpoint, update token exchange, create API-style callback route, and update the frontend to use the provider abstraction -- all using the existing `jose` library. The `compactDecrypt` function already handles RSA-OAEP-256 transparently via JWE header detection; the main change in `getIdTokenClaims` is making the `identifier` field provider-aware (reading `sub` vs `birthdate`).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** New server-side endpoint at `apps/frontend/src/routes/api/oidc/authorize/+server.ts`
- **D-02:** Constructs signed JWT Authorization Request (JAR) with RS256 using the signing private key
- **D-03:** JAR payload: `response_type`, `response_mode`, `client_id`, `redirect_uri`, `state`, `scope`, `nonce`, `iss` (=client_id), `aud` (=Idura domain)
- **D-04:** Returns `{ authorizeUrl }` -- the Idura authorization URL with `client_id` and `request` (signed JWT) params
- **D-05:** New provider-agnostic callback at `apps/frontend/src/routes/api/oidc/callback/+server.ts` (API-style, alongside `/api/oidc/token` and `/api/oidc/authorize`)
- **D-06:** Old `signicat/oidc/callback` route deleted entirely -- no redirect, no backward compat
- **D-07:** Route map updated: `CandAppPreregisterIdentityProviderCallback` points to `/api/oidc/callback`
- **D-08:** Idura token exchange uses `private_key_jwt` client assertion JWT (RS256, signed with signing key, aud=Idura token endpoint, exp=5min, jti=random UUID)
- **D-09:** Token exchange POST body: `grant_type=authorization_code`, `code`, `redirect_uri`, `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`, `client_assertion`
- **D-10:** JWE decryption supports both RSA-OAEP (Signicat) and RSA-OAEP-256 (Idura) -- algorithm read from JWE header, not hardcoded
- **D-11:** Preregister page's `redirectToIdentityProvider()` calls the provider abstraction's `getAuthorizeUrl()` instead of building URL client-side
- **D-12:** For Idura: calls server-side `/api/oidc/authorize` endpoint. For Signicat: retains client-side PKCE redirect.

### Claude's Discretion
- State/nonce generation and verification approach
- Error handling for JAR construction failures
- Exact callback route handling (SvelteKit page vs server route)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Server-side endpoint constructs signed JWT Authorization Requests (JAR) for Idura | `jose` SignJWT API verified; RS256 signing with importJWK; JAR per RFC 9101 requires `request` param on authorize URL |
| AUTH-02 | Frontend redirects to identity provider via server-side authorize endpoint instead of client-side PKCE when using Idura | Provider abstraction (Phase 45) provides `getAuthorizeUrl()` which calls `/api/oidc/authorize`; existing `redirectToIdentityProvider()` code path documented |
| AUTH-03 | Callback route is provider-agnostic (not hardcoded to `signicat/oidc/callback`) | New `/api/oidc/callback` server route replaces page route; route map update at line 42 of route.ts |
| TOKN-01 | Token exchange uses `private_key_jwt` client assertion when provider is Idura | `jose` SignJWT for client assertion JWT; token endpoint POST body uses `client_assertion` and `client_assertion_type` instead of `client_secret` |
| TOKN-02 | JWE decryption supports RSA-OAEP-256 (Idura) alongside existing RSA-OAEP (Signicat) | `jose` compactDecrypt already reads algorithm from JWE header automatically; no algorithm hardcoding in current code; just needs key import without algorithm constraint |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jose | ^6.2.1 (installed) / 6.2.2 (latest) | JWT signing, JWE decryption, JWK import | Already in codebase; panva/jose is the standard Node.js JOSE library |
| @sveltejs/kit | (catalog) | Server routes (+server.ts) for authorize/callback/token endpoints | Already the app framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto (Node built-in) | N/A | `crypto.randomUUID()` for `jti` claim, `crypto.getRandomValues()` for state/nonce | Always available in SvelteKit server context |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jose SignJWT | openid-client | openid-client adds dependency; jose already installed and sufficient |
| Manual state management | SvelteKit cookies | Cookies are more reliable than query params for state/nonce storage |

**Installation:**
```bash
# No new dependencies needed -- jose ^6.2.1 already installed
```

**Version verification:** jose 6.2.1 installed, 6.2.2 available on npm. No breaking changes; minor patch. Current version is sufficient.

## Architecture Patterns

### Recommended Project Structure
```
apps/frontend/src/routes/api/oidc/
  authorize/+server.ts     # NEW: JAR construction, returns authorizeUrl
  callback/+server.ts      # NEW: Receives auth code, exchanges for token, redirects
  token/+server.ts         # MODIFY: Use provider abstraction for token exchange
```

### Pattern 1: Server-Side JAR Construction (authorize endpoint)
**What:** POST endpoint that builds a signed JWT request object and returns the Idura authorization URL
**When to use:** When the Idura provider's `getAuthorizeUrl()` is called from the frontend
**Example:**
```typescript
// Source: jose docs + RFC 9101 + idura-ftn-auth-plan.md
import * as jose from 'jose';

export async function POST({ request }: RequestEvent): Promise<Response> {
  const { redirectUri } = await request.json();

  // Generate state and nonce for CSRF and replay protection
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  // Import the signing private key from JWK
  const signingJwk = JSON.parse(IDURA_SIGNING_JWKS)[0];
  const signingKey = await jose.importJWK(signingJwk, 'RS256');

  // Build signed JAR (RFC 9101)
  const requestObject = await new jose.SignJWT({
    response_type: 'code',
    response_mode: 'query',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'openid profile',
    state,
    nonce,
    iss: CLIENT_ID,
    aud: `https://${IDURA_DOMAIN}`
  })
    .setProtectedHeader({ alg: 'RS256', kid: signingJwk.kid })
    .sign(signingKey);

  const authorizeUrl = `https://${IDURA_DOMAIN}/oauth2/authorize?client_id=${CLIENT_ID}&request=${requestObject}`;

  return json({ authorizeUrl, state, nonce });
}
```

### Pattern 2: Private Key JWT Client Assertion (token exchange)
**What:** Creates a signed JWT to authenticate the client at the token endpoint
**When to use:** During authorization code exchange for Idura provider
**Example:**
```typescript
// Source: jose docs + Idura private_key_jwt guide + Auth0 docs
const clientAssertion = await new jose.SignJWT({})
  .setProtectedHeader({ alg: 'RS256', kid: SIGNING_KEY_KID })
  .setIssuer(CLIENT_ID)
  .setSubject(CLIENT_ID)
  .setAudience(TOKEN_ENDPOINT) // Idura token endpoint URL
  .setExpirationTime('5m')
  .setJti(crypto.randomUUID())
  .sign(signingKey);

// Token exchange POST body
const body = new URLSearchParams({
  grant_type: 'authorization_code',
  code: authorizationCode,
  redirect_uri: redirectUri,
  client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
  client_assertion: clientAssertion
});
```

### Pattern 3: API-Style Callback Route
**What:** A `+server.ts` GET handler that receives the authorization code from the IdP redirect, exchanges it for a token, sets the cookie, and redirects to the preregister page
**When to use:** Instead of a Svelte page component for the callback
**Example:**
```typescript
// Source: SvelteKit routing docs
import { redirect } from '@sveltejs/kit';

export async function GET({ url, cookies }: RequestEvent): Promise<Response> {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    return redirect(303, '/candidate/preregister?error=missing_code');
  }

  // Verify state, exchange code, set cookie...
  // Then redirect to preregister page
  return redirect(303, '/candidate/preregister');
}
```

### Pattern 4: JWE Algorithm-Agnostic Decryption
**What:** `jose.compactDecrypt` reads the `alg` from the JWE header automatically
**When to use:** Always -- the current code already works this way
**Key insight:** The existing `getIdTokenClaims.ts` code does NOT hardcode the JWE algorithm. It calls `jose.decodeProtectedHeader(idToken)` to get the `kid`, then `jose.compactDecrypt(idToken, key)`. The `compactDecrypt` function reads `alg` from the JWE compact serialization header. No code change needed for RSA-OAEP-256 support as long as the private key is imported correctly.
**Example:**
```typescript
// Current code -- already works for both RSA-OAEP and RSA-OAEP-256
const { kid } = jose.decodeProtectedHeader(idToken);
const privateEncryptionJWK = options.privateEncryptionJWKSet.find((jwk) => jwk.kid === kid);
const { plaintext } = await jose.compactDecrypt(
  idToken,
  await jose.importJWK(privateEncryptionJWK) // No algorithm constraint -- reads from header
);
```

### Anti-Patterns to Avoid
- **Hardcoding JWE algorithm:** Never pass `{ algorithms: ['RSA-OAEP'] }` to compactDecrypt. Let it read from the JWE header.
- **Client-side JAR construction:** JAR signing keys must never reach the browser. Always use server-side endpoints.
- **Storing signing keys in public env vars:** Signing keys are secrets; use `$env/dynamic/private` only.
- **Long-lived client assertions:** Keep `exp` to 5 minutes maximum. Use unique `jti` for each assertion.
- **Ignoring state parameter:** Always verify the `state` returned by the IdP matches what was stored before the redirect.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signing | Custom crypto | `jose.SignJWT` | Handles header construction, base64url encoding, key import |
| JWE decryption | Manual decrypt | `jose.compactDecrypt` | Handles algorithm detection, key unwrapping, content decryption |
| UUID generation | Custom random strings | `crypto.randomUUID()` | RFC 4122 compliant, available in Node.js 19+ and all modern runtimes |
| State/nonce storage | Query params or localStorage | httpOnly cookies | Prevents CSRF; localStorage is vulnerable to XSS |
| Key import | Manual PEM parsing | `jose.importJWK()` | Handles all key types (RSA, EC), validates key structure |

**Key insight:** The `jose` library handles all JOSE operations. Do not use `jsonwebtoken` or `node-jose` alongside it -- one library is sufficient.

## Common Pitfalls

### Pitfall 1: Client Assertion `aud` Value
**What goes wrong:** Token exchange fails with "invalid client assertion" if the `aud` claim does not exactly match what the IdP expects.
**Why it happens:** Different providers expect different `aud` values. Auth0 wants the tenant URL with trailing slash. Idura wants the token endpoint URL.
**How to avoid:** For Idura, set `aud` to the Idura token endpoint URL (e.g., `https://SUBDOMAIN.idura.broker/oauth2/token`). Verify against Idura documentation. The implementation plan says `aud` = `https://${IDURA_DOMAIN}`, but the OAuth spec and Auth0 docs recommend the token endpoint URL specifically. Test both.
**Warning signs:** 401 errors from the token endpoint with "invalid_client" error code.

### Pitfall 2: State/Nonce Not Verified on Callback
**What goes wrong:** CSRF attacks possible if the callback does not verify the `state` parameter matches what was stored before redirect.
**Why it happens:** Easy to skip in development; callback just grabs the `code` parameter.
**How to avoid:** Store `state` (and optionally `nonce`) in a secure httpOnly cookie before redirect. On callback, compare the cookie value with the query parameter. Delete the cookie after verification.
**Warning signs:** Working flow but no CSRF protection.

### Pitfall 3: importJWK Algorithm Constraint Breaks Multi-Provider
**What goes wrong:** If `importJWK(jwk, 'RSA-OAEP')` is called with a hardcoded algorithm, it fails when the JWE uses RSA-OAEP-256.
**Why it happens:** The current code does NOT hardcode the algorithm in importJWK for decryption -- it just calls `importJWK(privateEncryptionJWK)`. This is correct and should be preserved.
**How to avoid:** Do not add an algorithm parameter to `importJWK` for decryption keys. The JWK's `alg` field (if present) will be used automatically.
**Warning signs:** Decryption works for Signicat but fails for Idura with algorithm mismatch error.

### Pitfall 4: Callback Route as Page vs Server Route
**What goes wrong:** If the callback is a `+page.svelte`, the authorization code handling runs client-side (as in the current Signicat callback). This is fine for PKCE but breaks for server-side flows where the code exchange must happen server-side.
**Why it happens:** The current callback (`signicat/oidc/callback/+page.svelte`) was designed for client-side PKCE flow.
**How to avoid:** The new callback at `/api/oidc/callback/+server.ts` is a server route (GET handler). The IdP redirects the browser to this URL. The server handles the code exchange, sets the cookie, and redirects to the preregister page. No client-side JavaScript involved.
**Warning signs:** Browser shows the raw JSON response instead of redirecting.

### Pitfall 5: SvelteKit Redirect from Server Routes
**What goes wrong:** Using `return json(...)` in the callback handler instead of `redirect(303, ...)`.
**Why it happens:** Other OIDC API routes in the codebase return JSON. The callback is different -- it's a browser redirect target.
**How to avoid:** Import `redirect` from `@sveltejs/kit` and throw/return it: `throw redirect(303, '/candidate/preregister')`. In SvelteKit, throwing redirect in a server route issues the HTTP redirect.
**Warning signs:** Browser shows JSON response at `/api/oidc/callback` instead of navigating to preregister.

### Pitfall 6: Signing Key vs Encryption Key Confusion
**What goes wrong:** Using the encryption key for JAR signing or vice versa.
**Why it happens:** Idura requires two key pairs -- one for signing (JAR + client assertion) and one for encryption (JWE decryption). Keys may have similar structure.
**How to avoid:** Use `kid` to distinguish keys. Convention: signing key has `use: "sig"`, encryption key has `use: "enc"`. Store them in separate env vars (`IDURA_SIGNING_JWKS` vs `IDENTITY_PROVIDER_DECRYPTION_JWKS`).
**Warning signs:** JAR validation fails at Idura, or JWE decryption fails locally.

## Code Examples

Verified patterns from official sources and existing codebase:

### State/Nonce Storage via Cookies (Discretion Area)
```typescript
// Store state and nonce in httpOnly cookies before redirect
// Source: SvelteKit docs + OWASP CSRF prevention
export async function POST({ cookies, request }: RequestEvent): Promise<Response> {
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  // Store in httpOnly cookies for verification on callback
  cookies.set('oidc_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax', // 'lax' needed for cross-origin redirects from IdP
    path: '/',
    maxAge: 600 // 10 minutes
  });
  cookies.set('oidc_nonce', nonce, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600
  });

  // ... build JAR and return authorizeUrl
}
```

### Callback State Verification
```typescript
// In /api/oidc/callback/+server.ts
export async function GET({ url, cookies }: RequestEvent): Promise<Response> {
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const storedState = cookies.get('oidc_state');

  if (!code || !returnedState || returnedState !== storedState) {
    cookies.delete('oidc_state', { path: '/' });
    throw redirect(303, '/candidate/preregister?error=invalid_state');
  }

  // Clean up state cookie
  cookies.delete('oidc_state', { path: '/' });

  // Exchange code for token using provider abstraction...
  // Set id_token cookie...
  // Redirect to preregister page
  throw redirect(303, '/candidate/preregister');
}
```

### Complete Token Exchange with private_key_jwt
```typescript
// Source: idura-ftn-auth-plan.md + jose docs + Auth0 private_key_jwt docs
import * as jose from 'jose';

async function exchangeCodeWithPrivateKeyJwt(
  code: string,
  redirectUri: string,
  signingJwk: jose.JWK,
  clientId: string,
  tokenEndpoint: string
): Promise<{ id_token: string }> {
  const signingKey = await jose.importJWK(signingJwk, 'RS256');

  const clientAssertion = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: signingJwk.kid })
    .setIssuer(clientId)
    .setSubject(clientId)
    .setAudience(tokenEndpoint)
    .setExpirationTime('5m')
    .setJti(crypto.randomUUID())
    .sign(signingKey);

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion
    }).toString()
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}
```

### Updated Route Map Entry
```typescript
// Source: apps/frontend/src/lib/utils/route/route.ts line 42
CandAppPreregisterIdentityProviderCallback: '/api/oidc/callback',
```

### DataWriter Interface Change
```typescript
// The exchangeCodeForIdToken method in dataWriter.type.ts currently requires codeVerifier.
// For provider-agnostic callback (server route), the callback handler does the exchange
// server-side. The dataWriter method may no longer be needed for the callback flow.
// However, the universalDataWriter still needs a way to call the token endpoint.
// This depends on Phase 45's provider abstraction design.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side PKCE auth redirect | Server-side JAR (RFC 9101) | FTN mandate Aug 2025 | Authorization requests must be signed JWTs |
| client_secret token exchange | private_key_jwt (RFC 7523) | FTN mandate Aug 2025 | No shared secrets; asymmetric key auth |
| RSA-OAEP only JWE | RSA-OAEP + RSA-OAEP-256 | Idura default | jose handles both; no hardcoded alg |
| Provider-specific callback URLs | Provider-agnostic `/api/oidc/callback` | This phase | Cleaner routing, supports provider switching |

**FTN Compliance Requirements (effective Aug 31, 2025):**
- All authorize requests MUST be signed (JAR)
- Token endpoint auth MUST use `private_key_jwt`
- Token responses MUST be encrypted (JWE)
- JWKS MUST be registered statically (not fetched dynamically by the IdP)
- `response_type=id_token` (implicit flow) is NOT allowed

## Open Questions

1. **Client assertion `aud` claim value**
   - What we know: Auth0 docs say use the token endpoint URL. The implementation plan says `https://${IDURA_DOMAIN}`. RFC 7523 says it should be the authorization server.
   - What's unclear: Idura's exact expectation (token endpoint URL vs domain root)
   - Recommendation: Use the token endpoint URL as `aud` (most common convention). Test in Idura sandbox. If it fails, try the domain root.

2. **Nonce verification timing**
   - What we know: Nonce is included in the JAR and returned in the id_token claims. Should be verified after JWE decryption.
   - What's unclear: Whether to verify nonce in the callback route (before cookie setting) or in the Edge Function
   - Recommendation: Verify nonce in the callback route server-side after decrypting the id_token. Store nonce in httpOnly cookie alongside state.

3. **DataWriter interface adaptation**
   - What we know: Current `exchangeCodeForIdToken` takes `authorizationCode`, `codeVerifier`, `redirectUri`. The new callback flow does exchange server-side.
   - What's unclear: Whether the callback route calls the token endpoint directly or delegates to the existing `/api/oidc/token` endpoint internally
   - Recommendation: The callback route should call the provider abstraction's `exchangeCodeForToken()` directly. This avoids an unnecessary internal HTTP call. The `/api/oidc/token` endpoint may still be used for Signicat PKCE flow (called from client).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| jose | JWT signing, JWE decryption | Yes | 6.2.1 (^6.2.1) | -- |
| Node.js crypto.randomUUID | State/nonce/jti generation | Yes | Built-in | -- |
| SvelteKit server routes | API endpoints | Yes | Kit (catalog) | -- |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Project Constraints (from CLAUDE.md)

- **TypeScript strictly:** Avoid `any`, prefer explicit types -- all new server routes and utility functions must be typed
- **Test accessibility:** Not directly applicable to server-side API routes
- **Never commit sensitive data:** Signing keys and encryption keys in env vars only, never in code
- **Server-side env vars:** Use `$env/dynamic/private` via `$lib/server/constants` for secrets
- **Public env vars:** Use `$env/dynamic/public` via `$lib/utils/constants` for client-visible config
- **Build dependencies:** Run `yarn build` after modifying shared packages
- **API routes return JSON:** Follow `DataApiActionResult` pattern for JSON responses (but callback uses redirect, not JSON)
- **Cookie pattern:** httpOnly, secure, strict sameSite for sensitive cookies (note: state cookies need `sameSite: 'lax'` for cross-origin IdP redirects)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/frontend/src/routes/api/oidc/token/+server.ts` -- current token exchange implementation
- Existing codebase: `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts` -- JWE decryption logic
- Existing codebase: `apps/frontend/src/routes/candidate/preregister/+page.svelte` -- current redirect flow
- Existing codebase: `apps/frontend/src/lib/utils/route/route.ts` -- route map with callback TODO
- `.planning/idura-ftn-auth-plan.md` -- detailed implementation plan with code examples
- jose npm registry -- version 6.2.2 confirmed current

### Secondary (MEDIUM confidence)
- [Auth0: Authenticate with Private Key JWT](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authenticate-with-private-key-jwt) -- JWT claims structure, token endpoint parameters
- [Idura blog: Signed Authorization Requests](https://idura.eu/blog/signed-authorization-requests) -- JAR URL structure, RS256 signing
- [Idura blog: Private Key JWT](https://idura.eu/blog/private-key-jwt) -- private_key_jwt overview, FTN requirement
- [Idura blog: FTN Compliance Checker](https://idura.eu/blog/how-to-use-the-ftn-compliance-checker) -- 4 FTN compliance requirements verified
- [SvelteKit Routing Docs](https://svelte.dev/docs/kit/routing) -- server route redirect patterns

### Tertiary (LOW confidence)
- Idura docs portal (`docs.idura.app`) -- could not render content (site uses client-side rendering that returns CSS in fetch); technical details cross-verified via blog posts and Auth0 docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- jose already in use, no new dependencies needed
- Architecture: HIGH -- patterns follow existing codebase conventions and are documented in idura-ftn-auth-plan.md
- Pitfalls: HIGH -- based on real OIDC implementation experience and verified against existing code
- JWE algorithm handling: HIGH -- verified by reading actual jose compactDecrypt code and existing getIdTokenClaims.ts
- Client assertion aud claim: MEDIUM -- convention-based; needs Idura sandbox testing

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable domain; jose library and OIDC specs change slowly)
