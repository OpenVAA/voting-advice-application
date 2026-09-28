---
phase: 7
slug: advanced-test-capabilities
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
gap_audit: 2026-03-11
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn playwright test -c ./tests/playwright.config.ts --grep @visual` |
| **Full suite command** | `yarn playwright test -c ./tests/playwright.config.ts --grep "@visual\|@perf"` |
| **Estimated runtime** | ~30 seconds (visual) + ~60 seconds (perf with reload) |

---

## Sampling Rate

- **After every task commit:** Run the specific tag (`--grep @visual` or `--grep @perf`)
- **After every plan wave:** Run `yarn playwright test -c ./tests/playwright.config.ts --grep "@visual|@perf"`
- **Before `/gsd:verify-work`:** Full suite must be green plus default `yarn test:e2e` still passes
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | INFRA-10 | e2e (visual) | `yarn playwright test -c ./tests/playwright.config.ts --grep @visual` | yes | green |
| 07-02-01 | 02 | 1 | INFRA-11 | e2e (perf) | `yarn playwright test -c ./tests/playwright.config.ts --grep @perf` | yes | green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/tests/specs/visual/visual-regression.spec.ts` — 4 visual regression tests (desktop + mobile)
- [x] `tests/tests/specs/perf/performance-budget.spec.ts` — performance budget with DOMContentLoaded + load timing
- [x] Playwright config with `snapshotPathTemplate`, `expect.toHaveScreenshot` defaults, opt-in gating

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Baseline screenshots visually correct | INFRA-10 | First-run baselines need human review to confirm they capture expected content | Review generated PNGs in `__screenshots__/` directory |
| Performance budget values reasonable | INFRA-11 | Budget calibration requires empirical measurement and judgment | Run perf test 3-5 times, verify P90 + 50% margin is the budget |

---

## Validation Sign-Off

- [x] All tasks have automated verify or documented manual-only justification
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all files
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** gap-audit complete 2026-03-11
