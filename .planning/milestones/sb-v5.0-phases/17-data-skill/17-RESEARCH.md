# Phase 17: Data Skill - Research

**Researched:** 2026-03-15
**Domain:** Claude Code skill authoring for @openvaa/data package domain expertise
**Confidence:** HIGH

## Summary

Phase 17 creates the first real domain-expert skill for the OpenVAA framework. The `@openvaa/data` package is the most complex single package in the monorepo (120+ source files, 900-line DataRoot class, 21 concrete object types) and serves as the foundation that every other package depends on. The skill must transform Claude from a generic TypeScript assistant into a data model expert who understands DataRoot/DataObject hierarchy, entity and question variant systems, the nomination linking model, the internal.ts barrel pattern for circular dependency avoidance, and the type guard pattern that replaces instanceof checks.

The Phase 16 scaffolding is complete: the `.claude/skills/data/SKILL.md` stub exists with a well-crafted description and placeholder body. Phase 17 replaces the placeholder with actionable content and creates supporting reference files. The skill follows the established architecture pattern of progressive disclosure: a lean SKILL.md (<200 lines core content) containing conventions, decision rules, and review checklist, with supporting reference files containing detailed type hierarchies and extension step-by-step guides that Claude loads on demand.

The primary challenge is distilling 120+ source files of deeply interconnected TypeScript classes into actionable skill content that changes Claude's behavior. The research below catalogs the exact patterns, conventions, anti-patterns, and extension workflows that the skill must encode, organized by the five requirements (DATA-01 through DATA-05).

**Primary recommendation:** Build the skill in 3 deliverables: (1) SKILL.md with core conventions, review checklist, and key source locations; (2) an object-model reference file with type hierarchy diagrams and relationship maps; (3) an extension-patterns reference file with step-by-step guides for adding new entity types and question types.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | SKILL.md with description that auto-triggers on @openvaa/data work | Existing stub has description from Phase 16. Body needs conventions, decision rules, review checklist, and reference pointers. Pattern established by Phase 16 stubs for all 6 skills. |
| DATA-02 | Data model conventions documented as actionable rules | Research identifies 10 core conventions: DataRoot hierarchy, smart defaults, MISSING_VALUE usage, internal.ts barrel, objectType discriminator, type guards over instanceof, Updatable transaction system, formatter system, data provision methods, localization utilities. All verified from source code. |
| DATA-03 | Extension patterns for adding new entity types and question types | Research maps the exact file-by-file changes needed: entity extension requires ~10 coordinated changes across class, type, test, ENTITY_TYPE, OBJECT_TYPE, variants.ts, DataRoot collections, typeGuards.ts, and internal.ts. Question extension requires ~12 changes including normalizeValue implementation. |
| DATA-04 | Review checklist for data package changes | Research identifies 8 review items: instanceof avoidance, internal.ts exports, circular dependency prevention, smart default patterns, objectType registration, type guard updates, test co-location, and MISSING_VALUE correct usage. |
| DATA-05 | Reference files for type hierarchies and relationship diagrams | Research maps the complete 4-level object hierarchy (Updatable -> DataObject -> Entity/Question/Nomination/etc -> concrete variants), 21 object types, 13 DataRoot collection types, and cross-package interface contracts (MatchableQuestion, HasAnswers). |
</phase_requirements>

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| SKILL.md (YAML + Markdown) | Agent Skills Spec 1.0 | Skill definition file | Required format; Phase 16 established the pattern |
| Reference Markdown files | N/A | Detailed reference material loaded on demand | Progressive disclosure; keeps SKILL.md lean |

### Supporting
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| Vitest | ^2.1.8 | Unit test framework for data package | Verification of skill-guided changes |

No npm packages needed for skill authoring. The skill is pure Markdown content.

**Installation:** N/A -- skill files are created manually.

## Architecture Patterns

