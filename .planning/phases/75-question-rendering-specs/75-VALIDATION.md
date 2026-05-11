---
phase: 75
slug: question-rendering-specs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-11
---

# Phase 75 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 (E2E) + Vitest (unit, not exercised by Phase 75) |
| **Config file** | `tests/playwright.config.ts` (timeout: 90000, workers: CI?1:6, fullyParallel: true) |
| **Quick run command** | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "@voter"` (per-spec subset) |
| **Single spec command** | `yarn workspace @openvaa/tests test:e2e --workers=1 -- tests/specs/voter/voter-question-rendering-{boolean,categorical}.spec.ts` |
| **Full suite command** | `yarn dev:reset-with-data && yarn test:e2e --workers=1` (with `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` first per D-09 vite-cache wipe) |
| **3-run determinism gate** | Same full suite × 3 (no reset between runs 2 + 3); identical pass/fail set per D-07 |
| **Parity-script smoke** | `tests/scripts/diff-playwright-reports.ts` self-identity smoke + regen via `regen-constants.mjs` if new tests land in baseline (per D-08) |
| **Estimated runtime** | New specs: ~30-60s combined (boolean walk ≈ ~25s; categorical walk ≈ ~25s). Full 3-run gate: ~30-45 min cold-start. |

---

## Sampling Rate

- **After every task commit:** Run the single-spec command for the spec just edited (~25-60s feedback).
- **After every plan wave:** Run quick subset (`--grep "@voter"`) — voter-app project (read-only), ~3-5 min.
- **Before `/gsd-verify-work`:** Full 3-run cold-start `--workers=1` smoke must be green; parity-gate must PASS (3×).
- **Max feedback latency:** ~60s per single-spec run; ~5 min per voter-app subset.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 75-01-01 | 01 | 1 | QSPEC-01 | — | Boolean opinion question renders as 2-button radio (yes/no labels via `t('common.answer.*')`); voter answers; persists; entity-detail mirror | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 -- tests/specs/voter/voter-question-rendering-boolean.spec.ts` | ❌ W0 | ⬜ pending |
| 75-01-02 | 01 | 1 | QSPEC-01 | — | dev-seed e2e template includes `test-question-boolean-1` at sort 18 + `test-category-boolean` + Alpha `{ value: true }` cell; `yarn build @openvaa/dev-seed` succeeds | unit (build) | `yarn build --filter=@openvaa/dev-seed && yarn dev:reset-with-data` | ❌ W0 | ⬜ pending |
| 75-02-01 | 02 | 2 | QSPEC-02 | — | Categorical (single-choice) opinion question renders as N-button choice list; voter selects middle option; persists; entity-detail mirror with asymmetric voter≠Alpha answers | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 -- tests/specs/voter/voter-question-rendering-categorical.spec.ts` | ❌ W0 | ⬜ pending |
| 75-02-02 | 02 | 2 | QSPEC-01, QSPEC-02 | — | Dedup audit step: grep voter-matching.spec.ts + packages/matching for overlapping assertions; no QSPEC duplicates an existing assertion; report saved at plan SUMMARY | manual + grep | `grep -nE "boolean\|singleChoiceCategorical\|test-question-directional" tests/tests/specs/voter/voter-matching.spec.ts packages/matching/src/**/*.test.ts` | ✅ | ⬜ pending |
| 75-02-03 | 02 | 2 | QSPEC-01, QSPEC-02 | — | Vite-cache wipe + 3-run cold-start `--workers=1` smoke (3×) produces identical pass/fail set; new specs land in PASS_LOCKED; DATA_RACE pool stays at 15 | E2E (full suite ×3) | `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit && yarn dev:reset-with-data && yarn test:e2e --workers=1` (×3) | ❌ W0 | ⬜ pending |
| 75-02-04 | 02 | 2 | — | — | Parity-script self-identity smoke (`tests/scripts/diff-playwright-reports.ts`) + conditional regen (`regen-constants.mjs`) for the +N new PASS_LOCKED entries; PARITY GATE: PASS × 3 | shell | `node tests/scripts/diff-playwright-reports.ts` + `node .planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs` | ✅ | ⬜ pending |
| 75-02-05 | 02 | 2 | — | — | `75-VERIFICATION.md` produced documenting 4/4 SCs PASS + 3-run SHA-identity + parity-gate output + IMGPROXY_TIED_TITLES safety check | document | `test -f .planning/phases/75-question-rendering-specs/75-VERIFICATION.md && grep -c "PASS" .planning/phases/75-question-rendering-specs/75-VERIFICATION.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` — NEW spec file (Plan 01 Task 01)
- [ ] `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` — NEW spec file (Plan 02 Task 01)
- [ ] `packages/dev-seed/src/templates/e2e.ts` — extension: new boolean question at sort 18 + new category + Alpha answer cell (Plan 01 Task 02)
- [ ] Optional helper: `tests/tests/utils/voterNavigation.ts walkToQuestion(page, sortOrder)` — extracted from the skip-walk pattern shared by Plan 01 + Plan 02 (planner's call per CONTEXT D-10 Claude's Discretion + RESEARCH §10).
- [ ] `.planning/phases/75-question-rendering-specs/75-VERIFICATION.md` — Plan 02 verification report

*Existing infrastructure (Playwright + dev-seed + voterNavigation utils + EntityDetailPage object + parity-script tooling) covers everything else.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dedup audit assertion-by-assertion check | QSPEC-01, QSPEC-02 (SC #3) | Requires human judgement: comparing the SEMANTIC contract of each assertion in the new specs against analog assertions in `voter-matching.spec.ts` + `packages/matching/`. Grep finds candidates; human judges whether overlap is real. | (a) `grep -n "BooleanQuestion\|isBooleanQuestion\|test-question-boolean" packages/matching/src/**/*.test.ts tests/tests/specs/voter/voter-matching.spec.ts`; (b) for each grep hit: read the QSPEC assertion + the analog assertion; (c) confirm: QSPEC asserts user-flow + render-shape (Playwright's strength); analog asserts matching-algorithm contract (unit-test's strength); (d) record outcome in Plan 02 SUMMARY.md `### Dedup Audit` section. |
| 3-run SHA-identity verification | SC #4 (Determinism preserved) | Requires inspecting `playwright-report/data/*.json` for identical SHA fingerprints across 3 runs — automated but the SHA comparison + interpretation is a manual review step. | After `yarn test:e2e --workers=1` × 3 (Plan 02 Task 03): `sha256sum playwright-report-run1/data/test-results.json playwright-report-run2/data/test-results.json playwright-report-run3/data/test-results.json`; assert all three SHAs match; record in `75-VERIFICATION.md`. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (Plan 02 Task 02 dedup audit is manual, but Tasks 03+04 are automated — Wave 2 satisfies continuity)
- [ ] Wave 0 covers all MISSING references (4 new files + 1 modified file)
- [ ] No watch-mode flags (Playwright `--workers=1` only; no `--watch`)
- [ ] Feedback latency < 60s per single-spec run; < 5 min per voter-app subset; ~30-45 min for full 3-run gate (acceptable for end-of-phase verification only)
- [ ] `nyquist_compliant: true` set in frontmatter (gate at Plan 02 close)

**Approval:** pending (Plan 02 verification close)
