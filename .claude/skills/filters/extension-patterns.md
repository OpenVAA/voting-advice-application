# Extension Patterns for @openvaa/filters

Step-by-step guides for the most common filter package extensions. All file paths in steps are relative to `packages/filters/src/` unless stated otherwise.

## Adding a New Filter Type

Reference implementation: `NumberQuestionFilter` (see `filter/number/numberQuestionFilter.ts`) extending `NumberFilter` base. For property-based filters, see `ObjectFilter` (see `filter/enumerated/objectFilter.ts`).

Follow these steps in order. Each step names the file to create or modify.

1. **Choose or create a base class** `filter/{category}/`
   - Extend one of the 3 existing bases:
     - `EnumeratedFilter` -- include/exclude sets for enumerated values (choices, objects with ids)
     - `NumberFilter` -- min/max/excludeMissing for numeric values
     - `TextFilter` -- text include/exclude/caseSensitive for string values
   - To create a new base: create `filter/{category}/{category}Filter.ts` extending `Filter<TTarget, TValue>` from `filter/base/filter.ts`
   - Implement abstract methods: `testValue(value)` (single value test), `testValues(values)` (multi value test)
   - Define `protected _rules` with the base's rule shape and implement rule getters/setters via `this.setRule()`
   - Pattern: copy `filter/number/numberFilter.ts` for a new numeric-style base, `filter/enumerated/enumeratedFilter.ts` for a new set-style base

2. **Create concrete filter class** `filter/{category}/{name}Filter.ts`
   - For question-based filters: extend chosen base, accept a question type in constructor via `QuestionFilterOptions`
   - For property-based filters: extend chosen base, accept property name via `PropertyFilterOptions`
   - Add `readonly filterType = FILTER_TYPE.{Name}Filter as const`
   - Implement `parseValues(targets)` to extract and sort available values from the target entities
   - Set `multipleValues` in super() call if the question/property yields arrays
   - Pass `type: 'string' | 'number'` to super() matching the value type
   - Pattern for question filter: `filter/number/numberQuestionFilter.ts`
   - Pattern for property filter: `filter/enumerated/objectFilter.ts`

3. **Register in FILTER_TYPE** `filter/base/filterTypes.ts`
   - Add `{Name}Filter: '{name}Filter'` to the `FILTER_TYPE` const object
   - Add `[FILTER_TYPE.{Name}Filter]: {Name}Filter` to the `FilterTypeMap` type
   - Import the concrete filter type at the top of the file
   - Note the comment in source: "NB! When editing these, be sure to update `/utils/typeGuard.ts` as well."

4. **Update type guards** `utils/typeGuards.ts`
   - If new base category: add a new `is{Category}Filter()` function checking `obj.filterType` against the relevant `FILTER_TYPE` values using `isFilter(obj) && (obj.filterType === FILTER_TYPE.{Name}Filter || ...)`
   - If extending existing base: add `obj.filterType === FILTER_TYPE.{Name}Filter` to the existing category guard's condition chain (e.g., `isEnumeratedFilter()`, `isNumberFilter()`, `isTextFilter()`)
   - Import the new concrete filter type for the return type union annotation
   - The generic `isFilter()` function needs no changes -- it uses `Object.values(FILTER_TYPE).includes()` which auto-discovers new entries

5. **Add barrel exports** at each directory level:
   - `filter/{category}/index.ts` -- add `export * from './{name}Filter'`
   - `filter/index.ts` -- confirm it already re-exports from `'./{category}'` (if new category, add `export * from './{category}'`)
   - `src/index.ts` -- confirm it already re-exports from `'./filter'` (no change needed)

6. **Add tests** `tests/filter.test.ts` (relative to `packages/filters/`)
   - Import the new filter class from `../src`
   - Create test entities matching the filter's target type (use `DataRoot` from `@openvaa/data` for question instances)
   - Test constructor with appropriate options (question or property)
   - Test `parseValues()` returns correct values from target entities
   - Test `apply()` with include/exclude rules (or min/max for numeric)
   - Test `apply()` with `MISSING_FILTER_VALUE` handling (entities without answers)
   - Test that `filterType` equals the expected `FILTER_TYPE.{Name}Filter` value
   - Pattern: follow existing `NumberQuestionFilter` or `ChoiceQuestionFilter` test block in `filter.test.ts`

