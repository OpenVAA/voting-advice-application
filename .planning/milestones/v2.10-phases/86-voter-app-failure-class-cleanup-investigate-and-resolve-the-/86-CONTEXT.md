# Phase 86: Voter-App FAILURE-CLASS Cleanup - Context

**Gathered:** 2026-05-13 (batched with Phase 84, 85, 87 per `feedback_batch_discussions.md` operator preference)
**Status:** Ready for planning (parallel-eligible with Phase 85 after Phase 84 close)

<domain>
## Phase Boundary

Investigate and resolve the ~10 deterministic voter-app failures currently in the FAILURE-CLASS narrative block at `tests/scripts/diff-playwright-reports.ts:87-101`. After Phase 86, all FAILURE-CLASS items are deterministically passing OR explicitly demoted via `test.skip()` with rationale OR documented as v2.11+ product-decision deferrals. FAILURE-CLASS pool shrinks from ~10 → 0 (or ≤2 with explicit v2.11+ deferrals).

5 success criteria across 3 plans (one per surface cluster, planner refines exact test allocation):

1. **DETERM-12 — popups + hydration + navigation cluster (~4 tests).** Plan 01 covers:
   - `voter-app-popups dismissal-after-reload`
   - `voter-popup-hydration full-page-load`
   - `voter-navigation results-CTA threshold`
   - `voter-not-located-redirect /results deeplink`
   Each test: deterministically passes (fix the underlying race/bug) OR `test.skip()` with rationale comment + v2.11+ follow-up todo.

2. **DETERM-13 — filter + feedback cluster (~3 tests).** Plan 02 covers:
   - `voter-results filter-toggle no-effect-update-depth`
   - `voter-feedback-persistence`
   - (Planner may include `voter-question-rendering boolean + categorical` (QSPEC-01/02) here if the cluster boundary fits; otherwise routes to Plan 03.)
   Same acceptance: fix OR `test.skip()`+rationale.

3. **DETERM-14 — visibility + edge-cases + question-rendering cluster (~3 tests).** Plan 03 covers:
   - `voter-visibility-required SETTINGS-03 hidden absent`
   - `voter-detail case-d both-missing`
   - `voter-question-rendering boolean + categorical (QSPEC-01/02)` (or assigned to Plan 02 per cluster boundary — planner picks).
   Same acceptance: fix OR `test.skip()`+rationale.

4. **FAILURE-CLASS narrative block shrinks ≤ 2 entries.** Residual entries are explicit v2.11+ deferrals only; the structural "FAILURE-CLASS" classification block at `diff-playwright-reports.ts:87-101` is updated to reflect the post-Phase-86 reality.

5. **Fresh 3-run cold-start gate, SHA-identical on first attempt.** New anchor reflects ~+10 net PASS_LOCKED (best case) or ~+8 (if 2 tests are skipped). Phase 85 anchor is ABSORBED by this regen.

**Out of scope (Phase 86 boundary):**
- Phase 87's final v2.10-ship anchor (Phase 86 produces the intermediate anchor; Phase 87 produces the final).
- Phase 85's variant-cascade fixes (parallel-eligible; Phase 85 runs in parallel and Phase 86 measures against the post-Phase-85 OR post-Phase-84 anchor, whichever lands first).
- New voter-app features or UI changes (Phase 86 is bug-fix / skip-decision only).
- Hardening the assertion patterns across the rest of the voter-app + candidate-app specs (Phase 83 deferred this; Phase 86 only addresses the 10 known FAILURE-CLASS surfaces).

Phase 86 is parallel-eligible with Phase 85.

</domain>

<decisions>
## Implementation Decisions

### Plan structure: 3 plans by surface cluster

- **D-01 — Plan count: 3.** Plans aligned to roadmap's cluster grouping:
  - Plan 01 = popups + hydration + navigation/redirects (~4 tests).
  - Plan 02 = filter + feedback + (optional) question-rendering (~3 tests).
  - Plan 03 = visibility + edge-cases + (optional) question-rendering (~3 tests).
  Planner finalizes exact test allocation when reading Plan boundaries — `voter-question-rendering` straddles Plan 02 / Plan 03 cluster boundaries; planner picks based on RCA proximity.

