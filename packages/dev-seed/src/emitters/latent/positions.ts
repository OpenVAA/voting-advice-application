/**
 * defaultPositions — the built-in per-candidate position default.
 *
 * Per-candidate Gaussian draw around an organization centroid. This is the ONLY sub-step that runs per-candidate — `dimensions`, `centroids`, `loadings`, and `spread` are all closure-cached by the `latentAnswerEmitter` shell.
 *
 * Samples a candidate latent position as `N(centroid, spread² · I)` where:
 *   - `centroid = centroids[organizationIdx]` — the organization's anchor in latent space
 *   - `spread` is the scalar std-dev, and it is isotropic: there is no anisotropic vector option, because the eigenvalue scaling already anisotropizes variance at the centroid level.
 *   - each dim is an INDEPENDENT Gaussian draw via `boxMuller`.
 *
 * ## short-circuit
 *
 * When `spread === 0`, `boxMuller(ctx.faker, c, 0)` returns `c` unchanged and consumes zero faker draws. The resulting position equals the centroid exactly, and the RNG sequence is preserved for the next consumer — critical for byte-identical determinism under mixed zero/non-zero spread runs.
 *
 * ## Out-of-range guard
 *
 * The emitter shell only calls `positions` for candidates with a resolved `organization` ref (other candidates fall back to `defaultRandomValidEmit`), so in normal flow this branch is unreachable.
 * Throwing makes the contract explicit and surfaces any caller bug loudly instead of propagating an `undefined` centroid into Box-Muller (where it would yield `NaN` coords and silently break clustering).
 *
 * Pattern analog: `src/emitters/latent/gaussian.ts` (pure file-local helper, named export, inline docblock) — same convention established.
 */

import { boxMuller } from './gaussian';
import type { Ctx } from '../../ctx';
import type { Centroids, LatentHooks } from './latentTypes';

/**
 * Sample a candidate latent position as `N(centroid, spread² · I)`.
 *
 * @param organizationIdx index into `centroids` — must satisfy
 *   `0 <= organizationIdx < centroids.length`; throws otherwise.
 * @param centroids per-organization anchor matrix; `centroids[organizationIdx]` supplies the
 *   per-dim means.
 * @param spread scalar std-dev applied isotropically across all dims. When
 *   `spread === 0` the returned vector equals the centroid verbatim and no faker draws are consumed (delegation via `boxMuller`).
 * @param ctx pipeline context — RNG source for the Gaussian draws.
 */
export function defaultPositions(
  organizationIdx: number,
  centroids: Centroids,
  spread: number,
  ctx: Ctx
): Array<number> {
  if (organizationIdx < 0 || organizationIdx >= centroids.length) {
    throw new Error(`defaultPositions: organizationIdx ${organizationIdx} out of range [0, ${centroids.length})`);
  }
  const centroid = centroids[organizationIdx];
  return centroid.map((c) => boxMuller(ctx.faker, c, spread));
}

// Type-level assurance that `defaultPositions` satisfies the `LatentHooks.positions` seam contract. `void` silences the unused-binding lint without emitting a runtime reference.
const _typecheckPositions: NonNullable<LatentHooks['positions']> = defaultPositions;
void _typecheckPositions;
