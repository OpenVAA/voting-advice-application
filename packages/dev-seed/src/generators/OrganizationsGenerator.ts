/**
 * OrganizationsGenerator — foundation generator for the `organizations` table (the political entities candidates stand for).
 *
 * Schema: `project_id` is required; `auth_user_id` is nullable FK to auth.users and is left NULL — dev-seed writes no auth rows; `answers` defaults to '{}' at the DB level; standard DataObject scaffolding otherwise. No content FK refs on this table.
 *
 * apply — see ElectionsGenerator.ts for the canonical-pattern rationale.
 *
 * Default count = 4: enough organizations for matching/filtering sanity-checks (candidates' organization ref picks round-robin over the CandidatesGenerator sample) without bloating the <10s seed budget.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type OrganizationsFragment = Fragment<TablesInsert<'organizations'>>;

export class OrganizationsGenerator {
  constructor(private ctx: Ctx) {}

  // `defaults` ignores ctx here; reading `ctx.refs` is how a generator would scale its counts.

  defaults(ctx: Ctx): OrganizationsFragment {
    return { count: 4 };
  }

  generate(fragment: OrganizationsFragment): Array<TablesInsert<'organizations'>> {
    const { faker, projectId, externalIdPrefix } = this.ctx;
    const rows: Array<TablesInsert<'organizations'>> = [];

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
        external_id: `${externalIdPrefix}org_${String(i).padStart(2, '0')}`,
        project_id: projectId,
        name: { en: `${faker.company.name()} Party` },
        short_name: { en: `P${i + 1}` },
        color: { normal: faker.color.rgb(), dark: faker.color.rgb() },
        sort_order: i,
        is_generated: true
        // `auth_user_id` omitted — dev-seed writes no auth rows.
        // `answers` omitted — DB default '{}' applies.
      });
    }

    return rows;
  }
}
