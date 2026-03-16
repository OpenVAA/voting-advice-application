---
name: matching
description: "Domain expert for the @openvaa/matching package -- generic matching algorithms for Voting Advice Applications. Understands MatchingAlgorithm, MatchingSpace, distance metrics (Manhattan, Euclidean, directional), position mapping, subdimension handling for categorical questions, missing value imputation, and Match/SubMatch result objects. Activate when working in packages/matching/, implementing distance metrics, debugging match scores, reviewing matching changes, or understanding how voter-candidate matching works."
---

# @openvaa/matching Package Expert

## Package Purpose

Generic matching algorithms for Voting Advice Applications. Computes voter-candidate match scores
by measuring distance in a normalized multidimensional space.

Pipeline: answers -> MatchingSpace -> Positions -> impute missing -> distance measurement -> Match
objects. Depends only on `@openvaa/core` for shared interfaces (`MatchableQuestion`, `HasAnswers`,
`COORDINATE`, `MISSING_VALUE`).

Read `packages/matching/README.md` for the paradigm explanation, design principles, and process
walkthrough.

## Conventions

1. **Distance normalization**: ALL distance metrics MUST normalize results to range
   `[0, COORDINATE.Extent]` (i.e., `[0, 1]`). The generic `distance()` function in
   `distance/metric.ts` normalizes by dividing the weighted distance sum by the maximum possible
   weighted distance sum, then scaling by `COORDINATE.Extent`. DO NOT return raw unnormalized
   distances from metrics.

2. **kernel/sum/subdimWeight decomposition**: ALL distance metrics decompose into three functions
   passed to the generic `distance()` function:
   - `kernel(a, b)` computes per-coordinate distance
   - `sum(values)` aggregates dimension distances
   - `subdimWeight(n)` provides weight factor for subdimensions
   Manhattan uses `absoluteKernel`/`basicSum`/`basicDivision`. Euclidean uses
   `absoluteKernel`/`euclideanSum`/`1/sqrt(n)`. Directional uses
   `directionalKernel`/`basicSum`/`basicDivision`. New metrics MUST follow this decomposition.

3. **COORDINATE range**: All normalized coordinates use the range `[-0.5, 0.5]` defined by
   `COORDINATE.Min` and `COORDINATE.Max` in `@openvaa/core`. `COORDINATE.Neutral` is `0`.
   `COORDINATE.Extent` is `1` (Max - Min). Import from `@openvaa/core`.

4. **Missing value asymmetry**: Reference (voter) missing values cause question EXCLUSION (question
   not matched). Target (candidate) missing values are IMPUTED via `imputeMissingPosition()`. NEVER
   swap reference and target -- results change because imputation depends on reference coordinates.
   Methods: `MISSING_VALUE_METHOD.Neutral` imputes `COORDINATE.Neutral` (0),
   `MISSING_VALUE_METHOD.RelativeMaximum` imputes the furthest coordinate from reference.

5. **Position immutability**: `imputeMissingPosition()` creates a NEW Position object -- NEVER
   mutates the original. Treat Position coordinates as immutable after creation. Source:
   `missingValue/impute.ts`.

6. **Type guards over instanceof**: NEVER use `instanceof` for Match type checking. Use `isMatch()`,
   `isSubMatch()`, `isMatchBase()`, `isMatchType()` from `utils/typeGuards.ts`. The `MATCH_TYPE`
   const in `match/matchTypes.ts` provides discriminator values. Same convention as @openvaa/data.

7. **Module barrel exports**: Each module directory has an `index.ts` that uses `export *` from all
   module files. The package `src/index.ts` re-exports all modules. No `internal.ts` barrel (unlike
   @openvaa/data -- smaller package, no circular dependency issues). Test files live in `tests/`
   directory (NOT co-located).

8. **MatchingSpace from questions**: ALWAYS construct MatchingSpace via
   `MatchingSpace.fromQuestions()` factory -- it correctly derives shape from
   `normalizedDimensions` and weights from `questionWeights`. NEVER manually construct shape arrays.
   Source: `space/matchingSpace.ts`.

## Mathematical Nuances

**CategoricalQuestion multi-dimensional model:**
- N>2 choices create N subdimensions. Selected choice gets `COORDINATE.Max` (+0.5), all others get
  `COORDINATE.Min` (-0.5). Binary (N=2) uses a single dimension.
- Geometric intuition: each choice is an axis; selecting one means being at the positive extreme on
  that axis and negative on all others.
- Maximum disagreement distance is `2/n` (not 1), because agreeing on "not X" for N-2 other choices
  counts as partial agreement. Example (3 choices): A="red", B="blue" -> distances [1, 1, 0] ->
  agreement on "not green".
