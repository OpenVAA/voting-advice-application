/**
 * defaultDimensions — GEN-06a / D-57-01 / D-57-02 built-in default.
 *
 * Resolves `{ dims, eigenvalues }` from a (possibly empty) `template.latent` block
 * per the rules in 57-CONTEXT.md:
 *
 *   D-57-01: default `dims` is 2 (political-compass shape).
 *   D-57-02: default eigenvalues decay geometrically with ratio 1/3:
 *            `[1, 1/3, 1/9, ...]` generalizing to `(1/3)^i` for `i in 0..dims-1`.
 *
 * Precedence (all fields optional per D-57-21):
 *   - `template.latent.dimensions` > unset → 2
 *   - `template.latent.eigenvalues` explicit → used verbatim; `dims` derived from
 *     `eigenvalues.length` when `dimensions` is unset, OR equals `dimensions` when
 *     both are supplied (schema .superRefine enforces the length match).
 *
 * Pure function — no `ctx.faker` read (no RNG). Called ONCE per pipeline run from
 * the `latentAnswerEmitter` closure cache (Plan 07); memoized into `SpaceBundle`.
 */

import type { Template } from '../../template/types';
import type { LatentHooks } from './latentTypes';

const DEFAULT_DIMS = 2;
const EIGENVALUE_DECAY_RATIO = 1 / 3;

export function defaultDimensions(template: Template): { dims: number; eigenvalues: Array<number> } {
  const tplDims = template.latent?.dimensions;
  const tplEig = template.latent?.eigenvalues;

  // When explicit eigenvalues are supplied, they dictate the dimensionality.
  // Schema .superRefine (Plan 01) enforces `tplEig.length === tplDims` when both
  // are supplied; here we honor that invariant and trust the validator.
  if (tplEig !== undefined) {
    const dims = tplDims ?? tplEig.length;
    return { dims, eigenvalues: [...tplEig] };
  }

  const dims = tplDims ?? DEFAULT_DIMS;
  const eigenvalues = Array.from({ length: dims }, (_, i) => Math.pow(EIGENVALUE_DECAY_RATIO, i));
  return { dims, eigenvalues };
}

// Compile-time assertion — guards against drift between this default and the
// `LatentHooks.dimensions` signature exported from latentTypes.ts.
const _typecheckDimensions: NonNullable<LatentHooks['dimensions']> = defaultDimensions;
void _typecheckDimensions;
