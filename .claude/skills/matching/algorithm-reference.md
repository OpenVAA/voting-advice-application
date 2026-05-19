# Matching Algorithm Reference

Detailed reference for the `@openvaa/matching` algorithm internals. For paradigm and process overview, read `packages/matching/README.md`.

## Matching Pipeline

The full pipeline that `MatchingAlgorithm.match()` follows (source: `algorithms/matchingAlgorithm.ts`):

1. **Receive inputs:** questions (`MatchableQuestion[]`), reference entity (voter), targets array (candidates), and optional `MatchingOptions` (questionGroups, questionWeights).
2. **Validate:** Throw if questions or targets are empty, or if duplicate question ids exist.
3. **Filter questions:** Keep only questions where the reference has a non-`MISSING_VALUE` answer. If none remain, throw. This means the reference's unanswered questions are excluded entirely -- they never reach distance measurement.
4. **Create MatchingSpace:** Call `MatchingSpace.fromQuestions(questions, questionWeights?)`. The space's shape is derived from each question's `normalizedDimensions` (1 for ordinal, N for categorical with N>2 choices). Weights default to 1 for all dimensions.
5. **Project to positions:** For each entity (reference + all targets), iterate over filtered questions. Call `question.normalizeValue(entity.answers[question.id]?.value)` for each. The results are assembled into `PositionCoordinates` (flat or nested arrays) and wrapped in `Position` objects bound to the MatchingSpace.
6. **Optional projection:** If a `MatchingSpaceProjector` was provided, call `projector.project(positions)` to transform all Positions to a lower-dimensional space (e.g., 2D political compass). The projector returns new Positions in a new MatchingSpace.
7. **Measure distances:** For each target, call `measureDistance(reference, target, options, subspaces?)`:
   - a. `imputeMissingPosition()` replaces `MISSING_VALUE` coordinates in the target based on reference coordinates and the chosen imputation method. Creates a new Position -- never mutates the original.
   - b. The distance metric function computes the normalized global distance between reference and imputed target.
   - c. If `questionGroups` were provided, compute SubMatch distances using `createSubspace()` for each group. Subspaces are MatchingSpaces where excluded questions have weight 0.
8. **Create Match objects:** Wrap each result in a `Match<TTarget>` containing: the target entity reference, global distance, and optional `subMatches` array of `SubMatch<TGroup>` objects.
9. **Sort and return:** Sort matches by ascending distance (best match = lowest distance = first in array).

## Distance Metrics

All built-in metrics decompose into three pluggable functions passed to the generic `distance()` function (source: `distance/metric.ts`).

### Generic distance() function

The `distance()` function computes a normalized distance between two Positions:

1. Flatten both Positions' coordinates into flat arrays
2. Compute effective weights: for each dimension, multiply the dimension weight by `subdimWeight(numSubdims)` for each subdimension within that dimension
3. For each coordinate pair: `weightedDistance = weight * kernel(a_coord, b_coord)`
4. Aggregate all weighted distances via `sum(distances)` to get the total distance
5. Compute the maximum possible distance: `sum(weights)` (since kernel max output is `COORDINATE.Extent` = 1, and weights already factor in subdimWeight)
6. Normalize: `result = (COORDINATE.Extent * distance) / maximum`
7. Edge case: if maximum is 0 (all dimensions have zero weight), return `COORDINATE.Extent / 2` (50%)

Result range: `[0, COORDINATE.Extent]` i.e. `[0, 1]`.

Dimensions where either coordinate is `MISSING_VALUE` are skipped when `allowMissing` is true, otherwise an error is thrown.

### Manhattan (`DISTANCE_METRIC.Manhattan`)

- **kernel:** `absoluteKernel(a, b)` = `Math.abs(a - b)` -- range `[0, Extent]`
- **sum:** `basicSum(values)` = simple addition via `reduce`
- **subdimWeight:** `basicDivision(n)` = `1 / n`
- **Behavior:** Standard absolute difference. Two identical answers produce distance 0. Opposite extremes (Min vs Max) produce distance `COORDINATE.Extent`. Most commonly used metric in VAAs.

### Directional (`DISTANCE_METRIC.Directional`)

