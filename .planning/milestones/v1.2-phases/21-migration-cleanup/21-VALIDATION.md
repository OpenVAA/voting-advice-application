---
phase: 21
slug: migration-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit), Playwright (e2e) |
| **Config file** | `apps/frontend/vite.config.ts` (vitest), `playwright.config.ts` (e2e) |
| **Quick run command** | `yarn build` |
| **Full suite command** | `yarn build && cd apps/frontend && npx svelte-check` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn build`
- **After every plan wave:** Run `yarn build && cd apps/frontend && npx svelte-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | CLEAN-01 | build + code review | `yarn build` | N/A (build verification) | ⬜ pending |
| 21-01-02 | 01 | 1 | CLEAN-02 | svelte-check | `cd apps/frontend && npx svelte-check 2>&1 \| grep -c ERROR` | N/A (tool verification) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| paramStore('lang') block fully removed | CLEAN-01 | Code review confirms no remnant references | Read `dataContext.ts`, verify no `paramStore('lang')` or `unsubscribers` array |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
