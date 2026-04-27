/**
 * ConstituenciesGenerator — foundation generator for `constituencies`.
 *
 * RESEARCH §4.5: `project_id` is required; `keywords` (jsonb) and `parent_id`
 * (self-FK, ON DELETE SET NULL) are optional. The self-FK is expressed as a ref
 * object `parent: { external_id }` that `_bulk_upsert_record` resolves server
 * side via the `constituencies` relationship (migration line 2640). The ref
 * object is NOT a column on the table — it is a stripped-before-RPC sentinel
 * shape (supabaseAdminClient.ts:184-185 / migration line 2625-2634).
 *
 * The generator declares the return type as `TablesInsert<'constituencies'>[]`
 * because that is the public contract consumers type against; internally we
 * widen rows to include the `parent` sentinel and cast back at return. The cast
 * is load-bearing: bulk_import DOES accept the `parent` ref object, but the
 * generated `TablesInsert` type does not model it (the shape comes from
 * Supabase's row-type introspection, which only sees columns).
 *
 * D-04/D-26/D-08 + GEN-02/GEN-04 apply — see ElectionsGenerator.ts.
 *
 * Cycle-avoidance: each generated row may optionally receive a `parent` ref
 * pointing at a row EARLIER in the same batch (`rows.length > 0` + backward-only
 * index). The self-FK is not modeled on `fixed[]` rows — users who need a parent
 * relationship on hand-authored rows can add `parent: { external_id }` directly;
 * the writer's strip logic treats sentinel refs on fixed rows the same as on
 * generated rows (they pass through to bulk_import unchanged).
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type ConstituenciesFragment = Fragment<TablesInsert<'constituencies'>>;

/**
 * Internal row shape — adds the `parent: { external_id }` sentinel ref that
 * bulk_import resolves to `parent_id` server-side.
 */
type ConstituencyRow = TablesInsert<'constituencies'> & {
  parent?: { external_id: string };
};

export class ConstituenciesGenerator {
  constructor(private ctx: Ctx) {}

  // Phase 56 ignores ctx here; Phase 57/58 generators read ctx.refs to scale counts.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaults(ctx: Ctx): ConstituenciesFragment {
    return { count: 2 };
  }

  generate(fragment: ConstituenciesFragment): Array<TablesInsert<'constituencies'>> {
    const { faker, projectId, externalIdPrefix } = this.ctx;
    const rows: Array<ConstituencyRow> = [];

    for (const fx of fragment.fixed ?? []) {
      rows.push({
        ...fx,
        external_id: `${externalIdPrefix}${fx.external_id}`,
        project_id: fx.project_id ?? projectId
      });
    }

    const n = fragment.count ?? 0;
    for (let i = 0; i < n; i++) {
      const row: ConstituencyRow = {
        external_id: `${externalIdPrefix}con_${String(i).padStart(2, '0')}`,
        project_id: projectId,
        name: { en: faker.location.state() },
        sort_order: i,
        is_generated: true
      };

      // Optional self-FK: ~30% of generated rows adopt a prior row as parent.
      // Backward-only index lookup prevents cycles by construction.
      if (rows.length > 0 && faker.number.int({ min: 1, max: 10 }) <= 3) {
        const parentIdx = faker.number.int({ min: 0, max: rows.length - 1 });
        const parentExtId = rows[parentIdx].external_id;
        if (parentExtId) row.parent = { external_id: parentExtId };
      }

      rows.push(row);
    }

    // The `parent` sentinel is stripped by bulk_import (see supabaseAdminClient.ts
    // line 184-185); consumers of this generator's output see it as well-typed
    // `TablesInsert<'constituencies'>[]` with an extra pass-through field.
    return rows as Array<TablesInsert<'constituencies'>>;
  }
}
