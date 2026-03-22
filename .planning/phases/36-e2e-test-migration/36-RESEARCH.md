# Phase 36: E2E Test Migration - Research

**Researched:** 2026-03-22
**Status:** Complete

## Executive Summary

Phase 36 migrates the E2E test infrastructure from Strapi to Supabase. The migration touches 19 files that reference `StrapiAdminClient` across setup files, spec files, and variant specs. The parallel branch (`feat-gsd-supabase-migration`) has complete Supabase versions of the admin client, email helper, and Playwright config. The critical challenge is the diff-merge approach for spec files: the current branch has Svelte 5 adaptations (testId constants, page objects, cookie workarounds) that the parallel branch lacks.

## Domain Analysis

### 1. Admin Client Migration (TEST-01)

**Current:** `StrapiAdminClient` in `tests/tests/utils/strapiAdminClient.ts` — stateful (login/dispose lifecycle), uses Playwright's `request` API, communicates via Admin Tools plugin REST endpoints.

**Target:** `SupabaseAdminClient` in parallel branch — stateless (service_role key), uses `@supabase/supabase-js`, communicates via Supabase RPC and PostgREST.

**Key API differences:**

| Operation | StrapiAdminClient | SupabaseAdminClient |
|-----------|-------------------|---------------------|
| Init | `new StrapiAdminClient()` + `await client.login()` | `new SupabaseAdminClient()` (no login) |
| Import data | `client.importData(data)` | `client.bulkImport(data)` + `client.importAnswers(data)` + `client.linkJoinTables(data)` |
| Delete data | `client.deleteData({ collection: 'prefix' })` | `client.bulkDelete({ collection: { prefix: 'prefix' } })` |
| Find data | `client.findData(collection, filters, populate?)` | `client.findData(collection, filters)` (no populate) |
| Update settings | `client.updateAppSettings(data)` (PUT, replaces) | `client.updateAppSettings(partial)` (deep merge via RPC) |
| Send email | `client.sendEmail({ candidateId, subject, content, requireRegistrationKey? })` | `client.sendEmail({ candidateExternalId, email?, subject, content })` |
| Forgot password | `client.sendForgotPassword({ documentId })` | `client.sendForgotPassword(email)` |
| Set password | `client.setPassword({ documentId, password })` | `client.setPassword(email, password)` |
| Force register | `client.forceRegister({ documentId, password })` | `client.forceRegister(candidateExternalId, email, password)` |
| Unregister | `client.unregisterCandidate(email)` | `client.unregisterCandidate(email)` (same signature) |
| Update candidate | `client.updateCandidate(documentId, data)` | `client.update('candidates', id, data)` |
| Cleanup | `await client.dispose()` | No cleanup needed |
| Delete test users | N/A | `client.deleteAllTestUsers()` |

**Dependencies:** `@supabase/supabase-js` and `@openvaa/supabase-types` (PROPERTY_MAP, TABLE_MAP) must be available in test workspace. Both are already present from earlier phases.

### 2. Dataset Migration (TEST-02)

**Current datasets:** `default-dataset.json`, `voter-dataset.json`, `candidate-addendum.json`, plus overlays in `tests/tests/data/overlays/`.

**Changes required per CONTEXT.md:**
- `parties` → `organizations` (Supabase uses `organizations` table, but COLLECTION_MAP in SupabaseAdminClient maps `parties` → `organizations` — so either name works at the API level)
- Add `projectId: "00000000-0000-0000-0000-000000000001"` to all entity records
- Add `published: true` to all entity records
- Remove `questionTypes` array (question types are seed data in Supabase, not imported)
- `type` → `categoryType` in questionCategories
- `constituencies` → `_constituencies` (join table syntax for M:N via linkJoinTables)
- `elections` → `_elections` (join table syntax for M:N via linkJoinTables)
- `constituencyGroups` → `_constituencyGroups` (join table syntax for elections → CG M:N)
- In questions: `questionType` reference field is replaced by inline `settings` (question type settings are denormalized in Supabase)
- Nominations: `party` → `organization`

**CONTEXT D-05 clarification:** Keep camelCase property names — SupabaseAdminClient handles snake_case conversion internally.

