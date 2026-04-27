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
