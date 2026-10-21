/**
 * Box-Muller helper — a pure utility.
 *
 * Turns two uniform `[0, 1)` faker draws into one Gaussian draw with configurable mean and stdDev. The sole shared RNG primitive every latent sub-step imports:
 *
 *   - `centroids.ts` — farthest-point anchor perturbation
 *   - `loadings.ts` — per-question iid loading vector
 *   - `positions.ts` — per-candidate displacement around a centroid
 *
 * Pattern analog: `packages/dev-seed/src/emitters/answers.ts` (pure file-local helper style — same convention as `pickOneChoiceId`, `extractChoiceIds`).
 *
 * ## Clamp
 *
 * `faker.number.float({ min: 0, max: 1 })` can return exactly `0`. Feeding `0` into `Math.log()` yields `-Infinity`, which `Math.sqrt()` then propagates as `NaN`.
 * A single `NaN` contaminates every downstream centroid / loading / position draw.
 * Clamp `u1` to `Number.MIN_VALUE` (~5e-324) so `Math.log(u1)` is large but finite.
 *
 * ## short-circuit
 *
 * When `stdDev === 0` the caller is asking for a deterministic, noise-free draw (e.g. `template.latent.noise: 0` or the `positions` default invoked with zero spread). Return `mean` directly — skipping the faker call guarantees exact reproducibility AND preserves the RNG sequence for the NEXT consumer that DOES need noise (important because dev-seed tests rely on byte-identical output across runs).
 *
 * NO `boxMullerPair` helper: sub-step files that need two independent draws call `boxMuller` twice — one seam, one place to audit the `Math.log(0)` clamp.
 */

import type { Faker } from '@faker-js/faker';

/**
 * Draw a single N(`mean`, `stdDev²`) sample from a seeded `Faker` instance.
 *
 * @param faker seeded `Faker` instance — NEVER the module-level `faker`
 *   singleton.
 * @param mean mean of the target normal distribution. Defaults to `0`.
 * @param stdDev standard deviation of the target normal distribution. Defaults
 *   to `1`. When `stdDev === 0` the function short-circuits and returns `mean` without consuming any faker draws.
 */
export function boxMuller(faker: Faker, mean = 0, stdDev = 1): number {
  if (stdDev === 0) return mean;
  const u1 = Math.max(faker.number.float({ min: 0, max: 1 }), Number.MIN_VALUE);
  const u2 = faker.number.float({ min: 0, max: 1 });
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}
