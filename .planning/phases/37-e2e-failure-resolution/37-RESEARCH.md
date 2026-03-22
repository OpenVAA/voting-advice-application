# Phase 37: E2E Failure Resolution - Research

**Researched:** 2026-03-22
**Status:** Complete

## Research Findings

### 1. Auth-Setup Cascade Failure (Root Cause Identified)

**The Problem:** The `auth.setup.ts` test logs in via the candidate login page, expecting to navigate away from `/login` after form submission. The HANDOFF.json says: "candidate login succeeds but page stays on /login URL". This cascades to all 8 candidate tests that depend on `auth-setup`.

**Root Cause:** The login API route at `apps/frontend/src/routes/api/auth/login/+server.ts` line 25 checks:

```typescript
if (!loginResponse?.authToken) return apiFail(400);
```

But the Supabase `_login()` method at `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` line 39 returns:

```typescript
return { type: 'success' as const };
```

**No `authToken` is returned** because Supabase uses cookie-based sessions, not JWT tokens. The login API always returns a 400 failure. The form's `use:enhance` handler receives `result.type === 'failure'` and sets the error message, leaving the page on `/login`.

**Fix:** The login API route must be updated for Supabase:
1. After `signInWithPassword` succeeds, the Supabase server client automatically sets session cookies via the `createServerClient` cookie handler in `hooks.server.ts`.
2. The login API route should check `loginResponse.type === 'success'` instead of checking for `authToken`.
3. Since Supabase manages sessions via cookies (not a separate `AUTH_TOKEN_KEY` cookie), the `cookies.set(AUTH_TOKEN_KEY, ...)` line should be removed or replaced with a session indicator.
4. The `_login()` method should return `{ type: 'success', authToken: 'supabase-session' }` as a compatibility shim, OR the login API route should not require `authToken`.

**Additionally:** The `_getBasicUserData` call in the login API also passes `{ authToken }` which is ignored by the Supabase adapter. This is fine as the Supabase adapter reads from cookies.

**Cookie Architecture:** The Supabase server client (`createSupabaseServerClient` in `apps/frontend/src/lib/supabase/server.ts`) is created per-request in `hooks.server.ts` and uses `event.cookies.getAll()/setAll()` for session management. When `signInWithPassword` succeeds server-side, the session cookies are automatically set on the response. The `AUTH_TOKEN_KEY` ("token") cookie from the Strapi era is no longer needed.

### 2. Candidate Login Page Redirect Logic

The login page's `+page.server.ts` form action does:
1. POST to `/api/auth/login` with credentials
2. Check `result.type !== 'success'` -> `fail(400)`
3. On success: `redirect(303, candidateHome)`

The hooks.server.ts `candidateAuthHandle` then:
- If session exists AND URL ends with `candidate/login` -> redirect to `/candidate`
- If no session AND route is `(protected)` -> redirect to login

So after fixing the login API, the redirect chain should work: login succeeds -> form action redirects to candidate home -> hooks detects session -> allows access.

### 3. Voter Test Failures Analysis

**voter-detail (party):** The test (`voter-detail.spec.ts` line 109-146) clicks the parties tab, then clicks `entity-card-action` to open the party detail drawer. The test depends on:
- Results page having entity tabs with a "parties" tab
- Party section being visible after tab click
- `entity-card-action` test ID existing on party cards
- Dialog opening with entity-details, info tab, submatches tab, opinions tab

Potential issues: The entity card action test ID may not be rendering, or the party section may not appear. This depends on `results.sections` and `results.cardContents` settings from data.setup.ts being correctly applied.

**voter-matching:** Tests navigate the full voter journey and compare matching algorithm output. The tests create `OrdinalQuestion.fromLikert` objects using `q.externalId` as the ID. Answer values in the dataset are raw numbers ("5", "1") mapped to `choice_5`, `choice_1`. The test checks:
- Card count matches visible candidates
- Ranking order by distance tiers
- Perfect match (agree candidate) is first
- Worst match (oppose candidate) is last
- Partial candidate appears in middle
- Hidden candidate excluded

Potential issues: If the question external IDs in the dataset don't match what the frontend loads, or if the answer format differs between test computation and actual backend data, rankings could diverge.

**voter-results (3 failures):** Tests use the `answeredVoterPage` fixture. They check:
- Candidate section visible with result cards
- Card count equals `visibleCandidateCount` (computed from datasets)
- Entity type tabs visible with 2+ tabs
- Switching to parties/organizations tab

Potential issues: The `visibleCandidateCount` computation filters by `termsOfUseAccepted`. If the Supabase adapter filters differently (e.g., using `published` field or nomination status), the count would differ.

