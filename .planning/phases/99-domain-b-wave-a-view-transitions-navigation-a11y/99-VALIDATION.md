---
phase: 99
slug: domain-b-wave-a-view-transitions-navigation-a11y
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-04
---

# Phase 99 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + `@axe-core/playwright` (a11y smoke) + vitest (unit) |
| **Config file** | `tests/playwright.config.ts`; a11y spec `tests/tests/specs/a11y/a11y-smoke.spec.ts` (project `a11y-smoke`, gated `PLAYWRIGHT_A11Y=1`) |
| **Quick run command** | `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` |
| **Full suite command** | `yarn test:e2e` (+ `yarn test:unit`) |
| **Estimated runtime** | a11y smoke ~1–2 min; full E2E minutes |

---

## Sampling Rate

- **After every task commit:** Run the a11y smoke (`PLAYWRIGHT_A11Y=1 … --project=a11y-smoke`) once transition/focus hooks land
- **After every plan wave:** Run the relevant E2E specs (voter-journey + a11y smoke)
- **Before `/gsd-verify-work`:** Full E2E + a11y smoke green; no behavior regression vs v2.10 baseline
- **Max feedback latency:** ~2 min (a11y smoke)

---

## Per-Task Verification Map

> Populated by the planner/executor.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 99-01-01 | 01 | 1 | VT-01 | — | N/A | e2e | `yarn test:e2e` | ✅ (extend a11y-smoke) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend existing `tests/tests/specs/a11y/a11y-smoke.spec.ts` (do NOT invent a new harness) — focus-management + aria-live announcer + reduced-motion assertions (NAVA11Y-03)
- [ ] Reduced-motion + `?notr=1` deterministic-disable hooks usable from E2E

*Existing Playwright + axe-core infrastructure covers the rest.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-fade reads as element-stable (not full redraw) | VT-01/VT-02 | Visual perception | Navigate Q→Q, results tabs, locale switch; confirm Header/MainContent/hero persist visually across the fade |
| Screen-reader announces route change | NAVA11Y-01 | SR behavior | NVDA/VoiceOver: navigate, confirm aria-live announcement fires (not title-only) |
| `prefers-reduced-motion` disables animation | VT-03 | OS-level setting | Enable reduce-motion at OS level, confirm no transition animates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
