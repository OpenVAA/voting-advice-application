# Phase 130: E2E Specs — New-Feature Coverage - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning (execute after Phase 129 lands)

<domain>
## Phase Boundary

Author the E2E specs covering the features Phase 129 built: the previously-blocked question-type variants (EQTYP-01/02/03), the alliance flow (EFLOW-02 + the EPERM-03 alliance-presence extension + the EPERM-04 alliance tab-control rider), and the nominations-route assertion (tied to UNBLK-04). **Specs only** — fixtures and seed additions shipped in Phase 129 (119.4 operator override), and the Alliance A seed wiring was verified there (129 D-10), so this phase is assert-only on the data side. Fixtures-first still applies *within* the phase for any new-feature-specific fixture code (e.g. `answerNumberScale`): built, typecheck-clean, and proven by a smoke/probe before specs rely on it.

**Spec paths are pinned** (Phase 118 coverage plan, locked):
- EQTYP-01/02 → EXTEND `voter-journey.spec.ts` + `candidate-journey.spec.ts`.
- EQTYP-03 → flip the multipleText info item from asserted-ABSENT to PRESENT (13→14 items) + candidate round-trip.
- EFLOW-02 + EPERM-03 alliance slice → NEW `voter-alliance.spec.ts` with its own leaf project.
- Nominations → per D-01 below.

**Out of bounds:** Product-code changes (Phase 129), flake triage backlog (Phase 131), the gate flip (Phase 132). The EPERM-03 REQ-ID itself maps to Phase 120 (no double-mapping) — only the alliance-presence sub-assertion lands here as a criterion. The UNBLK-04 REQ-ID maps to Phase 129 — here it is expressed as a new assertion only.

</domain>

<decisions>
## Implementation Decisions

### Nominations coverage shape
- **D-01 — Dedicated `voter-nominations.spec.ts` only.** Clean leaf project (`data-setup-base`, read-only); avoids growing the already-long journey spec. The commented-out journey step referenced a spec that no longer exists (`voter-mega-journey` → renamed/rebuilt as `voter-journey` in 119–122), so "re-enable" is really "re-author" — and it is authored as a dedicated spec, not a journey step.

### EQTYP-01 scope
- **D-02 — Opportunistic tightening accepted.** While adding the new multi-choice assertions, tighten the existing candidate categorical + boolean opinion assertions from generic (choice-select + continue) to type-specific in the same pass — closes the EQTYP-01 NOTE fully at marginal cost.

### Alliance spec scope
- **D-03 — `voter-alliance.spec.ts` covers:** alliance card presence in `results.sections[]` (EPERM-03 sub-assertion), member orgs as clickable in-card children, the member-orgs drawer (EFLOW-02), **and the EPERM-04 alliance tab-control rider** — `entityDetails.tabs` setting honored for alliance drawers (it rides the same fixtures).
- **D-04 — Assert-only on seed:** Alliance A ↔ member-org wiring in `e2e/base` was verified at Phase 129 close (129 D-10); this phase does not re-verify seed rendering, it asserts behavior.

### Determinism gate
- **D-05 — Full suite 3× (operator choice, stronger than the recommended new-specs-only shape).** Roadmap SC5 is satisfied by three full-suite green runs, each with a fresh dev server on :5173 (no Playwright webServer) and a clean DB (`yarn db:reset`) — accepting ~3× the wall-clock for the strongest signal. The E2E cardinal rule applies: any failing or did-not-run test blocks completion.

### Claude's Discretion
- Leaf-project wiring details for `voter-alliance.spec.ts` and `voter-nominations.spec.ts` (mirror the existing perm-spec leaf-project pattern).
- Exact assertion granularity for the number-scale boundary-matching test (voter at min ranks the min-positioned candidate first), built on the `answerNumberScale(question, value)` fixture against the 129 slider's keyboard-arrow contract.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 130 entry (goal + 5 success criteria).
- `.planning/REQUIREMENTS.md` — EQTYP-01, EQTYP-02, EQTYP-03, EFLOW-02.
- `.planning/v2.14-E2E-COVERAGE-PLAN.md` — the approved deferred-build plan (pinned spec paths, EPERM-03/04 riders).
- `.planning/phases/129-new-feature-build-question-inputs-alliance-render-nomination/129-130-DISCUSSION.md` — filled batch discussion doc (source of D-XX decisions).
- `.planning/phases/129-new-feature-build-question-inputs-alliance-render-nomination/129-CONTEXT.md` — the feature-side contract this phase asserts against (esp. D-03 slider keyboard contract, D-05 `question-choice` locator continuity, D-07 min/max UX, D-10 seed verification).

### Specs to extend / create
- `tests/tests/specs/voter/voter-journey.spec.ts` — EQTYP-01/02 voter side (re-baselined in Phase 129).
- `tests/tests/specs/candidate/candidate-journey.spec.ts` — EQTYP-01/02 candidate side + D-02 tightening.
- `tests/tests/specs/voter/` — NEW `voter-alliance.spec.ts` (own leaf project) and NEW `voter-nominations.spec.ts` (`data-setup-base`, read-only).
- EQTYP-03: the info-item assertion currently expecting multipleText ABSENT (13 items) — flip to PRESENT (14) + candidate round-trip.

### Fixtures & infra
- `tests/tests/fixtures/` — Phase 119 base fixtures these extend; `voterQuestionsPage.fixture.ts`, `candidateQuestionPage.fixture.ts` are the primary extension sites (e.g. `answerNumberScale`).
- `tests/tests/utils/testIds.ts` — selector catalogue; new-feature locators were registered in Phase 129.
- Playwright project config (leaf projects) — the perm-spec leaf-project pattern to mirror.

### Gate conventions
- `.planning/phases/128-svelte-check-0-long-tail-tests-docs/128-CONTEXT.md` D-07 — E2E gate prereqs convention (fresh server, clean DB, 502-wedge/orphaned-stack recovery).
- `.agents/code-review-checklist.md` — mandatory per CLAUDE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 119 fixture layer + `question-choice` locator contract (carried over by 129 D-05).
- Existing perm-spec leaf projects — the pattern for `voter-alliance.spec.ts` / `voter-nominations.spec.ts` project wiring.
- Phase 129's re-baselined `voter-journey.spec.ts` — green baseline this phase extends without re-baselining.

### Established Patterns
- **E2E cardinal rule + 3× full-suite determinism gate (D-05).** Fresh dev server on :5173, `yarn db:reset` before each run; "did not run" counts as failure.
- **Fixtures-first within the phase** — new fixture code proven by smoke/probe before specs consume it.
- Semantic-step fixture style (audit→plan→fixtures-first convention from the E2E workstream).

### Integration Points
- The number-scale boundary test depends on the 129 slider's keyboard-arrow exact-value contract (129 D-03) — if the contract changed during 129 execution, read the 129 UI-SPEC/SUMMARY before authoring.
- `voter-alliance.spec.ts` leaf project needs its own settings permutation only if `results.sections[]` alliance presence isn't in the base settings — check what 129's residual-gap fix actually changed.

</code_context>

<specifics>
## Specific Ideas

- EQTYP-03's 13→14 info-item flip is a deliberate assertion inversion — the old asserted-ABSENT expectation documents the pre-129 gap; flipping it is the proof the feature landed.
- D-02 tightening scope: same spec region as the new multi-choice assertions — do not let it sprawl into a general journey-spec refactor.

</specifics>

<deferred>
## Deferred Ideas

- (none captured — Q16 left empty)

</deferred>

---

*Phase: 130-e2e-specs-new-feature-coverage*
*Context gathered: 2026-07-17*