### Recommended Skill File Structure
```
.claude/skills/data/
  SKILL.md              # Core: conventions, review checklist, key source locations (~130 lines body)
  object-model.md       # Reference: type hierarchy, DataRoot collections, relationship maps (~300 lines)
  extension-patterns.md # Reference: step-by-step guides for adding entities and questions (~250 lines)
```

### Pattern 1: Data Package Source Organization
**What:** The `@openvaa/data` package follows a consistent file organization pattern.
**When to document:** SKILL.md must teach this so Claude creates files in correct locations.

```
packages/data/src/
  index.ts                    # Public API -- re-exports from internal.ts (type/value separated)
  internal.ts                 # Central barrel -- ALL intra-package imports go through here
  core/
    dataObject.ts             # Abstract DataObject<TData> base class
    dataObject.type.ts        # DataObjectData interface
    objectTypes.ts            # OBJECT_TYPE const + ObjectType type + ObjectTypeMap
    updatable.ts              # Updatable base class (subscribe/update/onUpdate)
    updatable.type.ts         # CanUpdate, UpdateHandler types
    filter.ts / filter.type.ts # Filtering utilities (match(), FilterTargets)
    error.ts                  # DataNotFoundError, DataProvisionError, DataTypeError
    collection.type.ts        # Collection<T>, MappedCollection<T>
  root/
    dataRoot.ts               # DataRoot class (~897 lines) -- entry point for all data
    dataRoot.type.ts           # RootCollections, FullVaaData, RootFormatters, CombinedElections
  objects/
    election/                  # Election, ElectionData
    constituency/              # Constituency, ConstituencyGroup + types
    entities/
      base/
        entity.ts             # Abstract Entity<TType, TData> base
        entity.type.ts        # EntityData interface
        entityTypes.ts        # ENTITY_TYPE const (Candidate, Faction, Organization, Alliance)
      variants/
        candidate.ts          # Candidate extends Entity
        candidate.type.ts     # CandidateData extends EntityData
        candidate.test.ts     # Co-located test
        [faction|organization|alliance].ts/.type.ts/.test.ts
        variants.ts           # EntityVariant type map, createEntity utility, parseEntityTree
        variants.test.ts
    questions/
      base/
        question.ts           # Abstract Question<TType, TData> -- implements MatchableQuestion
        questionTypes.ts      # QUESTION_TYPE, SIMPLE_QUESTION_TYPE, CHOICE_QUESTION_TYPE etc.
        choiceQuestion.ts     # Abstract ChoiceQuestion<TType, TChoiceValue>
        singleChoiceQuestion.ts # Abstract SingleChoiceQuestion
        multipleChoiceQuestion.ts # Abstract MultipleChoiceQuestion
        questionAndCategoryBase.ts # Shared base for Question and QuestionCategory (filtering)
      category/
        questionCategory.ts    # QuestionCategory class
        questionCategoryTypes.ts # QUESTION_CATEGORY_TYPE (Info, Opinion, Default)
      variants/
        singleChoiceOrdinalQuestion.ts   # Likert-scale -- normalizeValue maps to ordinal range
        singleChoiceCategoricalQuestion.ts # Nominal -- normalizeValue creates N subdimensions
        multipleChoiceCategoricalQuestion.ts
        booleanQuestion.ts / dateQuestion.ts / imageQuestion.ts / numberQuestion.ts / textQuestion.ts / multipleTextQuestion.ts
        variants.ts           # QUESTION_VARIANT map, createQuestion factory, QuestionVariant types
    nominations/
      base/
        nomination.ts         # Abstract Nomination<TEntity, TParent, TData>
        nomination.type.ts    # NominationData interface
      variants/
        candidateNomination.ts / factionNomination.ts / organizationNomination.ts / allianceNomination.ts
        variants.ts           # NominationVariant type map
  i18n/
    localized.ts              # LocalizedValue type, TRANSLATIONS_KEY, isLocalizedValue
    translate.ts              # translate() with 3-tier fallback
  utils/
    typeGuards.ts             # isDataObject, isEntity, isQuestion, isChoiceQuestion, isNomination, etc.
    ensureValue.ts            # ensureString, ensureNumber, ensureBoolean, etc.
    createDeterministicId.ts  # ID generation for auto-created nominations
    format.ts / formatAnswer.ts # Formatter utilities
    answer.ts / choice.ts     # Answer/Choice utilities
    order.ts                  # order() comparator for Collection sorting
    parseFullVaaData.ts       # Full data parsing utility
  testUtils/                  # Test data factories (getTestData, getTestDataRoot)
```

