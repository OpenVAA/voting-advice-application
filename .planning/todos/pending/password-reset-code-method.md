---
title: Investigate whether the code-based password reset flow is still valid
priority: medium
created: 2026-03-24
context: Phase 40 auth fix added a session-based flow alongside the existing code-based flow in the password-reset page. The code-based flow may be a leftover from the Strapi auth era.
---

# Investigate password-reset code method

The password-reset page at `apps/frontend/src/routes/candidate/password-reset/+page.svelte` has two flows:

1. **Code-based flow** (original): expects a `code` query parameter, calls `resetPassword({ code, password })`
2. **Session-based flow** (added in Phase 40): detects active session from auth callback `verifyOtp`, calls `setPassword({ password })`

## Questions

- Is the code-based flow (`?code=...`) still reachable in the current Supabase auth setup?
- The `resetPassword` function in `candidateContext.type.ts` says "code parameter is ignored by Supabase adapter (session is established via auth callback)". If the code is ignored, is the entire code-based branch dead code?
- Should the page be simplified to only support the session-based flow?
- Are there any external links or emails that still generate `?code=` URLs?

## Files

- `apps/frontend/src/routes/candidate/password-reset/+page.svelte`
- `apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts` (resetPassword docs)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (_resetPassword impl)

## 2026-10-02: Phase 168 reading (168-06 finding F1). Stays open.

**Answer to the first two questions: the `?code=` branch is NOT reachable from any in-repo path, and it would fail if reached.** The
code was read, not run.

- No in-repo code builds a reset-page URL with a `code`. The only redirect to `CandAppResetPassword` is the auth callback's `recovery`
  case, which passes only the locale: `apps/frontend/src/routes/api/candidate/auth/callback/+server.ts` has
  `throw redirect(303, buildRoute({ route: 'CandAppResetPassword', locale }));`. Running
  `git grep -n CandAppResetPassword -- apps/frontend/src ':!*.test.ts'` hits only `route.ts` and the callback.
- The only email producer, `_requestForgotPasswordEmail`, sends the recovery link to the **callback**, not to the reset page:
  `supabaseDataWriter.ts` has `${buildRoute('CandAppAuthCallback')}`.
- `_resetPassword` ignores the code. `supabaseDataWriter.ts` says `param is unused; Supabase uses the recovery session.` and then
  calls `updateUser`, which needs the very session this branch assumes is absent. So a hand-built `?code=` URL would fail on submit.
- The page still reads and branches on the parameter: `apps/frontend/src/routes/candidate/password-reset/+page.svelte` has
  `const code = page.url.searchParams.get('code');`.

**Why it stays open (D-18).** Phase 168 is a docs phase: it documents behaviour and does not change it, and the dead branch still
exists. The docs page `/developers-guide/candidate-app/login-and-password-reset` (commit `85436fe9d`) describes only the live,
session-based flow and does not describe the `?code=` branch. Close this todo when a code phase removes the branch and the `code`
parameter of `resetPassword`.

**Related, and the bigger problem: a `code` arrives at the callback, not the reset page.** With Supabase's default email templates
and the PKCE flow, the auth server's verify redirect delivers `?code=` to the **callback**. The callback reads only `token_hash` /
`type` / `next`, so the reader lands on login with `authError`. For the recovery mail this is already **measured** and tracked in
[`2026-09-02-forgot-password-pkce-code-not-exchanged.md`](2026-09-02-forgot-password-pkce-code-not-exchanged.md). The E2E suite
never follows that redirect: `tests/tests/fixtures/shared/emailBucket.fixture.ts` rewrites the verify link into
`callback?token_hash=…&type=…`. Fix that todo first. Once the callback exchanges the code, the reset page's own `?code=` branch is
dead for good, and both it and the unused parameter can go.
