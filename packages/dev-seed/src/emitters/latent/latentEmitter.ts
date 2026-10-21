/**
 * latentAnswerEmitter — the composition shell behind the seam.
 *
 * Factory pattern (`latentAnswerEmitter(template)`):
 *   - Captures `template` + a lazily-initialized `SpaceBundle` in a closure (memoization lives HERE, not on ctx; prevents cross-test bleed).
 *   - Returns an `AnswerEmitter`-shaped function.
 *   - First invocation builds `SpaceBundle` via six sub-step defaults resolved as `ctx.latent?.X?.(...)?? defaultX(...)` (hook precedence — hook wins when present; template data flows into BOTH the hook and the default as an argument).
 *   - Subsequent invocations reuse the cached bundle and only run per-candidate steps (`positions` + `project`).
 *
 * ⚠ Candidates without a resolvable `organization` ref (missing ref, empty `refs.organizations`, or unknown `external_id`) fall through to `defaultRandomValidEmit` — no throw; the default emitter's behaviour is preserved for this class of input.
 *
 * noiseStdDev: `template.latent?.noise?? 0.1 * mean(eigenvalues)`.
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
 * Public entry: build the latent emitter for a given validated template.
 * Installed by `pipeline.ts` via `ctx.answerEmitter ??= latentAnswerEmitter(template)` immediately before the topo loop; the `??=` preserves an emitter a caller pre-injected on the ctx.
 */
export function latentAnswerEmitter(template: Template): AnswerEmitter {
  let bundle: SpaceBundle | undefined;

  return function emit(candidate, questions, ctx) {
    // One-shot state build on first invocation. Closure-scoped per — NO mutation of ctx (the WeakMap cache inside defaultProject is per-ctx and is the only state keyed off ctx identity).
    if (bundle === undefined) {
      const { dims, eigenvalues } = ctx.latent?.dimensions?.(template) ?? defaultDimensions(template);

      const organizations = ctx.refs.organizations;
      const centroids =
        ctx.latent?.centroids?.(dims, eigenvalues, organizations, ctx, template.latent?.centroids) ??
        defaultCentroids(dims, eigenvalues, organizations, ctx, template.latent?.centroids);

      const spread = ctx.latent?.spread?.(ctx, template.latent?.spread) ?? defaultSpread(ctx, template.latent?.spread);

      // Loadings use the questions passed to the first call — the pipeline always calls this with the SAME questions array (CandidatesGenerator resolves it once from ctx.refs.questions).
      const loadings =
        ctx.latent?.loadings?.(questions, dims, ctx, template.latent?.loadings) ??
        defaultLoadings(questions, dims, ctx, template.latent?.loadings);

      // noise std-dev: template override OR 0.1 * mean(eigenvalues).
      // `??` preserves a literal `0` override (noise-free determinism mode).
      const noiseStdDev =
        template.latent?.noise ??
        (eigenvalues.length > 0 ? 0.1 * (eigenvalues.reduce((a, b) => a + b, 0) / eigenvalues.length) : 0);

      bundle = { dims, eigenvalues, centroids, loadings, spread, noiseStdDev, organizations };
    }

    // Per-candidate: resolve organization index via candidate.organization ref.
    // Missing / unknown ref → defaultRandomValidEmit fallback.
    const organizationIdx = findOrganizationIndex(candidate, bundle.organizations);
    if (organizationIdx < 0) {
      return defaultRandomValidEmit(candidate, questions, ctx);
    }

    const position =
      ctx.latent?.positions?.(organizationIdx, bundle.centroids, bundle.spread, ctx) ??
      defaultPositions(organizationIdx, bundle.centroids, bundle.spread, ctx);

    return (
      ctx.latent?.project?.(position, bundle.loadings, questions, bundle.noiseStdDev, ctx) ??
      defaultProject(position, bundle.loadings, questions, bundle.noiseStdDev, ctx)
    );
  };
}

/**
 * Resolve a candidate's organization index from its `organization.external_id` ref.
 * Returns `-1` when the ref is absent, malformed, or does not match any known organization. The caller treats any negative return as a fallback signal.
 *
 * Defensive narrowing mirrors `extractChoiceIds` in answers.ts — the candidate literal in CandidatesGenerator may carry `organization?: { external_id }` as a sentinel that's not strictly on `TablesInsert<'candidates'>`.
 */
function findOrganizationIndex(
  candidate: TablesInsert<'candidates'>,
  organizations: ReadonlyArray<{ external_id: string }>
): number {
  const ref = (candidate as unknown as { organization?: { external_id?: string } }).organization;
  const extId = ref?.external_id;
  if (typeof extId !== 'string' || extId.length === 0) return -1;
  for (let i = 0; i < organizations.length; i++) {
    if (organizations[i].external_id === extId) return i;
  }
  return -1;
}

// Compile-time assertion — factory's return value must conform to AnswerEmitter.
// Mirrors the `_typecheckDefaultEmit` pattern in answers.ts.
const _typecheckLatentFactory: AnswerEmitter = latentAnswerEmitter({} as Template);
void _typecheckLatentFactory;
