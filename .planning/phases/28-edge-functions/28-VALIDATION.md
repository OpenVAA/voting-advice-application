---
phase: 28
slug: edge-functions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) |
| **Config file** | `frontend/vitest.config.ts` |
| **Quick run command** | `cd frontend && yarn test:unit --run` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run task-specific grep/verify command
- **After every plan wave:** Run `cd frontend && yarn test:unit --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 28-01-01 | 01 | 1 | EDGE-01 | grep | `grep -c "invite-candidate" frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | Yes (modified) | pending |
| 28-02-01 | 02 | 1 | EDGE-02 | grep | `grep -c "signicat-callback" frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | Yes (modified) | pending |
| 28-03-01 | 03 | 1 | EDGE-03 | grep | `grep -c "send-email" frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | Yes (modified) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — no new test framework setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Candidate invitation end-to-end | EDGE-01 | Requires running Edge Functions + SMTP | Admin invites candidate via API, verify email received, complete registration |
| Bank auth Signicat flow | EDGE-02 | Requires Signicat sandbox + running Edge Functions | Initiate bank auth, verify id_token exchange, confirm session established |
| Transactional email delivery | EDGE-03 | Requires SMTP + Edge Functions | Trigger email via send-email, verify delivery in Inbucket |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
