/**
 * Default-template nominations override — D-25 Overrides signature.
 *
 * Replaces Phase 56 NominationsGenerator's "all-on-constituency-0" emission
 * with a per-(party × constituency) matrix distribution. Every (party,
 * constituency) cell carries ≥1 candidate, so every constituency has the full
 * 8-party slate and every party fields candidates in every constituency.
 *
 * Distribution shape (Phase 64 manual-smoke densification):
 *   PARTY_CONSTITUENCY_MATRIX[p][c] = candidate count for party p in constituency c.
 *   Linear interpolation between four corners:
 *     largest party  × largest constituency  = 15
 *     smallest party × largest constituency  =  5
 *     largest party  × smallest constituency =  9
 *     smallest party × smallest constituency =  3
 *
 *   Row sums (party totals) MUST equal PARTY_WEIGHTS in candidates-override:
 *     [61, 56, 49, 43, 38, 33, 26, 21] = 327
 *   Column sums (constituency totals):
 *     [80, 74, 66, 59, 48] = 327
 *
 *   Constituencies in `ctx.refs.constituencies` are interpreted in ref order
 *   (largest first). The default template's fixed[] block is ordered c_01 →
 *   c_05 to align.
 *
 * Each candidate-type nomination is wired via `parent_nomination` to an
 * organization-type nomination of its party in the same constituency. The
 * validate_nomination DB trigger requires this constituency identity to hold;
 * it does. With the matrix dense (every cell > 0), 8 × C org nominations are
 * emitted (40 for C=5).
 *
 * Party clustering for matching/compass purposes is unaffected — that's
 * driven by the latent-factor answer model, not by geographic wiring.
 *
 * Phase 58 UAT follow-up (2026-04-23); Phase 64 manual-smoke densification +
 * parent_nomination wiring (2026-04-28); Phase 67 extends parent_nomination
 * to wire org-noms whose party belongs to an alliance (per ALLIANCE_MEMBERSHIP)
 * up to the alliance nom in the same constituency. This is what makes the v2.6
 * P64 supabase-adapter reverse-fill of `organizationNominationIds` on Alliance
 * parents (supabaseDataProvider.ts:391-405) populate non-empty arrays at
 * runtime — without this wiring, the reverse-fill stays dev-blind even with
 * alliance entities + alliance noms in the DB.
 */

import { ALLIANCE_KEYS, allianceExtId, allianceNomExtId, findAllianceForParty } from './alliances-override';
import { PARTY_WEIGHTS } from './candidates-override';
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../../types';

type CandidateRef = { candidate: { external_id: string } };
type OrganizationRef = { organization: { external_id: string } };
type AllianceRef = { alliance: { external_id: string } };
type ParentRef = { parent_nomination: { external_id: string } };

type CandidateNominationRow = Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> &
  CandidateRef &
  ParentRef & {
    election: { external_id: string };
    constituency: { external_id: string };
  };

type OrganizationNominationRow = Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> &
  OrganizationRef &
  Partial<ParentRef> & {
    election: { external_id: string };
    constituency: { external_id: string };
  };

type AllianceNominationRow = Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> &
  AllianceRef & {
    election: { external_id: string };
    constituency: { external_id: string };
  };

type NominationRow = CandidateNominationRow | OrganizationNominationRow | AllianceNominationRow;

/**
 * Per-(party × constituency) candidate count matrix.
 *
 * Rows = parties in PARTY_WEIGHTS order (sorted descending in size).
 * Cols = constituencies in `ctx.refs.constituencies` order (sorted descending
 *        in size by template convention — largest first).
 *
 * Linear-interpolated between four corners:
 *   M[0][0] = 15  (largest party in largest constituency)
 *   M[7][0] =  5  (smallest party in largest constituency)
 *   M[0][4] =  9  (largest party in smallest constituency)
 *   M[7][4] =  3  (smallest party in smallest constituency)
 *
 * Row sums = PARTY_WEIGHTS = [61, 56, 49, 43, 38, 33, 26, 21] = 327
 * Col sums = [80, 74, 66, 59, 48] = 327
 *
 * Every cell > 0 so every (party, constituency) pair gets at least one
 * candidate AND one organization-type nomination — every constituency
 * shows the full 8-party slate in the voter app's filter modal.
 */
