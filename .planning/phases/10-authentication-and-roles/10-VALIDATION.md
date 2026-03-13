---
phase: 10
slug: authentication-and-roles
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual SQL verification + psql scripts + vitest (SvelteKit) |
| **Config file** | `apps/supabase/supabase/tests/` (Wave 0 creates) |
| **Quick run command** | `psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f apps/supabase/supabase/tests/auth-quick.sql` |
| **Full suite command** | `psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f apps/supabase/supabase/tests/auth-tests.sql` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick SQL verification script
- **After every plan wave:** Run full auth test suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | AUTH-04 | unit (SQL) | `psql ... -f tests/auth-quick.sql` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | AUTH-06 | smoke | Login + decode JWT, check claims | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 1 | MTNT-05 | unit (SQL) | `psql ... -f tests/auth-quick.sql` | ❌ W0 | ⬜ pending |
| 10-01-04 | 01 | 1 | MTNT-06 | unit (SQL) | `psql ... -f tests/auth-quick.sql` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 2 | AUTH-05 | integration (SQL) | `psql ... -f tests/auth-tests.sql` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 2 | MTNT-04 | integration (SQL) | `psql ... -f tests/auth-tests.sql` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 3 | AUTH-01 | manual | Supabase Studio / curl auth endpoint | N/A | ⬜ pending |
| 10-03-02 | 03 | 3 | AUTH-02 | manual | Check Inbucket at localhost:54324 | N/A | ⬜ pending |
| 10-03-03 | 03 | 3 | AUTH-07 | manual | Browser dev tools, check cookies | N/A | ⬜ pending |
| 10-03-04 | 03 | 3 | AUTH-03 | smoke | `curl -X POST http://127.0.0.1:54321/functions/v1/invite-candidate` | ❌ W0 | ⬜ pending |
| 10-03-05 | 03 | 3 | AUTH-08 | manual | End-to-end with Signicat test credentials | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/supabase/supabase/tests/` directory — create test directory
- [ ] `apps/supabase/supabase/tests/auth-quick.sql` — quick smoke test (user_roles insert/select, JWT claims check)
- [ ] `apps/supabase/supabase/tests/auth-tests.sql` — full RLS policy verification (multi-role queries)
- [ ] `apps/supabase/supabase/tests/test-users.sql` — create test auth users with different roles
- [ ] `apps/supabase/supabase/seed.sql` — add test user_roles entries

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email/password signup and login | AUTH-01 | Requires Supabase Auth runtime interaction | 1. Sign up via Supabase Studio or curl. 2. Verify session token returned. 3. Check Inbucket for confirmation email. |
| Password reset flow | AUTH-02 | Requires email delivery + link click | 1. Call `resetPasswordForEmail()`. 2. Check Inbucket. 3. Click link. 4. Verify password changed. |
| SvelteKit per-request client | AUTH-07 | Requires running SvelteKit server + browser | 1. Start frontend. 2. Log in. 3. Check cookies via dev tools. 4. Verify `event.locals.supabase` works in server routes. |
| Signicat bank auth session | AUTH-08 | Requires external OIDC provider | 1. Trigger Signicat auth flow. 2. Complete bank ID verification. 3. Verify Supabase session created. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
