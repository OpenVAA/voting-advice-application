# Phase 85: Variant-Project Cascade RCA & Fix - Context

**Gathered:** 2026-05-13 (batched with Phase 84, 86, 87 per `feedback_batch_discussions.md` operator preference)
**Status:** Ready for planning (after Phase 84 close — Phase 85 measures against the post-Phase-84 anchor)

<domain>
## Phase Boundary

Diagnose and close the 47 CASCADE entries spread across 9 `data-setup-*` projects (1e-Nc, allowopen, constituency, hidden-required, low-minimum-answers, multi-election, Ne-Nc, results-sections, startfromcg) and their 9 paired `variant-*` spec projects. After Phase 85, all 9 variant data-setup chains run to completion in cold-start and their dependent variant-spec projects either pass or surface deterministic failures addressable by Phase 86's voter-FAILURE-CLASS path. CASCADE pool shrinks 47 → 0 (or near 0; residual entries documented as explicit v2.11+ deferrals with rationale).

5 success criteria across a TBD plan count (planner refines after RCA):

1. **DETERM-10 — RCA committed.** Plan 01 is the RCA: instrument the 3 working hypotheses (yarn-arg-forwarding LANDMINE-9 propagation through nested project dependencies, fixture-overlay-ordering races in the variant-data-setup chain, shared bootstrap state contamination) and commit `85-RCA-FINDINGS.md` with diagnostic evidence (per-project run logs + convergent failure pattern). The 9 cascades likely share a single root cause; Phase 85 RCA proves this (or disproves it and identifies the cluster boundaries).

2. **DETERM-11 — targeted fix(es) implemented.** Plans 02..N (count decided after RCA, planner refines) implement the targeted fix per RCA-FINDINGS verdict. All 9 `data-setup-*` projects run to completion in cold-start mode; the 47 CASCADE pool entries shrink to ≤ 5 (residual entries documented as v2.11+ deferrals if any remain).

3. **Variant spec verdict surfacing.** Variant spec projects (downstream of data-setup) surface their own deterministic verdicts post-fix: pass / fail. Any new deterministic failures join the DETERM-12/13/14 FAILURE-CLASS cohort for Phase 86 attention; Phase 85 does NOT pre-resolve those.

4. **Fresh 3-run cold-start gate, SHA-identical on first attempt.** Post-fix capture via the (Phase-84-renegotiated) archived `regen-constants.mjs`. New anchor reflects the CASCADE shrinkage.

5. **No new DATA_RACE entries.** Per Phase 73 D-09 binding (renegotiated in Phase 84 to 3 imgproxy-intrinsic titles): Phase 85's fixes MUST NOT add any test to DATA_RACE. If a variant test surfaces post-fix as imgproxy-tied (e.g., the variant data-setup also goes through imgproxy paths), it remains classified per Phase 84's structural binding, not added to DATA_RACE.

**Out of scope (deferred to Phase 86+):**
- Voter-app FAILURE-CLASS deterministic fails (~10 tests across popups + hydration + filter + visibility + question-rendering + navigation) — Phase 86.
- Final v2.10-ship anchor + audit-milestone — Phase 87.
- Phase 84's imgproxy decoupling (precondition; assumed COMPLETE).
- Variant-project ARCHITECTURAL refactor (the 9-project structure stays; only the cascade root cause is fixed).
- New variant projects (Phase 85 closes the 9 existing; new variants belong in their own milestone).

Phase 85 is parallel-eligible with Phase 86 after Phase 84 lands.

</domain>

<decisions>
## Implementation Decisions

### Plan structure: single-RCA-then-N-fix-plans

- **D-01 — Plan 01 = RCA with `85-RCA-FINDINGS.md` deliverable.** Mirrors Phase 79 P01 → P02 RCA-then-fix pattern. Plan 01 instruments all 3 hypotheses against the same baseline (Phase 84 close anchor), commits diagnostic evidence (per-project run logs + per-test failure trace + the convergent failure pattern), and produces `85-RCA-FINDINGS.md` as the binding input for Plans 02..N.

- **D-02 — Plans 02..N = targeted fix per cause cluster.** Plan count decided AT PLAN 01 CLOSE based on RCA verdict:
  - If ONE shared root cause (most likely): Plan 02 = single fix covering all 9 chains + 3-run gate.
  - If TWO clusters (e.g., data-setup-* shared cause + variant-* shared cause): Plan 02 = data-setup fixes, Plan 03 = variant-* fixes + 3-run gate.
  - If N per-variant fixes (unlikely but possible if RCA finds no shared cause): one plan per variant — but this contradicts the user's intent to "diagnose once before splitting"; if RCA finds N independent causes, escalate to discuss-phase re-open for plan-structure renegotiation.

