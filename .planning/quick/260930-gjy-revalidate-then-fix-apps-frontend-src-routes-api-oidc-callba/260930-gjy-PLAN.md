---
phase: quick-260930-gjy
plan: 01
type: execute
wave: 1
depends_on: []
quick_id: 260930-gjy
files_modified:
  - apps/frontend/src/routes/api/oidc/callback/+server.ts
  - apps/frontend/src/lib/api/utils/auth/providers/types.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
  - tests/IDURA-TEST-RUNBOOK.md
autonomous: true
requirements: [QUICK-260930-gjy]

must_haves:
  truths:
    - "When Idura is the active provider, a request to /api/oidc/callback with any ?code= and no oidc_state cookie redirects 303 to /candidate/preregister?error=invalid_state. It never calls the token endpoint and never sets the id_token cookie. This is the login-CSRF vector closed."
    - "When Idura is the active provider, a callback whose ?state is missing or differs from the oidc_state cookie is rejected the same way, and the oidc_state and oidc_nonce cookies are cleared. With a matching state it exchanges the code, sets the httpOnly/secure/strict id_token cookie, clears oidc_state and redirects to /candidate/preregister with no error."
    - "When Signicat is the active provider, a callback without the oidc_code_verifier cookie is rejected with invalid_state before any token request. With the verifier it exchanges the code, passes that verifier through and clears the cookie. Signicat issues no state, so a state cookie is not required on that path."
    - "Every IdentityProvider must declare a required `callbackBinding` ('state' for Idura, 'pkce' for Signicat), so a provider that leaves it out does not compile. The callback's handling of an unrecognised binding also fails closed."
    - "The four OIDC_ERROR wire values are unchanged (the operator contract pinned by oidcError.test.ts). The runbook's invalid_state bullet describes a missing OR mismatched state cookie."
    - "The frontend check, yarn lint:check and the full frontend unit suite pass. The opt-in bank-auth-journey Playwright project is either observed green or recorded in SUMMARY as NOT RUN, an open verification that is never reported as passed."
  artifacts:
    - path: apps/frontend/src/routes/api/oidc/callback/+server.ts
      provides: "Per-binding fail-closed check between provider resolution and the code exchange"
      contains: "callbackBinding"
    - path: apps/frontend/src/lib/api/utils/auth/providers/types.ts
      provides: "Exported CallbackBinding type and required readonly callbackBinding on IdentityProvider"
      contains: "callbackBinding: CallbackBinding"
    - path: apps/frontend/src/lib/api/utils/auth/providers/idura.ts
      provides: "Idura declares the state binding"
      contains: "callbackBinding: 'state'"
    - path: apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
      provides: "Signicat declares the PKCE binding"
      contains: "callbackBinding: 'pkce'"
    - path: apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
      provides: "Route-level unit tests for GET /api/oidc/callback across both bindings, with a RED run recorded at HEAD"
      contains: "invalid_state"
  key_links:
    - from: apps/frontend/src/routes/api/oidc/callback/+server.ts
      to: apps/frontend/src/lib/api/utils/auth/providers/index.ts
      via: "getActiveProvider().callbackBinding selects which browser-bound proof the callback demands"
      pattern: "callbackBinding"
    - from: apps/frontend/src/routes/api/oidc/authorize/+server.ts
      to: apps/frontend/src/routes/api/oidc/callback/+server.ts
      via: "COOKIE.oidcState written at authorize (httpOnly, sameSite lax, 600 s) is the value the callback requires for the state binding"
      pattern: "COOKIE.oidcState"
    - from: apps/frontend/src/routes/candidate/preregister/+page.svelte
      to: apps/frontend/src/routes/api/oidc/callback/+server.ts
      via: "COOKIE.oidcCodeVerifier written by document.cookie before the Signicat redirect is the value the callback requires for the pkce binding"
      pattern: "COOKIE.oidcCodeVerifier"
    - from: tests/tests/support/mockOidcIssuer.ts
      to: apps/frontend/src/routes/api/oidc/callback/+server.ts
      via: "The E2E mock issuer echoes the JAR state back on ?state=, so the bank-auth journey takes the matching-state path the fix keeps open"
      pattern: "state="
---