### 3. Spec File Diff-Merge Strategy (TEST-03)

**Files affected:** 19 files import StrapiAdminClient. Categorized by change complexity:

**Category A — Import swap + lifecycle removal only (simplest):**
These files only import StrapiAdminClient, call login/dispose, and use `importData`/`deleteData`/`updateAppSettings`. Changes are mechanical:
- `tests/tests/setup/data.setup.ts` — Import swap, remove login/dispose, change method signatures
- `tests/tests/setup/data.teardown.ts` — Import swap, remove login/dispose
- `tests/tests/setup/variant-multi-election.setup.ts` — Import swap
- `tests/tests/setup/variant-constituency.setup.ts` — Import swap
- `tests/tests/setup/variant-startfromcg.setup.ts` — Import swap
- `tests/tests/setup/variant-data.teardown.ts` — Import swap
- `tests/debug-setup.ts` — Import swap
- `tests/debug-questions.ts` — Import swap

**Category B — Import swap + method signature changes:**
These files call StrapiAdminClient methods with Strapi-specific signatures that need updating:
- `tests/tests/specs/candidate/candidate-registration.spec.ts` — Heavy changes: sendEmail, sendForgotPassword, setPassword all have different signatures. Also needs emailHelper import changes (add `toCallbackUrl`). Auth flow differs (Supabase invite = auto-login, no redirect to login page).
- `tests/tests/specs/candidate/candidate-profile.spec.ts` — Uses findData + updateCandidate
- `tests/tests/specs/candidate/candidate-settings.spec.ts` — Uses updateAppSettings (deep merge changes behavior)

**Category C — Settings-only usage (medium):**
- `tests/tests/specs/voter/voter-settings.spec.ts` — Multiple updateAppSettings calls
- `tests/tests/specs/voter/voter-popups.spec.ts` — updateAppSettings calls
- `tests/tests/specs/voter/voter-static-pages.spec.ts` — updateAppSettings calls

**Category D — Variant specs (medium):**
- `tests/tests/specs/variants/constituency.spec.ts` — updateAppSettings
- `tests/tests/specs/variants/multi-election.spec.ts` — updateAppSettings
- `tests/tests/specs/variants/results-sections.spec.ts` — updateAppSettings
- `tests/tests/specs/variants/startfromcg.spec.ts` — updateAppSettings

**Svelte 5 adaptations to preserve (from v1.3-v1.4):**
- `testIds` constant usage (e.g., `testIds.candidate.login.email` instead of string literals `'login-email'`)
- Page object usage via fixtures (e.g., `loginPage.login()`, `homePage.expectStatus()`)
- Cookie domain workaround in registration spec (localhost → 127.0.0.1)
- Retry logic in auth.setup.ts (3 attempts with reload)
- Extended timeouts for Docker dev mode

### 4. New Files from Parallel Branch

**`candidate-password.spec.ts`** — New spec that separates session-destructive tests (logout, password change) from candidate-auth.spec.ts. This is needed because Supabase's updateUser({password}) revokes refresh tokens, breaking other tests that share storageState.

**Decision needed:** The current branch's `candidate-auth.spec.ts` includes logout + password change tests. The parallel branch splits these into `candidate-password.spec.ts`. The split is architecturally necessary for Supabase because:
1. Logout via `signOut()` revokes the refresh token
2. Password change via `updateUser()` invalidates the session
3. Both break the shared `storageState` for downstream tests

**Recommendation:** Add `candidate-password.spec.ts` and remove the corresponding tests from `candidate-auth.spec.ts`.

**`re-auth.setup.ts`** — New setup file that re-authenticates after mutation tests invalidate the session. Required by the candidate-app-password project.

### 5. Email Helper Migration (TEST-04)

**Current:** LocalStack SES via `/_aws/ses` endpoint, uses `mailparser` for MIME parsing, `cheerio` for link extraction.

**Target:** Mailpit REST API on port 54324 (started by `supabase start`), uses native `fetch`, `cheerio` for link extraction.

