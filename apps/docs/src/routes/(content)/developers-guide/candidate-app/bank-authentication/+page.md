# Bank authentication (OIDC)

Candidates can pre-register by identifying themselves with a bank identity. The Candidate App talks to an OpenID Connect (OIDC) identity provider, and the `identity-callback` Edge Function turns the verified identity into a candidate account.

Two providers are implemented, both for the Finnish Trust Network:

| Provider type  | Provider | Authorization request                              | Token exchange                     | Callback proof                           |
| -------------- | -------- | -------------------------------------------------- | ---------------------------------- | ---------------------------------------- |
| `idura-ftn`    | Idura    | a signed request object (JAR), built on the server | `private_key_jwt` client assertion | `state`, kept in a cookie                |
| `signicat-ftn` | Signicat | PKCE, with the challenge made in the browser       | client secret                      | the PKCE code verifier, kept in a cookie |

The frontend picks the provider from `PUBLIC_IDENTITY_PROVIDER_TYPE`, and the Edge Function from `IDENTITY_PROVIDER_TYPE`. The two must name the same provider. The provider modules live in [`lib/api/utils/auth/providers`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/lib/api/utils/auth/providers).

Pre-registration is switched on with the `preRegistration.enabled` app setting. When it is off, the `/candidate/preregister` pages redirect to the login page.

## The flow

Every step that handles a token runs on the server: in a SvelteKit server route or in the Edge Function. The browser only starts the flow and follows redirects.

1. **Start.** The pre-registration page, `/candidate/preregister`, posts the callback URL to the server route `/api/oidc/authorize`, which asks the active provider for an authorization URL:
   - Idura: the server signs the request object with the signing key, and stores the request's `state` and `nonce` in `httpOnly` cookies for ten minutes. The signing key never reaches the browser.
   - Signicat: the browser makes a PKCE code verifier and challenge, sends the challenge, and stores the verifier in the `oidc_code_verifier` cookie so that the server can read it on the callback.

   The browser then goes to the provider.

2. **Callback.** The provider redirects to the server route `/api/oidc/callback` with an authorization code. The route:
   1. checks the browser-bound proof the provider declares: the returned `state` must equal the `oidc_state` cookie (Idura), or the `oidc_code_verifier` cookie must be present (Signicat). Without it, the code is not redeemed;
   2. exchanges the code for an ID token at the provider;
   3. decrypts and verifies the ID token (below);
   4. stores the ID token in the `id_token` cookie (`httpOnly`, `SameSite=Strict`) and redirects back to `/candidate/preregister`.

   Each failure redirects to `/candidate/preregister` with an `error` search parameter. The route deletes the `oidc_nonce` cookie, but does not yet compare the nonce with the token's `nonce` claim.

3. **Choices.** The pre-registration layout reads the `id_token` cookie on the server, verifies the token again and passes only the first and last name to the page. The candidate then chooses elections, constituencies and an email address on the pages under `/candidate/preregister`.
4. **Submit.** The candidate context's `preregister` posts the choices to the server route `/api/candidate/preregister`. The route reads the `id_token` cookie (`401` without it) and invokes the `identity-callback` Edge Function with the token. At the time of writing, the route sends only the token: the email address, the nominations and the email template the client posts are not used.
5. **Account.** `identity-callback` creates or finds the account (below) and returns a one-time sign-in link.
6. **Session.** The server route redeems the link's token with `verifyOtp`, which stores a Supabase session in cookies, and deletes the `id_token` cookie. The page then shows the result on `/candidate/preregister/status`; a `401` from the function shows the "token expired" result and a `409` the "candidate exists" result.

### Verifying the ID token in the frontend

[`decryptAndVerifyIdToken.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts) is the one decrypt and verify path in the frontend; both providers' `getIdTokenClaims` call it.

1. It decrypts the token (a JWE) with the private key from `IDENTITY_PROVIDER_DECRYPTION_JWKS` whose `kid` matches the token's header.
2. It verifies the inner token's signature against the provider's public keys at `IDENTITY_PROVIDER_JWKS_URI`.
3. It requires the audience `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` and the issuer `IDENTITY_PROVIDER_ISSUER`. A missing audience, issuer, key set or key-set URI is an error, not a skipped check.

### What `identity-callback` does

[`identity-callback/index.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/identity-callback/index.ts) runs with the service-role key and does not trust the caller; it trusts only the token it verifies.

