# Phase 75: Question-Rendering Specs - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 75-question-rendering-specs
**Mode:** `--auto` (single-pass; all gray areas auto-selected; recommended option chosen per question)
**Areas discussed:** Plan grouping, Boolean fixture strategy, Multi-choice handling, Deduplication strategy, Assertion shape, Locator convention, Determinism + parity regen, Vite-cache wipe, Plan ordering

---

## Plan grouping + sequence

| Option | Description | Selected |
|--------|-------------|----------|
| 2 plans (1 per spec); verification gate folded into Plan 02 | Plan 01 = QSPEC-01 boolean + e2e template boolean addition. Plan 02 = QSPEC-02 categorical + verification gate (3-run smoke + parity-script regen). Mirrors STATE.md plan-count estimate (line 156) + ROADMAP estimate (~2 plans). | ✓ |
| 1 bundled plan (both specs) | Economical for plan-count; bundles fixture extension + 2 specs + verification into one plan. Risk: exceeds per-plan ceiling given seed change + 2 specs + 3-run gate. | |
| 3 plans (QSPEC-01 + QSPEC-02 + separate verification gate) | Mirrors Phase 74 P07 verification pattern; over-engineered for 2-spec scope. | |

**Auto-selected:** 2 plans, verification gate folded into Plan 02 — matches STATE.md + ROADMAP estimates; per-plan ceiling not at risk because each plan is small (1 spec + maybe fixture work + ~5-step verification gate).

---

## Boolean question — fixture strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Add to base `e2e` template at sort 18 (mirrors Phase 74 P05 directional pattern) | Add `test-question-boolean-1` to `questions.fixed[]` + new `test-category-boolean` category + Alpha answer cell. required:false to keep `answeredVoterPage` fixture unaffected. | ✓ |
| New variant template `variant-boolean-q` | Extra Playwright project + setup + dependency-chain plumbing for a 1-row diff; over-engineered for the seed-extension scope. | |
| Use the default Finnish demo template (already has a boolean) | Default template's row counts/IDs are faker-driven (not spec-anchored); brittle for spec assertions. Would also require switching the spec's Playwright project. | |

**Auto-selected:** Base e2e template addition at sort 18 — mirrors Phase 74 P05 single-question addition pattern; smallest-possible fixture footprint; required:false placement keeps voter fixture intact.

---

## Multi-choice categorical handling (QSPEC-02 SC #2)

| Option | Description | Selected |
|--------|-------------|----------|
| PASS-WITH-DEFERRAL — single-choice only; multi-choice deferred to follow-up | OpinionQuestionInput.svelte:113 renders `error.unsupportedQuestion` for multi-choice today; the render path doesn't exist. Mirrors Phase 74 D-04 (E2E-01 single-locale) deferral pattern. Captures a `.planning/todos/pending/` entry at phase close. | ✓ |
| Add multi-choice rendering to `OpinionQuestionInput.svelte` | Scope expansion — new capability + matching-algorithm dispatch confirmation + dev-seed answers-emitter extension. Exceeds Phase 75 scope-guardrail. | |
| Skip multi-choice entirely; reinterpret SC #2 as single-choice only | Dishonest re-scoping; PASS-WITH-DEFERRAL is the truthful alternative that captures the gap. | |

**Auto-selected:** PASS-WITH-DEFERRAL — matches Phase 74 D-04 precedent; covers the LARGER part of SC #2 (single-choice rendering, which is the post-Phase 74 P05 surface with no E2E gate today); the deferred multi-choice variant is gated on a missing component branch.

---

## Deduplication strategy (SC #3)

| Option | Description | Selected |
|--------|-------------|----------|
| New spec files at `voter-question-rendering-{boolean,categorical}.spec.ts` + per-plan dedup audit + per-assertion `// dedup:` comments | Spec naming clearly marks scope (rendering ≠ matching); per-plan task adds a dedup audit step grep-walking voter-matching.spec.ts + packages/matching. | ✓ |
| Extend `voter-matching.spec.ts` with new test() blocks | Conflates matching-algorithm contract with render-shape contract; harder to reason about coverage scope. | |
| Extend `voter-questions.spec.ts` (already covers question-flow) | voter-questions.spec.ts is scoped to QUESTIONS-INTRO category-selection surface (per test.describe block), not per-question render shapes. Would dilute spec scope. | |

**Auto-selected:** New spec files with explicit "rendering" suffix + dedup audit at PLAN.md time. Keeps the matching-algorithm contract / render-shape contract split clean.

---

## Assertion shape (4-step contract per spec)

| Option | Description | Selected |
|--------|-------------|----------|
| 4-step contract: (1) input renders correctly; (2) voter answers; (3) answer persists across navigation; (4) entity-detail mirror | Uniform shape per ROADMAP SC #1 + SC #2. Concrete details: boolean = 2 buttons via role; categorical = 3 choice buttons; click → auto-advance OR nextButton → browser-back persists → entity-detail row shows both voter's + Alpha's answer. | ✓ |
| Reduced contract: (1) input renders + (2) voter answers (skip navigation + mirror) | Doesn't satisfy SC #1 / SC #2 (both require "navigates, sees their answer reflected on entity-detail"). | |
| Expanded contract: + cancel/reset state + multi-question sequence | Out of scope — SC bounds the contract to render + flow + entity-detail mirror. | |

**Auto-selected:** 4-step contract as specified by SC #1 + SC #2.

---

## Locator + lint convention

