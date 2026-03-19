---
phase: 27
slug: adminwriter
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit), pgTAP (database) |
| **Config file** | `frontend/vitest.config.ts`, `apps/supabase/supabase/tests/` |
| **Quick run command** | `cd frontend && yarn test:unit --run` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && yarn test:unit --run`
- **After every plan wave:** Run `yarn test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 27-01-01 | 01 | 1 | ADMN-01 | unit | `cd frontend && yarn test:unit --run` | ❌ W0 | ⬜ pending |
| 27-01-02 | 01 | 1 | ADMN-02 | unit | `cd frontend && yarn test:unit --run` | ❌ W0 | ⬜ pending |
| 27-02-01 | 02 | 1 | ADMN-01 | pgTAP | `psql -f apps/supabase/supabase/tests/` | ❌ W0 | ⬜ pending |
| 27-02-02 | 02 | 1 | ADMN-02 | pgTAP | `psql -f apps/supabase/supabase/tests/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] pgTAP test stubs for admin_jobs table and update_question_custom_data RPC
- [ ] Vitest test stubs for _updateQuestion and _insertJobResult adapter methods

*Existing infrastructure covers test framework — only test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Question info generation end-to-end | ADMN-01 | Requires LLM API + running app | Run question-info admin page, verify custom_data persists |
| Job result storage end-to-end | ADMN-02 | Requires running SvelteKit + Supabase | Complete a job via admin UI, verify result in admin_jobs table |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