### 4. Data Setup Analysis

`data.setup.ts` does:
1. `bulkDelete` with `test-` prefix
2. `bulkImport` + `importAnswers` + `linkJoinTables` for default dataset
3. Same for voter dataset
4. `bulkImport` + `linkJoinTables` for candidate addendum (no answers)
5. `updateAppSettings` to disable category intros, set result sections, disable popups
6. `unregisterCandidate` for test users
7. `forceRegister` test-candidate-alpha with password

The `updateAppSettings` call is critical for voter tests. It sets:
- `results.sections: ['candidate', 'organization']` - both entity types shown
- `results.cardContents.candidate: ['submatches']` - candidate cards show submatches
- `results.cardContents.organization: ['candidates']` - org cards show candidates
- `entities.hideIfMissingAnswers.candidate: false` - show all candidates even without answers
- `entities.showAllNominations: true` - show candidates from all nominations

### 5. FIXMEs and TODOs Inventory

Found 5 items in test files:

| Location | Type | Description |
|----------|------|-------------|
| `variants/multi-election.spec.ts:173` | TODO | goto() fallback for SvelteKit navigation failure |
| `variants/results-sections.spec.ts:165` | TODO | Same goto() fallback issue |
| `variants/results-sections.spec.ts:263` | test.fixme | "should show only candidates when sections is ['candidate']" |
| `variants/results-sections.spec.ts:290` | test.fixme | "should show only organizations when sections is ['organization']" |
| `voter/voter-settings.spec.ts:486` | test.fixme | "should hide results link when showResultsLink is false" |

The `test.fixme` items are skipped tests that need investigation to determine if they can be fixed or should become tracked Future requirements.

### 6. GoTrue NULL Column Bug

The `seed.sql` includes an `UPDATE auth.users SET ... COALESCE(field, '')` fix for 6 varchar columns. The `safeListUsers()` in `supabaseAdminClient.ts` catches errors and returns `[]` as a fallback.

The seed.sql fix runs after the initial seed users are created, so any users created by `seed.sql` itself are covered. Users created later (by `forceRegister` or `auth.admin.createUser`) may have NULL columns set by GoTrue. The fix should ideally be a migration (ALTER TABLE ... SET DEFAULT '') but seed.sql can't alter auth schema (permission denied).

**Workaround status:** The seed.sql UPDATE runs on `supabase start` (or `supabase db reset`). This fixes existing users. New users created by E2E tests may still have NULLs, but `safeListUsers` handles that by catching errors.

### 7. Test ID Verification

Key test IDs used by failing tests:
- `entity-card` - used by voter-results and voter-detail
- `voter-results-list` - results page list container
- `voter-results-candidate-section` - candidate results section
- `voter-results-party-section` - party results section
- `voter-results-entity-tabs` - tabs for switching entity types
- `entity-card-action` - clickable link on entity card
- `entity-details` - entity detail drawer content
- `voter-entity-detail-info` - info tab in detail drawer
- `voter-entity-detail-opinions` - opinions tab in detail drawer
- `voter-entity-detail-submatches` - submatches tab in detail drawer

These test IDs must exist in the actual Svelte components. The `EntityCard.svelte` component is at `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte`.

### 8. Playwright Config Analysis

The Playwright config uses project dependencies:
- `data-setup` -> `auth-setup` -> `candidate-app` -> `candidate-app-mutation` -> `re-auth-setup` -> `candidate-app-settings` -> `candidate-app-password`
- `data-setup` -> `voter-app` (parallel with candidate chain)

If auth-setup fails, ALL candidate projects fail (8 tests). Voter tests run independently, so their failures are separate issues.

## Validation Architecture

### Key Verification Points
1. **Auth-setup fix**: After fixing login API route, auth.setup.ts should navigate away from `/login`
2. **Candidate cascade**: All 8 candidate tests should pass once auth-setup works
3. **Voter detail**: Party drawer should open with all 3 tabs
4. **Voter matching**: Rankings should match independently computed results
5. **Voter results**: Card counts should match visible candidate count from datasets
6. **FIXMEs**: Each fixme evaluated and either fixed or tracked

### Test Commands
```bash
# Run specific failing tests
cd tests && npx playwright test --project=auth-setup
cd tests && npx playwright test --project=candidate-app
cd tests && npx playwright test --project=voter-app tests/specs/voter/voter-detail.spec.ts
cd tests && npx playwright test --project=voter-app tests/specs/voter/voter-matching.spec.ts
cd tests && npx playwright test --project=voter-app tests/specs/voter/voter-results.spec.ts

# Run full suite
cd tests && npx playwright test
```

## RESEARCH COMPLETE