### Pattern 2: The internal.ts Barrel Pattern
**What:** ALL intra-package imports use `../internal` (or `../../internal`, etc.). The `internal.ts` file re-exports everything in a specific order to avoid circular dependencies. The `index.ts` file re-exports from `internal.ts` for the public API.
**When to document:** This is the #1 convention Claude must follow when adding exports.

**Rules:**
1. New types go in `internal.ts` via `export * from './path/to/file'`
2. The ORDER of exports in `internal.ts` matters -- base types before dependent types
3. Source files NEVER import from `index.ts` or from each other directly -- always from `../internal`
4. `index.ts` re-exports from `./internal` with type/value separation (type exports first, then value exports, then function exports, then const exports)

### Pattern 3: ObjectType Discriminator + Type Guards (No instanceof)
**What:** Every concrete class has `readonly objectType = OBJECT_TYPE.ClassName`. Type checking uses `objectType` property or type guard functions (`isEntity()`, `isQuestion()`, etc.) instead of `instanceof`.
**When to document:** Critical anti-pattern prevention. Historical `instanceof` bugs (commit 87efe19a).

**The type guard pattern:**
```typescript
// In typeGuards.ts -- uses OBJECT_TYPE values, not instanceof
export function isEntity(obj: unknown): obj is AnyEntityVariant {
  return (
    isDataObject(obj) &&
    (obj.objectType === OBJECT_TYPE.Alliance ||
      obj.objectType === OBJECT_TYPE.Candidate ||
      obj.objectType === OBJECT_TYPE.Faction ||
      obj.objectType === OBJECT_TYPE.Organization)
  );
}

// isDataObject is the root guard
export function isDataObject(obj: unknown): obj is DataObject {
  return (
    !!obj && typeof obj === 'object' &&
    'objectType' in obj &&
    Object.values(OBJECT_TYPE).includes(obj.objectType as ObjectType)
  );
}
```

### Pattern 4: Smart Default Values
**What:** DataObject property getters return empty defaults for missing values (`''`, `null`, `{}`, `Infinity`). The pattern is `return this.data.prop ?? defaultValue`.
**When to document:** Must distinguish from MISSING_VALUE which is matching-context only.

Key defaults from DataObject base:
- `name` -> `''`
- `shortName` -> `this.name` (falls back to name)
- `info` -> `''`
- `color` -> `null`
- `image` -> `null`
- `customData` -> `{}`
- `order` -> `Infinity`
- `subtype` -> `''`
- `isGenerated` -> `false`

### Pattern 5: Updatable Transaction System
**What:** DataRoot and all DataObjects extend `Updatable`. Changes are wrapped in `update(transaction)` which tracks nesting and only fires `onUpdate()` at the outermost transaction boundary. Failed transactions do NOT trigger updates.
**When to document:** Critical for understanding data provision and reactivity.

### Pattern 6: Data Provision via DataRoot
**What:** Objects are NEVER created directly with `new`. They are always created through DataRoot provision methods: `provideFullData()`, `provideElectionData()`, `provideConstituencyData()`, `provideQuestionData()`, `provideEntityData()`, `provideNominationData()`. Each method accepts data arrays and uses factory functions.
**When to document:** Prevents the "detached object" anti-pattern.

