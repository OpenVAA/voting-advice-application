---
phase: quick-260930-gjy
verified: 2026-09-30T00:00:00Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Quick 260930-gjy Verification Report

**Goal:** the OIDC callback must fail closed when the provider's browser binding (state / PKCE verifier) is missing.
**Commits:** 8d42c0dee (RED test), 069f03d4d (Idura state + callbackBinding), d88096c06 (Signicat PKCE + runbook). All on `fix/888-review-findings`.

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Idura, no `oidc_state` cookie: 303 to `?error=invalid_state`, no token exchange, no id_token cookie | VERIFIED | `+server.ts` `case 'state'` rejects on `!storedState`, before `exchangeCodeForToken`. Test "rejects a code that arrives without the state cookie" asserts redirect, exchange not called, idToken not set. Passes. |
| 2 | Idura, missing or mismatched `?state`: rejected, state/nonce cookies cleared. Matching state: exchange, httpOnly/secure/strict id_token cookie, state cleared, clean redirect | VERIFIED | `clearFlowCookies` deletes state, nonce and verifier. Three tests cover the missing param, the mismatch (asserts state and nonce deletes) and the match (asserts cookie options and redirect to `/candidate/preregister` without an error). |
| 3 | Signicat, no `oidc_code_verifier`: `invalid_state` before any token request. With it: exchange passes the verifier and clears the cookie. No state needed | VERIFIED | `case 'pkce'` throws when the verifier is absent. Tests assert `codeVerifier: 'v-1'`, the delete, and that no state cookie is used. The preregister page writes the verifier cookie (`+page.svelte:122`), so the legitimate flow is still satisfiable. |
| 4 | `callbackBinding` is a required field ('state' for Idura, 'pkce' for Signicat), and an unrecognised binding fails closed | VERIFIED | `types.ts` has `readonly callbackBinding: CallbackBinding` (required). `idura.ts` has `'state'` and `signicat.ts` has `'pkce'`. The `default:` branch assigns `never`, clears the cookies and redirects `invalid_state`. There is no runtime test of the default branch, only the compile-time exhaustiveness guard. This is acceptable. |
| 5 | The four OIDC_ERROR wire values are unchanged. The runbook `invalid_state` bullet says missing OR mismatched | VERIFIED | Only `OIDC_ERROR.invalidState` is reused. `oidcError.test.ts` passes (14 tests). The runbook diff reads "the state cookie was missing or did not match the returned state". |
| 6 | Frontend check, lint and unit suite pass. bank-auth-journey is recorded as NOT RUN | VERIFIED | I re-ran `yarn check`: 2811 files, 0 errors, 0 warnings, none touching oidc or auth. I re-ran the auth and oidcError unit tests: 12 files, 185 tests, all green. Lint and the full suite are as claimed in the SUMMARY; I did not re-run them. SUMMARY marks bank-auth-journey NOT RUN as an open item, which the plan allows. |

**Score:** 6/6

## Artifacts and key links

- `+server.ts` contains the `callbackBinding` switch, placed after `getActiveProvider()` and before the code exchange, inside the `try`. The catch rethrows redirects, so the rejections pass through it. The errorParam and missing-code redirects come first and are unchanged.
- `authorize/+server.ts` writes `oidc_state` (httpOnly, lax, 600 s) whenever the provider returns a state (Idura always does), so the required cookie is present on the legitimate path.
- The E2E mock issuer echoes the JAR `state` on `?state=` (`mockOidcIssuer.ts:133`), so the journey takes the matching-state path.
- The only implementers of `IdentityProvider` are the two providers. No other file needed the new field, and svelte-check is clean.
- The RED-then-GREEN order is real. The test commit precedes the fix commit, and the SUMMARY records failing output showing a redirect to `/candidate/preregister` at BASE.

## Anti-patterns

The comment-hygiene scan of the added lines (`.planning/`, decision ids, phase and version tags) is empty. The `.planning/debug/...` reference in the file is pre-existing and was not added by these commits. No stubs and no TBD/FIXME markers.

## Notes (non-blocking)

- bank-auth-journey E2E was NOT RUN, as the plan and SUMMARY acknowledge. It is not a gap. The matching-state path is covered at unit level.

## Human verification

None required.

_Verifier: Claude (gsd-verifier)_
