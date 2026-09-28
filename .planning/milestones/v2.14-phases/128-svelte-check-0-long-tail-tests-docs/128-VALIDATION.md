---
phase: 128
slug: svelte-check-0-long-tail-tests-docs
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-16
---

# Phase 128 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + svelte-check (type gate) + Playwright (E2E) |
| **Config file** | `apps/frontend/vitest.config.ts` / `apps/frontend/svelte.config.js` / `tests/playwright.config.ts` |
| **Quick run command** | `cd apps/frontend && yarn check` (the phase's primary signal) + targeted `yarn test:unit` in touched workspace |
| **Full suite command** | `yarn build && yarn test:unit && cd apps/frontend && yarn check && cd ../docs && yarn check`; then full `yarn test:e2e` at the gate |
| **Estimated runtime** | svelte-check ~60s; unit ~2min; full E2E ~10min |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/frontend && yarn check` and compare error/warning counts against the expected per-cluster decrement (exact accounting, no net-new)
- **After every plan wave:** Run `yarn test:unit` (all workspaces) + both svelte-checks
- **Before `/gsd-verify-work`:** Full D-07 gate green — frontend 0/0, docs 0/0, build, unit, full E2E 125+/0/0
- **Max feedback latency:** ~120 seconds (svelte-check + targeted unit)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled at plan time) | — | — | TYPE-07/08/09 | — | N/A (type/a11y hygiene, no auth surface change) | type-gate | `cd apps/frontend && yarn check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — svelte-check, unit suites, and the full E2E suite already exist and were green at Phase 127 close (125/0/0).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Term.svelte + docs carousel a11y fixes render/behave correctly | TYPE-09 | a11y semantics change is visual/interaction-level; axe/E2E cover regressions but a quick keyboard-focus sanity check is prudent | Tab to a Term element in the voter app → tooltip/focus behavior unchanged; docs landing page carousel still swipes/advances |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