### Anti-Patterns to Avoid
- **Using `instanceof`:** Use `objectType` property or type guard functions (`isEntity()`, `isQuestion()`, etc.)
- **Importing from `index.ts` within the package:** Always import from `../internal`
- **Importing directly between source files:** Always go through `../internal`
- **Creating DataObjects with `new` directly:** Use DataRoot provision methods
- **Mutating `data` property outside transactions:** Use `update()` transactions
- **Storing MISSING_VALUE in data objects:** MISSING_VALUE is for matching context only; use `undefined` or empty literals in data objects
- **Copying DataObjects:** Single source of truth -- all objects accessed by reference from DataRoot

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type checking DataObjects | Custom `instanceof` checks | `isEntity()`, `isQuestion()`, `isNomination()`, `isObjectType(obj, type)` from typeGuards.ts | `instanceof` breaks across module boundaries |
| Creating question instances | Manual `new QuestionClass()` | `createQuestion({ data, root })` factory from `variants.ts` | Factory selects correct class from `data.type` |
| Answer value validation | Custom type checking | `question.ensureValue(value)` and `question.ensureAnswer(answer)` | Handles type coercion and MISSING_VALUE correctly |
| Value normalization for matching | Custom coordinate mapping | `question.normalizeValue(value)` | Handles missing values, ordinal ranges, categorical subdimensions |
| Entity name formatting | String concatenation | `DataRoot.formatCandidateName()`, `DataRoot.setFormatter()` | Customizable; locale-aware; frontend overrides in dataContext |
| Deterministic IDs | `crypto.randomUUID()` | `DataRoot.createId()` / `createDeterministicId()` | Nominations need deterministic IDs for idempotent provision |
| Localization | Custom key-value lookups | `translate({ value, locale })` with `isLocalizedValue()` | 3-tier fallback: requested locale -> first available -> undefined |

## Common Pitfalls

### Pitfall 1: Adding Exports Directly to index.ts
**What goes wrong:** New types added to `index.ts` instead of `internal.ts` break circular dependency resolution.
**Why it happens:** Developers are accustomed to barrel patterns where `index.ts` is the barrel file.
**How to avoid:** All new exports MUST go through `internal.ts` first. The `index.ts` file only re-exports from `./internal`.
**Warning signs:** Import errors mentioning circular dependencies; TypeScript errors about types used before declaration.

### Pitfall 2: Using instanceof for Type Checking
**What goes wrong:** `instanceof` checks fail across module boundaries (e.g., when the same class is loaded from both ESM and CJS builds, or across workspace package boundaries).
**Why it happens:** Standard TypeScript/JavaScript pattern that works in most projects but fails in this monorepo setup.
**How to avoid:** Always use `objectType` property checks or type guard functions from `utils/typeGuards.ts`.
**Warning signs:** Type guards returning false for objects that are clearly the expected type; runtime `false` for `candidate instanceof Candidate`.

### Pitfall 3: Creating DataObjects Without DataRoot
**What goes wrong:** Objects created with `new Candidate({ data, root })` directly don't get registered in DataRoot collections and cannot be found by other objects' getters (e.g., `nomination.entity` throws DataNotFoundError).
**Why it happens:** Typical OOP instinct to construct objects directly.
**How to avoid:** Always use DataRoot provision methods (`provideEntityData()`, etc.).
**Warning signs:** `DataNotFoundError: Child in collection X with id Y not found` at runtime.

### Pitfall 4: Confusing MISSING_VALUE with Undefined
**What goes wrong:** `MISSING_VALUE` (from `@openvaa/core`) used in data object properties, or `undefined` used where `MISSING_VALUE` is expected for matching.
**Why it happens:** Two different "missing" concepts: data-level missing (use `undefined`/empty defaults) vs matching-level missing (use `MISSING_VALUE` sentinel).
**How to avoid:** Data object getters use `?? defaultValue`. Question `normalizeValue()` uses `MISSING_VALUE` for values that should be imputed by the matching algorithm.
**Warning signs:** Matching algorithm receiving `undefined` (crashes) or data UI showing `Symbol(MISSING_VALUE)` as text.

