# Phase 129: New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch — Research

**Researched:** 2026-07-17
**Domain:** OpenVAA frontend question-input components (Svelte 5), `@openvaa/data` question variants + `@openvaa/matching` subdimension paradigm, `@openvaa/app-shared` settings, dev-seed authoring, voter-journey E2E re-baseline
**Confidence:** HIGH (all findings verified by reading the exact source files this session; no external packages introduced)

## Summary

Phase 129 is an **in-repo feature build with zero new external dependencies** — every requirement is satisfied by editing existing OpenVAA source. Research verified each canonical-ref file on disk and pinned the exact residual gaps.

The headline finding (the D-08 priority question): **UNBLK-06 alliance render requires a ONE-LINE seed change.** Everything Phase 69 shipped is wired and alliance-aware — `EntityCard` renders the alliance branch (member-org subcards + summary line + `MatchScore` gauge), the results layout renders `voter-results-alliance-section` with a working alliance tab, `matchState.svelte.ts` runs the org→alliance imputation cascade under `organizationMatching: 'impute'`, and `e2e/base` already seeds Alliance A / Alliance B nomination triangles. The single thing missing is that `BASE_APP_SETTINGS.results.sections` in `packages/dev-seed/src/templates/e2e/base.ts:214` is `['candidate', 'organization']` — **`'alliance'` is absent**. Adding `'alliance'` (as the LAST element, after `'organization'`, to preserve the Org-first cascade invariant) makes alliance cards render with a match-score gauge automatically. **No frontend/component code is required for UNBLK-06's minimum bar OR the D-09 score gauge.**

The three input features (UNBLK-01 MultipleText, UNBLK-05 number-scale, UNBLK-02 multi-choice categorical) all land in known dispatch sites: `QuestionInput.svelte` (info, currently `throw`s for MultipleText), `OpinionQuestionInput.svelte` (opinion — single dispatch for BOTH voter + candidate; currently renders `error.unsupportedQuestion` for number/multi-choice), and `QuestionChoices.svelte` (extend with checkbox multi-select mode). The matching gap (UNBLK-02) is a data-class implementation filling the literal `// TODO: Implement for matching` in `multipleChoiceCategoricalQuestion.ts` — the engine already supports categorical subdimensions; `singleChoiceCategoricalQuestion.ts` is the reference impl to extend. `NumberQuestion` is already fully matchable (only its input UI + seed authoring are missing).

**Primary recommendation:** Build in this order — (1) add `'alliance'` to `e2e/base` + `default` sections and verify the card renders (cheapest, unblocks UNBLK-06 + the D-13 re-baseline scope); (2) implement `MultipleChoiceCategoricalQuestion` matching by extending the single-choice reference; (3) build the three input components against the existing `Input`/`QuestionChoices` conventions; (4) author the number + multi-choice opinion questions into the `e2e/base` MAIN (Base) category + `default` template; (5) re-baseline `voter-journey.spec.ts` in the SAME wave as the seed change so the suite is green at phase close.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — MultipleText input:** Row list with add/remove buttons + reordering. One text input per value bound to `Array<string>`, "+ add" button, per-row remove. **Model on the existing multi-select categorical to implement reordering as well.** Used for candidate INFO questions; voters only see values rendered on entity-detail info tab.
- **D-02 — Min/max item-count question settings.** No hard limit by default; empty rows dropped on save. Add `min`/`max` question settings controlling the number of items. If `min > 1`: render that many rows initially, prevent deletion below min, still allow reordering.
- **D-03 — Number-scale opinion input:** Slider (range input) with live numeric value label. `NumberQuestion` carries `min`/`max`; keyboard-accessible arrows give exact-value control (the Phase-130 `answerNumberScale(question, value)` locator/interaction contract).
- **D-04 — Number display mode:** Same slider rendered read-only with both markers (voter + entity). `OpinionQuestionInput` `mode='display'` reused by `EntityOpinions`. EQTYP-02 asserts this in Phase 130.
- **D-05 — Multi-choice categorical opinion:** Extend `QuestionChoices` with a multi-select (checkbox semantics) mode. The `question-choice` locator contract carries over.
- **D-06 — Multi-choice matching:** Binary-subdimension extension per the existing categorical reference impl. Each selected choice's subdimension = 1, unselected = 0, distance normalized over subdimensions. No new engine code. Fills the `// TODO: Implement for matching` in `multipleChoiceCategoricalQuestion.ts`.
- **D-07 — Selection constraints:** Zero-as-unanswered by default, PLUS optional min/max selection counts via questionSettings. When specified, component shows info text: "Select 2 to 3 options." / "Select 2 options." (localized). **Candidate app: disable saving while outside min/max. Voter app: keep the action button as Skip while outside min/max.**
- **D-08 — Alliance render RESEARCH-FIRST.** This research pins the exact residual gap before planning; build ONLY what's missing — do not re-build Phase 69.
- **D-09 — Alliance card also shows a match score/gauge like org cards, IF the existing org→alliance imputation cascade already produces alliance matches** (recommended-if-cheap accepted). Minimum bar regardless: alliance card in results sections, member orgs as clickable children in-card, working member-orgs drawer.
- **D-10 — Verify Alliance A ↔ member-org seed wiring in `e2e/base` renders correctly** as part of UNBLK-06 verification in THIS phase (Phase 130 assert-only).
- **D-11 — Nominations route: core fetch fix only.** Add `getQuestionData({ locale })` to `(voters)/nominations/+layout.ts` for parity with `(located)/+layout.ts`. The nominating-org display todo is deferred.
- **D-12 — Main-category seed placement (non-additive, locked by Phase 118 coverage plan).** New number-scale + multipleChoiceCategorical opinion questions go directly into the MAIN (Base) question category of `e2e/base`. Rigid-expectation re-baselines are planned up-front work.
- **D-13 — Re-baseline edits to `voter-journey.spec.ts` land in Phase 129, same plan wave as the seed change.** Suite must be green at 129 close.
- **D-14 — Fixtures ship in Phase 129 alongside features** (119.4 override). Input↔fixture locator contract pinned in the Phase 129 UI-SPEC.
- **D-15 — Default (demo) template parity.** Add one number-scale + one multi-choice opinion question to the `default` Finnish demo template too.
- **D-16 — Fix `buildMinimal.ts` `defaultAnswerForQuestion` number-branch gap** (currently falls through to `{ value: '' }`) as part of UNBLK-05 seed work.
- **D-17 — Separate UI-SPEC before planning** (129.2). Run `/gsd-ui-phase 129` after discussion, before the planner.
- **D-18 — Todo folding.** Folds the three pending todos (multiple-text-input, nominations-route-fetch, qspec-02-multi-choice); defers the nominating-org + parent-answer-imputation-rewrite todos.

