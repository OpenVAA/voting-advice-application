/**
 * Default-template alliances override — D-25 Overrides signature.
 *
 * Phase 67: hand-authored 2 alliances grouping 6 of 8 parties into ideological
 * blocs (D-01). Standalone parties (party_people, party_coast) exercise the
 * no-alliance UI path. Empirically exercises the v2.6 P64 supabase-adapter
 * reverse-fill of `organizationNominationIds` on Alliance parents
 * (supabaseDataProvider.ts:391-405) which had shipped without seed data.
 *
 * Scope split (after fallback applied during Plan 67-01 Task 5 integration
 * test): this override emits the 2 ALLIANCE ENTITY rows only (output.alliances
 * → bulk_import → alliances table). The 10 AllianceNomination rows live in
 * `nominations-override.ts` so they land in output.nominations → the
 * nominations table. Without this split, bulk_import routes all rows under
 * the override key to the same table and the polymorphic `alliance: { ... }`
 * ref on nomination rows is misinterpreted as a column on the alliances table.
 *
 * ALLIANCE_MEMBERSHIP and findAllianceForParty are exported so
 * `nominations-override.ts` can (a) emit alliance noms with constituency-
 * specific external_ids and (b) wire org-nom parent_nomination to the
 * matching alliance nom in the same constituency.
 *
 * No real Finnish coalition names (D-58-01); invented neutral names per D-04.
 * EN-only authoring + 4-locale auto-fan-out via
 * `defaultTemplate.generateTranslationsForAllLocales: true`.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../../types';

type AllianceEntityRow = Partial<TablesInsert<'alliances'>> & { external_id: string };

/**
 * Alliance → member-party external_ids (without the externalIdPrefix).
 * Locked by Phase 67 CONTEXT D-01:
 *   Alliance L: SDU, RF, GW (party_social, party_red, party_green) — Left bloc.
 *   Alliance R: BC, VC, RA (party_blue, party_values, party_rural) — Right bloc.
 *   Standalone (no alliance): party_people (PM), party_coast (CP) — exercises
 *   the party-without-alliance UI path. DO NOT add them to the map.
 */
export const ALLIANCE_MEMBERSHIP: Record<'alliance_L' | 'alliance_R', ReadonlyArray<string>> = {
  alliance_L: ['party_social', 'party_red', 'party_green'],
  alliance_R: ['party_blue', 'party_values', 'party_rural']
} as const;

/**
 * Returns 'L' / 'R' if `partyExtId` belongs to one of the alliances; undefined
 * for standalone parties (party_people, party_coast). Consumed by
 * `nominations-override.ts` to wire org-nom parent_nomination to the matching
 * alliance nom in the same constituency.
 *
 * `partyExtId` is the UNPREFIXED external_id (e.g. 'party_social'), not the
 * prefixed form ('seed_party_social'). Callers must strip the prefix first.
 */
export function findAllianceForParty(partyExtId: string): 'L' | 'R' | undefined {
  if (ALLIANCE_MEMBERSHIP.alliance_L.includes(partyExtId)) return 'L';
  if (ALLIANCE_MEMBERSHIP.alliance_R.includes(partyExtId)) return 'R';
  return undefined;
}

/**
 * Hand-authored alliance entity literals. Mirrors the 8-party shape in
 * `default.ts:88-152`. Names are invented + neutral per D-04 + D-58-01 — no
 * real Finnish coalition names. Colors are dark/neutral hues distinct from
 * member-party hues so the alliance entity is visually distinguishable.
 */
const ALLIANCE_ENTITY_ROWS: ReadonlyArray<{
  external_id: 'alliance_L' | 'alliance_R';
  name: { en: string };
  short_name: { en: string };
  color: { normal: string; dark: string };
  sort_order: number;
}> = [
  {
    external_id: 'alliance_L',
    name: { en: 'Progressive Front' },
    short_name: { en: 'PF' },
    // dark slate — distinct from member party hues (red/dark-red/green-teal)
    color: { normal: '#3a4660', dark: '#7d8da0' },
    sort_order: 0
  },
  {
    external_id: 'alliance_R',
    name: { en: 'Conservative Bloc' },
    short_name: { en: 'CB' },
    // dark gray-brown — distinct from member party hues (blue/purple/dark-green)
    color: { normal: '#5c4a3e', dark: '#a08c7e' },
    sort_order: 1
  }
] as const;

/**
 * Locked alliance keys per D-01. Exported so `nominations-override.ts` can
 * iterate the alliance noms without duplicating the literal.
 */
export const ALLIANCE_KEYS: ReadonlyArray<'L' | 'R'> = ['L', 'R'];

/**
 * Build the prefixed external_id for an alliance entity. Mirrors the
 * organization-entity prefix pattern at `default.ts:90` (`seed_party_blue`).
 */
export function allianceExtId(key: 'L' | 'R', externalIdPrefix: string): string {
  return `${externalIdPrefix}alliance_${key}`;
}

/**
 * Build the constituency-specific external_id for an alliance nomination.
 * Mirrors the org-nom external_id pattern at
 * `nominations-override.ts:147` (`seed_nom_org_<party>_<constituency>`).
 *
 * Constituency-specificity is critical (RESEARCH Pitfall 3): an org-nom in
 * c_03 must point at the alliance nom in c_03, not the alliance nom in c_01.
 */
export function allianceNomExtId(
  key: 'L' | 'R',
  constituencyExtId: string,
  externalIdPrefix: string
): string {
  return `${externalIdPrefix}nom_alliance_${key}_${constituencyExtId}`;
}

export function alliancesOverride(_fragment: unknown, ctx: Ctx): Array<Record<string, unknown>> {
  const { projectId, externalIdPrefix } = ctx;

  const rows: Array<AllianceEntityRow> = [];

  // Emit 2 Alliance entity rows — these populate the `alliances` table.
  // External_ids must include externalIdPrefix manually (overrides bypass
  // the per-table generator's prefixing logic in AlliancesGenerator.ts:35).
  // Alliance NOMINATION rows live in `nominations-override.ts` (they go to
  // the `nominations` table, not the `alliances` table — bulk_import routes
  // by override key, so dual-emitting from this file mis-routes).
  for (const ent of ALLIANCE_ENTITY_ROWS) {
    rows.push({
      external_id: `${externalIdPrefix}${ent.external_id}`,
      project_id: projectId,
      name: ent.name,
      short_name: ent.short_name,
      color: ent.color,
      sort_order: ent.sort_order,
      is_generated: false
    } satisfies AllianceEntityRow as AllianceEntityRow);
  }

  // Sanity-check count.
  if (rows.length !== ALLIANCE_ENTITY_ROWS.length) {
    throw new Error(
      `[dev-seed] alliancesOverride: emitted ${rows.length} alliance entity rows, expected ${ALLIANCE_ENTITY_ROWS.length}.`
    );
  }

  return rows as unknown as Array<Record<string, unknown>>;
}