### Pitfall 5: Forgetting to Update ObjectTypeMap and Type Guards
**What goes wrong:** New concrete class is created but not registered in `OBJECT_TYPE` const, `ObjectTypeMap`, and type guard functions. The type guard returns `false` for the new type.
**Why it happens:** Coordinated changes across 3-4 files are easy to miss.
**How to avoid:** Follow the extension pattern checklist (DATA-03). The `objectTypes.ts` file has comments: "NB! When editing these, be sure to update `/utils/typeGuard.ts` as well."
**Warning signs:** Type guard functions return `false` for new object types; TypeScript errors about missing keys in mapped types.

### Pitfall 6: Breaking the internal.ts Export Order
**What goes wrong:** New export added in the wrong position in `internal.ts` causes a class to be referenced before its dependencies are defined.
**Why it happens:** The file is 107 lines of `export * from` statements and the ordering rationale is implicit (base types before dependent types).
**How to avoid:** Follow the existing ordering pattern: core -> root -> utils -> i18n -> questions base -> questions category -> questions variants -> elections -> constituencies -> entities base -> entities variants -> nominations base -> nominations variants.
**Warning signs:** Runtime errors about undefined classes; TypeScript errors about types used before definition.

### Pitfall 7: Not Co-locating Tests
**What goes wrong:** Tests placed in a separate `__tests__` directory rather than co-located as `*.test.ts` next to source files.
**Why it happens:** Different projects use different test organization conventions.
**How to avoid:** Every `entity.ts` has a `entity.test.ts` in the same directory. Tests import from `../internal` (same as source files) plus `../../testUtils`.
**Warning signs:** Test files in unexpected locations; tests importing from `@openvaa/data` instead of `../internal`.

### Pitfall 8: Forgetting QuestionCategory Filtering Inheritance
**What goes wrong:** Question filtering ignores the category's own filters, or category changes are not propagated to questions.
**Why it happens:** The `Question.appliesTo()` method checks both its own filters AND the category's filters by default (unless `dontInherit: true`).
**How to avoid:** Understand the `effectiveElections`, `effectiveConstituencies` etc. getters that intersect question and category filters.
**Warning signs:** Questions appearing outside their intended election/constituency scope.

## Code Examples

### Creating and Using DataRoot (from source: dataRoot.ts)
```typescript
// Full data provision
const root = new DataRoot({ data: fullVaaData, locale: 'en' });

// Incremental provision
const root = new DataRoot();
root.provideElectionData(elections);
root.provideConstituencyData({ groups, constituencies });
root.provideQuestionData({ categories, questions });
root.provideEntityData(entities);       // Accepts array or EntityVariantTree
root.provideNominationData(nominations); // Accepts array or NominationVariantTree

// Accessing objects
const candidate = root.getCandidate('id');
const question = root.getQuestion('q1');
const nominations = root.getNominationsForEntity(candidate);
```

### Type Guard Usage (from source: typeGuards.ts)
```typescript
import { isEntity, isQuestion, isChoiceQuestion, isObjectType, OBJECT_TYPE } from '@openvaa/data';

// Generic type guards
if (isEntity(obj)) { /* obj is AnyEntityVariant */ }
if (isQuestion(obj)) { /* obj is AnyQuestionVariant */ }

// Specific type guard
if (isObjectType(obj, OBJECT_TYPE.Candidate)) { /* obj is Candidate */ }
```

### Entity Variant Pattern (from source: candidate.ts)
```typescript
export class Candidate
  extends Entity<typeof ENTITY_TYPE.Candidate, CandidateData>
  implements DataAccessor<CandidateData> {
  readonly objectType = OBJECT_TYPE.Candidate;

  // Typed property getters with smart defaults
  get firstName(): string { return this.data.firstName; }
  get lastName(): string { return this.data.lastName; }
  get name(): string {
    return this.data.name || this.root.formatCandidateName({ object: this });
  }
}
```

