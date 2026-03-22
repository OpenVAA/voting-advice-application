# Phase 18: Matching Skill - Research

**Researched:** 2026-03-15
**Domain:** Claude Code skill authoring for @openvaa/matching package domain expertise
**Confidence:** HIGH

## Summary

Phase 18 creates the domain-expert skill for `@openvaa/matching` -- the algorithm package that computes voter-candidate match scores. The package is mathematically precise with well-defined extension points: 29 source files across 6 modules (algorithms, distance, match, missingValue, question, space). It depends only on `@openvaa/core` for shared interfaces (`MatchableQuestion`, `HasAnswers`, `COORDINATE`, `MISSING_VALUE`), making it self-contained algorithmically.

The Phase 16 scaffolding is complete: `.claude/skills/matching/SKILL.md` exists with a well-crafted description and placeholder body. Phase 18 replaces the placeholder with actionable content and creates supporting reference files. The skill follows the established architecture pattern of progressive disclosure: a lean SKILL.md (<200 lines) containing conventions, decision rules, and review checklist, with supporting reference files containing detailed algorithm mechanics, question type documentation, and extension step-by-step guides.

The primary challenge is encoding the mathematical nuances accurately: CategoricalQuestion's multi-dimensional model (N subdimensions for N>2 choices, limited disagreement range of [0, 2/n]), weight compensation strategies, the kernel/sum/subdimWeight abstraction in the `distance()` function, and the asymmetric nature of missing value imputation. The skill must make Claude a matching expert who can implement new distance metrics, add new question types for matching, and understand why certain design choices exist.

**Primary recommendation:** Build the skill in 2 plans: (1) SKILL.md with core conventions, review checklist, and key source locations; (2) two reference files -- `algorithm-reference.md` (distance metrics, MatchingSpace, Position, measurement pipeline) and `extension-patterns.md` (step-by-step guides for adding distance metrics and question types).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MATC-01 | SKILL.md with description that auto-triggers on @openvaa/matching work | Existing stub has description from Phase 16. Body needs conventions, decision rules, review checklist, and reference pointers. Pattern established by Phase 17 data skill. |
| MATC-02 | Algorithm conventions documented as actionable rules | Research identifies 8 core conventions: distance normalization to [0, COORDINATE.Extent], Position immutability after imputation, MatchingSpace from questions, MISSING_VALUE handling asymmetry, type guards over instanceof, kernel/sum/subdimWeight abstraction, coordinate range [-0.5, 0.5], and test placement in tests/ directory. |
| MATC-03 | Extension patterns for adding new matching algorithms or distance metrics | Research maps the exact changes needed: new distance metric requires implementing MetricFunction signature with kernel/sum/subdimWeight and adding to DISTANCE_METRIC const. New question type requires implementing MatchableQuestion interface (normalizedDimensions + normalizeValue). |
| MATC-04 | Mathematical nuances documented (CategoricalQuestion multi-dimensional model, weight compensation) | Research documents: CategoricalQuestion creates N subdimensions for N>2 choices, binary uses 1 dimension; max disagreement is 2/n; weight compensation n/2 corrects relative weighting but not isolated range; directional distance formula from Mendez 2017; Euclidean subdimWeight uses sqrt for equal max distances across shapes. |
| MATC-05 | Reference files for matching paradigm and Match object structure | Research maps: Match extends MatchBase (distance, score, matchFraction, toString); SubMatch extends MatchBase with questionGroup; MATCH_TYPE discriminator; matchFraction = (Extent - distance) / Extent; score = round(matchFraction * 100). |
</phase_requirements>

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| SKILL.md (YAML + Markdown) | Agent Skills Spec 1.0 | Skill definition file | Required format; Phase 16/17 established the pattern |
| Reference Markdown files | N/A | Detailed reference material loaded on demand | Progressive disclosure; keeps SKILL.md lean |

### Supporting
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| Vitest | ^2.1.8 | Unit test framework for matching package | Verification of skill-guided changes |

No npm packages needed for skill authoring. The skill is pure Markdown content.

**Installation:** N/A -- skill files are created manually.

## Architecture Patterns

### Recommended Skill File Structure
```
.claude/skills/matching/
  SKILL.md                # Core: conventions, review checklist, key source locations (~130 lines body)
  algorithm-reference.md  # Reference: distance metrics, MatchingSpace, Position, measurement pipeline (~250 lines)
  extension-patterns.md   # Reference: step-by-step guides for adding metrics and question types (~200 lines)
```

