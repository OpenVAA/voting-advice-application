/**
 * `defaultCentroids` — Phase 57 sub-step default for GEN-06b / D-57-03 / D-57-05.
 *
 * Given `dims`, `eigenvalues`, and a list of parties, produce one centroid vector
 * per party so the resulting positions are spread across the latent space —
 * driving the visible party clustering the latent-factor emitter is designed to
 * produce. Called once per pipeline run by the `latentAnswerEmitter` closure
 * (Plan 57-07) and memoized in `SpaceBundle` (D-57-13).
 *
 * Pattern analog: `packages/dev-seed/src/emitters/answers.ts` — named-default
 * export + file-local helpers (`extractChoiceIds` style). Compile-time contract
 * assertion mirrors `_typecheckDefaultEmit` from `answers.ts:70-73`.
 *
 * ## Algorithm (RESEARCH § "Algorithmic Snippets → Farthest-point sampling")
 *
 * 1. Build a Gaussian-sampled candidate pool — `max(10*N, 50)` vectors. Each
 *    dimension `d` drawn from `N(0, sqrt(eigenvalues[d]))` so the eigenvalue
 *    decay (D-57-02) shows up in raw samples: dominant axis has the widest
 *    spread, subsequent axes proportionally tighter. Pool size chosen so the
 *    greedy max-min step has enough diversity to actually spread out (`10*N`
 *    is a standard heuristic; `50` floor prevents tiny-N cases from collapsing
 *    to a handful of candidates).
 *
 * 2. Seed anchors from `tplCentroids` (D-57-05) — supplied centroids are
 *    treated as fixed points already placed; the farthest-point loop picks
 *    the remaining slots such that each maximizes the minimum squared-Euclidean
 *    distance to everything currently placed (anchors + earlier picks).
 *
 * 3. The FIRST non-anchored slot takes `pool.shift()` — deterministic under a
 *    seeded faker (always the first pool element). This matters for the "all
 *    anchors missing" case, where no fixed point exists to measure against;
 *    popping the first draw gives a reproducible seed for the greedy step.
 *
 * 4. For every subsequent non-anchored slot, walk the pool and pick the
 *    candidate that maximizes `min(squaredDistance(candidate, placed_i))`
 *    across all already-placed centroids. Splice it out of the pool so it
 *    isn't picked again.
 *
 * ## Pitfall 4 — graceful `N=0` handling
 *
 * `N=0` returns `[]` immediately (no pool allocation, no division-by-zero). The
 * only RESEARCH pitfall directly relevant to this file; Pitfall 1 (NaN from
 * `Math.log(0)`) is inherited from `gaussian.ts` via `boxMuller` — Test 9
 * regression-guards it here over 100 seeds.
 *
 * ## Anchor copy semantics (D-57-05)
 *
 * `centroids[i] = [...anchor]` — anchors are COPIED, not aliased. Mutating the
 * returned centroid array must not leak into the caller's template anchor. Test
 * 5's trailing assertion verifies this boundary.
 *
 * ## Anchor length guard (D-57-15 / threat T-57-15)
 *
 * Anchors whose length does not match `dims` are silently ignored — the slot
 * falls through to farthest-point sampling instead. The zod schema (Plan 01)
 * accepts arbitrary-length arrays because per-party length cannot be validated
 * without reading `template.latent.dimensions`; this guard is the algorithm-
 * layer defense.
 */

import type { Ctx } from '../../ctx';
import type { Centroids, LatentHooks } from './latentTypes';
import { boxMuller } from './gaussian';

/**
 * Build per-party centroid vectors via farthest-point greedy max-min sampling.
 *
 * @param dims number of latent dimensions (matches `template.latent.dimensions`).
 * @param eigenvalues length-`dims` array of non-negative eigenvalues; dimension
 *   `d` is sampled from `N(0, sqrt(eigenvalues[d]))`.
 * @param parties read-only list of parties (`{ external_id }`) from
 *   `ctx.refs.organizations`. Output length matches this length.
 * @param ctx seeded `Ctx`; `ctx.faker` is the sole RNG source (Pattern S-1).
 * @param tplCentroids optional anchor map keyed by party `external_id` — when a
 *   party is anchored, its centroid is the anchor verbatim (copied). Anchors
 *   with length ≠ `dims` are silently ignored.
 *
 * @returns `Centroids` — `Array<Array<number>>` of length `parties.length`,
 *   each entry length `dims`. Never contains `NaN` or `Infinity` (inherits the
 *   `boxMuller` Pitfall-1 clamp).
 */
export function defaultCentroids(
  dims: number,
  eigenvalues: Array<number>,
  parties: ReadonlyArray<{ external_id: string }>,
  ctx: Ctx,
  tplCentroids?: Record<string, Array<number>>
): Centroids {
  const N = parties.length;
  if (N === 0) return [];

  // Pool size: 10*N Gaussian-sampled candidates (min 50) — enough diversity for
  // the greedy max-min step to actually spread out. Deterministic with seeded faker.
  const poolSize = Math.max(10 * N, 50);
  const pool: Array<Array<number>> = Array.from({ length: poolSize }, () =>
    // Sample each dim from N(0, sqrt(eigenvalue[d])) so the eigenvalue structure
    // shows up in raw samples (dominant axis has the widest spread).
    Array.from({ length: dims }, (_, d) =>
      boxMuller(ctx.faker, 0, Math.sqrt(eigenvalues[d] ?? 0))
    )
  );

  const centroids: Array<Array<number> | undefined> = new Array(N);

  // Seed anchors from template (D-57-05) — fixed points the farthest-point step
  // treats as already-placed. Wrong-length anchors are silently ignored (threat
  // T-57-15) and fall through to farthest-point sampling.
  for (let i = 0; i < N; i++) {
    const anchor = tplCentroids?.[parties[i].external_id];
    if (anchor && anchor.length === dims) {
      centroids[i] = [...anchor]; // copy to prevent outside mutation
    }
  }

  // First non-anchored centroid: pop the first pool element (deterministic).
  const firstUnset = centroids.findIndex((c) => c === undefined);
  if (firstUnset >= 0) {
    centroids[firstUnset] = pool.shift()!;
  }

  // Greedy: for each remaining unset slot, pick pool element with the LARGEST
  // minimum squared-Euclidean distance to already-placed centroids.
  for (let i = 0; i < N; i++) {
    if (centroids[i] !== undefined) continue;
    let bestIdx = 0;
    let bestMinDist = -Infinity;
    for (let p = 0; p < pool.length; p++) {
      let minDist = Infinity;
      for (const c of centroids) {
        if (!c) continue;
        minDist = Math.min(minDist, euclideanSq(pool[p], c));
      }
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestIdx = p;
      }
    }
    centroids[i] = pool[bestIdx];
    pool.splice(bestIdx, 1);
  }

  // All slots now filled — narrow the type.
  return centroids as Centroids;
}

/**
 * Squared Euclidean distance between two equal-length vectors. File-local
 * helper — not exported (mirrors `extractChoiceIds` visibility in `answers.ts`).
 * Squared (not sqrt'd) because the max-min loop only needs a monotonic ordering
 * — skipping the sqrt saves `O(poolSize * N)` calls per run.
 */
function euclideanSq(a: Array<number>, b: Array<number>): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return s;
}

// Compile-time assertion that `defaultCentroids` conforms to the
// `LatentHooks['centroids']` seam signature. If the signature drifts, TS reports
// here. Mirrors the `_typecheckDefaultEmit` pattern from `answers.ts:70-73`.
const _typecheckCentroids: NonNullable<LatentHooks['centroids']> = defaultCentroids;
void _typecheckCentroids;
