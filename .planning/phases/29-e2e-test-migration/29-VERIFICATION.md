---
phase: 29-e2e-test-migration
verified: 2026-03-19T21:30:00Z
status: gaps_found
score: 11/12 must-haves verified
gaps:
  - truth: "SupabaseAdminClient can resolve answersByExternalId to UUID-keyed answers JSONB and update candidates"
    status: failed
    reason: "importAnswers method looks for 'answersByExternalId' (camelCase) on candidate objects, but all datasets store the field as 'answers_by_external_id' (snake_case). The field lookup at line 174 and 203 of supabaseAdminClient.ts uses candidate.answersByExternalId which will always be undefined, silently skipping all candidates. No answers will be imported."
    artifacts:
      - path: "tests/tests/utils/supabaseAdminClient.ts"
        issue: "Lines 174 and 203 reference candidate.answersByExternalId (camelCase), but datasets use answers_by_external_id (snake_case). Fix: change both occurrences to candidate.answers_by_external_id"
      - path: "tests/tests/data/default-dataset.json"
        issue: "Uses 'answers_by_external_id' (correct snake_case) — the dataset is right, the client is wrong"
    missing:
      - "Fix supabaseAdminClient.ts importAnswers: replace candidate.answersByExternalId with candidate.answers_by_external_id (lines 174 and 203)"
human_verification:
  - test: "Run E2E candidate matching tests"
    expected: "Candidates have answers and appear in result rankings"
    why_human: "The importAnswers bug causes all candidates to be imported with empty answers. This only becomes visible when Playwright runs tests that check candidate result scores or answer displays."
  - test: "Run full E2E test suite against supabase start"
    expected: "All tests pass with no Strapi dependency"
    why_human: "End-to-end execution requires the Supabase local stack running. Cannot verify programmatically without running the stack."
---

# Phase 29: E2E Test Migration Verification Report

**Phase Goal:** The full E2E test suite runs against the Supabase backend with no Strapi dependency
**Verified:** 2026-03-19T21:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SupabaseAdminClient can bulk-import test data via bulk_import RPC | VERIFIED | supabaseAdminClient.ts line 126: `this.client.rpc('bulk_import', { data })` |
| 2 | SupabaseAdminClient can bulk-delete test data via bulk_delete RPC | VERIFIED | supabaseAdminClient.ts: bulkDelete calls `rpc('bulk_delete', ...)` |
| 3 | SupabaseAdminClient can create/delete/update auth users via Admin Auth API | VERIFIED | forceRegister calls `auth.admin.createUser`, unregisterCandidate calls `auth.admin.deleteUser`, setPassword calls `auth.admin.updateUserById` |
| 4 | SupabaseAdminClient can deep-merge app settings via merge_jsonb_column RPC | VERIFIED | updateAppSettings calls `rpc('merge_jsonb_column', ...)` at line 390 |
| 5 | SupabaseAdminClient can populate M:N join tables | VERIFIED | linkJoinTables inserts into `election_constituency_groups` and `constituency_group_constituencies` |
| 6 | SupabaseAdminClient can resolve answersByExternalId to UUID-keyed answers and update candidates | FAILED | importAnswers looks for `candidate.answersByExternalId` (camelCase) at lines 174 and 203, but all three dataset files store field as `answers_by_external_id` (snake_case). Field lookup is always undefined; all candidates are silently skipped with no answers imported. |
| 7 | All test dataset JSON files use snake_case field names and Supabase-native format | VERIFIED | default-dataset.json, voter-dataset.json, candidate-addendum.json all verified: external_id, snake_case field names, no questionTypes, organizations (not parties), question_categories, published:true, project_id on all items |
| 8 | mergeDatasets utility uses external_id (not externalId) | VERIFIED | 4 occurrences of external_id, 0 occurrences of externalId in mergeDatasets.ts |
| 9 | Email helper fetches emails from Inbucket REST API | VERIFIED | emailHelper.ts: INBUCKET_URL=http://localhost:54324, all three fetch calls use /api/v1/mailbox, no mailparser, no @playwright/test |
| 10 | Setup/teardown files use SupabaseAdminClient with no Strapi dependency | VERIFIED | All 6 setup/teardown files import SupabaseAdminClient. Zero StrapiAdminClient references in tests/setup/ or tests/specs/. No login()/dispose() calls anywhere. |
| 11 | All 10 spec files use SupabaseAdminClient with Supabase method signatures | VERIFIED | All 10 spec files confirmed with SupabaseAdminClient import. sendEmail uses candidateExternalId. sendForgotPassword and setPassword take plain email strings. No Pitfall 2 comments remain. |
| 12 | Frontend data adapter type set to supabase | VERIFIED | staticSettings.ts line 13: `type: 'supabase'` |

