/**
 * QuestionCategoriesGenerator — content generator for the `question_categories` table.
 *
 * Schema: `project_id` is required; optional `category_type` enum defaults to 'opinion'; `election_ids`/`election_rounds`/`constituency_ids`/`entity_type` JSONB filters default to NULL.
 *
 * Sentinel policy: this generator does NOT emit the `_elections` join sentinel (the same deferred-enrichment pattern ElectionsGenerator uses). The pipeline's post-topo pass attaches `_elections: { externalId: string[] }` after every generator has run, so the full `ctx.refs.elections` is known. Keeping generator output sentinel-free also means unit tests can assert raw `TablesInsert` shape without filtering sentinels.
 *
 * apply — see ElectionsGenerator.ts for the canonical-pattern rationale.
 *
 * Default count = 2: enough category diversity for the plumbing (e.g. "Economy", "Environment") so QuestionsGenerator's rotation assigns questions across more than one category. Templates can override it.
 */

import type { Enums, TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type QuestionCategoriesFragment = Fragment<TablesInsert<'question_categories'>>;

export class QuestionCategoriesGenerator {
  constructor(private ctx: Ctx) {}

  // `defaults` ignores ctx here; reading `ctx.refs` is how a generator would scale its counts.

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
        // _elections sentinel added by the pipeline's post-topo pass.
      });
    }

    return rows;
  }
}
