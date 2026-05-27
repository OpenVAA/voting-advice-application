---
phase: quick
plan: 260527-nat
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/frontend/src/lib/components/entityFilters/EnumeratedEntityFilter.svelte
  - packages/filters/tests/filter.test.ts
  - packages/dev-seed/src/templates/baseV1.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte  # (TBD — see Task 3 investigation)
  - tests/tests/fixtures/results.fixture.ts
  - tests/tests/fixtures/entityFilters.fixture.ts
  - tests/tests/fixtures/entityDetails.fixture.ts
  - tests/tests/fixtures/index.ts
  - tests/tests/specs/voter/voter-mega-journey.spec.ts
autonomous: false
requirements: [TIR3-01, TIR3-02, TIR3-03, TIR3-04, TIR3-05, TIR3-06, TIR3-07, TIR3-08, TIR3-09]

must_haves:
  truths:
    - "Categorical entity filter: 'No answer' option is selectable, and when no filter values are selected, the candidate list shows 0 results (not auto-fill-all)."
    - "Every fixed-row name in baseV1 begins with a bracketed `[<id>]` token; question-category descs include `-NotSelected` / `-Skipped` variants where the spec relies on them."
    - "voter-mega-journey.spec.ts asserts the new card-contents shape (test-qu-info-text answer + 4-gauge submatches + election symbol 10 on first candidate) and the parties-tab probe is gone from result-card-contents step."
    - "New fixtures `resultsPage`, `entityFilters`, `entityFilterDialog`, `entityFilter`, `entityDetails` exist with the methods listed in the scope doc, and the EDIT/ADD/REFACTOR steps in voter-mega-journey use them (no raw testid lookups for those surfaces in the touched steps)."
    - "New step matching:organisations passes on regional election: 5 outer org cards; Party BB first with 2 children + no Show-all; Party AA with 3 + Show-all-5 expand→Collapse-list contract."
    - "New step filters:text passes: setTextFilter('polar') → 2 cards (Polar-Max, Polar-Min); clearTextFilter restores."
    - "New step filters:dialog passes the full Party / pick-multiple / years-of-experience interaction sequence verbatim from the scope doc."
    - "Steps `detail: drawer open`, `detail: Polar-Max info-items`, `filters: toggle without effect_update_depth_exceeded`, `filters: plural tab switch reset + drawer survival + browser back`, `filters: SETTINGS-01 wave B Number/Text/Choice/Group/MissingValue` are REMOVED from voter-mega-journey.spec.ts."
    - "Step `detail: 9.6.5-8 voter-vs-entity matrix on CA-AA-Special` renamed and refactored to use the new fixtures."
    - "Step `party-drawer: …` renamed `organisation details` and refactored to use the new fixtures (selectElection reg → selectEntityTab orgs → openEntityDetailsForCard /Party AA/ → expectTabs info/members/opinions → expectInfoItems Election/Regional Election + Constituency/Region North + alliance/Alliance A (AL-A) → getMemberCards count 5)."
    - "TEXT_RE constant block is removed from voter-mega-journey.spec.ts after task 2 lands; remaining regex literals live inline or in the fixture utilities."
    - "Settings shape `results.cardContents.candidate` accepts a `{question: <external-id>}` form that resolves at app-load time to the DB question (no hard-coded UUID in seed templates)."
    - "Full voter-mega-journey project runs GREEN at the end of task 9."
  artifacts:
    - path: "tests/tests/fixtures/results.fixture.ts"
      provides: "resultsPage fixture (selectElection, selectEntityTab, expectEntityTabs/getEntityTabs, getEntityCards, getEntityCard, dismissAllDialogs, openEntityDetailsForCard)"
    - path: "tests/tests/fixtures/entityFilters.fixture.ts"
      provides: "entityFilters + entityFilterDialog + entityFilter fixtures (text filter, dialog open/close/reset, filter selection/setNumberRange/setSelection/getOptions/getOption, badge accessor)"
    - path: "tests/tests/fixtures/entityDetails.fixture.ts"
      provides: "entityDetails fixture (selectTab, expectTabs, getInfoItems, expectInfoItem, getQuestionDisplays, expectQuestionDisplay, getMemberCards)"
    - path: "tests/tests/fixtures/index.ts"
      provides: "merged voterTest export with all new fixtures composed in"
    - path: "apps/frontend/src/lib/components/entityFilters/EnumeratedEntityFilter.svelte"
      provides: "FIX — empty-selection produces 0 results; No answer chip selectable + initially un-checked when filter is inactive"
    - path: "packages/dev-seed/src/templates/baseV1.ts"
      provides: "all fixed-row names prefixed `[<id>]`; renamed Opt-A/Opt-B category descs to NotSelected / Skipped variants; cardContents.candidate extended"
    - path: "tests/tests/specs/voter/voter-mega-journey.spec.ts"
      provides: "TIR3-aligned step list: EDIT result-card-contents + ADD matching:organisations + ADD filters:text + ADD filters:dialog + REFACTOR 9.6.5-8 + REFACTOR organisation-details + REMOVE 5 steps + TEXT_RE consts removed"
  key_links:
    - from: "EnumeratedEntityFilter.svelte"
      to: "ChoiceQuestionFilter.include"
      via: "$effect updating filter.include from selected[]"
      pattern: "filter\\.include\\s*="
    - from: "baseV1.ts cardContents.candidate"
      to: "frontend EntityCard.svelte"
      via: "QuestionInCardContent.question resolved by external_id → DB id"
      pattern: "QuestionInCardContent|cardContents\\.candidate"
    - from: "voter-mega-journey.spec.ts"
      to: "tests/tests/fixtures/index.ts"
      via: "voterTest = test extended with results/entityFilters/entityDetails fixtures"
      pattern: "from\\s+['\"]\\.\\./\\.\\./fixtures"
---

<objective>

Apply the operator-authored work order `TEST-INVENTORY-REFACTOR-3.md` to the voter-mega-journey test surface and the related production / dev-seed / fixture code paths it touches.

**Why this is a 9-task quick task (not a 1–3-task quick task):** the scope doc contains 8 distinct work clusters that cross 5 packages (frontend filter component, filters/dev-seed packages, dynamic settings type, Playwright fixtures library, and the mega-journey spec itself). Combining them into 1–3 tasks would mean either (a) a single mega-commit that can't be reverted granularly when a downstream task surfaces a bug in an upstream task, or (b) loss of vertical-slice atomicity — e.g. the new fixtures library only becomes useful AFTER specs are refactored to use it, but the spec refactor only makes sense AFTER the fixtures exist. Splitting cluster-by-cluster gives:

- one atomic commit per logical unit ("fix bug X" / "rename Y" / "add fixture Z")
- a fixtures-first ordering so spec tasks have something concrete to consume (Tasks 5–9 declare `depends_on: 4`)
- a final task that runs the full mega-journey project as the integration gate

**Purpose:** unblock the next round of voter-mega-journey assertion sharpening + permission for the perm-* family to consume the same fixtures.

**Output:** the test catalog mutation listed in `must_haves.truths`, with the full voter-mega-journey project green at the end of task 9.

**Per-operator-memory acknowledgments:**
- `project_gsd_repo_hook_workaround.md`: every commit MUST use `git -c core.hooksPath=/dev/null commit …`.
- `feedback_e2e_did_not_run.md`: a CASCADE / did-not-run during task 9 verification counts as a failure — investigate upstream rather than declaring green.
- `project_all_green_suite_priority.md`: prioritize green-on-baseV1-project; secondary failures elsewhere in the suite are out-of-scope unless directly caused by this work.
- A pre-baseline commit `27ef8f998` already added `entitySelected` testId, opt-a/opt-b rename in baseV1, TIMEOUT/TEXT_RE/named-args/locator hardening in voter-mega-journey, and EntityOpinions D7 RLS hardening — DO NOT roll these back. Read its diff before editing the same regions.

