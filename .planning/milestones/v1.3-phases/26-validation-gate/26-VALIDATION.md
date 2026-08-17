---
phase: 26
slug: validation-gate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit), Playwright (E2E), svelte-check (types) |
| **Config file** | `vitest.workspace.ts`, `tests/playwright.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `cd tests && npx playwright test` |
| **Estimated runtime** | ~3s (unit), ~120s (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx svelte-check --workspace apps/frontend`
- **Before `/gsd:verify-work`:** Full E2E suite must be green
- **Max feedback latency:** 5 seconds (unit), 120 seconds (E2E)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | VAL-03 | grep | `grep -rn '$:\|on:click\|<slot\|$$restProps\|$$slots\|$$Props\|createEventDispatcher' apps/frontend/src/routes/(voters)/ apps/frontend/src/lib/components/ apps/frontend/src/lib/dynamic-components/ --include="*.svelte"` | ✅ | ⬜ pending |
| 26-01-02 | 01 | 1 | VAL-02 | svelte-check | `npx svelte-check --workspace apps/frontend` | ✅ | ⬜ pending |
| 26-01-03 | 01 | 1 | VAL-01 | E2E | `cd tests && npx playwright test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
