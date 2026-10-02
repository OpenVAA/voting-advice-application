---
title: Investigate whether the registrationKey method is still valid on Register page
priority: medium
created: 2026-03-24
context: Phase 40 auth fix added an invite flow alongside the existing registrationKey flow in the register/password page. The registrationKey flow may be a leftover from the Strapi auth era.
---

# Investigate register/password registrationKey method

> ## ✅ ANSWERED 2026-09-15 by Phase 162 planning — and the answer is the opposite of this todo's premise
>
> This todo asks whether the `registrationKey` flow is Strapi residue to delete. **It is not.**
>
> - **Phase 162 brief, fact 17:** `checkRegistrationKey` is declared abstract in
>   `universalDataWriter.ts` and the Supabase adapter implements it as
>   `throw new Error('checkRegistrationKey is not supported by the Supabase adapter. Use invite-based registration.')`
>   — a live contract that throws, not dead code. The UI strings already ship:
>   `candidateApp.login.haveRegistrationCode` and `candidateApp.register.wrongRegistrationCode`
>   in `translationKey.ts`.
> - **`162-USER-RIGHTS.md`** defines **four** sign-up methods, and `code` is method 3. The brief's
>   § 6.1 scopes wiring it to the throwing contract as planned work.
>
> **So: do not delete `/candidate/register` or `/candidate/register/password`.** The questions below
> are still worth answering, but as *"what should method 3 look like"*, not *"can this go"*.
>
> Superseded by
> [`2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md`](2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md),
> which can close this one.

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

## Resolution

**Closed 2026-10-02 as superseded, by Phase 168 plan 168-08 (D-18).** The question has an answer, and the open work belongs to
[`2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md`](../pending/2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md),
as the header above says.

What 168-06 read at HEAD (finding F2 in `.planning/phases/168-docs-site-rewrite-strapi-to-supabase/168-06-CLAIMS.md`). The code still
matches the header:

- `checkRegistrationKey` and `register` are declared on the data writer interface:
  `apps/frontend/src/lib/api/base/dataWriter.type.ts` has `checkRegistrationKey: (opts: { registrationKey: string })`.
- The Supabase adapter throws for `checkRegistrationKey` and ignores the key in `register`:
  `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` has
  `checkRegistrationKey is not supported by the Supabase adapter. Use invite-based registration.`
- Pages still call or reach the key branch: the register page, the set-password page's key branch, and the login page's
  "Do you have a registration code?" link (`apps/frontend/src/routes/candidate/login/+page.svelte`:
  `href={getRoute.current('CandAppRegister')}`).

The docs now describe exactly this. The Candidate app › Registration page (`/developers-guide/candidate-app/registration`, commit
`85436fe9d`) documents the invite branch and the throwing key method. Nothing was deleted (D-18: document behaviour, do not change
it).
