# Phase 19: Filters Skill - Research

**Researched:** 2026-03-16
**Domain:** Claude Code skill creation for @openvaa/filters package
**Confidence:** HIGH

## Summary

Phase 19 creates a domain-expert Claude Code skill for the `@openvaa/filters` package. The filters package is a straightforward entity-filtering library with 3 base filter classes (EnumeratedFilter, NumberFilter, TextFilter), 6 concrete filters, a FilterGroup composition layer, a rules system, and its own MISSING_VALUE sentinel. The package has ~26 source files and a single test file.

The skill follows the established pattern from phases 17 (data), 18 (matching), and 20 (database): a SKILL.md with conventions, review checklist, cross-package interfaces, and key source locations, plus a single extension-patterns.md reference file. The CONTEXT.md specifies a proportionally shorter SKILL.md (~80-120 lines) matching the package's lower complexity. A code rename (MISSING_VALUE to MISSING_FILTER_VALUE) eliminates a naming collision with @openvaa/core.

**Primary recommendation:** Follow the data/matching SKILL.md structure exactly, condensed to fit the filters domain's genuinely simpler scope, with the MISSING_FILTER_VALUE rename as a prerequisite code change.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- SKILL.md density: ~80-120 lines, proportionally shorter than data/matching
- Follow established structure: conventions as numbered imperative rules with sub-bullets, review checklist, key source locations, cross-package interfaces section
- Include "Known gaps / planned changes" subsection (3-5 lines) noting README To Do items
- Description field: refine after content is written
- filterType discriminant convention: prominent top-level convention documenting FILTER_TYPE const + FilterType union instead of instanceof, with deferred todo to investigate instanceof safety
- MISSING_FILTER_VALUE rename: rename local MISSING_VALUE in src/missingValue/missingValue.ts to MISSING_FILTER_VALUE, update all imports across filters package
- Single reference file: extension-patterns.md only (no separate filter-hierarchy.md)
- Cross-skill boundaries: Cross-Package Interfaces section following data/matching pattern
- Extension patterns: two guides (new filter type, new question-type filter variant)

### Claude's Discretion
- Exact line count within the ~80-120 line target
- Ordering of conventions within SKILL.md
- Exact wording of review checklist items
- Level of detail for known gaps subsection

### Deferred Ideas (OUT OF SCOPE)
- Investigate whether instanceof can be safely restored across monorepo
- Refactor entityGetter, built-in property/Question accessors into single value getter callback
- Add global locale changing to FilterGroup
- Make canonical missing value undefined with isMissing utility
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FILT-01 | SKILL.md with description that auto-triggers on @openvaa/filters work | Existing stub has well-crafted description; body needs replacing. Glob trigger on `packages/filters/`. Template from data/matching SKILL.md structure. |
| FILT-02 | Filter system conventions documented (3 filter categories, extension pattern) | Full source analysis complete: 3 base classes (EnumeratedFilter, NumberFilter, TextFilter), 6 concrete filters, filterType discriminant, MISSING_FILTER_VALUE sentinel, rules system, FilterGroup composition. |
| FILT-03 | Extension patterns for adding new filter types | Two extension guides needed: (1) adding a new filter type with base+concrete, (2) adding a question-type filter variant. File paths and registration points identified from source analysis. |
| FILT-04 | Review checklist for filter package changes | Patterns identified: filterType registration, type guard updates, FILTER_TYPE/FilterTypeMap sync, no instanceof, MISSING_FILTER_VALUE vs core MISSING_VALUE distinction, test coverage in tests/filter.test.ts. |
</phase_requirements>

## Architecture Patterns

