---
name: data
description: 'Domain expert for the @openvaa/data package -- the universal data model for Voting Advice Applications. Understands the DataRoot/DataObject hierarchy, entity variants (Candidate, Organization, Alliance, Faction), question types and their matching interfaces, nomination system, smart defaults, and MISSING_VALUE conventions. Activate when working in packages/data/, extending data models, adding entity or question types, reviewing data package changes, or understanding how VAA data objects connect to matching and filters.'
targets:
  - packages/data/src/
---

# @openvaa/data Package Expert

## Package Purpose

Universal data model for Voting Advice Applications. Provides a single source of truth: all objects
are accessed by reference from `DataRoot`, never copied.

The hierarchy follows `DataRoot` > `Election`/`Constituency`/`QuestionCategory` >
`Entity`/`Question`/`Nomination` with 21 concrete object types. Questions implement
`MatchableQuestion` and entities implement `HasAnswers` from `@openvaa/core`, enabling seamless
use with `@openvaa/matching` and `@openvaa/filters`.

See `packages/data/README.md` for class diagrams and detailed documentation.

## Conventions

1. **internal.ts barrel**: ALL intra-package imports use `../internal` (or deeper relative paths
   to `internal`). NEVER import from `index.ts` or directly between source files. Add new exports
   to `packages/data/src/internal.ts` following the ordering:
   - core -> root -> utils -> i18n
   - questions base -> questions category -> questions variants
   - elections -> constituencies
   - entities base -> entities variants
   - nominations base -> nominations variants
   - Base types MUST appear before dependent types.

2. **objectType discriminator**: Every concrete class declares
   `readonly objectType = OBJECT_TYPE.ClassName`. When adding a new class:
   - Add its entry to `OBJECT_TYPE` in `core/objectTypes.ts`
   - Add the mapping to `ObjectTypeMap` in the same file
   - Update `utils/typeGuards.ts` with the new type

3. **Type guards over instanceof**: NEVER use `instanceof` for `DataObject` type checking. Use
   `isEntity()`, `isQuestion()`, `isChoiceQuestion()`, `isNomination()`, `isObjectType(obj, type)`
   from `packages/data/src/utils/typeGuards.ts`. Historical `instanceof` bugs (commit 87efe19a)
   caused cross-module-boundary failures. The root guard `isDataObject()` checks for the
   `objectType` property against `OBJECT_TYPE` values.

4. **Smart default values**: Property getters return empty defaults for missing data. Follow the
   pattern `get prop() { return this.data.prop ?? defaultValue; }`. Default values by type:
   - `''` for strings (`name`, `info`, `subtype`)
   - `null` for optional objects (`color`, `image`)
   - `{}` for records (`customData`)
   - `Infinity` for ordering (`order`)
   - `false` for boolean flags (`isGenerated`)
   - NEVER use `MISSING_VALUE` in data object getters.

5. **MISSING_VALUE is for matching only**: `MISSING_VALUE` from `@openvaa/core` is a
   matching-context sentinel. Data objects use `undefined` or empty literals for absent values.
   Question `normalizeValue()` returns `MISSING_VALUE` for values that should be imputed by the
   matching algorithm. Check with `isMissingValue()`.

6. **DataRoot provision methods**: NEVER create objects directly with `new`. Always use DataRoot
   provision methods: `provideElectionData()`, `provideConstituencyData()`,
   `provideQuestionData()`, `provideEntityData()`, `provideNominationData()`. Provision order
   matters:
   - Elections first
   - Then constituencies
   - Then entities+nominations and question categories+questions
   - Use `provideFullData()` to provide everything at once.

7. **Updatable transaction system**: Wrap changes in `update(transaction)`. Nesting is tracked
   and `onUpdate()` fires only at the outermost boundary. Failed transactions do NOT trigger
   updates. Listen for changes with `subscribe(handler)`. Both `DataRoot` and all `DataObject`
   subclasses extend `Updatable`.

8. **Formatter system**: Use `DataRoot.setFormatter()` to customize string output for answers and
   entity names. Frontend overrides formatters in `dataContext.ts` for locale-aware formatting.
   Never hardcode name formatting -- use `root.formatCandidateName()`,
   `root.formatAllianceName()`, etc. The `DataRoot.locale` property affects date and text
   formatting.

9. **Co-located tests**: Every source file `foo.ts` has a co-located `foo.test.ts` in the same
   directory. Tests import from `../internal` (same as source files) plus `../../testUtils`. Test
   data comes from `getTestData()` and `getTestDataRoot()` in `packages/data/src/testUtils/`.

10. **Localization via translate()**: Use `translate({ value, locale })` with
    `isLocalizedValue()` check. The function provides 3-tier fallback: requested locale -> first
    available key -> undefined. `LocalizedValue<T>` wraps any string-valued property.
    `TRANSLATIONS_KEY` marks translation objects in `packages/data/src/i18n/localized.ts`.

11. **Never fall back to the ambient machine locale**: `packages/data/src/utils/formatAnswer.ts`
    exports `DEFAULT_LOCALE = 'en-US'`, and every `Intl`-backed formatter (`formatDateAnswer`,
    `formatNumberAnswer`) resolves `locale ?? DEFAULT_LOCALE` -- never `locale ?? undefined`.
    `Intl` reads an `undefined` locale as "use the runtime default", which makes rendered output a
    function of the host: the same `Date` renders `10/5/2023` on an `en-US` machine and `5.10.2023`
    on a `fi` one. Under SSR that means a user's dates depend on the server's environment rather
    than on their locale -- a latent defect, not merely a test hazard. Callers that care about the
    rendered locale pass one explicitly; `DataRoot` threads its own `locale` through to every
    formatter.

