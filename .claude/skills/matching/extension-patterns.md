# Extension Patterns for @openvaa/matching

Step-by-step guides for the most common matching package extensions. All file paths in steps are relative to `packages/matching/src/` unless stated otherwise.

## Adding a New Distance Metric

Reference implementation: Manhattan metric in `distance/metric.ts`.

Follow these steps in order. Each step names the file to create or modify.

1. **Implement kernel function** in `distance/metric.ts`
   - Signature: `(a: number, b: number) => number`
   - Computes per-coordinate distance between two normalized coordinates
   - Must return a value in `[0, COORDINATE.Extent]` range (i.e., `[0, 1]`)
   - Reference: `absoluteKernel` for standard absolute difference, `directionalKernel` for direction-aware
   - If an existing kernel works for your metric, skip this step and reuse it

2. **Implement sum function** in `distance/metric.ts` (only if different from existing sums)
   - Signature: `(values: number[]) => number`
   - Aggregates per-dimension weighted distances into a single value
   - Reference: `basicSum` for linear addition, `euclideanSum` for `Math.sqrt(sum of squares)`
   - If an existing sum works for your metric, skip this step and reuse it

3. **Implement subdimWeight function** in `distance/metric.ts` (only if different from existing)
   - Signature: `(n: number) => number`
   - Returns weight factor for each subdimension within a multi-subdimension question (CategoricalQuestion with N>2 choices)
   - Must be the inverse of `sum` for equal max distances across dimension shapes
   - Reference: `basicDivision` returns `1/n` (inverse of `basicSum`), `euclideanSubdimWeight` returns `1/Math.sqrt(n)` (inverse of `euclideanSum`)

4. **Create named metric function** in `distance/metric.ts`
   - Follows the pattern of `manhattanDistance()`, `directionalDistance()`, `euclideanDistance()`
   - Calls the generic `distance()` function passing the three component functions:
     ```ts
     distance({ a, b, kernel: myKernel, sum: mySum, subdimWeight: mySubdimWeight, space, allowMissing })
     ```
   - Must accept the same parameters: `{ a, b, space?, allowMissing? }`
   - Must return `NormalizedDistance`

5. **Add to DISTANCE_METRIC const** in `distance/metric.ts`
   - Add `{Name}: {nameFunction}` to the `DISTANCE_METRIC` const object
   - The key becomes the enum-like accessor: `DISTANCE_METRIC.{Name}`
   - The value is the metric function itself
   - The `DistanceMetric` type auto-derives via `typeof DISTANCE_METRIC[keyof typeof DISTANCE_METRIC]`

6. **Verify module barrel** in `distance/index.ts`
   - Confirm `export { DISTANCE_METRIC, type DistanceMetric } from './metric'` already covers the new metric (it does, since `DISTANCE_METRIC` is the single export object)
   - No changes needed unless you export standalone functions (like `manhattanDistance`) separately
   - The package root `index.ts` re-exports via `export * from './distance'` -- no changes needed there either

7. **Create tests** in `tests/distance.test.ts` (relative to `packages/matching/`)
   - Import your metric function and test helpers from `../src/distance/metric`
   - Test kernel function independently with known coordinate pairs
   - Test full metric with single-dimension Positions (`normalizedDimensions=1`)
   - Test with multi-subdimension Positions (CategoricalQuestion-style, shape `[1, 3]`)
   - Test edge cases: all-same answers (distance=0), all-opposite answers (distance=`COORDINATE.Extent`), single-question matching
   - Test with weighted dimensions via custom `MatchingSpace`
   - Pattern: follow existing Manhattan/Directional/Euclidean test blocks in `tests/distance.test.ts`

## Adding a New MatchingSpaceProjector

The `MatchingSpaceProjector` interface enables projecting positions from the full matching space to a lower-dimensional space (e.g., 2D political compass maps).

Reference: `algorithms/matchingSpaceProjector.ts` defines the interface.

Follow these steps in order:

1. **Create projector class file** `algorithms/{name}Projector.ts`
   - Implement the `MatchingSpaceProjector` interface:
     - `project(positions: ReadonlyArray<Position>): Array<Position>`
   - Input: an array of all entity Positions (reference + targets) in the full MatchingSpace
   - Output: a new array of Positions in a lower-dimensional MatchingSpace
   - The projected MatchingSpace shape defines the target dimensions (e.g., `[1, 1]` for a 2D map)
   - You must create the new MatchingSpace and new Position objects -- do not mutate inputs
   - All projected coordinates must be in valid `[COORDINATE.Min, COORDINATE.Max]` range

2. **Export from module barrel** `algorithms/index.ts`
   - Add `export { {Name}Projector } from './{name}Projector'`
   - Follow the existing export pattern

3. **Create tests** in `tests/` directory (relative to `packages/matching/`)
   - Test that projection produces correct target space shape
   - Test that projected positions are valid within the new space (coordinates in range, shape matches)
   - Test with varying numbers of input dimensions
   - Test round-trip properties if applicable (e.g., PCA reconstruction error)

4. **Usage:** Pass the projector instance to `MatchingAlgorithm` constructor via `MatchingAlgorithmOptions.projector`. The algorithm calls `projector.project(positions)` after creating initial Positions and before distance measurement. The projector receives all Positions (reference + targets) and must return the same number of Positions in the same order.

## Verification After Extension

After completing any extension, verify:

1. `cd packages/matching && yarn test:unit` -- all existing tests pass (no regressions)
2. New test cases pass with expected assertions
3. `yarn build:shared` -- builds without errors (matching package is part of shared build)
4. Edge case verification: all-same answers produce distance 0, all-opposite answers produce distance `COORDINATE.Extent`
5. For new question types: `normalizedDimensions` matches `normalizeValue()` return array length for all inputs
6. For new metrics: result is normalized to `[0, COORDINATE.Extent]` for all input combinations
7. For new projectors: projected space shape matches intended target dimensions and all positions are valid
