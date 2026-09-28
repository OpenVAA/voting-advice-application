/**
 * ElectionsGenerator — foundation generator for the `elections` table.
 *
 * `constructor(private ctx: Ctx)` captures the context; `generate(fragment)` returns typed `TablesInsert<'elections'>[]` rows; `defaults(ctx)` returns the fallback fragment used when a template does not supply one.
 *
 * Every emitted row carries `external_id = ${externalIdPrefix}${suffix}`. The `fixed` pass-through re-prefixes the user-supplied external_id and defaults `project_id` to `ctx.projectId`; all other user fields pass through.
 *
 * Sentinel policy: this generator does NOT emit the constituency-groups join sentinel — that sentinel is populated by the pipeline's post-topo pass after every generator has run, so the full `ctx.refs.constituency_groups` is known. Keeping generator output sentinel-free also means unit tests can assert raw `TablesInsert` shape without filtering sentinels.
 *
 * Scope — this generator emits English-only localized `name` / `short_name`; `fanOutLocales` layers the `generateTranslationsForAllLocales` expansion on top.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type ElectionsFragment = Fragment<TablesInsert<'elections'>>;

export class ElectionsGenerator {
  constructor(private ctx: Ctx) {}

  // `defaults` ignores ctx here; reading `ctx.refs` is how a generator would scale its counts.

  defaults(ctx: Ctx): ElectionsFragment {
    return { count: 1 };
  }

  generate(fragment: ElectionsFragment): Array<TablesInsert<'elections'>> {
    const { faker, projectId, externalIdPrefix, refDate } = this.ctx;
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
        // NominationsGenerator's `count` branch emits one candidate-type nomination per candidate with no parent_nomination and no organization ref, which is the candidate-only shape.
        election_type: 'candidate_only',
        election_date: faker.date.future({ years: 1, refDate }).toISOString().slice(0, 10),
        sort_order: i,
        multiple_rounds: false,
        current_round: 1
      });
    }

    return rows;
  }
}