### Claude's Discretion
- Exact slider implementation (native `<input type=range>` vs styled wrapper) within DaisyUI/Tailwind — UI-SPEC decides.
- Exact shape of the min/max questionSettings keys (`customData` vs typed settings extension) — pick the smallest honest extension consistent with `@openvaa/app-shared` question-settings conventions. (Research recommendation below: `customData.Question`.)
- Whether the alliance residual gap fix lands as seed change, settings change, or component fix — dictated by what research finds (D-08). (Research verdict below: **seed change only.**)

### Deferred Ideas (OUT OF SCOPE)
- `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md` — needs a new candidate-scoped RPC + supabase-types regen; its own slice.
- `2026-05-09-rewrite-parent-answer-imputation.md` — structural refactor, explicitly out-of-scope of the alliance ship.
- All Phase 130 spec authoring.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UNBLK-01 | `QuestionInput` renders + persists answers for `MultipleTextQuestion` | `QuestionInput.svelte:54-59` throws for MultipleText today; `MultipleTextQuestion._ensureValue` = `ensureArray(v => ensureString(v))` (Array<string>). New row-list input lands in `QuestionInput.svelte`; model reorder on the `Input.svelte` `select-multiple` `ordered` pattern (`Input.svelte:155-169,264-273,335-339`). |
| UNBLK-02 | Multi-choice categorical opinion variant — input + matching dispatch + dev-seed authoring | Extend `QuestionChoices.svelte` (checkbox mode, preserve `data-testid="question-choice"` at line 270); fill matching `TODO` in `multipleChoiceCategoricalQuestion.ts:34` by extending `singleChoiceCategoricalQuestion.ts:38-62`; author into `e2e/base` Base category + `default`. |
| UNBLK-04 | `/nominations` route fetches question data | `(voters)/nominations/+layout.ts:32-38` returns only `nominationData`; add `questionData: dataProvider.getQuestionData({ locale: lang }).catch(e => e)`. `getQuestionData` accepts optional `GetQuestionsOptions` (electionId optional) — locale-only call is valid (`dataProvider.type.ts:70`, `getDataOptions.type.ts:47`). |
| UNBLK-05 | Number-scale opinion input + matching dispatch + dev-seed authoring | `NumberQuestion` already fully matchable (`numberQuestion.ts:70-85`, matchable when `min`+`max` set). Add slider branch to `OpinionQuestionInput.svelte` (currently `error.unsupportedQuestion` at line 113); author number opinion questions into seed; fix `buildMinimal.ts` number branch (D-16). |
| UNBLK-06 | Alliance entities render in voter results (card + member-orgs drawer) | **Single residual gap: `results.sections` in `e2e/base.ts:214` lacks `'alliance'`.** All render/match/settings machinery exists (Phase 69). See Priority Finding below. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| MultipleText info input UI | Frontend (component) | — | `QuestionInput.svelte` is the info-question dispatch; pure client render bound to `Array<string>`. |
| Number-scale opinion input UI | Frontend (component) | — | `OpinionQuestionInput.svelte` dispatch; renders slider; persists via `onChange` → answer store → Supabase adapter. |
| Multi-choice opinion input UI | Frontend (component) | — | `QuestionChoices.svelte` checkbox mode; same dispatch. |
| Multi-choice **matching** semantics | `@openvaa/data` (data model) | `@openvaa/matching` | `MultipleChoiceCategoricalQuestion._normalizeValue`/`normalizedDimensions`/`isMatchable`; engine already consumes subdimensions. |
| Number matching | `@openvaa/data` | `@openvaa/matching` | Already implemented (`numberQuestion.ts`); no change. |
| Alliance render + score cascade | Frontend (context + component) | `@openvaa/matching` | `matchState.svelte.ts` org→alliance imputation; `EntityCard`/results layout render. Driven by `results.sections`. |
| Min/max question settings | `@openvaa/app-shared` (types) | Frontend + dev-seed (consumers) | New setting keys consumed by both input components and seed authoring. |
| Nominations question fetch | Frontend (route loader) | Supabase adapter | `+layout.ts` load fn; one added `getQuestionData` call. |
| Seed authoring | `@openvaa/dev-seed` | Supabase (writer/RPC) | Template rows → `bulk_import`. |

