---
phase: 37
slug: e2e-failure-resolution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 37 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright E2E |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `cd tests && npx playwright test --project={project}` |
| **Full suite command** | `cd tests && npx playwright test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run specific test project related to the fix
- **After every plan wave:** Run full E2E suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 37-01-01 | 01 | 1 | TEST-06 | e2e | `cd tests && npx playwright test --project=auth-setup` | Yes | pending |
| 37-01-02 | 01 | 1 | TEST-06 | e2e | `cd tests && npx playwright test --project=candidate-app` | Yes | pending |
| 37-02-01 | 02 | 1 | TEST-06 | e2e | `cd tests && npx playwright test --project=voter-app voter-detail` | Yes | pending |
| 37-02-02 | 02 | 1 | TEST-06 | e2e | `cd tests && npx playwright test --project=voter-app voter-matching` | Yes | pending |
| 37-02-03 | 02 | 1 | TEST-06 | e2e | `cd tests && npx playwright test --project=voter-app voter-results` | Yes | pending |
| 37-03-01 | 03 | 2 | TEST-07 | manual | Grep for FIXME/TODO in test files | Yes | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Playwright is configured and test files exist.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FIXME/TODO audit | TEST-07 | Requires judgment on fix vs track | Grep for FIXME/TODO, evaluate each |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
