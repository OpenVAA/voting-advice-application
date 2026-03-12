---
phase: 8
slug: infrastructure-setup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Supabase CLI built-in (`supabase start`, `supabase db lint`, `supabase db reset`) + shell scripts |
| **Config file** | `apps/supabase/supabase/config.toml` |
| **Quick run command** | `yarn supabase:start` |
| **Full suite command** | `yarn supabase:reset && yarn supabase:lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn supabase:start` (verify affected service starts)
- **After every plan wave:** Run `yarn supabase:reset && yarn supabase:lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | INFRA-01 | smoke | `test -f apps/supabase/supabase/config.toml && echo OK` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | INFRA-02 | smoke | `cd apps/supabase && supabase status` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | INFRA-03 | smoke | `cd apps/supabase && supabase db reset` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | INFRA-04 | smoke | `yarn supabase:types && test -f packages/supabase-types/src/database.ts && echo OK` | ❌ W0 | ⬜ pending |
| 08-02-03 | 02 | 1 | INFRA-05 | smoke | `cd apps/supabase && yarn lint:all` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/supabase/` directory and `package.json` — workspace creation
- [ ] `apps/supabase/supabase/config.toml` — CLI initialization
- [ ] `packages/supabase-types/` directory and `package.json` — types package creation
- [ ] `apps/supabase/scripts/lint-schema.mjs` — custom Splinter lint script
- [ ] Root `package.json` workspaces update to include `apps/*`
- [ ] Root `package.json` alias scripts for Supabase commands

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Studio accessible | INFRA-02 | Browser-based visual check | Navigate to `http://localhost:54323` and verify dashboard loads |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