</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@TEST-INVENTORY-REFACTOR-3.md
@CLAUDE.md
@.planning/STATE.md
@.planning/phases/88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba/88-CONTEXT.md
@tests/tests/specs/voter/voter-mega-journey.spec.ts
@tests/tests/fixtures/voter.fixture.ts
@tests/tests/utils/testIds.ts
@packages/dev-seed/src/templates/baseV1.ts
@packages/dev-seed/src/templates/permutations/perm-1e1cg1co.ts
@packages/dev-seed/src/templates/permutations/shared.ts
@apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte
@apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte
@packages/filters/src/filter/enumerated/choiceQuestionFilter.ts
@packages/filters/src/filter/enumerated/enumeratedFilter.ts
@packages/app-shared/src/settings/dynamicSettings.type.ts

<interfaces>
<!-- Key contracts and identifiers executors need. -->

`EnumeratedEntityFilter.svelte` shape (relevant lines paraphrased):
- imports `isMissing, MISSING_VALUE` from `@openvaa/filters`
- `let { filter, targets } = $props()` — `filter` is a ChoiceQuestionFilter (or sibling enumerated filter)
- `const values = filter.parseValues(targets)` — array of `{ value, object, count }` where `value` may be `MISSING_VALUE`
- `let selected: Array<MaybeMissing<string>> = $state([])`
- `updateSelected()` initializes `selected = filter.include?.length ? filter.include : values.map(v => v.value)` — **this is the auto-select-all-when-none default that the scope doc wants reverted**
- `parseSelected(selectedValues)` returns `undefined` when `selectedValues.length === values.length` (i.e. when "all" selected → no filter) or the selection otherwise — **must change semantics: undefined ONLY when filter inactive (a separate flag), and `[]` empty selection produces 0 results**
- `convertMissingForInputs` has an existing bug: `isMissing(isMissing)` instead of `isMissing(v)` — line 104. Fixing this is part of Task 1 (the No-answer option currently can't be selected because the missingValue sentinel is never substituted into the input value list).
- `filter.include` semantics: `undefined` → filter inactive (everything passes); `[]` → empty allow-list (nothing passes); `[…ids]` → allow only listed.

`ChoiceQuestionFilter` from `@openvaa/filters` — `processValueForDisplay(MISSING_VALUE, count)` returns `{ value: MISSING_VALUE, count, object: undefined }`. The display label is `t('entityFilters.missingValue')` when `object == null` (per `EnumeratedEntityFilter.svelte:118-119`).

`results.cardContents` types (from `dynamicSettings.type.ts:193-244`):
```ts
candidate: Array<'submatches' | QuestionInCardContent>
```
`QuestionInCardContent` is defined elsewhere in the same file (search for `type QuestionInCardContent`). Task 3 MUST resolve whether it accepts `{question: string}` (external_id) or `{question: <DB-UUID>}` — if external_id is not yet supported, the task adds it (either by widening the type or by adding a sibling discriminated form).

`testIds` keys currently in use by mega-journey:
- `voter.results.electionAccordion` = `'voter-results-election-select'`
- `voter.results.entityTabs` = `'voter-results-entity-tabs'`
- `voter.results.candidateSection` = `'voter-results-candidate-section'`
- `voter.results.partySection` = `'voter-results-party-section'`
- `voter.results.card` = `'entity-card'`
- `voter.results.cardTitle` = `'entity-card-title'`
- `voter.entityDetail.{infoTab,opinionsTab,childrenTab,opinionQuestion,entitySelectedAnswer}`
- `'entity-card-action'` (raw — not in registry yet)
- `'entity-list-filter'` (raw — not in registry yet)
- `'info-item'` (raw — not in registry yet)
- `'opinion-question-input'` (raw — not in registry yet)

The new fixtures SHOULD prefer the centralized `testIds` registry; raw testids that the fixtures need MUST be promoted into `testIds` in the same fixture-introducing commit.

baseV1 fixed rows (current naming examples — see lines 540-595 + 716-770 of baseV1.ts):
- Question categories use `name: { en: 'Base Opinion Questions' }`, etc.
- Questions use `name: { en: 'Base opinion 1 — Likert 5.' }`, etc.
- The perm-* family already uses `name: { en: '[EL1] Single election' }` — extend that bracketed-token convention into baseV1 fixed rows. The exact ID to put in brackets is the bare external_id (e.g. `[el-reg]` for `external_id: 'test-el-reg'`).

Operator-renamed Opt-A / Opt-B category descs (scope doc lines 17-19):
- Current: `name: { en: 'Optional Opinion Questions A' }` (external_id `test-qg-opin-opt-a`) → new: should END with the suffix `-NotSelected` (mapped from "Opt A — Not selected in categories intro" intent in the spec walk). Recommended literal: `name: { en: '[opt-a-NotSelected] Optional Opinion Questions A' }`.
- Current: `name: { en: 'Optional Opinion Questions B' }` (external_id `test-qg-opin-opt-b`) → new: `name: { en: '[opt-b-Skipped] Optional Opinion Questions B' }` (the voter SKIPS this category at the intro).

After Task 2 lands, voter-mega-journey TEXT_RE entries `optionalOpinionsA` / `optionalOpinionsB` continue to match because they're case-insensitive prefix probes; HOWEVER the `baseOpinion`, `regionalOpinionsCategory`, `regionallyFilteredCategory`, `baseOpinion1Likert5`, `baseOpinion5Boolean`, `regionalOpinionsQuestion`, `filtMunNeOpinion` entries also need their literal text updated to either match the new `[ID]` prefix OR to drop the regex literal in favour of inline matches (per scope doc "Remove TEXT_RE afterwards" — this is Task 9's job).
</interfaces>

