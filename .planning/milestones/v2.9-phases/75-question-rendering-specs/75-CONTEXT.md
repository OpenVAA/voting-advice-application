# Phase 75: Question-Rendering Specs - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Mode:** `--auto` (single-pass; all gray areas auto-selected; recommended option chosen per question — see DISCUSSION-LOG.md for the audit trail)

<domain>
## Phase Boundary

Add two focused Playwright user-story specs on top of the now-deterministic Phase-73 baseline (4 PASS_LOCKED / 15 DATA_RACE / 65 CASCADE after Phase 74's +10 categorical-question regen — per STATE.md line 135) that walk a voter end-to-end through:

- **QSPEC-01 — Boolean opinion question.** Input renders as the v2.6 Phase 61 2-button radio shape (per `isBooleanQuestion` type guard + `OpinionQuestionInput` boolean branch at `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:100-111`). Voter answers, navigates, sees the answer reflected on entity-detail.
- **QSPEC-02 — Categorical opinion question (single-choice).** Input renders as the `QuestionChoices` shape (per `isSingleChoiceQuestion` branch at `OpinionQuestionInput.svelte:89-99`). Voter answers, navigates, sees the answer reflected on entity-detail. Multi-choice is deferred — see D-03.

Phase 75 is content-heavy spec authoring on a stable suite — NOT new product behavior, NOT framework migration. Each new spec MUST pass 3× cold-start `--workers=1` identically; the Phase-73-locked DATA_RACE pool (15) must not grow as a side-effect. Phase 73 is a HARD prerequisite (closed 2026-05-11); Phase 74 closed GREEN-WITH-DEFERRAL on 2026-05-11. May develop in parallel with Phases 76 / 77; independent of Phase 78. Same shape as Phase 74 but bounded to 2 specs.

</domain>

<decisions>
## Implementation Decisions

### Plan grouping + sequence

- **D-01 — 2 plans, verification gate folded into Plan 02.** ROADMAP estimates "~2 plans — 1 per spec, given the small + focused scope" (line 206). STATE.md plan-count estimate table (line 156) concurs: "2 plans — (1) QSPEC-01 Boolean spec; (2) QSPEC-02 categorical spec. Small + focused."

  Auto-selected layout:
  1. **Plan 01 — QSPEC-01 (Boolean spec) + e2e template boolean-question addition.** Adds a `boolean`-type opinion question to `packages/dev-seed/src/templates/e2e.ts` `questions.fixed[]` at sort 18 (after the Phase 74 P05 categorical at sort 17) following the Phase 74 P05 pattern (D-02 below). Authors `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts` per D-04. Adds candidate Alpha's boolean answer cell in the same template (so the entity-detail mirror assertion has data to compare; see D-05). Re-runs `yarn build` for `@openvaa/dev-seed`. No new variant template (D-02 — base e2e template extension).
  2. **Plan 02 — QSPEC-02 (Single-choice categorical spec) + verification gate.** Authors `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts` against the EXISTING `test-question-directional-1` (singleChoiceCategorical at sort 17, added in Phase 74 P05 — see STATE.md line 128 + `packages/dev-seed/src/templates/e2e.ts:518-532`). No new fixture data required for single-choice. Multi-choice deferred per D-03. Runs the verification gate inline (vite-cache wipe per D-10 + 3-run cold-start `--workers=1` smoke + parity-script self-identity smoke + conditional constants regen per D-09); produces `75-VERIFICATION.md`. Inline-gate shape matches the Phase 73 P01 pattern (1 plan delivers feature + verification when phase scope is small); contrasted with Phase 74 P07 (separate verification plan because 7 feature plans were too much for a single plan's ceiling).

  Risk: Plan 02 carries both feature work AND verification — if Plan 02 scope exceeds the per-plan ceiling, planner may split into 02a (categorical spec) + 02b (verification gate). Default: 1 bundled plan.

### Fixture strategy (boolean question)

- **D-02 — Add boolean question to e2e template at sort 18 (mirrors Phase 74 P05 directional-question pattern).** The e2e template currently has 16 singleChoiceOrdinal + 1 singleChoiceCategorical + 1 text — and explicitly EXCLUDED `test-question-boolean` per §4.1 of `58-E2E-AUDIT.md` ("zero grep hits in specs; dropping preserves the 8-ordinal filter result" — `packages/dev-seed/src/templates/e2e.ts:298`). QSPEC-01 is the first spec that grep-hits a boolean question, which re-opens the §4.1 exclusion.

  Concrete shape (mirrors `test-question-directional-1` at `e2e.ts:518-532`):
  ```ts
  {
    external_id: 'test-question-boolean-1',
    type: 'boolean',
    name: { en: 'Test Opinion Question Boolean 1 (QSPEC-01)' },
    category: { external_id: 'test-category-boolean' }, // NEW category entry
    allow_open: false,
    required: false,
    sort_order: 18,
    is_generated: false
  }
  ```

  Per `packages/dev-seed/src/templates/defaults/questions-override.ts:53` ("boolean: no choices (QuestionsGenerator pattern — boolean is schema-free)"), the boolean question schema-free shape is established. The latent emitter falls back to `defaultRandomValidEmit` for booleans per D-57-10.

  **`required: false` + sort 18 placement** keeps `voter.fixture.ts answeredVoterPage` (default `voterAnswerCount=16`) unaffected — voter answers the 16 ordinals first, encounters the categorical (sort 17) AND boolean (sort 18) last, and the fixture's post-loop fallback clicks "Skip" (nextButton) to navigate to /results. EXACT pattern from Phase 74 P05 (CONTEXT D-07 + STATE.md line 130 cross-spec impact note re: Skip-Next fallback). Planner verifies the existing Skip-Next fallback in `voter-matching.spec.ts navigateToResults` + `voter-journey.spec.ts answerRemainingUntilResults` accommodates sort 18 (out-of-range guard already in place per STATE.md line 130).

  **New category `test-category-boolean`** is added alongside (categorical category was added in Phase 74 P05 as `test-category-directional`; same pattern). Alpha candidate gets a boolean answer cell:
  ```ts
  // In test-candidate-alpha.answersByExternalId
  'test-question-boolean-1': { value: true },
  ```
  Required by QSPEC-01's entity-detail mirror assertion (D-05): voter answered "Yes" → entity-detail shows BOTH voter's "Yes" row + candidate Alpha's "Yes" row.

  **NO new variant template** — the boolean question lives in the base `e2e` template so the base `voter-app` Playwright project picks it up without a new project/setup. Same pattern as Phase 74 P05 (CONTEXT D-07 directional question).

  **Reverse alternative considered + REJECTED:**
  - New variant template `variant-boolean-q` — extra Playwright project + setup + dependency-chain plumbing for a 1-row diff; over-engineered. Phase 74 P05 already established that single-question additions belong in the base template, not in a new variant.
  - Use default Finnish demo template (which DOES have a boolean per `questions-override.ts:53`) — would require switching the spec's Playwright project AND the default template's row counts/IDs are not spec-anchored (they're faker-driven). Brittle.

### Multi-choice categorical handling

- **D-03 — PASS-WITH-DEFERRAL — Phase 75 covers single-choice categorical only.** Multi-choice categorical opinion questions are NOT renderable in voter flow today: `OpinionQuestionInput.svelte:88-114` dispatches on `isSingleChoiceQuestion(question)` (covers `SingleChoiceCategoricalQuestion` + `SingleChoiceOrdinalQuestion`) and `isBooleanQuestion(question)`; all other types (including `MultipleChoiceCategoricalQuestion`) fall through to the `error.unsupportedQuestion` branch at line 113.

  This means QSPEC-02 SC #2's "single-choice + multi-choice shapes" cannot ALL be E2E-asserted at HEAD — the multi-choice render path doesn't exist. Adding multi-choice opinion rendering is a NEW capability (component branch extension + matching-algorithm dispatch confirmation + dev-seed answers-emitter extension across opinion answers) and exceeds Phase 75's scope-guardrail.

  **Decision matches the Phase 74 D-04 PASS-WITH-DEFERRAL precedent for E2E-01:** the LESSER-risk case (absence of a render path → no production breakage) is deferred; the HIGHER-risk case (existing single-choice categorical render path is post-v2.6 code with no E2E gate today — `test-question-directional-1` only exists since Phase 74 P05) is covered.

  - **In scope:** QSPEC-02 asserts the single-choice categorical render contract — `test-question-directional-1` renders 3 choice buttons (Option A / Option B / Option C per `e2e.ts:522-526`); voter selects Option B; answer persists across navigation; voter sees Option B reflected on entity-detail (their row vs. entity's row). Role/aria locators; no test-id additions required.
  - **Deferred:** Multi-choice categorical assertion. Captured as a new `.planning/todos/pending/` entry at phase close: "QSPEC-02 multi-choice categorical variant — add `MultipleChoiceCategoricalQuestion` branch to `OpinionQuestionInput.svelte` (component capability addition + matching dispatch verification + dev-seed answers-emitter support across opinion answers, mirroring `pickMultipleChoiceIds` in `packages/dev-seed/src/emitters/answers.ts:115`); spec asserts multi-choice render + voter checks N choices + answer persists + entity-detail mirror."

  **ROADMAP SC #2 interpretation:** PASS-WITH-DEFERRAL. The deferred multi-choice variant is gated on a missing component branch; covering it requires a feature phase, not a coverage phase. Phase 75 closes the higher-risk gap (single-choice categorical render — the v2.6 Phase 64 + Phase 74 P05 surface) and bounds the phase.

  Rationale: QSPEC-02's stated goal in the ROADMAP (line 203) is "input renders correctly, voter answers, navigates, sees their answer reflected on entity-detail. Per-category match breakdown is NOT asserted here (that's E2E-07's responsibility — QSPEC-02 covers only the input + flow)." The single-choice categorical path covers this contract end-to-end against a question that exists in the seed today. The multi-choice path doesn't exist in the product and requires a feature phase to add.

### Deduplication strategy (SC #3)

- **D-04 — New spec files at `voter-question-rendering-{boolean,categorical}.spec.ts`.** ROADMAP SC #3 requires assertion-by-assertion check against `tests/tests/specs/voter/voter-matching.spec.ts` + unit-level matching tests in `packages/matching/`; no assertion duplicates an existing test's coverage. Where overlap exists, the QSPEC version asserts the user-flow + render-shape contract (Playwright's strength), and the existing matching test continues to assert the matching-algorithm contract.

  Concrete approach:
  1. **Spec naming clearly marks scope:** `voter-question-rendering-boolean.spec.ts` (QSPEC-01) + `voter-question-rendering-categorical.spec.ts` (QSPEC-02). The "rendering" suffix prevents conceptual conflation with `voter-matching.spec.ts` (which asserts the matching-algorithm contract — distance metrics, normalization, ordering).
  2. **Dedup audit at PLAN.md time:** Each plan's task list includes a "Dedup audit" step that grep-walks `tests/tests/specs/voter/voter-matching.spec.ts` + `packages/matching/src/**/*.test.ts` for any assertion that overlaps with the new spec's planned assertions. Specifically:
     - Boolean question matching assertions in `packages/matching/` — DO NOT re-assert in QSPEC-01 (the QSPEC spec asserts render + flow, NOT the matching distance).
     - Categorical question matching assertions in `voter-matching.spec.ts:40-43` (filters `type === 'singleChoiceOrdinal'` expecting 8 from defaultDataset per the §1.1 comment) + `packages/matching/` — DO NOT re-assert categorical matching distance in QSPEC-02 (Phase 74 P05 already added Skip-Next fallback at sort 17 — QSPEC-02 builds on that fallback, not on assertion re-coverage).
     - Per-category match breakdown / SubMatch — covered by E2E-07 (Phase 74 P05); QSPEC-02 explicitly does NOT assert this per ROADMAP line 203.
  3. **Per-assertion citation comments:** Each non-trivial assertion in the new specs carries a `// dedup: covered-by → voter-matching.spec.ts:NN` comment IF an analog exists in matching tests but the QSPEC version asserts a different contract (user-flow vs. algorithm). Mirrors the Phase 73 D-07 `// reason:` convention for inline justification.

  **Reverse alternatives considered + REJECTED:**
  - Extend `voter-matching.spec.ts` with new test() blocks — would conflate the matching-algorithm contract with the render-shape contract; harder to reason about coverage scope.
  - Extend `voter-questions.spec.ts` (which already covers question-flow intro behavior) — `voter-questions.spec.ts` is scoped to the QUESTIONS-INTRO category-selection surface (per its `test.describe('voter questions intro', ...)` block at line 25), not per-question render shapes. Conflating would dilute the spec's scope.

### Assertion shape (input shape + voter flow + entity-detail mirror)

- **D-05 — 4-step contract per spec.** Each new spec asserts the same 4-step contract (uniform shape per ROADMAP SC #1 + SC #2):

  1. **Input renders correctly.**
     - **Boolean (QSPEC-01):** 2 buttons with labels `t('common.answer.no')` + `t('common.answer.yes')` (verified present in en/fi/sv/da per `OpinionQuestionInput.svelte:69`). Order: `no` first matches the ordinal low→high left-to-right convention (per `OpinionQuestionInput.svelte:73-74`). Locator: `getByRole('button', { name: t('common.answer.no') })` + `.yes` analog. The `data-testid="opinion-question-input"` div container (line 88) may be used as a scope wrapper with inline `// reason:` per D-06 if role-based locators alone surface ambiguity.
     - **Categorical (QSPEC-02):** 3 choice buttons with labels `'Option A'`, `'Option B'`, `'Option C'` (per `test-question-directional-1.choices` at `e2e.ts:522-526`). Locator: `getByRole('button', { name: 'Option B' })` (or per-choice loop).

  2. **Voter answers.** Click the chosen option button. Boolean: click "Yes" (maps to `true` via the onChange adapter at `OpinionQuestionInput.svelte:110`). Categorical: click "Option B" (the middle option per parity with Phase 74 P05's directional-anchor mid-choice pattern).

  3. **Answer persists across navigation.** Navigate forward via auto-advance (boolean: 350ms auto-advance fires after click — same pattern as ordinal questions per `voter.fixture.ts:56`) OR via the nextButton if auto-advance is not wired for boolean/categorical. Navigate back to the question via browser-back. Assert the previously-clicked option still shows the selected-state (visual state on the button).

  4. **Voter sees their answer reflected on entity-detail.** Navigate to results → open candidate Alpha's entity-detail drawer → scroll to the QSPEC question row → assert BOTH the voter's answer row AND candidate Alpha's answer row are visible with appropriate state. Reuses the `voter-detail.spec.ts` pattern (E2E-05 4-case fixture pattern from Phase 74 P05); BUT QSPEC-01/02 only asserts case (a) "both answered" — the 4-case matrix is E2E-05's territory.

  **Voter answer pre-state:** QSPEC specs DO NOT use the `answeredVoterPage` fixture (which clicks Likert by index per `voter.fixture.ts:60` — boolean/categorical answer buttons don't share Likert's locator). Instead each spec starts from a fresh page, walks the voter journey to the target question via `walkToQuestionsIntro(page)` (existing util, used in `voter-questions.spec.ts:54`) + a custom navigation step that clicks "Skip" through the 16 ordinals (mirrors `voter.fixture.ts:81-82` post-loop fallback). Planner may extract a `walkToQuestion(page, sortOrder)` helper at PLAN.md time if both specs need the same navigation path; recommended-but-not-blocking.

### Locator + lint convention

- **D-06 — Inherits Phase 74 D-11.** Role/aria locators by default (`getByRole`, `getByLabel`, `getByText` per `OpinionQuestionInput.svelte` button structure); `getByTestId('opinion-question-input')` only as a SCOPE wrapper with inline `// reason:` annotation per Phase 74 D-11 + Phase 73 IN-03 convention. The post-Phase-73 `playwright/no-raw-locators` lint rule at `'error'` is non-negotiable; both new specs MUST pass `yarn lint:check` clean.

  Concrete pattern (boolean spec example):
  ```ts
  // reason: scope to the opinion-question-input container avoids ambiguity
  // when both the voter's answer surface and the entity-detail row both
  // render "Yes"/"No" button text in the DOM. Container-scoped role locators
  // are preferred over global page-level role locators here.
  const input = page.getByTestId('opinion-question-input');
  await input.getByRole('button', { name: t('common.answer.yes') }).click();
  ```

### Determinism contract + parity-gate regen

- **D-07 — Determinism contract (ROADMAP SC #4):** Inherits Phase 74 D-09 verbatim. All new specs MUST pass 3× cold-start `--workers=1` identically per the Phase-73 gate shape. New specs are EXPECTED to land in `PASS_LOCKED`; any new spec that lands in `DATA_RACE` requires per-test rationale in `75-VERIFICATION.md` (per Phase 73 D-02 + D-09 + Phase 74 D-09 pattern — env-gated, infrastructure flake, deferred bug). The Phase-73-locked `DATA_RACE` pool (15 imgproxy-tied infrastructure flakes) MUST NOT grow.

- **D-08 — Parity-script constants regen — conditional.** Re-run `tests/scripts/diff-playwright-reports.ts` constants regen (via Phase 73 P06 `regen-constants.mjs` per Phase 74 D-10 source map) **only if**:
  - New tests are added to the baseline (BOTH specs add new test IDs — REGEN IS EXPECTED for the +N new PASS_LOCKED entries), OR
  - The cold-start pass/fail set changes for any pre-existing test.

  No new variant projects in Phase 75 (D-02 declines that path), so the variant-project trigger from Phase 74 D-10 doesn't fire. Plan 02 verification step decides if regen is needed.

  **IMGPROXY_TIED_TITLES safety (CONTEXT 73 D-09 / CONTEXT 74 D-10):** The new specs do NOT touch entity-detail drawer image-upload paths or candidate-list image rendering surfaces — boolean/categorical opinion questions render text-only choice buttons. The `IMGPROXY_TIED_TITLES` list at `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` is NOT a concern for Phase 75 spec names. Planner verifies at PLAN.md time before authoring.

### Vite-cache wipe + end-of-phase gate

- **D-09 — Vite-cache wipe is mandatory before the 3-run smoke.** Plan 02's verification gate MUST start with `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` per the v2.8-close gotcha (`.planning/milestones/v2.8-MILESTONE-AUDIT.md` §"Bundled Manual Smoke") + Phase 73 P06 recipe + Phase 74 D-12 inheritance. The v2.9 Phase 78 / CLEAN-01 `dev:clean` script is the durable form; Phase 75 uses the imperative recipe directly (don't wait for CLEAN-01).

### Plan order + dependency direction

- **D-10 — Plan 01 → Plan 02 strict serial.** Plan 01 modifies `packages/dev-seed/src/templates/e2e.ts` + Alpha's `answersByExternalId` + adds a new question category — these are dev-seed template changes that Plan 02's categorical spec runs against. Plan 02 verification gate exercises BOTH new specs in the 3-run smoke + parity-script regen. Plan 02 CANNOT run before Plan 01 lands (boolean spec depends on boolean question existing in the seed). NO parallelization within Phase 75.

  Parallel-with-other-phases is independent: Phase 75 runs in parallel with Phases 76 / 77 (per ROADMAP line 199) — those phases touch different surfaces (candidate profile + a11y in 76; settings matrix in 77).

### Claude's Discretion

- **`walkToQuestion(page, sortOrder)` extraction.** Planner's call at PLAN.md time. If both Plan 01 + Plan 02 use the same navigation walk (skip through 16 ordinals, land at sort N), extraction to `tests/tests/utils/voterNavigation.ts` (alongside existing `walkToQuestionsIntro`) is recommended. RECOMMENDED but not blocking.
- **Whether Plan 01 vs. Plan 02 holds the dev-seed e2e template diff.** Default: Plan 01 ships the boolean addition (because QSPEC-01 needs it); Plan 02 reuses the existing categorical at sort 17. Alternative: bundle both seed changes into a Plan 00 "fixture preparation" — REJECTED, the 1-row boolean diff doesn't warrant a dedicated plan.
- **Whether QSPEC-01 / QSPEC-02 use the same spec file (bundled `voter-question-rendering.spec.ts`) or split files.** Default: split (per D-04 naming). Alternative: 1 bundled spec with two `test()` blocks. Split is cleaner for the dedup audit (D-04) AND for the per-spec assertion-shape contract (D-05). REJECT bundling.
- **Whether the boolean question's `category` should reuse `test-category-info` or add a new `test-category-boolean`.** Default: NEW category `test-category-boolean` (analogous to Phase 74 P05 `test-category-directional`). Reusing `test-category-info` is REJECTED — `test-category-info` is the info-question category (txt-typed `test-question-text`); folding a boolean opinion question into it would conflate categories. Adding a new category mirrors the directional pattern and keeps category semantics clean.
- **Whether Plan 02 verification produces a separate `75-VERIFICATION.md` OR folds the verification appendix into Plan 02's SUMMARY.md.** Default: separate `75-VERIFICATION.md` (mirrors Phase 73 + Phase 74 verification structure — STATE.md references `74-VERIFICATION.md` by name, so the project convention is a phase-level VERIFICATION.md). Phase 75 produces `75-VERIFICATION.md` at Plan 02 close.

### Folded Todos

None folded. All 23 keyword-matched todos surfaced by `gsd-sdk query todo.match-phase 75` are routed to OTHER phases per `.planning/STATE.md §"Deferred Items"` — same disposition as Phase 74. See "Reviewed Todos" under `<deferred>` for the full audit.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 75 anchors (REQUIREMENTS / ROADMAP / STATE / PROJECT)

- `.planning/REQUIREMENTS.md:58-60` — QSPEC-01 + QSPEC-02 locked success criteria; the per-requirement-ID contract.
- `.planning/ROADMAP.md:197-207` — Phase 75 goal + dependencies + 4 success criteria + plan estimate (~2 plans).
- `.planning/STATE.md:152-159` — v2.9 plan-count estimate table (Phase 75 row: "2 plans — small + focused").
- `.planning/PROJECT.md:40-65` — v2.9 milestone framing + 6-phase shape; Phase 75 is one of the 4 coverage phases that run in parallel after Phase 73.

### Inputs to Phase 75

- `.planning/notes/2026-05-10-v2.9-e2e-coverage-inventory.md` — operator framing of the question-rendering coverage gap (QSPEC slice).

### Pattern references (Phase 73 — determinism contract + tooling)

- `.planning/phases/73-determinism-baseline/73-CONTEXT.md` D-01..D-10 — binding determinism contract Phase 75 inherits (3-run `--workers=1` cold-start identical pass/fail; per-test rationale for any DATA_RACE entry; vite-cache wipe recipe).
- `.planning/phases/73-determinism-baseline/73-VERIFICATION.md` — verdict + 5/5 PASS table + 3-run SHA-identity (`e2e56e73fa42...` × 3) + parity-gate output. The Phase-73-locked baseline contract Phase 75 MUST preserve.
- `tests/scripts/diff-playwright-reports.ts` — parity-script restored in Phase 73 P06 (CONTEXT D-08). Phase 75 P02 invokes it for the verification gate (per D-08).
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs` — one-shot constants regenerator; bind-source if Phase 75 needs constants regen for the +N new PASS_LOCKED entries.

### Pattern references (Phase 74 — direct precedent for spec-authoring + fixture extension)

- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` D-07 — voter-answer 4-case fixture extension pattern (E2E-05 / E2E-07). Phase 75 P01's boolean-question addition follows the SAME shape: extend `e2e.ts` `questions.fixed[]` + add candidate Alpha's answer cell + no new variant template.
- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` D-04 — PASS-WITH-DEFERRAL precedent for E2E-01 single-locale. Phase 75 D-03 mirrors this pattern for multi-choice categorical (deferred because the render path doesn't exist in the product).
- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` D-11 — role/aria locator convention + inline `// reason:` for `getByTestId` usage. Phase 75 D-06 inherits.
- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` D-12 — vite-cache wipe recipe before 3-run smoke. Phase 75 D-09 inherits.
- `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md` — Phase 74 verdict shape (GREEN-WITH-DEFERRAL); Phase 75's `75-VERIFICATION.md` follows the same structure.

### Question-rendering surface (Phase 75 will assert against)

- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` — voter opinion-question render dispatch. Lines 33: imports `isBooleanQuestion` + `isSingleChoiceQuestion` from `@openvaa/data`. Lines 72-75: `booleanChoices` derived list (no/yes order, `common.answer.no` + `common.answer.yes` i18n keys). Lines 89-99: single-choice branch dispatches to `QuestionChoices`. Lines 100-111: boolean branch dispatches to `QuestionChoices` with `booleanChoices`. Line 113: error fallback for unsupported types (= multi-choice today, per D-03). Phase 75 specs assert against the rendered output of this component.
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` — renders the actual choice buttons. The role/aria assertion targets (`getByRole('button', { name: ... })`) live here.
- `packages/data/src/utils/typeGuards.ts:32` — `isBooleanQuestion` type guard. Phase 75 specs depend on the boolean question's `objectType === OBJECT_TYPE.BooleanQuestion` flowing through this guard correctly.
- `packages/data/src/utils/typeGuards.ts:41-47` — `isSingleChoiceQuestion` type guard (covers `SingleChoiceCategoricalQuestion` + `SingleChoiceOrdinalQuestion`). Phase 75 P02 spec depends on `test-question-directional-1`'s singleChoiceCategorical type flowing through this guard.
- `packages/data/src/utils/typeGuards.ts:53-55` — `isMultipleChoiceQuestion` type guard. NOT consumed in Phase 75 (multi-choice deferred per D-03); referenced here so the deferred follow-up todo knows the guard exists for when multi-choice render is added.

### Dev-seed surface (Phase 75 will modify in P01)

- `packages/dev-seed/src/templates/e2e.ts:298` — §4.1 exclusion comment ("EXCLUDED: test-question-date, test-question-number, test-question-boolean — zero grep hits in specs"). Phase 75 P01 re-opens the boolean exclusion (it's no longer "zero grep hits" once QSPEC-01 lands). Comment to be updated at P01 close.
- `packages/dev-seed/src/templates/e2e.ts:518-532` — `test-question-directional-1` reference shape for the new boolean question (Phase 74 P05 directional pattern; P01 mirrors the shape with type:'boolean' + new category + Alpha answer cell).
- `packages/dev-seed/src/templates/e2e.ts:566-596` — `test-candidate-alpha.answersByExternalId` reference shape. P01 adds `'test-question-boolean-1': { value: true }` here.
- `packages/dev-seed/src/templates/defaults/questions-override.ts:53` — "boolean: no choices (QuestionsGenerator pattern — boolean is schema-free)" — the boolean schema-free shape canon. P01 inherits.
- `packages/dev-seed/src/emitters/answers.ts:54-95` — answer-emitter dispatch table; `boolean` falls back to `defaultRandomValidEmit` per D-57-10. NOT modified by Phase 75 (e2e template provides hand-authored boolean answers; the emitter is for the latent path).

### Spec hosts (Phase 75 may extend / colocate)

- `tests/tests/specs/voter/voter-matching.spec.ts` — the dedup-audit anchor per D-04. Lines 40-43 filter `singleChoiceOrdinal` expecting 8 from defaultDataset; line 137 cross-references the directional question (Phase 74 P05); line 169 navigates to question 17. Phase 75 specs DO NOT duplicate these assertions.
- `tests/tests/specs/voter/voter-detail.spec.ts` — voter-vs-entity row rendering pattern (E2E-05 + E2E-07 host). Phase 75 P01/P02 entity-detail mirror assertion (D-05 step 4) reuses this spec's pattern.
- `tests/tests/specs/voter/voter-questions.spec.ts` — QUESTIONS-INTRO category-selection surface. NOT a Phase 75 host (different scope). Referenced because `walkToQuestionsIntro` util is used in Phase 75.
- `tests/tests/utils/voterNavigation.ts` — `walkToQuestionsIntro` helper; potential host for new `walkToQuestion(page, sortOrder)` helper per Claude's Discretion.
- `tests/tests/fixtures/voter.fixture.ts` — `answeredVoterPage` fixture (NOT used by Phase 75 specs; Likert-indexed clicks don't apply to boolean/categorical). Phase 75 specs use fresh page + manual navigation.

### Project-level conventions

- `CLAUDE.md` §"Development Commands" + §"Single Test Development" — `yarn test:e2e` invocation contract.
- `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — Phase 75 specs assert against components that read voter-context; if the destructuring-rule hazard surfaces, the canonical anchor is here.
- `tests/eslint.config.mjs` — post-Phase-73 lint config with 7 `playwright/*` rules at `'error'`. All new specs MUST pass `yarn lint:check`.
- `tests/playwright.config.ts:43-50` — `timeout: 90000`; `fullyParallel: true`; `workers: process.env.CI ? 1 : 6`. New specs honor these.
- `.planning/STATE.md:127-135` — Phase 74 plan-by-plan notes; line 130 specifically calls out the Skip-Next fallback + out-of-range guard that Phase 75 P01 leverages (boolean question at sort 18 navigates through the same fallback).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`OpinionQuestionInput.svelte` boolean branch (lines 100-111).** The v2.6 Phase 61 2-button radio shape with `common.answer.{no,yes}` i18n keys. Phase 75 P01 spec asserts against the rendered output of this branch.
- **`OpinionQuestionInput.svelte` single-choice branch (lines 89-99).** Dispatches `SingleChoiceCategorical` / `SingleChoiceOrdinal` to `QuestionChoices`. Phase 75 P02 spec asserts against the categorical render path.
- **`test-question-directional-1`** in `e2e.ts:518-532` — EXISTS in the seed today (added Phase 74 P05). singleChoiceCategorical, 3 choices, sort 17, required:false. Phase 75 P02 spec reuses this question — no new seed data needed for categorical.
- **`test-question-text`** (info text question) in `e2e.ts:407-416` — exists pattern reference for info-vs-opinion question distinction; NOT touched by Phase 75 but illustrates the category split.
- **`walkToQuestionsIntro(page)`** helper at `tests/tests/utils/voterNavigation.ts` — used in `voter-questions.spec.ts:54`. Phase 75 specs start the journey here.
- **`voter-detail.spec.ts` E2E-05 4-case fixture pattern** (Phase 74 P05 added) — the entity-detail mirror assertion shape (D-05 step 4) reuses this; QSPEC specs assert case (a) "both answered" only.
- **`testIds.voter.questions.nextButton` + `answerOption`** at `tests/tests/utils/testIds.ts` — testId map for voter-questions controls. Phase 75 may extend this map with new boolean-question-specific entries IF role/aria locators alone surface ambiguity (per D-06 — preferred path is role/aria).
- **Role-based locators on `QuestionChoices` buttons** — boolean: `getByRole('button', { name: t('common.answer.yes') })`; categorical: `getByRole('button', { name: 'Option B' })`. Pattern matches Phase 74 P04 locator strategy.

### Established Patterns

- **3-run determinism gate** (v2.6 P64 + Phase 73 SC #4 + Phase 74 D-09): single fresh `yarn dev:reset-with-data && yarn test:e2e --workers=1` followed by 2 re-runs without resetting; identical pass/fail set across all 3 runs is the gate. Phase 75 P02 runs this gate at end of phase (per D-07 + D-09).
- **Per-spec investigative pass** (v2.6 P64 D-11 + Phase 74 D-13): rewrite + race-fix in one go; produces a deterministic test contract per spec.
- **Inline `// reason:` justification for accepted lint warnings or test-id usage** (v2.8 P70 Cat A / v2.8 P71 D-04 / Phase 73 D-07 / Phase 74 D-11): the canonical shape. Phase 75 specs follow this convention.
- **Single-question seed extension at base e2e template** (Phase 74 P05 directional question pattern): add to `questions.fixed[]` at next sort_order; add candidate Alpha's answer cell; required:false to keep `answeredVoterPage` fixture unaffected; mirror this pattern for the boolean question (per D-02).
- **PASS-WITH-DEFERRAL pattern for unimplemented render paths** (Phase 74 D-04 E2E-01 single-locale precedent): when a SC clause requires a render path that doesn't exist in the product, defer with a `.planning/todos/pending/` follow-up that scopes the missing capability. Phase 75 D-03 mirrors this for multi-choice categorical.

### Integration Points

- **`packages/dev-seed/src/templates/e2e.ts`** — Phase 75 P01 modifies (1 new question + 1 new category + 1 new Alpha answer cell). Requires `yarn build @openvaa/dev-seed` after edit. `tests/scripts/diff-playwright-reports.ts` constants may need regen per D-08.
- **`tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts`** — NEW file (P01).
- **`tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts`** — NEW file (P02).
- **`tests/tests/utils/voterNavigation.ts`** — POSSIBLY extended with `walkToQuestion(page, sortOrder)` per Claude's Discretion.
- **`tests/scripts/diff-playwright-reports.ts`** — Plan 02 invokes for the verification gate.
- **No changes to:** `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` (Phase 75 asserts against existing render paths; multi-choice render is deferred per D-03). `packages/data/src/` (type guards already exist). `packages/matching/` (matching contract is asserted by `voter-matching.spec.ts` + matching unit tests, NOT by Phase 75 specs per D-04).

</code_context>

<specifics>
## Specific Ideas

- **Boolean spec walk:** Fresh page → `walkToQuestionsIntro(page)` → start questions → Skip the 16 ordinals (loop `getByTestId(testIds.voter.questions.nextButton).click()` × 16) → land at sort 17 (categorical, skip) → land at sort 18 (boolean) → assert input renders ("Yes" / "No" buttons via role) → click "Yes" → auto-advance OR click nextButton → navigate to results → open Alpha's entity-detail → assert both rows show "Yes" for the boolean question.
- **Categorical spec walk:** Fresh page → walk → Skip 16 ordinals → land at sort 17 (categorical) → assert input renders (Option A/B/C buttons via role) → click "Option B" → auto-advance OR click nextButton → skip the boolean → navigate to results → open Alpha's entity-detail → assert both rows show "Option B" for the categorical question. NOTE: Alpha's categorical answer is `value: 'b'` per Phase 74 P05 — confirm at PLAN.md time by re-reading `e2e.ts` after P01 lands.
- **Entity-detail mirror locator pattern:** Reuse `voter-detail.spec.ts` pattern from E2E-05 / E2E-07 (Phase 74 P05). Specifically the `getByRole('meter', { name })` locator pattern that Phase 74 P05 introduced (STATE.md line 129) — although QSPEC-01/02 may not use `meter` (that's for SubMatch breakdowns); the analogous role for boolean/categorical answer rows is `getByRole('listitem', ...)` or `getByRole('row', ...)` depending on the DOM structure. Planner confirms at PLAN.md time.
- **Dedup-audit checklist (per D-04 step 2):**
  - QSPEC-01: grep `packages/matching/src/**/*.test.ts` for `BooleanQuestion` matching assertions — these are matching-algorithm tests, NOT user-flow tests. QSPEC-01 asserts render + flow, not matching distance. The contract split is honest.
  - QSPEC-02: grep `voter-matching.spec.ts` for `singleChoiceCategorical` / `directional` assertions — Phase 74 P05's E2E-07 covers the SubMatch / per-category breakdown; QSPEC-02 covers ONLY the input + flow per ROADMAP line 203. The contract split is honest.
- **Skip-Next fallback at sort 17 + 18:** Phase 74 P05 added Skip-Next fallback in `voter-matching.spec.ts navigateToResults` + out-of-range guard in `voter-journey.spec.ts answerRemainingUntilResults` (STATE.md line 130). Phase 75 P01 adds the boolean question at sort 18 — confirm the fallback handles sort 18 without modification. Likely yes (the fallback is sort-agnostic — it skips any non-Likert question encountered). Planner verifies at PLAN.md time.
- **i18n key sourcing for `common.answer.{no,yes}`:** Confirmed present in en/fi/sv/da per `OpinionQuestionInput.svelte:69` comment. The spec assertion uses `t('common.answer.yes')` via the imported i18n helper — spec-side translation lookup mirrors the candidate-translation spec pattern from Phase 74 P01 (E2E-01). Planner: import the i18n surface the same way Phase 74 P01 did.
- **Variant project NOT needed:** Phase 75 runs against the base `voter-app` Playwright project (not a new variant). No new `data-setup-*` setup file; no new project entry in `tests/playwright.config.ts`. This is the smallest-possible-fixture-shape footprint per D-02.
- **Planner re-baseline at PLAN.md time:** Re-run `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=html` (or equivalent) at Phase 75 start to confirm the Phase 74 baseline holds (`STATE.md` records Phase 74 close as GREEN-WITH-DEFERRAL; DATA_RACE preserved at 15). If baseline drifted, surface as a Phase 75 blocker before authoring specs. Mirrors Phase 74 specifics last item.

</specifics>

<deferred>
## Deferred Ideas

- **QSPEC-02 multi-choice categorical variant** (D-03) — captured as new `.planning/todos/pending/` entry at phase close: add `MultipleChoiceCategoricalQuestion` branch to `OpinionQuestionInput.svelte` (component capability addition + matching dispatch verification + dev-seed answers-emitter support across opinion answers); spec asserts multi-choice render + voter checks N choices + answer persists + entity-detail mirror. Phase 75 PASS-WITH-DEFERRAL on ROADMAP SC #2.
- **`walkToQuestion(page, sortOrder)` extraction** — if Plan 01 + Plan 02 both use the same skip-walk pattern, extract to `tests/tests/utils/voterNavigation.ts`. Recommended-but-not-blocking; planner's call.
- **E2E-05 / E2E-07 4-case extension for boolean question** — out of Phase 75 scope. QSPEC-01 asserts only case (a) "both answered" for the boolean question (D-05 step 4). The full 4-case matrix for boolean (a-d cases like E2E-05 has for ordinal) is a separate concern — not in v2.9 scope. If it becomes a follow-up gap, future milestone.
- **Per-category match SubMatch for categorical questions** — covered by E2E-07 (Phase 74 P05); Phase 75 explicitly excluded per ROADMAP line 203 ("Per-category match breakdown is NOT asserted here — that's E2E-07's responsibility").
- **`answeredVoterPage` fixture extension to handle non-Likert questions** — Phase 75 specs use fresh page + manual navigation (D-05 voter-flow pre-state). The fixture's Likert-only locking is a separate concern tracked in `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` (operator-locked Path B for Phase 78 / CLEAN-05). NOT a Phase 75 concern.
- **i18n wrapper tightening (CLEAN-04)** — Phase 78. The boolean spec's `t('common.answer.yes')` lookup uses the current wrapper; after Phase 78 lands, the existing QSPEC-01 spec re-validates against the tightened wrapper (same Order-B rationale as Phase 74 E2E-08 / D-06).
- **`58-E2E-AUDIT.md` addendum for the boolean question + new category** — recommended-but-not-blocking. The audit anchors external_id / display-text contracts; P01's new question + category should be added to the audit at P01 close OR at Plan 02 close. Planner's call.
- **`tests/scripts/diff-playwright-reports.ts` permanent home + CI integration** — out of scope; the script is restored at HEAD per Phase 73 P06 and is invoked manually per Plan 02. Same disposition as Phase 74 deferred list.

### Reviewed Todos (not folded)

All 23 keyword-matched todos surfaced by `gsd-sdk query todo.match-phase 75` are routed to OTHER phases per `.planning/STATE.md §"Deferred Items"`. Folding any of them into Phase 75 would create scope conflict — same disposition as Phase 74's reviewed-todos audit.

- `2026-04-25-normalise-app-shared-paradigm.md` (score 0.9) — already resolved by v2.8 Phase 72 SHARED-01/02. Stale; surface for removal from `.planning/todos/pending/` at v2.9 close.
- `2026-04-25-remove-mergesettings-reexports.md` (score 0.7) — already resolved by v2.8 P72. Stale; same disposition.
- `2026-04-27-extend-e2e-filter-type-coverage.md` (score 0.6) — Phase 77 / SETTINGS-01. Folded there.
- `2026-04-30-alliance-tab-rendering-and-sections-config.md` (score 0.6) — Phase 69 ALLIANCE-01 territory; already shipped. Stale.
- `2026-05-08-cleanup-65-01-bind-rationale-comments.md` (score 0.6) — v2.8 P70 BIND-01 territory; already shipped. Stale.
- `2026-05-09-tighten-i18n-wrapper.md` (score 0.6) — Phase 78 / CLEAN-04 (paired with E2E-08 + retroactive QSPEC-01 re-validation per Order B).
- `2026-05-10-d04-per-cast-reason-distribution.md` (score 0.6) — Phase 78 / CLEAN-03 sub-finding 1.
- `2026-05-10-getroute-setstore-cast-cleanup.md` (score 0.6) — Phase 78 / CLEAN-03 sub-finding 2.
- `2026-05-10-redirect-unlocated-voter-to-selectors.md` (score 0.6) — Phase 78 / CLEAN-02.
- `2026-05-11-e2e-01-single-locale-runtime-override.md` (score 0.6) — Phase 74 D-04 deferral; future runtime-override capability. NOT Phase 75.
- `2026-05-11-voter-fixture-heterogeneous-question-types.md` (score 0.6) — Phase 78 / CLEAN-05 (Path B locked, `--likert-only` seed modifier). NOT Phase 75 (Phase 75 specs work around the fixture's Likert-only loop by using fresh page + manual navigation per D-05).
- `adapter-package-loading.md` (score 0.6) — not v2.9.
- `frontend-project-id-scoping.md` (score 0.6) — v2.10 candidate (multi-tenant prep).
- `password-reset-code-method.md` (score 0.6) — Strapi-era leftover.
- `register-page-registrationkey-method.md` (score 0.6) — Strapi-era leftover.
- `results-url-refactor-followups.md` (score 0.6) — v2.10 candidate (sharable URLs).
- `2026-03-28-investigate-migrating-candidate-answer-store.md` (score 0.5) — architectural investigation; future milestone.
- `2026-05-08-results-layout-missing-slot-render-tag.md` (score 0.4) — already resolved by v2.8 Phase 70 WARN-01 (the broader sweep this todo describes shipped). Stale.
- `2026-05-09-claude-md-svelte-warning-accepted-format.md` (score 0.4) — Phase 78 / CLEAN-03 sub-finding 3.
- `2026-05-09-rewrite-parent-answer-imputation.md` (score 0.4) — matching-package internal; future matching-focused milestone.
- `rename-admin-writer.md` (score 0.4) — dev-seed internal API hygiene; low priority, not v2.9.
- `sql-linting-formatting.md` (score 0.4) — CI hygiene; not v2.9.
- `2026-05-10-rename-package-scripts-dev-to-db.md` (score 0.2) — Phase 78 / CLEAN-01.

Remaining lower-score matches are noise — Phase 75 is bounded to QSPEC-01 (Boolean spec) + QSPEC-02 (categorical spec); architectural / cleanup / matching-package work belongs in other phases.

</deferred>

---

*Phase: 75-Question-Rendering Specs*
*Context gathered: 2026-05-11*