1. It reads the provider configuration for `IDENTITY_PROVIDER_TYPE`. An unknown type gives `500`.
2. It decrypts the token if it is a JWE (five parts) with `IDENTITY_PROVIDER_DECRYPTION_JWKS`, and verifies the signature against `IDENTITY_PROVIDER_JWKS_URI` with the audience `IDENTITY_PROVIDER_CLIENT_ID` and the issuer `IDENTITY_PROVIDER_ISSUER`. A token that fails decryption, verification or claim extraction gives `401`.
3. It reads the claims: `sub` identifies the person, `given_name` and `family_name` give the name, and `birthdate` (both providers) and `hetu` (Idura) are stored in the auth user's `app_metadata`.
4. It looks for an auth user whose `app_metadata.identity_match_value` is the `sub` value. If there is none, it creates one with the placeholder email address `<sub>@bank-auth.placeholder`.
5. It looks for the user's candidate through the user's `editor` grants on candidates in the project `PUBLIC_PROJECT_ID`. If there is none, it creates a candidate with the name from the token.
6. It writes the `(entity, candidate, <id>, editor)` grant. If the write fails, a candidate created in step 5 is deleted again.
7. It generates a magic link for the user that redirects to `/candidate` under `SITE_URL`, and returns the link.

A `project_id` in the request body is accepted only when it names `PUBLIC_PROJECT_ID`.

## Configuration

Set the variable names below; the values come from the identity provider and from the keys you generate. [`docs/key-generation.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/docs/key-generation.md) describes how to generate the key pairs, how to format them as JWK sets for these variables and which public keys to register with the provider. Never commit the values.

The frontend reads these from the repo-root `.env` (see [Environment variables](/developers-guide/configuration/environmental-variables)):

| Variable                                          | Used for                                                                      |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `PUBLIC_IDENTITY_PROVIDER_TYPE`                   | the provider: `idura-ftn` or `signicat-ftn`                                   |
| `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`              | the client id, and the audience of the ID token                               |
| `IDENTITY_PROVIDER_DECRYPTION_JWKS`               | the private keys that decrypt the ID token                                    |
| `IDENTITY_PROVIDER_JWKS_URI`                      | the provider's public signing keys                                            |
| `IDENTITY_PROVIDER_ISSUER`                        | the expected issuer of the ID token                                           |
| `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT` | Signicat: the authorization endpoint                                          |
| `IDENTITY_PROVIDER_TOKEN_ENDPOINT`                | Signicat: the token endpoint                                                  |
| `IDENTITY_PROVIDER_CLIENT_SECRET`                 | Signicat: the client secret                                                   |
| `IDURA_DOMAIN`                                    | Idura: the tenant domain                                                      |
| `IDURA_SIGNING_JWKS`                              | Idura: the private key that signs the request object and the client assertion |
| `IDURA_SIGNING_KEY_KID`                           | Idura: which key in `IDURA_SIGNING_JWKS` to use                               |

Only the `PUBLIC_` variables reach the browser; the others are read by the server routes only.

The `identity-callback` Edge Function reads its own environment: `IDENTITY_PROVIDER_TYPE`, `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_ISSUER`, `PUBLIC_PROJECT_ID` and `SITE_URL`. Locally, its template is [`apps/supabase/supabase/functions/.env.example`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/functions/.env.example); see [Edge Functions](/developers-guide/backend/edge-functions) for how the local runtime reads it. `IDENTITY_PROVIDER_TYPE` and `IDENTITY_PROVIDER_CLIENT_ID` must have the same values as their `PUBLIC_` twins in the root `.env`. To compare the two files by name, run:

```bash
yarn check:env-local
```

## Testing

- The bank-authentication E2E projects are opt-in: they run only when `PLAYWRIGHT_BANK_AUTH` is set, and they need the `identity-callback` function to be served.
- [`tests/IDURA-TEST-RUNBOOK.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/tests/IDURA-TEST-RUNBOOK.md) walks through a manual end-to-end test against an Idura test tenant.
