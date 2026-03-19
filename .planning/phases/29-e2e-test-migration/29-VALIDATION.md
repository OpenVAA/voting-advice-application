---
phase: 29
slug: e2e-test-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E), pgTAP (database RPC tests) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `cd tests && npx playwright test --project=data-setup` |
| **Full suite command** | `cd tests && npx playwright test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd tests && npx playwright test --project=data-setup` (verifies data seeding works)
- **After every plan wave:** Run `cd tests && npx playwright test` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 29-01-01 | 01 | 1 | TEST-01 | integration | `cd tests && npx playwright test --project=data-setup` | ✅ | ⬜ pending |
| 29-01-02 | 01 | 1 | TEST-02 | integration | `cd tests && npx playwright test --project=data-setup` | ✅ | ⬜ pending |
| 29-02-01 | 02 | 1 | TEST-02 | integration | `cd tests && npx playwright test --project=data-setup` | ✅ | ⬜ pending |
| 29-03-01 | 03 | 2 | TEST-03 | integration | `cd tests && npx playwright test --project=auth-setup` | ✅ | ⬜ pending |
| 29-04-01 | 04 | 3 | TEST-04 | e2e | `cd tests && npx playwright test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — Playwright is already installed and configured. New test files replace existing ones rather than adding new test infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 17 spec files pass | TEST-04 | Full suite must pass end-to-end | Run `npx playwright test` and verify all projects pass |

*Full suite execution is the primary validation — automated by Playwright but requires running backend.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