- **kernel:** `directionalKernel(a, b)` = `0.5 * Extent - (2 * (a - Neutral) * (b - Neutral)) / Extent`
- **sum:** `basicSum(values)` = simple addition
- **subdimWeight:** `basicDivision(n)` = `1 / n`
- **Behavior:** Treats neutral (0) as "uncertain." Two identical neutral answers yield distance `0.5 * Extent` (50% disagreement), not 0. Two identical non-neutral answers yield 0. Maximum agreement requires both answers at the same extreme. Reference: Mendez (2017, p. 51).
- **Implication:** The maximum achievable agreement is less than 100% whenever either entity has answers that are not at the extremes.

### Euclidean (`DISTANCE_METRIC.Euclidean`)

- **kernel:** `absoluteKernel(a, b)` = `Math.abs(a - b)` -- same as Manhattan
- **sum:** `euclideanSum(values)` = `Math.sqrt(sum of squares)` -- geometric aggregation
- **subdimWeight:** `euclideanSubdimWeight(n)` = `1 / Math.sqrt(n)` -- ensures equal max distances across dimensions with different numbers of subdimensions
- **Behavior:** Geometric distance. More sensitive to large single-dimension differences than Manhattan. A single large disagreement weighs more heavily than several small disagreements.

### Metric function signature

All metric functions share the `MetricFunction` type:

```ts
(params: { a: Position; b: Position; space?: MatchingSpace; allowMissing?: boolean }) => NormalizedDistance
```

The optional `space` parameter allows measuring distance in a different MatchingSpace (used for SubMatch subspaces). Defaults to `a.space`.

## MatchingSpace and Position

### MatchingSpace (source: `space/matchingSpace.ts`)

- `shape: Shape` -- array of numbers where each element is the number of subdimensions for that question. `OrdinalQuestion` contributes `1`, `CategoricalQuestion` with N>2 choices contributes `N`, binary CategoricalQuestion contributes `1`.
- `weights: number[]` -- array (same length as shape), default all `1`. Set via `questionWeights` option in `MatchingOptions`.
- `fromQuestions(questions, weights?)` -- static factory that builds shape from `question.normalizedDimensions` (defaulting to 1 if undefined) and validates weights length.
- `isCompatible(target)` -- checks shape equality between this space and another space, Position, or coordinates.

### Position (source: `space/position.ts`)

- Wraps `coordinates: PositionCoordinates` (flat or nested `CoordinateOrMissing` arrays) within a MatchingSpace.
- Constructor validates that `coordinatesShape(coordinates)` equals `space.shape`. Throws "The shape of coordinates and space are incompatible" on mismatch.
- `MISSING_VALUE` coordinates are valid in a Position -- they are imputed later during distance measurement.
- `shape` getter derives the shape from coordinates on access.

### Shape utilities (source: `space/shape.ts`)

- `Shape` -- type alias for `Array<number>`
- `flatten(coordinates)` -- nested coordinate arrays to flat array
- `reshape({ flat, shape })` -- flat array to nested based on shape
- `coordinatesShape(coordinates)` -- infer shape from coordinate array structure
- `equalShapes(a, b)` -- compare two shapes element-by-element

### Subspace creation (source: `space/createSubspace.ts`)

`createSubspace({ questions, subset })` creates a MatchingSpace where questions NOT in the subset have weight 0. Used internally to compute SubMatch distances for question categories. The shape remains identical to the full space -- only weights change.

## Missing Value Imputation

Source: `missingValue/impute.ts`, `missingValue/missingValueMethod.ts`, `missingValue/bias.ts`

**Key asymmetry:** Reference (voter) missing values cause the question to be excluded entirely (step 3 of pipeline). Target (candidate) missing values are imputed during distance measurement. Swapping reference and target changes results.

### MISSING_VALUE_METHOD.Neutral

- Imputes `COORDINATE.Neutral` (0) for missing coordinates
- Assumes the candidate has a moderate/middle position
- Simple, non-punitive approach

### MISSING_VALUE_METHOD.RelativeMaximum

- Imputes the coordinate furthest from the reference's coordinate
- If reference is `COORDINATE.Min` (-0.5), impute `COORDINATE.Max` (0.5) and vice versa
- If reference is `COORDINATE.Neutral` (0), uses `MISSING_VALUE_BIAS` to choose direction:
  - `MISSING_VALUE_BIAS.Positive` (default) -- impute `COORDINATE.Max` (0.5)
  - `MISSING_VALUE_BIAS.Negative` -- impute `COORDINATE.Min` (-0.5)
- Worst-case assumption: maximizes distance for unanswered questions

