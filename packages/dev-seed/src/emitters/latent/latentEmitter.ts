/**
 * latentAnswerEmitter — Phase 57 composition shell behind the D-27 seam.
 *
 * Factory pattern (`latentAnswerEmitter(template)`):
 *   - Captures `template` + a lazily-initialized `SpaceBundle` in a closure
 *     (D-57-13 — memoization lives HERE, not on ctx; prevents cross-test bleed).
 *   - Returns an `AnswerEmitter`-shaped function.
 *   - First invocation builds `SpaceBundle` via six sub-step defaults resolved
 *     as `ctx.latent?.X?.(...) ?? defaultX(...)` (D-57-14 hook precedence —
 *     hook wins when present; template data flows into BOTH the hook and the
 *     default as an argument).
 *   - Subsequent invocations reuse the cached bundle and only run
 *     per-candidate steps (`positions` + `project`).
 *
 * Pitfall 4: candidates without a resolvable `organization` ref (missing ref,
 * empty `refs.organizations`, or unknown `external_id`) fall through to
 * `defaultRandomValidEmit` — no throw, Phase 56 behavior preserved for this
 * class of input.
 *
 * noiseStdDev (D-57-11): `template.latent?.noise ?? 0.1 * mean(eigenvalues)`.
 * Uses `??` (not `||`) so a literal `0` override is honored (noise-free mode).
 * If `eigenvalues.length === 0` the mean is undefined; falls back to `0`.
 */

import { defaultCentroids } from './centroids';
import { defaultDimensions } from './dimensions';
import { defaultLoadings } from './loadings';
import { defaultPositions } from './positions';
import { defaultProject } from './project';
import { defaultSpread } from './spread';
import { defaultRandomValidEmit } from '../answers';
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Template } from '../../template/types';
import type { AnswerEmitter } from '../answers';
import type { SpaceBundle } from './latentTypes';

/**
 * GEN-06 / GEN-06g public entry: build the Phase 57 latent emitter for a given
 * validated template. Installed by `pipeline.ts` via `ctx.answerEmitter ??=
 * latentAnswerEmitter(template)` immediately before the topo loop; the `??=`
 * preserves pre-injected emitters used by Phase 56 tests.
 */
export function latentAnswerEmitter(template: Template): AnswerEmitter {
  let bundle: SpaceBundle | undefined;

  return function emit(candidate, questions, ctx) {
    // One-shot state build on first invocation. Closure-scoped per D-57-13 —
    // NO mutation of ctx (the WeakMap cache inside defaultProject is per-ctx
    // and is the only state keyed off ctx identity).
    if (bundle === undefined) {
      const { dims, eigenvalues } =
        ctx.latent?.dimensions?.(template) ?? defaultDimensions(template);

      const parties = ctx.refs.organizations;
      const centroids =
        ctx.latent?.centroids?.(dims, eigenvalues, parties, ctx, template.latent?.centroids) ??
        defaultCentroids(dims, eigenvalues, parties, ctx, template.latent?.centroids);

      const spread =
        ctx.latent?.spread?.(ctx, template.latent?.spread) ??
        defaultSpread(ctx, template.latent?.spread);

      // Loadings use the questions passed to the first call — the pipeline
      // always calls this with the SAME questions array (CandidatesGenerator
      // resolves it once from ctx.refs.questions).
      const loadings =
        ctx.latent?.loadings?.(questions, dims, ctx, template.latent?.loadings) ??
        defaultLoadings(questions, dims, ctx, template.latent?.loadings);

      // D-57-11 noise std-dev: template override OR 0.1 * mean(eigenvalues).
      // `??` preserves a literal `0` override (noise-free determinism mode).
      const noiseStdDev =
        template.latent?.noise ??
        (eigenvalues.length > 0
          ? 0.1 * (eigenvalues.reduce((a, b) => a + b, 0) / eigenvalues.length)
          : 0);

      bundle = { dims, eigenvalues, centroids, loadings, spread, noiseStdDev, parties };
    }

    // Per-candidate: resolve party index via candidate.organization ref.
    // Pitfall 4: missing / unknown ref → defaultRandomValidEmit fallback.
    const partyIdx = findPartyIndex(candidate, bundle.parties);
    if (partyIdx < 0) {
      return defaultRandomValidEmit(candidate, questions, ctx);
    }

    const position =
      ctx.latent?.positions?.(partyIdx, bundle.centroids, bundle.spread, ctx) ??
      defaultPositions(partyIdx, bundle.centroids, bundle.spread, ctx);

    return (
      ctx.latent?.project?.(position, bundle.loadings, questions, bundle.noiseStdDev, ctx) ??
      defaultProject(position, bundle.loadings, questions, bundle.noiseStdDev, ctx)
    );
  };
}

/**
 * Resolve a candidate's party index from its `organization.external_id` ref.
 * Returns `-1` when the ref is absent, malformed, or does not match any
 * known party. The caller treats any negative return as a Pitfall 4 fallback
 * signal.
 *
 * Defensive narrowing mirrors `extractChoiceIds` in answers.ts — the candidate
 * literal in CandidatesGenerator may carry `organization?: { external_id }` as
 * a sentinel that's not strictly on `TablesInsert<'candidates'>`.
 */
function findPartyIndex(
  candidate: TablesInsert<'candidates'>,
  parties: ReadonlyArray<{ external_id: string }>
): number {
  const ref = (candidate as unknown as { organization?: { external_id?: string } }).organization;
  const extId = ref?.external_id;
  if (typeof extId !== 'string' || extId.length === 0) return -1;
  for (let i = 0; i < parties.length; i++) {
    if (parties[i].external_id === extId) return i;
  }
  return -1;
}

// Compile-time assertion — factory's return value must conform to AnswerEmitter.
// Mirrors the `_typecheckDefaultEmit` pattern in answers.ts (Phase 56 S-3).
const _typecheckLatentFactory: AnswerEmitter = latentAnswerEmitter({} as Template);
void _typecheckLatentFactory;