12. **`MultipleChoiceCategoricalQuestion` has no 2-choice shortcut**: each choice is an independent
    binary subdimension (selected -> `COORDINATE.Max`, unselected -> `COORDINATE.Min`, in `choices`
    order), so `normalizedDimensions === choices.length` even at two choices -- unlike
    `SingleChoiceCategoricalQuestion`, which collapses two choices to one dimension. A multi-select
    question can have several choices selected at once, so the collapse would be wrong. A missing
    value **or an empty selection** (zero selections = unanswered) normalizes to an all-
    `MISSING_VALUE` subdimension array, contributing no distance.

## Reviewing Data Package Changes

Use this checklist when reviewing or making changes to `packages/data/`:

1. No `instanceof` checks -- use type guards from `utils/typeGuards.ts` or the `objectType`
   property
2. All imports within the package use `../internal` -- never `./index`, never direct
   file-to-file imports
3. New exports added to `internal.ts` in the correct position (base types before dependent
   types)
4. New concrete classes registered in `OBJECT_TYPE`, `ObjectTypeMap`, and `typeGuards.ts`
5. Smart defaults used for property getters -- no bare `undefined` returns for optional string,
   record, or array properties
6. `MISSING_VALUE` not stored in data objects -- only used in matching/normalization context
   (`normalizeValue()`)
7. Tests co-located as `*.test.ts` next to source files, importing from `../internal` and
   `testUtils`
8. Data provision order respected -- elections -> constituencies -> entities+nominations /
   categories+questions

## Key Source Locations

- Entry point: `packages/data/src/index.ts`
- Central barrel: `packages/data/src/internal.ts`
- DataRoot: `packages/data/src/root/dataRoot.ts` (~897 lines)
- Abstract base: `packages/data/src/core/dataObject.ts`
- Object types: `packages/data/src/core/objectTypes.ts`
- Type guards: `packages/data/src/utils/typeGuards.ts`
- Entity variants: `packages/data/src/objects/entities/variants/`
- Question variants: `packages/data/src/objects/questions/variants/`
- Nomination variants: `packages/data/src/objects/nominations/variants/`
- Question factory: `packages/data/src/objects/questions/variants/variants.ts`
- Localization: `packages/data/src/i18n/translate.ts`
- Answer formatters + `DEFAULT_LOCALE`: `packages/data/src/utils/formatAnswer.ts`
- Test utilities: `packages/data/src/testUtils/`

## Cross-Package Interfaces

Questions implement `MatchableQuestion` from `@openvaa/core` (provides `id`,
`normalizedDimensions`, `normalizeValue`). Entities implement `HasAnswers` from `@openvaa/core`
(provides answers record, `getAnswer` method).

The matching skill documents how these interfaces are consumed by algorithms. `MISSING_VALUE`,
`COORDINATE`, `normalizeCoordinate`, and `isMissingValue` are re-exported from `@openvaa/core`
via `internal.ts` for use within the data package.

## Reference Files

- For complete object hierarchy and DataRoot collection types, read [object-model.md](object-model.md)
- For step-by-step guides to adding new entity and question types, read [extension-patterns.md](extension-patterns.md)

## Freshness Record

**Reviewed 2026-08-29** (Phase 153, plan 153-08) at HEAD `7d6aaac47`, branch
`integration/ship-12-squash`. Previous baseline -- the last commit touching `.claude/skills/data/` --
was `14afb2d80` (2026-08-17). `.claude/scripts/audit-skill-drift.sh` reported
`DRIFT 5 commits, 13 files` under this skill's single target, `packages/data/src/`.

### What changed, and what it did to this skill

| Commit | What it did | Effect here |
|---|---|---|
| `34d6535ce` | wired `test:unit` across workspaces; rewrote a nomination-tree test to assert output (one item per tree leaf, each carrying its own election and constituency id) rather than wiring | none -- test assertions only |
| `a81378639` | renamed the test-local `quatenaryChoices` to `quaternaryChoices` | none -- a `const` inside two `*.test.ts` files, not exported API |
| `269e44462` | corrected the `dimesions` typo left in an assertion message | none -- a string literal in a test description |
| `87e02f40b` | comment sweep across core, data, matching, filters | none -- comments only |
| `dce80642f` | unwrapped 3,796 forced line breaks across `packages/` | none -- presentation only |

**Measured, not assumed.** `git diff -w 14afb2d80..HEAD -- packages/data/src/`, with comment and
blank lines filtered out, yields **28** changed lines, and **every one of them is inside a
`*.test.ts` file**. No production source line under `packages/data/src/` changed semantically since
this skill was last reviewed, so the object hierarchy, the entity and question variants, the
nomination model, the smart-default and `MISSING_VALUE` conventions, and the
`MatchableQuestion` / `HasAnswers` cross-package interfaces described above are all unaffected.

**Checked for citation staleness:** `grep -rnE 'quatenary|dimesion' .claude/skills/` returns nothing,
so no skill text quoted either misspelling and nothing needed rewriting on that account.

**No content correction was required by this review** -- recorded as a reviewed no-change rather
than resolved with a content-free touch, because the audit exists to make a human look and this is
what the look found.
