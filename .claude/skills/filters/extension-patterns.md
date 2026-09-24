# Extension Patterns for @openvaa/filters

Step-by-step guides for the most common filter package extensions. All file paths are repo-relative.

## Adding a New Filter Type

Reference implementation: `NumberQuestionFilter` (see `packages/filters/src/filter/number/numberQuestionFilter.ts`) extending `NumberFilter` base. For property-based filters, see `ObjectFilter` (see `packages/filters/src/filter/enumerated/objectFilter.ts`).

Follow these steps in order. Each step names the file to create or modify.

1. **Choose or create a base class** `packages/filters/src/filter/{category}/`
   - Extend one of the 3 existing bases:
     - `EnumeratedFilter` -- include/exclude sets for enumerated values (choices, objects with ids)
     - `NumberFilter` -- min/max/excludeMissing for numeric values
     - `TextFilter` -- text include/exclude/caseSensitive for string values
   - To create a new base: create `packages/filters/src/filter/{category}/{category}Filter.ts` extending `Filter<TTarget, TValue>` from `packages/filters/src/filter/base/filter.ts`
   - Implement abstract methods: `testValue(value)` (single value test), `testValues(values)` (multi value test)
   - Define `protected _rules` with the base's rule shape and implement rule getters/setters via `this.setRule()`
   - Pattern: copy `packages/filters/src/filter/number/numberFilter.ts` for a new numeric-style base, `packages/filters/src/filter/enumerated/enumeratedFilter.ts` for a new set-style base

2. **Create concrete filter class** `packages/filters/src/filter/{category}/{name}Filter.ts`
   - For question-based filters: extend chosen base, accept a question type in constructor via `QuestionFilterOptions`
   - For property-based filters: extend chosen base, accept property name via `PropertyFilterOptions`
   - Add `readonly filterType = FILTER_TYPE.{Name}Filter as const`
   - Implement `parseValues(targets)` to extract and sort available values from the target entities
   - Set `multipleValues` in super() call if the question/property yields arrays
   - Pass `type: 'string' | 'number'` to super() matching the value type
   - Pattern for question filter: `packages/filters/src/filter/number/numberQuestionFilter.ts`
   - Pattern for property filter: `packages/filters/src/filter/enumerated/objectFilter.ts`

3. **Register in FILTER_TYPE** `packages/filters/src/filter/base/filterTypes.ts`
   - Add `{Name}Filter: '{name}Filter'` to the `FILTER_TYPE` const object
   - Add `[FILTER_TYPE.{Name}Filter]: {Name}Filter` to the `FilterTypeMap` type
   - Import the concrete filter type at the top of the file
   - Note the comment in source: "NB! When editing these, be sure to update `/utils/typeGuard.ts` as well."

4. **Update type guards** `packages/filters/src/utils/typeGuards.ts`
   - If new base category: add a new `is{Category}Filter()` function checking `obj.filterType` against the relevant `FILTER_TYPE` values using `isFilter(obj) && (obj.filterType === FILTER_TYPE.{Name}Filter || ...)`
   - If extending existing base: add `obj.filterType === FILTER_TYPE.{Name}Filter` to the existing category guard's condition chain (e.g., `isEnumeratedFilter()`, `isNumberFilter()`, `isTextFilter()`)
   - Import the new concrete filter type for the return type union annotation
   - The generic `isFilter()` function needs no changes -- it uses `Object.values(FILTER_TYPE).includes()` which auto-discovers new entries

5. **Add barrel exports** at each directory level:
   - `packages/filters/src/filter/{category}/index.ts` -- add `export * from './{name}Filter'`
   - `packages/filters/src/filter/index.ts` -- confirm it already re-exports from `'./{category}'` (if new category, add `export * from './{category}'`)
   - `packages/filters/src/index.ts` -- confirm it already re-exports from `'./filter'` (no change needed)

