---
phase: 33
slug: auth-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 33 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit), Playwright (E2E) |
| **Config file** | `apps/frontend/vitest.config.ts`, `apps/frontend/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~30 seconds (unit) |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend test:unit`
- **After every plan wave:** Run `yarn test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 33-01-01 | 01 | 1 | AUTH-03 | grep | `grep 'isAuthenticated' apps/frontend/src/lib/contexts/auth/authContext.ts` | N/A | pending |
| 33-01-02 | 01 | 1 | AUTH-03 | grep | `grep 'isAuthenticated.*Readable<boolean>' apps/frontend/src/lib/contexts/auth/authContext.type.ts` | N/A | pending |
| 33-01-03 | 01 | 1 | AUTH-03 | grep | `grep 'page.data.session' apps/frontend/src/lib/auth/getUserData.ts` | N/A | pending |
| 33-02-01 | 02 | 1 | AUTH-03 | grep | `grep 'isAuthenticated' apps/frontend/src/lib/contexts/candidate/candidateContext.ts` | N/A | pending |
| 33-02-02 | 02 | 1 | AUTH-03 | grep | `grep 'isAuthenticated' apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte` | N/A | pending |
| 33-03-01 | 03 | 2 | AUTH-06 | grep | `grep 'supabase.functions.invoke' apps/frontend/src/routes/api/candidate/preregister/+server.ts` | N/A | pending |
| 33-04-01 | 04 | 2 | AUTH-07 | grep | `grep 'safeGetSession\|session' apps/frontend/src/routes/candidate/(protected)/+layout.ts` | N/A | pending |
| 33-04-02 | 04 | 2 | AUTH-07 | grep | `grep 'session' apps/frontend/src/routes/candidate/+layout.server.ts` | N/A | pending |

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Phase 33 modifies auth wiring -- validation is primarily through grep-verifiable code patterns and build success.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Candidate login flow works end-to-end | AUTH-03 | Requires Supabase backend running | Login as candidate, verify session established |
| Preregister triggers Edge Function | AUTH-06 | Requires Supabase + Edge Function deployment | Start preregister flow with Signicat, verify Edge Function called |
| Protected routes redirect unauthenticated | AUTH-07 | Requires running app | Navigate to /candidate/profile without login, verify redirect to login |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
