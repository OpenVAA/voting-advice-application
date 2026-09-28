---
phase: 9
slug: directory-restructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.58.2 (E2E) + Vitest ^2.1.8 (unit) |
| **Config file** | `tests/playwright.config.ts` (E2E), per-package `vitest.config.ts` (unit) |
| **Quick run command** | `yarn install && yarn build && yarn test:unit` |
| **Full suite command** | `yarn install && yarn build && yarn test:unit && yarn test:e2e` |
| **Estimated runtime** | ~120 seconds (unit), ~300 seconds (full with E2E) |

---

## Sampling Rate

- **After every task commit:** Run `yarn install && yarn build && yarn test:unit`
- **After every plan wave:** Run `yarn dev && yarn test:e2e && yarn dev:down`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | DIR-01 | smoke | `yarn workspaces list` | N/A | ⬜ pending |
| 09-01-02 | 01 | 1 | DIR-05 | smoke | `yarn build` | N/A | ⬜ pending |
| 09-01-03 | 01 | 1 | DIR-02 | integration | `yarn dev` | N/A | ⬜ pending |
| 09-01-04 | 01 | 1 | DIR-03 | smoke | CI workflow run | N/A | ⬜ pending |
| 09-01-05 | 01 | 1 | DIR-04 | e2e | `yarn test:e2e` | Existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed.

The validation is inherent in the nature of this phase: if paths are wrong, `yarn install`, `yarn build`, or `yarn test:e2e` will fail immediately. Each verification step serves as a binary pass/fail gate.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CI workflows execute with new paths | DIR-03 | Requires actual CI run on GitHub | Push branch, verify all workflow runs pass |
| Docker dev stack starts correctly | DIR-02 | Requires Docker daemon and full stack | Run `yarn dev`, verify all 4 services healthy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
