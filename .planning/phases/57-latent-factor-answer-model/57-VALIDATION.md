---
phase: 57
slug: latent-factor-answer-model
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-22
updated: 2026-04-22
---

# Phase 57 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Populated by gsd-planner from RESEARCH.md §"Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (already used in @openvaa/dev-seed) |
| **Config file** | `packages/dev-seed/vitest.config.ts` (existing from Phase 56) |
| **Quick run command** | `yarn workspace @openvaa/dev-seed test:unit` |
| **Full suite command** | `yarn test:unit` (root — all packages) |
| **Estimated runtime** | ~5-10 seconds for dev-seed tests |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/dev-seed test:unit`
- **After every plan wave:** Run `yarn test:unit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

*Each task maps to an automated test or compile-time check. Plan 01 ships Wave 0 test files via TDD — they exist BEFORE their source artifacts. Plan 07 was amended on 2026-04-22 with Task 0 (B1 seam amendment), Task 3 (W1 D-57-20 coverage), and a W2 threshold lock on Task 2.*

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 57-01-T1 | 01 | 1 | GEN-06, GEN-06g | T-57-01, T-57-02 | package deps + LatentHooks types + boxMuller Pitfall-1 clamp + stdDev=0 short-circuit | unit | `yarn workspace @openvaa/dev-seed test:unit tests/latent/gaussian.test.ts` | ❌ Plan 01 creates | ⬜ pending |
| 57-01-T2 | 01 | 1 | GEN-06, GEN-06a | T-57-03, T-57-04 | Ctx.latent field + TemplateSchema.latent with .strict() + .superRefine() (dims-eigenvalues length) | unit | `yarn workspace @openvaa/dev-seed test:unit tests/template/latent.schema.test.ts` | ❌ Plan 01 creates | ⬜ pending |
| 57-02-T1 | 02 | 2 | GEN-06a, GEN-06g | T-57-08 | defaultDimensions — D-57-01 default {2, [1, 1/3]}, D-57-02 geometric-decay (1/3)^i, template overrides | unit | `yarn workspace @openvaa/dev-seed test:unit tests/latent/dimensions.test.ts` | ❌ Plan 02 creates | ⬜ pending |
| 57-02-T2 | 02 | 2 | GEN-06c, GEN-06g | T-57-09, T-57-10 | defaultSpread — D-57-04 scalar 0.15 + preserves `0` via `??`; zero faker consumption | unit | `yarn workspace @openvaa/dev-seed test:unit tests/latent/spread.test.ts` | ❌ Plan 02 creates | ⬜ pending |
| 57-03-T1 | 03 | 2 | GEN-06b, GEN-06g | T-57-12, T-57-13, T-57-14, T-57-15 | defaultCentroids — farthest-point greedy max-min, eigenvalue-scaled pool, D-57-05 partial anchors, wrong-length guard, N=0/1 edges | unit | `yarn workspace @openvaa/dev-seed test:unit tests/latent/centroids.test.ts` | ❌ Plan 03 creates | ⬜ pending |
| 57-04-T1 | 04 | 2 | GEN-06d, GEN-06g | T-57-17, T-57-18, T-57-19 | defaultPositions — isotropic N(centroid, spread²·I) via per-dim boxMuller, spread=0 returns centroid, isotropy + independence statistical checks, partyIdx bounds | unit | `yarn workspace @openvaa/dev-seed test:unit tests/latent/positions.test.ts` | ❌ Plan 04 creates | ⬜ pending |
| 57-05-T1 | 05 | 2 | GEN-06e, GEN-06g | T-57-21, T-57-22, T-57-23, T-57-24 | defaultLoadings — dense N(0,1) matrix keyed by extId, D-57-07 per-question override with copy semantics, Pitfall 3 empty-questions guard, wrong-length fallback | unit | `yarn workspace @openvaa/dev-seed test:unit tests/latent/loadings.test.ts` | ❌ Plan 05 creates | ⬜ pending |
| 57-06-T1 | 06 | 2 | GEN-06f, GEN-06g | T-57-26, T-57-27, T-57-28, T-57-29, T-57-30, T-57-31 | defaultProject + QuestionsGenerator A2 fix — ordinal mapping via COORDINATE inverse-normalize, single/multi cat via per-choice argmax with ≥1 guardrail, D-57-10 fallback for non-choice types, exhaustive never, WeakMap cache scoped per ctx | unit | `yarn workspace @openvaa/dev-seed test:unit tests/latent/project.test.ts` | ❌ Plan 06 creates | ⬜ pending |
| 57-07-T0 | 07 | 3 | GEN-06 (B1 seam amendment) | T-57-32 | D-57 Interpretation Note: CandidatesGenerator forwards `row.organization` into `candidateForEmit` (conditional spread preserves Phase 56 "no org key when ref empty" invariant). 2 regression tests pin the forward at the emitter boundary. | unit | `yarn workspace @openvaa/dev-seed test:unit tests/generators/CandidatesGenerator.test.ts` | ✅ (existing Phase 56 file; Task 0 amends source + appends 2 tests) | ⬜ pending |
| 57-07-T1 | 07 | 3 | GEN-06, GEN-06g | T-57-33, T-57-34, T-57-35 | latentAnswerEmitter — D-57-13 closure-cached SpaceBundle, D-57-14 hook-wins precedence, Pitfall 4 no-party fallback to defaultRandomValidEmit, AnswerEmitter contract assertion | unit | `yarn workspace @openvaa/dev-seed test:unit tests/latent/latentEmitter.test.ts` | ❌ Plan 07 creates | ⬜ pending |
| 57-07-T2 | 07 | 3 | GEN-06 (headline) | T-57-36, T-57-37 | pipeline wire-in via `??=` preserves test injection; D-57-17 mean_intra/mean_inter < 0.5 assertion at seed 42 in MatchingSpace with Manhattan distance (**W2 lock: threshold MUST NOT be lowered — in-code comment banner pinned**); soft correlation `\|r\| > 0.1`; B2 fix — `buildClusteringCtx` parameterized (no LHS cast) | integration (in-memory) | `yarn workspace @openvaa/dev-seed test:unit tests/latent/clustering.integration.test.ts` | ❌ Plan 07 creates | ⬜ pending |
| 57-07-T3 | 07 | 3 | GEN-06 (W1 D-57-20 coverage) | T-57-38 | D-57-20 branches: (a) fixed+answersByExternalId → emitter NOT invoked, answers verbatim; (b) fixed without answersByExternalId → emitter NOT invoked, no synthesized answers; (c) synthetic rows → emitter invoked `count` times with `organization` forwarded (builds on Task 0). 3 regression tests in CandidatesGenerator.test.ts. | unit | `yarn workspace @openvaa/dev-seed test:unit tests/generators/CandidatesGenerator.test.ts` | ✅ (existing Phase 56 file; Task 3 appends 3 tests after Task 0's 2) | ⬜ pending |
| 57-07-regression | 07 | 3 | Phase 56 regressions | — | Full suite green: determinism.test.ts + pipeline.test.ts + writer.test.ts + template.test.ts + every generator test (including the now-15-test CandidatesGenerator.test.ts — 10 Phase 56 + 2 Task 0 + 3 Task 3) + every Plan 01-06 latent test | full | `yarn workspace @openvaa/dev-seed test:unit` | ✅ (Phase 56 files already exist; Plans 01-07 add new tests) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All test files below are created alongside their source in the TDD tasks — the source file is written only AFTER its test file compiles (even before the source exists, the test import will fail loudly). Each implementation task includes the test file in its `<files>` list so Wave 0 gate closes as Wave 1 opens.

| File | Created in | Covers |
|------|------------|--------|
| `packages/dev-seed/tests/latent/gaussian.test.ts` | Plan 01 Task 1 | boxMuller statistics + Pitfall 1 regression + stdDev=0 short-circuit |
| `packages/dev-seed/tests/template/latent.schema.test.ts` | Plan 01 Task 2 | TemplateSchema.latent block acceptance + .strict() typo rejection + .superRefine() eigenvalue-length |
| `packages/dev-seed/tests/latent/dimensions.test.ts` | Plan 02 Task 1 | GEN-06a default + overrides |
| `packages/dev-seed/tests/latent/spread.test.ts` | Plan 02 Task 2 | GEN-06c default + scalar override |
| `packages/dev-seed/tests/latent/centroids.test.ts` | Plan 03 Task 1 | GEN-06b farthest-point + anchors + edges |
| `packages/dev-seed/tests/latent/positions.test.ts` | Plan 04 Task 1 | GEN-06d isotropic Gaussian + determinism |
| `packages/dev-seed/tests/latent/loadings.test.ts` | Plan 05 Task 1 | GEN-06e N(0,1) matrix + per-question override |
| `packages/dev-seed/tests/latent/project.test.ts` | Plan 06 Task 1 | GEN-06f per-type dispatch + mapping correctness |
| `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | Phase 56 (amended by Plan 07 Task 0 + Task 3) | (existing 10 Phase 56) + Task 0 (2 tests — B1 organization forward regression) + Task 3 (3 tests — W1 D-57-20 branches) |
| `packages/dev-seed/tests/latent/latentEmitter.test.ts` | Plan 07 Task 1 | D-57-13 composition + D-57-14 hook precedence + Pitfall 4 fallback |
| `packages/dev-seed/tests/latent/clustering.integration.test.ts` | Plan 07 Task 2 | D-57-17 margin headline (W2 threshold lock via in-code comment banner) + RESEARCH Open Q4 soft correlation; B2 fix — `buildClusteringCtx` parameterized |

**nyquist_compliant:** `true` — every task's source artifact has an `<automated>` verify command; none rely on manual-only checks. Test files are created in the same plan as the source they cover (no separate Wave 0 plan needed — the pattern respects the "test stub exists before implementation" contract task-locally rather than plan-locally).

---

## Manual-Only Verifications

*Phase 57 has no manual-only verifications — every behavior (clustering margin, sub-step determinism, Box-Muller correctness, schema extension, pipeline wire-in, hook precedence, B1 organization forward, W1 D-57-20 fixed-vs-synthetic routing, W2 threshold lock) has automated verification via vitest.*

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies satisfied within the same task
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (10 new test files + 9 new source files mapped 1:1 or 1:many per plan + Plan 07 amends `CandidatesGenerator.ts` via Task 0 and extends `CandidatesGenerator.test.ts` via Tasks 0 and 3)
- [x] No watch-mode flags (`vitest run` via `test:unit` script is one-shot)
- [x] Feedback latency < 10s (dev-seed suite runs in ~5s; adding ~10 Phase 57 tests plus 5 CandidatesGenerator regression tests keeps it under budget)
- [x] `nyquist_compliant: true` set in frontmatter
- [x] 2026-04-22 revision signed off: B1 (Task 0), B2 (Task 2 parameterized ctx), W1 (Task 3), W2 (Task 2 in-code banner + acceptance criterion), W3 (57-RESEARCH.md heading renamed)

**Approval:** ready for execution
