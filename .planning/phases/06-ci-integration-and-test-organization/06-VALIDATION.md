---
phase: 6
slug: ci-integration-and-test-organization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | @playwright/test 1.58.2 |
| **Config file** | tests/playwright.config.ts |
| **Quick run command** | `cd tests && npx playwright test --grep @smoke` |
| **Full suite command** | `cd tests && npx playwright test` |
| **Estimated runtime** | ~120 seconds (smoke), ~600 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `cd tests && npx playwright test --grep @smoke` (requires Docker stack running)
- **After every plan wave:** Run `cd tests && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | CI-01 | CI workflow | Validate YAML syntax + `act` dry-run if available | ✅ | ⬜ pending |
| 06-01-02 | 01 | 1 | CI-02 | CI artifact | Check artifact upload step exists in workflow | ✅ | ⬜ pending |
| 06-02-01 | 02 | 1 | CI-03 | tag grep | `cd tests && npx playwright test --grep @smoke --list` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | CI-03 | tag grep | `cd tests && npx playwright test --grep @voter --list` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 1 | CI-03 | tag grep | `cd tests && npx playwright test --grep @candidate --list` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing test infrastructure covers CI workflow changes (no new test files needed)
- Tag verification uses `--list` mode which does not require Docker stack

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PR triggers CI run with pass/fail status | CI-01 | Requires actual GitHub PR creation | Open a PR, verify the Actions job runs and posts a status check |
| HTML report downloadable from Actions page | CI-02 | Requires actual CI run completion | After CI completes, check Artifacts section for HTML report |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
