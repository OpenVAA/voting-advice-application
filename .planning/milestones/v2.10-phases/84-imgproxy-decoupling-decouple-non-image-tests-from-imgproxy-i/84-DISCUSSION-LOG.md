# Phase 84-87: All-Green Suite Batched Discussion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 84-CONTEXT.md / 85-CONTEXT.md / 86-CONTEXT.md / 87-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 84-Imgproxy-Decoupling (batched with 85, 86, 87 per `feedback_batch_discussions.md`)
**Operator directive:** "discuss all next phases together and then auto chain research, planning and execution for all"
**Areas discussed:** Phase 84 investigation depth, Phase 84 DETERM-08/09 ordering, Phase 85 RCA structure, Phase 86 plan cluster structure

---

## Phase 84: Investigation depth before locking gating mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Scout-then-decide-in-plan | Research agent instruments WHERE the 14 imgproxy-tied tests actually touch imgproxy in cold-start; mechanism + plan structure decided after evidence lands. Mirrors a11y scout-first pattern. | ✓ |
| Lock all 3 mechanisms upfront | Land ?skipImages=1 query param AND settings flag AND IntersectionObserver lazy-load in one plan; belt-and-suspenders. Highest blast radius. | |
| Cheapest-first ladder (Phase 83 pattern) | (a) ?skipImages=1 only → re-measure → (b) settings flag if pool > 3 → (c) lazy-load if still > 3. | |

**User's choice:** Scout-then-decide-in-plan (Recommended)
**Notes:** Aligns with `feedback_a11y_actual_axe_scan_first.md` memory + Phase 80 scout-misdiagnosis lesson. Operator's discuss-phase scout revealed NO `<Avatar>`/`<Image>` on candidate-home or protected-layout templates → the actual imgproxy-tie mechanism for the 11 candidate-app-settings tests + re-auth-dual is NOT proven to be initial-paint portrait fetches. Could be dependency-chain cascade, background `userData.init` prefetch, or hybrid. Research-phase instruments cold-start network on representative tests to nail down the surface BEFORE planner picks the mechanism.

---

## Phase 84: DETERM-08 ↔ DETERM-09 ordering

| Option | Description | Selected |
|--------|-------------|----------|
| DETERM-09 as fallback | Land DETERM-08 structural first. Re-measure via 1-run smoke. Only escalate to DETERM-09 (config tuning) if DATA_RACE still > 3. Aligns with REQUIREMENTS.md DETERM-09 phrasing ('parallel lever, not substitute') + Phase 83 cheapest-first. | ✓ |
| Parallel in single plan | Land DETERM-08 + DETERM-09 atomically. Maximal coverage; slight over-engineering risk. | |
| DETERM-09 first | Try config-knob tune first (cheap, no frontend changes). Only land DETERM-08 if pool > 3 after tune. | |

**User's choice:** DETERM-09 as fallback (Recommended)
**Notes:** Carries forward Phase 83 D-01 cheapest-first ladder ethos. Structural fix is the durable answer per `project_all_green_suite_priority.md` memory ("the structural decoupling is the more durable fix"). Config tuning is a fallback if structural alone doesn't reach pool ≤ 3.

---

## Phase 85: Variant-Project Cascade RCA structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single-RCA-then-N-fix-plans | Plan 01 = RCA: instrument all 3 hypotheses (yarn-arg-forwarding / overlay-ordering / shared bootstrap), commit RCA-FINDINGS.md. Plans 02..N = targeted fixes per cluster. Mirrors Phase 79 P01→P02 pattern. | ✓ |
| Single mega-plan | One plan with RCA + fixes inline. Faster but mixes diagnostic + remedial commits. | |
| Per-hypothesis split plans | Plan 01 H1 → fix in 02; Plan 03 H2 → fix in 04; etc. Conservative; high overhead if shared cause found early. | |

**User's choice:** Single-RCA-then-N-fix-plans (Recommended)
**Notes:** Honors operator's "diagnose once before splitting per-variant" preference (per `project_all_green_suite_priority.md` memory). Plan 02..N count decided at Plan 01 close based on RCA verdict; planner escalates to discuss-phase reopen if RCA finds N truly-independent causes (unlikely but possible).

---

## Phase 86: Voter-App FAILURE-CLASS plan cluster structure