## Standard Stack

**No new external packages.** This phase is entirely in-repo edits across existing OpenVAA workspaces. Installation: none.

### Core (existing workspaces touched)
| Workspace | Purpose in this phase | Why |
|-----------|----------------------|-----|
| `@openvaa/frontend` (apps/frontend) | 3 input components + nominations loader + alliance verify | All UI dispatch sites live here |
| `@openvaa/data` (packages/data) | `MultipleChoiceCategoricalQuestion` matching impl | Data-class matching methods |
| `@openvaa/matching` (packages/matching) | Reference paradigm only — **read, do not edit** | Engine already supports categorical subdimensions |
| `@openvaa/app-shared` (packages/app-shared) | New min/max question-setting keys | Shared settings/customData types |
| `@openvaa/dev-seed` (packages/dev-seed) | Seed authoring (`e2e/base`, `default`, `buildMinimal`) | Question rows + app_settings |
| E2E suite (repo-root `tests/`) | `voter-journey.spec.ts` re-baseline + fixtures | D-13/D-14 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending `QuestionChoices` (D-05) | New sibling checkbox component | Rejected by D-05 — would break the `question-choice` locator contract the Phase-130 fixtures rely on. |
| `customData.Question` for min/max (D-02/D-07) | New typed settings field on the question `settings` column | `customData` is the established extension point (holds `longText`, `vertical`, `maxlength`, `filterable`, `terms`). Smallest honest extension. |

**Version verification:** N/A — no external packages added. All code is workspace-internal.

## Package Legitimacy Audit

Not applicable — **this phase installs zero external packages.** All work is edits to existing monorepo workspaces (`@openvaa/*`) already present in `package.json`. No `npm install` / `yarn add` step.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## PRIORITY FINDING — UNBLK-06 Alliance Render (D-08 / D-09)

**Verdict: the residual gap is a single missing array element in the `e2e/base` seed settings. No frontend, component, or matching code is required for the minimum bar OR the score gauge.** `[VERIFIED: source read of all 6 files below]`

### What Phase 69 already shipped (verified present — do NOT rebuild)
1. **`EntityCard.svelte` alliance branch** (`apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte:151-176`): when the nomination is an `AllianceNomination` and `cardContents.alliance?.includes('children')`, it renders member-org subcards via `findOrganizationNominations(...)` with `scsMaxOverride = Infinity` (all member orgs, not top-3), plus the "X candidates across N parties" summary line (`getAllianceSummary`, lines 169-176, 291-302).
2. **`MatchScore` gauge renders unconditionally when `parsed.match` is set** (`EntityCard.svelte:280-286`). `parsed.match` comes from `unwrapEntity(entity).match` — so if the results tree hands the card a `Match` (not a bare nomination), the alliance card shows the score gauge with **zero extra code**.
3. **Results layout is fully alliance-aware** (`apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte`): renders `data-testid="voter-results-alliance-section"` (line 396-398), handles the `alliances` plural tab (lines 112, 124-129, 284-288), and `_pluralForActiveType` maps `alliance → alliances` (line 302). Tabs are derived from `voterCtx.matches[electionId]` keys.
4. **`matchState.svelte.ts` runs the org→alliance imputation cascade** (`apps/frontend/src/lib/contexts/voter/matchState.svelte.ts:103-124`): the `ENTITY_TYPE.Alliance` branch calls `imputeParentAnswers({ nominations, questions, childProxies: orgProxiesById })` when `parentMethod === 'impute'`. `orgProxiesById` is populated by the Organization branch earlier in the same iteration (Org-first invariant, lines 91-95).
5. **`e2e/base` seeds the alliance nomination triangles**: Alliance A (`test-e2e-base-nom-reg-n-al-a`) in CO-Reg-N + CO-Mun-NE, Alliance B in CO-Reg-N/CO-Reg-S/CO-Mun-NE, with member-org nominations carrying `parent_nomination` pointing at the alliance nomination (`packages/dev-seed/src/templates/e2e/base.ts:1266-1590`). Alliance entity rows exist (lines 504-525).
6. **Settings for alliance already present in `e2e/base`**: `entityDetails.contents.alliance: ['info', 'children']` (line 149) and `results.cardContents.alliance: ['children']` (line 210).

### The single gap
`packages/dev-seed/src/templates/e2e/base.ts:214`:
```ts
sections: ['candidate', 'organization']   // ← 'alliance' MISSING
```
`voterContext.svelte.ts:271` reads `#entityTypes = appSettings.results?.sections ?? []`, which drives BOTH (a) which entity types get matched in `matchState`, and (b) which tabs/sections the results layout renders. Because `'alliance'` is absent, the alliance branch in `matchState` **never runs** and no alliance tab/section/cards appear.

**Contrast:** `packages/dev-seed/src/templates/default.ts:259` already has `sections: ['candidate', 'organization', 'alliance']` — the demo template renders alliances; only `e2e/base` (and the perm `shared.ts:104`) omits it.

### The fix (build ONLY this for UNBLK-06)
Change `e2e/base.ts:214` to `sections: ['candidate', 'organization', 'alliance']`. **Order matters: `'alliance'` MUST come after `'organization'`** to preserve the Org-first cascade invariant documented at `matchState.svelte.ts:104-110` (an alliance-first order yields an empty `orgProxiesById` → alliance scores degrade silently).

