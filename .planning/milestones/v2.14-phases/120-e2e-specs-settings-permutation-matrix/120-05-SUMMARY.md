---
phase: 120-e2e-specs-settings-permutation-matrix
plan: 05
subsystem: e2e-tests
tags: [e2e, perm-chain, interactive-info, questionInfo, arguments, terms, EPERM-07, settings-permutation]
requires:
  - phase: 120-04
    provides: "perm tail anchor (perm-question-video) — the dependency anchor for the perm-interactive-info node"
  - phase: 120-03
    provides: "voter-journey.spec.ts (the file the customData.terms extension rides)"
  - phase: 119
    provides: "perm-interactive-info dev-seed template, customData.terms on e2e/base Base-3, questionInfo fixture (expectInfoMode/expectInfoSections/expectArguments), Term/argument/infoSection test-ids"
provides:
  - "EPERM-07 perm-interactive-info perm-chain node (setup/teardown + project triple) asserting popup-modal + static-expander info modes IN FULL"
  - "infoSections (title+html) + per-type arguments (Likert/Boolean/Categorical, categorical grouped by choiceId) assertions"
  - "EPERM-07 customData.terms voter-journey extension (in-text Term affordance + definition popup)"
  - "voter-questions-arguments testid on the QuestionExtendedInfo Arguments Expander"
affects:
  - "tests/playwright.config.ts (perm tail)"
  - "tests/tests/specs/voter/voter-journey.spec.ts"
  - "apps/frontend QuestionExtendedInfo.svelte (new testid)"
  - "packages/dev-seed perm-interactive-info template"
tech-stack:
  added: []
  patterns:
    - "perm-singleton in-spec re-seed via client.updateAppSettings({questions:{interactiveInfo:{enabled}}}) + afterAll restore for the per-mode (popup vs expander) matrix"
    - "modal-Drawer dismissal (Escape → assert popupInfoModal hidden) before page-level question-next nav (open scrim intercepts pointer events)"
    - "argument carriers co-seed an infoSection so the popup disclosure renders (layout gates the popup button on info||infoSections; QuestionArguments is nested inside the infoSections {#if})"
    - "expectArguments expands the Arguments Expander (content mounts only when expanded) then matches the suffixed testid voter-questions-argument-group-{choiceId|type}"
key-files:
  created:
    - "tests/tests/specs/perm/perm-interactive-info.spec.ts"
    - "tests/tests/setup/perm/perm-interactive-info.setup.ts"
    - "tests/tests/setup/perm/perm-interactive-info.teardown.ts"
  modified:
    - "tests/playwright.config.ts"
    - "tests/tests/specs/voter/voter-journey.spec.ts"
    - "tests/tests/fixtures/voter/questionInfo.fixture.ts"
    - "tests/tests/utils/testIds.ts"
    - "apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte"
    - "packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts"
key-decisions:
  - "Resolved the EPERM-07 arguments render-gating (flagged in 120-01-PROBE-DIAGNOSIS.md) by CO-SEEDING an infoSection on each argument carrier (additive seed change) rather than moving the production {#if args} gate — keeps the production gating logic untouched per the test-authoring scope."
  - "Added a testid (voter-questions-arguments) to the Arguments Expander (Rule 2 — the sibling infoSection blocks already had per-index testids; the arguments block had none) so the reader can expand it and read the per-group blocks."
  - "expander-mode re-seed uses client.updateAppSettings (deep-merge merge_jsonb_column) in beforeAll/afterAll, restored to enabled=true so the seed is not left mutated for downstream perm nodes."
patterns-established:
  - "Per-mode app-singleton re-seed (interactiveInfo.enabled true↔false) for the popup-vs-expander matrix, restored in afterAll."
  - "Modal-Drawer-aware perm walk: dismiss the popup info modal before the next question-next nav."
requirements-completed: [EPERM-07]
duration: ~75min
completed: 2026-06-16
---

# Phase 120 Plan 05: EPERM-07 perm-interactive-info + customData.terms Summary

**A new perm-interactive-info perm-chain node asserts the questions.interactiveInfo.enabled matrix IN FULL (popup-modal + static-expander) plus customData.infoSections and per-type arguments (Likert/Boolean/Categorical); the separate customData.terms in-text affordance + definition popup rides voter-journey against e2e/base. Full perm chain GREEN 3× (93 passed each).**

## Performance

- **Duration:** ~75 min (incl. RED/GREEN iteration + 3× determinism gate, ~4.1m/full-chain run)
- **Completed:** 2026-06-16
- **Tasks:** 3 (Task 2 was TDD: RED → GREEN)
- **Files modified:** 6 created/modified (3 created, 3 test files + 1 frontend component + 1 dev-seed template modified)

## Accomplishments