<objective>
Revalidate, then close, the login-CSRF gap in the provider-agnostic OIDC callback. At the pinned HEAD, `apps/frontend/src/routes/api/oidc/callback/+server.ts` compares the returned `state` only when the `oidc_state` cookie is present. Without that cookie it exchanges whatever `?code=` it was given and plants the resulting `id_token` in the visitor's browser. An attacker who stops their own Idura login at the redirect can hand the code to a victim, and the victim is then signed in as the attacker.

What the planner measured at HEAD, which the executor re-measures in Task 1:
- **Idura**: `iduraProvider.getAuthorizeUrl` always generates `state` and `nonce`, embeds them in the signed JAR and returns them. `api/oidc/authorize/+server.ts` stores `state` in `COOKIE.oidcState` whenever it is returned. Idura uses `private_key_jwt` with no PKCE, so `state` is the only thing that ties a callback to the browser that started the flow. The fail-open branch serves no Idura flow.
- **Signicat**: `signicatProvider.getAuthorizeUrl` carries no `state` and requires a PKCE `code_challenge`. `routes/candidate/preregister/+page.svelte` writes the verifier into `COOKIE.oidcCodeVerifier` with `document.cookie` before redirecting. The PKCE verifier is Signicat's browser binding. When the verifier is absent, the callback still exchanges the code, and `signicat.ts` sends `code_verifier: codeVerifier!` (the literal `undefined`) to the token endpoint.
- Both flows use the same redirect target, route key `CandAppPreregisterIdentityProviderCallback` (`/api/oidc/callback`).

The fix: each provider declares which proof binds its callback. The callback demands that proof and fails closed without it: a matching `state` for Idura, a present verifier for Signicat. Neither flow has a legitimate case for fail-open, so the unconditional skip is removed rather than documented.

Purpose: a candidate's bank-authenticated identity can only come from a login their own browser started.
Output: the fail-closed callback, the `callbackBinding` declaration on both providers, a route-level unit test with a RED run recorded at HEAD, and a corrected runbook line.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@apps/frontend/src/routes/api/oidc/callback/+server.ts
@apps/frontend/src/routes/api/oidc/authorize/+server.ts
@apps/frontend/src/lib/api/utils/auth/providers/types.ts
@apps/frontend/src/lib/api/utils/auth/providers/idura.ts
@apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
@apps/frontend/src/lib/api/utils/auth/providers/index.ts
@apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
@apps/frontend/src/lib/candidate/utils/oidcError.ts
@apps/frontend/src/routes/candidate/preregister/+page.svelte
@tests/tests/support/mockOidcIssuer.ts

Interfaces the executor needs (verified at HEAD 79b4faed9):
- `GET({ url, cookies, locals }: RequestEvent): Promise<never>` in the callback route. It reads `locals.currentLocale` and emits every redirect via `buildRoute({ route: 'CandAppPreregister', locale, error? })`. Under the unit harness, locale `'en'` yields `/candidate/preregister` or `/candidate/preregister?error=<value>` (the Paraglide runtime is stubbed to identity, the same assumption `oidcError.test.ts` pins).
- `COOKIE` from `$lib/cookies`: `idToken`, `oidcState`, `oidcNonce`, `oidcCodeVerifier` (`id_token`, `oidc_state`, `oidc_nonce`, `oidc_code_verifier`).
- `OIDC_ERROR.invalidState === 'invalid_state'`. The four-member set is a closed operator contract pinned by `oidcError.test.ts`. Do not add a member.
- `getActiveProvider()` switches on `constants.PUBLIC_IDENTITY_PROVIDER_TYPE` from `$lib/utils/constants` (`'idura-ftn'` or `'signicat-ftn'`) and throws on anything else. Today it is called inside the route's `try`, and its throw becomes the `token_exchange_failed` redirect. Keep that outcome.
- `iduraProvider` and `signicatProvider` are plain object literals typed `IdentityProvider`, so `vi.spyOn(provider, 'exchangeCodeForToken')` and `vi.spyOn(provider, 'getIdTokenClaims')` work on them directly.
- SvelteKit's `redirect()` throws a `Redirect` carrying `status` and `location`. It is not an `Error`, so assert with `rejects.toMatchObject({ status: 303, location })`. That is the same reasoning `authorize-endpoint.test.ts` records for `HttpError`.
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: Revalidate at HEAD, then close the state-bound (Idura) callback end to end</name>
  <files>apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts, apps/frontend/src/lib/api/utils/auth/providers/types.ts, apps/frontend/src/lib/api/utils/auth/providers/idura.ts, apps/frontend/src/lib/api/utils/auth/providers/signicat.ts, apps/frontend/src/routes/api/oidc/callback/+server.ts</files>
  <behavior>
    - Idura active, no oidc_state cookie, request `/api/oidc/callback?code=attacker-code&state=anything`: GET rejects with status 303 and location `/candidate/preregister?error=invalid_state`. `iduraProvider.exchangeCodeForToken` is never called, and `cookies.set` is never called with `COOKIE.idToken`.
  </behavior>
  <action>
