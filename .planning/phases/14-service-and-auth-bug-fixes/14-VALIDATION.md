---
phase: 14
slug: service-and-auth-bug-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pgTAP (via `supabase test db`) + manual verification |
| **Config file** | `apps/supabase/supabase/config.toml` |
| **Quick run command** | `cd apps/supabase && npx supabase db reset 2>&1 \| tail -5` |
| **Full suite command** | `cd apps/supabase && npx supabase test db` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/supabase && npx supabase db reset 2>&1 | tail -5`
- **After every plan wave:** Run `cd apps/supabase && npx supabase test db`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | SRVC-04 (fix) | integration | `cd apps/supabase && npx supabase db reset` | existing | pending |
| 14-01-02 | 01 | 1 | SRVC-01 (fix) | integration | `cd apps/supabase && npx supabase db reset` | existing | pending |
| 14-01-03 | 01 | 1 | AUTH-02 (fix) | manual | Visual inspection of forgot-password source | N/A | pending |
| 14-01-04 | 01 | 1 | INFRA-02 (fix) | manual | `grep PUBLIC_SUPABASE .env.example` | N/A | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. `supabase db reset` validates migration correctness. `supabase test db` runs existing pgTAP suite.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Password reset redirect URL | AUTH-02 (fix) | Frontend route string, no backend test | Verify `forgot-password/+page.svelte` contains `/candidate/password-reset` |
| Env vars in config | INFRA-02 (fix) | Config file presence check | `grep PUBLIC_SUPABASE .env.example` returns both vars |

*SQL fixes (SRVC-01, SRVC-04) are validated by `supabase db reset` succeeding — migration applies cleanly with corrected syntax.*

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
