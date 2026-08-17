---
phase: 22
slug: leaf-component-migration
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-18
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 (unit) + Playwright 1.58.2 (E2E) |
| **Config file** | `apps/frontend/vitest.config.ts` (unit), `tests/playwright.config.ts` (E2E) |
| **Quick run command** | `yarn workspace @openvaa/frontend check` |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | ~30s (typecheck), ~120s (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend check`
- **After every plan wave:** Run `yarn build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirements | Test Type | Automated Command | File Exists | Status |
|---------|------|------|--------------|-----------|-------------------|-------------|--------|
| 22-01-T1 | 01 | 1 | COMP-01, COMP-02, COMP-07 | grep | `grep -rn '$$restProps\|export let' {13 files}; echo "EXIT:$?"` | N/A | pending |
| 22-01-T2 | 01 | 1 | COMP-01, COMP-02, COMP-07 | grep + typecheck | `grep + yarn workspace @openvaa/frontend check` | N/A | pending |
| 22-02-T1 | 02 | 2 | COMP-01, COMP-02, COMP-03, COMP-06, COMP-08 | grep + typecheck | `grep + yarn workspace @openvaa/frontend check` | N/A | pending |
| 22-02-T2 | 02 | 2 | COMP-03 | grep + typecheck | `grep '<Button.*on:click' + yarn workspace @openvaa/frontend check` | N/A | pending |
| 22-03-T1 | 03 | 3 | COMP-01, COMP-02, COMP-06 | grep | `grep -rn '$$restProps\|export let' {12 files}` | N/A | pending |
| 22-03-T2 | 03 | 3 | COMP-06, COMP-09 | grep + typecheck | `grep modifiers + yarn workspace @openvaa/frontend check` | N/A | pending |
| 22-04-T1 | 04 | 4 | COMP-01, COMP-02 | grep + typecheck | `grep legacy + yarn workspace @openvaa/frontend check` | N/A | pending |
| 22-05-T1 | 05 | 4 | COMP-03, COMP-07, COMP-08 | grep + typecheck | `grep svelte:self/component + yarn workspace @openvaa/frontend check` | N/A | pending |
| 22-05-T2 | 05 | 4 | COMP-01, COMP-02 | grep + typecheck | `grep legacy + createEventDispatcher preserved check` | N/A | pending |
| 22-06-T1 | 06 | 5 | COMP-01, COMP-02, COMP-06 | grep + typecheck | `grep legacy + $bindable check + yarn workspace @openvaa/frontend check` | N/A | pending |
| 22-06-T2 | 06 | 5 | COMP-01..COMP-09 | comprehensive sweep | Full grep sweep + typecheck + build | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:
1. TypeScript compilation catches type errors from incorrect `$props`, missing `$bindable`, etc.
2. E2E tests catch runtime behavioral regressions
3. Grep-based verification catches remaining legacy patterns

*No new test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Video.svelte playback controls | COMP-09 | Media interactions not covered by E2E | Load a page with Video component, verify play/pause/mute/unmute/seek all work correctly |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
