---
phase: 101
slug: suite-re-enable-milestone-close-green-gate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-05
---

# Phase 101 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> For this phase the "validation" IS the suite gate itself — no new test infrastructure is built; existing Playwright + Vitest suites are the instrument.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (`@playwright/test`, workspace `catalog:`) + Vitest (via `turbo run test:unit`) |
| **Config file** | `tests/playwright.config.ts` (E2E); per-package vitest configs (unit) |
| **Quick run command** | `yarn test:e2e --project=perm-per-app-notifications --project=a11y-smoke` |
| **Full suite command** | `yarn test:e2e` (E2E) + `yarn test:unit` (unit) |
| **Estimated runtime** | Quick subset ~minutes; full E2E several minutes (requires `yarn dev` + clean DB) |

---

## Sampling Rate

- **After every task commit:** Run the quick subset (`--project=perm-per-app-notifications --project=a11y-smoke`).
- **After every plan wave:** Run the full `yarn test:e2e` + `yarn test:unit`.
- **Before phase gate / `/gsd-complete-milestone`:** 3× targeted-subset green (D-01) + 1× full E2E (target **84 passed / 0 skipped**, D-03) + 1× full unit, all green.
- **Max feedback latency:** quick subset turnaround (minutes); a "did not run" / cascade-skip counts as a FAILURE, never a pass.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 101-01-xx | 01 | 1 | SUITE-01 | — | N/A (test re-enable; no new auth surface) | E2E | `yarn test:e2e --project=perm-per-app-notifications` | ✅ | ⬜ pending |
| 101-02-xx | 02 | 2 | SUITE-01 | — | a11y axe gate (incl. WCAG-AA color-contrast) stays 0-violation | E2E | `yarn test:e2e --project=a11y-smoke` | ✅ | ⬜ pending |
| 101-03-xx | 03 | 3 | SUITE-01 | — | full-suite green, no regression vs v2.10 baseline | E2E + unit | `yarn test:e2e` + `yarn test:unit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · plan/wave IDs are indicative — final IDs set by the planner.*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements. No framework install, no new test files required.
- The only "gap" is removing the `test.describe.skip` quarantine (Workstream A) and remediating the carried-in a11y color-contrast assertion (Workstream C) if/where it is red.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual-regression sign-off after any theme-token / component-style change for the color-contrast fix | SUITE-01 (carried-in a11y gap) | Visual-regression Playwright project is opt-in (`PLAYWRIGHT_VISUAL`); pixel sign-off is a human judgment | Re-run `a11y-smoke` to confirm 0 axe violations; if a shared theme token changed, regenerate/inspect `visual-regression` baselines and confirm no unintended re-theming across voter + candidate apps, light + dark. |

---

## Validation Sign-Off

- [ ] All tasks have an `<automated>` verify command (Playwright project or vitest) or are covered by existing infrastructure
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify
- [ ] Wave 0 covers all MISSING references (none — existing infra)
- [ ] No watch-mode flags in any verify command
- [ ] Feedback latency acceptable (quick subset in minutes)
- [ ] `nyquist_compliant: true` set in frontmatter once plans are finalized

**Approval:** pending