### Pattern 1: Matching Package Source Organization
**What:** The `@openvaa/matching` package uses a module-per-concern structure with blob re-exports.
**When to document:** SKILL.md must teach this so Claude navigates the codebase correctly.

```
packages/matching/src/
  index.ts                         # Public API -- blob re-exports from all modules
  algorithms/
    index.ts                       # Module barrel
    matchingAlgorithm.ts           # Central MatchingAlgorithm class
    matchingAlgorithm.type.ts      # MatchingAlgorithmOptions, MatchingOptions
    matchingSpaceProjector.ts      # MatchingSpaceProjector interface (future)
  distance/
    index.ts                       # Module barrel
    metric.ts                      # DISTANCE_METRIC const, manhattan/directional/euclidean functions
    measure.ts                     # measureDistance() -- impute + metric orchestration
    measure.type.ts                # DistanceMeasurementOptions, GlobalAndSubspaceDistances
  match/
    index.ts                       # Module barrel
    matchBase.ts                   # MatchBase class (distance, score, matchFraction)
    match.ts                       # Match<TTarget, TGroup> extends MatchBase
    subMatch.ts                    # SubMatch<TGroup> extends MatchBase
    matchTypes.ts                  # MATCH_TYPE const, MatchType, MatchTypeMap
  missingValue/
    index.ts                       # Module barrel
    missingValueMethod.ts          # MISSING_VALUE_METHOD const (Neutral, RelativeMaximum)
    impute.ts                      # imputeMissingValue(), imputeMissingPosition()
    bias.ts                        # MISSING_VALUE_BIAS const (Positive, Negative)
  question/
    index.ts                       # Module barrel
    ordinalQuestion.ts             # OrdinalQuestion (Likert) -- normalizedDimensions=1
    categoricalQuestion.ts         # CategoricalQuestion -- N subdimensions for N>2 choices
    matchableQuestionGroup.ts      # MatchableQuestionGroup interface
  space/
    index.ts                       # Module barrel
    matchingSpace.ts               # MatchingSpace class (shape, weights, fromQuestions)
    position.ts                    # Position class (coordinates in a MatchingSpace)
    shape.ts                       # Shape type, flatten(), reshape(), coordinatesShape()
    createSubspace.ts              # createSubspace() for SubMatch computation
  utils/
    index.ts                       # Module barrel
    typeGuards.ts                  # isMatch(), isSubMatch(), isMatchBase(), isMatchType()
```

**Key differences from @openvaa/data:** No internal.ts barrel (smaller package, no circular dependency issues). Uses blob `export *` in module index files. Test files in `tests/` directory (not co-located).

### Pattern 2: The Matching Pipeline
**What:** The core algorithm flow: answers -> MatchingSpace -> Positions -> impute missing -> distance measurement -> Match objects.
**When to document:** This is the conceptual heart of the skill.

**Pipeline steps:**
1. `MatchingAlgorithm.match()` receives questions, reference (voter), targets (candidates)
2. Filters questions to only those the reference has answered (non-MISSING_VALUE)
3. Creates MatchingSpace via `MatchingSpace.fromQuestions()` -- shape from `normalizedDimensions`, weights from `questionWeights`
4. Projects all entities to Positions by calling `question.normalizeValue(answer)` for each question
5. Optionally applies `MatchingSpaceProjector` (for 2D political compass projections)
6. For each target, calls `measureDistance()`:
   a. `imputeMissingPosition()` replaces MISSING_VALUE coordinates in target based on reference
   b. Distance metric function computes normalized distance
7. Wraps results in `Match<TTarget>` objects with optional `SubMatch` array
8. Sorts matches by ascending distance (best match first)

### Pattern 3: Distance Metric Abstraction
**What:** All distance metrics decompose into `kernel`, `sum`, and `subdimWeight` functions passed to the generic `distance()` function.
**When to document:** Critical for implementing new metrics.

**Decomposition:**
- `kernel(a, b)` -- computes per-coordinate distance (absoluteKernel for Manhattan/Euclidean, directionalKernel for Directional)
- `sum(values)` -- aggregates dimension distances (basicSum for Manhattan/Directional, euclideanSum for Euclidean)
- `subdimWeight(n)` -- weight factor for subdimensions (basicDivision=1/n for Manhattan/Directional, 1/sqrt(n) for Euclidean)

