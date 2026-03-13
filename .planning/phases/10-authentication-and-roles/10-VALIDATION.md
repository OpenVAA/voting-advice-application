---
phase: 10
slug: authentication-and-roles
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-13
---

# Phase 10 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Inline automated verification per task (psql, grep, supabase db reset) |
| **Config file** | N/A -- verification commands embedded in each plan task |
| **Quick run command** | `cd apps/supabase && npx supabase db reset 2>&1 \| tail -5` |
| **Full suite command** | `cd apps/supabase && npx supabase db reset && psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;"` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run task-specific `<verify><automated>` command
- **After every plan wave:** Run `supabase db reset` + policy listing
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

Each task has an inline `<automated>` verification command. No separate Wave 0 test files needed -- verification is built into the plan structure.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 10-01-01 | 01 | 1 | AUTH-04, MTNT-05, MTNT-06 | schema (SQL) | `supabase db reset` succeeds, psql confirms tables/columns | pending |
| 10-01-02 | 01 | 1 | AUTH-06 | schema (SQL) | psql confirms functions exist, seed user_roles has rows | pending |
| 10-02-01 | 02 | 2 | AUTH-05, MTNT-04 | schema (SQL) | `supabase db reset` + pg_policies listing shows named policies | pending |
| 10-02-02 | 02 | 2 | AUTH-05 | schema (SQL) | information_schema.column_privileges confirms REVOKE applied | pending |
| 10-03-01 | 03 | 2 | AUTH-07 | file check | grep confirms createSupabaseServerClient/safeGetSession in hooks | pending |
| 10-03-02 | 03 | 2 | AUTH-07 | file check | grep confirms SupabaseClient in app.d.ts | pending |
| 10-03-03 | 03 | 2 | AUTH-01 | file check | grep confirms signInWithPassword in login +page.server.ts | pending |
| 10-03-04 | 03 | 2 | AUTH-02 | file check | grep confirms resetPasswordForEmail in forgot-password page | pending |
| 10-04-01 | 04 | 3 | AUTH-03 | file check | file exists + grep confirms inviteUserByEmail, candidates, user_roles, CORS, 403 | pending |
| 10-05-01 | 05 | 3 | AUTH-08 | file check | file exists + grep confirms compactDecrypt, jwtVerify, createUser | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Wave 0 is satisfied by inline verification commands in each plan task. No separate test script files are needed because:

1. **Schema plans (01, 02)** use `supabase db reset` as the primary verification -- if the SQL is valid and the schema loads without errors, the schema is correct. Additional psql queries confirm specific objects exist.
2. **Frontend plan (03)** uses grep/file-exists checks against the created files -- TypeScript compilation via `yarn workspace @openvaa/frontend build` serves as the integration check.
3. **Edge Function plans (04, 05)** use file-exists + grep checks to confirm the files contain the expected API calls and patterns.

The seed.sql (updated in Plan 01) provides test auth users and role assignments that are available for manual verification after `supabase db reset`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email/password signup and login e2e | AUTH-01 | Requires running Supabase Auth + frontend | 1. Start Supabase + frontend. 2. Submit login form. 3. Verify redirect on success. |
| Password reset email received | AUTH-02 | Requires email delivery | 1. Submit forgot-password form. 2. Check Inbucket at localhost:54324. 3. Click reset link. |
| SvelteKit per-request client works at runtime | AUTH-07 | Requires running SvelteKit server | 1. Start frontend. 2. Log in. 3. Check cookies via dev tools. |
| Signicat bank auth session | AUTH-08 | Requires external OIDC provider | 1. Trigger Signicat auth flow. 2. Complete bank ID verification. |
| Edge Function invite creates user + sends email | AUTH-03 | Requires running Supabase + Edge Functions | 1. `supabase functions serve`. 2. curl with admin JWT. 3. Check Inbucket. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands inline
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No separate Wave 0 test files needed -- verification is inline
- [x] No watch-mode flags
- [x] Feedback latency < 10s for all automated checks
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