</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix categorical entity filter — `No answer` selectability + empty-selection-yields-zero-results</name>
  <files>apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte, packages/filters/tests/filter.test.ts</files>
  <action>
    Cluster #1 from scope doc.

    **Locate the bug surface first.** The only consumer of categorical filters in the voter app is `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte` (see EntityFilters.svelte dispatch). Read this file before editing.

    **Three defects to fix (the scope doc cites three distinct symptoms):**

    1. **"No answer" option not selectable.** Line 104 reads `isMissing(isMissing) ? missingValue : v` — this is a typo: the argument should be `v`, not `isMissing` (which is a function reference, never missing-equal). The expression evaluates to `false` for every value, so the `missingValue` sentinel is never substituted, and the rendered `<input value={value}>` for the MISSING_VALUE row holds the literal MISSING_VALUE symbol/object — un-toggleable from the DOM. Fix to `isMissing(v) ? missingValue : v`.

    2. **"No answer" option not auto-selected when no filters are on.** Currently `updateSelected()` initializes `selected = filter.include?.length ? filter.include : values.map(v => v.value)` — when the filter is inactive (`filter.include === undefined`), every option (including No answer) is "selected" in the UI. The scope doc says: when no filters are on, **show "No answer" as un-checked** (i.e. when filter is inactive, the UI must reflect an empty selection but NOT actively filter). Refactor `updateSelected()` so that when `filter.include` is undefined (filter inactive), `selected` is `[]` (empty UI state); only when `filter.include` is a non-empty array does selected mirror it. The `parseSelected()` helper must change correspondingly: empty `selected` writes `filter.include = []` (allow-list of zero → 0 results), and the "all selected" shortcut writes `undefined` (active filter erased). The "auto-select all when none selected" behavior at the `$effect` boundary is what the scope doc explicitly wants reverted — allow the empty-allow-list to propagate.

    3. **"Auto-select-all when nothing selected" revert.** Search for any code path (likely in `parseSelected` or the `$effect` block at line 62-64) that converts `selected.length === 0` into `filter.include = undefined`. Remove that path. Empty selection → empty allow-list → 0 results.

    **Edge case:** the `toggleSelectAll()` button (line 96-98) flips between empty and full. With the new semantics, "all selected" still writes `filter.include = undefined` (no filter), and "empty" writes `filter.include = []` (0 results). The button label/icon should still toggle correctly — verify the `allSelected = $derived(selected.length === values.length)` derivation continues to work.

    **Initialization:** the existing `updateSelected()` call at component init (line 55) must NOT pre-fill `selected` when filter is inactive. After this change, `selected` initializes to `[]` and the user must opt-in to any selection — including "No answer."

    **Add a unit test** in `packages/filters/tests/filter.test.ts` for `ChoiceQuestionFilter` covering: (a) empty `include = []` → zero matches; (b) `include = [MISSING_VALUE]` → only entities with no answer match; (c) `include = undefined` → all entities match (filter inactive). If a similar test exists already, augment rather than duplicate.

    **DO NOT touch** `NumericEntityFilter.svelte` or `TextEntityFilter.svelte` — out-of-scope.
  </action>
  <verify>
    <automated>cd packages/filters && yarn test:unit && cd ../.. && yarn workspace @openvaa/frontend exec svelte-check --tsconfig ./tsconfig.json apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte</automated>
    <human-check>Run `yarn dev` + `yarn db:reset-with-data`; navigate to `/results/candidates`; open filter dialog → expand the multipleChoiceCategorical "pick multiple categories" filter; confirm: (a) on open, **no options** are checked (including No answer); (b) clicking "No answer" toggles it on; (c) with No answer as the only selection, the candidate list shows exactly the candidates with no answer for that question (per baseV1 dataset: the Free-independent candidate is the one designed to have no answer to pick-multiple — exact count verified empirically against the seed at task time).</human-check>
  </verify>
  <done>
    - `isMissing(isMissing)` → `isMissing(v)` typo fixed.
    - `updateSelected()` no longer pre-fills `selected` when `filter.include === undefined`.
    - `parseSelected()` returns `[]` for empty selection (not `undefined`) — empty selection drives 0 results.
    - `toggleSelectAll()` continues to flip correctly.
    - Unit test in `packages/filters/tests/filter.test.ts` covers `include = []` → 0 matches.
    - `svelte-check` clean on the touched component.
    - Committed: `git -c core.hooksPath=/dev/null commit -m "fix(entity-filters): No-answer selectable + empty-selection yields 0 results (TIR3 cluster 1)"`.
  </done>
</task>

<task type="auto">
  <name>Task 2: baseV1 `[ID] desc` rename + Opt-A `-NotSelected` / Opt-B `-Skipped` category descs</name>
  <files>packages/dev-seed/src/templates/baseV1.ts</files>
  <action>
    Cluster #2 from scope doc.

    **Read the pre-baseline commit `27ef8f998` first** (`git show 27ef8f998 -- packages/dev-seed/src/templates/baseV1.ts`) to understand what's already renamed. The opt-a/opt-b external_id rename already landed there. This task adds the bracketed display-name convention.

    **Convention** (mirroring `packages/dev-seed/src/templates/permutations/perm-1e1cg1co.ts:40`): every fixed-row `name: { en: '<old>' }` becomes `name: { en: '[<id-token>] <old>' }`, where `<id-token>` is the bare external_id with the `test-` prefix stripped (so `external_id: 'test-el-reg'` → token `el-reg`).

    **Apply to all fixed rows in baseV1.ts** including:
    - `elections.fixed[]`: 2 entries
    - `constituency_groups.fixed[]`: 2 entries
    - `constituencies.fixed[]`: 6 entries
    - `organizations.fixed[]`: 5 entries (alliances + parties)
    - `question_categories.fixed[]`: 8 entries (1 info + 7 opinion)
    - `questions.fixed[]`: all opinion + info questions (the question `name` is the human-readable prompt — `[ID]` prefix it)
    - `candidates.fixed[]`: each candidate row's `first_name` / `last_name` is NOT a `name: { en: ... }` shape — SKIP candidate rows (their card titles are driven by first/last name; keep as-is).
    - `nominations.fixed[]`: nominations have no `name` field — skip.

    **Special category renames (scope doc lines 17-19):**
    - `external_id: 'test-qg-opin-opt-a'` → name: `{ en: '[opt-a-NotSelected] Optional Opinion Questions A' }` (was: `'Optional Opinion Questions A'`).
    - `external_id: 'test-qg-opin-opt-b'` → name: `{ en: '[opt-b-Skipped] Optional Opinion Questions B' }` (was: `'Optional Opinion Questions B'`).

    **Do NOT touch external_ids** — that path is already done. Only `name: { en: ... }` literals get the bracketed prefix.

    **Do NOT touch settings or DEFAULT_INFO_ANSWERS / POLAR_MAX / POLAR_MIN / GENERIC / SPECIAL constants.**

    **TEXT_RE in voter-mega-journey.spec.ts becomes partially stale here.** Task 9 cleans up TEXT_RE; this task only changes baseV1. After this task, expect voter-mega-journey to fail on the TEXT_RE.optionalOpinionsA / optionalOpinionsB / baseOpinion / etc. matches — that's intentional and is what task 9 reconciles. Verify command for this task is therefore a SEED + lint only, NOT a spec run.
  </action>
  <verify>
    <automated>yarn db:reset && yarn db:seed --template baseV1 2>&1 | tail -20 && yarn workspace @openvaa/dev-seed exec tsc --noEmit</automated>
  </verify>
  <done>
    - Every fixed-row `name: { en: ... }` in baseV1.ts starts with `[<id-token>] `.
    - Opt-A category: `[opt-a-NotSelected] Optional Opinion Questions A`.
    - Opt-B category: `[opt-b-Skipped] Optional Opinion Questions B`.
    - `yarn db:seed --template baseV1` succeeds (Total rows count unchanged from pre-rename seed).
    - `tsc --noEmit` clean on dev-seed package.
    - Committed: `git -c core.hooksPath=/dev/null commit -m "refactor(baseV1): apply [ID] desc convention to all fixed rows; rename opt-a/opt-b categories to NotSelected/Skipped (TIR3 cluster 2)"`.
    - **Known follow-on:** voter-mega-journey TEXT_RE matches against bracket-prefixed names will fail until Task 9 — DO NOT attempt to run the mega-journey spec in this task.
  </done>
</task>

