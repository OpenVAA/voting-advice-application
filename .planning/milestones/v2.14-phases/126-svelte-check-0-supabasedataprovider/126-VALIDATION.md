---
phase: 126
slug: svelte-check-0-supabasedataprovider
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-16
---

# Phase 126 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit) + svelte-check (type gate) + Playwright (E2E) |
| **Config file** | apps/frontend/vitest + apps/frontend svelte-check via `yarn check`; Playwright in apps/frontend |
| **Quick run command** | `cd apps/frontend && yarn check` (type accounting) + targeted `yarn test:unit` for touched utils |
| **Full suite command** | `yarn build && yarn test:unit && cd apps/frontend && yarn check` + one full `yarn test:e2e` at the D-06 gate |
| **Estimated runtime** | svelte-check ~2–3 min; unit ~1–2 min; full E2E ~10 min |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/frontend && yarn check` and record the error count (per-cluster accounting per D-06)
- **After every plan wave:** Run `yarn test:unit` (toDataObject tests + provider tests)
- **Before `/gsd-verify-work`:** Full suite green including one full E2E run (cardinal rule; fresh dev server on :5173 + `yarn db:reset` first)
- **Max feedback latency:** ~180 seconds (svelte-check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled by planner) | | | TYPE-04 | — | N/A | type-gate | `cd apps/frontend && yarn check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements (svelte-check, vitest unit suites incl. `toDataObject.test.ts` and `supabaseDataProvider.test.ts`, full Playwright E2E suite).

---

## Manual-Only Verifications

All phase behaviors have automated verification (type gate + unit + E2E behavior-neutrality signal).

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
