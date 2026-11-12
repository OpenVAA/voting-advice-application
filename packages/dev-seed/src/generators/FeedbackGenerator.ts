/**
 * FeedbackGenerator — minimal stub for the `feedback` table.
 *
 * Scope: returns `[]` by default. Supports `fixed[]` for users who want specific feedback rows (uncommon — feedback has little test / demo value), so the pipeline class map treats every table uniformly.
 *
 * Table characteristics (`apps/supabase/supabase/schema/107-feedback.sql`):
 *   - CHECK (`rating IS NOT NULL OR description IS NOT NULL`)
 *   - `project_id` is nullable (`ON DELETE SET NULL`); the generator always sets it
 *   - Optional: `rating` int, `description` text, `date`, `url`, `user_agent`
 *   - No `external_id` column → NOT idempotent via external_id. Re-runs APPEND rather than upsert.
 *
 * Writer routing: `feedback` is not in bulk_import's processing_order. The writer writes any emitted rows with a direct `.upsert()`. Because there is no external_id key, the "upsert" behaves as plain insert — previous runs' feedback rows accumulate in the DB. Teardown cannot target them via prefix because there is no `external_id` column, so cleanup is manual. That limitation remains until feedback seeding becomes useful.
 *
 * The external_id prefix convention of `ElectionsGenerator.ts` does not apply, because the table has no `external_id` column.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type FeedbackFragment = Fragment<TablesInsert<'feedback'>>;

export class FeedbackGenerator {
  constructor(private ctx: Ctx) {}

  // `defaults` ignores ctx here; it is kept on the signature for consistency.

  defaults(ctx: Ctx): FeedbackFragment {
    return { count: 0 };
  }

  generate(fragment: FeedbackFragment): Array<TablesInsert<'feedback'>> {
    const { projectId } = this.ctx;
    const rows: Array<TablesInsert<'feedback'>> = [];

    // fixed[] pass-through — NO external_id prefix (table has no external_id).
    // Fragment.fixed's `external_id` key is present on the Fragment type but is simply ignored here — writer's plain .upsert() doesn't look at it either.
    for (const fx of fragment.fixed ?? []) {
      // Discard the external_id sentinel from Fragment<T>; feedback table has no corresponding column. Postgres would reject it as an unknown field.

      const { external_id, ...rest } = fx;
      rows.push({
        ...rest,
        project_id: fx.project_id ?? projectId
      } as TablesInsert<'feedback'>);
    }

    if ((fragment.count ?? 0) > 0) {
      this.ctx.logger(
        '[dev-seed] FeedbackGenerator: synthetic feedback disabled. ' +
          'Use `fixed: [{ rating: N, description: "..." }]` to emit explicit rows. ' +
          'Teardown cannot target feedback rows (no external_id) — manual cleanup required.'
      );
    }

    return rows;
  }
}