Record the starting commit first (`git rev-parse HEAD`) in the SUMMARY as BASE. Task 3's added-line scan diffs against it.

REVALIDATE (read-only, before any edit). Confirm each of these against the tree and record file plus content anchor, not line numbers:
(a) In the callback route, the returned-state comparison sits inside a branch taken only when `cookies.get(COOKIE.oidcState)` is truthy, so an absent cookie reaches `exchangeCodeForToken`.
(b) `iduraProvider.getAuthorizeUrl` always returns a generated `state`, and the authorize route writes it to `COOKIE.oidcState`.
(c) `signicatProvider.getAuthorizeUrl` returns no `state` and throws without a `codeChallenge`. The preregister page writes `COOKIE.oidcCodeVerifier` before the Signicat redirect.
(d) Both flows build their redirect URI from route key `CandAppPreregisterIdentityProviderCallback`.
If (a) no longer holds, meaning the callback already rejects an Idura callback that lacks the state cookie, stop. Write the SUMMARY with outcome "dropped — <reason, with the anchor that proves it>", make no code change, and skip Tasks 2 and 3. If (b) or (c) differ from the above, stop and report the difference before changing anything, because the binding assignment below depends on them.

RED. Create `callback-endpoint.test.ts` next to `authorize-endpoint.test.ts` with the `@vitest-environment node` docblock, and copy that file's harness:
- the `vi.hoisted` `mockServerConstants` and `mockPublicConstants` objects, with the full shape (not a subset);
- `vi.mock` for `$env/dynamic/public`, `$env/dynamic/private`, `$lib/server/constants` and `$lib/utils/constants` through getters, so `PUBLIC_IDENTITY_PROVIDER_TYPE` can be set per describe block.
Import `GET` from `'../../../../../routes/api/oidc/callback/+server'` and the real `iduraProvider` / `signicatProvider` from `'../providers/idura'` / `'../providers/signicat'`. Using the real providers means the real `getActiveProvider` factory and each provider's own declaration drive the route. Do NOT `vi.mock` the providers module.
Build a small event factory. It takes a query string, an initial cookie map and a locale, and returns:
- `url` as a `new URL('http://localhost/api/oidc/callback?...')`;
- `cookies` with Map-backed `get`, and `set` / `delete` / `getAll` / `serialize` as `vi.fn`;
- `locals: { currentLocale: 'en' }`.
In `beforeEach`, spy `exchangeCodeForToken` so it resolves `{ idToken: 'test.id.token' }`, and spy `getIdTokenClaims` so it resolves a `success: true` result with placeholder names. In `afterEach`, call `vi.restoreAllMocks()`.
Write the one `<behavior>` case, run it, and confirm it FAILS at HEAD: today the handler exchanges the code and redirects to `/candidate/preregister` with no error. Paste the failing assertion output into the SUMMARY, then commit `test[auth]: the OIDC callback must reject an Idura code that arrives without the state cookie`.

GREEN.
- In `types.ts`, export `type CallbackBinding = 'state' | 'pkce'`. Add a REQUIRED `readonly callbackBinding: CallbackBinding` to `IdentityProvider`, with TSDoc for each value:
  - `'state'`: the authorize request carries a server-generated `state` that the authorize endpoint stores in the `oidc_state` cookie. The callback requires that cookie and an equal `?state=`.
  - `'pkce'`: the authorize request carries a `code_challenge`. The verifier is kept in the `oidc_code_verifier` cookie, and the callback requires it.
  Say in the TSDoc that the field is required so that a provider which leaves it out does not compile, since the callback cannot know how to bind that provider's flow to the browser that started it.