### D-09 answer — YES, the score gauge is free
`e2e/base` has `matching.organizationMatching: 'impute'` (`base.ts:184`). With `'alliance'` in `sections`, the `matchState` Alliance branch produces imputed `Match` objects for alliance nominations → `EntityCard.parsed.match` is set → `MatchScore` gauge renders automatically. **No display-wiring code needed.** (Note: alliance **submatches** will NOT render — `showSM` is only computed for candidate/organization at `EntityCard.svelte:128-137`; that is the `EntityCard` settings-type TODO at lines 125-126. This does NOT block the D-09 score gauge or the minimum bar, and is explicitly out of scope for the D-09 minimum. Leave the TODO.)

### Caveat to verify at build time
The voter-journey voter selects a constituency (first-option pick → CO-Reg-N + CO-Mun-NE per the fixture). Alliance A is nominated in both CO-Reg-N and CO-Mun-NE, so an alliance card WILL appear for that voter. Confirm the rendered alliance section against the voter's active election/constituency when re-baselining. This is the D-10 verification.

## Question-Input Findings (UNBLK-01 / 02 / 05)

### Dispatch sites (verified)
- **`OpinionQuestionInput.svelte`** (`apps/frontend/src/lib/components/questions/`) is the SINGLE opinion-answer dispatch for BOTH voter and candidate apps. Today it handles `isSingleChoiceQuestion` (→ `QuestionChoices`) and `isBooleanQuestion` (→ synthesized choices), else renders `<ErrorMessage inline message={t('error.unsupportedQuestion')}>` (line 113). Number + multi-choice branches added here fix both apps at once. `mode='display'` is reused by `EntityOpinions` (D-04). Props flow through `...restProps` to `QuestionChoices`.
- **`QuestionInput.svelte`** (`apps/frontend/src/lib/components/input/`) is the INFO-question dispatch (a wrapper over the `Input` primitive). It **throws** for `QUESTION_TYPE.MultipleText` (lines 54-56) and its `INPUT_TYPES` map explicitly `Exclude`s `MultipleText` (line 40). The D-01 row-list input lands here (either a new branch before the `<Input>` render, or by adding a `multiple-text` type to the `Input` primitive — UI-SPEC decides).
- **`QuestionChoices.svelte`** (`apps/frontend/src/lib/components/questions/`) renders `<input type="radio">` inside a `<fieldset>`, each carrying `data-testid="question-choice"` (line 270). D-05 extends this with a checkbox multi-select mode. **Locator contract:** the `data-testid="question-choice"` on each input MUST be preserved (Phase-130 fixtures depend on it). The radio group uses `bind:group={selected}` + a bespoke keyboard/pointer event dance (lines 128-210) — checkbox mode needs a parallel multi-select `selected: Array<Id>` state and its own change-dispatch, but can reuse the layout/`display`-mode scaffolding.

### The reorder pattern D-01 models on (verified)
The existing "multi-select categorical" is the `Input.svelte` `select-multiple` type (`apps/frontend/src/lib/components/input/Input.svelte`): a dropdown of unselected options + a list of selected options each with a delete button (lines 483-538); `ordered` keeps selection order (lines 163-169, 264-273). **Note:** this is order-BY-SELECTION, not drag/up-down reorder — there is no explicit reordering UI in the codebase today. D-01's "reordering" for MultipleText rows will be net-new UI (add/remove already have precedent; up/down or drag is new). Flag for UI-SPEC. `MultipleChoiceQuestion.ordered`/`getChoices` (`multipleChoiceQuestion.ts:34-49`) supports ordered value arrays at the data layer.

### Number-scale (UNBLK-05)
- `NumberQuestion` (`packages/data/src/objects/questions/variants/numberQuestion.ts`) is **already fully matchable**: `isMatchable` true when `min`+`max` set; `_normalizeValue` normalizes into the min–max range. `min`/`max` live on `NumberQuestionData` (`numberQuestion.type.ts:37,41`).
- The `Input` primitive already has a `number` type that coerces `valueAsNumber` → JS number (`Input.svelte:319-322`) — but D-03 wants a **slider** (`<input type=range>`), which is NOT yet an `Input` type. Add a slider render (either a new `Input` type or a bespoke branch in `OpinionQuestionInput`). Keyboard-arrow exact-value control is a first-class requirement (Phase-130 boundary test drives exact values) — native `<input type=range>` gives this for free.
- D-04 display mode: render the same slider read-only with voter + entity markers, mirroring how `QuestionChoices` display-mode shows `yourAnswer` / `otherLabel`.

### Multi-choice matching (UNBLK-02 / D-06) — the reference impl
`singleChoiceCategoricalQuestion.ts:38-62` is the exact reference to extend:
- `normalizedDimensions` = `choices.length === 2 ? 1 : choices.length`.
- `_normalizeValue`: single-choice sets the selected index's subdimension to `COORDINATE.Max` and all others to `COORDINATE.Min` (returns `Array<CoordinateOrMissing>`).
- For **multi**-choice (D-06 binary-subdimension): each SELECTED choice's subdimension = `COORDINATE.Max`, unselected = `COORDINATE.Min`. The value is an `Array<Id>` (via `MultipleChoiceQuestion._ensureValue` = `ensureArray` + `ensureUnique`, `multipleChoiceQuestion.ts:51-55`). Implement `_normalizeValue`, `get isMatchable` (true), `get normalizedDimensions` (= `choices.length`) in `multipleChoiceCategoricalQuestion.ts`, filling the `// TODO` at line 34. **No `@openvaa/matching` engine change** — it already consumes `normalizedDimensions` subdimensions.
- Consult the `matching` agent-skill / `packages/matching` docs to confirm the missing-value convention (single-choice returns per-dimension `MISSING_VALUE` array when the whole value is missing — mirror that).

