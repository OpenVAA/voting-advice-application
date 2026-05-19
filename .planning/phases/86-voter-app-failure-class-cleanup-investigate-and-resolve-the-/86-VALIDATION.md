---
phase: 86
slug: voter-app-failure-class-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-14
---

# Phase 86 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution of Voter-App FAILURE-CLASS Cleanup.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 (e2e) + Vitest (unit — packages/matching, packages/data, packages/filters) |
| **Config file** | `tests/playwright.config.ts` (project-level discovery) |
| **Quick run command** | `yarn workspace tests playwright test --project=voter-app <spec>.spec.ts -x` (single-spec, single-project) |
| **Full suite command** | `yarn test:e2e` (cold-start gate requires `yarn db:reset && yarn dev:clean` upstream) |
| **Estimated runtime** | Single-spec: ~15-30s · Voter-projects wave: ~3-4 min · Cold-start full suite: ~54 min (×3 = ~162 min) |

---

## Sampling Rate

- **After every task commit:** Run the touched spec(s) in isolation: `yarn workspace tests playwright test --project=<project> <spec>.spec.ts -x`.
- **After every plan wave:** Run voter-projects bundle: `yarn workspace tests playwright test --project=voter-app --project=voter-app-popups --project=variant-hidden-required-voter`. ~3-4 min — skips imgproxy-tied + variant-cascade projects to keep iteration fast.
- **Before `/gsd-verify-work`:** Full 3-run cold-start gate must produce SHA-identical FIRST attempt (Phase 86 D-05/D-06).
- **Max feedback latency:** 30 seconds per-task · 4 minutes per-wave · ~162 minutes phase-gate.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 86-01-{N} | 01 | 1 | DETERM-12 | N/A | voter-popups dismissal-after-reload deterministic | e2e | `yarn workspace tests playwright test --project=voter-app-popups voter-popups.spec.ts -x` | ✅ | ⬜ pending |
| 86-01-{N} | 01 | 1 | DETERM-12 | N/A | voter-popup-hydration full-page-load deterministic | e2e | `yarn workspace tests playwright test --project=voter-app voter-popup-hydration.spec.ts -x` | ✅ | ⬜ pending |
| 86-01-{N} | 01 | 1 | DETERM-12 | N/A | voter-navigation results-CTA threshold deterministic | e2e | `yarn workspace tests playwright test --project=voter-app voter-navigation.spec.ts -x` | ✅ | ⬜ pending |
| 86-01-{N} | 01 | 1 | DETERM-12 | N/A | voter-not-located-redirect /results deeplink (chain-head) | e2e | `yarn workspace tests playwright test --project=voter-app voter-not-located-redirect.spec.ts -x` | ✅ | ⬜ pending |
| 86-01-{N} | 01 | 1 | DETERM-12 | N/A | voter-detail party-drawer flake (boundary harden) | e2e | `yarn workspace tests playwright test --project=voter-app voter-detail.spec.ts -g "party detail drawer" -x` | ✅ | ⬜ pending |
| 86-02-{N} | 02 | 1 | DETERM-13 | N/A | voter-results filter-toggle no-effect-update-depth | e2e | `yarn workspace tests playwright test --project=voter-app voter-results.spec.ts -g "filter toggle" -x` | ✅ | ⬜ pending |
| 86-02-{N} | 02 | 1 | DETERM-13 | N/A | voter-feedback-persistence | e2e | `yarn workspace tests playwright test --project=voter-app voter-feedback-persistence.spec.ts -x` | ✅ | ⬜ pending |
| 86-03-{N} | 03 | 1 | DETERM-14 | N/A | voter-question-rendering boolean (QSPEC-01) | e2e | `yarn workspace tests playwright test --project=voter-app voter-question-rendering-boolean.spec.ts -x` | ✅ | ⬜ pending |
| 86-03-{N} | 03 | 1 | DETERM-14 | N/A | voter-question-rendering categorical (QSPEC-02) | e2e | `yarn workspace tests playwright test --project=voter-app voter-question-rendering-categorical.spec.ts -x` | ✅ | ⬜ pending |
| 86-03-{N} | 03 | 1 | DETERM-14 | N/A | voter-visibility-required SETTINGS-03 hidden absent | e2e | `yarn workspace tests playwright test --project=voter-app voter-visibility-required.spec.ts -x` | ✅ | ⬜ pending |
| 86-03-{N} | 03 | 1 | DETERM-14 | N/A | voter-detail case (d) both-missing | e2e | `yarn workspace tests playwright test --project=voter-app voter-detail.spec.ts -g "case \\(d\\)" -x` | ✅ | ⬜ pending |
| 86-04-{N} | (close) | 2 | DETERM-12+13+14 | N/A | 3-run cold-start gate SHA-identical FIRST attempt | manual sequence | 3× `yarn db:reset && yarn dev:clean && yarn test:e2e` + `node .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/sha-identity.mjs` | ✅ | ⬜ pending |
| 86-04-{N} | (close) | 2 | DETERM-12+13+14 | N/A | New anchor reflects ~+8-10 net PASS_LOCKED; FAILURE-CLASS ≤ 2 residual | constants regen | `node .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` after re-pointing `reportPath` at Phase 86 run-3.json | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · IDs assigned by planner during PLAN.md generation.*

