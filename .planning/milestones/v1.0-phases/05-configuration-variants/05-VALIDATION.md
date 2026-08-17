---
phase: 5
slug: configuration-variants
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-09
gap_audit: 2026-03-11
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn test:e2e --project=variant-multi-election` |
| **Full suite command** | `yarn test:e2e` |
| **Estimated runtime** | ~120 seconds (variants only), ~300 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `yarn test:e2e --project=<variant>` (relevant variant project only)
- **After every plan wave:** Run `yarn test:e2e` (full suite including all variants)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | CONF-02, CONF-04 | e2e | `yarn test:e2e --project=variant-multi-election` | yes | green |
| 05-02-01 | 02 | 1 | CONF-03 | e2e | `yarn test:e2e --project=variant-constituency` | yes | green |
| 05-02-02 | 02 | 1 | CONF-03 | e2e | `yarn test:e2e --project=variant-startfromcg` | yes | green |
| 05-03-01 | 03 | 1 | CONF-05, CONF-06 | e2e | `yarn test:e2e --project=variant-results-sections` | yes | green |
| 05-01-02 | 01-03 | 1 | CONF-07 | infra | Validated by setup projects running successfully | yes | green |
| 05-01-03 | 01-03 | 1 | CONF-08 | config | Verified by running full suite with variant projects | yes | green |
| N/A | N/A | N/A | CONF-01 | e2e | `yarn test:e2e --project=voter-app` (Phase 3 existing) | yes | green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/tests/data/overlays/multi-election-overlay.json` — CONF-02, CONF-04 dataset
- [x] `tests/tests/data/overlays/constituency-overlay.json` — CONF-03 dataset
- [x] `tests/tests/data/overlays/startfromcg-overlay.json` — startFromConstituencyGroup dataset
- [x] `tests/tests/utils/mergeDatasets.ts` — dataset merge utility
- [x] `tests/tests/setup/variant-multi-election.setup.ts` — multi-election data setup
- [x] `tests/tests/setup/variant-constituency.setup.ts` — constituency data setup
- [x] `tests/tests/setup/variant-startfromcg.setup.ts` — startFromCG data setup
- [x] `tests/tests/setup/variant-data.teardown.ts` — shared variant teardown
- [x] `tests/tests/specs/variants/multi-election.spec.ts` — CONF-02, CONF-04 tests
- [x] `tests/tests/specs/variants/constituency.spec.ts` — CONF-03 tests
- [x] `tests/tests/specs/variants/startfromcg.spec.ts` — startFromConstituencyGroup tests
- [x] `tests/tests/specs/variants/results-sections.spec.ts` — CONF-05, CONF-06 tests
- [x] `tests/playwright.config.ts` — updated with variant project entries

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all files
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** gap-audit complete 2026-03-11
