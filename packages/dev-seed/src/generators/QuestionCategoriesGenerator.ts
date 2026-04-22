/**
 * QuestionCategoriesGenerator — content generator for the `question_categories` table.
 *
 * RESEARCH §4.12: `project_id` is required; optional `category_type` enum defaults
 * to 'opinion'; `election_ids`/`election_rounds`/`constituency_ids`/`entity_type`
 * JSONB filters default to NULL.
 *
 * Sentinel policy: this generator does NOT emit the `_elections` join sentinel
 * (same deferred-enrichment pattern as Plan 04's ElectionsGenerator). Plan 07's
 * post-topo pass attaches `_elections: { externalId: string[] }` after every
 * generator has run, so the full `ctx.refs.elections` is known. Keeping generator
 * output sentinel-free also means unit tests can assert raw `TablesInsert` shape
 * without filtering sentinels.
 *
 * D-04/D-26/D-08 + GEN-02/GEN-04 apply — see ElectionsGenerator.ts for the
 * canonical-pattern rationale.
 *
 * Default count = 2: enough category diversity for Phase 56 plumbing
 * (e.g. "Economy", "Environment") so QuestionsGenerator's rotation assigns
 * questions across more than one category. Phase 58 templates can override.
 */

import type { Enums, TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type QuestionCategoriesFragment = Fragment<TablesInsert<'question_categories'>>;

export class QuestionCategoriesGenerator {
  constructor(private ctx: Ctx) {}

  // Phase 56 ignores ctx here; Phase 57/58 generators read ctx.refs to scale counts.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaults(ctx: Ctx): QuestionCategoriesFragment {
    return { count: 2 };
  }

  generate(fragment: QuestionCategoriesFragment): Array<TablesInsert<'question_categories'>> {
    const { faker, projectId, externalIdPrefix } = this.ctx;
    const rows: Array<TablesInsert<'question_categories'>> = [];

    for (const fx of fragment.fixed ?? []) {
      rows.push({
        ...fx,
        external_id: `${externalIdPrefix}${fx.external_id}`,
        project_id: fx.project_id ?? projectId
      });
    }

    const n = fragment.count ?? 0;
    for (let i = 0; i < n; i++) {
      rows.push({
        external_id: `${externalIdPrefix}cat_${String(i).padStart(2, '0')}`,
        project_id: projectId,
        name: { en: `${faker.word.adjective()} Category ${i + 1}` },
        category_type: 'opinion' satisfies Enums<'category_type'>,
        sort_order: i,
        is_generated: true
        // _elections sentinel added by Plan 07's post-topo pass (RESEARCH §4.12).
      });
    }

    return rows;
  }
}