- Set `callbackBinding: 'state'` on `iduraProvider` and `callbackBinding: 'pkce'` on `signicatProvider`, next to `type` and `authConfig`.
- In the callback route, keep the `errorParam` and missing-`code` redirects first and unchanged. Move the binding check inside the existing `try`, after `const provider = getActiveProvider()` and before `exchangeCodeForToken`. The `catch` already rethrows anything carrying `status` and `location`, so the check's redirects pass through it. Switch on `provider.callbackBinding`:
  - For `'state'`: read `COOKIE.oidcState`. Reject unless the stored value is a non-empty string, `?state=` is present, and the two are equal. On rejection, delete `COOKIE.oidcState`, `COOKIE.oidcNonce` and `COOKIE.oidcCodeVerifier` with `{ path: '/' }` (one small local helper, reused by Task 2), then throw the `OIDC_ERROR.invalidState` redirect. On success, delete `COOKIE.oidcState` and pass no `codeVerifier` to the exchange, since Idura does not use one.
  - For `'pkce'`, in this task only: keep the current behaviour. Read `COOKIE.oidcCodeVerifier` if present, delete it, and pass it on. Task 2 closes this path.
- Rewrite the header steps and the inline comment above the old check so they state the rule as it now is: each provider's declared binding, and why a missing proof is a rejection. Per CLAUDE.md Comment Hygiene, leave out history such as what the check used to do, and add no `.planning/` path, decision id or phase tag. Leave the unrelated existing comments in the file as they are.
Run the test to GREEN and commit `fix[auth]: the OIDC callback fails closed without the Idura state cookie`.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/frontend test:unit src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts</automated>
  </verify>
  <done>The SUMMARY records BASE, the four revalidation anchors, and the RED output at HEAD. After the fix, the new test passes. `grep -n "callbackBinding" apps/frontend/src/routes/api/oidc/callback/+server.ts` finds the switch. Both providers declare their binding, and there are two commits (test, then fix). If revalidation (a) failed, the SUMMARY instead records "dropped — reason" and no code changed.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Fail closed on the PKCE-bound (Signicat) callback and pin the full callback matrix</name>
  <files>apps/frontend/src/routes/api/oidc/callback/+server.ts, apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts, tests/IDURA-TEST-RUNBOOK.md</files>
  <behavior>
    - Idura, oidc_state cookie present, no ?state: redirect `?error=invalid_state`, exchange not called.
    - Idura, cookie `s-1`, `?state=s-2`: redirect `?error=invalid_state`, exchange not called, `cookies.delete` called for `COOKIE.oidcState` and `COOKIE.oidcNonce` with `{ path: '/' }`.
    - Idura, cookie and `?state=` equal: exchange called once with `authorizationCode` = the code, `redirectUri` = `http://localhost/api/oidc/callback` and `codeVerifier` undefined. `cookies.set` receives `COOKIE.idToken` with an options object containing `httpOnly: true`, `secure: true`, `sameSite: 'strict'` and `path: '/'`. The redirect is `/candidate/preregister` with no error, and `COOKIE.oidcState` is deleted.
    - Signicat, no oidc_code_verifier cookie (and no state cookie or param): redirect `?error=invalid_state`, `signicatProvider.exchangeCodeForToken` not called.
    - Signicat, verifier cookie present, no state cookie or param: exchange called with that `codeVerifier`, success redirect, `COOKIE.oidcCodeVerifier` deleted.
    - Precedence is unchanged: `?error=access_denied` redirects with `error=access_denied` whatever the cookies are, and a missing `code` redirects `?error=missing_code` before any binding check. Neither calls the exchange.
    - The declarations are pinned: `iduraProvider.callbackBinding` is `'state'` and `signicatProvider.callbackBinding` is `'pkce'`.
  </behavior>
  <action>
Write every `<behavior>` case into `callback-endpoint.test.ts`. Use one describe block per provider, and set `mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE` in each block's `beforeEach`. Run the file. The Signicat no-verifier case must FAIL before the route change, so record that RED output in the SUMMARY. Then change the route:
- In the `'pkce'` branch, reject when `COOKIE.oidcCodeVerifier` is absent or an empty string. Clear the flow cookies with the Task 1 helper and throw the `OIDC_ERROR.invalidState` redirect before any token request. This keeps the literal `undefined` from ever reaching Signicat's token endpoint as `code_verifier`. Otherwise delete the verifier cookie and pass the value to `exchangeCodeForToken`.
- Signicat issues no `state`, so the `'pkce'` branch neither requires nor reads `COOKIE.oidcState`.
- Add a default branch that fails closed the same way (clear cookies, `invalidState` redirect). Give it a compile-time exhaustiveness check over `CallbackBinding`, in a form that passes `yarn lint:check` with no disable comment. A plain `never`-typed assignment that the linter flags as unused is not acceptable.
- Reuse `OIDC_ERROR.invalidState` for every binding failure, as the planner decided. The operator remedy for a missing or mismatched flow cookie is the same (restart the flow on one host within the 10-minute cookie TTL), and adding a wire value would widen the closed contract that `oidcError.ts` and its test pin. This choice is reversible.
- Never log the state, the nonce or the verifier value.

