# Phase 88: Pre-Phase-87 Convergence Sweep — Context

**Gathered:** 2026-05-15 (post-trace-cleanup, pre-Phase-87 pre-gate)
**Status:** DRAFT — not yet threaded into ROADMAP.md
**Source:** Operator-directed convergence sweep after the 85-04 trace cleanup surfaced 13 failures + 36 cascade-skips that block the Phase 87 all-green anchor.

<domain>
## Phase Boundary

Drive the v2.10 e2e suite from its current post-85-04 state
(`110 PASS · 13 FAIL · 6 SOURCE-SKIP · 36 CASCADE`) to an
all-green-or-explicit-deferral state that satisfies Phase 87 Task 0's
pre-gate (`CASCADE ≤ 5`), so the Phase 87 216-min 3-run identity gate
fires cleanly without an in-flight Phase-85/86 reopen.

**This is a close-out repair phase, not a feature phase.** No new tests
are authored; no new product surfaces are added. The work is:

1. Fix the dominant root cause (Likert-only filter scope) that demolishes
   ~20 PASS_LOCKED tests via fixture-loop stalls on non-ordinal opinion
   questions.
2. Reconcile the per-cell Phase-86 deferrals that are currently failing
   instead of skipping (each either gets fixed, gets converted to
   `test.skip(true, '…')` + todo per Phase 86 D-03 1-hour-budget precedent,
   or moves into the DATA_RACE pool with explicit operator sign-off).
3. Re-run a 3-run cold-start gate against the post-88 codebase to confirm
   CASCADE ≤ 5 before Phase 87 fires.

**Out of scope:**
- Any new feature, variant, or test authoring.
- `sharedPage → per-test page fixture` refactor for the 5 Group A variant
  specs (held in 85-04 OUT-OF-SCOPE pending evidence of ENOENT noise,
  which the post-cleanup run did NOT show).
- Playwright 1.58.2 → 1.59+ upgrade.
- v2.11 milestone planning.

