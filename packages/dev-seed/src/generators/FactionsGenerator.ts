/**
 * FactionsGenerator — foundation generator for the `factions` table.
 *
 * Schema: `project_id` and `organization_id` are both required; standard DataObject scaffolding otherwise. 162-07b added the organization foreign key as `NOT NULL ... ON DELETE CASCADE`, because a faction with no organization is not a meaningful row. The relationship between a faction and its CANDIDATES is still expressed through `nominations` (`parent_nomination` + `entity_type='faction'`) and not here; this column is the faction's own parent organization, which 162-12 reads when it tightens `validate_nomination()`.
 *
 * Ref shape: `organization: { external_id }` → `_bulk_upsert_record` resolves it to `factions.organization_id` at write time, via the `WHEN 'factions'` arm of its `CASE p_table_name` block. That arm and `RELATIONSHIP_REFS` in `../template/permittedKeys` are held together by a two-directional parity test.
 *
 * Ref dependencies (the pipeline must run generators in topological order):
 *   - `ctx.refs.organizations` — factions round-robin pick an organization, exactly as `CandidatesGenerator` does, so the mapping is deterministic under a seeded faker.
 *
 * ⚠ **An empty organization ref list is a THROW here, not an omission**, and that is the one place this generator deliberately differs from `CandidatesGenerator`. On candidates the reference is optional and a missing one costs a party cluster; here the column is `NOT NULL`, so a row without it cannot be written at all. Omitting it would surface as a bare not-null violation from inside `bulk_import`, in Postgres's vocabulary, with no indication of which template fragment caused it. Raising here names the fragment instead.
 *
 * apply — see ElectionsGenerator.ts.
 *
 * Default count = 0: factions are uncommon in VAA datasets and templates enable them explicitly via `factions: { count: N }`. Keeping the default off prevents surprise rows during smoke-tests of the `{}` template.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type FactionsFragment = Fragment<TablesInsert<'factions'>>;

/**
 * FactionRow carries the organization reference that `_bulk_upsert_record` resolves to the `organization_id` column. It is a REF, not the column: the column is `NOT NULL` and is filled in by the RPC from the `external_id` lookup, so a generated row names the organization and never its uuid.
 */
type FactionRow = Omit<TablesInsert<'factions'>, 'organization_id'> & {
  organization?: { external_id: string };
};

export class FactionsGenerator {
  constructor(private ctx: Ctx) {}

  // `defaults` ignores ctx here; reading `ctx.refs` is how a generator would scale its counts.

  defaults(ctx: Ctx): FactionsFragment {
    return { count: 0 };
  }

  generate(fragment: FactionsFragment): Array<FactionRow> {
    const { faker, projectId, externalIdPrefix, refs } = this.ctx;
    const rows: Array<FactionRow> = [];

    for (const fx of fragment.fixed ?? []) {
      rows.push({
        ...fx,
        external_id: `${externalIdPrefix}${fx.external_id}`,
        project_id: fx.project_id ?? projectId
      } as FactionRow);
    }

    const n = fragment.count ?? 0;

    // Raise BEFORE the loop rather than per row, so a template asking for fifty factions with no organizations reports the fragment once rather than fifty times. The message names the template's own vocabulary — the `factions` fragment and the `organizations` one it depends on — because the alternative is a not-null violation surfacing from inside `bulk_import` naming only a column.
    if (n > 0 && refs.organizations.length === 0) {
      throw new Error(
        `FactionsGenerator: the template asks for ${n} faction(s) but no organizations exist to attach them to. factions.organization_id is NOT NULL, so every faction needs a parent organization. Add an \`organizations\` fragment with at least one row, or set \`factions: { count: 0 }\`.`
      );
    }

    for (let i = 0; i < n; i++) {
      // Pick organization round-robin — `i % N` with a seeded faker means reruns produce identical faction → organization mappings, exactly as CandidatesGenerator's pick does.
      const organization = refs.organizations[i % refs.organizations.length];

      rows.push({
        external_id: `${externalIdPrefix}faction_${String(i).padStart(2, '0')}`,
        project_id: projectId,
        organization: { external_id: organization.external_id },
        name: { en: `${faker.word.adjective()} Faction` },
        sort_order: i,
        is_generated: true
      });
    }

    return rows;
  }
}