### Package Structure (as-is)
```
packages/filters/src/
  index.ts                          # Package entry: re-exports filter/, group/, missingValue/, utils/
  filter/
    base/
      filter.ts                     # Abstract Filter<TTarget, TValue> base class
      filter.type.ts                # FilterOptions, PropertyFilterOptions, QuestionFilterOptions, FilterableQuestion
      filterTypes.ts                # FILTER_TYPE const, FilterType union, FilterTypeMap
      castValue.ts                  # Value type casting utility
      index.ts                      # Barrel
    enumerated/
      enumeratedFilter.ts           # Abstract EnumeratedFilter (include/exclude rules, parseValues, sortValues)
      choiceQuestionFilter.ts       # Concrete: ChoiceQuestionFilter (single/multiple choice questions)
      objectFilter.ts               # Concrete: ObjectFilter (entity property objects, e.g., party)
      intersect.ts                  # Array intersection utility
      index.ts                      # Barrel
    number/
      numberFilter.ts               # Abstract NumberFilter (min/max/excludeMissing rules)
      numberQuestionFilter.ts       # Concrete: NumberQuestionFilter
      index.ts                      # Barrel
    text/
      textFilter.ts                 # Concrete: TextFilter (text include/exclude, caseSensitive, locale)
      textPropertyFilter.ts         # Concrete: TextPropertyFilter
      textQuestionFilter.ts         # Concrete: TextQuestionFilter
      index.ts                      # Barrel
    rules/
      rules.ts                      # copyRules, ruleIsActive, matchRules utilities
      rules.type.ts                 # Rules, Rule, AtomicRule types
      index.ts                      # Barrel
    index.ts                        # Barrel re-exports base/, enumerated/, number/, text/
  group/
    filterGroup.ts                  # FilterGroup AND/OR composition
    combineResults.ts               # LOGIC_OP const, combineResults()
    index.ts                        # Barrel
  missingValue/
    missingValue.ts                 # MISSING_VALUE sentinel (to be renamed MISSING_FILTER_VALUE)
    index.ts                        # Barrel
  utils/
    typeGuards.ts                   # isFilter, isFilterType, isEnumeratedFilter, isNumberFilter, isTextFilter
    index.ts                        # Barrel
tests/
  filter.test.ts                    # Single test file covering all filter types
```

### Filter Class Hierarchy

```
Filter<TTarget, TValue>  (abstract base)
  |
  +-- EnumeratedFilter<TEntity, TValue, TObject>  (abstract, include/exclude rules)
  |     +-- ChoiceQuestionFilter      (filterType: 'choiceQuestionFilter')
  |     +-- ObjectFilter              (filterType: 'objectFilter')
  |
  +-- NumberFilter<TTarget>  (abstract, min/max/excludeMissing rules)
  |     +-- NumberQuestionFilter      (filterType: 'numberQuestionFilter')
  |
  +-- TextFilter<TEntity>  (concrete, text include/exclude/caseSensitive rules)
        +-- TextPropertyFilter        (filterType: 'textPropertyFilter')
        +-- TextQuestionFilter        (filterType: 'textQuestionFilter')
```

Key structural facts:
- TextFilter is the only base class that is ALSO a concrete class (has its own filterType)
- 3 abstract base classes, 6 concrete filters
- Each concrete filter has a `readonly filterType` property set to a `FILTER_TYPE.*` value

### filterType Discriminant Pattern