### Min/max question settings (D-02 MultipleText item counts; D-07 selection counts)
- `NumberQuestion.min`/`max` are the answer-VALUE range (matching), NOT count constraints — do not overload them.
- No existing count-constraint settings exist. **Recommendation:** add new optional keys to `customData.Question` in `packages/app-shared/src/data/customData.type.ts:22-79` (the established extension point holding `longText`, `vertical`, `maxlength`, `filterable`, `terms`). E.g. `minItems?/maxItems?` (MultipleText) and `minSelections?/maxSelections?` (multi-choice). Consumed via `getCustomData(question)` in the input components (already imported in `QuestionChoices`/`QuestionInput`). This is the smallest honest extension and requires no DB migration (customData is a JSONB blob).
- D-07 UX: show localized helper "Select 2 to 3 options." / "Select 2 options."; candidate app disables save outside range; voter app keeps the action button as Skip outside range. The Skip-vs-save divergence means the constraint state must be surfaced to the caller (candidate save gate vs voter action-button label) — check how the candidate save button and voter action button consume the opinion-input's validity today.

## Nominations Route Fix (UNBLK-04 / D-11)

`apps/frontend/src/routes/(voters)/nominations/+layout.ts` currently returns only `nominationData` (via `getNominationData({ locale })` — the all-nominations variant, no election/constituency scope). The parity reference `(voters)/(located)/+layout.ts:98-112` returns BOTH `questionData` (via `getQuestionData({ electionId, locale })`) and `nominationData`. **Fix:** add to the nominations loader's return object:
```ts
questionData: dataProvider.getQuestionData({ locale: lang }).catch((e) => e)
```
`getQuestionData` accepts an optional `GetQuestionsOptions` where `electionId` is optional (`dataProvider.type.ts:70`; `getDataOptions.type.ts:47` — with no `electionId`, all categories/questions are returned). Locale-only is the correct call for the all-nominations route. Confirm the `/nominations` `+page.svelte` (or its all-nominations rendering component) reads `questionData` the same way the located route does.

## Seed & Dev-Seed Authoring (D-12, D-15, D-16)

### `e2e/base` main-category placement (D-12)
The MAIN opinion category is `test-e2e-base-qg-opin-base` (`base.ts:546`), currently holding 5 questions: base-1 (likert5), base-2 (likert4), base-3 (likert7 + terms), base-4 (singleChoiceCategorical), base-5 (boolean) at `sort_order` 100-104. Add:
- One **number** opinion question (with `min`/`max` set so it is matchable; e.g. `min:0, max:10`).
- One **multipleChoiceCategorical** opinion question (with choices; optional `customData.minSelections/maxSelections` to exercise D-07).
Place both in `category: { external_id: 'test-e2e-base-qg-opin-base' }` at `sort_order` 105-106. Add matching answer entries to the `POLAR_MAX`/`NEAR_MAX`/`POLAR_MIN`/`GENERIC` opinion-answer templates (`base.ts:280-340`) and to CA-AA-Special's answer map — number values and choice-id arrays respectively — so matching invariants and the 4-case matrix stay coherent.
- **DB acceptance:** `number`, `multipleChoiceCategorical`, `singleChoiceCategorical` are all valid `type` values already used in `e2e/base` for INFO questions (`base.ts:614-680`). Authoring them as OPINION questions (category `category_type: 'opinion'`) is a category assignment, not a new type — **no DB/type-constraint change expected** (verify no `opinion`-category type allowlist exists on the questions table; ASSUMED — see Open Questions).

### `default` template parity (D-15)
`packages/dev-seed/src/templates/default.ts` — add one number-scale + one multi-choice opinion question. `default` already has `sections: ['candidate','organization','alliance']` (line 259), so alliance render is already exercised there.

### `buildMinimal.ts` number gap (D-16)
`defaultAnswerForQuestion` (`packages/dev-seed/src/templates/_helpers/buildMinimal.ts:156-180`) has branches for `text`, `singleChoiceOrdinal`, `boolean`, and a categorical/else fallback that reads `question.choices` — for `type === 'number'` there are no choices, so it returns `{ value: '' }` (invalid for a number question; the backend `validate_answer_value` RPC requires a JSON number). Add a `number` branch returning e.g. `{ value: <midpoint of min/max, or 0> }`. Read `question.custom_data.min/max` or `question.min/max` if present.

## Voter-Journey Re-Baseline (D-13) — assertions at risk

`tests/tests/specs/voter/voter-journey.spec.ts` — adding 2 questions to the Base (main) category changes the per-question walk and answer counts. **Enumerated at-risk assertions (verified by read):**

