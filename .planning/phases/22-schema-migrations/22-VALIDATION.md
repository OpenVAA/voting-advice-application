---
phase: 22
slug: schema-migrations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pgTAP (PostgreSQL extension, Supabase-bundled) |
| **Config file** | `apps/supabase/supabase/config.toml` (pgTAP enabled) |
| **Quick run command** | `cd apps/supabase && supabase test db` |
| **Full suite command** | `cd apps/supabase && supabase db reset && supabase test db` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/supabase && supabase test db`
- **After every plan wave:** Run `cd apps/supabase && supabase db reset && supabase test db`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | SCHM-01 | unit (pgTAP) | `cd apps/supabase && supabase test db` | ❌ W0 | ⬜ pending |
| 22-01-02 | 01 | 1 | SCHM-01 | unit (pgTAP) | `cd apps/supabase && supabase test db` | ❌ W0 | ⬜ pending |
| 22-02-01 | 02 | 1 | SCHM-02 | unit (pgTAP) | `cd apps/supabase && supabase test db` | ❌ W0 | ⬜ pending |
| 22-02-02 | 02 | 1 | SCHM-02 | unit (pgTAP) | `cd apps/supabase && supabase test db` | ❌ W0 | ⬜ pending |
| 22-02-03 | 02 | 1 | SCHM-02 | unit (pgTAP) | `cd apps/supabase && supabase test db` | ❌ W0 | ⬜ pending |
| 22-03-01 | 03 | 1 | SCHM-03 | unit (pgTAP) | `cd apps/supabase && supabase test db` | ❌ W0 | ⬜ pending |
| 22-03-02 | 03 | 1 | SCHM-03 | unit (pgTAP) | `cd apps/supabase && supabase test db` | ❌ W0 | ⬜ pending |
| 22-04-01 | 04 | 1 | SCHM-04 | unit (pgTAP) | `cd apps/supabase && supabase test db` | ❌ W0 | ⬜ pending |
| 22-04-02 | 04 | 1 | SCHM-04 | unit (pgTAP) | `cd apps/supabase && supabase test db` | ❌ W0 | ⬜ pending |
| 22-04-03 | 04 | 1 | SCHM-04 | unit (pgTAP) | `cd apps/supabase && supabase test db` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` — stubs for SCHM-01, SCHM-02, SCHM-03, SCHM-04
- [ ] Update `apps/supabase/supabase/tests/database/00-helpers.test.sql` — add `feedback_a`/`feedback_b` test_id entries and feedback rows in `create_test_data()`

*Existing infrastructure covers framework — pgTAP already configured.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