After Phase 88, run Phase 87 as planned (the existing 87-01-PLAN.md does
not need re-planning — its Task 0 pre-gate is what gates 88's exit).

</domain>

<decisions>
## Implementation Decisions

### Plan structure

- **D-01 — Four plans, single phase.** The work is 4 mechanically distinct
  clusters (one with high leverage, three with per-cell investigation
  budgets). One phase keeps the wave-coordination cheap; four plans keep
  the atomic-commit boundary tight per cluster.

  | Plan | Scope | Wave | Depends on |
  |------|-------|------|------------|
  | 88-01 | Extend `applyLikertOnlyFilter` to `data.setup.ts` (the default seed used by the `voter-app` project). Single-file change in `@openvaa/dev-seed` consumer + barrel verification. | 1 | — |
  | 88-02 | RCA + fix-or-skip for `voter-feedback-persistence:43`. Phase 86-02's fix didn't hold; needs second pass. | 1 | — |
  | 88-03 | Per-cell reconciliation of 3 Phase-86 deferrals currently failing: LAYOUT-03 (voter-popup-hydration:122), CLEAN-02 (voter-not-located-redirect:75 + 4 within-spec cascades), A11Y-01 (candidate-profile-validation:178 + 5 within-spec cascades). | 1 | — |
  | 88-04 | Post-88 3-run cold-start identity gate + handoff to Phase 87. | 2 | 88-01, 88-02, 88-03 |

  Plans 88-01/02/03 are parallel-eligible (Wave 1). Plan 88-04 sequences
  after all three converge.

### Likert-only filter extension (the high-leverage fix)

- **D-02 — Mirror the 85-03 maneuver into `data.setup.ts`.** Phase 85-03
  commit `26c187d93` exported `applyLikertOnlyFilter` from
  `@openvaa/dev-seed`'s barrel and called it in
  `variant-multi-election.setup.ts` between `runTeardown` and
  `runPipeline`, dropping non-`singleChoiceOrdinal` opinion questions so
  `multi-election.spec.ts`'s 5-choice `.nth(2).click()` assumption holds.

  Plan 88-01 applies the IDENTICAL maneuver to
  `tests/tests/setup/data.setup.ts` (the default `data-setup` project's
  setup, which seeds the e2e template consumed by the `voter-app`,
  `voter-app-settings`, `voter-app-popups`, `candidate-app`, and
  `candidate-app-mutation` projects). The `answeredVoterPage` fixture in
  `tests/tests/fixtures/voter.fixture.ts:52-110` and the
  `variant-constituency` answer-loop both stall on non-ordinal opinion
  questions; the filter eliminates the stall class.

  Net projected delta vs current post-85-04 baseline:
  - voter-detail × 6 (cluster #2 in 85-04 SUMMARY) → PASS
  - voter-matching:238 + 4 within-cascades → PASS
  - voter-navigation:196 + 1 within-cascade → PASS
  - variant-constituency:226 + 3 within-cascades + 19 cross-project
    cascade (startfromcg / low-min / 1e-Nc / Ne-Nc / allowopen /
    hidden-required) → PASS / unblocked
  - Total: ~36 tests transition FAIL+CASCADE → PASS_LOCKED.

- **D-03 — Side-effect audit before commit.** Phase 86 RESEARCH §3.10 +
  the `voter-question-rendering-{boolean,categorical}.spec.ts` `test.skip`
  rationale explicitly warn that "Project-wide `--likert-only` seed flip
  would regress 60+ PASS_LOCKED cells." Plan 88-01 MUST confirm that
  warning's scope:
  - Read `packages/dev-seed/src/templates/e2e.ts` opinion-question list
    (3 non-Likert types detected: `singleChoiceCategorical` line 544,
    `boolean` line 576, `number` line 666).
  - Identify which existing PASS_LOCKED tests REQUIRE those questions
    (search `tests/tests/specs/**` for `singleChoiceCategorical`,
    `boolean`, `number`, `test-question-boolean-1`,
    `test-question-categorical`).
  - If any PASS_LOCKED test depends on the non-ordinal questions in the
    default `voter-app` project, the filter cannot land in `data.setup.ts`
    wholesale — fall back to a per-project filtered setup (clone
    `data.setup.ts` → `data-setup-likert-only.setup.ts` and rewire the
    `voter-app` project to it).

  **Acceptance:** Either (a) the filter applies in-place and no
  PASS_LOCKED test regresses, OR (b) a per-project clone preserves the
  non-Likert seed for any tests that need it.

### Phase-86 deferral reconciliation

- **D-04 — Per-cell investigation budget: 1 hour each.** Per Phase 86 D-03
  precedent. If RCA exceeds 1 h, escalate to `test.skip(true,
  '<phase>-<cluster>: <reason>; v2.11+: <todo-file>')` + create a
  `.planning/todos/pending/2026-05-15-<slug>.md` file.

- **D-05 — Failure-class reconciliation list (88-03 scope).**

  | Test | Phase 86 classification | Current status | Plan 88-03 disposition |
  |------|------------------------|----------------|------------------------|
  | `voter-popup-hydration:122` (LAYOUT-03 deeplink) | PASS-WITH-DEFERRAL accepted in Phase 86-04 verdict | FAIL with explicit Phase 86 DETERM-12 message | Re-check Phase 86 anchor classification; if still in the SKIPPED_TESTS contract, convert assertion to `test.skip()` mirroring the QSPEC-01 boolean/categorical pattern. |
  | `voter-not-located-redirect:75` (CLEAN-02 direct-link) + 4 within-cascades | CASCADE_TESTS pool (4 downstream cells) | FAIL on URL pattern mismatch | Apply Phase 86 RESEARCH H1/H2 (per 86-02 PLAN; investigation cap 1h); if no fix, convert to `test.skip(true, '…')` + 4 cascade-victims auto-resolve. |
  | `candidate-profile-validation:178` (A11Y-01 image-type) + 5 within-cascades | not in Phase 86 anchor (regression) | FAIL on heading locator | Real RCA needed (likely auth state or page-load race). 1-h cap; convert to `test.skip()` if exceeded. |

  Each cell's disposition is documented in the 88-03 SUMMARY so
  Phase 87's anchor regen captures the new classification.

### `voter-feedback-persistence` second-pass

- **D-06 — H2/H3 hypothesis advancement.** Phase 86-02 applied H1 (Modal-
  close-race / dialog-close settle pattern) per commit `5d67f1933`. The
  test still fails on `toHaveCount` against a feedback-form dialog locator,
  suggesting H2 (multi-dialog locator collision per Pitfall 8) or H3
  (Svelte 5 reset semantics) is the active hypothesis.

  Plan 88-02 RCA budget: 1h per D-04. If H2 verifies: harden the
  FeedbackModal testId so the multi-dialog collision can't recur. If
  exceeded: convert to `test.skip(true, '…')` + todo per Phase 86 D-03.

### Phase 87 handoff

- **D-07 — Re-run cold-start gate after 88-01/02/03 converge.** Plan 88-04
  runs a 3-run cold-start gate (same mechanism as Phase 79 D-11 +
  Phase 85-03 + Phase 86-04 + Phase 87 Task 0). Acceptance:
  - PASS_LOCKED ≥ 130 (post-88-01 delta projection: 110 + ~20-36 = ~130-146;
    accept ≥ 130 as the minimum-headroom gate target).
  - CASCADE ≤ 5 (Phase 87 Task 0 contract — green-light for the full
    216-min Phase 87 gate).
  - Any new failure-class entries documented in 88-04 SUMMARY for
    Phase 87 anchor regen.

- **D-08 — Phase 87 plan does NOT need re-planning.** The existing
  `87-01-PLAN.md` Task 0 pre-gate is what 88-04 satisfies. Phase 87
  fires unchanged after 88-04 SUMMARY commits.

### Anti-pattern guards

- **D-09 — No production-code refactors in Phase 88.** This is a test-
  infrastructure + per-cell investigation phase. If RCA on a Phase-86
  deferral surfaces a production bug, the disposition is `test.skip()` +
  todo + reopen Phase 86 if budget allows — NOT a Phase-88 in-place fix.
  Keeps the close-out scope tight and the post-88 anchor stable.

- **D-10 — `git -c core.hooksPath=/dev/null` for all commits.** Per
  operator memory `project_gsd_repo_hook_workaround.md`. Applies to
  every commit in Plans 88-01 / 02 / 03 / 04.

### Claude's Discretion

- Plan 88-01 picks between in-place `data.setup.ts` edit (D-03 path a) vs
  per-project setup clone (D-03 path b) based on the side-effect audit.
- Plan 88-03 picks per-cell whether to fix or skip within the 1-h cap.
- Plan 88-04 picks the 3-run gate invocation style (full-suite vs
  scoped-to-affected-projects). Recommendation: full-suite, since Phase 87
  Task 0 reads against the full-suite anchor.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap + REQUIREMENTS

- `.planning/ROADMAP.md` §"Phase 87: v2.10 All-Green Milestone-Close Anchor"
  — Phase 88 inserts before Phase 87.
- `.planning/REQUIREMENTS.md` — Phase 88 inherits Phase 85/86 requirement
  IDs (DETERM-12/13/14) for the deferral-reconciliation work; no new
  REQ-IDs are introduced.

### Phase 85 (immediate predecessor)

- `.planning/phases/85-…/85-03-SUMMARY.md` — `applyLikertOnlyFilter` export
  + variant-multi-election application (commit `26c187d93`); 11-spec
  trace-cleanup deferral that 85-04 pulled forward.
- `.planning/phases/85-…/85-04-PLAN.md` + `85-04-SUMMARY.md` —
  trace-visibility cleanup (already complete); 6-cluster failure
  classification captured in 85-04 SUMMARY §"Findings handed off to
  Phase 88".
- `.planning/phases/85-…/post-fix/run-with-traces-restored.json` —
  diagnostic capture, the input to 88-04's delta projection.

### Phase 86 (close-out precedent)

- `.planning/phases/86-…/86-02-PLAN.md` D-03 — 1-hour investigation cap +
  fall-back-to-skip protocol (Plan 88-02 / 88-03 inherit this verbatim).
- `.planning/phases/86-…/86-RESEARCH.md` §3.6 (voter-feedback-persistence
  H1/H2/H3 hypotheses), §3.7 / §3.8 (DETERM-14 cluster), §3.10 (Project-
  wide `--likert-only` regression warning).
- `.planning/phases/86-…/86-04-SUMMARY.md` — Phase 86 PASSED-WITH-DEFERRAL
  anchor (113 PASS_LOCKED · 3 DATA_RACE · 42 CASCADE · 2 SKIPPED). 88-04's
  3-run gate compares against this anchor.

### Phase 87 (immediate successor)

- `.planning/phases/87-…/87-01-PLAN.md` Task 0 — pre-gate CASCADE check
  (the gate 88-04 must satisfy).
- `.planning/phases/87-…/87-CONTEXT.md` §"D-05 — Anchor target
  verification" — the binding tolerances 88-04's run must hit.

### Test infrastructure

- `tests/tests/fixtures/voter.fixture.ts:52-110` — `answeredVoterPage`
  fixture (16-Likert loop + 3-Skip-Next tail).
- `tests/tests/setup/data.setup.ts` — default `data-setup` project; the
  edit target for Plan 88-01.
- `tests/tests/setup/variant-multi-election.setup.ts` — Phase 85-03
  precedent for `applyLikertOnlyFilter` placement.
- `packages/dev-seed/src/index.ts` — `applyLikertOnlyFilter` barrel
  export (added by 85-03 commit `26c187d93`).
- `packages/dev-seed/src/templates/e2e.ts` — non-Likert opinion question
  inventory (`singleChoiceCategorical` line 544, `boolean` line 576,
  `number` line 666) for the D-03 side-effect audit.
- `tests/scripts/diff-playwright-reports.ts` — current anchor; 88-04 may
  trigger an anchor-regen if cluster dispositions cross classification
  boundaries.

### Project conventions

- `CLAUDE.md` §"Common Workflows" — canonical Likert-only-reset chain.
- `.agents/code-review-checklist.md` — code review checklist.
- Memory `project_gsd_repo_hook_workaround.md` (D-10).
- Memory `feedback_e2e_did_not_run.md` — cascade tests count as failures
  in all accounting; 88-04's gate disposition treats CASCADE > 5 as a
  blocking failure.

</canonical_refs>

<specifics>
## Specific Ideas

### Plan 88-01 — Likert-only filter extension

Concrete maneuver, mirrored from `26c187d93`:

```ts
// tests/tests/setup/data.setup.ts

import {
  BUILT_IN_TEMPLATES,
  BUILT_IN_OVERRIDES,
  applyLikertOnlyFilter,   // <-- new import (barrel re-export)
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';

// …existing setup body…
await runTeardown(PREFIX, client);

// NEW: Drop non-singleChoiceOrdinal opinion questions BEFORE pipeline.
//      Mirrors variant-multi-election.setup.ts (Phase 85-03 commit 26c187d93).
//      Required by answeredVoterPage fixture (voter.fixture.ts:52-110) which
//      assumes Likert-5 choices for its 16-iter loop's .nth(voterAnswerIndex)
//      auto-advance contract.
const filteredTemplate = applyLikertOnlyFilter(template!);

const rows = runPipeline(filteredTemplate, overrides);
fanOutLocales(rows, filteredTemplate, seed);
// …rest unchanged…
```

If D-03 side-effect audit forces path (b), the plan instead clones
`data.setup.ts` to `data-setup-likert-only.setup.ts` and rewires the
`voter-app` project's `dependencies: ['data-setup']` → `['data-setup-likert-only']`
in `tests/playwright.config.ts`. The original `data-setup` stays mixed-type
for any candidate-app or other project that needs the non-Likert seed.

### Plan 88-04 — 3-run cold-start gate invocation

```bash
# 1. Hard reset DB + apply --likert-only seed if 88-01 chose path (b)
yarn db:reset

# 2. 3-run gate (mirror Phase 85-03 + Phase 86-04 invocation)
for i in 1 2 3; do
  yarn test:e2e --reporter=json --output=run-${i}.json 2>&1 | tee run-${i}-stderr.log
  sha256sum run-${i}.json >> sha256.txt
done

# 3. SHA-identity verdict
node .planning/phases/87-.../post-fix/sha-identity.mjs run-{1,2,3}.json
```

Capture in `.planning/phases/88-…/post-fix/`:
- `run-{1,2,3}.json` + `.sha256`
- `sha256.txt` (3-run identity audit)
- `regen-output.txt` (new partition: PASS_LOCKED / DATA_RACE / CASCADE / SKIPPED)

</specifics>

<deferred>
## Deferred Ideas

- **sharedPage → per-test page-fixture refactor** for the 5 Group A
  variant specs (1e-Nc, Ne-Nc, constituency, results-sections, startfromcg).
  85-04 verified the post-trace-cleanup run does NOT surface ENOENT noise,
  so the refactor is not load-bearing for v2.10 close-out. Hold for v2.11+.

- **Playwright 1.58.2 → 1.59+ upgrade.** Resolves the trace-writer ENOENT
  race upstream and lets all the workaround commentary be removed
  entirely. Mid-term; not a v2.10 ship-blocker.

- **`package.json` `db:*` scripts refactor** — captured as todo
  `2026-05-15-refactor-package-scripts-db-prefixed-scripts-only-affect-the.md`.
  Queued for post-v2.10-ship.

- **Phase 86 voter-question-rendering-{boolean,categorical} re-enable.**
  Currently `test.skip(true, '…')` per QSPEC-01/02 PASS-WITH-DEFERRAL.
  Phase 88's `applyLikertOnlyFilter` extension does NOT re-enable them
  (they assert non-Likert behaviour by design). Held for v2.11+ project-
  wide voter-fixture redesign.

</deferred>

---

*Phase: 88-pre-phase-87-convergence-sweep*
*Context drafted: 2026-05-15 — direct write (not via /gsd:discuss-phase).*
*Roadmap insertion: pending — operator runs `/gsd:phase --insert 88` to thread into ROADMAP.md, or this directory stays orphaned until promoted.*