| Location | Assertion | Likely impact of main-category placement |
|----------|-----------|------------------------------------------|
| `voter-journey.spec.ts:85` | `answerCount: /Answer 4/i` (min-answers gate button text = answers still needed) | **Likely changes.** `minimumAnswers: 5`; the "Answer N" count is derived from answers-still-needed. Adding questions to the Base category changes how many answers the selected categories can supply → the "Answer 4" literal may shift. Re-baseline the regex. |
| `:499` | `categoryCheckboxes.toHaveCount(5)` | **Likely UNCHANGED** — adding questions to an EXISTING category does not add a category. Verify. |
| `:535-599` walk | Base-category question walk uses `expectQuestionAndAdvance` with radio `optionIndex` | **BREAKS** — the new slider (number) + checkbox (multi-choice) questions are NOT radio inputs; the generic advance helper can't answer them. New per-type walk handling required (this is the fixture work D-14). |
| score gauges (`toHaveCount(4)`, ~`:724-730`) | subMatches gauge count = voter-answered CATEGORIES | **Likely UNCHANGED** — gauges are per-category, not per-question; adding questions to an existing category doesn't add a gauge. (NB: the coverage plan's "4→5+ gauges" note predates the D-12 main-category lock — verify empirically.) |
| results-CTA enable/disable boundary (~`:600-620`) | delete-last-answer re-disables results link; re-answer re-enables | **Timing shifts** — the exact question index at which the CTA crosses the min-answers threshold changes with 2 more answerable Base questions. Re-baseline the boundary step. |

**Method:** re-baseline empirically — run `yarn db:reset` + fresh dev server on :5173 + `yarn test:e2e` (E2E cardinal rule; "did not run" = failure), read the actual failures, adjust literals/regexes. The seed change + spec re-baseline MUST be in the same plan wave (D-13). Register any new locators in `tests/tests/utils/testIds.ts`.

## Architecture Patterns

### Pattern 1: Opinion-input dispatch extension
**What:** Add a new `{:else if isNumberQuestion(question)}` / `{:else if isMultipleChoiceQuestion(question)}` branch in `OpinionQuestionInput.svelte` before the `error.unsupportedQuestion` fallback, delegating to a slider component / extended `QuestionChoices`. **When:** UNBLK-05, UNBLK-02. Reuse `mode`/`answer`/`otherAnswer`/`otherLabel`/`onChange` prop plumbing verbatim (D-04 display mode).

### Pattern 2: Data-class matching method trio
**What:** For a matchable question variant, implement `get isMatchable`, `get normalizedDimensions`, `protected _normalizeValue`. **When:** UNBLK-02. Mirror `singleChoiceCategoricalQuestion.ts` exactly, changing single-index-Max to selected-set-Max.

### Pattern 3: Settings-driven results rendering
**What:** `results.sections` (array of entity types) drives both matching and rendering via `voterContext.#entityTypes`. Adding an entity type to the section list is the ONLY switch needed to surface a fully-wired entity type. **When:** UNBLK-06.

### Anti-Patterns to Avoid
- **Rebuilding the alliance card / drawer / cascade** — all exist (Phase 69). Only the seed `sections` array is missing `'alliance'`.
- **Listing `'alliance'` before `'organization'` in `sections`** — breaks the Org-first imputation cascade (`matchState.svelte.ts:104-110`); alliance scores degrade silently.
- **Renaming or dropping `data-testid="question-choice"`** when adding checkbox mode — breaks Phase-130 fixtures (D-05 contract).
- **Overloading `NumberQuestion.min`/`max` for item/selection COUNT constraints** — those are the answer-value matching range; count constraints are new `customData` keys.
- **Destructuring reactive context accessors** in new components — follow CLAUDE.md Context Destructuring Rule (`ctx.X` reads for `appSettings`/`dataRoot`/reactive getters; `dataRoot.<prop>` read directly inside the tracking scope, never via an intermediate `$derived` alias).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Categorical multi-select matching distance | Custom Jaccard/overlap metric | Extend the binary-subdimension `_normalizeValue` (D-06) | Engine already normalizes subdimensions; single-choice is the proven reference |
| Alliance card / member-org drawer / summary | Any new alliance component | Existing `EntityCard` alliance branch + `EntityDetails` children tab | Shipped in Phase 69 |
| Alliance match score | Manual alliance scoring | `matchState` org→alliance imputation cascade (`imputeParentAnswers`) | Runs automatically under `organizationMatching: 'impute'` |
| Number → JS number coercion | Manual parse | `Input.svelte:319-322` `valueAsNumber` pattern | Backend RPC requires JSON number |
| Multilingual / choice value ensuring | Manual validation | `question.ensureValue` / `_ensureValue` on the data classes | Smart-default + MISSING_VALUE conventions |

**Key insight:** UNBLK-06 and much of UNBLK-05 are "flip a switch / fill a method," not greenfield. The scouting cost is repaid by NOT rebuilding Phase-69 machinery.

## Common Pitfalls

### Pitfall 1: Alliance section order in `sections`
**What goes wrong:** Alliance cards render but all show ~0% / degraded scores. **Root cause:** `'alliance'` placed before `'organization'` → `orgProxiesById` empty when the alliance branch runs. **Avoid:** append `'alliance'` LAST. **Warning sign:** alliance scores differ wildly from the member orgs' scores.

### Pitfall 2: E2E cardinal rule at phase close
**What goes wrong:** Phase "done" with red/skipped E2E. **Avoid:** the seed change + `voter-journey.spec.ts` re-baseline ship in the same wave (D-13); run the FULL suite (`yarn test:e2e`) on a fresh :5173 server + `yarn db:reset`. "Did not run" counts as failure.

### Pitfall 3: New input types break the generic voter-journey walk
**What goes wrong:** `expectQuestionAndAdvance` assumes radio options; slider/checkbox questions stall the walk. **Avoid:** add per-type answer handling in the fixture layer (D-14) in the same wave.

### Pitfall 4: Candidate-save vs voter-Skip divergence (D-07)
**What goes wrong:** One app's min/max gate leaks into the other. **Root cause:** `OpinionQuestionInput` is shared. **Avoid:** surface constraint-validity to the caller; the candidate save button gates on it, the voter action button switches to Skip — don't hard-disable inside the shared component.

