# Phase 77: Settings Matrix + Question-Customization Gap-Fills - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning
**Mode:** `--auto` (single-pass; all gray areas auto-selected; recommended option chosen per question — see DISCUSSION-LOG.md for the audit trail)

<domain>
## Phase Boundary

Add three coverage workstreams to the post-Phase-73 deterministic Playwright baseline:

- **SETTINGS-01 — `appSettings` / `appCustomization` per-toggle E2E matrix.** Extend `candidate-settings.spec.ts` (which currently covers only 5 toggles: access × 3 + `candidateApp.questions.hideHero` + `notifications.candidateApp`) to a parameterized matrix covering the ~28 remaining `dynamicSettings` toggles. Folds `2026-04-27-extend-e2e-filter-type-coverage.md` (filter-type matrix: `EnumeratedFilter` covered via party/nomination filters in `voter-results.spec.ts`; `NumberFilter` / `TextFilter` / categorical-question filters / constituency-based filters / `FilterGroup` AND/OR composition uncovered) as one slice of the broader toggle coverage. Source todo resolves at phase close.
- **SETTINGS-02 — `customData.allowOpen` E2E coverage** (closes v2.0 milestone-notes gap). Variant fixture enables `allowOpen` on a subset of questions. Spec asserts (a) the open-comment UI surfaces on those questions in the voter app, (b) voter can author comment text, (c) comment persists across reload (matching CAND-12 candidate-side persistence pattern).
- **SETTINGS-03 — Per-question visibility + must-answer enforcement.** `hideHero` is already covered (existing CAND-15 in `candidate-settings.spec.ts`). SETTINGS-03 adds variant-fixture coverage for the remaining per-question visibility/required configuration: (a) hidden questions don't render in the voter question flow (per `voterContext.svelte.ts:215-230` filter-by-`customData.hidden`); (b) required-but-unanswered questions block navigation to results (per `candidateContext.svelte.ts:347-368` `profileComplete` derivation — and the analogous voter-side `requiredInfoQuestions` / `unansweredOpinionQuestions` contracts).

Phase 77 is content-heavy spec authoring + variant-fixture authoring on a stable suite — NOT new product behavior, NOT framework migration. Each new spec MUST pass 3× cold-start `--workers=1` identically; the Phase-73-locked DATA_RACE pool MUST NOT grow as a side effect. Phase 73 is a HARD prerequisite (closed 2026-05-11). Phase 74 / 75 already shipped (GREEN-WITH-DEFERRAL). May develop in parallel with Phases 76 / 78.

</domain>

<decisions>
## Implementation Decisions

### Plan grouping + sequence

