---
phase: 28-edge-functions
verified: 2026-03-19T19:56:00Z
status: passed
score: 7/7 must-haves verified
gaps: []
---

# Phase 28: Edge Functions Verification Report

**Phase Goal:** Frontend integrates with all three Supabase Edge Functions for candidate invite, bank auth, and email
**Verified:** 2026-03-19T19:56:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can invoke invite-candidate Edge Function via _preregister to create a candidate and send invite email | VERIFIED | `supabaseDataWriter.ts:108` calls `this.supabase.functions.invoke('invite-candidate', { body: { firstName, lastName, email, projectId } })` |
| 2 | Admin can invoke send-email Edge Function via sendEmail to send transactional/bulk emails | VERIFIED | `supabaseDataWriter.ts:298` calls `this.supabase.functions.invoke('send-email', { body: { templates, recipient_user_ids, from, dry_run } })` |
| 3 | _preregister resolves projectId from the first nomination's electionId before calling the Edge Function | VERIFIED | `supabaseDataWriter.ts:98-102` queries `this.supabase.from('elections').select('project_id').eq('id', body.nominations[0].electionId).single()` |
| 4 | _preregister ignores the identifier param (Supabase uses email-based invite, not personal ID) | VERIFIED | `supabaseDataWriter.ts:106` has explicit comment; `identifier` not passed in invoke body (lines 108-115) |
| 5 | sendEmail passes templates, recipientUserIds, from, and dryRun params to the Edge Function | VERIFIED | `supabaseDataWriter.ts:298-304` maps camelCase to snake_case: `recipient_user_ids`, `dry_run` |
| 6 | Candidate can authenticate via Finnish bank ID (Signicat OIDC) through the signicat-callback Edge Function | VERIFIED | `+server.ts:22-24` calls `locals.supabase.functions.invoke('signicat-callback', { body: { id_token: idToken } })` |
| 7 | Session is established server-side via verifyOtp using the magic link token from the Edge Function response | VERIFIED | `+server.ts:33-47` extracts `token` and `type` from `data.session.action_link` URL, calls `locals.supabase.auth.verifyOtp({ token_hash, type })` |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/lib/api/base/dataWriter.type.ts` | sendEmail method signature and SendEmailOptions/SendEmailResult types | VERIFIED | Lines 234-240: `sendEmail` on interface; Lines 427-445: `SendEmailOptions` and `SendEmailResult` types exported |
| `frontend/src/lib/api/base/universalDataWriter.ts` | sendEmail public method and _sendEmail abstract method | VERIFIED | Line 176-178: `sendEmail(opts)` public method; Line 268: `protected abstract _sendEmail(opts)` |
| `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | _preregister and _sendEmail implementations calling Edge Functions | VERIFIED | Lines 86-119: `_preregister` with `functions.invoke('invite-candidate')`; Lines 292-314: `_sendEmail` with `functions.invoke('send-email')` |
| `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` | Unit tests for _preregister and sendEmail Edge Function integration | VERIFIED | Lines 535-663: 5 test cases covering invite-candidate and send-email; all 33 tests pass |
| `frontend/src/routes/[[lang=locale]]/api/candidate/preregister/+server.ts` | Dual-adapter preregister route handling both Strapi and Supabase flows | VERIFIED | Lines 17-65: Supabase path with signicat-callback + verifyOtp; Lines 67-108: Strapi path preserved unchanged |
| `frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts` | Throwing _sendEmail stub for interface compliance | VERIFIED | Line 257-259: `protected _sendEmail(): Promise<SendEmailResult> { throw new Error(...) }` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `supabaseDataWriter.ts` | invite-candidate Edge Function | `this.supabase.functions.invoke('invite-candidate', ...)` | WIRED | Line 108: full invoke with body params, error handling on line 117 |
| `supabaseDataWriter.ts` | send-email Edge Function | `this.supabase.functions.invoke('send-email', ...)` | WIRED | Line 298: full invoke with body params, error handling on line 307, result fields extracted on lines 309-313 |
| `universalDataWriter.ts` | supabaseDataWriter.ts | abstract `_sendEmail` method | WIRED | Line 268 declares abstract; supabaseDataWriter.ts:292 implements; universalDataWriter.ts:176-178 calls via public `sendEmail()` |
| `api/candidate/preregister/+server.ts` | signicat-callback Edge Function | `locals.supabase.functions.invoke('signicat-callback', ...)` | WIRED | Line 22-25: invoke with `{ body: { id_token: idToken } }` |
| `api/candidate/preregister/+server.ts` | Supabase auth | `locals.supabase.auth.verifyOtp(...)` | WIRED | Line 39-42: `verifyOtp({ token_hash: tokenHash, type })` called after extracting from action_link URL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| EDGE-01 | 28-01-PLAN | invite-candidate Edge Function integrated into candidate invite flow | SATISFIED | `_preregister` calls `functions.invoke('invite-candidate')` with projectId resolution from elections table; 3 test cases validate success, election query failure, and Edge Function error |
| EDGE-02 | 28-02-PLAN | signicat-callback Edge Function integrated for bank authentication | SATISFIED | Preregister server route branches on `staticSettings.dataAdapter.type === 'supabase'`, calls `functions.invoke('signicat-callback')`, establishes session via `verifyOtp`, clears id_token cookie |
| EDGE-03 | 28-01-PLAN | send-email Edge Function integrated for transactional email | SATISFIED | `sendEmail` on DataWriter interface, `_sendEmail` in SupabaseDataWriter calls `functions.invoke('send-email')` with camelCase-to-snake_case mapping; 2 test cases validate success and error |

