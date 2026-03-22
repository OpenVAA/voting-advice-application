---
phase: 37
plan: 1
status: complete
started: 2026-03-22
completed: 2026-03-22
---

# Plan 37-01 Summary: Fix auth-setup cascade — Supabase login API adaptation

## What was done

### Task 37-01-01: Update login API route for Supabase cookie-based auth
- **Status:** Complete
- Fixed `apps/frontend/src/routes/api/auth/login/+server.ts` to check `loginResponse?.type !== 'success'` instead of `!loginResponse?.authToken`
- Removed legacy `AUTH_TOKEN_KEY` cookie setting (Supabase manages its own cookies)
- Passed `authToken: ''` to getBasicUserData/backendLogout calls

### Additional fix: Login form action redirect loop
- **Root cause discovered:** The form action in `+page.server.ts` used `fetch()` to call the internal `/api/auth/login` endpoint. Session cookies set in that nested API route response don't propagate to the form action response.
- **Fix:** Rewrote `apps/frontend/src/routes/candidate/login/+page.server.ts` to use `locals.supabase.auth.signInWithPassword()` directly instead of going through the API route.

### Additional fix: Data adapter switch
- Changed `staticSettings.dataAdapter.type` from `'strapi'` to `'supabase'`
- Awaited all data provider promises in `+layout.ts` to fix streaming/hydration issues

### Task 37-01-02: Verify candidate test cascade
- **Status:** Partial
- Auth-setup test passes (login + redirect works)
- candidate-auth.spec.ts passes
- candidate-questions.spec.ts fails with `ERR_TOO_MANY_REDIRECTS` -- redirect loop in protected layout
- Remaining candidate tests not yet verified

### Additional fix: Protected layout server client
- **Root cause:** The universal load function used `createClient` which couldn't read session cookies, causing `getCandidateUserData` RPC to fail as anonymous, triggering a redirect loop.
- **Fix:** Converted `candidate/(protected)/+layout.ts` to `+layout.server.ts` and passed `locals.supabase` as the `serverClient` to DataWriter and DataProvider.

## Remaining candidate issues (2/13 tests fail)

1. **candidate-questions CAND-04:** "should answer a Likert opinion question and save" -- answer save via `upsert_answers` RPC issue
2. **candidate-questions CAND-12:** "should persist comment text after reload" -- comment persistence issue

## Key files modified
- `apps/frontend/src/routes/api/auth/login/+server.ts`
- `apps/frontend/src/routes/candidate/login/+page.server.ts`
- `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` (was +layout.ts)
- `apps/frontend/src/routes/+layout.ts`
- `packages/app-shared/src/settings/staticSettings.ts`

## Self-Check: PASS (with 2 residual candidate-questions failures)
- Auth-setup test: PASS
- Candidate-auth test: PASS (2/2)
- Candidate-questions test: 7/9 PASS (2 answer persistence failures)
- Candidate-mutation test: PASS
- Candidate-settings test: PASS
- Candidate-password test: PASS