- **D-01 — 5 plans, verification gate folded into final plan.** ROADMAP estimates "~3-5 plans — SETTINGS-01 likely 2-3 plans given matrix breadth; SETTINGS-02 + SETTINGS-03 likely 1 plan each" (line 233). Auto-selected layout:
  1. **Plan 01 — SETTINGS-01 wave A: toggle matrix for already-spec-hosted concerns.** Extends `candidate-settings.spec.ts` with a parameterized matrix for the remaining toggle cells that share its `SupabaseAdminClient.updateAppSettings()` overlay pattern + serial-mode contract (per scout §2):
     - `access.voterApp` toggle (uncovered analog of `access.candidateApp` CAND-10)
     - `access.adminApp` toggle (uncovered analog)
     - `candidateApp.questions.hideVideo` toggle (uncovered analog of `hideHero` CAND-15)
     - `notifications.voterApp` toggle (uncovered analog of `notifications.candidateApp` CAND-13)
     - `header.showFeedback` + `header.showHelp` toggles (uncovered analogs of help/privacy CAND-14)
     - `elections.showElectionTags` toggle
     - `entities.showAllNominations` + `entities.hideIfMissingAnswers[Candidate]` toggles

     Pattern: each cell follows the `SupabaseAdminClient.updateAppSettings({...})` → assert UI surface OR absence → restore in `test.afterAll()` shape that CAND-10/11/13/15 already establish. Parameterized over the cell array; each cell asserts the BINARY toggle effect (on vs. off) via role/aria locators.
  2. **Plan 02 — SETTINGS-01 wave B: filter-type matrix (folds `2026-04-27-extend-e2e-filter-type-coverage.md`).** Adds filter-type-specific E2E coverage that extends `voter-results.spec.ts` (or splits into `voter-results-filters.spec.ts` per Claude's Discretion in D-08 below). Per scout §3 the uncovered surface is:
     - **`NumberFilter`** — needs a numeric Question (e2e fixture's questions are predominantly Likert-ordinal + 1 categorical + 1 boolean + 1 text per Phase 74 P05 + Phase 75 P01 extensions). Plan 02 EXTENDS `e2e.ts` with a numeric-typed Question (mirrors Phase 74 P05 directional + Phase 75 P01 boolean extensions). Alpha gets a number answer cell.
     - **`TextFilter`** — `test-question-text` already EXISTS at `e2e.ts:407-416` (per Phase 75 D-07 / scout reference). Spec asserts TextFilter narrows + resets.
     - **Categorical-question filter** — `test-question-directional-1` (singleChoiceCategorical, sort 17, added in Phase 74 P05) already EXISTS. Spec asserts the categorical-question filter UI surfaces + narrows entity list by chosen category.
     - **Constituency-based filter** — exists in the constituency-variant project; Plan 02 adds a NEW filter-assertion block in `variant-constituency.spec.ts` (additive, doesn't modify the existing CONF-03 invariants).
     - **`FilterGroup` AND/OR composition** — toggle ≥2 filters at once + assert the AND semantics narrow further than each filter alone; toggle the same filter group's OR-mode (if exposed in UI) + assert OR widens. If OR-mode is not exposed in voter UI, capture as DEFERRED-WITH-RATIONALE in `<deferred>`.
     - **`MISSING_FILTER_VALUE` sentinel** — assert the "filter-out entities missing this answer" surface (per `@openvaa/filters` rules system; rules `exclude` + `include` + `min` + `max` + `MISSING_FILTER_VALUE`). Spec asserts toggle behavior.

     Pattern: extend OR new spec file under `tests/tests/specs/voter/`. The source todo `2026-04-27-extend-e2e-filter-type-coverage.md` is folded into Plan 02 (per Folded Todos below); the todo resolves at Plan 02 close.
  3. **Plan 03 — SETTINGS-02 (`customData.allowOpen`).** NEW `variant-allowopen.ts` (per D-04): overlay enables `customData.allowOpen: true` on a SUBSET of questions (NOT all — the spec asserts the differential render: questions with `allowOpen: true` show the open-comment input; questions with `allowOpen: false` do NOT). The e2e template already carries `allowOpen: true` on test-question-1 through test-opinion-question-6 (per scout §4 + `e2e.ts:318,331,343,355,367,380,392,404,416`), so the variant overlay is straightforward: confirm the existing 6 questions carry it, OR mutate a subset for differential assertion.

     New spec at `tests/tests/specs/voter/voter-allowopen.spec.ts`:
     - Walk voter to a question with `allowOpen: true` → assert the `QuestionOpenAnswer.svelte` `<Expander>` UI renders → type text X → save → reload page → assert text X persists in `Answer.info` field (per `apps/frontend/src/lib/components/questions/QuestionOpenAnswer.svelte:1-50` + `packages/data/src/objects/questions/base/answer.type.ts` `info?: string | null`).
     - Walk to a question with `allowOpen: false` → assert the open-comment surface does NOT render.

     Persistence mechanism: voter `Answer.info` is stored via `answerStore.setAnswer(questionId, value)` → user session/Supabase. CAND-12 already covers the candidate-side persistence; SETTINGS-02 covers the voter-side persistence per ROADMAP SC #2.
  4. **Plan 04 — SETTINGS-03 (visibility + must-answer).** NEW `variant-hidden-required.ts`: overlay flags `customData.hidden: true` on 1+ Question and `customData.required: true` on 1+ info Question. Two separate assertion surfaces:
     - **Hidden questions don't render in voter flow.** Spec walks voter through the question flow → asserts the hidden Question's `external_id` is absent from the DOM (`expect(page.locator(...)).toHaveCount(0)`). The voter-context filter at `voterContext.svelte.ts:221,226` (`.filter((q) => !(q.customData as CustomData['Question'])?.hidden)`) is the implementation Phase 77 asserts against.
     - **Required-but-unanswered blocks results navigation.** Spec walks candidate (or voter — see D-09 sub-decision) through the answer flow → leaves a required info Question unanswered → asserts the results / submit CTA is disabled OR the navigation is blocked. The candidate-context derivation at `candidateContext.svelte.ts:347-368` (`profileComplete = unansweredRequiredInfoQuestions.length === 0 && unansweredOpinionQuestions.length === 0`) is the implementation Phase 77 asserts against. NOTE: this is a CANDIDATE-side surface today (per scout §5 — `unansweredRequiredInfoQuestions` lives in `candidateContext.svelte.ts`). The voter-side analog (`requiredInfoQuestions` / `unansweredOpinionQuestions` in `voterContext.svelte.ts`) controls voter-results navigation; SETTINGS-03 covers BOTH sides per CLAUDE.md's mention.

     New spec at `tests/tests/specs/voter/voter-visibility-required.spec.ts` (voter-side) + `tests/tests/specs/candidate/candidate-required-info.spec.ts` (candidate-side) — OR bundled as `tests/tests/specs/variants/visibility-required.spec.ts` per Claude's Discretion (D-09). Default: split per role for clarity.
  5. **Plan 05 — Verification gate.** Same shape as Phase 74 P07 / Phase 75 P02b / Phase 76 P04. Runs vite-cache wipe + 3-run cold-start `--workers=1` smoke + parity-script self-identity smoke + conditional constants regen. Produces `77-VERIFICATION.md`.

  Risks:
  - **Plan 01 + Plan 02 are SETTINGS-01's two slices.** If toggle-matrix breadth exceeds Plan 01's per-plan ceiling, planner may further split Plan 01 into 01a (access + maintenance + notifications cluster) + 01b (results + entity-display + header cluster). Default: 1 bundled Plan 01.
  - **Plan 02 filter-type matrix may exceed per-plan ceiling.** The MISSING_FILTER_VALUE assertion + FilterGroup AND/OR composition are the heaviest sub-cases. Planner may split into 02a (single-filter narrowing — NumberFilter, TextFilter, categorical, constituency) + 02b (FilterGroup AND/OR + MISSING_FILTER_VALUE). Default: 1 bundled Plan 02.

### Variant fixture strategy

- **D-02 — `variant-allowopen.ts` for SETTINGS-02 (per D-04 below).** NEW variant template. Follows the canonical shape of `variant-multi-election.ts` per scout §6:
  ```ts
  import { mergeSettings } from '@openvaa/app-shared';
  import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
  const base = BUILT_IN_TEMPLATES.e2e;
  if (!base) throw new Error('e2e template missing');
  export const variantAllowopen: SeedTemplate = {
    ...base,
    app_settings: { settings: mergeSettings(E2E_BASE_APP_SETTINGS, { /* no setting overlay needed — allowOpen is per-question customData */ }) },
    questions: { fixed: base.questions.fixed.map(q => /* mutate customData.allowOpen on a subset */) },
  };
  ```
  Plan 03 may opt to NOT create a new variant if the existing e2e default carries `allowOpen: true` on enough questions for the differential assertion to land directly in the base `voter-app` Playwright project. RECOMMENDED: dedicated variant for clarity; falls back to base if the audit at Plan 03 start confirms the differential is asserter-able against defaults.

- **D-03 — `variant-hidden-required.ts` for SETTINGS-03.** NEW variant template. Same shape — overlay sets `customData.hidden: true` on at least 1 Question and `customData.required: true` on at least 1 info Question, with Alpha's answers structured so the unanswered-required cell remains unanswered.

- **D-04 — NO new variant for SETTINGS-01.** SETTINGS-01 Plan 01 wave A toggles are applied via `SupabaseAdminClient.updateAppSettings()` at TEST-TIME (not via variant template) — matching the existing CAND-10/11/13/15 pattern in `candidate-settings.spec.ts`. SETTINGS-01 Plan 02 wave B (filter-type matrix) similarly extends `voter-results.spec.ts` against the default `e2e` template's existing questions (no new variant required since `test-question-text` + `test-question-directional-1` + Phase 74's filter coverage all share the same base template). The new numeric Question (for `NumberFilter`) is added to the default `e2e` template (per Phase 74 P05 + Phase 75 P01 single-template-extension precedent).

### `appSettings` toggle inventory + coverage map

- **D-05 — ~28 uncovered toggles enumerated per scout §1.** Out of ~33 total `dynamicSettings` toggles, candidate-settings.spec.ts covers 5: `access.candidateApp` (CAND-10), `access.underMaintenance` (CAND-11), `access.answersLocked` (CAND-09), `candidateApp.questions.hideHero` (CAND-15), `notifications.candidateApp` (CAND-13). Plus `matching.minimumAnswers` is covered by Phase 74 E2E-02 (variant-low-minimum-answers); `elections.startFromConstituencyGroup` covered by `variant-startfromcg`.

  Phase 77 Plan 01 wave A covers the remaining toggles. Categorization (from scout §1):
  - **Access control trio** — `voterApp`, `adminApp` (uncovered).
  - **Candidate-app questions** — `hideVideo` (uncovered analog of `hideHero`).
  - **Question flow** — `categoryIntros.show`, `categoryIntros.allowSkip`, `interactiveInfo.enabled`, `questionsIntro.show`, `questionsIntro.allowCategorySelection`, `showCategoryTags`, `showResultsLink` (7 toggles, all uncovered).
  - **Matching** — `organizationMatching` enum (uncovered; `minimumAnswers` covered by Phase 74).
  - **Results** — `cardContents`, `sections`, `showFeedbackPopup`, `showSurveyPopup` (4 toggles, all uncovered).
  - **Election** — `disallowSelection`, `showElectionTags` (uncovered).
  - **Entity Display** — `hideIfMissingAnswers`, `showAllNominations` (uncovered).
  - **Header** — `showFeedback`, `showHelp` (uncovered).
  - **Entity Details** — `contents[*]`, `showMissingElectionSymbol[*]`, `showMissingAnswers[*]` (multi-key toggles, all uncovered).
  - **Notifications** — `voterApp` (uncovered analog of `candidateApp`).
  - **Header Styling** — `headerStyle.{dark,light}.{bgColor,overImgBgColor}`, `imgSize`, `imgPosition` — these are NON-TOGGLE (string values + sizing); SCOPE-EXCLUDED from the "per-toggle" matrix per the literal ROADMAP SC #1 ("Enumerate the TOGGLES surfaced by `staticSettings` + `dynamicSettings`").

  **Plan 01 wave A in-scope cells** (matches D-01 list): ~12-15 toggles. **Plan 02 wave B in-scope cells**: 6 filter-type categories. Total: ~18-21 NEW assertion cells; some may bundle as multi-effect-per-cell (e.g., `categoryIntros.show` + `categoryIntros.allowSkip` may assert together as a 2-effect cell).

  **Out-of-scope styling cells** (color / sizing / position): captured in `<deferred>`. Rationale: ROADMAP SC #1 says "TOGGLES", not "all dynamic settings". Color/position changes are visual-regression territory, not functional-toggle territory.

### Filter-type matrix dependency map

- **D-06 — Filter-type matrix needs 1 new fixture question.** Per scout §3:
  - `NumberFilter` requires a Number-typed Question. Plan 02 EXTENDS `e2e.ts` to add `test-question-number-1` (type `'number'`) at sort 19 (after Phase 75's boolean at sort 18). Mirrors Phase 74 P05 + Phase 75 P01 single-row-addition pattern. Alpha gets a number answer cell.
  - `TextFilter` reuses existing `test-question-text` at `e2e.ts:407-416`.
  - Categorical filter reuses `test-question-directional-1` at `e2e.ts:518-532`.
  - Constituency filter exists in `variant-constituency.ts`; Plan 02 adds assertion in `variant-constituency.spec.ts` additively.
  - `FilterGroup` AND/OR composition: in-spec composition (2+ filters toggled simultaneously); no fixture change.
  - `MISSING_FILTER_VALUE`: same — in-spec; no fixture change. Requires at least 1 candidate with MISSING value on the asserted question (Alpha already provides this if other test candidates leave a question unanswered).

  Single-template extension follows Phase 74 D-07 + Phase 75 D-02 precedent. `yarn build @openvaa/dev-seed` required.

### Voter-side allowOpen UI surface

- **D-07 — SETTINGS-02 asserts voter-side persistence (NEW), not candidate-side (covered by CAND-12).** Per scout §4 the voter-side `Answer.info` field has NO existing E2E gate. The `QuestionOpenAnswer.svelte` component renders the open-answer text inside an `<Expander>` (lines 43-50 per scout); the spec asserts:
  1. Open-comment input UI surfaces beneath questions with `customData.allowOpen: true`.
  2. Voter types text X → submits / advances → text X persists in voter session.
  3. Page reload → text X still present (per CAND-12 reload-persistence pattern).
  4. Open-comment input does NOT surface beneath questions with `customData.allowOpen: false`.

  The differential assertion (renders ON allowOpen=true vs. does-NOT-render ON allowOpen=false) requires the variant fixture to carry BOTH states (per D-02 — overlay flips a subset of questions).

  Reverse alternative considered + REJECTED:
  - Test ONLY the renders-when-true case. REJECTED — the differential assertion catches the `allowOpen` gating logic, not just the component existence; the negative case is the actual regression risk if a future refactor makes the open-comment input always-on.

### Visibility + required scope

- **D-08 — SETTINGS-03 covers voter-side hidden + candidate-side required.** Per scout §5:
  - Hidden flag (`customData.hidden`) is consumed in `voterContext.svelte.ts:215-230` (`.filter((q) => !(...).hidden)`) for BOTH `_infoQuestions` and `_opinionQuestions`. The voter-side surface is the natural assertion target.
  - Required flag (`customData.required`) is consumed in `candidateContext.svelte.ts:347-368` (`requiredInfoQuestions` derivation → `profileComplete` boolean → blocks navigation). The candidate-side surface is the natural assertion target for the "must-answer enforcement" SC clause.
  - **Voter-side required:** CLAUDE.md §"Context Destructuring Rule" mentions `requiredInfoQuestions` and `unansweredOpinionQuestions` as voter-context reactive accessors. If the voter context exposes a `profileComplete`-analog gating results navigation, SETTINGS-03 asserts BOTH sides. If the voter app uses a different gating mechanism (e.g., just `minimumAnswers` threshold for opinion questions + per-info-question required), SETTINGS-03 asserts the voter analog explicitly. Planner verifies at Plan 04 start.

  Default split (per D-01 Plan 04 layout): voter-side spec (`voter-visibility-required.spec.ts`) + candidate-side spec (`candidate-required-info.spec.ts`). Alternative: bundled `variants/visibility-required.spec.ts` — REJECTED for clarity (different role contexts; different navigation paths).

### Determinism contract + parity-gate regen

- **D-09 — Determinism contract (ROADMAP SC #4):** All new specs MUST pass 3× cold-start `--workers=1` identically. New specs are EXPECTED to land in `PASS_LOCKED`; any new spec that lands in `DATA_RACE` requires per-test rationale in `77-VERIFICATION.md` (per Phase 73 D-02 / Phase 74 D-09 / Phase 75 D-07 / Phase 76 D-09 pattern). The Phase-73-locked `DATA_RACE` pool MUST NOT grow.

- **D-10 — Parity-script constants regen — conditional.** Re-run `tests/scripts/diff-playwright-reports.ts` constants regen via Phase 73 P06 `regen-constants.mjs` only if:
  - New variant projects are added (Plans 03 + 04 add 2 new variant projects: `variant-allowopen` + `variant-hidden-required`) — each new variant contributes new tests to the parity baseline, which IS a constants-regen trigger (mirrors Phase 74 D-10); OR
  - The cold-start pass/fail set changes for any pre-existing test.

  **IMGPROXY_TIED_TITLES safety** (Phase 74 D-10 / Phase 75 D-08 / Phase 76 D-10 inheritance): Phase 77 specs DO NOT touch entity-detail drawer image-upload paths or candidate-list image rendering surfaces. The filter-type matrix asserts entity LIST narrowing, not entity detail. The allowOpen + visibility + required specs assert against text-based question render paths. Planner verifies at PLAN.md time before authoring.

### Locator + lint convention

- **D-11 — Inherits Phase 74 D-11 / Phase 75 D-06 / Phase 76 D-11a.** Role/aria locators by default; `getByTestId(...)` only as a SCOPE wrapper with inline `// reason:` annotation. The post-Phase-73 `playwright/no-raw-locators` lint rule at `'error'` is non-negotiable. The existing `candidate-settings.spec.ts` uses `page.locator('figure[role="presentation"]')` + `.locator('.overflow-hidden')` (raw selectors at the `hideHero` cell per scout §2) — Phase 77 Plan 01 spec EXTENSIONS should follow the new role/aria convention OR carry an inline `// reason:` if a raw selector is genuinely the only way to assert the toggle's effect. The existing raw locator usage in `candidate-settings.spec.ts` is a PRE-PHASE-73 site and is captured in `73-REVIEW.md` IN-03 (Phase 78 / CLEAN-05 closes that finding); Phase 77's NEW assertions follow the new convention.

### Vite-cache wipe + end-of-phase gate

- **D-12 — Vite-cache wipe is mandatory before the 3-run smoke.** Plan 05's verification gate MUST start with `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` per the v2.8-close gotcha + Phase 73 P06 recipe + Phase 74 D-12 + Phase 75 D-09 + Phase 76 D-11 inheritance. Phase 78 / CLEAN-01 `dev:clean` is the durable form; Phase 77 uses the imperative recipe (Phase 78 has not landed).

### Plan order + dependency direction

- **D-13 — Plans mostly-parallel with some serial.** Plan 01 (toggle matrix) + Plan 02 (filter-type matrix) are INDEPENDENT (different spec hosts + different fixture changes). Plan 03 (allowOpen variant) + Plan 04 (hidden+required variant) are INDEPENDENT of each other AND of Plans 01/02 (different variants, different specs). Plan 05 (verification gate) depends on ALL of 01-04 landed.

  Default order (allowing parallelism): {P01 ∥ P02 ∥ P03 ∥ P04} → P05. Planner may serialize {P03, P04} if `tests/playwright.config.ts` merge conflict risk is non-trivial (both add a new project entry); concrete: P03 lands first (allowOpen), then P04 (visibility-required) rebases on top.

  Parallel-with-other-phases: Phase 77 runs in parallel with Phases 76 + 78 (per ROADMAP line 225); those touch different surfaces (profile + a11y in 76; cleanup in 78).

### Claude's Discretion

- **Plan 02 split into 02a + 02b** if scope exceeds per-plan ceiling — planner's call at PLAN.md time. 02a = single-filter narrowing (NumberFilter, TextFilter, categorical, constituency); 02b = FilterGroup AND/OR + MISSING_FILTER_VALUE.
- **Plan 01 split into 01a + 01b** if matrix breadth exceeds ceiling — planner's call. 01a = access + maintenance + notifications cluster; 01b = results + entity-display + header cluster.
- **SETTINGS-03 split into voter-side spec + candidate-side spec vs. bundled.** Default: split for clarity (D-08). Alternative: bundle into `variants/visibility-required.spec.ts` — Plan 04 author's call based on shared helper opportunities.
- **Whether SETTINGS-02 needs a NEW `variant-allowopen.ts` or asserts against the existing e2e default's allowOpen-enabled questions (per scout §4: existing template already carries `allowOpen: true` on 6 questions).** Default: NEW variant for clarity (differential assertion needs BOTH allowOpen=true AND allowOpen=false in the same fixture). Alternative: assert directly against the default if 1 question carries `false` and 1 carries `true` — confirm at PLAN.md time. RECOMMENDED: variant.
- **`headerStyle.*` color/sizing settings (per D-05 out-of-scope):** Planner may capture as a deferred follow-up todo at phase close — visual-regression coverage of theming. NOT v2.9 scope.
- **Whether to add an explicit OR-mode UI to `FilterGroup` if not currently exposed in the voter results filter UI.** Default: defer (PASS-WITH-DEFERRAL per Phase 74 D-04 / Phase 75 D-03 precedent if the OR surface doesn't exist in the product). Plan 02 captures as follow-up if surfaced.

### Folded Todos

- **`.planning/todos/pending/2026-04-27-extend-e2e-filter-type-coverage.md`** (score 0.6 — explicitly named in ROADMAP line 224 as "folded into SETTINGS-01 as one slice of the toggle coverage"). FOLDED into Plan 02. Original problem: Phase 64 covers 5 voter-results E2E tests using EnumeratedFilter via party/nominate_for; other filter types (NumberFilter, TextFilter, categorical-question, constituency, FilterGroup AND/OR, MISSING_FILTER_VALUE) lack E2E coverage. Phase 77 / SETTINGS-01 Plan 02 addresses each (per D-01 + D-06). Source todo resolves at Plan 02 close.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 77 anchors (REQUIREMENTS / ROADMAP / STATE / PROJECT)

- `.planning/REQUIREMENTS.md` §SETTINGS-01 / SETTINGS-02 / SETTINGS-03 — locked success criteria; the per-requirement-ID contract.
- `.planning/ROADMAP.md` §"Phase 77: Settings Matrix + Question-Customization Gap-Fills" (lines 221-234) — phase goal + dependencies + 4 success criteria + plan estimate.
- `.planning/STATE.md` — v2.9 milestone state; Phase 75 closed 2026-05-12; Phase 77 ready to discuss/plan.
- `.planning/PROJECT.md` §"Current Milestone: v2.9" — milestone framing + 6-phase shape.

### Folded source todo

- `.planning/todos/pending/2026-04-27-extend-e2e-filter-type-coverage.md` — filter-type matrix; folded into Plan 02 (SETTINGS-01 wave B per D-01). Resolves at Plan 02 close.

### Pattern references (Phase 73 — determinism contract + tooling)

- `.planning/phases/73-determinism-baseline/73-CONTEXT.md` D-01..D-10 — binding determinism contract Phase 77 inherits.
- `.planning/phases/73-determinism-baseline/73-VERIFICATION.md` — verdict + 5/5 PASS + 3-run SHA-identity + parity-gate output. Baseline contract Phase 77 MUST preserve.
- `tests/scripts/diff-playwright-reports.ts` — parity-script restored in Phase 73 P06. Phase 77 P05 invokes for verification gate.
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs` — one-shot constants regenerator; bind-source if Phase 77 needs constants regen for new PASS_LOCKED entries.
- `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md:11-32` — IMGPROXY_TIED_TITLES list. Phase 77 verifies at PLAN.md time.

### Pattern references (Phase 74 / 75 / 76 — direct precedents)

- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` D-02 / D-03 — variant template shape + fixture extension pattern. Phase 77 Plans 03 + 04 follow.
- `.planning/phases/74-high-leverage-e2e-coverage/74-CONTEXT.md` D-09..D-13 — determinism contract + parity-gate regen + locator convention + vite-cache wipe + spec file layout. Phase 77 inherits.
- `.planning/phases/74-high-leverage-e2e-coverage/74-VERIFICATION.md` — Phase 74 verdict shape; Phase 77's `77-VERIFICATION.md` follows.
- `.planning/phases/75-question-rendering-specs/75-CONTEXT.md` D-02 / D-04 / D-06 / D-09 — single-template fixture extension + scope-marked filename + role/aria locator + vite-cache wipe. Phase 77 inherits.
- `.planning/phases/76-profile-a11y/76-CONTEXT.md` D-01 / D-09 / D-10 / D-11 — small-phase plan layout + determinism + parity-gate + vite-cache wipe (sibling Phase 76 discussion captures same patterns).

### Settings + filter surface (Phase 77 will assert against)

- `packages/app-shared/src/settings/staticSettings.ts` — `supportedLocales`, `dataAdapter`, `colors`, `font`, `analytics.trackEvents`, `preRegistration.enabled` (NON-toggles; sourced for context — not asserted by Phase 77).
- `packages/app-shared/src/settings/dynamicSettings.ts` — full toggle inventory. Per scout §1 the ~33 toggles enumerated under D-05.
- `packages/app-shared/src/settings/dynamicSettings.type.ts` — TypeScript shape of dynamic settings. Planner imports for type-safe overlay construction in variant templates.
- `packages/app-shared/src/data/customData.type.ts:22-83` — `CustomData['Question']` type. Specifically:
  - line 25-26: `allowOpen?: boolean` (SETTINGS-02 target).
  - line 46: `hidden?: boolean` (SETTINGS-03 target).
  - line 62: `required?: boolean` (SETTINGS-03 target).
- `packages/filters/src/filter/base/filter.ts` — abstract `Filter<TTarget, TValue>` base.
- `packages/filters/src/filter/enumerated/enumeratedFilter.ts` — `EnumeratedFilter` + subclasses (`ChoiceQuestionFilter`, `ObjectFilter`).
- `packages/filters/src/filter/number/numberFilter.ts` — `NumberFilter` + `NumberQuestionFilter`.
- `packages/filters/src/filter/text/textFilter.ts` — `TextFilter` + `TextQuestionFilter` + `TextPropertyFilter`.
- `packages/filters/src/group/filterGroup.ts` — `FilterGroup` AND/OR composition.
- `packages/filters/src/rules/` — `exclude` / `include` / `min` / `max` rules + `MISSING_FILTER_VALUE` sentinel.

### Voter / candidate context consumption (Phase 77 will assert against)

- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:215-230` — `.filter((q) => !(q.customData as CustomData['Question'])?.hidden)` applied to `_infoQuestions` (line 221) + `_opinionQuestions` (line 226). SETTINGS-03 voter-side hidden assertion target.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:347-368` — `requiredInfoQuestions` derivation → `unansweredRequiredInfoQuestions` → `profileComplete` boolean. SETTINGS-03 candidate-side required assertion target.
- `apps/frontend/src/lib/components/questions/QuestionOpenAnswer.svelte:1-50` — `<Expander>` host for open-comment input/display. SETTINGS-02 assertion target.
- `packages/data/src/objects/questions/base/answer.type.ts` — `Answer` shape including `info?: string | null` for open-answer text. SETTINGS-02 persistence assertion reads against this field via voter session.

### Spec hosts (Phase 77 may extend / colocate)

- `tests/tests/specs/candidate/candidate-settings.spec.ts:1-297` — host for SETTINGS-01 Plan 01 wave A toggle matrix. CAND-09 / CAND-10 / CAND-11 / CAND-13 / CAND-14 / CAND-15 patterns at lines 42-79 / 85-113 / 119-146 / 152-197 / 203-222 / 228-296 respectively. New cells extend the existing `test.describe.configure({ mode: 'serial' })` block.
- `tests/tests/specs/voter/voter-results.spec.ts` — host for SETTINGS-01 Plan 02 filter-type matrix extension. Existing coverage: VOTE-08 (entity cards lines 78-95), VOTE-10 (entity tabs lines 97-120), RESULTS-01/02/D-14/D-15/D-13/D-11/D-10 (filter + drawer behavior lines 152-200+).
- `tests/tests/specs/variants/constituency.spec.ts` — host for constituency-based filter assertion (Plan 02). Existing CONF-03 invariants preserved.
- `tests/tests/specs/voter/voter-allowopen.spec.ts` — NEW (Plan 03; SETTINGS-02).
- `tests/tests/specs/voter/voter-visibility-required.spec.ts` — NEW (Plan 04; SETTINGS-03 voter-side).
- `tests/tests/specs/candidate/candidate-required-info.spec.ts` — NEW (Plan 04; SETTINGS-03 candidate-side).

### Variant template shape (Phase 77 will follow + extend)

- `tests/tests/setup/templates/variant-multi-election.ts` — canonical reference for new variant templates (per Phase 74 D-02). Composes `BUILT_IN_TEMPLATES.e2e` + `mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)` + per-row constituency-group/constituency declarations.
- `tests/tests/setup/templates/variant-low-minimum-answers.ts` — additional reference (Phase 74 E2E-02 — minimal-overlay variant per scout §6).
- `tests/tests/setup/templates/variant-constituency.ts` — additional reference (richer constituency/question/category overlay).
- `tests/tests/setup/templates/variant-startfromcg.ts` — additional reference (`elections.startFromConstituencyGroup` overlay).
- `tests/tests/setup/variant-multi-election.setup.ts` — canonical setup-file shape for a variant project.
- `tests/playwright.config.ts` — Playwright project layout + variant project dependency chain. Plans 03 + 04 add 2 new project entries each with `data-setup-allowopen → variant-allowopen` and `data-setup-hidden-required → variant-hidden-required` chains.

### Dev-seed surface (Phase 77 will modify in Plan 02)

- `packages/dev-seed/src/templates/e2e.ts` — base e2e template. Plan 02 adds `test-question-number-1` (type `'number'`) at sort 19 (after Phase 75's boolean at sort 18). Mirrors Phase 74 P05 + Phase 75 P01 single-row-addition pattern.
- `packages/dev-seed/src/templates/e2e.ts:407-416` — `test-question-text` info question; REUSED by Plan 02 for TextFilter assertion.
- `packages/dev-seed/src/templates/e2e.ts:518-532` — `test-question-directional-1` (singleChoiceCategorical); REUSED by Plan 02 for categorical-question filter assertion.
- `packages/dev-seed/src/templates/e2e.ts:318,331,343,355,367,380,392,404,416` — questions with `custom_data: { allowOpen: true }`; the existing 6-question allowOpen surface (per scout §4).
- `packages/dev-seed/src/emitters/answers.ts` — answer-emitter dispatch table; `number` type falls back to `defaultRandomValidEmit` (analogous to boolean per Phase 75 D-02). NOT modified by Phase 77 (e2e template provides Alpha's hand-authored number answer).

### Project-level conventions

- `CLAUDE.md` §"Development Commands" + §"Single Test Development" — `yarn test:e2e` invocation contract.
- `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — `requiredInfoQuestions` / `unansweredOpinionQuestions` / `unansweredRequiredInfoQuestions` mentioned as reactive accessors. SETTINGS-03 asserts against these surfaces.
- `tests/eslint.config.mjs` — post-Phase-73 lint config with 7 `playwright/*` rules at `'error'`. All new specs MUST pass `yarn lint:check`.
- `tests/playwright.config.ts:43-50` — `timeout: 90000`; `fullyParallel: true`; `workers: process.env.CI ? 1 : 6`.

### Admin client + settings overlay tooling

- `tests/tests/utils/supabaseAdminClient.ts` — `updateAppSettings({...})` method used by `candidate-settings.spec.ts` for runtime toggle overlay. Plan 01 wave A spec extension reuses this.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`SupabaseAdminClient.updateAppSettings({...})` overlay pattern** — used by CAND-09/10/11/13/14/15 in `candidate-settings.spec.ts` to apply a toggle at test time and restore in `test.afterAll()`. Plan 01 wave A parameterizes over a cell array using this pattern.
- **`mergeSettings` from `@openvaa/app-shared`** (deep merge) — canonical for variant template overlays per Phase 74 D-02. Plans 03 + 04 use for `variant-allowopen` + `variant-hidden-required`.
- **`baseFixed(table)` helper** in `variant-multi-election.ts` — canonical pattern for variant templates extending the base e2e template's `fixed[]` arrays. Plans 03 + 04 may use if per-row mutation is needed.
- **`E2E_BASE_APP_SETTINGS` from `@openvaa/dev-seed`** — variant overlays compose ON TOP via `mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)` (per `variant-multi-election.ts:35-50`).
- **`page.reload()` + role-based assertion** pattern (`candidate-profile.spec.ts:181-202` CAND-12) — SETTINGS-02 voter-side persistence assertion reuses.
- **`buildRoute({ route, locale })`** (`tests/tests/utils/buildRoute.ts`) — canonical route construction. All Phase 77 specs use.
- **`testIds.voter.results.*` + `testIds.voter.questions.*` maps** (`tests/tests/utils/testIds.ts`) — existing registries. Plan 02 filter-type matrix may extend with filter-type-specific entries if role-based locators alone surface ambiguity (per D-11 — preferred path is role/aria).
- **Existing variant project shape** (Phase 59 + Phase 63): each variant is a Playwright project with `data-setup-<name>` dependency + `variant-<name>` test project, dependency-chained per `tests/playwright.config.ts:1-50`. Phase 77 adds 2 new variant projects (Plans 03 + 04).
- **`QuestionOpenAnswer.svelte` `<Expander>`** — voter-side open-comment surface; SETTINGS-02 asserts against.
- **`answerStore.setAnswer(questionId, value)`** — voter session answer-store; SETTINGS-02 asserts via persistence-across-reload assertion.

### Established Patterns

- **3-run determinism gate** (v2.6 P64 + Phase 73 SC #4 + Phase 74 D-09 + Phase 75 D-07 + Phase 76 D-09): single fresh `yarn dev:reset-with-data && yarn test:e2e --workers=1` followed by 2 re-runs without resetting; identical pass/fail set is the gate. Phase 77 P05 runs this.
- **Inline `// reason:` justification for accepted test-id usage** (v2.8 P70 Cat A / v2.8 P71 D-04 / Phase 73 D-07 / Phase 74 D-11 / Phase 75 D-06 / Phase 76 D-11a): canonical shape.
- **Single-template fixture extension** (Phase 74 P05 + Phase 75 P01): Plan 02 adds `test-question-number-1` to `packages/dev-seed/src/templates/e2e.ts` directly, no new variant.
- **Variant project shape** (Phase 59 + Phase 63 + Phase 74 + Phase 77 Plans 03+04 / Phase 78 / etc.).
- **PASS-WITH-DEFERRAL for unimplemented surfaces** (Phase 74 D-04 + Phase 75 D-03 + Phase 76 D-06): if an asserter-able surface doesn't exist in the product (e.g., FilterGroup OR-mode UI), defer with a follow-up todo.
- **Serial-mode test.describe** for cross-test state mutation (`candidate-settings.spec.ts:64`): Plan 01 wave A inherits.

### Integration Points

- **`packages/dev-seed/src/templates/e2e.ts`** — Plan 02 modifies (1 new number question + Alpha answer cell). Requires `yarn build @openvaa/dev-seed` after edit.
- **`tests/tests/setup/templates/variant-allowopen.ts`** — NEW (Plan 03).
- **`tests/tests/setup/templates/variant-hidden-required.ts`** — NEW (Plan 04).
- **`tests/tests/setup/templates/index.ts`** — registers new variants.
- **`tests/tests/setup/variant-allowopen.setup.ts` + `variant-hidden-required.setup.ts`** — NEW (Plans 03 + 04).
- **`tests/playwright.config.ts`** — Plans 03 + 04 add 2 new project entries each.
- **`tests/tests/specs/candidate/candidate-settings.spec.ts`** — Plan 01 wave A extends.
- **`tests/tests/specs/voter/voter-results.spec.ts`** — Plan 02 wave B extends (or splits into new spec).
- **`tests/tests/specs/variants/constituency.spec.ts`** — Plan 02 adds constituency-filter assertion block (additive).
- **`tests/tests/specs/voter/voter-allowopen.spec.ts`** — NEW (Plan 03).
- **`tests/tests/specs/voter/voter-visibility-required.spec.ts`** + **`tests/tests/specs/candidate/candidate-required-info.spec.ts`** — NEW (Plan 04).
- **`tests/scripts/diff-playwright-reports.ts`** — Plan 05 invokes for verification gate.
- **NO changes to:** `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (Phase 77 asserts against existing visibility filter). `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` (asserts against existing required derivation). `apps/frontend/src/lib/components/questions/QuestionOpenAnswer.svelte` (asserts against existing render path). `packages/filters/` (asserts against existing filter classes). `packages/app-shared/src/settings/` (no setting schema changes — overlays only).

</code_context>

<specifics>
## Specific Ideas

- **Plan 01 wave A cell-shape (parameterized test runner against `candidate-settings.spec.ts`):**
  ```ts
  const toggleCells = [
    { name: 'voterApp-disabled', overlay: { access: { voterApp: false } }, assert: '/* voter app shows MaintenancePage */' },
    { name: 'adminApp-disabled', overlay: { access: { adminApp: false } }, assert: '/* admin app shows MaintenancePage */' },
    { name: 'hideVideo-true',    overlay: { candidateApp: { questions: { hideVideo: true } } }, assert: '/* question video absent */' },
    { name: 'showFeedback-false', overlay: { header: { showFeedback: false } }, assert: '/* header feedback button absent */' },
    // ... ~12-15 cells total
  ];
  for (const cell of toggleCells) {
    test(`SETTINGS-01 ${cell.name}`, async () => { /* updateAppSettings(overlay) → assert → afterAll restore */ });
  }
  ```
- **Plan 02 filter-type cell sketches:**
  - **NumberFilter:** Walk to voter results page → open filters drawer → find NumberFilter UI for `test-question-number-1` (slider / min-max inputs) → set min above Alpha's value → assert Alpha is filtered out → reset → assert Alpha returns.
  - **TextFilter:** Walk to voter results page → open filters drawer → find TextFilter UI for `test-question-text` → type a substring of Alpha's text answer → assert Alpha-only narrow → clear → assert restore.
  - **Categorical-question filter:** Walk to voter results page → open filters drawer → find ChoiceQuestionFilter UI for `test-question-directional-1` → uncheck Option B (Alpha's answer per Phase 75) → assert Alpha filtered out.
  - **Constituency filter:** In `variant-constituency.spec.ts`, additive block — toggle constituency filter → assert entity list scope.
  - **FilterGroup AND:** Toggle 2 filters simultaneously → assert narrower-than-either-alone.
  - **MISSING_FILTER_VALUE:** Toggle "filter-out entities missing this answer" on a question where ≥1 candidate has MISSING value → assert entity count drops.
- **Plan 03 (SETTINGS-02) walk:** Fresh voter session under `variant-allowopen` project → walk to a question with `allowOpen: true` → assert open-comment input renders → type `'voter comment test'` → click next → walk back → assert text persists in `<Expander>` → reload page → walk back → assert text STILL persists. Walk to a question with `allowOpen: false` → assert open-comment input does NOT render.
- **Plan 04 (SETTINGS-03) voter-side walk:** Fresh voter session under `variant-hidden-required` project → walk through question flow → assert the hidden question's `external_id` is absent (e.g., `expect(page.getByTestId(`question-${hiddenExternalId}`)).toHaveCount(0)`) → walk to results → assert hidden question DOES NOT appear in voter-detail drawer either.
- **Plan 04 (SETTINGS-03) candidate-side walk:** Login as Alpha → navigate to candidate questions → leave a required info question unanswered → attempt to submit / navigate to results → assert navigation is blocked OR submit CTA is disabled (per `profileComplete = false` at `candidateContext.svelte.ts:366-368`).
- **`headerStyle.*` deferral:** Color / sizing / position toggles are NOT in the SC #1 "TOGGLES" interpretation. If user later wants them covered, that's a visual-regression workstream — separate concern. Captured in `<deferred>`.
- **Planner re-baseline at PLAN.md time:** Re-run `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=html` at Phase 77 start to confirm the Phase 75-close + Phase 76-close baseline holds. If baseline drifted, surface as a Phase 77 blocker before authoring specs. Mirrors Phase 74 + 75 + 76 specifics.

</specifics>

<deferred>
## Deferred Ideas

- **`headerStyle.*` color / sizing / position toggles** (D-05 out-of-scope; SC #1 says "TOGGLES" not "all dynamic settings"). Captured as candidate for a future visual-regression workstream.
- **`FilterGroup` OR-mode UI assertion if surface doesn't exist in product** (D-08 PASS-WITH-DEFERRAL): if voter results filter UI does not expose OR-mode toggle, Plan 02 captures as follow-up todo at phase close. PASSES-WITH-DEFERRAL on the relevant SC clause.
- **`entityDetails.contents[*]` / `showMissingElectionSymbol[*]` / `showMissingAnswers[*]` multi-key toggles** — captured in D-05 in-scope but planner may choose to bundle as multi-effect cells OR split into sub-cells. Default: bundle as multi-effect cells where the toggle semantics are uniform across entity types (Candidate / Organization / Alliance).
- **Phase 77 multi-locale toggle coverage** — all assertions land in 1 locale (en). Multi-locale toggle behavior is locale-orthogonal; future phase can extend if needed.
- **Settings overlay live-reload coverage** — Phase 77 asserts toggle effect AFTER overlay applied + page navigation. Does NOT assert mid-session toggle changes propagate live (this is an architecture concern; not v2.9 scope).
- **`appCustomization` runtime override toggle matrix** — `staticSettings` carries non-toggle config (locales, fonts, colors). The `appCustomization` overlay mechanism (if it exists at runtime) is separate from `dynamicSettings`; not v2.9 scope.
- **Visibility / required-info coverage on voter info-question surface** — depending on the voter context's contract for required info questions (Plan 04 audit at PLAN.md time), this may surface a PASS-WITH-DEFERRAL if voter app doesn't enforce required info questions via UI gating.
- **`58-E2E-AUDIT.md`-style addendum for new fixture extensions** (Phase 75 specifics last item / Phase 76 deferred): RECOMMENDED-but-not-blocking if Plan 02 adds `test-question-number-1` to e2e template. Planner's call at Plan 02 close.

### Reviewed Todos (not folded)

`gsd-sdk query todo.match-phase 77` keyword-matched todos. The filter-type coverage todo is FOLDED into Plan 02 (per Folded Todos above); the rest route to OTHER phases per `.planning/STATE.md §"Deferred Items"`. Listed for audit:

- `2026-04-27-extend-e2e-filter-type-coverage.md` — **FOLDED into Plan 02** (SETTINGS-01 wave B). See Folded Todos in `<decisions>`.
- `2026-05-09-tighten-i18n-wrapper.md` — Phase 78 / CLEAN-04.
- `2026-05-10-d04-per-cast-reason-distribution.md` — Phase 78 / CLEAN-03 sub-finding 1.
- `2026-05-10-getroute-setstore-cast-cleanup.md` — Phase 78 / CLEAN-03 sub-finding 2.
- `2026-05-10-rename-package-scripts-dev-to-db.md` — Phase 78 / CLEAN-01.
- `2026-05-10-redirect-unlocated-voter-to-selectors.md` — Phase 78 / CLEAN-02.
- `2026-05-09-claude-md-svelte-warning-accepted-format.md` — Phase 78 / CLEAN-03 sub-finding 3.
- `2026-05-11-voter-fixture-heterogeneous-question-types.md` — Phase 78 / CLEAN-05.
- `2026-05-11-e2e-01-single-locale-runtime-override.md` — Phase 74 D-04 deferral; future runtime-override capability. NOT Phase 77.
- `2026-05-12-58-e2e-audit-addendum-qspec.md` — Phase 75 follow-up; NOT Phase 77.
- `2026-05-12-qspec-01-i18n-hardening.md` — Phase 75 follow-up; NOT Phase 77.
- `2026-05-12-qspec-02-multi-choice-categorical-variant.md` — Phase 75 follow-up; deferred to v2.10+ feature phase. NOT Phase 77.
- `2026-03-28-generalize-candidate-app-to-party-app.md` — v2.10+ architectural change. NOT Phase 77.
- `2026-03-28-investigate-migrating-candidate-answer-store.md` — architectural investigation; future milestone.
- `adapter-package-loading.md` — not v2.9.
- `configurable-mock-data.md` — medium-priority; v2.10+.
- `frontend-project-id-scoping.md` — v2.10 candidate.
- `password-reset-code-method.md` — Strapi-era leftover.
- `register-page-registrationkey-method.md` — Strapi-era leftover.
- `rename-admin-writer.md` — dev-seed internal API hygiene; low priority.
- `results-url-refactor-followups.md` — v2.10 candidate.
- `sql-linting-formatting.md` — CI hygiene; not v2.9.
- `2026-05-09-rewrite-parent-answer-imputation.md` — matching-package internal; future matching-focused milestone.

Phase 77 is bounded to SETTINGS-01 (toggle matrix incl. filter-type slice) + SETTINGS-02 (allowOpen voter-side coverage) + SETTINGS-03 (visibility + must-answer enforcement). Architectural / cleanup / matching-package work belongs in other phases.

</deferred>

---

*Phase: 77-Settings Matrix + Question-Customization Gap-Fills*
*Context gathered: 2026-05-12*
