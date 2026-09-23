/**
 * AlliancesGenerator — foundation generator for the `alliances` table.
 *
 * Schema: `project_id` is required; standard DataObject scaffolding otherwise; no content FK refs on this table.
 *
 * apply — see ElectionsGenerator.ts.
 *
 * Default count = 0: alliances are uncommon in VAA datasets; templates enable them explicitly via `alliances: { count: N }`. Keeping the default off prevents surprise rows during smoke-tests of the `{}` template.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type AlliancesFragment = Fragment<TablesInsert<'alliances'>>;

export class AlliancesGenerator {
  constructor(private ctx: Ctx) {}

  // `defaults` ignores ctx here; reading `ctx.refs` is how a generator would scale its counts.

  defaults(ctx: Ctx): AlliancesFragment {
    return { count: 0 };
  }

  generate(fragment: AlliancesFragment): Array<TablesInsert<'alliances'>> {
    const { faker, projectId, externalIdPrefix } = this.ctx;
    const rows: Array<TablesInsert<'alliances'>> = [];

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
        external_id: `${externalIdPrefix}alliance_${String(i).padStart(2, '0')}`,
        project_id: projectId,
        name: { en: `${faker.word.adjective()} ${faker.word.noun()} Alliance` },
        sort_order: i,
        is_generated: true
      });
    }

    return rows;
  }
}
