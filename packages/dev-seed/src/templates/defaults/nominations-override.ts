/**
 * Default-template nominations override — D-25 Overrides signature.
 *
 * Replaces Phase 56 NominationsGenerator's "all-on-constituency-0" emission
 * with a realistic linear-falloff distribution across every constituency in
 * `ctx.refs.constituencies`.
 *
 * The built-in generator wires every candidate-type nomination to the first
 * election × first constituency (NominationsGenerator.ts:122-123) — fine for
 * Phase 56's "exercise polymorphism end-to-end" goal, but it produces a
 * degenerate voter-app demo: 12 of the 13 constituencies are empty.
 *
 * Distribution shape:
 *   Linear weights from 3.0 (largest constituency) down to 1.0 (smallest),
 *   evenly spaced across `M = constituencies.length` slots. Total candidates
 *   `N = candidates.length` are allocated via largest-remainder rounding so
 *   the counts sum to exactly N and the largest:smallest ratio is exactly
 *   3:1 when N is large enough to avoid rounding collapse.
 *
 *   For M=13, N=100 (the default template config) this yields
 *   `[12, 11, 10, 10, 9, 8, 8, 7, 6, 6, 5, 4, 4]` — sum 100, ratio 12/4 = 3.0,
 *   monotonically declining.
 *
 *   For other (M, N) pairs the shape is still linear-falloff; the exact
 *   ratio varies with N (tiny N can collapse to a flatter profile after
 *   rounding, but that's the correct behavior — you can't express a 3:1
 *   ratio with <3 units).
 *
 * Candidates are walked sequentially into constituencies in ref order, so
 * the earlier parties (party_blue with 20 candidates, party_green with 18
 * etc. per `candidates-override.ts`) concentrate in the larger
 * constituencies. Party clustering for matching/compass purposes is
 * unaffected — that's driven by the latent-factor answer model, not by
 * geographic wiring.
 *
 * Phase 58 UAT follow-up (2026-04-23).
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../../types';

type CandidateRef = { candidate: { external_id: string } };

type NominationRow = Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> &
  CandidateRef & {
    election: { external_id: string };
    constituency: { external_id: string };
  };

/**
 * Allocate `N` items across `M` slots with linear-falloff weights from 3.0
 * (slot 0) down to 1.0 (slot M-1), then round using largest-remainder so the
 * counts sum to exactly `N`.
 *
 * Exported for unit testing. Pure, deterministic.
 */
export function allocateLinearFalloff(M: number, N: number): Array<number> {
  if (M <= 0 || N <= 0) return new Array(Math.max(M, 0)).fill(0);
  if (M === 1) return [N];

  const weights = Array.from({ length: M }, (_, i) => 3 - (2 * i) / (M - 1));
  const sumW = weights.reduce((s, w) => s + w, 0);
  const raw = weights.map((w) => (w / sumW) * N);
  const base = raw.map((x) => Math.floor(x));

  let assigned = base.reduce((s, x) => s + x, 0);
  const remainders = raw.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r);

  let k = 0;
  while (assigned < N && k < remainders.length) {
    base[remainders[k].i] += 1;
    assigned += 1;
    k += 1;
  }
  return base;
}

export function nominationsOverride(_fragment: unknown, ctx: Ctx): Array<Record<string, unknown>> {
  const { projectId, externalIdPrefix, refs } = ctx;
  const candidates = refs.candidates;
  const constituencies = refs.constituencies;
  const elections = refs.elections;

  if (candidates.length === 0 || constituencies.length === 0 || elections.length === 0) {
    throw new Error(
      '[dev-seed] nominationsOverride: ctx.refs is empty for candidates / constituencies / elections. ' +
        'Ensure the pipeline runs in D-06 topo order and that the template requests non-zero counts.'
    );
  }

  const electionExtId = elections[0].external_id;
  const counts = allocateLinearFalloff(constituencies.length, candidates.length);

  const rows: Array<NominationRow> = [];
  let candIdx = 0;
  for (let c = 0; c < constituencies.length; c++) {
    const constExtId = constituencies[c].external_id;
    const n = counts[c];
    for (let k = 0; k < n; k++) {
      const cand = candidates[candIdx];
      rows.push({
        external_id: `${externalIdPrefix}nom_cand_${String(candIdx).padStart(4, '0')}`,
        project_id: projectId,
        candidate: { external_id: cand.external_id },
        election: { external_id: electionExtId },
        constituency: { external_id: constExtId },
        election_round: 1
      });
      candIdx += 1;
    }
  }

  return rows as unknown as Array<Record<string, unknown>>;
}