- **D-02 — Per-cluster RCA approach.** Each plan starts with a brief RCA section (NOT a separate plan — inline in the PLAN.md body):
  - For Plan 01 (popups + hydration + navigation): hypothesis-driven instrumentation focused on hydration timing + navigation state propagation. Mirrors Phase 83 D-02 hydration-completeness-race lens.
  - For Plan 02 (filter + feedback): hypothesis-driven instrumentation focused on Svelte 5 reactivity + state-update-depth. Filter-toggle no-effect-update-depth is a likely effect_update_depth_exceeded; needs `untrack()` or similar guard per CLAUDE.md context-destructuring rule patterns.
  - For Plan 03 (visibility + edge-cases + question-rendering): per-test investigation; failures may have heterogeneous causes (QSPEC-01/02 is i18n-rendering, SETTINGS-03-hidden is variant overlay, case-d-both-missing is data-model edge-case).

- **D-03 — Acceptance per test: fix-preferred, skip-acceptable-with-rationale.** Per roadmap SC #1-3 phrasing: "Each test either deterministically passes OR is `test.skip()`+rationale'd". Planner's per-test decision:
  - **Default: attempt fix.** Spend up to ~1h investigating each failure with the cluster's RCA lens.
  - **Escalation: skip+rationale.** If fix exceeds ~1h investigation budget OR requires product-decision work outside Phase 86 scope (e.g., voter-side `customData.required` enforcement requires SETTINGS-03 PRODUCT-GAP work that's re-deferred to v2.11+ per STATE.md), apply `test.skip()` with explicit rationale comment + create a v2.11+ follow-up todo at `.planning/todos/pending/`.
  - **Documentation: every skip MUST have:**
    1. Inline `test.skip()` with `test.skip(true, '<concise reason>')` shape.
    2. Block comment above explaining the rationale (mirrors Phase 75 QSPEC-01/02 precedent).
    3. New todo file at `.planning/todos/pending/2026-MM-DD-<short-name>.md` filed for v2.11+ work.

- **D-04 — `voter-question-rendering boolean + categorical (QSPEC-01/02)` cluster assignment.** The roadmap groups this under "question-rendering" as its own category (3 of 5 clusters per goal). Phase 86's 3-plan structure folds it into Plan 02 OR Plan 03 by planner's read of which cluster's RCA lens fits better. **RECOMMENDATION: Plan 03** (visibility + edge-cases) since QSPEC-01/02 is i18n-render-path which is closer to "edge-case" semantics than to "filter + feedback".

### Verification gate (mirrors Phase 84/85)

- **D-05 — Fresh 3-run cold-start gate via Phase-84-updated archived `regen-constants.mjs`.** Phase 86 will move tests OUT of the FAILURE-CLASS narrative block AND into PASS_LOCKED_TESTS (per fix) OR into a new SKIPPED section in `diff-playwright-reports.ts` (per skip). Planner picks the SKIPPED-array shape if multiple skips land (e.g., new `SKIPPED_TESTS` const alongside PASS_LOCKED / DATA_RACE / CASCADE).

- **D-06 — Anchor expectation (planner verifies post-gate).** Expected post-Phase-86 anchor: ~155-160 PASS_LOCKED (Phase 85 ~150 + 8-10 net) + 3 DATA_RACE + ≤ 5 CASCADE + ≤ 2 FAILURE-CLASS (residual deferrals only). Phase 85 anchor is ABSORBED.

- **D-07 — Gate execution: agent-inline via Bash run_in_background.** Per Phase 79/83/84/85 precedent. ~162 min unattended.

### Anti-pattern guards

- **D-08 — DETERM-12/13/14 must not pre-resolve out-of-scope product gaps.** SETTINGS-02/03 voter-side product gaps are re-deferred to v2.11+ per STATE.md "Deferred Items". If Phase 86 RCA reveals that fixing `voter-visibility-required SETTINGS-03 hidden absent` requires the SETTINGS-03 PRODUCT-GAP fix, the test is skipped+rationale'd, NOT pre-fixed.

- **D-09 — Per Phase 73 D-09 binding (renegotiated by Phase 84): DATA_RACE pool MUST NOT grow.** Phase 86 fixes don't add anything to DATA_RACE.

- **D-10 — Per Phase 73 CASCADE_BASELINE_TESTS contract: a Phase 86 fix should not regress a CASCADE entry.** If a Phase 86 fix would accidentally unblock a CASCADE entry, that's a PASS_LOCKED promotion (cascade-unblock), not a CASCADE regression — verified via 3-run gate.

### Claude's Discretion

- Planner finalizes the cluster boundary for `voter-question-rendering` (Plan 02 vs Plan 03). RECOMMENDATION: Plan 03.
- Per-test fix-vs-skip decision (during Plan execution). Planner picks the time budget threshold (RECOMMENDATION: 1h investigation cap before skip-escalation).
- Whether to fold the FAILURE-CLASS narrative block update into the per-plan commit (atomic per cluster) or into the constants regen commit (single atomic across all 3 plans). RECOMMENDATION: atomic-per-plan for the narrative-block update (1 commit per cluster); constants regen is the single atomic close commit.
- Whether to introduce a new `SKIPPED_TESTS` const in `diff-playwright-reports.ts` for tracked deferrals (vs an inline FAILURE-CLASS narrative comment block). RECOMMENDATION: introduce the const if ≥ 2 skips land; otherwise keep inline narrative.
- Inline RCA depth per cluster (1-3 hypotheses per cluster); planner picks per the cluster's known surface complexity.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap + REQUIREMENTS

- `.planning/ROADMAP.md` §"Phase 86: Voter-App FAILURE-CLASS Cleanup" — 5 success criteria.
- `.planning/REQUIREMENTS.md` — DETERM-12, DETERM-13, DETERM-14 (Phase 86 REQs).

### FAILURE-CLASS narrative block (Phase 86 update target)

- `tests/scripts/diff-playwright-reports.ts:87-101` — current FAILURE-CLASS narrative block. Phase 86 strikes per-test references on resolution + updates the block to reflect post-Phase-86 reality.

### Phase 85 (parallel-eligible predecessor)

- `.planning/phases/85-variant-project-cascade-rca-fix-investigate-and-close-the-47/85-CONTEXT.md` — Phase 85 decisions (Phase 86 measures against the later of Phase 84 / Phase 85 anchor).

### Phase 84 (predecessor — anchor binding)

- `.planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/84-VERIFICATION.md` (when written) — Phase 84 close anchor (3 DATA_RACE post-renegotiation).

### Voter-app test surfaces (Plan 01-03 targets)

- `tests/tests/specs/voter/voter-popups.spec.ts` — popup dismissal-after-reload (Plan 01 target).
- `tests/tests/specs/voter/voter-popup-hydration.spec.ts` — full-page-load hydration (Plan 01 target).
- `tests/tests/specs/voter/voter-navigation.spec.ts` — results-CTA threshold (Plan 01 target).
- `tests/tests/specs/voter/voter-not-located-redirect.spec.ts` — `/results` deeplink (Plan 01 target).
- `tests/tests/specs/voter/voter-results.spec.ts` — filter-toggle no-effect-update-depth (Plan 02 target).
- `tests/tests/specs/voter/voter-feedback-persistence.spec.ts` — voter-feedback-persistence (Plan 02 target).
- `tests/tests/specs/voter/voter-question-rendering.spec.ts` — boolean + categorical / QSPEC-01/02 (Plan 02 OR Plan 03; recommended Plan 03).
- `tests/tests/specs/voter/voter-visibility-required.spec.ts` — SETTINGS-03 hidden absent (Plan 03 target; may escalate to skip+rationale if SETTINGS-03 PRODUCT-GAP blocks fix).
- `tests/tests/specs/voter/voter-detail.spec.ts` — case (d) both-missing (Plan 03 target).

### Phase 75 QSPEC-01/02 precedent (skip+rationale pattern)

- `.planning/milestones/v2.9-phases/75-question-rendering-specs/75-VERIFICATION.md` §"FAILURE-CLASS rationale" — original QSPEC-01/02 demotion + rationale comment shape. Phase 86 D-03 follows this precedent for any skip-escalation.

### Phase 79 archived regen-constants.mjs (Phase 86 may update FAILURE-CLASS / SKIPPED arrays)

- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` — Phase 84-renegotiated IMGPROXY_TIED_TITLES + CASCADE_BASELINE_TESTS. Phase 86 may add a SKIPPED_TESTS classification or update the FAILURE-CLASS narrative.

### Project conventions

- `CLAUDE.md` §"Common Workflows" — canonical Likert-only-reset chain.
- `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — applies if Plan 02's `effect_update_depth_exceeded` filter-toggle fix touches reactive accessor consumption.
- `.agents/code-review-checklist.md` — code review checklist applies to all Phase 86 changes.
- STATE.md "Deferred Items" — SETTINGS-02 + SETTINGS-03 voter-side PRODUCT-GAPs are v2.11+; Phase 86 skip-escalates if blocked by these.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Phase 75 QSPEC-01/02 skip+rationale pattern** — Phase 86's skip-escalation shape inherits this.
- **Phase 83 D-02 hydration-completeness-race lens** — Plan 01 (popups + hydration) applies this directly.
- **Phase 79 archived regen-constants.mjs** — Phase 86's verification gate mechanism.

### Established Patterns

- **`feedback_batch_discussions.md` memory** — batched discussion with Phase 84/85/87.
- **Atomic-commit-per-plan pattern** (Phase 79 D-10 + Phase 83/84/85 precedent).
- **Phase 73 D-09 IMGPROXY_TIED_TITLES structural binding** (renegotiated by Phase 84) — DATA_RACE pool MUST NOT grow.

### Integration Points

- **Phase 84/85 anchor binding:** Phase 86 measures against the LATER of Phase 84 / Phase 85 anchors. Parallel-execution implication: if Phase 85 hasn't completed when Phase 86 starts, planner measures against Phase 84's anchor and adjusts at the 3-run gate.
- **Phase 87 entry condition:** Phase 87's milestone-close anchor depends on Phase 86 complete. Plan 03's close + 3-run gate IS the Phase 87 entry-condition baseline (or Phase 87 itself re-runs the gate).

</code_context>

<specifics>
## Specific Ideas

- **Operator's All-Green Suite directive** (per `project_all_green_suite_priority.md` memory): get ALL e2e tests passing — FAILURE-CLASS ~10 → 0 is one of the 3 pillars (alongside Phase 84's DATA_RACE 15 → 3 and Phase 85's CASCADE 47 → 0).

- **Operator's per-cluster-RCA approach** (per `project_all_green_suite_priority.md` memory): "each [FAILURE-CLASS cluster] needs per-cluster RCA — probably 2-3 phases grouping by feature surface". Phase 86 D-01 lands the 3-plan structure (one per cluster), with inline RCA per plan.

- **Operator-confirmed fix-preferred-skip-acceptable acceptance bar** (this discuss-phase batched: fix is the default, skip+rationale is the fallback when fix exceeds budget or is blocked by out-of-scope product work).

- **Operator's `feedback_e2e_did_not_run` memory**: "did not run" E2E tests count as failures. Phase 86 ensures NO test in scope ends up "did not run" — every FAILURE-CLASS item gets a deterministic verdict (pass / fail / skip).

</specifics>

<deferred>
## Deferred Ideas

- **SETTINGS-02 voter-side `answer.info` authoring PRODUCT-GAP** — re-deferred to v2.11+ per STATE.md. If Plan 03's `voter-visibility-required` fix is blocked, the test is skipped+rationale'd and the v2.11+ todo at `.planning/todos/pending/2026-05-12-settings-02-voter-authoring-product-gap.md` is updated to reference Phase 86's skip rationale.

- **SETTINGS-03 voter-side `customData.required` enforcement PRODUCT-GAP** — re-deferred to v2.11+ per STATE.md. Same handling as SETTINGS-02.

- **Constituency filter UI PRODUCT-GAP** — re-deferred to v2.11+ per STATE.md.

- **Project-wide voter-app assertion hardening sweep** — Phase 83 deferred-ideas §"Project-wide hydration-completeness assertion sweep" applies here. Phase 86 may surface that the FAILURE-CLASS items share a single broader pattern; a v2.11+ project could do the project-wide sweep. Out of v2.10 scope.

- **Voter-app `effect_update_depth_exceeded` hardening** — if Plan 02's filter-toggle fix lands an `untrack()` guard, a v2.11+ project could audit the full voter-app for similar patterns. Out of v2.10 scope.

### Reviewed Todos (not folded)

None — no open todos in `.planning/todos/pending/` are scoped-to-Phase-86 work. Phase 86 inputs come from ROADMAP.md + REQUIREMENTS.md + `tests/scripts/diff-playwright-reports.ts:87-101` FAILURE-CLASS narrative + the `project_all_green_suite_priority.md` memory.

</deferred>

---

*Phase: 86-Voter-App-FAILURE-CLASS-Cleanup*
*Context gathered: 2026-05-13 (batched)*
