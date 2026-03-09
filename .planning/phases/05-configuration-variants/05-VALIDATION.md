---
phase: 5
slug: configuration-variants
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
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
| TBD | 01 | 1 | CONF-02, CONF-04 | e2e | `yarn test:e2e --project=variant-multi-election` | ❌ W0 | ⬜ pending |
| TBD | 02 | 1 | CONF-03 | e2e | `yarn test:e2e --project=variant-constituency` | ❌ W0 | ⬜ pending |
| TBD | 02 | 1 | CONF-03 | e2e | `yarn test:e2e --project=variant-startfromcg` | ❌ W0 | ⬜ pending |
| TBD | 03 | 1 | CONF-05, CONF-06 | e2e | `yarn test:e2e --project=variant-results-sections` | ❌ W0 | ⬜ pending |
| TBD | 01-03 | 1 | CONF-07 | e2e | validated by setup projects running successfully | ❌ W0 | ⬜ pending |
| TBD | 01-03 | 1 | CONF-08 | config | verified by running full suite with variant projects | ❌ W0 | ⬜ pending |
| N/A | N/A | N/A | CONF-01 | e2e | `yarn test:e2e --project=voter-app` (Phase 3 existing) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/tests/data/overlays/multi-election-overlay.json` — CONF-02, CONF-04 dataset
- [ ] `tests/tests/data/overlays/constituency-overlay.json` — CONF-03 dataset
- [ ] `tests/tests/data/overlays/startfromcg-overlay.json` — startFromConstituencyGroup dataset
- [ ] `tests/tests/utils/mergeDatasets.ts` — dataset merge utility
- [ ] `tests/tests/setup/variant-multi-election.setup.ts` — multi-election data setup
- [ ] `tests/tests/setup/variant-constituency.setup.ts` — constituency data setup
- [ ] `tests/tests/setup/variant-startfromcg.setup.ts` — startFromCG data setup
- [ ] `tests/tests/setup/variant-data.teardown.ts` — shared variant teardown
- [ ] `tests/tests/specs/variants/multi-election.spec.ts` — CONF-02, CONF-04 tests
- [ ] `tests/tests/specs/variants/constituency.spec.ts` — CONF-03 tests
- [ ] `tests/tests/specs/variants/startfromcg.spec.ts` — startFromConstituencyGroup tests
- [ ] `tests/tests/specs/variants/results-sections.spec.ts` — CONF-05, CONF-06 tests
- [ ] `tests/playwright.config.ts` — updated with variant project entries

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