<task type="auto">
  <name>Task 3: Settings — add `{question: 'test-qu-info-text'}` to `results.cardContents.candidate`</name>
  <files>packages/app-shared/src/settings/dynamicSettings.type.ts, packages/dev-seed/src/templates/baseV1.ts, apps/frontend/src/lib/dynamic-components/entityCard/ (touchpoint TBD via investigation)</files>
  <action>
    Cluster #3 from scope doc.

    **Investigation step (do this FIRST, in-task):**

    1. `grep -rn "QuestionInCardContent" packages/app-shared/src/ apps/frontend/src/lib/` — locate the existing type def + every consumer.
    2. Inspect the type definition. The scope doc proposes:
       ```ts
       candidate: ['submatches', { question: <DB-ID-FOR-EXTERNAL-ID-'test-qu-info-text'> }]
       ```
       But hard-coding a DB UUID into a seed template is a non-starter — Supabase generates UUIDs at seed time. Two viable strategies:
       - **(A) external_id → DB id resolution at app load.** Widen `QuestionInCardContent` (or add a parallel shape) to accept `{ question: string }` where `string` is interpreted as a question external_id. Resolution to the actual question object happens in the frontend's settings derivation (the same place that already resolves question references — search for where `cardContents` is consumed in EntityCard rendering).
       - **(B) Resolve in dev-seed.** Have the dev-seed Writer rewrite `cardContents.candidate` references to resolved UUIDs after questions are seeded. More invasive.

       **Pick A** (less invasive, matches the scope doc's "FETCH DB ID FOR question with ex id of 'test-qu-info-text'" intent — i.e. lookup at consumption time, not at seed time).

    3. Locate the EntityCard rendering surface that consumes `cardContents.candidate`. Likely paths to check: `apps/frontend/src/lib/dynamic-components/entityCard/`, `apps/frontend/src/lib/components/entityCard/`, or wherever the existing 'submatches' string is matched. Trace via grep: `grep -rn "submatches" apps/frontend/src/lib/` and find the rendering switch.

    **Implementation:**

    a. **Type widening** in `dynamicSettings.type.ts`: locate `QuestionInCardContent` and either widen its `question` field to accept `string` (external_id) in addition to whatever it currently accepts, OR add a discriminated alternative form. Document the new shape inline.

    b. **Frontend resolver:** at the EntityCard consumer site, when a `cardContents` item has shape `{ question: <string> }`, look up the question by external_id (the data model exposes questions by external_id — verify via grep in `packages/data/src/`). If the question is not found, render nothing for that slot (don't crash).

    c. **Seed wiring:** update `packages/dev-seed/src/templates/baseV1.ts:204` from:
       ```ts
       candidate: ['submatches'],
       ```
       to:
       ```ts
       candidate: ['submatches', { question: 'test-qu-info-text' }],
       ```

    d. **Verify no UUID hard-coding** anywhere: grep the change with `grep -n "question.*:" packages/dev-seed/src/templates/baseV1.ts` and confirm the string literal is the external_id, not a UUID.

    **Do NOT modify** `default.ts`, `e2e.ts`, or permutation templates — out-of-scope.

    **DO NOT** alter the `submatches` rendering — only add the new shape alongside it.
  </action>
  <verify>
    <automated>yarn workspace @openvaa/app-shared build && yarn workspace @openvaa/dev-seed exec tsc --noEmit && yarn db:reset && yarn db:seed --template baseV1 2>&1 | tail -10</automated>
    <human-check>Run `yarn dev`; navigate to `/results/candidates`; on the first candidate card, confirm the rendered card now shows the candidate's text answer to `test-qu-info-text` ("Default candidate biography text." for non-Special candidates) in addition to submatches.</human-check>
  </verify>
  <done>
    - `QuestionInCardContent` (or a parallel shape) accepts `{ question: <external_id string> }`.
    - Frontend resolves the external_id to the question at card-render time, gracefully no-ops if not found.
    - baseV1.ts cardContents.candidate is `['submatches', { question: 'test-qu-info-text' }]`.
    - No UUID hard-coding.
    - app-shared build + dev-seed tsc clean; seed succeeds.
    - Committed: `git -c core.hooksPath=/dev/null commit -m "feat(settings): cardContents accepts {question: external_id} + wire into baseV1 (TIR3 cluster 3)"`.
  </done>
</task>

<task type="auto">
  <name>Task 4: Fixtures library — resultsPage / entityFilters / entityFilterDialog / entityFilter / entityDetails</name>
  <files>tests/tests/fixtures/results.fixture.ts, tests/tests/fixtures/entityFilters.fixture.ts, tests/tests/fixtures/entityDetails.fixture.ts, tests/tests/fixtures/index.ts, tests/tests/utils/testIds.ts</files>
  <action>
    Cluster #4 from scope doc. **This task introduces the fixture vocabulary that tasks 5-9 depend on. Do NOT modify voter-mega-journey.spec.ts in this task.**

    **Architecture:** Playwright fixture composition pattern. The existing `tests/tests/fixtures/voter.fixture.ts` uses `base.extend<…>(…)` — extend the same pattern. The new fixtures should be COMPOSABLE (any spec can opt into any subset), so each fixture lives in its own file, and `tests/tests/fixtures/index.ts` re-exports a `voterTest` that composes them all.

    **Promote raw testids to the central registry FIRST.** Add to `tests/tests/utils/testIds.ts`:
    - `voter.results.entityCardAction`: `'entity-card-action'`
    - `voter.results.entityListFilter`: `'entity-list-filter'`
    - `voter.entityDetail.infoItem`: `'info-item'`
    - `voter.entityDetail.opinionQuestionInput`: `'opinion-question-input'`
    - `voter.entityDetail.scoreGauge`: `'score-gauge'` (or whatever testid the frontend renders for the 4-gauge submatches — grep the frontend first to find the actual testid; if missing, ADD it to the frontend component too).
    - `voter.results.electionSymbol`: `'election-symbol'` (or whatever the current testid is — grep)
    - `voter.entityFilters.filterButtonBadge`: `'entity-list-filter-badge'` (or whatever — grep; if missing, add).

    **Where to grep:** `grep -rn 'data-testid=' apps/frontend/src/lib/components/entityCards apps/frontend/src/lib/dynamic-components apps/frontend/src/lib/components/electionSymbol` — promote any raw string referenced by 2+ fixtures.

    **Fixture: `resultsPage`** (file: `tests/tests/fixtures/results.fixture.ts`)

    Methods (each returns a Promise or a Locator; concrete signatures the executor refines):
    - `selectElection(matcher: RegExp | string | ((count: number) => number))` — clicks the election accordion option matched by name (RegExp/string) or by index function. Re-uses the helper `expectElectionOptionAndSelect` logic from voter-mega-journey.spec.ts:273-291 (the AccordionSelect interaction quirk — click visible-active to re-expand if only one option visible).
    - `selectEntityTab(entityType: 'candidates' | 'organizations' | 'alliances')` — clicks the tab; waits for the section testid to be visible.
    - `getEntityTabs(): Locator` and `expectEntityTabs(types: Array<string>)` — returns the tab list, asserts the visible tab labels match.
    - `getEntityCards(): Locator` — returns the outer-card locator for the currently-active section. For orgs/alliances "should get only outer cards" — i.e. skip nested child candidate cards inside an org card. Implementation hint: scope to the section testid + filter via `:not([data-testid="<inner-card-marker>"])` if needed; otherwise grep the actual DOM shape and write the locator deterministically.
    - `getEntityCard(matcher: RegExp | string | ((count: number) => number)): Locator` — `.filter({hasText: matcher})` or `.nth(index)`.
    - `dismissAllDialogs()` — best-effort Escape + close-button (reuse `closeAnyOpenDialog` from voter-mega-journey.spec.ts:338-363 logic).
    - `openEntityDetailsForCard(matcher: RegExp | string | ((count: number) => number))` — locate card → click its `entity-card-action` → wait for `role=dialog` visible → returns the dialog locator.

    **Fixture: `entityFilters`** (file: `tests/tests/fixtures/entityFilters.fixture.ts`)

    Methods:
    - `getTextFilter(): Locator` — page-level text-filter input.
    - `setTextFilter(text: string)` — fill the input + wait for debounced settle (300ms grace OR until card count changes, whichever first).
    - `clearTextFilter()` — clear + wait for settle.
    - `openFilterDialog(): Promise<EntityFilterDialog>` — click `entity-list-filter` button → wait for dialog visible → return a wrapper exposing the `entityFilterDialog` methods below.
    - `getFilterButtonBadge(): Locator` — returns the filter-button badge (counter).

    **Sub-fixture: `entityFilterDialog`** — methods returned by `openFilterDialog()`:
    - `getFilters(): Locator` — every filter section inside the dialog (Expander rows, per EntityFilters.svelte).
    - `getFilter(matcher: RegExp | string | ((count: number) => number)): EntityFilter` — locate one filter by its expander title; returns an EntityFilter wrapper.
    - `expectResetToBeDisabled({disabled: boolean})` — assertion helper on the reset button.
    - `close()` — close button OR Escape; assert dialog hidden.
    - `reset()` — click the dialog's reset button.

    **Sub-fixture: `entityFilter`** — methods returned by `entityFilterDialog.getFilter()`:
    - `getOptions(): Locator` — child option locator inside the filter section.
    - `getOption(matcher: RegExp | string | ((count: number) => number)): Locator`.
    - `setSelection(values: RegExp | string | Array<string> | ((count: number) => Array<number>) | undefined)` — checkbox-only. `undefined` means select-all (toggle-all-on); array means select exactly those; RegExp matches a single option (per the scope doc's `setSelection(/No answer)` example, single-value RegExp is treated as "select only the one matching").
    - `setNumberRange(min?: number | null, max?: number | null)` — for NumericEntityFilter; null means leave-as-is.

    **Fixture: `entityDetails`** (file: `tests/tests/fixtures/entityDetails.fixture.ts`)

    Methods (operate on a dialog `Locator` passed in OR on the currently-open `role=dialog` per page):
    - `selectTab(tabType: 'info' | 'opinions' | 'members' | 'children')` — clicks the tab by accessible name (uses TEXT_RE-equivalent regex internally for i18n flexibility).
    - `expectTabs(types: Array<string>)` — asserts the visible tab list.
    - `getInfoItems(): Locator` — `getByTestId(testIds.voter.entityDetail.infoItem)` inside the dialog's infoTab.
    - `expectInfoItem(label: RegExp | string, value: RegExp | string)` — locate the info-item whose first child matches `label`, assert its value-child contains `value`. (See voter-mega-journey.spec.ts:945-983 for the pattern.)
    - `getQuestionDisplays(): Locator` — `getByTestId(testIds.voter.entityDetail.opinionQuestion)` inside opinionsTab.
    - `expectQuestionDisplay({questionText, numSelected, infoText?})` — port of the existing `expectQuestionDisplayToHave` helper at voter-mega-journey.spec.ts:304-326.
    - `getMemberCards(): Locator` — inside the children/members tab.

    **Composition** (`tests/tests/fixtures/index.ts`): merge the existing `voterTest` from `voter.fixture.ts` with the three new fixtures so a spec can write:
    ```ts
    import { test, expect } from '../../fixtures';
    test('foo', async ({ page, resultsPage, entityFilters, entityDetails }) => { … });
    ```
    Backward-compat: `voter.fixture.ts` keeps its existing export (other specs depend on it). The new `fixtures/index.ts` re-exports `voterTest` AS the canonical `test` and explicitly re-exports `expect`.

    **DO NOT modify voter-mega-journey.spec.ts in this task.** Specs migrate in tasks 5-9.

    **Risk:** the fixture API surface is intentionally rich. Land minimum-viable methods (per scope doc bullet list) — don't speculate beyond. Each method should have a JSDoc one-liner pointing at the cluster of voter-mega-journey logic it replaces.
  </action>
  <verify>
    <automated>cd tests && yarn exec tsc --noEmit 2>&1 | tail -30 && cd .. && yarn lint:check tests/tests/fixtures/ 2>&1 | tail -20</automated>
  </verify>
  <done>
    - Three new fixture files exist with the methods listed in the scope doc.
    - `tests/tests/fixtures/index.ts` exports a composed `voterTest` + `expect`.
    - `testIds.ts` has been augmented with the promoted raw testids; any frontend testid additions also landed.
    - TypeScript clean across the tests project.
    - voter-mega-journey.spec.ts UNCHANGED (tasks 5-9 own its migration).
    - Committed: `git -c core.hooksPath=/dev/null commit -m "feat(tests/fixtures): introduce resultsPage / entityFilters / entityDetails fixtures (TIR3 cluster 4)"`.
  </done>
</task>

<task type="auto">
  <name>Task 5: EDIT step — `result-card-contents` refactored to fixtures + new assertions</name>
  <files>tests/tests/specs/voter/voter-mega-journey.spec.ts</files>
  <action>
    Cluster #5 from scope doc. Depends on Task 4.

    Locate the step at voter-mega-journey.spec.ts:794-821 (`result-card-content: portraits / submatches / independent / alliance info / 3-cand expand / election switching`). Refactor it to use the new fixtures:

    ```ts
    await test.step('results: card contents (EDIT TIR3)', async () => {
      const card = await resultsPage.getEntityCard(0); // first candidate card
      // expect answer to test-qu-info-text shown — exact text per baseV1 DEFAULT_INFO_ANSWERS
      await expect(card).toContainText(/Default candidate biography text/i);
      // expect submatches visible with 4 score gauges
      const gauges = card.getByTestId(testIds.voter.entityDetail.scoreGauge); // or whatever the gauge testid is
      await expect(gauges).toHaveCount(4);
      // expect election symbol 10 (CA-AA-1 / Polar-Max first card per baseV1 ranking + 260525-tea symbol "10" — verify the FIRST card's symbol against the actual ranked candidate at the time the test runs)
      const symbol = card.getByTestId(testIds.voter.results.electionSymbol);
      await expect(symbol).toContainText('10');
    });
    ```

    **REMOVE the trailing parties-tab assertion block** (lines 813-821):
    ```ts
    // Switch to parties tab and assert at least 1 organization card. [DELETE]
    const entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
    await entityTabs.getByRole('tab', { name: TEXT_RE.partiesTab }).click();
    const partySection = page.getByTestId(testIds.voter.results.partySection);
    await expect(partySection).toBeVisible({ timeout: TIMEOUT.slowPage });
    const partyCards = partySection.getByTestId(testIds.voter.results.card);
    const partyCount = await partyCards.count();
    expect(partyCount).toBeGreaterThan(0);
    ```
    This block is replaced by the new `matching: organisations` step in Task 8.

    **Election symbol verification:** Per scope doc "expect to have election symbol 10". Cross-check at task execution time: which candidate ranks first under baseV1's voter-walk in the mega-journey? Per the existing matching step (voter-mega-journey.spec.ts:854), the first card is a Polar-Max candidate. Per 260525-tea (STATE.md), election symbols are "2"…"30" sequentially. Per voter-mega-journey.spec.ts:903, CA-AA-1 carries symbol "10". The scope doc's "10" matches CA-AA-1 — confirmed.

    **Switch the spec's import** from `import { expect, test } from '@playwright/test'` to `import { expect, test } from '../../fixtures'` (the composed voterTest) — but DO THIS only for the spec file, and verify the destructured fixture args in the existing top-level `test('full voter journey end-to-end', async ({ page }) => { … })` are augmented to `async ({ page, resultsPage, entityFilters, entityDetails }) => { … }`. Tasks 6-9 use these fixture handles too.

    **Do NOT touch the `matching:` step at voter-mega-journey.spec.ts:827-863** — out of scope (Task 8 only ADDS a new matching:organisations step). The current matching step stays as-is.
  </action>
  <verify>
    <automated>yarn test:e2e --project=voter-mega-journey --grep "results: card contents" 2>&1 | tail -30</automated>
  </verify>
  <done>
    - The result-card-contents step uses fixtures and asserts: test-qu-info-text answer text + 4 score gauges + election symbol "10".
    - The parties-tab assertion block at the end of the step is REMOVED.
    - Spec imports `test, expect` from `../../fixtures` (the new composed voterTest).
    - The targeted step PASSES under `--grep`.
    - Committed: `git -c core.hooksPath=/dev/null commit -m "test(voter-mega): refactor result-card-contents step to fixtures + new contract (TIR3 cluster 5)"`.
  </done>
</task>

<task type="auto">
  <name>Task 6: REMOVE redundant steps (drawer open, Polar-Max info-items, 3 filter steps)</name>
  <files>tests/tests/specs/voter/voter-mega-journey.spec.ts</files>
  <action>
    Cluster #7 from scope doc. Depends on Task 5 (test-imports already swapped).

    **DELETE the following `test.step(...)` blocks in voter-mega-journey.spec.ts (with surrounding comment headers if they're step-specific):**

    1. **`detail: drawer open + info/opinions tabs`** (lines 869-884) — REMOVE. The drawer-open contract is implicitly tested by the refactored `detail: 9.6.5-8 voter-vs-entity matrix` step (Task 7) which opens the drawer on CA-AA-Special.

    2. **`detail: Polar-Max info-items — exact count + electionSymbol "3"`** (lines 886-904) — REMOVE. Scope doc lists this in the REMOVE block. The election-symbol assertion is now covered by Task 5's "election symbol 10" assertion on the first card.

    3. **`filters: toggle without effect_update_depth_exceeded (MOVED 9.5.5 / RESULTS-01+02)`** (lines 1068-1094) — REMOVE. Per scope doc: "MOVED 9.5.5 / RESULTS-01+02" (lives elsewhere now).

    4. **`filters: plural tab switch reset + drawer survival + browser back (MOVED 9.5.6, 9.5.7, 9.5.10 / D-13+14+15)`** (lines 1096-1153) — REMOVE.

    5. **`filters: SETTINGS-01 wave B Number/Text/Choice/Group/MissingValue (MOVED 9.5.14-9.5.18)`** (lines 1155-1215) — REMOVE.

    **After deletions, audit imports + helpers:**
    - The module-scope helpers `createConsoleErrorWatcher`, `probeDrawerSurvival`, `openAndToggleFilterIfAvailable`, `openAndApplyFilterIfAvailable`, `openFilterDialogIfAvailable`, `toggleFirstFilterCheckbox`, `closeFilterDialog` were ONLY used by the deleted filter steps. DELETE the helpers too (their dead-code removal keeps lint clean).
    - The `ConsoleMessage` import from `@playwright/test` may become unused — drop it.
    - Some `TEXT_RE` entries (`partiesTab`, `closeFiltersOrApply`, etc.) may now only be referenced by deleted code — DO NOT remove them in this task (Task 9 cleans up TEXT_RE wholesale).

    **DO NOT touch the matching step, party-drawer step, or the 9.6.5-8 matrix step here** — those are renamed/refactored in tasks 7+8, not removed.
  </action>
  <verify>
    <automated>yarn lint:check tests/tests/specs/voter/voter-mega-journey.spec.ts 2>&1 | tail -20 && yarn workspace tests exec tsc --noEmit 2>&1 | tail -20</automated>
  </verify>
  <done>
    - The 5 listed `test.step(...)` blocks are deleted.
    - The 7 module-scope helpers used only by the deleted steps are deleted.
    - `ConsoleMessage` import removed if unused.
    - Lint + tsc clean (no unused-variable warnings).
    - Committed: `git -c core.hooksPath=/dev/null commit -m "test(voter-mega): remove 5 redundant steps (drawer-open, Polar-Max info, 3 filter steps) (TIR3 cluster 7)"`.
  </done>
</task>

<task type="auto">
  <name>Task 7: REFACTOR steps — `9.6.5-8 voter-vs-entity matrix` rename + `party-drawer` → `organisation details`</name>
  <files>tests/tests/specs/voter/voter-mega-journey.spec.ts</files>
  <action>
    Cluster #8 from scope doc. Depends on Tasks 4 + 5 + 6.

    **REFACTOR step 1: `detail: 9.6.5-8 voter-vs-entity matrix on CA-AA-Special`** (currently at voter-mega-journey.spec.ts:906-1026 — exact line numbers shift after Task 6 deletions; re-locate by step title).

    - **Rename** the step title from `'detail: 9.6.5-8 voter-vs-entity matrix on CA-AA-Special (refactor-doc:349-355, Risk #2)'` to `'candidate details: voter-vs-entity matrix on CA-AA-Special (TIR3)'` (scope doc: "rename 'candidate details'").
    - **Use fixtures.** Replace the manual drawer-open + tab-switch + info-item / opinion-display logic with:
      ```ts
      const dialog = await resultsPage.openEntityDetailsForCard(/Special Candidate AA|Candidate AA Special/i);
      await entityDetails.selectTab('info'); // verify info tab assertions via expectInfoItem
      // … existing 13 info-item assertions become entityDetails.expectInfoItem(label, value) calls
      await entityDetails.selectTab('opinions');
      // … existing expectQuestionDisplayToHave calls become entityDetails.expectQuestionDisplay({…})
      ```
    - **Preserve the assertion content verbatim** (13 info-items, 4-row voter-vs-entity matrix on Base-1 / Base-2 / Opt-A-1 / Opt-B-1). Only the call shape changes.
    - **DELETE the local `expectQuestionDisplayToHave` helper** if its only consumers were the matrix step (it's been ported to the fixture). If any non-mega-journey spec imports it, leave it.

    **REFACTOR step 2: `party-drawer: info+candidates+opinions tabs + correct filter list (MOVED 9.6.4, refactor-doc:357-359, Risk #2)`** (currently at voter-mega-journey.spec.ts:1032-1066).

    - **Rename** to `'organisation details: Party AA info/members/opinions (TIR3)'`.
    - **Rewrite** per scope doc lines 113-126:
      ```ts
      await resultsPage.selectElection(/regional/i);
      await resultsPage.selectEntityTab('organizations');
      const dialog = await resultsPage.openEntityDetailsForCard(/Party AA/i);
      await entityDetails.expectTabs(['info', 'members', 'opinions']);
      await entityDetails.selectTab('info');
      await entityDetails.expectInfoItem(/Election/i, /Regional Election/i);
      await entityDetails.expectInfoItem(/Constituency/i, /Region North/i);
      await entityDetails.expectInfoItem(/alliance/i, /Alliance A.*AL-A/i);
      await entityDetails.selectTab('members');
      const memberCards = entityDetails.getMemberCards();
      await expect(memberCards).toHaveCount(5);
      await resultsPage.dismissAllDialogs();
      ```
    - Note Party AA membership: per baseV1, Region North has 4 generic AA candidates + CA-AA-Special + CA-AA-Hidden + CA-AA-1 = 7 AA candidates, of which CA-AA-Hidden is hidden. The scope doc says count 5 — cross-check at task execution time and reconcile (the 5 likely accounts for the hiddenCandidate filter + showAllNominations:true). If 5 doesn't match observed seed reality, FILE this as an inconsistency in the task summary; do not silently change the count.
  </action>
  <verify>
    <automated>yarn test:e2e --project=voter-mega-journey --grep "candidate details: voter-vs-entity|organisation details: Party AA" 2>&1 | tail -40</automated>
  </verify>
  <done>
    - 9.6.5-8 step renamed to `candidate details: voter-vs-entity matrix on CA-AA-Special (TIR3)` + fixture-based.
    - party-drawer step renamed to `organisation details: Party AA info/members/opinions (TIR3)` + rewritten per scope doc.
    - Both renamed steps PASS under `--grep`.
    - Committed: `git -c core.hooksPath=/dev/null commit -m "test(voter-mega): refactor matrix step + party-drawer→organisation-details to fixtures (TIR3 cluster 8)"`.
  </done>
</task>

<task type="auto">
  <name>Task 8: ADD steps — matching:organisations + filters:text + filters:dialog</name>
  <files>tests/tests/specs/voter/voter-mega-journey.spec.ts</files>
  <action>
    Clusters #6 + #9 + #10 from scope doc. Depends on Tasks 4 + 5 + 6 + 7.

    Append three NEW `test.step(...)` blocks to voter-mega-journey.spec.ts (after the existing matching step but before / interleaved with the refactored detail steps — placement should follow the user's logical voter-walk; the recommended order is: matching:candidates (existing) → matching:organisations (NEW) → candidate details (refactored) → organisation details (refactored) → filters:text (NEW) → filters:dialog (NEW)).

    **NEW step 1: `matching: organisations on Regional` (scope doc lines 86-104)**
    ```ts
    await test.step('matching: organisations on Regional (TIR3 ADD)', async () => {
      await resultsPage.selectElection(/regional/i);
      await resultsPage.selectEntityTab('organizations');
      const cards = resultsPage.getEntityCards();
      await expect(cards).toHaveCount(5);
      // First card: Party BB (Best-Regional-Party) with 2 candidates + no Show-all
      const bestRegional = cards.first();
      await expect(bestRegional).toContainText(/Party BB.*Best-Regional-Party|Best-Regional-Party.*Party BB/i);
      // Two child candidate cards inside Party BB
      const bbChildren = bestRegional.getByTestId(testIds.voter.results.card);
      await expect(bbChildren).toHaveCount(2);
      // No "Show all" button
      await expect(bestRegional.getByRole('button', { name: /show all/i })).toHaveCount(0);
      // Party AA card: 3 visible children + Show-all-5 contract
      const bigParty = cards.filter({ hasText: /Party AA/i });
      await expect(bigParty).toHaveCount(1);
      const aaChildren = bigParty.getByTestId(testIds.voter.results.card);
      await expect(aaChildren).toHaveCount(3);
      const showAll = bigParty.getByRole('button', { name: /show all 5 candidates/i });
      await expect(showAll).toBeVisible();
      await showAll.click();
      await expect(aaChildren).toHaveCount(5);
      const collapse = bigParty.getByRole('button', { name: /collapse list/i });
      await expect(collapse).toBeVisible();
      await collapse.click();
      await expect(aaChildren).toHaveCount(3);
      await expect(bigParty.getByRole('button', { name: /show all 5 candidates/i })).toBeVisible();
    });
    ```

    Note: `resultsPage.getEntityCards()` returns OUTER cards only (Task 4 explicitly contracted this). The bbChildren / aaChildren inner counts query the inner `entity-card` testids within each org card. Verify the DOM nesting at execution time; if inner-cards use a DIFFERENT testid (e.g. `entity-subcard` or `child-entity-card`), adjust.

    **NEW step 2: `filters: text` (scope doc lines 134-143)**
    ```ts
    await test.step('filters: text — polar narrowing (TIR3 ADD)', async () => {
      await resultsPage.selectElection(/regional/i);
      await resultsPage.selectEntityTab('candidates');
      await entityFilters.setTextFilter('polar');
      const cards = resultsPage.getEntityCards();
      await expect(cards).toHaveCount(2);
      await expect(cards.first()).toContainText(/Polar-Max/i);
      await expect(cards.nth(1)).toContainText(/Polar-Min/i);
      await entityFilters.clearTextFilter();
    });
    ```

    **NEW step 3: `filters: dialog` (scope doc lines 145-194)** — verbatim transcription of the operator-authored sequence:
    ```ts
    await test.step('filters: dialog — Party/pick-multiple/years-of-experience matrix (TIR3 ADD)', async () => {
      await resultsPage.selectElection(/regional/i);
      await resultsPage.selectEntityTab('candidates');
      const dialog = await entityFilters.openFilterDialog();
      const filters = dialog.getFilters();
      // expect Party, Info: pick multiple, Info: years of experience
      await expect(filters).toHaveCount(3);
      await expect(filters.nth(0)).toContainText(/Party/i);
      await expect(filters.nth(1)).toContainText(/pick multiple/i);
      await expect(filters.nth(2)).toContainText(/years of experience/i);

      // Party filter: No-answer option shows count 1, select it
      const partyFilter = dialog.getFilter(/Party/i);
      const noAnswerOption = partyFilter.getOption(/No answer/i);
      await expect(noAnswerOption).toContainText(/1/);
      await partyFilter.setSelection(/No answer/i);
      await dialog.close();

      let cards = resultsPage.getEntityCards();
      await expect(cards).toHaveCount(1);
      await expect(resultsPage.getEntityCard(/Free.*independent/i)).toHaveCount(1);
      await expect(entityFilters.getFilterButtonBadge()).toContainText('1');

      // Reset
      const d2 = await entityFilters.openFilterDialog();
      await d2.reset();
      cards = resultsPage.getEntityCards();
      await expect(cards).toHaveCount(13);
      // badge empty (assertion shape TBD — getFilterButtonBadge may be hidden or have zero text)
      const badge = entityFilters.getFilterButtonBadge();
      await expect(badge).toBeHidden(); // or .toHaveText('') depending on impl

      // Pick-multiple filter: 3 options; setSelection(/Choice A|B/) → 12 cards, special excluded
      const d3 = await entityFilters.openFilterDialog();
      const pickMulti = d3.getFilter(/pick multiple/i);
      await expect(pickMulti.getOptions()).toHaveCount(3);
      await pickMulti.setSelection(/Choice A|Choice B/i);
      await d3.close();
      cards = resultsPage.getEntityCards();
      await expect(cards).toHaveCount(12);
      await expect(resultsPage.getEntityCard(/Special.*candidate AA/i)).toHaveCount(0);

      // Reset
      const d4 = await entityFilters.openFilterDialog();
      await d4.reset();
      await d4.close();

      // Years-of-experience filter: 2 options (min 42, max 99); setNumberRange(50, null) → 1 card visible (Special)
      const d5 = await entityFilters.openFilterDialog();
      const yearsExp = d5.getFilter(/years of experience/i);
      const yexpOptions = yearsExp.getOptions();
      await expect(yexpOptions).toHaveCount(2);
      await expect(yexpOptions.nth(0)).toContainText('42');
      await expect(yexpOptions.nth(1)).toContainText('99');
      await yearsExp.setNumberRange(50, null);
      await d5.close();
      cards = resultsPage.getEntityCards();
      await expect(cards).toHaveCount(1);
      await expect(resultsPage.getEntityCard(/Special.*candidate AA/i)).toHaveCount(1);

      // Add pick-multiple Choice A|B narrowing on top — should drop count to 0
      const d6 = await entityFilters.openFilterDialog();
      const pickMulti2 = d6.getFilter(/pick multiple/i);
      await pickMulti2.setSelection(/Choice A|Choice B/i);
      await d6.close();
      cards = resultsPage.getEntityCards();
      await expect(cards).toHaveCount(0);

      // Reset to clean state
      const d7 = await entityFilters.openFilterDialog();
      await d7.reset();
      await d7.close();
    });
    ```

    **Reconciliation notes for the executor:**
    - The exact count `13` (full-list cards) corresponds to the existing `cards.toHaveCount(13)` assertion in the matching step. Cross-check at task execution time; if baseV1 yields a different count post-rename, file as inconsistency.
    - The `cards.toHaveCount(1)` after `setNumberRange(50, null)` assumes only CA-AA-Special has the 99-years answer (or any value ≥50). Verify against baseV1: Special carries the asymmetric arrangement, but other candidates may have 99 via POLAR_MAX. INVESTIGATE before locking the count — if multiple candidates match, adjust the assertion to the observed count and document in summary.
    - The badge-hidden assertion uses `.toBeHidden()`; the actual hide/show contract is implementation-dependent — verify via DOM inspection in dev.
  </action>
  <verify>
    <automated>yarn test:e2e --project=voter-mega-journey --grep "matching: organisations|filters: text|filters: dialog" 2>&1 | tail -60</automated>
  </verify>
  <done>
    - Three new `test.step` blocks added to voter-mega-journey.spec.ts: `matching: organisations on Regional (TIR3 ADD)`, `filters: text — polar narrowing (TIR3 ADD)`, `filters: dialog — Party/pick-multiple/years-of-experience matrix (TIR3 ADD)`.
    - All three steps PASS under `--grep`.
    - Any count discrepancies (Party AA member count, pick-multiple cards, years-of-experience match count) reconciled with seeded reality and documented inline in task SUMMARY.
    - Committed: `git -c core.hooksPath=/dev/null commit -m "test(voter-mega): add matching:organisations + filters:text + filters:dialog (TIR3 clusters 6+9+10)"`.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 9: Final TEXT_RE removal + voter-mega-journey full-project green</name>
  <files>tests/tests/specs/voter/voter-mega-journey.spec.ts</files>
  <what-built>
    Cluster #2 tail + integration gate. Depends on ALL prior tasks.

    **Sub-step 9a: Remove TEXT_RE from voter-mega-journey.spec.ts.**

    Per scope doc cluster #2: "Remove TEXT_RE afterwards." After tasks 2-8 land, every TEXT_RE entry in voter-mega-journey.spec.ts should either be:
    - Replaced by an inline regex literal at its single remaining use site, OR
    - Replaced by a fixture-internal regex (the fixtures own their own matching now), OR
    - Already deleted in Task 6's helper purge.

    **Procedure:**
    1. `grep -c "TEXT_RE\." tests/tests/specs/voter/voter-mega-journey.spec.ts` — count remaining uses.
    2. For each TEXT_RE entry, decide: inline-it OR rely on fixture-internal logic OR delete.
    3. Once zero TEXT_RE references remain, delete the TEXT_RE const block at the top of the file.
    4. Also audit: are there unused TIMEOUT entries? Leave TIMEOUT in place (it's a separate cleanup, out of scope).

    **Sub-step 9b: Full voter-mega-journey project run.**

    ```bash
    yarn db:reset && yarn db:seed --template baseV1 && yarn dev:clean
    yarn test:e2e --project=voter-mega-journey 2>&1 | tee /tmp/voter-mega-9.log
    ```

    Per operator memory `feedback_e2e_did_not_run.md`: did-not-run counts as failure. Per `project_all_green_suite_priority.md`: priority is suite-green; investigate any cascade.

    Expected: full chain (data-setup-baseV1 → voter-mega-journey → data-teardown-baseV1) GREEN. The mega-journey spec has 1 long test split into many `test.step`s; the test as a whole should PASS.

    **If the spec fails on any step in 9b:** diagnose at the level of the failing step. Common failure modes after this refactor:
    - Fixture method signature mismatch with the actual DOM.
    - Card count mismatch (baseV1 dataset reality differs from scope doc assertion — adjust assertion or, if data is wrong, surface as out-of-scope follow-on).
    - Selector promotion in Task 4 missed a testid the fixture needed.

    Fix-and-rerun until green.

    **Sub-step 9c: Final lint + tsc gate.**

    ```bash
    yarn lint:check tests/tests/specs/voter/voter-mega-journey.spec.ts tests/tests/fixtures/
    yarn workspace tests exec tsc --noEmit
    ```

    Must be clean.

    **Sub-step 9d: HUMAN VERIFICATION (this checkpoint).**

    Show the operator the final test output + diff summary. Operator confirms the deliverable matches the scope doc and approves the final commit.
  </what-built>
  <how-to-verify>
    1. Inspect the test log at `/tmp/voter-mega-9.log` — every test.step in voter-mega-journey passed.
    2. Run a fresh `yarn test:e2e --project=voter-mega-journey` to confirm reproducibility.
    3. Eyeball voter-mega-journey.spec.ts: no TEXT_RE block; step titles include the renamed/new entries; the 5 deleted steps are gone.
    4. Spot-check the 3 new fixtures by opening `tests/tests/fixtures/{results,entityFilters,entityDetails}.fixture.ts` and confirming the method names match the scope doc bullet list.
    5. Confirm `git log --oneline -10` shows the 9 task commits with the cluster-tagged messages.
    6. Operator reviews and types "approved" (or describes issues) to advance.
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>

After each task: targeted `yarn test:e2e --project=voter-mega-journey --grep "<step-name>"` runs prove the touched step in isolation.

After Task 9: full voter-mega-journey project green is the integration gate. Suite-wide green is NOT a goal for this quick task — Phase 88's all-green-suite anchor is a separate dependency, and operator memory `project_all_green_suite_priority.md` tracks it.

Lint + tsc clean across `tests/` and the touched packages at every commit boundary (no broken intermediate states).

</verification>

<success_criteria>

- All `must_haves.truths` observable.
- voter-mega-journey project runs GREEN end-to-end (Task 9 gate).
- 9 atomic commits landed via `git -c core.hooksPath=/dev/null commit …`, each tagged with the TIR3 cluster number(s) it addresses.
- No regressions in the perm-* chain (sibling project sharing baseV1's setup chain) — spot-check by running `yarn test:e2e --project=perm-1e1cg1co` after Task 9.
- No accidental rollback of pre-baseline commit `27ef8f998` (entitySelected testId / opt-a/b external_id rename / TIMEOUT/named-args/EntityOpinions D7 RLS).

</success_criteria>

<risks_and_notes>

1. **Election symbol contract (Task 5):** scope doc says "election symbol 10" for the first candidate. Per 260525-tea (STATE.md), CA-AA-1 carries symbol "10". CA-AA-1 ranks first as Polar-Max in the mega-journey walk. If at task time the rank order shifts, Task 5's assertion must shift correspondingly — flag rather than silently mutate.

2. **Card counts in filter:dialog step (Task 8):** the scope doc cites `count = 1` after `setNumberRange(50, null)`. Verify against the actual baseV1 dataset — POLAR_MAX candidates carry `test-qu-info-number = 42` per `DEFAULT_INFO_ANSWERS`, and a custom override may push some to 99. If multiple candidates have years-of-experience ≥ 50, adjust the assertion + flag in SUMMARY (do not silently change scope-doc intent).

3. **Pre-baseline commit `27ef8f998`:** ALL TASKS MUST READ THIS COMMIT before touching the same files (`git show 27ef8f998`). It already added the `entitySelected` testid, opt-a/opt-b external_id rename in baseV1, the TIMEOUT/TEXT_RE/named-args refactor in voter-mega-journey, and the EntityOpinions D7 RLS hardening + migration 00002. Do NOT undo any of those.

4. **Phase 88 context:** this quick task lives INSIDE Phase 88's catalog audit. Plan 88-03 (perm-* family) is COMPLETE and depends on the baseV1 chain. The fixtures introduced in Task 4 are designed to be CONSUMABLE by perm-* specs too — but migrating perm-* specs is out-of-scope here. Future plans (88-NN) can absorb that work.

5. **`yarn db:reset-with-data --likert-only` arg-forwarding caveat** (CLAUDE.md): if seeding for verification, use the manual chain (`yarn db:reset && yarn db:seed --template baseV1 && yarn dev:clean`) not the `--likert-only` shortcut. baseV1 does NOT need `--likert-only`.

6. **Operator memory `feedback_e2e_did_not_run.md`:** treat any did-not-run during Task 9 as a failure. If `voter-mega-journey` cascade-skips because an upstream setup project fails (e.g. imgproxy 502, pre-existing flake), surface as an environmental issue and re-run after restart — do not declare the task complete with cascade-skips.

7. **ROADMAP / STATE invariants** (per constraints): DO NOT update `.planning/ROADMAP.md`. STATE.md is auto-updated by `gsd:complete-plan` workflows; this quick task adds itself to the Quick Tasks Completed table at close — only via the SDK's commit handler if used, NOT by manual edits.

8. **Filter dialog "reset" button:** Task 4's `entityFilterDialog.reset()` assumes the dialog has a visible reset button. Grep `apps/frontend/src/lib/components/entityFilters/` for an existing reset; if missing in the product, this is a frontend gap — file as out-of-scope follow-up (the filter:dialog step can fall back to closing + reopening each time, but that's a worse UX contract).

</risks_and_notes>

<output>
Create `.planning/quick/260527-nat-apply-test-inventory-refactor-3-md-to-vo/260527-nat-SUMMARY.md` when all 9 tasks complete. Summary should include:
- per-task commit SHAs (9 entries)
- card-count reconciliations (where Task 5 / Task 8 assertions deviated from scope doc due to seeded reality)
- voter-mega-journey full-project test report (pass / fail / duration)
- any deferred follow-ups (frontend reset button gap, etc.)
</output>