- Weight compensation: multiply question weight by `n/2` to correct relative weighting vs ordinal
  questions. But isolated categorical distance still caps at `2/n` even with compensation, because
  post-computation normalization uses max possible distance.

**Directional distance:**
- Formula: `0.5 * Extent - (2 * (a - Neutral) * (b - Neutral)) / Extent` (Mendez 2017, p. 51).
- Treats neutral as "uncertain": two identical neutral answers yield 50% agreement, NOT 100%. Use
  Manhattan for standard matching; Directional only when "uncertain neutral" semantics are desired.

**Score conversion:**
- `distance` in `[0, COORDINATE.Extent]` where 0 = perfect match, 1 = worst match
- `matchFraction = (COORDINATE.Extent - distance) / COORDINATE.Extent` where 0 = worst, 1 = best
- `score = Math.round(matchFraction * MatchBase.multiplier)` where 0 = worst, 100 = best (default
  multiplier)

## Reviewing Matching Package Changes

1. `normalizedDimensions` getter matches `normalizeValue()` return array length -- mismatch causes
   "shape incompatible" errors in Position constructor
2. No `instanceof` checks for Match types -- use type guards from `utils/typeGuards.ts`
3. Distance metrics normalize to `[0, COORDINATE.Extent]` -- raw distances outside this range
   indicate a bug
4. Reference = voter, target = candidate in `measureDistance()` -- swapping changes results due to
   asymmetric imputation
5. New distance metrics decompose into kernel/sum/subdimWeight -- not implemented as monolithic
   functions
6. Test files placed in `packages/matching/tests/` (not co-located in `src/`) -- import source via
   `../src/`
7. Edge case verification: distance metrics produce consistent results for all-same answers
   (distance=0), all-opposite answers (distance=COORDINATE.Extent), and single-question matching
8. New question types correctly report `normalizedDimensions` -- wrong values cause silent scoring
   errors in the MatchingSpace shape

## Key Source Locations

- Entry point: `packages/matching/src/index.ts`
- Algorithm: `packages/matching/src/algorithms/matchingAlgorithm.ts` (~155 lines)
- Algorithm types: `packages/matching/src/algorithms/matchingAlgorithm.type.ts`
- Distance metrics: `packages/matching/src/distance/metric.ts` (~250 lines)
- Distance measurement: `packages/matching/src/distance/measure.ts`
- MatchingSpace: `packages/matching/src/space/matchingSpace.ts`
- Position: `packages/matching/src/space/position.ts`
- Shape utilities: `packages/matching/src/space/shape.ts`
- Subspace creation: `packages/matching/src/space/createSubspace.ts`
- Match objects: `packages/matching/src/match/matchBase.ts`, `match.ts`, `subMatch.ts`
- Match types: `packages/matching/src/match/matchTypes.ts`
- Type guards: `packages/matching/src/utils/typeGuards.ts`
- Missing value imputation: `packages/matching/src/missingValue/impute.ts`
- OrdinalQuestion: `packages/matching/src/question/ordinalQuestion.ts`
- CategoricalQuestion: `packages/matching/src/question/categoricalQuestion.ts`
- Tests: `packages/matching/tests/` (5 test files + utils.ts)

## Cross-Package Interfaces

Matching consumes `MatchableQuestion` from `@openvaa/core` (provides `id`,
`normalizedDimensions`, `normalizeValue()`). The data skill documents how question classes implement
this interface.

Matching consumes `HasAnswers` from `@openvaa/core` (provides `answers` record keyed by question
id). The data skill documents how entities implement this interface.

`COORDINATE` from `@openvaa/core`: `Min=-0.5`, `Max=0.5`, `Neutral=0`, `Extent=1`. Source:
`packages/core/src/matching/distance.ts`.

`MISSING_VALUE` sentinel and `isMissingValue()` guard from `@openvaa/core`. Source:
`packages/core/src/matching/missingValue.ts`.

Matching's own question classes (`OrdinalQuestion`, `CategoricalQuestion` in `src/question/`) are
standalone implementations for testing and direct use. Production questions come from @openvaa/data
through DataRoot.

## Known Gaps and Future Work

- Ranked preference question type: creates `f(n)/(2*f(n-2))` subdimensions for pairwise preferences
  (planned, not implemented)
- Manhattan-directional hybrid distance metric (planned, not implemented)
- Mahalanobis distance metric (planned, not implemented)

## Reference Files

- For distance metric internals, MatchingSpace mechanics, and the full matching pipeline, read [algorithm-reference.md](algorithm-reference.md)
- For step-by-step guides to adding new distance metrics, question types, and projectors, read [extension-patterns.md](extension-patterns.md)