| Option | Description | Selected |
|--------|-------------|----------|
| Role/aria locators by default; `getByTestId` only with inline `// reason:` | Inherits Phase 74 D-11; mandatory per post-Phase-73 `playwright/no-raw-locators` at `'error'`. `data-testid="opinion-question-input"` may be used as a scope wrapper with reason annotation. | ✓ |
| testId-first locators | Violates Phase 74 D-11 convention + post-Phase-73 lint rule. | |
| Mixed without inline justification | Violates Phase 74 D-11 + Phase 73 IN-03 inline-justification rule. | |

**Auto-selected:** Role/aria by default; testId-as-scope-wrapper with `// reason:` only.

---

## Determinism contract + parity-script regen

| Option | Description | Selected |
|--------|-------------|----------|
| Inherits Phase 74 D-09 verbatim: 3-run cold-start `--workers=1` identical; new specs land in PASS_LOCKED; DATA_RACE pool must NOT grow; conditional parity-script constants regen if new tests added to baseline | Same shape as Phase 74. Conditional regen because Phase 75 adds NO new variant projects (D-02 declines that path) — the only trigger is +N new test IDs in the new specs. | ✓ |
| Looser contract (skip 3-run gate; rely on single-run smoke) | Violates Phase 73 + Phase 74 determinism contract — would break the gating invariant. | |
| Stricter contract (require all new specs land in PASS_LOCKED; no exceptions) | Phase 74 D-09 allows per-test rationale for DATA_RACE entries (env-gated, infrastructure flake). Removing that flexibility could over-constrain. | |

**Auto-selected:** Inherits Phase 74 D-09 — conditional regen path is honest given Phase 75's small scope.

---

## Vite-cache wipe + end-of-phase gate

| Option | Description | Selected |
|--------|-------------|----------|
| Imperative `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` before 3-run smoke (Phase 74 D-12 recipe) | Inherits Phase 74 D-12; the durable form (CLEAN-01 `dev:clean` script) is in Phase 78 — Phase 75 uses the imperative recipe directly. | ✓ |
| Skip cache wipe (rely on `yarn dev:reset-with-data`) | v2.8 close gotcha + Phase 73 P06 recipe explicitly require the cache wipe — `yarn dev:reset-with-data` alone leaves stale `.vite` + `.svelte-kit` caches. Skipping breaks 3-run determinism. | |
| Wait for Phase 78 CLEAN-01 `dev:clean` script | Would block Phase 75 on Phase 78 — Phase 75 runs in parallel with 76/77, NOT serial after 78. | |

**Auto-selected:** Imperative recipe — same as Phase 74 D-12.

---

## Plan order + dependency direction

| Option | Description | Selected |
|--------|-------------|----------|
| Plan 01 → Plan 02 strict serial; no parallelization within Phase 75 | Plan 01 modifies dev-seed e2e template (boolean question + category + Alpha answer); Plan 02 categorical spec runs against the post-P01 seed. P02 verification gate exercises BOTH new specs. | ✓ |
| Plan 01 + Plan 02 parallel | Plans share the dev-seed template + verification gate; conflicts on seed edits + gate ordering. Parallelization saves no time and adds merge risk. | |

**Auto-selected:** Strict serial — Plan 01 ships the seed change, Plan 02 the categorical spec + verification.

---

## Claude's Discretion (recorded for downstream planner)

- `walkToQuestion(page, sortOrder)` extraction — planner's call at PLAN.md time. Recommended if both plans use the same navigation walk.
- Whether Plan 01 OR Plan 02 holds the dev-seed e2e template diff — default Plan 01 (because QSPEC-01 needs the boolean question).
- Whether QSPEC-01 + QSPEC-02 share a spec file vs. split — default split per D-04 naming.
- Whether the boolean question reuses `test-category-info` OR adds new `test-category-boolean` — default NEW category (analogous to Phase 74 P05 `test-category-directional`).
- Whether Plan 02 verification produces separate `75-VERIFICATION.md` OR folds into Plan 02 SUMMARY.md — default separate `75-VERIFICATION.md` (project convention; STATE.md references VERIFICATION.md by phase).

---

## Deferred Ideas (carried into CONTEXT.md)

- QSPEC-02 multi-choice categorical variant (D-03) — captured as new `.planning/todos/pending/` entry at phase close; requires `OpinionQuestionInput.svelte` capability addition.
- `walkToQuestion(page, sortOrder)` extraction — recommended-but-not-blocking helper extraction.
- E2E-05 / E2E-07 4-case extension for boolean question — out of v2.9 scope; future milestone if a gap surfaces.
- Per-category match SubMatch for categorical questions — covered by E2E-07 (Phase 74); explicitly excluded per ROADMAP line 203.
- `answeredVoterPage` fixture extension to handle non-Likert questions — separate concern tracked in Phase 78 / CLEAN-05 (Path B / `--likert-only`).
- i18n wrapper tightening — Phase 78 / CLEAN-04; QSPEC-01 re-validates retroactively.
- `58-E2E-AUDIT.md` addendum for the boolean question + new category — recommended-but-not-blocking at P01 or P02 close.
- `tests/scripts/diff-playwright-reports.ts` permanent home + CI integration — out of v2.9 scope; same disposition as Phase 74.

---

## Reviewed Todos (not folded)

All 23 keyword-matched todos surfaced by `gsd-sdk query todo.match-phase 75` were reviewed against Phase 75's bounded scope (QSPEC-01 + QSPEC-02 spec authoring against the post-Phase-74 baseline). NONE folded — all are routed to other phases per `.planning/STATE.md §"Deferred Items"`. Full list with disposition in CONTEXT.md `<deferred>` section. Same disposition pattern as Phase 74's reviewed-todos audit.
