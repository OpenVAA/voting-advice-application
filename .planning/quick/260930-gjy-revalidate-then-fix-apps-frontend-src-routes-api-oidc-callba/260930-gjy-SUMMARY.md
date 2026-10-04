---
phase: quick-260930-gjy
plan: 01
quick_id: 260930-gjy
status: complete
subsystem: frontend/auth (OIDC callback)
tags: [security, oidc, login-csrf, idura, signicat, pkce]
requires: []
provides:
  - "Fail-closed per-binding check in GET /api/oidc/callback"
  - "Required IdentityProvider.callbackBinding ('state' | 'pkce')"
affects:
  - apps/frontend/src/routes/api/oidc/callback/+server.ts
tech-stack:
  added: []
  patterns:
    - "Provider declares its callback binding; the route switches on it, with a compile-time exhaustive fail-closed default"
key-files:
  created:
    - apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
  modified:
    - apps/frontend/src/routes/api/oidc/callback/+server.ts
    - apps/frontend/src/lib/api/utils/auth/providers/types.ts
    - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
    - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
    - tests/IDURA-TEST-RUNBOOK.md
decisions:
  - "Every binding failure reuses OIDC_ERROR.invalidState, so the four-member operator contract stays unchanged"
  - "The binding check sits inside the existing try, after getActiveProvider(), so an unknown provider type still ends as token_exchange_failed"
  - "Exhaustiveness is enforced with a used `never` binding that is logged (binding name only, never a secret), so no lint disable comment is needed"
metrics:
  duration: "~15 min"
  completed: 2026-09-30
actuals:
  tokens: 5000
  tasks: 3
  commits: 3
plan_head_before: f8769eb97beaebdc0f5e35a62dc14430952aa4d4
plan_head_after: d88096c06cfa74fa60c66cad3160076a1037b335
---

# Quick 260930-gjy: Fail-closed OIDC callback binding Summary

The OIDC callback no longer redeems an authorization code unless the browser proves that it started the flow. Each `IdentityProvider` now declares a required `callbackBinding`. Idura uses `'state'`: the callback needs the `oidc_state` cookie plus an equal `?state=`. Signicat uses `'pkce'`: the callback needs the `oidc_code_verifier` cookie. A binding the route does not recognise fails closed. Every rejection redirects with `invalid_state` and clears the flow cookies. This closes the login-CSRF vector.

**BASE:** `f8769eb97beaebdc0f5e35a62dc14430952aa4d4`

## Revalidation at BASE (all four held)

- **(a)** In `apps/frontend/src/routes/api/oidc/callback/+server.ts`, the block under the comment `// Verify state parameter (CSRF protection).` ran `const storedState = cookies.get(COOKIE.oidcState); if (storedState) { ... }`. The comparison happened only when the cookie was present, so with no cookie the handler went straight on to `provider.exchangeCodeForToken`. That comment's own wording was "If no stored state exists, skip verification". Confirmed by the RED run below.
- **(b)** In `apps/frontend/src/lib/api/utils/auth/providers/idura.ts`, `getAuthorizeUrl` always runs `const state = crypto.randomUUID();` and returns `{ authorizeUrl, clientSideRedirect: false, state, nonce }`. In `apps/frontend/src/routes/api/oidc/authorize/+server.ts`, `if (result.state) { cookies.set(COOKIE.oidcState, ...` stores it (httpOnly, lax, maxAge 600).
- **(c)** In `apps/frontend/src/lib/api/utils/auth/providers/signicat.ts`, `getAuthorizeUrl` returns `{ authorizeUrl, clientSideRedirect: true }` with no state. It throws `'Signicat authorization requires a PKCE \`codeChallenge\`...'` when the challenge is missing, and its token exchange sends `code_verifier: codeVerifier!`. In `apps/frontend/src/routes/candidate/preregister/+page.svelte`, the `case 'signicat-ftn'` branch writes `document.cookie = \`${COOKIE.oidcCodeVerifier}=...\`` before `window.location.href = authorizeUrl`.
- **(d)** Both branches of `redirectToIdentityProvider` in `+page.svelte` build a single `redirectUri` from `getRoute.current('CandAppPreregisterIdentityProviderCallback')`.

