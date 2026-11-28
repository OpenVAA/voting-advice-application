/**
 * ElectionsGenerator — foundation generator for the `elections` table.
 *
 * `constructor(private ctx: Ctx)` captures the context; `generate(fragment)` returns typed `TablesInsert<'elections'>[]` rows. The count used when a template's fragment sets none is `DEFAULT_COUNTS.elections` in `pipeline.ts`.
 *
 * Every emitted row carries `external_id = ${externalIdPrefix}${suffix}`. The `fixed` pass-through re-prefixes the user-supplied external_id and defaults `project_id` to `ctx.projectId`; all other user fields pass through.
 *
 * Sentinel policy: this generator does NOT emit the constituency-groups join sentinel — that sentinel is populated by the pipeline's post-topo pass after every generator has run, so the full `ctx.refs.constituency_groups` is known. Keeping generator output sentinel-free also means unit tests can assert raw `TablesInsert` shape without filtering sentinels.
 *
 * Scope — this generator emits English-only localized `name` / `short_name`; `fanOutLocales` layers the `generateTranslationsForAllLocales` expansion on top.
 */

import { passThroughFixed } from './passThroughFixed';
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type ElectionsFragment = Fragment<TablesInsert<'elections'>>;

export class ElectionsGenerator {
  constructor(private ctx: Ctx) {}

  generate(fragment: ElectionsFragment): Array<TablesInsert<'elections'>> {
    const { faker, projectId, externalIdPrefix, refDate } = this.ctx;

    const rows: Array<TablesInsert<'elections'>> = passThroughFixed<TablesInsert<'elections'>>(
      fragment.fixed,
      this.ctx
    );

    const n = fragment.count ?? 0;
    for (let i = 0; i < n; i++) {
      rows.push({
        external_id: `${externalIdPrefix}election_${String(i).padStart(2, '0')}`,
        project_id: projectId,
        name: { en: faker.lorem.words({ min: 2, max: 4 }) },
        short_name: { en: `E${i + 1}` },
        // The default nomination shape admits every row the generators and a template's `fixed[]` rows can express: the parent-less candidate nominations of NominationsGenerator's `count` branch, and organization, alliance and faction nominations beside them.
        nomination_shape: 'organization_list_and_independents',
        election_date: faker.date.future({ years: 1, refDate }).toISOString().slice(0, 10),
        sort_order: i,
        multiple_rounds: false,
        current_round: 1
      });
    }

    return rows;
  }
}