In `tests/IDURA-TEST-RUNBOOK.md` § Troubleshooting (Idura specifics), change the `invalid_state` bullet to say the state cookie was missing or did not match the returned state. Keep its remedy, and the other bullets unchanged.

Run to GREEN, then run the neighbouring suites to confirm nothing else moved: `oidcError.test.ts`, `authorize-endpoint.test.ts`, `token-endpoint.test.ts`, `providers/idura.test.ts`, `providers/signicat.test.ts` and `providers/authorize-fail-closed.test.ts`. Commit `fix[auth]: the OIDC callback fails closed without the Signicat PKCE verifier`.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/frontend test:unit src/lib/api/utils/auth src/lib/candidate/utils/oidcError.test.ts</automated>
  </verify>
  <done>Every behaviour bullet is a passing assertion, and the RED output for the Signicat no-verifier case is recorded. The auth test directory and `oidcError.test.ts` pass with `OIDC_ERROR` still exactly four members. The runbook bullet names both missing and mismatched state. The work is committed.</done>
</task>

<task type="auto">
  <name>Task 3: Repository gates, the added-line hygiene scan, and the bank-auth journey</name>
  <files>apps/frontend/src/routes/api/oidc/callback/+server.ts, apps/frontend/src/lib/api/utils/auth/providers/types.ts, apps/frontend/src/lib/api/utils/auth/providers/idura.ts, apps/frontend/src/lib/api/utils/auth/providers/signicat.ts, apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts</files>
  <action>
Verification only. Fix whatever a gate reports in the files above, and commit any fix as `fix[auth]: ...`.
1. Run `yarn workspace @openvaa/frontend check` and `yarn lint:check`. Read each gate's own exit status. Never pipe a gate through grep or tail to judge it. The workspace test runner does not typecheck, so `check` is what proves the required `callbackBinding` field compiles for both providers.
2. Run the full frontend unit suite with `yarn workspace @openvaa/frontend test:unit`. Record passed and failed counts.
3. Scan the lines this item added. Run `git diff -U0 <BASE> -- apps/frontend tests/IDURA-TEST-RUNBOOK.md`, keep the lines that start with `+`, and grep them for `\.planning/`, `D-[0-9][0-9]`, `T-[0-9]`, `[Pp]hase [0-9]` and `v2\.[0-9]`. Empty output is the pass (grep exiting 1 here means a clean result). Also read every comment you touched against CLAUDE.md Comment Hygiene: no historical narrative, and nothing addressed to a reviewer.
4. E2E. The default `yarn test:e2e` suite never calls `/api/oidc/callback`. Only the opt-in `bank-auth-journey` project does, and it takes the Idura matching-state path: the mock issuer echoes the JAR `state`. Where the local stack allows, run that project. Follow `tests/IDURA-TEST-RUNBOOK.md` EFLOW-10b steps B-1 to B-3, with one correction: the Edge Function env used for the journey must set `IDENTITY_PROVIDER_ISSUER=https://127.0.0.1:9443`, not the EFLOW-10 value. Use a fresh dev server on a confirmed-free port, passed through `FRONTEND_PORT` if 5173 is taken. Run it with `run_in_background: true`, tee the output to a log in the session scratchpad, poll every 60 to 90 seconds, and decode the HTML report for exact counts. If the opt-in environment cannot be stood up in this session, record "bank-auth-journey: NOT RUN — <reason>" in the SUMMARY as an open verification item. Do not describe it as passing.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/frontend check && yarn lint:check && yarn workspace @openvaa/frontend test:unit</automated>
  </verify>
  <done>The frontend check and lint:check exit 0, and the full frontend unit suite has 0 failed. The added-line hygiene scan is empty. The SUMMARY records the bank-auth-journey result as exact counts from the decoded report, or as NOT RUN with a reason.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| IdP redirect → `GET /api/oidc/callback` | `code`, `state` and `error` are attacker-controllable query values on a top-level GET navigation that any site can trigger |
