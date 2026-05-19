---
phase: 1
slug: infrastructure-foundation
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
gap_audit: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:e2e --project=candidate-app` |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:e2e`
- **After every plan wave:** Run `yarn test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFRA-01 | infra | All E2E specs use `testIds.ts` constants | yes | green |
| 01-01-02 | 01 | 1 | INFRA-02 | infra | `npx playwright --version` outputs 1.58+ | yes | green |
| 01-01-03 | 01 | 1 | INFRA-03 | infra | `playwright.config.ts` defines project dependencies | yes | green |
| 01-05-01 | 05 | 2 | INFRA-04 | infra | Page objects in `tests/tests/pages/` used by all specs | yes | green |
| 01-02-01 | 02 | 2 | INFRA-05 | infra | `StrapiAdminClient` with `/import-data`, `/delete-data` | yes | green |
| 01-02-02 | 02 | 2 | INFRA-06 | infra | `data.teardown.ts` resets DB between runs | yes | green |
| 01-02-03 | 02 | 2 | INFRA-07 | infra | `default-dataset.json`, `voter-dataset.json`, `candidate-addendum.json` | yes | green |
| 01-05-02 | 05 | 2 | INFRA-08 | infra | Utilities in `tests/tests/utils/` (buildRoute, emailHelper, translations, voterNavigation) | yes | green |
| 01-06-01 | 06 | 3 | INFRA-09 | infra | `tests/eslint.config.mjs` with `eslint-plugin-playwright` | yes | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — all verified by artifact existence.*

- [x] `tests/playwright.config.ts` — Playwright 1.58.2, project dependencies (INFRA-02, INFRA-03)
- [x] `tests/tests/utils/testIds.ts` — central testId constants (INFRA-01)
- [x] `tests/tests/utils/strapiAdminClient.ts` — Admin Tools API client (INFRA-05)
- [x] `tests/tests/setup/data.setup.ts` + `data.teardown.ts` — DB state management (INFRA-06)
- [x] `tests/tests/data/default-dataset.json` — pre-defined JSON test dataset (INFRA-07)
- [x] `tests/tests/pages/candidate/*.ts` + `tests/tests/pages/voter/*.ts` — page objects (INFRA-04)
- [x] `tests/tests/utils/*.ts` — helper utilities (INFRA-08)
- [x] `tests/eslint.config.mjs` — ESLint Playwright plugin (INFRA-09)

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** gap-audit complete 2026-03-11