## RED evidence

**Task 1, Idura missing state cookie, at BASE:**
```
 × GET /api/oidc/callback > Idura (state binding) > rejects a code that arrives without the state cookie 6ms
   → expected Redirect{ status: 303, …(1) } to match object { status: 303, …(1) }
- Expected
+ Received
- {
-   "location": "/candidate/preregister?error=invalid_state",
+ Redirect {
+   "location": "/candidate/preregister",
    "status": 303,
  }
 Tests  1 failed (1)
```
The handler exchanged the attacker's code and sent the visitor to the success redirect.

**Task 2, Signicat missing verifier, after Task 1 and before the pkce change:**
```
 × GET /api/oidc/callback > Signicat (PKCE binding) > rejects a code that arrives without the PKCE verifier cookie 4ms
   → expected Redirect{ status: 303, …(1) } to match object { status: 303, …(1) }
-   "location": "/candidate/preregister?error=invalid_state",
+   "location": "/candidate/preregister",
 Tests  1 failed | 10 passed (11)
```

## Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 (RED) | Test: Idura code without state cookie is rejected | 8d42c0dee | callback-endpoint.test.ts |
| 1 (GREEN) | Callback fails closed without the Idura state cookie; `callbackBinding` added | 069f03d4d | +server.ts, types.ts, idura.ts, signicat.ts |
| 2 | Callback fails closed without the Signicat PKCE verifier; full matrix; runbook | d88096c06 | +server.ts, callback-endpoint.test.ts, IDURA-TEST-RUNBOOK.md |
| 3 | Gates and scan (verification only, nothing to fix) | none | none |

Tracer gate after Task 1: `<verify>` was re-run end to end and passed (1/1) before the expansion in Task 2.

## Verification

- `yarn workspace @openvaa/frontend test:unit src/lib/api/utils/auth src/lib/candidate/utils/oidcError.test.ts`: exit 0, 12 files, 185 tests passed. That includes `callback-endpoint.test.ts` (11 tests), `oidcError.test.ts` (14, with `OIDC_ERROR` still exactly four members), `authorize-endpoint`, `token-endpoint`, `idura`, `signicat` and `authorize-fail-closed`.
- `yarn workspace @openvaa/frontend check`: exit 0 (2223 files, 0 errors, 0 warnings).
- `yarn lint:check`: exit 0.
- `yarn workspace @openvaa/frontend test:unit` (full suite): exit 0, 128 files, 2050 tests passed, 0 failed.
- Added-line hygiene scan (`git diff -U0 f8769eb97 -- apps/frontend tests/IDURA-TEST-RUNBOOK.md`, `+` lines, grep for `\.planning/|D-[0-9][0-9]|T-[0-9]|[Pp]hase [0-9]|v2\.[0-9]`): grep exit 1, empty, so clean. I also read the touched comments by hand. They state the current rule, with no history and nothing addressed to a reviewer.
- **bank-auth-journey: NOT RUN.** This is an open verification item. The opt-in project joins the tail of the perm serial chain, so a run takes full-suite time. It needs the shared local Supabase Edge Function env reconfigured (`IDENTITY_PROVIDER_ISSUER=https://127.0.0.1:9443`), plus a dedicated dev server started with the journey env and `NODE_TLS_REJECT_UNAUTHORIZED=0`. Sibling batch items share this checkout and the local Supabase stack, so standing that environment up here would mutate shared state. The matching-state path the journey takes (the mock issuer echoes the JAR `state`) is covered at unit level by "exchanges the code and sets the id_token cookie when the state matches". I have not observed it end to end.

## Deviations from Plan

None. The plan was executed as written. A small addition: the default (unrecognised binding) branch logs the binding name, which is not a secret, through `console.error`. That keeps the `never` variable in use, so the exhaustiveness check passes lint with no disable comment, as the plan requires.

## Threat Flags

None. No new surface was added. The change narrows an existing endpoint.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
- FOUND commits: 8d42c0dee, 069f03d4d, d88096c06