| browser cookies → callback | `oidc_state` (httpOnly, set server-side) and `oidc_code_verifier` (set by page script) are the only proof that this browser started the flow |
| callback → IdP token endpoint | the server redeems the code with its own credentials (`private_key_jwt` for Idura, `client_secret` plus PKCE verifier for Signicat) |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260930-gjy-01 | Spoofing | `callback/+server.ts`, Idura (`'state'` binding) | high | mitigate | Login CSRF. The callback now requires a non-empty `oidc_state` cookie AND an equal `?state=` before `exchangeCodeForToken`. It clears the flow cookies and redirects `invalid_state` otherwise. Pinned by the missing-cookie, missing-param and mismatch unit cases (Tasks 1 and 2). |
| T-260930-gjy-02 | Spoofing | `callback/+server.ts`, Signicat (`'pkce'` binding) | medium | mitigate | The callback rejects a missing or empty `oidc_code_verifier` cookie before any token request, so a victim browser never redeems an attacker's code with the literal `undefined` as verifier. Pinned by the Signicat no-verifier case (Task 2). Rejecting a verifier sent for a code issued without a challenge (PKCE downgrade) is the authorization server's duty, so that part of the risk is transferred to the IdP. |
| T-260930-gjy-03 | Tampering | `providers/types.ts` `IdentityProvider` | medium | mitigate | `callbackBinding` is required, so a future provider cannot compile without declaring its binding. The callback's default branch fails closed and is compile-time exhaustive over `CallbackBinding` (Task 2). |
| T-260930-gjy-04 | Denial of Service | legitimate candidates whose flow cookie is lost (host switch mid-flow, TTL over 600 s) | low | accept | Rejection is the correct fail-closed result, and the user restarts identification. The runbook's `invalid_state` bullet names the cause and remedy (Task 2). The bank-auth journey is the check that the normal matching-state path still gets through (Task 3). |
| T-260930-gjy-05 | Information Disclosure | callback error redirects and logs | low | mitigate | Binding failures emit only the opaque `invalid_state`, and no state, nonce or verifier value is logged or put on the URL (Task 2 action). |
| T-260930-gjy-06 | Spoofing | `id_token` nonce claim | low | accept | Checking the id_token `nonce` against `oidc_nonce` is a separate, pre-existing gap outside this item. The state binding alone closes the login-CSRF vector for Idura. |
| T-260930-gjy-07 | Spoofing | `POST /api/oidc/token` | low | accept | Not changed by this item. It takes a JSON body, and SvelteKit's default `csrf.checkOrigin` (no override in `apps/frontend/svelte.config.js`) rejects cross-origin form-encoded, multipart and text/plain POSTs, so a cross-site page cannot drive it the way it can drive a GET navigation. |
| T-260930-gjy-SC | Tampering | npm/pip/cargo installs | high | accept | No package is installed or upgraded by this plan, so the package-legitimacy gate does not apply. |
</threat_model>

<verification>
- `yarn workspace @openvaa/frontend test:unit src/lib/api/utils/auth src/lib/candidate/utils/oidcError.test.ts` passes, including the new callback matrix, with RED runs recorded for the Idura missing-cookie case and the Signicat missing-verifier case.
- `yarn workspace @openvaa/frontend check`, `yarn lint:check` and `yarn workspace @openvaa/frontend test:unit` exit 0.
- The added-line hygiene scan is empty.
- bank-auth-journey is green with counts, or recorded as NOT RUN with a reason.
</verification>

<success_criteria>
- An Idura callback without a matching state cookie can no longer establish an `id_token`.
- A Signicat callback without its PKCE verifier can no longer reach the token endpoint.
- Both providers declare their binding at compile time, and an unrecognised binding fails closed.
- The operator error contract is unchanged, and the runbook matches the new behaviour.
- Or, if revalidation shows the gap is already closed: the item ends as "dropped — reason" with no code change.
</success_criteria>

<output>
Create `.planning/quick/260930-gjy-revalidate-then-fix-apps-frontend-src-routes-api-oidc-callba/260930-gjy-SUMMARY.md` when done
</output>