### Question normalizeValue Pattern (from source: singleChoiceOrdinalQuestion.ts)
```typescript
export class SingleChoiceOrdinalQuestion extends SingleChoiceQuestion<
  typeof QUESTION_TYPE.SingleChoiceOrdinal, number
> {
  readonly objectType = OBJECT_TYPE.SingleChoiceOrdinalQuestion;
  protected min: number;
  protected max: number;

  get isMatchable(): boolean { return true; }

  protected _normalizeValue(
    value: AnswerValue[typeof QUESTION_TYPE.SingleChoiceOrdinal] | MissingValue
  ): CoordinateOrMissing {
    if (isMissingValue(value)) return MISSING_VALUE;
    const numeric = this.getChoice(value)!.normalizableValue;
    return normalizeCoordinate({ value: numeric, min: this.min, max: this.max });
  }
}
```

### Test Pattern (from source: candidate.test.ts)
```typescript
import { describe, expect, test } from 'vitest';
import { ENTITY_TYPE, parseEntityTree } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const data = getTestData();

test('Should have all candidates and their data', () => {
  const entityData = parseEntityTree(data.entities)
    .filter((d) => d.type === ENTITY_TYPE.Candidate);
  entityData.forEach((objData) => {
    const obj = root.getEntity(ENTITY_TYPE.Candidate, objData.id);
    expect(obj.id).toBe(objData.id);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `instanceof` checks | `objectType` property + type guards | Commit 87efe19a | All type checking uses type guards; never instanceof |
| Direct object construction | DataRoot provision methods only | Package design | Objects must belong to a DataRoot |
| Flat barrel exports | `internal.ts` ordered barrel | Package design | Eliminates circular dependency issues |
| Raw value comparisons | `MISSING_VALUE` sentinel + `isMissingValue()` | Package design | Clean separation of data-missing vs matching-missing |

## Open Questions

1. **SKILL.md Description -- Keep or Refine?**
   - What we know: Phase 16 created a well-crafted description that triggers on `packages/data/` work, entity types, question types, etc.
   - What's unclear: Whether the description needs adjustment after body content is written.
   - Recommendation: Keep the Phase 16 description as-is. Refine only if Phase 21 testing reveals triggering issues.

2. **Reference File Naming Convention**
   - What we know: Phase 16 research proposed `object-model.md`, `type-reference.md`, `conventions.md`. Architecture research proposed similar.
   - What's unclear: Whether `type-reference.md` is needed as a separate file or can be merged into `object-model.md`.
   - Recommendation: Use 2 reference files (`object-model.md`, `extension-patterns.md`) not 3. Conventions go in SKILL.md body. Type reference goes in object-model.md.

3. **Cross-Package Interface Documentation**
   - What we know: Data package questions implement `MatchableQuestion` from `@openvaa/core`. Entities implement `HasAnswers` and `CoreEntity`.
   - What's unclear: How much `@openvaa/core` interface detail belongs in the data skill vs the matching skill.
   - Recommendation: Data skill documents what it implements (MatchableQuestion interface contract). Matching skill documents how it consumes. Brief cross-reference in each per BOUNDARIES.md gray zone resolution.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^2.1.8 |
| Config file | Uses workspace root vitest.config via `@openvaa/shared-config` |
| Quick run command | `cd packages/data && yarn test:unit` |
| Full suite command | `yarn test:unit` (root level, all packages) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | SKILL.md has description that triggers correctly | manual-only | N/A -- skill triggering verified via Claude conversation | N/A |
| DATA-02 | Data model conventions are actionable rules | manual-only | N/A -- verify by reviewing skill content against source code | N/A |
| DATA-03 | Extension patterns guide through adding types | manual-only | N/A -- verify by following the guide on a hypothetical new type | N/A |
| DATA-04 | Review checklist catches real issues | manual-only | N/A -- verify by reviewing sample PRs with checklist | N/A |
| DATA-05 | Reference files contain accurate type hierarchies | manual-only | N/A -- verify by cross-referencing with actual source code | N/A |

**Note:** All DATA requirements are documentation/skill content -- there is no code to test with automated commands. Validation is by manual review of accuracy against the actual codebase. The Phase 21 quality phase (QUAL-01, QUAL-02) will validate skill triggering and cross-cutting scenarios.

### Sampling Rate
- **Per task commit:** Visual inspection that SKILL.md and reference files are well-formed Markdown
- **Per wave merge:** Cross-reference all file paths and type names mentioned in skill against actual codebase
- **Phase gate:** All 5 DATA requirements verified against source code before `/gsd:verify-work`

### Wave 0 Gaps
None -- this phase creates documentation files, not code. No test infrastructure needed.

## Sources

### Primary (HIGH confidence)
- Direct source code analysis of `packages/data/src/` -- all 120+ TypeScript files read and analyzed
  - `root/dataRoot.ts` (~897 lines) -- DataRoot class, provision methods, formatters, collection getters
  - `core/dataObject.ts` -- Abstract DataObject base class, smart defaults
  - `core/updatable.ts` -- Updatable base class, transaction system
  - `core/objectTypes.ts` -- OBJECT_TYPE const, ObjectTypeMap
  - `objects/entities/base/entity.ts` -- Entity base class
  - `objects/entities/base/entityTypes.ts` -- ENTITY_TYPE const
  - `objects/entities/variants/candidate.ts` -- Canonical entity variant pattern
  - `objects/entities/variants/variants.ts` -- EntityVariant type map, parseEntityTree
  - `objects/questions/base/question.ts` -- Question base class, MatchableQuestion implementation
  - `objects/questions/base/questionTypes.ts` -- QUESTION_TYPE hierarchy
  - `objects/questions/variants/variants.ts` -- createQuestion factory, QUESTION_VARIANT map
  - `objects/questions/variants/singleChoiceOrdinalQuestion.ts` -- normalizeValue pattern (ordinal)
  - `objects/questions/variants/singleChoiceCategoricalQuestion.ts` -- normalizeValue pattern (categorical with subdimensions)
  - `objects/nominations/base/nomination.ts` -- Nomination base class, parent nomination linking
  - `utils/typeGuards.ts` -- Type guard pattern (objectType-based, no instanceof)
  - `internal.ts` -- Barrel pattern, export ordering
  - `index.ts` -- Public API, type/value separation
  - `i18n/localized.ts` -- LocalizedValue type, TRANSLATIONS_KEY
  - `i18n/translate.ts` -- translate() function with 3-tier fallback
- `.planning/research/FEATURES.md` -- Data skill feature requirements from initial research
- `.planning/research/ARCHITECTURE.md` -- Skill architecture patterns, progressive disclosure model
- `.planning/research/PITFALLS.md` -- 14 domain pitfalls, including internal.ts, instanceof, context overload
- `.claude/skills/BOUNDARIES.md` -- Skill ownership map, gray zone resolutions
- `.claude/skills/data/SKILL.md` -- Existing stub with description from Phase 16

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` -- Skill file format, frontmatter fields, discovery mechanism
- `.planning/research/SUMMARY.md` -- Research summary and phase ordering rationale
- Phase 16 completed deliverables -- Established patterns for SKILL.md format and directory structure

### Tertiary (LOW confidence)
- None. All findings are from direct codebase analysis (HIGH confidence).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No dependencies; pure Markdown files following established Phase 16 patterns
- Architecture: HIGH -- Package structure, patterns, and conventions verified by reading every source file
- Pitfalls: HIGH -- All pitfalls derived from actual codebase patterns and conventions verified in source code
- Extension patterns: HIGH -- File-by-file change lists verified by tracing existing entity/question implementations

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (90 days -- data package is stable; conventions change rarely)
