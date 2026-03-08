---
phase: 4
slug: voter-app-settings-and-edge-cases
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | tests/playwright.config.ts |
| **Quick run command** | `yarn playwright test tests/tests/specs/voter/voter-settings.spec.ts` |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn playwright test tests/tests/specs/voter/<spec-file>.spec.ts`
- **After every plan wave:** Run `yarn test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | VOTE-13 | e2e | `yarn playwright test voter-settings.spec.ts -g "category selection"` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | VOTE-19 | e2e | `yarn playwright test voter-static-pages.spec.ts -g "nominations"` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | VOTE-15 | e2e | `yarn playwright test voter-popups.spec.ts -g "feedback popup"` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | VOTE-16 | e2e | `yarn playwright test voter-popups.spec.ts -g "survey popup"` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 1 | VOTE-17 | e2e | `yarn playwright test voter-settings.spec.ts -g "results link"` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 1 | VOTE-18 | e2e | `yarn playwright test voter-static-pages.spec.ts -g "static pages"` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 1 | VOTE-14 | SKIPPED | n/a | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/tests/specs/voter/voter-settings.spec.ts` — covers VOTE-13, VOTE-17
- [ ] `tests/tests/specs/voter/voter-popups.spec.ts` — covers VOTE-15, VOTE-16
- [ ] `tests/tests/specs/voter/voter-static-pages.spec.ts` — covers VOTE-18, VOTE-19
- [ ] New testIds in `tests/tests/utils/testIds.ts` for voter pages
- [ ] Banner.svelte `data-testid` for results button (VOTE-17)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Statistics page content | VOTE-14 | SKIPPED per context — no statistics feature in current build | n/a |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