| Option | Description | Selected |
|--------|-------------|----------|
| 3 plans by surface cluster | Plan 01 = popups+hydration + navigation+redirects; Plan 02 = filter+feedback + (optional) question-rendering; Plan 03 = visibility+edge-cases + (optional) question-rendering. Acceptance: fix OR test.skip()+rationale per-test. | ✓ |
| 5 plans, one per cluster | Tighter scope, more overhead, easier rollback. | |
| Single mega-plan with N tasks | Lowest overhead; harder if any cluster blows up. | |

**User's choice:** 3 plans by surface cluster (Recommended)
**Notes:** Roadmap's 3-plan hint matches operator's per-cluster RCA preference (per `project_all_green_suite_priority.md` memory). `voter-question-rendering boolean + categorical (QSPEC-01/02)` straddles Plan 02 / Plan 03 boundary; planner picks at PLAN.md time (RECOMMENDATION: Plan 03 since QSPEC-01/02 is i18n-render-path closer to "edge-case" semantics).

---

## Claude's Discretion

Areas deferred to research / planner / executor agents:

### Phase 84
- Research agent picks instrumentation tooling (Playwright `page.on('request')` recommended).
- Research agent decides sample size (instrument all 11 vs 3 representative).
- Planner picks the precise mechanism per D-02 branch (query param / settings flag / lazy-load) based on RCA verdict.
- Planner picks plan count (1 vs 2).
- Planner picks `?skipImages=1` consumption shape if D-02 lands there.
- Planner picks DETERM-09 numeric values if escalation triggers.

### Phase 85
- RCA agent picks instrumentation per hypothesis.
- Plans 02..N count + scope per RCA verdict (RECOMMENDATION: fewer plans if shared cause).
- Atomic-commit folding of regen-constants.mjs CASCADE_BASELINE_TESTS update (RECOMMENDATION: atomic per Phase 79 D-10).
- Whether to add per-variant retry (RECOMMENDATION: avoid; fix cause not symptom).

### Phase 86
- `voter-question-rendering` cluster assignment (Plan 02 vs Plan 03; RECOMMENDATION: Plan 03).
- Per-test fix-vs-skip threshold (RECOMMENDATION: 1h investigation cap before skip-escalation).
- Atomic-commit shape for FAILURE-CLASS narrative block updates.
- Whether to introduce `SKIPPED_TESTS` const (RECOMMENDATION: introduce if ≥ 2 skips land).
- Inline RCA depth per cluster (1-3 hypotheses).

### Phase 87
- 3-run gate invocation scope (full-suite vs scoped; RECOMMENDATION: full-suite).
- In-place edit vs fork of `regen-constants.mjs` (RECOMMENDATION: in-place).
- Audit-milestone invocation timing (RECOMMENDATION: after regen commit).
- SUMMARY writing style (RECOMMENDATION: comprehensive).

---

## Deferred Ideas

Captured for future v2.11+ phases (full text in each phase's `<deferred>` section):

### Phase 84
- Avatar IntersectionObserver lazy-load as prod-relevant perf feature (v2.11+).
- Imgproxy upstream tuning beyond 4 documented knobs (v2.11+).
- Project-wide dependency-chain audit (v2.11+).
- DATA_RACE pool semantic re-examination (v2.11+).

### Phase 85
- Variant project structural refactor (v2.11+).
- Adding new variant projects (v2.11+).
- Playwright `retries: N` policy revisit (v2.11+).

### Phase 86
- SETTINGS-02 / SETTINGS-03 voter-side PRODUCT-GAPs (already v2.11+ per STATE.md).
- Constituency filter UI PRODUCT-GAP (already v2.11+).
- Project-wide voter-app assertion hardening sweep (v2.11+).
- Voter-app `effect_update_depth_exceeded` hardening (v2.11+).

### Phase 87
- v2.11 milestone planning (follow-up after Phase 87 close).
- Parity-script architectural refactor (v2.11+).
- Cold-start determinism tooling improvements (v2.11+).
- `SKIPPED_TESTS` const promotion + restructure (v2.11+).

---

## Discussion Mode

- `--chain` mode (interactive discuss, then auto-advance to plan → execute).
- Batched across 4 phases per operator directive 2026-05-13: "discuss all next phases together and then auto chain research, planning and execution for all".
- 4 strategy questions presented in a single AskUserQuestion batch (one per phase), all answered with the Recommended option. Remaining sub-decisions deferred to research/planner per the captured strategies.
- One initial question was REJECTED by the operator before the batched directive was given — that question was per-phase-mechanism-specific (gating choice for Phase 84 alone), which the operator's preference re-routed to scout-first. The rejected question's content is reflected in Phase 84 D-01 / D-02 as the deferred mechanism choice.

---

*Discussion log generated: 2026-05-13*
