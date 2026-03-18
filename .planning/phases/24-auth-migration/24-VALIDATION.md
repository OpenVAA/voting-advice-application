---
phase: 24
slug: auth-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.1.8 |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && yarn test:unit` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && yarn test:unit`
- **After every plan wave:** Run `yarn test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | AUTH-01 | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts -x` | Wave 0 | pending |
| 24-01-02 | 01 | 1 | AUTH-01 | unit | (same file) | Wave 0 | pending |
| 24-02-01 | 02 | 1 | AUTH-02 | unit | `cd frontend && npx vitest run src/lib/contexts/auth/authContext.test.ts -x` | Wave 0 | pending |
| 24-03-01 | 03 | 2 | AUTH-03 | integration | Manual — requires running server | Manual-only | pending |
| 24-04-01 | 04 | 1 | AUTH-04 | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts -x` | Wave 0 | pending |
| 24-04-02 | 04 | 2 | AUTH-04 | integration | Manual — requires running server with Supabase | Manual-only | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` — unit tests for _login, _logout, _requestForgotPasswordEmail, _setPassword with mocked Supabase client (AUTH-01, AUTH-04)
- [ ] `frontend/src/lib/contexts/auth/authContext.test.ts` — session-based auth state derivation tests (AUTH-02)
- [ ] Remove `frontend/src/lib/api/utils/authHeaders.test.ts` — file being deleted along with source

*Existing vitest infrastructure covers framework needs. No new test dependencies required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| hooks.server.ts redirects unauthenticated users from protected routes | AUTH-03 | Hooks require running SvelteKit server with Supabase auth | 1. Start dev server 2. Navigate to /candidate (protected) without logging in 3. Verify redirect to /candidate/login |
| Auth callback route handles recovery type and establishes session | AUTH-04 | PKCE flow requires real Supabase GoTrue with email delivery | 1. Request password reset 2. Click email link 3. Verify redirect to password-reset page with active session |
| Session persists across page reloads | AUTH-01 | Cookie persistence requires real browser context | 1. Log in 2. Reload page 3. Verify still authenticated |
| Logout terminates session completely (no stale cookies) | AUTH-01 | Cookie clearing requires real browser context | 1. Log in 2. Log out 3. Verify no sb-* cookies remain 4. Navigate to protected route, verify redirect |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
