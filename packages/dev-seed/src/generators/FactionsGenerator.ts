/**
 * FactionsGenerator — foundation generator for the `factions` table.
 *
 * RESEARCH §4.10: `project_id` is required; standard DataObject scaffolding
 * otherwise. Factions have no content FK refs on this table — the hierarchical
 * relationship between a faction and its candidates is expressed through
 * `nominations` (`parent_nomination` + `entity_type='faction'`), not here.
 *
 * D-04/D-26/D-08 + GEN-02/GEN-04 apply — see ElectionsGenerator.ts.
 *
 * Default count = 0: factions are uncommon in VAA datasets and templates enable
 * them explicitly via `factions: { count: N }`. Keeping the default off prevents
 * surprise rows during smoke-tests of the `{}` template.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type FactionsFragment = Fragment<TablesInsert<'factions'>>;

export class FactionsGenerator {
  constructor(private ctx: Ctx) {}

  // Phase 56 ignores ctx here; Phase 57/58 generators read ctx.refs to scale counts.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaults(ctx: Ctx): FactionsFragment {
    return { count: 0 };
  }

  generate(fragment: FactionsFragment): Array<TablesInsert<'factions'>> {
    const { faker, projectId, externalIdPrefix } = this.ctx;
    const rows: Array<TablesInsert<'factions'>> = [];

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
        external_id: `${externalIdPrefix}faction_${String(i).padStart(2, '0')}`,
        project_id: projectId,
        name: { en: `${faker.word.adjective()} Faction` },
        sort_order: i,
        is_generated: true
      });
    }

    return rows;
  }
}