---

## Wave 0 Requirements

- [x] No new test infrastructure required. All target specs exist. Phase 79's `regen-constants.mjs` + `sha-identity.mjs` infrastructure remains intact post-Phase-85.
- [x] Fixture infrastructure (`tests/tests/fixtures/voter.fixture.ts`, `tests/tests/utils/voterNavigation.ts`) covers all 10 in-scope tests.
- [x] Verification gate scripts (`regen-constants.mjs`, `sha-identity.mjs`) reusable verbatim with `reportPath` re-pointing.

*Wave 0 marked complete — existing infrastructure covers all phase requirements.*

---

## Validation Dimension Matrix (Nyquist)

| # | Dimension | Coverage Mechanism |
|---|-----------|---------------------|
| 1 | **Per-test fix verification** | Per-task smoke: spec runs PASS × 3 in isolation (mirrors Phase 75 / Phase 83 per-plan smoke pattern). |
| 2 | **Per-cluster determinism** | Per-plan smoke: spec + dependent specs run PASS × 3 in cluster scope (mirrors Phase 73 PARITY GATE PASS pattern). |
| 3 | **Full-suite 3-run cold-start identity** | Phase gate: 3× `yarn db:reset && yarn dev:clean && yarn test:e2e` SHA-256 identity check (Phase 79/83/84/85 precedent). |
| 4 | **DATA_RACE pool MUST NOT grow** (D-09 binding) | `regen-constants.mjs` IMGPROXY_TIED_TITLES match-count gate, exit 1 on shrink-or-grow (Phase 84 renegotiated to 3-cell pool). |
| 5 | **CASCADE_BASELINE_TESTS no regression** (D-10 contract) | `diff-playwright-reports.ts` parity gate: cascade → fail-outside-pool is BLOCKER. Cascade-unblocks (e.g., voter-not-located-redirect chain-head fix promoting 4 cascades to PASS_LOCKED) are expected, not regressions. |
| 6 | **FAILURE-CLASS pool shrinks ≥ 8 net (target ≤ 2 residual)** | Compare Phase 85 baseline (~10 FAILURE-CLASS) vs Phase 86 anchor (≤ 2 residual + ≤ N SKIPPED_TESTS). Residual = explicit v2.11+ product-decision deferrals only. |
| 7 | **Skip-rationale completeness** | Each `test.skip(true, '...')` MUST have: (a) inline rationale string ≥ 20 chars, (b) block comment ≥ 3 lines above, (c) v2.11+ follow-up todo file at `.planning/todos/pending/2026-MM-DD-<short>.md`. Mirrors Phase 75 QSPEC-01/02 precedent. |
| 8 | **Narrative block consistency** | `tests/scripts/diff-playwright-reports.ts` FAILURE-CLASS narrative comment block (currently at lines ~42-142) updated to reflect Phase 86 reality. CONTEXT.md cites stale `:87-101` — actual block has drifted across Phases 84-85. |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 3-run cold-start gate SHA identity | DETERM-12+13+14 | Cannot be automated inside a single test runner (each run is a fresh process boundary; requires `db:reset` between runs). Same pattern as Phase 79/83/84/85. | (1) `yarn db:reset && yarn dev:clean && yarn test:e2e > tests/playwright-report-run1.json`, (2) repeat for run2/run3, (3) `node .planning/phases/79-…/post-fix/sha-identity.mjs run{1,2,3}.json` → expect single SHA hash. |
| Skip-rationale audit | DETERM-12+13+14 (any escalation) | Markdown / todo-file presence is verified by code-review, not test runner. | For each `test.skip(true, '...')` introduced in Phase 86: confirm inline rationale + block comment + matching todo file in `.planning/todos/pending/`. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (Wave 0 marked complete pre-execution — no new fixtures)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s per task / < 4min per wave / < 162min phase gate
- [ ] `nyquist_compliant: true` set in frontmatter (planner toggles this when all tasks have automated verify)

**Approval:** pending — planner finalizes during PLAN.md generation; verifier confirms at `/gsd-verify-work`.

---

## Cross-Refs

- Research: `86-RESEARCH.md` §6 "Validation Architecture (Nyquist dimension matrix)" — source of this strategy.
- Context: `86-CONTEXT.md` D-05/D-06/D-07 — gate execution + anchor expectations.
- Phase 79 verification mechanism: `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/` — reusable `regen-constants.mjs` + `sha-identity.mjs`.
- Phase 75 skip precedent: `.planning/milestones/v2.9-phases/75-question-rendering-specs/75-VERIFICATION.md` §"FAILURE-CLASS rationale" — skip+rationale shape template.
