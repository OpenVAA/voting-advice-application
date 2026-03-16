---
name: filters
description: "Domain expert for the @openvaa/filters package -- entity filtering in Voting Advice Applications. Understands Filter base class with filterType discriminant, EnumeratedFilter/NumberFilter/TextFilter hierarchies with 6 concrete filters, FilterGroup composition with AND/OR logic, the rules system (exclude/include/min/max), MISSING_FILTER_VALUE sentinel, and value extraction from entities and answers. Activate when working in packages/filters/, adding new filter types, reviewing filter changes, or understanding how candidate/party filtering works in the voter app."
---

# @openvaa/filters Package Expert

## Package Purpose

Entity filtering for Voting Advice Applications. Provides 3 abstract filter base classes
(EnumeratedFilter, NumberFilter, TextFilter) and 6 concrete filters for filtering entities by
question answers or object properties. FilterGroup composes multiple filters with AND/OR logic.

Depends on `@openvaa/core` (Entity, MaybeWrappedEntity, getEntity, hasAnswers) and `@openvaa/data`
(question types: TextQuestion, NumberQuestion, ChoiceQuestion variants).

See `packages/filters/README.md` for basic usage examples.

## Conventions

1. **filterType discriminant**: ALWAYS use the `filterType` property and type guards from
   `utils/typeGuards.ts` -- NEVER use `instanceof`. Each concrete filter declares
   `readonly filterType = FILTER_TYPE.XxxFilter`. The `FILTER_TYPE` const, `FilterTypeMap`, and
   type guards in `typeGuards.ts` must stay in sync when adding new filters.
   - Deferred: investigate whether `instanceof` can be safely restored across the monorepo.

2. **MISSING_FILTER_VALUE sentinel**: Filters has its OWN missing value constant
   `MISSING_FILTER_VALUE` in `src/missingValue/missingValue.ts` -- an object `{ toString: () => '---' }`
   for display-friendly sentinel. This is COMPLETELY SEPARATE from `@openvaa/core`'s `MISSING_VALUE`
   (`undefined`). NEVER import core's `MISSING_VALUE` in filters code. Use `isMissing()` for checks.

3. **Value extraction pattern**: Filters extract values via `Filter.getValue()`: question-based
   reads `entity.answers[question.id]?.value`, property-based reads `entity[property]` with optional
   `subProperty` nesting. Entity unwrapping uses `entityGetter` callback (defaults to `getEntity`
   from @openvaa/core). `MaybeWrappedEntity` handles both bare entities and `{ entity }` wrappers.

4. **Rules system**: Each filter subclass defines its own `_rules` shape:
   - EnumeratedFilter: `{ exclude?, include? }` (arrays of values)
   - NumberFilter: `{ min?, max?, excludeMissing? }`
   - TextFilter: `{ exclude?, include?, caseSensitive? }` (strings)
   - Rule utilities in `src/filter/rules/rules.ts`: `copyRules` (deep copy), `ruleIsActive`
     (empty detection), `matchRules` (equality check for change dedup).

5. **FilterGroup composition**: `FilterGroup` combines filters with AND/OR logic via
   `combineResults()`. Group is `active` if any child is active. `reset()` resets all children AND
   resets `logicOperator` to AND. Uses `withoutOnChange` to batch child resets. Child changes bubble
   up via `doOnChange`.

6. **TextFilter is both base and concrete**: TextFilter has
   `filterType = FILTER_TYPE.TextFilter` AND serves as base for TextPropertyFilter and
   TextQuestionFilter. Treat it as a concrete filter that also has subclasses.

7. **Module exports via hierarchical index.ts barrels**: Unlike @openvaa/data (which uses
   `internal.ts`), filters uses `index.ts` barrels at every directory level. `src/index.ts`
   re-exports `./filter`, `./group`, `./missingValue`, `./utils`. No circular dependency issues.

8. **Tests in single file**: All tests live in `tests/filter.test.ts`. Test imports from `../src`
   (package exports) and `../src/filter/rules` (internal rules utilities). Uses @openvaa/data
   question constructors directly (DataRoot, TextQuestion, NumberQuestion, etc.).

## Known Gaps and Future Work

- Refactor `entityGetter`/property accessor into single value getter callback (README To Do)
- Add global locale changing for FilterGroup (README To Do)
- Canonical missing value could become `undefined` with `isMissing` utility (README To Do)
- Consider moving `isMissing` check into filter method so subclasses can override it

## Reviewing Filter Package Changes

1. New concrete filter registered in all three places: `FILTER_TYPE` const in
   `filter/base/filterTypes.ts`, `FilterTypeMap` in same file, type guards in `utils/typeGuards.ts`
2. No `instanceof` checks -- use `isFilter()`, `isFilterType()`, `isEnumeratedFilter()`,
   `isNumberFilter()`, `isTextFilter()` from `utils/typeGuards.ts`
3. `MISSING_FILTER_VALUE` from `src/missingValue/` used for filters' missing sentinel -- NOT
   `MISSING_VALUE` from `@openvaa/core`
4. Barrel exports updated at each directory level (`index.ts` in the filter subdirectory,
   `filter/index.ts`, `src/index.ts`)
5. `multipleValues` flag matches actual question type (ChoiceQuestionFilter auto-detects via
   `isMultipleChoiceQuestion()`, TextQuestionFilter via
   `isObjectType(question, OBJECT_TYPE.MultipleTextQuestion)`)
6. Tests added or updated in `tests/filter.test.ts` covering the new or changed behavior

## Key Source Locations

- Entry point: `packages/filters/src/index.ts`
- Filter base: `packages/filters/src/filter/base/filter.ts`
- Filter types: `packages/filters/src/filter/base/filterTypes.ts` (FILTER_TYPE, FilterTypeMap)
- Type guards: `packages/filters/src/utils/typeGuards.ts`
- EnumeratedFilter: `packages/filters/src/filter/enumerated/enumeratedFilter.ts`
- NumberFilter: `packages/filters/src/filter/number/numberFilter.ts`
- TextFilter: `packages/filters/src/filter/text/textFilter.ts`
- FilterGroup: `packages/filters/src/group/filterGroup.ts`
- Rules system: `packages/filters/src/filter/rules/rules.ts`
- Missing value: `packages/filters/src/missingValue/missingValue.ts`
- Tests: `packages/filters/tests/filter.test.ts`

## Cross-Package Interfaces

Filters consume `Entity`, `MaybeWrappedEntity`, `getEntity()`, and `hasAnswers()` from
`@openvaa/core` for entity unwrapping and answer access. The data skill documents how entities
implement `HasAnswers`.

Filters consume `FilterableQuestion` union (TextQuestion, MultipleTextQuestion, NumberQuestion,
ChoiceQuestion variants) from `@openvaa/data`. ChoiceQuestionFilter uses
`isMultipleChoiceQuestion()` from data. The data skill documents question type details.

`MISSING_FILTER_VALUE` is completely separate from `@openvaa/core`'s `MISSING_VALUE`. Core's is
`undefined` (matching imputation sentinel). Filters' is an object with `toString()` (display
sentinel).

## Reference Files

- For step-by-step guides to adding new filter types and question-type filter variants, read [extension-patterns.md](extension-patterns.md)
