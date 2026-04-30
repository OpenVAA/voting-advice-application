/**
 * Default-template alliances override — D-25 Overrides signature.
 *
 * Phase 67: hand-authored 2 alliances grouping 6 of 8 parties into ideological
 * blocs (D-01) + 10 AllianceNomination rows (2 alliances × 5 constituencies)
 * (D-02). Standalone parties (party_people, party_coast) exercise the
 * no-alliance UI path. Empirically exercises the v2.6 P64 supabase-adapter
 * reverse-fill of `organizationNominationIds` on Alliance parents
 * (supabaseDataProvider.ts:391-405) which had shipped without seed data.
 *
 * ALLIANCE_MEMBERSHIP and findAllianceForParty are exported so
 * `nominations-override.ts` can wire org-nom parent_nomination to the
 * matching alliance nom in the same constituency.
 *
 * No real Finnish coalition names (D-58-01); invented neutral names per D-04.
 * EN-only authoring + 4-locale auto-fan-out via
 * `defaultTemplate.generateTranslationsForAllLocales: true`.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../../types';

type AllianceRef = { alliance: { external_id: string } };

type AllianceEntityRow = Partial<TablesInsert<'alliances'>> & { external_id: string };

type AllianceNominationRow = Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> &
  AllianceRef & {
    election: { external_id: string };
    constituency: { external_id: string };
  };

type AllianceRow = AllianceEntityRow | AllianceNominationRow;

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

const allianceExtId = (key: 'L' | 'R', externalIdPrefix: string): string =>
  `${externalIdPrefix}alliance_${key}`;

const allianceNomExtId = (key: 'L' | 'R', constituencyExtId: string, externalIdPrefix: string): string =>
  `${externalIdPrefix}nom_alliance_${key}_${constituencyExtId}`;

export function alliancesOverride(_fragment: unknown, ctx: Ctx): Array<Record<string, unknown>> {
  const { projectId, externalIdPrefix, refs } = ctx;
  const constituencies = refs.constituencies;
  const elections = refs.elections;
  const organizations = refs.organizations;

  // refs.alliances is EMPTY here — this override populates it. Guard the
  // upstream refs that MUST be populated by TOPO_ORDER (organizations,
  // constituencies, elections all run before alliances at index 6).
  if (constituencies.length === 0 || elections.length === 0 || organizations.length === 0) {
    throw new Error(
      '[dev-seed] alliancesOverride: ctx.refs is empty for constituencies / elections / organizations. ' +
        'Ensure the pipeline runs in D-06 topo order and that the template requests non-zero counts.'
    );
  }

  const electionExtId = elections[0].external_id;

  const rows: Array<AllianceRow> = [];

  // 1. Emit 2 Alliance entity rows — these populate the `alliances` table.
  //    External_ids must include externalIdPrefix manually (overrides bypass
  //    the per-table generator's prefixing logic in AlliancesGenerator.ts:35).
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

  // 2. Emit 10 AllianceNomination rows — 2 alliances × 5 constituencies (D-02).
  //    Each row has alliance + election + constituency polymorphic refs;
  //    NO parent_nomination — alliance noms cannot have parents per
  //    011-validation-functions.sql:265 ("Alliance nominations cannot have a parent").
  //    External_id naming MUST be constituency-specific so org-noms in c_01
  //    point at the alliance nom in c_01 (Pitfall 3 from RESEARCH).
  const allianceKeys: ReadonlyArray<'L' | 'R'> = ['L', 'R'];
  for (const key of allianceKeys) {
    for (const constituency of constituencies) {
      rows.push({
        external_id: allianceNomExtId(key, constituency.external_id, externalIdPrefix),
        project_id: projectId,
        alliance: { external_id: allianceExtId(key, externalIdPrefix) },
        election: { external_id: electionExtId },
        constituency: { external_id: constituency.external_id },
        election_round: 1
      } satisfies AllianceNominationRow as AllianceNominationRow);
    }
  }

  // Sanity-check counts. This file is the only emitter; 2 entities + (2 × C) noms.
  const expectedRows = ALLIANCE_ENTITY_ROWS.length + allianceKeys.length * constituencies.length;
  if (rows.length !== expectedRows) {
    throw new Error(
      `[dev-seed] alliancesOverride: emitted ${rows.length} rows, expected ${expectedRows} (2 entities + 2 alliances × ${constituencies.length} constituencies).`
    );
  }

  return rows as unknown as Array<Record<string, unknown>>;
}
