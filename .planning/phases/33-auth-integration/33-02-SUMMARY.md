---
plan: 33-02
status: complete
started: 2026-03-22
completed: 2026-03-22
---

# Summary: Consumer Updates for isAuthenticated

## What was done

Updated all consumers of the old `authToken` property to use `isAuthenticated`:

1. **candidateContext.ts** -- Destructures `isAuthenticated` instead of `authToken`. Removed `authToken` from `candidateUserDataStore` call.

2. **candidateUserDataStore.ts** -- Removed `authToken` parameter entirely. Uses `authToken: ''` in `reloadCandidateData()` and `save()` (Supabase adapter ignores it).

3. **CandidateNav.svelte** -- Changed `$authToken` to `$isAuthenticated` in conditional rendering.

4. **AdminNav.svelte** -- Changed `$authToken` to `$isAuthenticated` in conditional rendering.

5. **adminContext.ts** -- Destructures `isAuthenticated` instead of `authToken`. Uses `''` in `injectAuthToken()`. Removed unused `get` import.

## Key files

- `apps/frontend/src/lib/contexts/candidate/candidateContext.ts`
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.ts`
- `apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte`
- `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte`
- `apps/frontend/src/lib/contexts/admin/adminContext.ts`

## Self-Check: PASSED

- No references to `get(authToken)` remain in updated files
- All nav components use `$isAuthenticated` for conditional rendering
- candidateUserDataStore uses empty string pattern for all DataWriter calls