**Key changes:**
- Drop `mailparser` dependency (Mailpit returns parsed HTML directly)
- Drop Playwright's `request` context (use native `fetch`)
- Add `toCallbackUrl()` function — transforms Supabase Auth verify links into direct auth callback URLs (bypasses hash fragment redirect flow)
- Add `purgeMailbox()` for cleanup
- `clearEmails()` is replaced by `purgeMailbox()` (different API endpoint)
- `fetchEmails(recipientEmail)` now takes email param (searches by `to:` address)
- Mailpit URL: `http://localhost:54324` (env: `INBUCKET_URL`)

### 6. Playwright Config Migration (TEST-05)

**Changes from current to parallel branch:**
1. Workers: `4` → `6` (no Strapi rate limiting concern)
2. Comment: "Limit local workers to avoid Strapi admin rate limiting" → removed
3. `candidate-app` project: added `fullyParallel: false` (prevents concurrent server requests racing on Supabase session layer)
4. `candidate-app-mutation`: removed `fullyParallel: false` (no longer needed with Supabase)
5. New project: `re-auth-setup` after `candidate-app-mutation`
6. New project: `candidate-app-password` after `re-auth-setup`
7. `candidate-app-settings` now depends on `re-auth-setup` (not `candidate-app-mutation`)
8. `data-setup-multi-election` depends on `candidate-app-password` (not `candidate-app-settings`)
9. `voter-app-settings` depends on `data-setup` only (not `voter-app`)
10. baseURL uses `localhost` instead of `127.0.0.1`

### 7. Test Asset Uploads (LocalStack → Supabase Storage)

**Current:** `uploadTestAssets.ts` uploads video/image files to LocalStack S3 for customData.video URLs.

**Parallel branch:** `uploadTestAssets.ts` does not exist. Video URLs in the parallel branch's dataset reference Supabase Storage instead of LocalStack S3.

**Action:** Either:
- Update `uploadTestAssets.ts` to upload to Supabase Storage (port 54321)
- Or update dataset video URLs to reference Supabase Storage and adapt the upload utility

This needs investigation into whether the parallel branch's dataset has video URLs and how test assets are served.

### 8. Package.json Dependencies

**Changes needed in `tests/package.json`:**
- Add `@supabase/supabase-js` (already in Yarn catalog from earlier phases)
- Add `@openvaa/supabase-types: "workspace:^"`
- Remove `mailparser` and `@types/mailparser`
- Keep `cheerio` (used by both old and new email helper)

## Validation Architecture

### Critical Path Dependencies
1. `@openvaa/supabase-types` must export PROPERTY_MAP and TABLE_MAP
2. `@supabase/supabase-js` must be in test workspace dependencies
3. Supabase local dev stack must be running for E2E tests (replaces Docker stack)
4. Mailpit must be accessible on port 54324

### Risk Areas
1. **Registration spec** has the most complex diff-merge — auth flow fundamentally different (Strapi: register → login page; Supabase: invite → auto-login → ToU)
2. **Password change/reset** tests are session-destructive with Supabase (refresh token revocation)
3. **Dataset migration** — must ensure all M:N relationships use `_` prefix syntax for linkJoinTables
4. **Video asset URLs** — need to handle LocalStack S3 → Supabase Storage transition

### Verification Commands
```bash
# Verify no StrapiAdminClient references remain
grep -r "StrapiAdminClient\|strapiAdminClient" tests/ --include="*.ts" | grep -v node_modules

# Verify no client.login() or client.dispose() calls remain
grep -r "client\.\(login\|dispose\)()" tests/ --include="*.ts" | grep -v node_modules

# Verify SupabaseAdminClient imports are correct
grep -r "SupabaseAdminClient\|supabaseAdminClient" tests/ --include="*.ts" | grep -v node_modules

# Verify no LocalStack/SES references remain
grep -r "LocalStack\|localstack\|SES\|_aws/ses" tests/ --include="*.ts" | grep -v node_modules

# Verify Mailpit references
grep -r "Mailpit\|mailpit\|54324\|INBUCKET" tests/ --include="*.ts" | grep -v node_modules
```

## RESEARCH COMPLETE

---

*Phase: 36-e2e-test-migration*
*Research completed: 2026-03-22*
