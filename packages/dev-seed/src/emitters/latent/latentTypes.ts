/**
 * Shared type surface for the Phase 57 latent-factor answer emitter.
 *
 * Every Plan 57-02..57-07 sub-step file imports from here — this is the single
 * cross-module contract that keeps the six default sub-steps + the composition
 * shell + the clustering integration test in agreement.
 *
 * Pattern analog: `packages/dev-seed/src/types.ts` (cross-module type re-export
 * convention). We deliberately do NOT re-export `Ctx` / `Template` here — those
 * remain canonical in their original modules and consumers import them
 * separately. `latentTypes.ts` owns ONLY the types introduced in Phase 57.
 *
 * ## D-57-12 — nested function-pointer seam
 *
 * `LatentHooks` is the shape of the optional `ctx.latent` field. Each member is
 * an independently swappable function pointer so deployments (or tests) can
 * replace a single default (e.g. their own `loadings` strategy) without touching
 * the other five. Every field is optional — unset fields use the built-in
 * defaults wired by Plan 57-07's `latentAnswerEmitter`.
 *
 * ## D-57-13 — memoization lives in the emitter closure, NOT on ctx
 *
 * The one-shot state (`SpaceBundle`) computed on first emitter invocation stays
 * inside the `latentAnswerEmitter` closure. `ctx` carries ONLY the swappable
 * hooks, not the cached state. Keeping memoization off ctx prevents cross-test
 * bleed via shared ctx objects.
 *
 * ## D-57-15 — named exports only
 *
 * No default export, no barrel `index.ts` at this path (Plan 57-07 owns the
 * assembly step). Every type is individually named-exported so import sites
 * stay explicit and tree-shakable.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../../ctx';
import type { Template } from '../../template/types';

/**
 * Candidate centroid vectors. Outer array length equals `parties.length`
 * (one anchor per party / organization); inner array length equals `dims`.
 *
 * D-57-05 / D-57-07: when `template.latent.centroids` supplies per-party
 * overrides keyed by party `external_id`, the `centroids` default splices
 * those into the generated Centroids at the matching party index.
 */
export type Centroids = Array<Array<number>>;

/**
 * Loading matrix — one length-`dims` vector per question, keyed by question
 * `external_id`. Used by `project` to map a candidate position into a per-
 * question answer value.
 *
 * D-57-07: per-question loading overrides from `template.latent.loadings`
 * merge into the generated matrix at the matching `external_id` key.
 */
export type LoadingMatrix = Record<string, Array<number>>;

/**
 * Memoized one-shot state built by the Plan 57-07 emitter on first invocation.
 *
 * Lives in the emitter closure per D-57-13 — not on `ctx`. Carries every
 * artifact downstream per-candidate draws need: space dimensionality, centroid
 * anchors, loading matrix, spread / noise scalars, and the party list that
 * indexes into `centroids`.
 */
export interface SpaceBundle {
  dims: number;
  eigenvalues: Array<number>;
  centroids: Centroids;
  loadings: LoadingMatrix;
  spread: number;
  noiseStdDev: number;
  parties: Array<{ external_id: string }>;
}

/**
 * D-57-12 swappable seam on `ctx.latent`. Every field is optional; unset fields
 * fall back to the built-in Plan 57-02..57-06 defaults wired by the emitter
 * shell (Plan 57-07).
 *
 * Signatures intentionally mirror the default implementations one-for-one so a
 * custom override can be dropped in without adapters. Arguments use
 * `ReadonlyArray<>` where the default must not mutate upstream data
 * (parties / questions lists come from `ctx.refs` and the questions generator
 * output respectively).
 */
export interface LatentHooks {
  /** Plan 57-02 — resolve `{ dims, eigenvalues }` from the template. */
  dimensions?: (template: Template) => { dims: number; eigenvalues: Array<number> };

  /** Plan 57-03 — build per-party anchor vectors; honors `tplCentroids` overrides. */
  centroids?: (
    dims: number,
    eigenvalues: Array<number>,
    parties: ReadonlyArray<{ external_id: string }>,
    ctx: Ctx,
    tplCentroids?: Record<string, Array<number>>
  ) => Centroids;

  /** Plan 57-04 — scalar within-party spread; honors `tplSpread`. */
  spread?: (ctx: Ctx, tplSpread?: number) => number;

  /** Plan 57-05 — per-candidate Gaussian draw around its party centroid. */
  positions?: (partyIdx: number, centroids: Centroids, spread: number, ctx: Ctx) => Array<number>;

  /** Plan 57-06 — `(Q × D)` loading matrix; honors per-question `tplLoadings`. */
  loadings?: (
    questions: ReadonlyArray<TablesInsert<'questions'>>,
    dims: number,
    ctx: Ctx,
    tplLoadings?: Record<string, Array<number>>
  ) => LoadingMatrix;

  /** Plan 57-06 — per-question dispatch turning a latent position into an answer value. */
  project?: (
    position: Array<number>,
    loadings: LoadingMatrix,
    questions: ReadonlyArray<TablesInsert<'questions'>>,
    noiseStdDev: number,
    ctx: Ctx
  ) => Record<string, { value: unknown; info?: unknown }>;
}