6. **Add tests** `packages/filters/tests/filter.test.ts`
   - Import the new filter class from `../src`
   - Create test entities matching the filter's target type (use `DataRoot` from `@openvaa/data` for question instances)
   - Test constructor with appropriate options (question or property)
   - Test `parseValues()` returns correct values from target entities
   - Test `apply()` with include/exclude rules (or min/max for numeric)
   - Test `apply()` with `MISSING_FILTER_VALUE` handling (entities without answers)
   - Test that `filterType` equals the expected `FILTER_TYPE.{Name}Filter` value
   - Pattern: follow existing `NumberQuestionFilter` or `ChoiceQuestionFilter` test block in `packages/filters/tests/filter.test.ts`

7. **Add E2E coverage** `tests/tests/fixtures/voter/entityFilters.fixture.ts`
   - The unit test above proves the filter's logic; it does not prove a voter can reach it. Add an E2E assertion that drives the filter through the UI.
   - Extend the Playwright fixture `createEntityFilters(page)` only if the new filter needs a control it cannot already drive. It exposes `openFilterDialog()`, `getFilter(target)`, `setSelection(values)`, `selectAll()`, `selectNone()`, `isAllSelected()`, `setNumberRange(min, max)`, `setTextFilter(text)`, `clearTextFilter()`, `expectResetToBeDisabled()`, `reset()` and `close()`.
   - Where applicable is decidable, not a judgement call: a filter a voter reaches from the results view belongs in the full voter journey -- the `full voter journey end-to-end` test in `tests/tests/specs/voter/voter-journey.spec.ts` -- as a new test step. A filter reachable only from a candidate-app surface belongs in that surface's own spec instead.
   - The UI the E2E test drives is `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte` and its per-category children under `apps/frontend/src/lib/components/entityFilters/`; a new filter category needs a child component there before any E2E test can reach it.
   - Pattern: follow existing `filter dialog applies and resets Party, pick-multiple, and numeric filters` test step in `tests/tests/specs/voter/voter-journey.spec.ts`

## Adding a Question-Type Filter Variant

Reference implementation: `NumberQuestionFilter` (see `packages/filters/src/filter/number/numberQuestionFilter.ts`).

This is a simplified version of the guide above for when you only need a new concrete filter for a new question type from `@openvaa/data`, extending an existing base class.

**Cross-reference:** If also adding a new question type to `@openvaa/data`, complete the data skill's `extension-patterns.md` "Adding a New Question Type" guide first, then return here.

Follow these steps in order.

1. **Identify the base class** -- determine which of the 3 base filter categories matches the new question type's answer value:
   - Enumerated values (choices with ids) -- extend `EnumeratedFilter` (see `packages/filters/src/filter/enumerated/enumeratedFilter.ts`)
   - Numeric values -- extend `NumberFilter` (see `packages/filters/src/filter/number/numberFilter.ts`)
   - Text/string values -- extend `TextFilter` (see `packages/filters/src/filter/text/textFilter.ts`)

2. **Create concrete filter class** `packages/filters/src/filter/{category}/{name}QuestionFilter.ts`
   - Extend the identified base class with appropriate generic type parameters
   - Constructor accepts the new question type via `QuestionFilterOptions<{QuestionType}>`
   - Add `readonly filterType = FILTER_TYPE.{Name}QuestionFilter as const`
   - Auto-detect `multipleValues` if the question type has single/multiple variants:
     - For choice questions: use `isMultipleChoiceQuestion(question)` pattern (see `packages/filters/src/filter/enumerated/choiceQuestionFilter.ts`)
     - For text questions: use `isObjectType(question, OBJECT_TYPE.MultipleTextQuestion)` pattern (see `packages/filters/src/filter/text/textQuestionFilter.ts`)
     - For numeric questions: `multipleValues` is typically `false` (see `packages/filters/src/filter/number/numberQuestionFilter.ts`)
   - Implement `parseValues(targets)` to extract available values from target entities
   - Pass `type: 'string' | 'number'` to super() matching the value type
   - Pattern: `packages/filters/src/filter/number/numberQuestionFilter.ts` for numeric, `packages/filters/src/filter/enumerated/choiceQuestionFilter.ts` for enumerated, `packages/filters/src/filter/text/textQuestionFilter.ts` for text

