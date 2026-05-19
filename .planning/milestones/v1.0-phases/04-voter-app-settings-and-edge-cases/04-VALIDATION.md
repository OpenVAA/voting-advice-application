---
phase: 4
slug: voter-app-settings-and-edge-cases
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-08
gap_audit: 2026-03-11
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
| 04-01-01 | 01 | 1 | VOTE-13 | e2e | `yarn playwright test voter-settings.spec.ts -g "category selection"` | yes | green |
| 04-01-02 | 01 | 1 | VOTE-19 | e2e | `yarn playwright test voter-static-pages.spec.ts -g "nominations"` | yes | green |
| 04-02-01 | 02 | 1 | VOTE-15 | e2e | `yarn playwright test voter-popups.spec.ts -g "feedback popup"` | yes | green |
| 04-02-02 | 02 | 1 | VOTE-16 | e2e | `yarn playwright test voter-popups.spec.ts -g "survey popup"` | yes | green |
| 04-02-03 | 02 | 1 | VOTE-17 | e2e | `yarn playwright test voter-settings.spec.ts -g "results link"` | yes | green |
| 04-03-01 | 03 | 1 | VOTE-18 | e2e | `yarn playwright test voter-static-pages.spec.ts -g "static pages"` | yes | green |
| 04-03-02 | 03 | 1 | VOTE-14 | manual | See manual-only section | N/A | manual-only |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · manual-only*

---

## Wave 0 Requirements

- [x] `tests/tests/specs/voter/voter-settings.spec.ts` — covers VOTE-13, VOTE-17
- [x] `tests/tests/specs/voter/voter-popups.spec.ts` — covers VOTE-15, VOTE-16
- [x] `tests/tests/specs/voter/voter-static-pages.spec.ts` — covers VOTE-18, VOTE-19
- [x] testIds in `tests/tests/utils/testIds.ts` for voter pages
- [x] Banner.svelte `data-testid` for results button (VOTE-17)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Statistics page content | VOTE-14 | WIP/unstable in codebase — explicitly skipped per user decision | When statistics feature is stable, add E2E test to `voter-static-pages.spec.ts` |

---

## Validation Sign-Off

- [x] All tasks have automated verify or documented manual-only justification
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all files
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** gap-audit complete 2026-03-11
