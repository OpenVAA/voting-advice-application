---
phase: 27
slug: adminwriter
status: draft
nyquist_compliant: true
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
| **Quick run command** | `cd apps/supabase && supabase test db` |
| **Full suite command** | `cd apps/supabase && supabase db reset && supabase test db` |
| **Estimated runtime** | ~60 seconds (includes db reset) |

---

## Sampling Rate

- **After every task commit:** Run task-specific verify command
- **After every plan wave:** Run `cd apps/supabase && supabase db reset && supabase test db`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 27-01-01 | 01 | 1 | ADMN-01, ADMN-02 | pgTAP (schema) | `cd apps/supabase && grep -c "CREATE TABLE admin_jobs" supabase/schema/019-admin-jobs.sql` | Yes (created) | pending |
| 27-01-02 | 01 | 1 | ADMN-01, ADMN-02 | pgTAP (tests) | `cd apps/supabase && supabase db reset && supabase test db` | Yes (extended) | pending |
| 27-02-01 | 02 | 2 | ADMN-01, ADMN-02 | grep (adapter) | `grep -c "merge_custom_data" frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | Yes (modified) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] pgTAP test infrastructure already exists (10-schema-migrations.test.sql, 00-helpers.test.sql)
- [ ] No new test framework setup needed -- extending existing files

*Existing infrastructure covers test framework -- only test extensions needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Question info generation end-to-end | ADMN-01 | Requires LLM API + running app | Run question-info admin page, verify custom_data persists |
| Job result storage end-to-end | ADMN-02 | Requires running SvelteKit + Supabase | Complete a job via admin UI, verify result in admin_jobs table |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
