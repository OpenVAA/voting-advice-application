---
title: Investigate whether the registrationKey method is still valid on Register page
priority: medium
created: 2026-03-24
context: Phase 40 auth fix added an invite flow alongside the existing registrationKey flow in the register/password page. The registrationKey flow may be a leftover from the Strapi auth era.
---

# Investigate register/password registrationKey method

The register/password page at `apps/frontend/src/routes/candidate/register/password/+page.svelte` has two flows:

1. **RegistrationKey flow** (original): expects `registrationKey`, `username`, `email` query params, calls `register({ registrationKey, password })`
2. **Invite flow** (added in Phase 40): detects active session + email but no registrationKey, calls `setPassword({ password })`

## Questions

- Is the registrationKey flow still reachable? The only path to it was via `/candidate/register` which validates the key and redirects to `/candidate/register/password?registrationKey=...&username=...&email=...`
- Does the `/candidate/register` page still serve a purpose with Supabase auth? It seems designed for a flow where candidates receive a key (not an email link) to register.
- The `register()` function in the candidate context calls `DataWriter.register({ registrationKey, password })`. Does the Supabase adapter implement this, or is it a Strapi leftover?
- Should both the `/candidate/register` and `/candidate/register/password` pages be simplified to only support the Supabase invite flow?

## Files

- `apps/frontend/src/routes/candidate/register/+page.svelte`
- `apps/frontend/src/routes/candidate/register/password/+page.svelte`
- `apps/frontend/src/lib/contexts/candidate/candidateContext.ts` (register function)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (_register impl)
