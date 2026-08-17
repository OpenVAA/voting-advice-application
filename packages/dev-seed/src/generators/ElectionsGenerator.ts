/**
 * ElectionsGenerator — foundation generator for the `elections` table.
 *
 * class with `constructor(private ctx: Ctx)` capturing context at
 * construction; `generate(fragment)` returns typed `TablesInsert<'elections'>[]`
 * rows; `defaults(ctx)` returns the fallback fragment used when a template does
 * not supply one.
 *
 * every emitted row carries `external_id = `${externalIdPrefix}${suffix}`.
 * `fixed ` pass-through re-prefixes the user-supplied external_id and
 * defaults `project_id` to `ctx.projectId`; all other user fields pass through.
 *
 * Sentinel policy: this generator does NOT emit the constituency-groups join
 * sentinel — that sentinel (see RESEARCH) is populated by Plan 07's
 * post-topo pass after every generator has run, so the full
 * `ctx.refs.constituency_groups` is known. Keeping generator output
 * sentinel-free also means unit tests can assert raw `TablesInsert` shape
 * without filtering sentinels.
 *
 * Scope — see phase 56 emits English-only localized `name` / `short_name`; see phase 58
 * layers the `generateTranslationsForAllLocales` fan-out.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type ElectionsFragment = Fragment<TablesInsert<'elections'>>;

export class ElectionsGenerator {
  constructor(private ctx: Ctx) {}

  // see phase 56 ignores ctx here; see phase 57/58 generators read ctx.refs to scale counts.

  defaults(ctx: Ctx): ElectionsFragment {
    return { count: 1 };
  }

  generate(fragment: ElectionsFragment): Array<TablesInsert<'elections'>> {
    const { faker, projectId, externalIdPrefix } = this.ctx;
    const rows: Array<TablesInsert<'elections'>> = [];

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
        external_id: `${externalIdPrefix}election_${String(i).padStart(2, '0')}`,
        project_id: projectId,
        name: { en: faker.lorem.words({ min: 2, max: 4 }) },
        short_name: { en: `E${i + 1}` },
        election_type: 'general',
        election_date: faker.date.future({ years: 1 }).toISOString().slice(0, 10),
        is_generated: true,
        sort_order: i,
        multiple_rounds: false,
        current_round: 1
      });
    }

    return rows;
  }
}