**Normalization:** The `distance()` function normalizes by dividing the weighted distance sum by the maximum possible weighted distance sum, then scales by `COORDINATE.Extent`. Result range: `[0, COORDINATE.Extent]` (i.e., `[0, 1]`).

### Pattern 4: CategoricalQuestion Multi-Dimensional Model
**What:** CategoricalQuestion with N>2 choices creates N subdimensions. Selected choice gets `COORDINATE.Max`, others get `COORDINATE.Min`. Binary (N=2) uses a single dimension.
**When to document:** Most mathematically subtle part of the package.

**Implications:**
- Maximum disagreement distance is `2/n` (not `1`), because agreeing on "not X" for N-2 other choices counts as partial agreement
- Example (3 choices): A="red", B="blue" -> distances [1, 1, 0] -> agreement on "not green"
- Weight compensation: multiply question weight by `n/2` to correct relative weighting vs ordinal questions
- But: isolated categorical distance still caps at `2/n` even with weight compensation, because post-computation normalization uses max possible distance

### Pattern 5: Missing Value Asymmetry
**What:** Missing value imputation is asymmetric -- reference (voter) missing values are SKIPPED (question excluded), while target (candidate) missing values are IMPUTED.
**When to document:** Common source of confusion.

**Methods:**
- `MISSING_VALUE_METHOD.Neutral`: impute `COORDINATE.Neutral` (0) -- the middle answer
- `MISSING_VALUE_METHOD.RelativeMaximum`: impute the furthest possible value from the reference coordinate
  - If reference is `COORDINATE.Min` (-0.5), impute `COORDINATE.Max` (0.5)
  - If reference is `COORDINATE.Neutral` (0), use `MISSING_VALUE_BIAS` to choose direction
- `imputeMissingPosition()` creates a NEW Position -- never mutates the original

### Pattern 6: Match Object Type System
**What:** `MatchBase` -> `Match<TTarget, TGroup>` and `SubMatch<TGroup>`. Uses `MATCH_TYPE` discriminator instead of `instanceof`. Type guards: `isMatch()`, `isSubMatch()`, `isMatchBase()`, `isMatchType()`.
**When to document:** Same as data package convention.

**Score conversion:**
- `distance` is `[0, COORDINATE.Extent]` (0 = perfect match, 1 = worst match)
- `matchFraction = (COORDINATE.Extent - distance) / COORDINATE.Extent` (0 = worst, 1 = best)
- `score = Math.round(matchFraction * MatchBase.multiplier)` (0 = worst, 100 = best by default)

### Anti-Patterns to Avoid
- **Modifying MatchingAlgorithm for app-specific logic:** The algorithm is generic by design. Customize via constructor options and question implementations.
- **Assuming categorical distance reaches 100% disagreement:** Math limits to `[0, 2/n]`. Document the limitation and suggest weight compensation.
- **Using raw distance for display:** Always convert via `score` getter or `matchFraction`. Distance is inverted (low = good).
- **Ignoring normalizedDimensions:** Array length from `normalizeValue()` MUST match `normalizedDimensions` getter. Mismatch causes shape errors.
- **Mutating Position coordinates after creation:** Positions should be treated as immutable after imputation.
- **Using instanceof for Match type checking:** Use `isMatch()`, `isSubMatch()`, `isMatchType()` from `utils/typeGuards.ts`.
- **Switching reference and target in measureDistance:** Result changes because missing value imputation is asymmetric. Reference = voter, target = candidate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Distance measurement | Custom distance loops | `measureDistance()` from `distance/measure.ts` | Handles imputation, subspaces, normalization correctly |
| Missing value handling | Custom null checks | `imputeMissingPosition()` + `MISSING_VALUE_METHOD` | Imputation is asymmetric and method-dependent |
| Question space creation | Manual dimension counting | `MatchingSpace.fromQuestions()` | Handles normalizedDimensions and weights correctly |
| Subspace matching | Filtering questions per category | `createSubspace()` from `space/createSubspace.ts` | Creates zero-weight masking correctly |
| Score display | Manual `1 - distance` | `Match.score` or `Match.matchFraction` | Handles COORDINATE.Extent normalization |
| Type checking matches | `instanceof Match` | `isMatch()`, `isSubMatch()` from `utils/typeGuards.ts` | Avoids cross-module instanceof issues |

