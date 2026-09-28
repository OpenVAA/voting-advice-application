---
phase: 125
slug: svelte-check-0-trivial-tier
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-15
---

# Phase 125 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + svelte-check (types) + Playwright (E2E) |
| **Config file** | `apps/frontend/vitest.config.ts`, `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend check` (svelte-check per-cluster accounting) |
| **Full suite command** | `yarn build && yarn test:unit && yarn test:e2e` |
| **Estimated runtime** | check ~90s · unit ~120s · E2E ~10min |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend check` and verify the cluster's errors are gone with no net-new
- **After every plan wave:** Run `yarn build && yarn test:unit`
- **Before `/gsd-verify-work`:** Full suite must be green — including one full E2E run (cardinal rule: failing or did-not-run E2E blocks completion)
- **Max feedback latency:** ~120 seconds (svelte-check + unit)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled by planner) | — | — | TYPE-01 | — | N/A | types | `yarn workspace @openvaa/frontend check` → 0 `module 'qs'` errors | ✅ | ⬜ pending |
| (filled by planner) | — | — | TYPE-02 | — | admin-role gate unchanged | types | `yarn workspace @openvaa/frontend check` → 0 admin-jobs `cookies` errors | ✅ | ⬜ pending |
| (filled by planner) | — | — | TYPE-03 | — | N/A | types | `yarn workspace @openvaa/frontend check` → 0 `_spikes-017-019` errors; dir absent | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
