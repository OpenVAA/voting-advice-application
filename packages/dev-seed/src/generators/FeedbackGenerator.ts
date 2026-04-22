/**
 * FeedbackGenerator — minimal stub for the `feedback` table.
 *
 * Scope (CONTEXT Claude's Discretion §"Whether feedback ships in Phase 56"):
 * returns `[]` by default. Supports `fixed[]` for users who want specific
 * feedback rows (uncommon — feedback has little test / demo value), so the
 * pipeline class map treats every table uniformly.
 *
 * Table characteristics (RESEARCH §4.16, migration lines 949–961):
 *   - Required: `project_id`, CHECK (`rating IS NOT NULL OR description IS NOT NULL`)
 *   - Optional: `rating` int, `description` text, `date`, `url`, `user_agent`
 *   - No `external_id` column → NOT idempotent via external_id. Re-runs
 *     APPEND rather than upsert.
 *   - No `is_generated` column — feedback is uniformly user-submitted in prod;
 *     dev-seeded rows are visually indistinguishable (acceptable trade-off per
 *     Claude's Discretion — fixing this is a schema change, out of scope).
 *
 * Writer routing (Plan 07 per D-11): not in bulk_import's processing_order.
 * Direct `.upsert()` in the writer (if any rows are emitted). Because there
 * is no external_id key, the "upsert" behaves as plain insert — previous
 * runs' feedback rows accumulate in the DB. Teardown (Phase 58 CLI-03) cannot
 * target them via prefix because no `external_id` column — manual cleanup
 * required. This limitation is carried forward to Phase 58 if feedback
 * seeding becomes useful.
 *
 * D-04/D-26/D-08 + GEN-02 apply — see ElectionsGenerator.ts for the
 * canonical-pattern rationale. GEN-04 (external_id prefix) does NOT apply
 * because the table has no `external_id` column.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type FeedbackFragment = Fragment<TablesInsert<'feedback'>>;

export class FeedbackGenerator {
  constructor(private ctx: Ctx) {}

  // Phase 56 ignores ctx here; kept on the signature for D-08 consistency.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaults(ctx: Ctx): FeedbackFragment {
    return { count: 0 };
  }

  generate(fragment: FeedbackFragment): Array<TablesInsert<'feedback'>> {
    const { projectId } = this.ctx;
    const rows: Array<TablesInsert<'feedback'>> = [];

    // fixed[] pass-through — NO external_id prefix (table has no external_id).
    // Fragment.fixed's `external_id` key is present on the Fragment type but is
    // simply ignored here — writer's plain .upsert() doesn't look at it either.
    for (const fx of fragment.fixed ?? []) {
      // Discard the external_id sentinel from Fragment<T>; feedback table has
      // no corresponding column. Postgres would reject it as an unknown field.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { external_id, ...rest } = fx;
      rows.push({
        ...rest,
        project_id: fx.project_id ?? projectId
      } as TablesInsert<'feedback'>);
    }

    if ((fragment.count ?? 0) > 0) {
      this.ctx.logger(
        '[dev-seed] FeedbackGenerator: synthetic feedback disabled in Phase 56. ' +
          'Use `fixed: [{ rating: N, description: "..." }]` to emit explicit rows. ' +
          'Teardown cannot target feedback rows (no external_id) — manual cleanup required.'
      );
    }

    return rows;
  }
}
