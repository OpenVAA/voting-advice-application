---
phase: 13
slug: quality-assurance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pgTAP (built into Supabase) |
| **Config file** | `apps/supabase/supabase/config.toml` (no special test config needed) |
| **Quick run command** | `cd apps/supabase && npx supabase test db` |
| **Full suite command** | `cd apps/supabase && npx supabase test db` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/supabase && npx supabase test db`
- **After every plan wave:** Run `cd apps/supabase && npx supabase test db`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | QUAL-01, QUAL-02, QUAL-03 | integration | `cd apps/supabase && npx supabase test db` | No -- Wave 0 | pending |
| 13-02-01 | 02 | 1 | QUAL-01 | integration | `cd apps/supabase && npx supabase test db` | No -- Wave 0 | pending |
| 13-02-02 | 02 | 1 | QUAL-02 | integration | `cd apps/supabase && npx supabase test db` | No -- Wave 0 | pending |
| 13-02-03 | 02 | 1 | QUAL-03 | integration | `cd apps/supabase && npx supabase test db` | No -- Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `apps/supabase/supabase/tests/database/` directory -- create test directory
- [ ] `00-helpers.test.sql` -- shared helpers (custom set_test_user with user_roles claim), fixtures, constants
- [ ] Verify pgTAP extension availability -- confirm `supabase test db` works with minimal test

*Wave 0 creates the test infrastructure; subsequent tasks create the actual test files.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