- **D-03 — Hypothesis instrumentation priority (Plan 01).** Order in RCA instrumentation:
  1. **H1: yarn-arg-forwarding LANDMINE-9 propagation through nested project dependencies.** Verify the variant data-setup commands forward `--likert-only` / `--external-id-prefix` / other args through `yarn db:seed --template` correctly. LANDMINE-9 documents that `yarn db:reset-with-data --likert-only` does NOT forward; check if similar shape applies to variant-data-setup paths.
  2. **H2: fixture-overlay-ordering races in the variant-data-setup chain.** The variant setups (`variant-allowopen.setup.ts`, `variant-hidden-required.setup.ts`, etc.) load fixtures that overlay the base e2e template. Verify the overlay-merge order is deterministic across re-runs.
  3. **H3: shared bootstrap state contamination.** The 9 data-setup-* projects all run `data-setup → variant-data-setup` in cold-start. Verify there's no shared state (e.g., dev-seed module-scope cache, Supabase auth.users table leakage between variant setups) that contaminates across runs.

  Plan 01 instruments H1 first (cheapest — pure CLI inspection); escalates to H2/H3 if H1 doesn't fully explain the pattern. RCA agent runs all 3 in same plan if needed.

- **D-04 — RCA agent invocation.** The research agent (gsd-phase-researcher) is spawned by Plan 01's plan body (NOT by discuss-phase). The agent receives `85-CONTEXT.md` + Phase 84 close artifacts + the 3 hypotheses as instrumentation targets. RCA deliverable: `85-RCA-FINDINGS.md` committed inside Phase 85 dir.

### Verification gate (mirrors Phase 84 D-05)