export const PARTY_CONSTITUENCY_MATRIX: ReadonlyArray<ReadonlyArray<number>> = [
  [15, 14, 12, 11, 9],
  [14, 13, 11, 10, 8],
  [12, 11, 10, 9, 7],
  [11, 10, 9, 7, 6],
  [9, 8, 8, 7, 6],
  [8, 7, 7, 6, 5],
  [6, 6, 5, 5, 4],
  [5, 5, 4, 4, 3]
] as const;

export function nominationsOverride(_fragment: unknown, ctx: Ctx): Array<Record<string, unknown>> {
  const { projectId, externalIdPrefix, refs } = ctx;
  const candidates = refs.candidates;
  const constituencies = refs.constituencies;
  const elections = refs.elections;
  const organizations = refs.organizations;

  if (
    candidates.length === 0 ||
    constituencies.length === 0 ||
    elections.length === 0 ||
    organizations.length === 0
  ) {
    throw new Error(
      '[dev-seed] nominationsOverride: ctx.refs is empty for candidates / constituencies / elections / organizations. ' +
        'Ensure the pipeline runs in D-06 topo order and that the template requests non-zero counts.'
    );
  }

  if (organizations.length !== PARTY_WEIGHTS.length) {
    throw new Error(
      `[dev-seed] nominationsOverride: expected ${PARTY_WEIGHTS.length} organizations (matching PARTY_WEIGHTS), got ${organizations.length}. ` +
        'PARTY_WEIGHTS in candidates-override.ts and the organizations.fixed[] block in default.ts must stay aligned.'
    );
  }

  if (PARTY_CONSTITUENCY_MATRIX.length !== PARTY_WEIGHTS.length) {
    throw new Error(
      `[dev-seed] nominationsOverride: PARTY_CONSTITUENCY_MATRIX has ${PARTY_CONSTITUENCY_MATRIX.length} rows but PARTY_WEIGHTS has ${PARTY_WEIGHTS.length}. The matrix and weights must agree on party count.`
    );
  }

  if (constituencies.length !== PARTY_CONSTITUENCY_MATRIX[0].length) {
    throw new Error(
      `[dev-seed] nominationsOverride: PARTY_CONSTITUENCY_MATRIX has ${PARTY_CONSTITUENCY_MATRIX[0].length} columns but ctx.refs.constituencies has ${constituencies.length} entries. The matrix and constituencies.fixed[] must agree on column count.`
    );
  }

  // Validate row sums match PARTY_WEIGHTS (matrix integrity gate). If a future
  // edit changes the matrix without updating PARTY_WEIGHTS (or vice versa) the
  // candidate→constituency walk would silently desynchronize from the candidate→
  // party walk — fail loudly here instead.
  for (let p = 0; p < PARTY_CONSTITUENCY_MATRIX.length; p++) {
    const rowSum = PARTY_CONSTITUENCY_MATRIX[p].reduce((s, x) => s + x, 0);
    if (rowSum !== PARTY_WEIGHTS[p]) {
      throw new Error(
        `[dev-seed] nominationsOverride: PARTY_CONSTITUENCY_MATRIX row ${p} sums to ${rowSum} but PARTY_WEIGHTS[${p}] is ${PARTY_WEIGHTS[p]}. The matrix and weights must stay aligned.`
      );
    }
  }

  const electionExtId = elections[0].external_id;

  function orgNomExtId(orgIdx: number, constIdx: number): string {
    return `${externalIdPrefix}nom_org_${organizations[orgIdx].external_id}_${constituencies[constIdx].external_id}`;
  }

  const rows: Array<NominationRow> = [];

  // Phase 67: emit 10 alliance-type nominations FIRST — 2 alliances ×
  // 5 constituencies (D-02). These have NO parent_nomination per
  // 011-validation-functions.sql:265 (validate_nomination trigger raises if
  // an alliance nom has a parent). External_id is constituency-specific so
  // org-noms in c_03 reference the alliance nom in c_03, not c_01
  // (RESEARCH Pitfall 3). The alliance entity rows themselves are emitted
  // upstream at TOPO_ORDER index 6 by `alliancesOverride` in
  // `defaults/alliances-override.ts` (output.alliances → alliances table);
  // the 10 nomination rows go to output.nominations → nominations table.
  for (const allianceKey of ALLIANCE_KEYS) {
    for (const constituency of constituencies) {
      rows.push({
        external_id: allianceNomExtId(allianceKey, constituency.external_id, externalIdPrefix),
        project_id: projectId,
        alliance: { external_id: allianceExtId(allianceKey, externalIdPrefix) },
        election: { external_id: electionExtId },
        constituency: { external_id: constituency.external_id },
        election_round: 1
      });
    }
  }

  // Emit org-type nominations: one per (party × constituency) cell
  // where the matrix has a non-zero count. With the dense matrix, all
  // P × C cells have ≥1 candidate, so all P × C org nominations are emitted.
  // bulk_import resolves parent_nomination external_ids regardless of literal
  // ordering, but emitting parents before children keeps the row sequence
  // self-documenting.
  for (let p = 0; p < PARTY_CONSTITUENCY_MATRIX.length; p++) {
    for (let c = 0; c < PARTY_CONSTITUENCY_MATRIX[p].length; c++) {
      if (PARTY_CONSTITUENCY_MATRIX[p][c] === 0) continue;
      // Phase 67: organizations[p].external_id is the PREFIXED id (e.g.
      // 'seed_party_social') because the per-table generator at
      // OrganizationsGenerator runs before this override and prefixes it.
      // findAllianceForParty expects the UNPREFIXED form, so strip the prefix
      // first. If the prefix isn't present, partyExtIdRaw is unchanged
      // (defensive — should never happen in the default template).
      const partyExtIdPrefixed = organizations[p].external_id;
      const partyExtIdRaw = partyExtIdPrefixed.startsWith(externalIdPrefix)
        ? partyExtIdPrefixed.slice(externalIdPrefix.length)
        : partyExtIdPrefixed;
      const allianceKey = findAllianceForParty(partyExtIdRaw); // 'L' | 'R' | undefined
      const constituencyExtId = constituencies[c].external_id;
      rows.push({
        external_id: orgNomExtId(p, c),
        project_id: projectId,
        organization: { external_id: partyExtIdPrefixed },
        election: { external_id: electionExtId },
        constituency: { external_id: constituencyExtId },
        election_round: 1,
        // Phase 67: wire alliance parent if this party belongs to an alliance.
        // Standalone parties (party_people, party_coast) get no parent and
        // exercise the no-alliance UI path. The alliance nom external_id format
        // MUST be constituency-specific (Pitfall 3) — alliance nom in c_03 is
        // the parent of org-noms in c_03, NOT alliance nom in c_01.
        ...(allianceKey
          ? {
              parent_nomination: {
                external_id: `${externalIdPrefix}nom_alliance_${allianceKey}_${constituencyExtId}`
              }
            }
          : {})
      });
    }
  }

  // Emit candidate nominations. Walk per-party (matching candidates-override's
  // PARTY_WEIGHTS expansion: candidates 0..PARTY_WEIGHTS[0]-1 belong to party 0,
  // etc.); within each party, distribute across constituencies per the matrix
  // row. Each candidate's parent_nomination references the (party, constituency)
  // org nomination emitted above.
  let candIdx = 0;
  for (let p = 0; p < PARTY_CONSTITUENCY_MATRIX.length; p++) {
    for (let c = 0; c < PARTY_CONSTITUENCY_MATRIX[p].length; c++) {
      const cellCount = PARTY_CONSTITUENCY_MATRIX[p][c];
      for (let k = 0; k < cellCount; k++) {
        const cand = candidates[candIdx];
        rows.push({
          external_id: `${externalIdPrefix}nom_cand_${String(candIdx).padStart(4, '0')}`,
          project_id: projectId,
          candidate: { external_id: cand.external_id },
          parent_nomination: { external_id: orgNomExtId(p, c) },
          election: { external_id: electionExtId },
          constituency: { external_id: constituencies[c].external_id },
          election_round: 1
        });
        candIdx += 1;
      }
    }
  }

  if (candIdx !== candidates.length) {
    throw new Error(
      `[dev-seed] nominationsOverride: assigned ${candIdx} candidates but ctx.refs.candidates has ${candidates.length}. PARTY_CONSTITUENCY_MATRIX total (${candIdx}) must equal candidates.count.`
    );
  }

  return rows as unknown as Array<Record<string, unknown>>;
}