**Score:** 11/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/supabase/supabase/schema/020-test-helpers.sql` | merge_jsonb_column RPC for deep-merging JSONB columns | VERIFIED | 75 lines. Contains jsonb_recursive_merge and merge_jsonb_column with SECURITY INVOKER and GRANT to service_role + authenticated |
| `tests/tests/utils/supabaseAdminClient.ts` | Full SupabaseAdminClient replacing StrapiAdminClient | VERIFIED (with gap) | 719 lines. Exports SupabaseAdminClient class and TEST_PROJECT_ID. All 14 async methods present. No @playwright/test import. importAnswers has field name mismatch (see Gaps). |
| `package.json` | @supabase/supabase-js in root devDependencies | VERIFIED | `"@supabase/supabase-js": "^2.99.3"` in devDependencies |
| `tests/tests/data/default-dataset.json` | Base test dataset in Supabase-native format | VERIFIED | snake_case collections: constituencies, constituency_groups, elections, question_categories, questions, organizations, candidates, nominations. All items have external_id, project_id, published:true |
| `tests/tests/data/voter-dataset.json` | Voter test dataset in Supabase-native format | VERIFIED | organizations (not parties), external_id on all items |
| `tests/tests/data/candidate-addendum.json` | Candidate addendum in Supabase-native format | VERIFIED | candidates and nominations with external_id, project_id, published:true, organization refs (not party) |
| `tests/tests/utils/mergeDatasets.ts` | Updated merge utility using external_id | VERIFIED | 4 occurrences of external_id, 0 of externalId |
| `tests/tests/utils/emailHelper.ts` | Inbucket-based email helper | VERIFIED | Exports: fetchEmails, getLatestEmailHtml, extractLinkFromHtml, getRegistrationLink, countEmailsForRecipient, purgeMailbox. Uses native fetch, no mailparser |
| `tests/tests/setup/data.setup.ts` | Supabase-based data setup | VERIFIED | Imports SupabaseAdminClient, uses bulkImport/importAnswers/linkJoinTables pipeline for 3 datasets, updateAppSettings, unregisterCandidate, setPassword/forceRegister fallback |
| `tests/tests/setup/data.teardown.ts` | Supabase-based data teardown | VERIFIED | Imports SupabaseAdminClient, bulkDelete with Supabase collection names (organizations, question_categories, constituency_groups) |
| `packages/app-shared/src/settings/staticSettings.ts` | Data adapter type set to supabase | VERIFIED | `type: 'supabase', supportsCandidateApp: true, supportsAdminApp: true` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `tests/tests/utils/supabaseAdminClient.ts` | `apps/supabase/supabase/schema/016-bulk-operations.sql` | `supabase.rpc('bulk_import', ...)` | WIRED | Line 126 calls rpc('bulk_import') |
| `tests/tests/utils/supabaseAdminClient.ts` | `apps/supabase/supabase/schema/020-test-helpers.sql` | `supabase.rpc('merge_jsonb_column', ...)` | WIRED | Line 390 calls rpc('merge_jsonb_column') |
| `tests/tests/utils/emailHelper.ts` | Inbucket at http://localhost:54324 | Inbucket REST API v1 | WIRED | 3 fetch calls with /api/v1/mailbox/{name} pattern |
| `tests/tests/setup/data.setup.ts` | `tests/tests/utils/supabaseAdminClient.ts` | SupabaseAdminClient import | WIRED | `import { SupabaseAdminClient } from '../utils/supabaseAdminClient'` |
| `packages/app-shared/src/settings/staticSettings.ts` | `frontend/src/lib/api/dataProvider.ts` | staticSettings.dataAdapter.type switch | WIRED | `type: 'supabase'` set |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TEST-01 | 29-01, 29-03, 29-04 | Test infrastructure migrated from StrapiAdminClient to Supabase admin client | SATISFIED | SupabaseAdminClient created (719 lines, 14 methods). All 17 consumer files confirmed migrated. Zero StrapiAdminClient references in setup/specs. |
| TEST-02 | 29-01, 29-02 | Data seeding via SQL/RPCs instead of Strapi API | SATISFIED | bulk_import and bulk_delete RPCs used. All 6 dataset files converted to Supabase-native format. bulkImport/bulkDelete/importAnswers/linkJoinTables pipeline in data.setup.ts. Note: importAnswers has a field name bug that prevents answers from loading (see Gaps). |
| TEST-03 | 29-01 | Auth setup using Supabase sessions in Playwright tests | SATISFIED | auth.setup.ts uses browser-based login through the SvelteKit frontend (fills email/password form fields). forceRegister, setPassword, unregisterCandidate use Supabase Admin Auth API directly. No Strapi auth mechanism. |
| TEST-04 | 29-03, 29-04 | All existing E2E tests passing against Supabase backend | PARTIAL | All structural migrations are in place (SupabaseAdminClient, Inbucket, staticSettings supabase). However, TEST-04 cannot be fully confirmed without running the suite: the importAnswers field name mismatch means candidates will be imported without answers, which will likely cause matching-related tests to fail. Needs human verification to confirm full pass. |

All 4 requirement IDs claimed in plans are covered. No orphaned requirements found.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/tests/utils/supabaseAdminClient.ts` | 174, 203 | Field name mismatch: `candidate.answersByExternalId` (camelCase) should be `candidate.answers_by_external_id` (snake_case) | Blocker | Candidates are imported with no answers. All tests that verify matching scores, answer displays, or filter-by-answers will fail or show unexpected behavior. The method silently returns without error because `answersByExtId` is simply `undefined`. |

