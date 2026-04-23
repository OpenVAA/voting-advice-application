/**
 * defaultLoadings — Plan 57-05 sub-step default.
 *
 * GEN-06e / D-57-06 / D-57-07: produce the `(|questions| × dims)` loading
 * matrix that maps a candidate's latent position back into per-question answer
 * space. Sampled ONCE per pipeline run (closure-cached by the Plan 57-07
 * emitter shell) — the inter-question correlations visible in the final
 * answers come from shared loading rows (two questions with similar loading
 * vectors will produce similar answers for candidates at the same latent
 * position).
 *
 * ## Storage shape — keyed by `question.external_id`
 *
 * `LoadingMatrix = Record<string, Array<number>>` — one length-`dims` vector
 * per question, keyed by `external_id`. External ids are used (not positional
 * indexes) because:
 *   - Questions can be added / removed between runs; `external_id` is the
 *     stable identity.
 *   - Per-question template overrides (D-57-07) key by `external_id` — same
 *     map shape keeps the merge trivial.
 *   - Matches the `tplLoadings?: Record<string, Array<number>>` arg on the
 *     `LatentHooks.loadings` seam signature.
 *
 * ## D-57-07 per-question override
 *
 * `tplLoadings[qExtId]` replaces the sampled vector for that question when:
 *   - an entry exists for `qExtId`, AND
 *   - its length matches `dims`.
 * Wrong-length vectors are silently ignored (fall back to sampling). The
 * schema accepts arbitrary-length arrays because cross-field dims validation
 * is impractical at zod level; this is the runtime guard (T-57-22).
 *
 * ## Pitfall 3 regression guard (RESEARCH §Common Pitfalls → Pitfall 3)
 *
 * `questions.length === 0` returns `{}` with no iteration. Phase 56 has
 * determinism tests that pass an empty `{}` template; the pipeline walks all
 * sub-steps even when the questions list is empty, and this function MUST
 * produce a valid (empty) matrix rather than throw.
 *
 * ## Missing-external_id guard (Phase 56 pattern)
 *
 * A question row with no `external_id` is silently skipped — mirrors the
 * `defaultRandomValidEmit` / `extractChoiceIds` guard in
 * `src/emitters/answers.ts`. A question without a stable key cannot be indexed
 * by the projection step (Plan 57-06), so it's safer to drop than to invent
 * a synthetic key.
 *
 * ## Determinism
 *
 * Sampling uses the Pitfall-1-safe Gaussian primitive from Plan 57-01
 * (`boxMuller` with mean=0, stdDev=1). Given the same seeded `ctx.faker`, the
 * returned matrix is byte-identical across calls. Override vectors are
 * spread-copied into the matrix so downstream mutations of the returned
 * matrix do NOT propagate into the template (T-57-21 regression guard).
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../../ctx';
import { boxMuller } from './gaussian';
import type { LatentHooks, LoadingMatrix } from './latentTypes';

/**
 * Build a dense `(|questions| × dims)` loading matrix keyed by question
 * `external_id`. See module docstring for the full contract.
 *
 * @param questions questions list (read-only; the emitter shell passes the
 *   output of the questions generator).
 * @param dims number of latent dimensions (from Plan 57-02's `dimensions`
 *   resolver). Each per-question vector will have this length.
 * @param ctx per-run Ctx — only `ctx.faker` is read.
 * @param tplLoadings optional per-question overrides from
 *   `template.latent.loadings`. Keys are question `external_id`s; values are
 *   length-`dims` vectors. Wrong-length entries are silently ignored.
 */
export function defaultLoadings(
  questions: ReadonlyArray<TablesInsert<'questions'>>,
  dims: number,
  ctx: Ctx,
  tplLoadings?: Record<string, Array<number>>
): LoadingMatrix {
  const out: LoadingMatrix = {};
  for (const q of questions) {
    const qExtId = q.external_id;
    if (!qExtId) continue;

    // D-57-07 per-question override — honor supplied vector if length matches dims.
    const override = tplLoadings?.[qExtId];
    if (override !== undefined && override.length === dims) {
      out[qExtId] = [...override];
      continue;
    }

    // Default: dims iid N(0, 1) draws per D-57-06.
    out[qExtId] = Array.from({ length: dims }, () => boxMuller(ctx.faker, 0, 1));
  }
  return out;
}

// Compile-time contract — `defaultLoadings` must satisfy the `LatentHooks.loadings`
// seam signature exactly. If Plan 01's `LatentHooks` signature drifts, this
// assignment breaks at typecheck time (before any test runs).
const _typecheckLoadings: NonNullable<LatentHooks['loadings']> = defaultLoadings;
void _typecheckLoadings;