- Wired the `perm-interactive-info` Playwright project triple (append-to-tail after `perm-question-video`) + the unauthenticated seed-only setup/teardown pair.
- Authored `perm-interactive-info.spec.ts`: POPUP mode (modal Drawer disclosure + 2 infoSections on qu-popup), per-type arguments (Likert/Boolean/Categorical, categorical grouped by choiceId), and EXPANDER mode (inline reveal, no modal) under an `interactiveInfo.enabled=false` re-seed.
- Resolved both EPERM-07 blockers flagged at the 120-01 probe gate (arguments render-gating + argument-group suffixed-testid mismatch).
- Extended `voter-journey.spec.ts` with the EPERM-07 `customData.terms` slice: the in-text `<Term>` affordance on Base-3 + its focus-revealed definition popup.
- 3× clean-DB determinism gate (SC5): `perm-interactive-info` + `voter-journey` → **93 passed** all three runs, zero flakes, zero "did not run".

## Task Commits

1. **Task 1: Wire perm-interactive-info node + unauthenticated setup/teardown** — `d275e937d` (test)
2. **Task 2 (TDD RED): perm-interactive-info spec** — `e9374c5d3` (test)
3. **Task 2 (TDD GREEN): popup/expander/infoSections/per-type arguments pass** — `5a4a072d3` (feat)
4. **Task 3: customData.terms voter-journey extension** — `453836fa9` (test)

_Task 3's 3× determinism gate is a verification step (no code change beyond the terms extension committed in `453836fa9`)._

## Files Created/Modified

- `tests/tests/specs/perm/perm-interactive-info.spec.ts` (created) — EPERM-07 spec: popup + expander + infoSections + per-type arguments.
- `tests/tests/setup/perm/perm-interactive-info.setup.ts` (created) — unauthenticated `setupFromTemplate('perm-interactive-info', { extraTeardownPrefix })`.
- `tests/tests/setup/perm/perm-interactive-info.teardown.ts` (created) — bare `runTeardown('e2e-perm-iinfo-')`.
- `tests/playwright.config.ts` (modified) — perm-interactive-info triple appended after the perm-question-video tail (`grep -c perm-interactive-info` = 9).
- `tests/tests/specs/voter/voter-journey.spec.ts` (modified) — `customData.terms` affordance + popup assertion on Base-3 (additive).
- `tests/tests/fixtures/voter/questionInfo.fixture.ts` (modified) — `expectArguments` expands the Arguments Expander + matches the suffixed `argument-group-{choiceId|type}` testid.
- `tests/tests/utils/testIds.ts` (modified) — added `argumentsExpander: 'voter-questions-arguments'`.
- `apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte` (modified) — `data-testid="voter-questions-arguments"` on the Arguments Expander.
- `packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts` (modified) — co-seed one infoSection on each argument carrier.

## Decisions Made

- **Arguments render-gating (the 120-01 deferred blocker) → co-seed infoSections on the argument carriers.** The probe diagnosis offered two options: move the production `{#if args}` gate outside the `{#if infoSections?.length}` block, OR co-seed infoSections on the argument carriers. Chosen the co-seed (additive seed change) — the voter questions layout (`questions/+layout.svelte:238`) gates the interactiveInfo popup button on `(info || infoSections?.length)`, AND `QuestionExtendedInfo.svelte:52` nests `QuestionArguments` inside the `{#if infoSections?.length}` block. The argument carriers (qu-likert/boolean/categorical) carry `arguments` but no `info`/`infoSections`, so without a co-seeded infoSection neither the popup button nor the arguments render. Co-seeding keeps the production gating logic untouched (test-authoring scope, per the threat model "no new production code path").
- **expander-mode re-seed via `client.updateAppSettings` in `beforeAll`/`afterAll`** (the established perm-singleton mutation pattern, `perm-startfromcg.spec.ts:45-55`), restored to `enabled=true` so the seed is not left mutated for any downstream perm node.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added a testid to the Arguments Expander**
- **Found during:** Task 2 (GREEN — per-type argument assertions).
- **Issue:** `QuestionArguments` renders inside a collapsible `Expander` ("Arguments") whose content mounts ONLY when expanded (`Expander.svelte:162 {#if expanded}`). The Expander had NO test anchor, unlike its sibling infoSection blocks which already carry per-index testids (`QuestionExtendedInfo.svelte:58`). Without an anchor the reader could not deterministically expand the arguments block (the expand checkboxes share an i18n aria-label across all sections).
- **Fix:** Added `data-testid="voter-questions-arguments"` to the Arguments `<Expander>` (it spreads `...restProps` onto its root, the same mechanism `voter-questions-info-button` already uses). The fixture now expands it via its toggle checkbox before reading the per-group block.
- **Files modified:** `apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte`, `tests/tests/utils/testIds.ts`, `tests/tests/fixtures/voter/questionInfo.fixture.ts`.
- **Verification:** Full perm chain GREEN (93 passed) + 3× determinism gate.
- **Committed in:** `5a4a072d3` (Task 2 GREEN commit).

