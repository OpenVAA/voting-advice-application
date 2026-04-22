/**
 * OrganizationsGenerator — foundation generator for the `organizations` table
 * (political parties in VAA terminology).
 *
 * RESEARCH §4.8: `project_id` is required; `auth_user_id` is nullable FK to
 * auth.users (left NULL — Phase 56 scope excludes auth); `answers` defaults to
 * '{}' at the DB level; standard DataObject scaffolding otherwise. No content
 * FK refs on this table.
 *
 * D-04/D-26/D-08 + GEN-02/GEN-04 apply — see ElectionsGenerator.ts for the
 * canonical-pattern rationale.
 *
 * Default count = 4: enough parties for matching/filtering sanity-checks
 * (candidates' organization ref picks round-robin per PATTERNS §generators
 * CandidatesGenerator sample) without bloating the <10s seed budget (NF-01).
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type OrganizationsFragment = Fragment<TablesInsert<'organizations'>>;

export class OrganizationsGenerator {
  constructor(private ctx: Ctx) {}

  // Phase 56 ignores ctx here; Phase 57/58 generators read ctx.refs to scale counts.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        color: faker.color.rgb(),
        sort_order: i,
        is_generated: true
        // `auth_user_id` omitted — Phase 56 scope excludes auth (RESEARCH §4.8).
        // `answers` omitted — DB default '{}' applies.
      });
    }

    return rows;
  }
}