The package uses `filterType` discriminant (analogous to data's `objectType`) instead of `instanceof`:

- `FILTER_TYPE` const in `filter/base/filterTypes.ts` maps names to string values
- `FilterType` union auto-derives: `(typeof FILTER_TYPE)[keyof typeof FILTER_TYPE]`
- `FilterTypeMap` maps string values to concrete classes
- Type guards in `utils/typeGuards.ts` check `filterType` property against `FILTER_TYPE` values
- Reason: `instanceof` may break with packing/minimizing (same motivation as data's `objectType`)

### MISSING_VALUE Naming Collision

**Critical gotcha for the skill to document:**
- `@openvaa/core` exports `MISSING_VALUE = undefined` (used for matching imputation)
- `@openvaa/filters` has its own local `MISSING_VALUE = { toString: () => '---' }` (a sentinel object for filter display)
- These are completely different: core's is `undefined`, filters' is an object with a display representation
- The rename to `MISSING_FILTER_VALUE` resolves this naming collision
- After rename: `isMissing()` in filters checks `value === MISSING_FILTER_VALUE`

### Value Extraction Pattern

Filters extract values from entities via `Filter.getValue()`:
- Question-based: reads `entity.answers[question.id]?.value`
- Property-based: reads `entity[property]` (with optional `subProperty` nesting)
- Entity unwrapping: uses `entityGetter` callback (defaults to `getEntity` from @openvaa/core)
- `MaybeWrappedEntity` pattern: filters handle both bare entities and `{ entity: TEntity }` wrappers

### Rules System

Each filter subclass defines its own `_rules` shape:
- EnumeratedFilter: `{ exclude?: Array<MaybeMissing<TValue>>, include?: Array<MaybeMissing<TValue>> }`
- NumberFilter: `{ min?: number, max?: number, excludeMissing?: boolean }`
- TextFilter: `{ exclude?: string, include?: string, caseSensitive?: boolean }`

Rule utilities: `copyRules` (deep copy with array/Set support), `ruleIsActive` (empty-value detection), `matchRules` (equality checking for change deduplication).

### FilterGroup Composition

`FilterGroup` combines multiple filters with AND/OR logic:
- `apply()` runs each filter's `apply()`, then combines via `combineResults()`
- `active` if any child filter is active
- `reset()` resets all children AND resets logicOperator to AND
- Uses `withoutOnChange` to batch child resets without firing multiple events
- `doOnChange` event propagation: child filter changes bubble up to group

### Module Export Pattern

Unlike data (which uses `internal.ts` barrel), filters uses hierarchical `index.ts` barrels at every directory level:
- `src/index.ts` re-exports `./filter`, `./group`, `./missingValue`, `./utils`
- Each subdirectory has its own `index.ts` with `export *`
- No `internal.ts` barrel -- simpler package with no circular dependency issues

### Test Structure

Single test file at `tests/filter.test.ts`:
- Imports from `../src` (package exports) and `../src/filter/rules` (internal rules utilities)
- Creates inline test entities (NamedEntity, AnsweringEntity, PartyMember, etc.)
- Uses `@openvaa/data` question constructors directly (DataRoot, TextQuestion, NumberQuestion, etc.)
- Covers all 6 concrete filter types + FilterGroup + rules utilities + castValue

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill content structure | Novel format | Data/matching SKILL.md template | Established pattern ensures planner consistency |
| Extension guide format | Free-form docs | Numbered steps with exact file paths | Consistent with data/matching/database patterns |
| Description field | Generic description | Refine after body written (Phase 20 precedent) | Description accuracy drives auto-trigger quality |

## Common Pitfalls

### Pitfall 1: MISSING_VALUE Confusion
**What goes wrong:** Confusing filters' `MISSING_FILTER_VALUE` (object sentinel `{ toString: () => '---' }`) with core's `MISSING_VALUE` (`undefined`).
**Why it happens:** They originally had the same name; different semantics and types.
**How to avoid:** Rename to MISSING_FILTER_VALUE first, then document the distinction prominently in conventions.
**Warning signs:** Import from wrong package, type errors comparing object to undefined.

### Pitfall 2: TextFilter is Both Base and Concrete
**What goes wrong:** Treating TextFilter as purely abstract like EnumeratedFilter/NumberFilter.
**Why it happens:** It has `filterType = FILTER_TYPE.TextFilter` AND serves as base for TextPropertyFilter/TextQuestionFilter.
**How to avoid:** Document in skill conventions that TextFilter is uniquely both a base class and concrete filter.

### Pitfall 3: Missing filterType Registration
**What goes wrong:** New filter type added without updating all three registration points.
**Why it happens:** The FILTER_TYPE const, FilterTypeMap type, and typeGuards.ts must all stay in sync.
**How to avoid:** Extension pattern must list all three files. Review checklist must verify sync.

### Pitfall 4: multipleValues Flag Mismatch
**What goes wrong:** Filter constructed with wrong `multipleValues` flag, causing testValue/testValues to throw.
**Why it happens:** EnumeratedFilter and TextFilter both support single and multiple values via boolean flag. If the flag doesn't match the actual question type, the wrong test method is called.
**How to avoid:** Concrete filters auto-detect (ChoiceQuestionFilter uses `isMultipleChoiceQuestion()`, TextQuestionFilter uses `isObjectType(question, OBJECT_TYPE.MultipleTextQuestion)`).

### Pitfall 5: Skill Line Count Bloat
**What goes wrong:** SKILL.md exceeds ~120 lines, wasting Claude context budget.
**Why it happens:** Filter hierarchy seems complex (6 types) but is genuinely simpler than data/matching.
**How to avoid:** Keep hierarchy inline as compact table/list. Single extension-patterns.md reference file. No separate hierarchy reference file.

## MISSING_FILTER_VALUE Rename - Technical Details

Files requiring changes:
1. `src/missingValue/missingValue.ts` -- rename const, type, and function
   - `MISSING_VALUE` -> `MISSING_FILTER_VALUE`
   - `MaybeMissing<TType>` -- references `typeof MISSING_VALUE` -> `typeof MISSING_FILTER_VALUE`
   - `isMissing()` -- internal comparison stays the same, just comparing against renamed const
2. All files importing from `../../missingValue` or `../missingValue`:
   - `src/filter/base/filter.ts` -- imports MISSING_VALUE, MaybeMissing
   - `src/filter/enumerated/enumeratedFilter.ts` -- imports MISSING_VALUE, MaybeMissing
   - `src/filter/enumerated/choiceQuestionFilter.ts` -- imports MISSING_VALUE, MaybeMissing
   - `src/filter/enumerated/objectFilter.ts` -- imports MISSING_VALUE, MaybeMissing
   - `src/filter/number/numberFilter.ts` -- imports isMissing, MISSING_VALUE, MaybeMissing
   - `src/filter/text/textFilter.ts` -- imports MISSING_VALUE, MaybeMissing
   - `src/filter/rules/rules.ts` -- imports MISSING_VALUE
   - `src/filter/rules/rules.type.ts` -- imports typeof MISSING_VALUE
3. Test file: `tests/filter.test.ts` -- imports MISSING_VALUE from `../src`
4. Note: `MaybeMissing<TType>` type name itself does NOT change (only its internal reference)

## Cross-Package Interface Analysis

### Consumed from @openvaa/core
| Interface | Where Used | Purpose |
|-----------|-----------|---------|
| `Entity` | Filter type parameters, entityGetter return | Base entity type |
| `MaybeWrappedEntity<TEntity>` | Filter target generic constraint | Handles bare + wrapped entities |
| `WrappedEntity<TEntity>` | Test file imports | Wrapped entity type |
| `ExtractEntity<TEntity>` | TextPropertyFilter property typing | Extracts entity from MaybeWrapped |
| `getEntity()` | Filter.getValue() default entityGetter | Unwraps MaybeWrappedEntity |
| `hasAnswers()` | Filter.getValue() question-based path | Checks entity has answers |
| `HasAnswers` | Test entities implement | Entities with answers dict |
| `Answer`, `AnswerDict` | Test entity constructors | Answer type for test data |

### Consumed from @openvaa/data
| Interface | Where Used | Purpose |
|-----------|-----------|---------|
| `FilterableQuestion` union | FilterOptions.question type | TextQuestion, MultipleTextQuestion, NumberQuestion, ChoiceQuestion |
| `SingleChoiceCategoricalQuestion` | ChoiceQuestion union member | Single-choice filtering |
| `MultipleChoiceCategoricalQuestion` | ChoiceQuestion union member | Multi-choice filtering |
| `SingleChoiceOrdinalQuestion` | ChoiceQuestion union member | Single-ordinal filtering |
| `NumberQuestion` | NumberQuestionFilter constructor | Number filtering |
| `TextQuestion` | TextQuestionFilter constructor | Text filtering |
| `MultipleTextQuestion` | TextQuestionFilter constructor | Multi-text filtering |
| `AnyChoice` | ChoiceQuestionFilter value type | Choice id and label |
| `Choice` | Test file imports | Test choice data |
| `isMultipleChoiceQuestion()` | ChoiceQuestionFilter constructor | Auto-detect multipleValues |
| `isObjectType()` | TextQuestionFilter constructor | Detect MultipleTextQuestion |
| `OBJECT_TYPE` | TextQuestionFilter constructor | Compare question objectType |
| `DataRoot` | Test file | Create question instances |

### Key Distinction: filters' MISSING_FILTER_VALUE vs core's MISSING_VALUE
- Core: `MISSING_VALUE = undefined` -- matching imputation sentinel
- Filters: `MISSING_FILTER_VALUE = { toString: () => '---' }` -- display-friendly sentinel object
- Filters does NOT import core's MISSING_VALUE -- uses its own entirely separate constant

## Skill Template Analysis

### Data SKILL.md Pattern (reference: ~135 lines)
1. Frontmatter (name, description, glob)
2. Package Purpose (2-3 sentence overview)
3. Conventions (10 numbered rules with sub-bullets)
4. Review Checklist (8 numbered items)
5. Key Source Locations (bulleted list)
6. Cross-Package Interfaces (2-3 paragraphs)
7. Reference Files (links to extension-patterns.md and object-model.md)

### Matching SKILL.md Pattern (reference: ~156 lines)
Same structure as data plus:
- Mathematical Nuances section (CategoricalQuestion math, directional distance, score conversion)
- Known Gaps and Future Work section

### Filters SKILL.md Target (~80-120 lines)
Proposed structure (proportional to domain complexity):
1. Frontmatter (name, refined description)
2. Package Purpose (2-3 sentences)
3. Conventions (~6-8 numbered rules, fewer than data/matching due to simpler domain)
4. Known Gaps / Planned Changes (3-5 lines referencing README To Do)
5. Review Checklist (~6 items)
6. Key Source Locations (bulleted list)
7. Cross-Package Interfaces (1-2 paragraphs)
8. Reference Files (link to extension-patterns.md)

### Extension Patterns Template
Two guides per CONTEXT.md decision:
1. **Adding a New Filter Type** (base class + concrete filter)
   - Registration points: FILTER_TYPE, FilterTypeMap, typeGuards.ts
   - Extend one of 3 base classes OR create new base
   - Add barrel exports at each directory level
2. **Adding a Question-Type Filter Variant** (new XxxQuestionFilter)
   - Cross-references data skill's extension-patterns.md for question type
   - Simpler: extends existing base class, adds filterType

## Open Questions

1. **Exact convention count and ordering**
   - What we know: ~6-8 conventions needed for filters (filterType discriminant, MISSING_FILTER_VALUE, value extraction, rules system, module exports, test location, no instanceof)
   - What's unclear: Optimal ordering for Claude's context window
   - Recommendation: Lead with filterType discriminant (user's explicit priority), then MISSING_FILTER_VALUE gotcha, then structural conventions

2. **Description field refinement**
   - What we know: Current stub description is well-crafted but references "MISSING_VALUE" (pre-rename)
   - What's unclear: Final emphasis after body content is written
   - Recommendation: Phase 20 precedent -- write body first, then refine description to match actual content emphasis; update MISSING_VALUE reference to MISSING_FILTER_VALUE

## Sources

### Primary (HIGH confidence)
- Direct source code analysis of all 26 files in `packages/filters/src/`
- Direct source code analysis of `packages/filters/tests/filter.test.ts`
- Direct analysis of established SKILL.md patterns from `.claude/skills/data/SKILL.md`, `.claude/skills/matching/SKILL.md`
- Direct analysis of extension-patterns from `.claude/skills/data/extension-patterns.md`, `.claude/skills/matching/extension-patterns.md`, `.claude/skills/database/extension-patterns.md`
- CONTEXT.md locked decisions from `/gsd:discuss-phase`
- BOUNDARIES.md skill ownership mappings

### Secondary (MEDIUM confidence)
- `packages/filters/README.md` -- confirmed To Do items for known gaps subsection

## Metadata

**Confidence breakdown:**
- Package architecture: HIGH -- complete source code analysis of all files
- SKILL.md structure: HIGH -- established patterns from 3 completed skills (data, matching, database)
- Extension patterns: HIGH -- registration points verified from source code
- MISSING_FILTER_VALUE rename scope: HIGH -- all import paths traced through source analysis
- Conventions content: HIGH -- all patterns extracted from direct source reading

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable domain -- skill authoring patterns well-established)
