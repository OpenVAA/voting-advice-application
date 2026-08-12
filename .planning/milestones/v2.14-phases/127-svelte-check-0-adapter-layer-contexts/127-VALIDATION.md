---
phase: 127
slug: svelte-check-0-adapter-layer-contexts
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-16
---

# Phase 127 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + @playwright/test (E2E) + svelte-check (typecheck — primary phase signal) |
| **Config file** | `apps/frontend/vitest.config.*` (unit); Playwright config in `apps/frontend` |
| **Quick run command** | `cd apps/frontend && yarn check` |
| **Full suite command** | `yarn test:unit` then `yarn test:e2e` |
| **Estimated runtime** | svelte-check ~90s; unit ~2min; E2E ~10min |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/frontend && yarn check` — touched cluster at 0, total monotonically decreasing (never > 46)
- **After every plan wave:** Run `yarn test:unit --run` on affected files
- **Before `/gsd-verify-work`:** Full suite must be green (build + unit + svelte-check 24/1 exact + full E2E)
- **Max feedback latency:** ~120 seconds (svelte-check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD (planner fills) | — | — | TYPE-05 | — | N/A | typecheck | `cd apps/frontend && yarn check 2>&1 \| grep -E 'supabaseDataWriter\.ts\|supabaseAdminWriter\.ts' \| grep -v '\.test\.ts'` → 0 lines | ✅ | ⬜ pending |
| TBD (planner fills) | — | — | TYPE-06 | — | N/A | typecheck | `cd apps/frontend && yarn check 2>&1 \| grep -E 'adminContext\|candidateContext\|authContext' \| grep -v '\.test\.ts'` → 0 lines | ✅ | ⬜ pending |
| TBD (planner fills) | — | — | TYPE-06 (D-01 fallout) | — | N/A | unit | `cd apps/frontend && yarn test:unit --run candidateUserDataState` | ✅ (6 tests) | ⬜ pending |
| TBD (planner fills) | — | — | TYPE-05/06 behavior-neutrality | — | N/A | e2e | `yarn test:e2e` (full suite, fresh :5173 + `yarn db:reset`) | ✅ (last green 125/0/0) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*None — existing infrastructure covers all phase requirements. svelte-check + `candidateUserDataState.svelte.test.ts` (6 tests) + the E2E suite fully cover this phase. The only test edit is the D-01 fallout fix in `candidateUserDataState.svelte.test.ts` (Promise.resolve wrapper removal).*

---

## Manual-Only Verifications

*None: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
