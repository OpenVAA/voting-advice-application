---
status: complete
phase: 97-domain-a-wave-3-getroute-consumer-codemod
source: [97-02-PLAN.md]
started: 2026-06-05T00:00:00Z
updated: 2026-06-05T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Admin auth-reactivity nav UAT (CONS-03)
expected: With a running stack (`yarn dev`), open the admin app at the `/admin` route. While LOGGED OUT the admin nav shows the login link (`AdminAppLogin`) and NOT the authenticated nav group. After logging in, the nav switches from the login link to the authenticated nav group (`AdminAppHome` / Jobs / FactorAnalysis / QuestionInfo / ArgumentCondensation) REACTIVELY — WITHOUT a hard refresh. (Before the Plan 01 fix, the spread-captured `isAuthenticated` boolean kept showing the login link until a manual refresh.) Each authenticated `getRoute.current('AdminApp*')` nav link resolves to the correct route URL.
steps:
  1. Start the stack: `yarn dev`.
  2. Open the admin app (the `/admin` route) while LOGGED OUT.
  3. Confirm the admin nav shows the login link (`AdminAppLogin`) and NOT the authenticated group.
  4. Log in. Confirm the nav switches from the login link to the authenticated nav group (`AdminAppHome` / Jobs / FactorAnalysis / QuestionInfo / ArgumentCondensation) REACTIVELY — WITHOUT a hard refresh.
  5. Confirm each `getRoute.current('AdminApp*')` authenticated link resolves to the correct route.
  6. Record the result (pass/fail per step + date) against commit `35c68e85c`.
result: pass
verified: 2026-06-05 (operator-driven browser UAT, Claude in Chrome on live `yarn dev` stack)
evidence: |
  Ran on the live stack (DB reset + default seed + a `super_admin` auth user `admin@example.com`).
  - Step 2-3 (LOGGED OUT): `/admin` redirected to `/admin/login`; AdminNav showed ONLY the `AdminAppLogin` "Sign in" link — the authenticated group was absent. Confirmed in DOM and via screenshot.
  - Step 4 (LOGIN → REACTIVE FLIP): logged in via the admin login FORM (`use:enhance`, SPA — no full page load). The nav switched to the authenticated group. Two instrumented invariants proved this was a genuine reactive flip, NOT a reload/remount:
      * a `window.__uatNoReload` sentinel planted while logged out SURVIVED the login → no hard reload (SPA navigation).
      * a `data-uat-tag` stamped on the live `#admin-app-menu` element while logged out was STILL PRESENT after login → the AdminNav component instance was NOT remounted; the `{#if isAuthenticated}` swap happened in place. This is the exact CONS-03 reactive chain (authContext.isAuthenticated → adminContext delegating getter → AdminNav `$derived`).
  - Step 5 (LINKS RESOLVE): authenticated `getRoute.current('AdminApp*')` links resolved correctly —
      Home → /admin, Jobs Monitoring → /admin/jobs, Factor Analysis → /admin/factor-analysis,
      Question Info → /admin/question-info, Argument Condensation → /admin/argument-condensation.
  - The logged-out "Sign in" link was gone after login (`stillShowsLoginLink: false`).

prerequisite_fix: |
  Reaching the authenticated state surfaced a PRE-EXISTING, separate bug (outside Phase 97 scope) that blocked
  admin login entirely: the admin login action (`apps/frontend/src/routes/admin/login/+page.server.ts`) signed in
  via the nested `/api/auth/login` route, whose plain (non-`serverClient`) Supabase client does not write the
  session cookie onto the form-action response. So login returned 200 but no `sb-*-auth-token` cookie reached the
  browser → the protected `/admin` route always bounced back to login. The CANDIDATE login action already avoids
  this by calling `locals.supabase.auth.signInWithPassword(...)` directly (cookies land on the action response).
  Per operator guidance ("admin login should proceed exactly the same way as candidate login"), the admin login
  action was rewritten to mirror the candidate pattern (sign in via `locals.supabase`, verify session, check admin
  role via JWT `user_roles` claim, redirect to `AdminAppHome`). With that fix, the full UI login + nav-reactivity
  flow works end-to-end. This admin-login fix is NOT part of the Phase 97 getRoute/store→rune codemod and should be
  tracked/committed as its own change.

env_note: |
  During testing the local browser had a stale, JS-visible `sb-127-auth-token` cookie belonging to an unrelated
  co-running local Supabase project (`next-supabase-skimle2` / makerkit, kong on :54331). Because both local
  Supabase stacks use host `127` they emit the SAME cookie name on the shared `localhost` browser domain, so the
  Skimle session shadowed OpenVAA's. To get a clean, unambiguous test the OpenVAA `PUBLIC_SUPABASE_URL` host was
  temporarily switched 127.0.0.1→localhost (distinct `sb-localhost-auth-token` cookie); this env tweak was reverted
  after verification. This collision is a local-environment artifact, not an OpenVAA/Phase-97 issue.

## Summary

total: 1
passed: 1
issues: 0
pending: 0
skipped: 0
deferred: 0
blocked: 0

## Gaps