3. **Register in FILTER_TYPE** `packages/filters/src/filter/base/filterTypes.ts`
   - Add `{Name}QuestionFilter: '{name}QuestionFilter'` to the `FILTER_TYPE` const object
   - Add `[FILTER_TYPE.{Name}QuestionFilter]: {Name}QuestionFilter` to `FilterTypeMap`
   - Import the concrete filter type at the top of the file

4. **Update type guards** `packages/filters/src/utils/typeGuards.ts`
   - Add `obj.filterType === FILTER_TYPE.{Name}QuestionFilter` to the existing category guard (e.g., `isNumberFilter()` if extending NumberFilter)
   - Import the new filter type for the return type union annotation
   - The generic `isFilter()` needs no changes (auto-discovers via `Object.values(FILTER_TYPE)`)

5. **Add barrel exports** at each directory level:
   - `packages/filters/src/filter/{category}/index.ts` -- add `export * from './{name}QuestionFilter'`
   - `packages/filters/src/filter/index.ts` -- confirm it already re-exports from `'./{category}'`
   - `packages/filters/src/index.ts` -- no change needed

6. **Add tests** `packages/filters/tests/filter.test.ts`
   - Import the new filter class from `../src`
   - Use `DataRoot` from `@openvaa/data` to create the question instance
   - Test constructor, `parseValues()`, `apply()` with rules, `MISSING_FILTER_VALUE` handling, and `filterType` value
   - Pattern: follow existing test blocks in `packages/filters/tests/filter.test.ts` for the matching category

7. **Add E2E coverage** `tests/tests/fixtures/voter/entityFilters.fixture.ts`
   - Same requirement as step 7 of the guide above, for the same reason: a question-type variant is reached by the same voter, through the same results-view dialog, and needs the same proof that it renders and applies.
   - A variant on an existing base usually needs no fixture change -- `createEntityFilters(page)` already drives every existing category via `openFilterDialog()`, `getFilter(target)`, `setSelection(values)`, `setNumberRange(min, max)`, `setTextFilter(text)` and `reset()`. Extend the fixture only if the variant renders a control none of those reach.
   - Assert it in the `full voter journey end-to-end` test in `tests/tests/specs/voter/voter-journey.spec.ts` when the question type appears in the voter results view, and in the owning surface's spec when it does not.
   - The variant's question type must exist in whichever dev-seed template the spec seeds, or the filter never renders and the assertion is vacuous: `packages/dev-seed/src/templates/e2e/base.ts`
   - Pattern: follow existing `EFLOW-01: select-all/none control, text×filter intersection, reset restores full list` test step in `tests/tests/specs/voter/voter-journey.spec.ts`

## Verification After Extension

After completing any extension, verify:

1. `cd packages/filters && yarn workspace @openvaa/filters vitest run` -- all existing tests pass (no regressions)
2. New test cases pass with expected assertions
3. `yarn build:shared` -- builds without errors (filters is part of shared build)
4. `FILTER_TYPE` const, `FilterTypeMap` type, and type guards in `packages/filters/src/utils/typeGuards.ts` are all in sync (same set of filter types)
5. Barrel exports chain from subdirectory `index.ts` to `packages/filters/src/filter/index.ts` to `packages/filters/src/index.ts`
6. New filter's `filterType` property matches the `FILTER_TYPE` const value exactly (string literal type via `as const`)
7. Re-check this skill's own files -- `.claude/skills/filters/extension-patterns.md` and `.claude/skills/filters/SKILL.md` -- and update whatever the extension invalidated, in the same commit. They carry listings: enumerations of source files, type names, directory paths and counts, none of which any build step keeps true.
   - The cost is measured, not asserted. Re-derived 2026-09-13: `.claude/skills/database/schema-reference.md` opens by calling itself a complete column listing for 17 tables drawn from 18 SQL files, while `apps/supabase/supabase/schema/` declares 20 tables across 25 files -- three tables (feedback, feedback_rate_limits, admin_jobs) absent from a listing that announces itself complete. Nothing caught it, because nothing re-checked the skill after the schema grew.