**2. [Rule 1 - Bug] expectArguments targeted a non-resolving bare testid**
- **Found during:** Task 2 (GREEN).
- **Issue:** `QuestionArguments.svelte:64` bakes the suffix into the testid (`voter-questions-argument-group-{choiceId ?? type}`), but the Phase-119 fixture's `expectArguments` targeted the bare base `voter-questions-argument-group` — an exact-match miss that NEVER resolves (the same class of fixture/component mismatch as the `infoSection` per-index fix landed at the 120-01 probe gate).
- **Fix:** `expectArguments` now targets `voter-questions-argument-group-{suffix}` (`likertPros`/`booleanPros` for ordinal/boolean, choiceId `a` for categorical).
- **Files modified:** `tests/tests/fixtures/voter/questionInfo.fixture.ts`.
- **Verification:** per-type argument assertions GREEN.
- **Committed in:** `5a4a072d3` (Task 2 GREEN commit).

**3. [Rule 1 - Bug] Open modal scrim intercepted the question-next pointer events**
- **Found during:** Task 2 (GREEN — advancing between argument carriers).
- **Issue:** The popup info disclosure is a `Drawer` modal; while open, its scrim intercepts pointer events so the page-level `question-next` button click timed out (trace-confirmed "intercepts pointer events").
- **Fix:** Added `dismissInfoModal` (Escape → assert `popupInfoModal` hidden) before each `question-next` nav.
- **Files modified:** `tests/tests/specs/perm/perm-interactive-info.spec.ts`.
- **Verification:** the full per-type walk GREEN.
- **Committed in:** `5a4a072d3` (Task 2 GREEN commit).

---

**Total deviations:** 3 auto-fixed (1 missing-critical testid, 2 bugs). All within the EPERM-07 blockers the 120-01 probe diagnosis explicitly deferred to this plan.
**Impact on plan:** No scope creep. The single production-code touch (one testid attribute on an Expander) is a pure test-anchor addition with no behavior change. The seed co-seed is additive (own-namespaced template, does not touch e2e/base).

## Issues Encountered

- **RED→GREEN iteration on the arguments path (3 successive trace-diagnosed failures):** (1) argument carriers could not open their popup (no info/infoSections) → co-seed infoSections; (2) once the popup opened, `question-next` was blocked by the modal scrim → Escape-dismiss; (3) the arguments lived in a collapsed Expander whose content was unmounted → expand it + match the suffixed testid. Each was confirmed via the saved `error-context.md` + trace before fixing. All resolved by the GREEN commit.

## Seed-change status

**Co-seed (additive, own-namespaced) — perm-interactive-info template only.** One `infoSection` added to each of the three argument carriers (qu-likert/boolean/categorical) in `packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts`. The `e2e/base` dataset (the terms carrier) was NOT touched — the `customData.terms` block was already seeded on Base-3 in Phase 119; this plan only ADDS assertions against it.

## TDD Gate Compliance

Task 2 followed RED → GREEN. RED commit `e9374c5d3` (`test(...)`) added the spec with the per-type argument assertions failing as predicted (the popup disclosure never rendered for the argument carriers). GREEN commit `5a4a072d3` (`feat(...)`) landed the co-seed + testid + fixture fixes. No REFACTOR needed.

## Verification

- `yarn typecheck:tests` — exit 0.
- `eslint --flag v10_config_lookup_from_file` on spec + fixture + testIds + voter-journey — clean (`no-restricted-locators` guard passes).
- `grep -c "perm-interactive-info" tests/playwright.config.ts` — 9 (3 project entries).
- `npx playwright test --project=perm-interactive-info` — full chain **93 passed**.
- **3× determinism gate (SC5):** `--project=perm-interactive-info --project=voter-journey`, each preceded by a full `yarn db:reset` (clean DB) → **93 passed** × 3, zero flakes, zero "did not run".

## Next Phase Readiness

- The perm tail is now `perm-interactive-info`. Plans 120-06 (perm-org-matching), 120-07 (perm-show-feedback-survey rename), 120-08 (perm-access-disable) append after it (or chain off the prior perm SPEC per the perm-triple pattern).
- No blockers. The arguments render-gating is resolved at the seed layer; if a future phase wants arguments to render WITHOUT a co-seeded infoSection, the production `{#if args}` gate in `QuestionExtendedInfo.svelte` would need restructuring (out of scope here).

## Self-Check: PASSED

- `tests/tests/specs/perm/perm-interactive-info.spec.ts` — FOUND.
- `tests/tests/setup/perm/perm-interactive-info.setup.ts` — FOUND.
- `tests/tests/setup/perm/perm-interactive-info.teardown.ts` — FOUND.
- Commit `d275e937d` — FOUND.
- Commit `e9374c5d3` — FOUND.
- Commit `5a4a072d3` — FOUND.
- Commit `453836fa9` — FOUND.

---
*Phase: 120-e2e-specs-settings-permutation-matrix*
*Completed: 2026-06-16*
