/**
 * ConstituencyGroupsGenerator — foundation generator for `constituency_groups`.
 *
 * Standard DataObject scaffolding: `project_id` is the only required column; no content FKs to other generated rows. The constituencies join sentinel is populated by the pipeline's post-topo pass once every generator has run (same two-pass pattern as ElectionsGenerator).
 *
 * apply — see ElectionsGenerator.ts for the canonical-pattern rationale.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type ConstituencyGroupsFragment = Fragment<TablesInsert<'constituency_groups'>>;

export class ConstituencyGroupsGenerator {
  constructor(private ctx: Ctx) {}

  // `defaults` ignores ctx here; reading `ctx.refs` is how a generator would scale its counts.

  defaults(ctx: Ctx): ConstituencyGroupsFragment {
    return { count: 1 };
  }

  generate(fragment: ConstituencyGroupsFragment): Array<TablesInsert<'constituency_groups'>> {
    const { faker, projectId, externalIdPrefix } = this.ctx;
    const rows: Array<TablesInsert<'constituency_groups'>> = [];

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
        external_id: `${externalIdPrefix}cg_${String(i).padStart(2, '0')}`,
        project_id: projectId,
        name: { en: `${faker.location.country()} Constituency Group ${i + 1}` },
        sort_order: i,
        is_generated: true
      });
    }

    return rows;
  }
}
