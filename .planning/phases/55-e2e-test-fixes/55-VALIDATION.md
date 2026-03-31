---
phase: 55
slug: e2e-test-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 55 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit), playwright (E2E) |
| **Config file** | `apps/frontend/playwright.config.ts` |
| **Quick run command** | `yarn test:unit` |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:unit`
- **After every plan wave:** Run `yarn test:e2e`
- **Before `/gsd:verify-work`:** Full E2E suite must be green with zero skipped tests
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|

*Populated after plans are created.*

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Playwright and browsers already installed.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification (E2E tests are the deliverable).*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