### Pitfall 5: DB rejects opinion-typed number/multi-choice question (UNVERIFIED)
**What goes wrong:** `bulk_import` rejects a `number`/`multipleChoiceCategorical` question in an `opinion` category if a type/category allowlist exists. **Avoid:** verify the questions-table type constraint / any opinion-category type allowlist before authoring; if present, add a migration (scope check). See Open Questions.

## Code Examples

### Alliance sections fix (UNBLK-06) — the one-line change
```ts
// packages/dev-seed/src/templates/e2e/base.ts:214 (BASE_APP_SETTINGS.results)
// BEFORE:
sections: ['candidate', 'organization']
// AFTER (alliance LAST — Org-first cascade invariant):
sections: ['candidate', 'organization', 'alliance']
```

### Multi-choice matching (UNBLK-02) — fill the TODO
```ts
// packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.ts
// Reference: singleChoiceCategoricalQuestion.ts:38-62. Value is Array<Id> (selected choice ids).
get isMatchable(): boolean { return true; }
get normalizedDimensions(): number { return this.choices.length; }
protected _normalizeValue(value): Array<CoordinateOrMissing> {
  const choices = this.choices;
  if (isMissingValue(value)) return choices.map(() => MISSING_VALUE);
  const selected = new Set((value as Array<Id>).map(String));
  return choices.map((c) => (selected.has(String(c.id)) ? COORDINATE.Max : COORDINATE.Min));
}
```