### imputeMissingPosition()

- Creates a NEW Position with `MISSING_VALUE` coordinates replaced
- Never mutates the original Position
- If both reference and target coordinates are missing for a dimension, imputes `COORDINATE.Neutral`

## Match Object Structure

### MatchBase (source: `match/matchBase.ts`)

The base class for all matching results. Score conversion chain:

- `distance: NormalizedDistance` -- range `[0, COORDINATE.Extent]` i.e. `[0, 1]`. 0 = perfect match, 1 = worst match.
- `matchFraction` = `(COORDINATE.Extent - distance) / COORDINATE.Extent` -- range `[0, 1]`. 0 = worst, 1 = best. Inverts the distance.
- `score` = `Math.round(matchFraction * MatchBase.multiplier)` -- range `[0, 100]` with default multiplier of 100. 0 = worst, 100 = best.
- `toString()` returns `score + MatchBase.unitString` (e.g., `"85%"`)
- `MatchBase.multiplier` -- static, default 100. Override for different score scales.
- `MatchBase.unitString` -- static, default `'%'`.

### Match<TTarget, TGroup> (source: `match/match.ts`)

- Extends `MatchBase`, implements `MatchedEntity` from `@openvaa/core`
- `matchType` = `MATCH_TYPE.Match` (`'match'`)
- `target: TTarget` -- reference to the matched entity (candidate)
- `subMatches?: SubMatch<TGroup>[]` -- array of SubMatch objects (empty/undefined if no questionGroups provided)

### SubMatch<TGroup> (source: `match/subMatch.ts`)

- Extends `MatchBase`
- `matchType` = `MATCH_TYPE.SubMatch` (`'subMatch'`)
- `questionGroup: TGroup` -- reference to the `MatchableQuestionGroup` this submatch covers
- Distance is computed via `createSubspace()` which zeros weights for questions not in the group

### MATCH_TYPE discriminator (source: `match/matchTypes.ts`)

- `MATCH_TYPE.Match` = `'match'`
- `MATCH_TYPE.MatchBase` = `'matchBase'`
- `MATCH_TYPE.SubMatch` = `'subMatch'`
- Use type guards instead of `instanceof`: `isMatch(obj)`, `isSubMatch(obj)`, `isMatchBase(obj)`, `isMatchType(obj, type)` (source: `utils/typeGuards.ts`)

## Question Types (Matching Side)

These are standalone matching question implementations for testing and direct use. In production with `@openvaa/data`, question types come from `DataRoot` (e.g., `SingleChoiceOrdinalQuestion`, `SingleChoiceCategoricalQuestion`).

### OrdinalQuestion (source: `question/ordinalQuestion.ts`)

- For Likert-scale questions with ordered numeric choices
- `normalizedDimensions` = `1`
- `normalizeValue(value)`: Looks up the choice by id, then maps its numeric value to `[COORDINATE.Min, COORDINATE.Max]` via `normalizeCoordinate({ value, min, max })`
- Formula: `COORDINATE.Min + (value - min) / (max - min) * COORDINATE.Extent`
- Constructor: `{ id, values: { id, value }[] }` where `value` is the numeric score
- Convenience: `OrdinalQuestion.fromLikert({ id, scale })` creates a Likert question with choices `1..scale`
- Returns `MISSING_VALUE` for null/undefined values

### CategoricalQuestion (source: `question/categoricalQuestion.ts`)

- For nominal (unordered) questions with named choices
- **Binary (2 choices):** `normalizedDimensions` = `1`. First choice maps to `COORDINATE.Min`, second to `COORDINATE.Max`.
- **N>2 choices:** `normalizedDimensions` = `N`. Normalizes to one-hot style: selected choice = `COORDINATE.Max`, all others = `COORDINATE.Min`.
- Constructor: `{ id, values: { id }[] }`
- Maximum disagreement for N>2 is limited to `2/n` due to the multi-dimensional model (non-selected choices "agree" on absence). Weight compensation of `n/2` partially corrects this relative to ordinal questions.
- Returns `MISSING_VALUE` (single or array matching dimensions) for null/undefined values

### MatchableQuestionGroup (source: `question/matchableQuestionGroup.ts`)

- Interface: `{ questions: MatchableQuestion[] }`
- Used by `MatchingOptions.questionGroups` to define SubMatch categories (e.g., "Economy", "Environment")
- Each group's questions determine which dimensions are active in its subspace
