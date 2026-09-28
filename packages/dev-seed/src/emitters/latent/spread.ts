/**
 * defaultSpread — the built-in spread default.
 *
 * Returns the std-dev of the isotropic Gaussian used to sample candidate latent positions around their organization centroid (`candidate_latent ~ N(centroid, spread²·I)`).
 *
 * Default `0.15`, scalar override only — no vector, because eigenvalues already anisotropize variance and a vector-shaped override would double-count the anisotropy.
 *
 * Pure function — no `ctx.faker` read. Signature accepts `ctx` for future hooks that might sample a random spread or read other refs; the built-in default ignores it.
 */

import type { Ctx } from '../../ctx';
import type { LatentHooks } from './latentTypes';

const DEFAULT_SPREAD = 0.15;

export function defaultSpread(_ctx: Ctx, tplSpread?: number): number {
  // Honor explicit override FIRST (including 0). Nullish-coalesce preserves 0.
  return tplSpread ?? DEFAULT_SPREAD;
}

// Compile-time assertion guards drift between this default and LatentHooks.spread.
const _typecheckSpread: NonNullable<LatentHooks['spread']> = defaultSpread;
void _typecheckSpread;