No orphaned requirements found -- all three EDGE requirements (EDGE-01, EDGE-02, EDGE-03) are mapped to Phase 28 in REQUIREMENTS.md and accounted for across plans 01 and 02.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `dataWriter.type.ts` | 202 | `TODO: Implement` (updateUserSettings) | Info | Pre-existing, unrelated to Phase 28 |
| `dataWriter.type.ts` | 311 | `TODO: Define in a more logical place` (AdminJobRecord) | Info | Pre-existing, unrelated to Phase 28 |

No blocker or warning anti-patterns found in Phase 28 modified files.

### Human Verification Required

### 1. Candidate Invitation End-to-End

**Test:** Trigger candidate invitation via admin API, verify invite email is received and registration flow completes
**Expected:** Edge Function creates candidate record, sends invite email via GoTrue, candidate receives email with registration link
**Why human:** Requires running Supabase Edge Functions with SMTP (Inbucket) and verifying email delivery

### 2. Signicat Bank Auth Flow

**Test:** Initiate bank authentication, complete Signicat OIDC flow, verify Supabase session is established
**Expected:** id_token exchanged via signicat-callback Edge Function, magic link token verified via verifyOtp, session cookies set
**Why human:** Requires Signicat sandbox environment and running Edge Functions; browser-based OIDC redirect flow

### 3. Send Email Delivery

**Test:** Invoke sendEmail with templates and recipient user IDs, verify emails are rendered and delivered
**Expected:** Edge Function resolves template variables via RPC, sends emails to recipients, returns sent/failed counts
**Why human:** Requires running Edge Functions with SMTP integration

### Gaps Summary

No gaps found. All three Edge Function integrations (invite-candidate, signicat-callback, send-email) are fully implemented and wired:

- **Plan 01** delivered `_preregister` (invite-candidate) and `_sendEmail` (send-email) in SupabaseDataWriter with proper interface additions, type exports, and 5 unit tests (all passing).
- **Plan 02** delivered the dual-adapter preregister server route with Supabase-specific signicat-callback Edge Function invocation and verifyOtp session establishment, preserving the existing Strapi flow.

All 4 commits verified in git history. All 33 SupabaseDataWriter tests pass. No stub implementations remain in the modified files.

---

_Verified: 2026-03-19T19:56:00Z_
_Verifier: Claude (gsd-verifier)_