## Common Pitfalls

### Pitfall 1: CategoricalQuestion Weight Undercount
**What goes wrong:** A categorical question with 4 choices has maximum disagreement of `2/4 = 0.5`, meaning it contributes less to total distance than an ordinal question at full disagreement.
**Why it happens:** The multi-dimensional model inherently limits disagreement because non-selected choices still "agree" on absence.
**How to avoid:** Apply weight compensation `n/2` when mixing categorical and ordinal questions. Document in matching options that this is a conscious trade-off.
**Warning signs:** Categorical questions seeming to "matter less" in match scores compared to ordinal questions.

### Pitfall 2: Directional Distance Counterintuition
**What goes wrong:** Two entities with identical answers of 3/5 (neutral) get only 50% agreement with directional distance, not 100%.
**Why it happens:** Directional distance treats neutral as "uncertain" -- the formula `0.5 * Extent - (2 * (a - Neutral) * (b - Neutral)) / Extent` yields `0.5 * Extent` when either value is neutral.
**How to avoid:** Use Manhattan for standard VAA matching. Use Directional only when the "uncertain neutral" semantic is desired. Reference: Mendez (2017, p. 51).
**Warning signs:** Neutral-neutral pairs showing 50% match instead of 100%.

### Pitfall 3: Reference vs Target Confusion in Missing Values
**What goes wrong:** Swapping reference and target in `measureDistance()` changes results because imputation depends on reference coordinates.
**Why it happens:** The function signature takes `reference` and `target` as named params, but they're both `Position` objects.
**How to avoid:** Always pass voter as `reference`, candidate as `target`. The `MatchingAlgorithm.match()` method handles this automatically.
**Warning signs:** Match scores changing depending on who is the "voter" vs "candidate".

### Pitfall 4: Subdimension Shape Mismatch
**What goes wrong:** `normalizeValue()` returns an array of length N but `normalizedDimensions` is set to M (or undefined/1).
**Why it happens:** Forgetting to update `normalizedDimensions` when changing `normalizeValue()` return type.
**How to avoid:** Always keep `normalizedDimensions` in sync with `normalizeValue()` return array length. For single values, `normalizedDimensions` should be `1` or `undefined`.
**Warning signs:** "The shape of coordinates and space are incompatible" error from Position constructor.

### Pitfall 5: Forgetting SubMatch Zero-Weight Masking
**What goes wrong:** SubMatch for a category with no overlap to the matched questions returns `COORDINATE.Extent / 2` (50% match), not an error.
**Why it happens:** `createSubspace()` sets weights to 0 for excluded questions. When ALL questions are excluded, `distance()` returns `COORDINATE.Extent / 2` as a fallback.
**How to avoid:** Understand that this is intentional behavior, not a bug. SubMatches for non-overlapping categories are simply neutral.
**Warning signs:** SubMatch scores of exactly 50% for certain categories.

### Pitfall 6: Test Files in Wrong Location
**What goes wrong:** Test files placed in `src/` instead of `tests/` directory, or test utilities placed outside `tests/utils.ts`.
**Why it happens:** Other packages (like @openvaa/data) co-locate tests. The matching package uses a separate `tests/` directory.
**How to avoid:** Always create test files in `packages/matching/tests/`. Import source via `../src/` paths.
**Warning signs:** Tests not found by Vitest configuration.

## Code Examples

### Creating a MatchingAlgorithm (from source: algorithms/matchingAlgorithm.ts)
```typescript
const algorithm = new MatchingAlgorithm({
  distanceMetric: DISTANCE_METRIC.Manhattan,
  missingValueOptions: { method: MISSING_VALUE_METHOD.RelativeMaximum }
});
const matches = algorithm.match({
  questions, reference: voter, targets: candidates,
  options: { questionGroups, questionWeights }
});
```

### CategoricalQuestion Normalization (from source: question/categoricalQuestion.ts)
```typescript
// Binary (2 choices): single dimension
// normalizeValue('no') -> COORDINATE.Min (-0.5)
// normalizeValue('yes') -> COORDINATE.Max (0.5)

// N>2 choices: N subdimensions
// 3 choices: normalizeValue('red') -> [COORDINATE.Max, COORDINATE.Min, COORDINATE.Min]
// Selected gets Max, others get Min
```