### Nominations loader parity (UNBLK-04)
```ts
// apps/frontend/src/routes/(voters)/nominations/+layout.ts  (add to the returned object)
return {
  questionData: dataProvider.getQuestionData({ locale: lang }).catch((e) => e),
  nominationData: dataProvider.getNominationData({ locale: lang }).catch((e) => e)
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Alliance render assumed "not implemented" | Fully built (Phase 69); only seed `sections` gate missing | Phase 69 (2026) | UNBLK-06 is a seed edit, not a build |
| `MultipleChoiceCategoricalQuestion` non-matchable | Engine supports it; only data-class methods missing | now | UNBLK-02 matching = 3 methods |
| `appSettings`/`dataRoot`/`locale` as `{current}` handles | Bare reactive accessors (Phase 113 flatten) | v2.13 P113 | New components must read `ctx.X`, never destructure |

**Deprecated/outdated:**
- The coverage plan's "4→5+ score gauges" re-baseline note predates the D-12 main-category (non-additive) lock — main-category placement likely leaves the per-category gauge count unchanged; re-baseline empirically rather than assuming +1.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The DB questions table imposes no type/category allowlist that rejects `number`/`multipleChoiceCategorical` questions in an `opinion` category | Seed / Pitfall 5 | If wrong, a Supabase migration is needed → new plan task + type regen |
| A2 | Main-category placement leaves `categoryCheckboxes.toHaveCount(5)` and score-gauge `toHaveCount(4)` unchanged (only per-question walk + "Answer N" + CTA boundary shift) | Re-baseline table | If wrong, more voter-journey assertions re-baseline; caught empirically by the full-suite run |
| A3 | `customData.Question` is the right home for min/max count constraints (vs a typed `settings` column field) | Min/max settings | Low — Claude's Discretion per D-02/D-07; either works, `customData` is smallest |
| A4 | The candidate save button + voter action button can read the shared opinion-input's constraint validity without a structural refactor | D-07 / Pitfall 4 | If tightly coupled, D-07's Skip-vs-save split may need a small prop/callback addition (not verified this session) |
| A5 | The voter-journey voter's selected constituency surfaces an Alliance A card (Alliance A nominated in CO-Reg-N + CO-Mun-NE) | Priority Finding caveat | Low — verified seed rows exist; confirm at D-10 verification |

## Open Questions

1. **DB opinion-category type acceptance (A1).** Does `bulk_import` / the questions table constrain which `type`s may appear in an `opinion` category? *Recommendation:* grep `apps/supabase/migrations` for a question-type/category-type constraint before authoring; add a `checkpoint`/verify task early in the plan. Known: `number`/`multipleChoiceCategorical`/`singleChoiceCategorical` already exist as INFO questions in `e2e/base`.
2. **D-07 constraint-validity surfacing.** How do the candidate save button and voter action button currently read opinion-input validity? Not traced this session — the planner should scout the candidate questions page + voter question-flow action button to place the min/max gate cleanly.
3. **D-01 reorder UI.** No drag/up-down reorder UI exists today (the `select-multiple` "reorder" is order-by-selection only). The UI-SPEC (D-17) must decide the concrete reorder affordance (up/down buttons vs drag) for MultipleText rows.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Local Supabase (CLI) | seed + E2E | ✓ (per project setup) | — | — |
| Fresh Vite dev server :5173 | E2E gate | ✓ | — | — |
| `yarn db:reset` / `yarn db:seed --template e2e/base` | seed verify | ✓ | — | — |
| Playwright | voter-journey re-baseline | ✓ | — | — |

**Missing dependencies with no fallback:** none identified (all are standard project tooling per CLAUDE.md).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (unit, per package) + Playwright (E2E, repo-root `tests/`) |
| Config file | `tests/playwright.config.ts` (E2E); per-package `vitest` |
| Quick run command | `yarn test:unit` (or `cd packages/data && yarn test:unit`) |
| Full suite command | `yarn test:e2e` (requires `yarn dev` / fresh :5173 + `yarn db:reset`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UNBLK-02 | multi-choice `_normalizeValue`/`isMatchable`/`normalizedDimensions` | unit | `cd packages/data && yarn test:unit` (add to `multipleChoiceCategoricalQuestion.test.ts`) | ✅ file exists; add cases |
| UNBLK-05 | number opinion input persists + matches | E2E + unit | `yarn test:e2e` (voter-journey re-baseline) | ✅ voter-journey; ❌ new number step (Phase 130 asserts) |
| UNBLK-01 | MultipleText round-trip | E2E | `yarn test:e2e` | ❌ Phase-130 spec (129 ships input + seed) |
| UNBLK-04 | `/nominations` renders all-nominations entities | E2E | `yarn test:e2e` | ❌ Phase-130 spec |
| UNBLK-06 | alliance card + drawer render | E2E | `yarn test:e2e` (D-10 verify) | ❌ Phase-130 spec; 129 verifies render manually/via re-baseline |
| D-16 | `buildMinimal` number answer | unit | `cd packages/dev-seed && yarn test:unit` (`buildMinimal.test.ts`) | ✅ file exists; add case |

### Sampling Rate
- **Per task commit:** `yarn test:unit` for the touched package; typecheck via `yarn build --filter=@openvaa/<pkg>`.
- **Per wave merge:** full `yarn test:e2e` on fresh :5173 + `yarn db:reset`.
- **Phase gate:** full E2E green (cardinal rule) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] New number + multi-choice answer handling in the voter-journey fixture layer (`tests/tests/fixtures/voter/`) — required before the re-baseline walk can answer the new question types (D-14).
- [ ] New locators registered in `tests/tests/utils/testIds.ts` (slider value, checkbox choices, multi-text rows).
- [ ] Unit cases: `multipleChoiceCategoricalQuestion.test.ts` (matching), `buildMinimal.test.ts` (number default).

## Security Domain

`security_enforcement` not explicitly disabled — included. This phase is UI + seed + data-model; no auth/crypto/session surface changes.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Answer values validated by `Question.ensureValue`/`_ensureValue` (data layer) AND the backend `validate_answer_value` RPC (number must be JSON number; choice ids must exist). New number/multi-choice inputs MUST route through `ensureValue`. |
| V2 Authentication | no | No auth changes |
| V3 Session Management | no | No session changes |
| V4 Access Control | no | No RLS/policy changes (unless A1 forces a migration) |
| V6 Cryptography | no | None |

### Known Threat Patterns for {SvelteKit + Supabase}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed answer value (e.g. non-number for number question) | Tampering | Client `ensureValue` + server `validate_answer_value` RPC (both already enforce) |
| XSS via question/answer strings | Tampering | Existing `sanitizeHtml` on rendered HTML; new inputs render plain text/labels via Svelte auto-escaping |
| Open redirect on `/nominations` loader `?next=` | — | Not touched by the UNBLK-04 change (the located route's allowlist is separate); nominations loader adds only a data fetch |

## Sources

### Primary (HIGH confidence — verified by source read this session)
- `packages/dev-seed/src/templates/e2e/base.ts` (sections, alliances, nominations, opinion-answer templates) — the alliance gap + seed authoring
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` — alliance branch, MatchScore, settings-type TODO
- `apps/frontend/src/lib/contexts/voter/matchState.svelte.ts` — org→alliance imputation cascade + Org-first invariant
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` — `#entityTypes = results.sections`
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` — alliance section/tab rendering
- `packages/app-shared/src/settings/dynamicSettings.type.ts` + `dynamicSettings.ts` — `sections`/`cardContents` types + defaults
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte`, `QuestionChoices.svelte`; `input/QuestionInput.svelte`, `input/Input.svelte` — dispatch sites + reorder pattern
- `packages/data/src/objects/questions/variants/{numberQuestion,multipleChoiceCategoricalQuestion,multipleTextQuestion,singleChoiceCategoricalQuestion}.ts` + base `{choiceQuestion,multipleChoiceQuestion}.ts` — matching paradigm
- `apps/frontend/src/routes/(voters)/nominations/+layout.ts` + `(located)/+layout.ts` — loader parity
- `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` — number-branch gap
- `packages/dev-seed/src/templates/default.ts:259` — default already has alliance in sections
- `.planning/v2.14-E2E-COVERAGE-PLAN.md`, `129-CONTEXT.md`, `129-130-DISCUSSION.md`, `REQUIREMENTS.md`

### Secondary / Not fully traced (flagged in Open Questions)
- DB questions-table type/category constraint (A1) — not read this session
- Candidate-save / voter-action-button validity coupling (A4/OQ2) — not traced this session

## Metadata

**Confidence breakdown:**
- Alliance residual gap (UNBLK-06): HIGH — all 6 machinery files + seed read; single missing array element pinned
- Question-input dispatch + matching (UNBLK-01/02/05): HIGH — dispatch sites + reference impl read
- Nominations fix (UNBLK-04): HIGH — both loaders + `getQuestionData` signature read
- Seed authoring + buildMinimal (D-12/15/16): HIGH — templates read
- Voter-journey re-baseline scope (D-13): MEDIUM — key assertions read; exact new literals must be re-baselined empirically
- DB opinion-type acceptance (A1) + D-07 validity coupling: LOW — not traced; flagged as Open Questions

**Research date:** 2026-07-17
**Valid until:** ~2026-08-16 (30 days; stable in-repo domain, no external deps)
