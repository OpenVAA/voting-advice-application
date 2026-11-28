/**
 * OrganizationsGenerator — foundation generator for the `organizations` table (the political entities candidates stand for).
 *
 * Schema: `project_id` is required; `answers` defaults to '{}' at the DB level; standard DataObject scaffolding otherwise. No content FK refs on this table.
 *
 * Follows the generator pattern described in ElectionsGenerator.ts.
 *
 * Default count = 4: enough organizations for matching/filtering sanity-checks (candidates' organization ref picks round-robin over the CandidatesGenerator sample) without bloating the <10s seed budget.
 */

import { passThroughFixed } from './passThroughFixed';
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type OrganizationsFragment = Fragment<TablesInsert<'organizations'>>;

export class OrganizationsGenerator {
  constructor(private ctx: Ctx) {}

  generate(fragment: OrganizationsFragment): Array<TablesInsert<'organizations'>> {
    const { faker, projectId, externalIdPrefix } = this.ctx;

    const rows: Array<TablesInsert<'organizations'>> = passThroughFixed<TablesInsert<'organizations'>>(
      fragment.fixed,
      this.ctx
    );

    const n = fragment.count ?? 0;
    for (let i = 0; i < n; i++) {
      rows.push({
        external_id: `${externalIdPrefix}org_${String(i).padStart(2, '0')}`,
        project_id: projectId,
        name: { en: `${faker.company.name()} Party` },
        short_name: { en: `P${i + 1}` },
        color: { normal: faker.color.rgb(), dark: faker.color.rgb() },
        sort_order: i
        // `answers` omitted — DB default '{}' applies.
      });
    }

    return rows;
  }
}
