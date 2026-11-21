---
created: 2026-10-02
title: "SECURITY: the bank-auth OIDC callback deletes the oidc_nonce cookie but never compares it with the ID token's nonce claim"
area: apps/frontend/src/routes/api/oidc
severity: major
security: true
source: Phase 168 (docs-site rewrite), 168-06 finding F7 (read, not run), filed by plan 168-08 because no existing todo covers it
related_phase: 168
files:
  - apps/frontend/src/routes/api/oidc/callback/+server.ts (`The authorize endpoint stores a nonce for Idura; it is cleared here.`, between `provider.getIdTokenClaims(idToken)` and `register({ idToken, … })`)
  - apps/frontend/src/routes/api/oidc/authorize/+server.ts (`if (result.nonce) cookies.set(COOKIE.oidcNonce, result.nonce, FLOW_COOKIE_OPTIONS);`)
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

## Update 2026-10-22 — re-anchored to the callback as it is now; still open (Phase 179, decision D-17)

Phase 179 rewrote the callback and did not change token verification. The nonce is still not checked. Two things are different now.

**The callback now turns a verified token directly into a session, so the nonce is the remaining replay control for Idura.** In `apps/frontend/src/routes/api/oidc/callback/+server.ts`:

1. The browser-bound proof is checked: for Idura, the returned `state` against the `oidc_state` cookie. Without it the answer is `invalid_state`, before any token request.
2. The code is exchanged for the ID token (`provider.exchangeCodeForToken`), and the token's signature and claims are checked (`provider.getIdTokenClaims`).
3. The `oidc_nonce` cookie is deleted unread. The comment above it now reads "The authorize endpoint stores a nonce for Idura; it is cleared here."
4. `register(…)` sends the token to `identity-callback` with the server's credential (`x-identity-callback-secret`), takes the `token` the function answers with, and signs the browser in with `verifyOtp` on the same request.

Before Phase 179 the callback stored the token in a cookie, and a separate page and route spent it later. Now one request goes from the token to a session. The `state` binding blocks login CSRF, and the authorization code is single-use at the provider, so a token replayed *to the callback* is not a path: the callback obtains the token itself. A token replayed *to the function* is, and the function now refuses every caller without the frontend server's secret (179-15). What the nonce would still add is the binding of the token to this browser's authorization request.

**Where the fix goes now.** The suggested fix above still holds, with these new anchors:

- Compare `claims.nonce` with the cookie after `provider.getIdTokenClaims(idToken)` and before `register(…)`.
- On a missing or mismatched nonce, `throw redirect(303, errorScreen(OIDC_ERROR.invalidToken, locale))`, as the claim check does. That is the error screen's `invalid_token` code, in the class that trying again may cure.
- The callback's unit cases are in `apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts`.
- The mock issuer that every default E2E run starts (`tests/tests/support/mockOidcIssuer.ts`) puts no `nonce` claim in the tokens it mints today. With the check in place, every identity-provider scenario of the suite would fail. So the fix must also make the mock echo the request's nonce, and it can add a scenario that mints a wrong nonce as the E2E negative case.
- The `types.ts` docstring still claims the check exists.
- The bank-authentication developer page, `/developers-guide/contestant-app/bank-authentication`, says the route "deletes the `oidc_nonce` cookie, but does not compare the nonce with the token's `nonce` claim". Change it with the fix.