## Adding a Question-Type Filter Variant

Reference implementation: `NumberQuestionFilter` (see `filter/number/numberQuestionFilter.ts`).

This is a simplified version of the guide above for when you only need a new concrete filter for a new question type from `@openvaa/data`, extending an existing base class.

**Cross-reference:** If also adding a new question type to `@openvaa/data`, complete the data skill's `extension-patterns.md` "Adding a New Question Type" guide first, then return here.

Follow these steps in order.

1. **Identify the base class** -- determine which of the 3 base filter categories matches the new question type's answer value:
   - Enumerated values (choices with ids) -- extend `EnumeratedFilter` (see `filter/enumerated/enumeratedFilter.ts`)
   - Numeric values -- extend `NumberFilter` (see `filter/number/numberFilter.ts`)
   - Text/string values -- extend `TextFilter` (see `filter/text/textFilter.ts`)

2. **Create concrete filter class** `filter/{category}/{name}QuestionFilter.ts`
   - Extend the identified base class with appropriate generic type parameters
   - Constructor accepts the new question type via `QuestionFilterOptions<{QuestionType}>`
   - Add `readonly filterType = FILTER_TYPE.{Name}QuestionFilter as const`
   - Auto-detect `multipleValues` if the question type has single/multiple variants:
     - For choice questions: use `isMultipleChoiceQuestion(question)` pattern (see `choiceQuestionFilter.ts`)
     - For text questions: use `isObjectType(question, OBJECT_TYPE.MultipleTextQuestion)` pattern (see `textQuestionFilter.ts`)
     - For numeric questions: `multipleValues` is typically `false` (see `numberQuestionFilter.ts`)
   - Implement `parseValues(targets)` to extract available values from target entities
   - Pass `type: 'string' | 'number'` to super() matching the value type
   - Pattern: `filter/number/numberQuestionFilter.ts` for numeric, `filter/enumerated/choiceQuestionFilter.ts` for enumerated, `filter/text/textQuestionFilter.ts` for text

3. **Register in FILTER_TYPE** `filter/base/filterTypes.ts`
   - Add `{Name}QuestionFilter: '{name}QuestionFilter'` to the `FILTER_TYPE` const object
   - Add `[FILTER_TYPE.{Name}QuestionFilter]: {Name}QuestionFilter` to `FilterTypeMap`
   - Import the concrete filter type at the top of the file

4. **Update type guards** `utils/typeGuards.ts`
   - Add `obj.filterType === FILTER_TYPE.{Name}QuestionFilter` to the existing category guard (e.g., `isNumberFilter()` if extending NumberFilter)
   - Import the new filter type for the return type union annotation
   - The generic `isFilter()` needs no changes (auto-discovers via `Object.values(FILTER_TYPE)`)

5. **Add barrel exports** at each directory level:
   - `filter/{category}/index.ts` -- add `export * from './{name}QuestionFilter'`
   - `filter/index.ts` -- confirm it already re-exports from `'./{category}'`
   - `src/index.ts` -- no change needed

6. **Add tests** `tests/filter.test.ts` (relative to `packages/filters/`)
   - Import the new filter class from `../src`
   - Use `DataRoot` from `@openvaa/data` to create the question instance
   - Test constructor, `parseValues()`, `apply()` with rules, `MISSING_FILTER_VALUE` handling, and `filterType` value
   - Pattern: follow existing test blocks in `filter.test.ts` for the matching category

## Verification After Extension

After completing any extension, verify:

1. `cd packages/filters && yarn workspace @openvaa/filters vitest run` -- all existing tests pass (no regressions)
2. New test cases pass with expected assertions
3. `yarn build:shared` -- builds without errors (filters is part of shared build)
4. `FILTER_TYPE` const, `FilterTypeMap` type, and type guards in `utils/typeGuards.ts` are all in sync (same set of filter types)
5. Barrel exports chain from subdirectory `index.ts` to `filter/index.ts` to `src/index.ts`
6. New filter's `filterType` property matches the `FILTER_TYPE` const value exactly (string literal type via `as const`)
