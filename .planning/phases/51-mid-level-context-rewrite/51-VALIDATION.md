---
phase: 51
slug: mid-level-context-rewrite
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 51 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit), playwright (E2E) |
| **Config file** | `apps/frontend/vitest.config.ts` |
| **Quick run command** | `yarn test:unit` |
| **Full suite command** | `yarn test:unit && yarn build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:unit`
- **After every plan wave:** Run `yarn test:unit && yarn build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|

*Populated after plans are created.*

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DataRoot version counter triggers re-render | R2.5 | Requires visual confirmation data updates after load | Start dev, verify elections/questions/candidates render after data fetch completes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