### Distance Metric Structure (from source: distance/metric.ts)
```typescript
// All metrics follow this pattern:
distance({
  a, b,                    // Position objects
  kernel: absoluteKernel,  // Per-coordinate distance function
  sum: basicSum,           // Aggregation function
  subdimWeight: basicDivision, // Subdimension weight factor
  space, allowMissing      // Optional params
});
```

### Frontend Integration (from source: frontend/src/lib/contexts/voter/matchStore.ts)
```typescript
// The frontend voterContext creates the algorithm with Manhattan + RelativeMaximum
// matchStore computes matches per election per entity type
// Question categories become questionGroups for SubMatch computation
// Organization matching may use imputeParentAnswers for parent entity scores
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline distance formulas | kernel/sum/subdimWeight decomposition | Package design | Extensible metric system |
| No missing value handling | Asymmetric imputation (Neutral, RelativeMaximum) | Package design | Handles real-world incomplete data |
| Single dimension per question | subdimensions via normalizedDimensions | Package design | Supports categorical, preference order |
| instanceof for Match types | MATCH_TYPE discriminator + type guards | Package design | Same as data package convention |

## Open Questions

1. **Reference File Naming**
   - What we know: Phase 16 research proposed `algorithm-reference.md`, `question-types.md`, `integration-guide.md`.
   - What's unclear: Whether 3 reference files are needed or 2 suffice.
   - Recommendation: Use 2 reference files (`algorithm-reference.md`, `extension-patterns.md`). Question type details go in algorithm-reference. Integration guide content is brief enough for SKILL.md's cross-package section.

2. **MatchingSpaceProjector Documentation**
   - What we know: The interface exists but is marked "for future implementation." No concrete implementation exists.
   - What's unclear: How much to document about projections.
   - Recommendation: Document the interface briefly (it's 3 lines). Note that it enables 2D political compass projections. Do not fabricate implementation details.

3. **Frontend Integration Depth**
   - What we know: `matchStore.ts`, `voterContext.ts` use the matching package. `imputeParentAnswers` is a frontend utility.
   - What's unclear: How much frontend integration detail belongs in matching skill vs architect skill.
   - Recommendation: Brief inline explanation in SKILL.md per BOUNDARIES.md. Matching skill documents the algorithm; architect skill documents how the frontend wires it.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual review (documentation-only phase) |
| Config file | N/A -- no code tests needed |
| Quick run command | `cat .claude/skills/matching/SKILL.md \| wc -l` |
| Full suite command | `ls -la .claude/skills/matching/` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MATC-01 | SKILL.md has description that triggers correctly | manual-only | N/A -- skill triggering verified via Claude conversation | N/A |
| MATC-02 | Algorithm conventions are actionable rules | manual-only | N/A -- verify by reviewing skill content against source code | N/A |
| MATC-03 | Extension patterns guide through adding metrics/question types | manual-only | N/A -- verify by following the guide on a hypothetical new metric | N/A |
| MATC-04 | Mathematical nuances accurately documented | manual-only | N/A -- verify by cross-referencing formulas with source code | N/A |
| MATC-05 | Reference files contain accurate paradigm and Match structure | manual-only | N/A -- verify by cross-referencing with actual source code | N/A |

**Note:** All MATC requirements are documentation/skill content -- there is no code to test with automated commands. Validation is by manual review of accuracy against the actual codebase. The Phase 21 quality phase (QUAL-01, QUAL-02) will validate skill triggering and cross-cutting scenarios.

### Sampling Rate
- **Per task commit:** Visual inspection that SKILL.md and reference files are well-formed Markdown
- **Per wave merge:** Cross-reference all file paths, formulas, and type names against actual codebase
- **Phase gate:** All 5 MATC requirements verified against source code before `/gsd:verify-work`

### Wave 0 Gaps
None -- this phase creates documentation files, not code. No test infrastructure needed.

## Sources

### Primary (HIGH confidence)
- Direct source code analysis of `packages/matching/src/` -- all 29 TypeScript source files read and analyzed
  - `algorithms/matchingAlgorithm.ts` (~155 lines) -- MatchingAlgorithm class, match() and projectToNormalizedSpace()
  - `algorithms/matchingAlgorithm.type.ts` -- MatchingAlgorithmOptions, MatchingOptions interfaces
  - `algorithms/matchingSpaceProjector.ts` -- MatchingSpaceProjector interface (future)
  - `distance/metric.ts` (~250 lines) -- DISTANCE_METRIC const, manhattan/directional/euclidean distance functions, kernel/sum/subdimWeight decomposition
  - `distance/measure.ts` (~75 lines) -- measureDistance() with imputation + subspace handling
  - `distance/measure.type.ts` -- DistanceMeasurementOptions, GlobalAndSubspaceDistances
  - `space/matchingSpace.ts` (~65 lines) -- MatchingSpace class (shape, weights, fromQuestions factory)
  - `space/position.ts` -- Position class (coordinates in MatchingSpace)
  - `space/shape.ts` -- Shape type, flatten(), reshape(), coordinatesShape(), equalShapes()
  - `space/createSubspace.ts` -- createSubspace() for zero-weight masking
  - `question/ordinalQuestion.ts` -- OrdinalQuestion (Likert) with normalizedDimensions=1
  - `question/categoricalQuestion.ts` -- CategoricalQuestion with N subdimensions
  - `question/matchableQuestionGroup.ts` -- MatchableQuestionGroup interface
  - `missingValue/missingValueMethod.ts` -- MISSING_VALUE_METHOD const (Neutral, RelativeMaximum)
  - `missingValue/impute.ts` -- imputeMissingValue(), imputeMissingPosition()
  - `missingValue/bias.ts` -- MISSING_VALUE_BIAS const (Positive, Negative)
  - `match/matchBase.ts` -- MatchBase class (distance, score, matchFraction, toString)
  - `match/match.ts` -- Match<TTarget, TGroup> extends MatchBase
  - `match/subMatch.ts` -- SubMatch<TGroup> extends MatchBase
  - `match/matchTypes.ts` -- MATCH_TYPE const, MatchType, MatchTypeMap
  - `utils/typeGuards.ts` -- isMatch(), isSubMatch(), isMatchBase(), isMatchType()
- Direct source code analysis of `packages/core/src/matching/` -- all shared interfaces
  - `matchableQuestion.type.ts` -- MatchableQuestion interface (id, normalizedDimensions, normalizeValue)
  - `hasAnswers.type.ts` -- HasAnswers interface (answers: AnswerDict)
  - `distance.type.ts` -- CoordinateOrMissing, Coordinate, NormalizedDistance types
  - `distance.ts` -- COORDINATE const, normalizeCoordinate(), assertCoordinate(), assertDistance()
  - `missingValue.ts` -- MISSING_VALUE const, isMissingValue(), isEmptyValue()
- Direct source code analysis of `packages/matching/tests/` -- all 5 test files
  - `algorithms.test.ts` -- Full algorithm integration tests including missing values, submatches, mixed question types, weights
  - `distance.test.ts` -- Kernel tests, metric-specific tests with subdimensions and weights
  - `question.test.ts` -- CategoricalQuestion (binary + multi) and OrdinalQuestion normalization tests
  - `missingValue.test.ts` -- Imputation method tests
  - `space.test.ts` -- MatchingSpace, Position, shape tests
- `packages/matching/README.md` -- Authoritative documentation with paradigm, principles, process description
- `frontend/src/lib/contexts/voter/matchStore.ts` -- Frontend integration point
- `.planning/research/FEATURES.md` -- Matching skill feature requirements from initial research
- `.planning/research/ARCHITECTURE.md` -- Skill architecture patterns, progressive disclosure model
- `.claude/skills/BOUNDARIES.md` -- Skill ownership map, gray zone resolutions
- `.claude/skills/matching/SKILL.md` -- Existing stub with description from Phase 16

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` -- Skill file format, frontmatter fields, discovery mechanism
- `.planning/research/SUMMARY.md` -- Research summary and phase ordering rationale
- Phase 17 completed plans -- Established patterns for skill plan structure

### Tertiary (LOW confidence)
- None. All findings are from direct codebase analysis (HIGH confidence).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No dependencies; pure Markdown files following established Phase 16/17 patterns
- Architecture: HIGH -- Package structure, all 29 source files, and all 5 test files read and analyzed
- Pitfalls: HIGH -- All pitfalls derived from actual codebase patterns, mathematical proofs, and test expectations
- Extension patterns: HIGH -- MetricFunction signature and MatchableQuestion interface verified from source code
- Mathematical nuances: HIGH -- CategoricalQuestion subdimension model, directional formula, weight compensation all verified from source + tests

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (90 days -- matching package is mathematically stable; conventions change rarely)
