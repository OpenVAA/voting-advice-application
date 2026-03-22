---
phase: 30
slug: supabase-backend-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 30 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pgTAP (database tests), supabase CLI (functions), tsc (type checking) |
| **Config file** | `apps/supabase/supabase/config.toml` |
| **Quick run command** | `cd apps/supabase && npx supabase test db` |
| **Full suite command** | `cd apps/supabase && npx supabase test db && cd ../../packages/supabase-types && npx tsc --noEmit` |
| **Estimated runtime** | ~30 seconds (pgTAP) + ~5 seconds (tsc) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` in supabase-types (if type changes)
- **After every plan wave:** Run full suite (pgTAP + tsc)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 35 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 30-01-01 | 01 | 1 | BACK-01 | file check | `ls apps/supabase/supabase/schema/*.sql \| wc -l` | W0 | pending |
| 30-01-02 | 01 | 1 | BACK-01 | file check | `ls apps/supabase/supabase/tests/database/*.sql \| wc -l` | W0 | pending |
| 30-01-03 | 01 | 1 | BACK-01 | file check | `ls apps/supabase/supabase/functions/*/index.ts \| wc -l` | W0 | pending |
| 30-02-01 | 02 | 1 | BACK-02 | tsc | `cd packages/supabase-types && npx tsc --noEmit` | W0 | pending |
| 30-03-01 | 03 | 1 | BACK-04 | grep | `grep -c "supabase" .yarnrc.yml` | exists | pending |
| 30-04-01 | 04 | 2 | BACK-01 | pgTAP | `cd apps/supabase && npx supabase test db` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `apps/supabase/` directory — extracted from parallel branch
- [ ] `packages/supabase-types/` directory — extracted from parallel branch
- [ ] Supabase CLI available via devDependency
- [ ] Docker running (required for `supabase start`)

*Existing infrastructure covers type checking. pgTAP and Edge Function tests require supabase start.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Edge Function response | BACK-01 | Requires running supabase instance + curl | `supabase functions serve` then `curl -X POST http://localhost:54321/functions/v1/invite-candidate` |
| `supabase start` success | BACK-01 | Requires Docker daemon running | Run `cd apps/supabase && npx supabase start` and verify output shows all services healthy |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 35s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
