---
created: 2026-10-02
title: "SECURITY: the bank-auth OIDC callback deletes the oidc_nonce cookie but never compares it with the ID token's nonce claim"
area: apps/frontend/src/routes/api/oidc
severity: major
security: true
source: Phase 168 (docs-site rewrite), 168-06 finding F7 (read, not run), filed by plan 168-08 because no existing todo covers it
related_phase: 168
files:
  - apps/frontend/src/routes/api/oidc/callback/+server.ts (`Nonce verification against the id_token nonce claim is a future enhancement.`)
  - apps/frontend/src/routes/api/oidc/authorize/+server.ts (`cookies.set(COOKIE.oidcNonce, result.nonce, {`)
  - apps/frontend/src/lib/api/utils/auth/providers/idura.ts (`const nonce = crypto.randomUUID();`)
  - apps/frontend/src/lib/api/utils/auth/providers/types.ts (the `nonce` docstring)
---

## Security relevance

**This is a security-relevant gap in the bank-authentication (Idura OIDC) flow.** The OIDC `nonce` binds an ID token to the browser
session that started the authorisation request. Checking it is what stops an ID token that was captured, replayed or injected from
being accepted for a different session. OpenID Connect Core § 3.1.3.7 says the client MUST check the claim when it sent a nonce. This
code sends one and never checks it.

## What the code does

1. **The nonce is generated and sent.** `apps/frontend/src/lib/api/utils/auth/providers/idura.ts` generates
   `const nonce = crypto.randomUUID();`, puts it in the signed request (JAR), and returns `{ authorizeUrl, clientSideRedirect: false, state, nonce }`.
2. **The nonce is stored.** `apps/frontend/src/routes/api/oidc/authorize/+server.ts` stores it in the httpOnly `oidc_nonce` cookie
   ("Store state and nonce in httpOnly cookies for verification on callback.").
3. **The nonce is never checked.** `apps/frontend/src/routes/api/oidc/callback/+server.ts` reads the cookie only to delete it:

   ```ts
   // Clean up nonce cookie (stored by the authorize endpoint for Idura).
   // Nonce verification against the id_token nonce claim is a future enhancement.
   const storedNonce = cookies.get(COOKIE.oidcNonce);
   if (storedNonce) {
     cookies.delete(COOKIE.oidcNonce, { path: '/' });
   }
   ```

   `git grep -n -i nonce -- apps ':!*.test.ts' ':!apps/docs'` finds no comparison anywhere, in the frontend or in the Edge Functions
   (`identity-callback` does not check it either).
4. **A docstring claims the check exists.** `apps/frontend/src/lib/api/utils/auth/providers/types.ts` documents the field as
   "For Idura: included in the JAR and verified against the id_token `nonce` claim after token exchange." The comment is false, which
   makes the gap easy to miss in review.

The `state` cookie is a separate CSRF guard and is not covered by this item.

## How serious, and what is unconfirmed

- The token arrives in a back-channel code exchange (the callback exchanges the authorisation code), and `state` is checked. That
  limits classic injection. So the practical exposure is lower than in an implicit flow, but it is not zero: the nonce is the only
  binding between the token and *this* session.
- Severity is recorded as `major` and not `blocking`, because the gap was read from the code and not exploited or run (UNCONFIRMED). The
  owner of the auth surface should set the final severity.
- Related pending auth-hardening todos: `2026-08-22-identity-callback-verifyjwt-fails-open-on-aud-iss.md` (aud/iss fail open) and
  `2026-09-02-close-bank-auth-oidc-round-trip-window.md` (no live OIDC E2E proof). Neither mentions the nonce
  (`grep -l -i nonce .planning/todos/pending/*` matched nothing before this file).

## Suggested fix

In the callback, after the token exchange and claim validation, compare `claims.nonce` with the `oidc_nonce` cookie when the provider
issued one (Idura). On a missing or mismatched nonce, reject with the same `OIDC_ERROR.invalidToken` redirect the claim check uses, then
delete the cookie as today. Add a unit test for match, mismatch and missing nonce, fix the `types.ts` docstring, and remove the
"future enhancement" comment.

## Docs

The Bank authentication page (`/developers-guide/candidate-app/bank-authentication`) states the current behaviour, that the nonce is
stored and deleted but not checked, and should be updated when this is fixed.