- **D-05 — Fresh 3-run cold-start gate via Phase-84-updated archived `regen-constants.mjs`.** Phase 85 MAY need to update CASCADE_BASELINE_TESTS array in `regen-constants.mjs` if the cascade pool shrinks (the array is read at classification time). Planner picks edit shape at Plan 02+ time. The match-count assertion for IMGPROXY_TIED_TITLES (Phase 84's binding) stays intact.

- **D-06 — Anchor expectation (planner verifies post-gate).** Expected post-Phase-85 anchor: ~150 PASS_LOCKED (~106 Phase 84 + ~44 net from 9 data-setup + 9 variant-spec promotions) + 3 DATA_RACE + ≤5 CASCADE. The Phase 84 anchor is ABSORBED by this regen.

- **D-07 — Gate execution: agent-inline via Bash run_in_background.** Per Phase 79 D-11 + Phase 83 D-10 + Phase 84 D-08 precedent. ~162 min unattended.

### Anti-pattern guards

- **D-08 — DETERM-10 must not pre-resolve voter-FAILURE-CLASS items.** If RCA reveals that fixing the data-setup cascade ALSO surfaces voter-app deterministic failures, those failures are routed to Phase 86 (DETERM-12/13/14), NOT pre-fixed in Phase 85. Phase 85 scope stays tight on the cascade root cause.

- **D-09 — Per Phase 73 D-09 binding (renegotiated by Phase 84): DATA_RACE pool MUST NOT grow.** Any post-Phase-85 imgproxy-tied surface stays imgproxy-tied per the Phase-84-renegotiated list; new tests do not promote into DATA_RACE.

### Claude's Discretion

- RCA agent picks the precise instrumentation method per hypothesis (CLI tracing for H1, log-injection for H2, fixture-snapshot-diff for H3).
- Plan 01's RCA agent invocation parameters (which spec subset to instrument, how many cold-start captures, etc.) — planner picks at PLAN.md time.
- Plans 02..N count + scope per RCA verdict. RECOMMENDATION: prefer fewer plans if the root cause is shared; split only if causes are genuinely distinct.
- Whether to fold the `regen-constants.mjs` CASCADE_BASELINE_TESTS update into the fix commit (atomic) or split (RECOMMENDATION: atomic per Phase 79 D-10 + Phase 84 D-06).
- Whether to add a per-variant retry mechanism (e.g., Playwright `retries: 1` for variant-data-setup) as a belt-and-suspenders measure if the root cause is partially flaky. RECOMMENDATION: avoid retries; fix the cause, not the symptom.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap + REQUIREMENTS

- `.planning/ROADMAP.md` §"Phase 85: Variant-Project Cascade RCA & Fix" — 5 success criteria, Phase 84 prerequisite.
- `.planning/REQUIREMENTS.md` — DETERM-10, DETERM-11 (Phase 85 REQs).

### Phase 84 (immediate predecessor)

- `.planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/84-CONTEXT.md` — Phase 84 decisions (Phase 85 measures against the post-Phase-84 anchor).
- `.planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/84-VERIFICATION.md` (when written) — Phase 84 close anchor; binding gate for Phase 85.

### Phase 79 archived regen-constants.mjs (Phase 85 may update CASCADE_BASELINE_TESTS)

- `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` — IMGPROXY_TIED_TITLES (Phase 84-renegotiated) + CASCADE_BASELINE_TESTS (Phase 85 may update). Phase 85's match-count assertion gate stays intact.

### Variant test surfaces (Plan 01 RCA instrumentation targets)

- `tests/tests/setup/variant-1e-Nc.setup.ts` — data-setup-1e-Nc project entry.
- `tests/tests/setup/variant-Ne-Nc.setup.ts` — data-setup-Ne-Nc project entry.
- `tests/tests/setup/variant-allowopen.setup.ts` — data-setup-allowopen project entry.
- `tests/tests/setup/variant-constituency.setup.ts` — data-setup-constituency project entry.
- `tests/tests/setup/variant-hidden-required.setup.ts` — data-setup-hidden-required project entry.
- `tests/tests/setup/variant-low-minimum-answers.setup.ts` — data-setup-low-minimum-answers project entry.
- `tests/tests/setup/variant-multi-election.setup.ts` — data-setup-multi-election project entry.
- `tests/tests/setup/variant-results-sections.setup.ts` — data-setup-results-sections project entry.
- `tests/tests/setup/variant-startfromcg.setup.ts` — data-setup-startfromcg project entry.
- `tests/playwright.config.ts` or equivalent — variant project dependency-graph definitions.
- `packages/dev-seed/src/templates/e2e.ts` + variant template overlays — base + overlay structure for H2 instrumentation.

### LANDMINE-9 yarn-arg-forwarding (H1 instrumentation reference)

- `CLAUDE.md` §"Seeding local data" — `Yarn arg-forwarding caveat: yarn db:reset-with-data --likert-only does NOT forward through the &&-chain`. Phase 85 H1 audits whether similar patterns affect variant-data-setup.

### Project conventions

- `CLAUDE.md` §"Common Workflows" — canonical Likert-only-reset chain.
- `.agents/code-review-checklist.md` — code review checklist applies to all Phase 85 changes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Phase 79 archived `regen-constants.mjs`** (Phase 83 + 84 used this) — Phase 85's verification gate mechanism. CASCADE_BASELINE_TESTS const may shrink.
- **Phase 79 P01 → P02 RCA-then-fix pattern** — single-plan-RCA + targeted-fix-plans precedent; Phase 85 D-01 mirrors this.
- **Phase 79 D-09 instability protocol** — re-run + investigate flake before regen against non-stable baseline.
- **Phase 84's RCA-FINDINGS.md pattern** (if Phase 84 followed D-01 scout-then-decide) — Phase 85 mirrors the in-phase-dir RCA artifact placement.

### Established Patterns

- **`feedback_batch_discussions.md` memory** — Phase 85 was discussed in batch with Phase 84/86/87 to keep planning/execution autonomously contiguous.
- **Phase 73 D-09 IMGPROXY_TIED_TITLES structural binding** (renegotiated by Phase 84) — DATA_RACE pool MUST NOT grow.
- **Atomic-commit-per-task pattern** (Phase 79 D-10 + Phase 83 + Phase 84 precedent).

### Integration Points

- **Variant project dependency graph:** `data-setup → variant-data-setup-X → variant-X` (per Playwright config). If H1 (yarn-arg-forwarding) is the cause, the fix lands in the setup CLI invocation. If H2 (overlay-ordering) is the cause, the fix lands in `packages/dev-seed/`. If H3 (shared state), the fix lands in the variant-setup teardown logic.
- **Phase 84 anchor binding:** Phase 85 measures DATA_RACE pool size against Phase 84's post-fix anchor (expected 3); any drift triggers Phase 79 D-09 instability protocol.

</code_context>

<specifics>
## Specific Ideas

- **Operator's All-Green Suite directive** (per `project_all_green_suite_priority.md` memory): get ALL e2e tests passing — CASCADE pool 47 → 0 is one of the 3 pillars (alongside DATA_RACE 15 → 3 in Phase 84 and FAILURE-CLASS ~10 → 0 in Phase 86).

- **Operator-confirmed single-RCA-then-N-fix-plans structure** (this discuss-phase, 2026-05-13): mirrors Phase 79 P01 → P02 pattern; do diagnostic work in a dedicated plan, then targeted fixes. Avoids both the mega-plan anti-pattern (mixes diagnostic + remedial commits) and the per-hypothesis-split anti-pattern (high overhead if shared cause is found early).

- **Operator's "diagnose once before splitting per-variant" preference** (per `project_all_green_suite_priority.md` memory): Phase 85 D-02 explicitly avoids N-per-variant plans unless RCA reveals N truly independent causes.

</specifics>

<deferred>
## Deferred Ideas

- **Variant project structural refactor** — if RCA reveals that the 9-variant-project graph is itself the cause (e.g., transitive flakiness from the dependency graph shape), a v2.11+ project could refactor the variant projects into a flatter structure. Out of v2.10 scope.

- **Adding new variant projects** — out of v2.10 scope. Phase 85 closes the 9 existing variants; any new variants belong in their own milestone.

- **Playwright `retries: N` policy across the suite** — if Phase 85 RCA reveals genuinely-irreducible cold-start flake, a v2.11+ project could revisit the retry policy. Currently retries are 0 per cold-start determinism contract. Out of v2.10 scope.

### Reviewed Todos (not folded)

None — no open todos in `.planning/todos/pending/` are topically relevant to variant-project cascade RCA. Phase 85 inputs come from ROADMAP.md + REQUIREMENTS.md + the `project_all_green_suite_priority.md` memory.

</deferred>

---

*Phase: 85-Variant-Project-Cascade-RCA-Fix*
*Context gathered: 2026-05-13 (batched)*
