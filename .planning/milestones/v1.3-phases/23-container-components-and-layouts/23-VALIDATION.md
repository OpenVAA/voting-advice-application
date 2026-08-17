---
phase: 23
slug: container-components-and-layouts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit) + Playwright (E2E) |
| **Config file** | `vitest.config.ts` (per workspace) + `playwright.config.ts` |
| **Quick run command** | `yarn test:unit` |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | ~120 seconds (E2E), ~30 seconds (unit) |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:unit`
- **After every plan wave:** Run `yarn test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 23-01-xx | 01 | 1 | COMP-04 | E2E (runtime behavior) | `yarn test:e2e` | ✅ existing 92 E2E tests | ⬜ pending |
| 23-01-xx | 01 | 1 | COMP-05 | E2E (content rendering) | `yarn test:e2e` | ✅ existing 92 E2E tests | ⬜ pending |
| 23-02-xx | 02 | 2 | LAYOUT-01 | E2E (full app navigation) | `yarn test:e2e` | ✅ existing 92 E2E tests | ⬜ pending |
| 23-02-xx | 02 | 2 | LAYOUT-02 | E2E (page rendering) | `yarn test:e2e` | ✅ existing 92 E2E tests | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The 92 E2E tests serve as the regression gate. TypeScript compilation serves as the immediate correctness check (snippet/slot mismatch causes compilation errors).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AdminNav/CandidateNav keyboard focus out | COMP-04 | Latent bug fix — no existing test for broken behavior | Navigate candidate/admin apps, press Tab past nav, verify drawer closes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