---

### Human Verification Required

#### 1. Full E2E Suite Pass Rate

**Test:** Run `yarn test:e2e` with `supabase start` running
**Expected:** All test cases pass with Supabase backend, no Strapi service needed
**Why human:** Requires running the full Supabase local stack and Playwright. Cannot verify programmatically. Note that the importAnswers gap (if not fixed) will cause matching-related tests to fail.

#### 2. Candidate Answer Display

**Test:** Open the voter app, run the questionnaire, check that candidates are ranked and their answer dots appear
**Expected:** Candidates have answers and matching percentages are non-zero/varied
**Why human:** The importAnswers field name bug (`answersByExternalId` vs `answers_by_external_id`) means this will fail. After fixing the bug, human verification confirms the fix worked end-to-end.

#### 3. Email Registration Flow

**Test:** Use Playwright to trigger the registration email for a candidate and verify the link arrives in Inbucket
**Expected:** Email appears in Inbucket at http://localhost:54324, link is extractable and valid
**Why human:** Requires Inbucket running (via supabase start) and browser interaction to confirm email delivery and link extraction works correctly.

---

### Gaps Summary

One gap blocks full goal achievement:

**importAnswers field name mismatch** — The `importAnswers` method in `supabaseAdminClient.ts` reads `candidate.answersByExternalId` (camelCase, the old Strapi format) at lines 174 and 203. But Plan 02 correctly converted all dataset files to use `answers_by_external_id` (snake_case). The fix is a one-line change in two places: replace `candidate.answersByExternalId` with `candidate.answers_by_external_id`.

This is a contract break between Plan 01 (which kept camelCase in the client) and Plan 02 (which correctly converted to snake_case in the datasets). Plan 01's JSDoc comment even says the field is `answersByExternalId`, but the data files it processes all use `answers_by_external_id`.

The consequence: every call to `data.setup.ts` will import candidates with empty `answers` columns. The matching algorithm will produce zero scores or all-tied results, causing any test that checks candidate rankings, match scores, or answer visualizations to fail or produce unexpected behavior.

All other components of the phase are correctly implemented and verified. The 8 commits are confirmed in git log. No Strapi references remain outside of `tests/tests/utils/strapiAdminClient.ts` (intentionally preserved for Phase 30 cleanup).

---

_Verified: 2026-03-19T21:30:00Z_
_Verifier: Claude (gsd-verifier)_
