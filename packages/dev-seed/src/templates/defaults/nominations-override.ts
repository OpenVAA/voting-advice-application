/**
 * Default-template nominations override.
 *
 * Replaces the NominationsGenerator's "all-on-constituency-0" emission with a per-(organization × constituency) matrix distribution. Every (organization, constituency) cell carries ≥1 candidate, so every constituency has the full 8-organization slate and every organization fields candidates in every constituency.
 *
 * Distribution shape:
 *   ORGANIZATION_CONSTITUENCY_MATRIX[p][c] = candidate count for organization p in constituency c.
 *   Linear interpolation between four corners: largest organization  × largest constituency  = 15 smallest organization × largest constituency  =  5 largest organization  × smallest constituency =  9 smallest organization × smallest constituency =  3
 *
 *   Row sums (organization totals) MUST equal ORGANIZATION_WEIGHTS in candidates-override: [61, 56, 49, 43, 38, 33, 26, 21] = 327 Column sums (constituency totals): [80, 74, 66, 59, 48] = 327
 *
 *   Constituencies in `ctx.refs.constituencies` are interpreted in ref order (largest first). The default template's fixed[] block is ordered con_01 → con_05 to align.
 *
 * Each candidate-type nomination is wired via `parent_nomination` to an organization-type nomination of its organization in the same constituency. The validate_nomination DB trigger requires this constituency identity to hold; it does. With the matrix dense (every cell > 0), 8 × C org nominations are emitted (40 for C=5).
 *
 * Organization clustering for matching/compass purposes is unaffected — that's driven by the latent-factor answer model, not by geographic wiring.
 *
 * parent_nomination also wires org-noms whose organization belongs to an alliance (per ALLIANCE_MEMBERSHIP) up to the alliance nom in the same constituency.
 * This is what makes the supabase-adapter reverse-fill of `organizationNominationIds` on Alliance parents (supabaseDataProvider.ts:391-405) populate non-empty arrays at runtime — without this wiring, the reverse-fill stays dev-blind even with alliance entities + alliance noms in the DB.
 */

import { ALLIANCE_KEYS, allianceExtId, allianceNomExtId, findAllianceForOrganization } from './alliances-override';
import { ORGANIZATION_WEIGHTS } from './candidates-override';
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
 * Per-(organization × constituency) candidate count matrix.
 *
 * Rows = organizations in ORGANIZATION_WEIGHTS order (sorted descending in size).
 * Cols = constituencies in `ctx.refs.constituencies` order (sorted descending
 *        in size by template convention — largest first).
 *
 * Linear-interpolated between four corners:
 *   M[0][0] = 15  (largest organization in largest constituency) M[7][0] =  5  (smallest organization in largest constituency) M[0][4] =  9  (largest organization in smallest constituency) M[7][4] =  3  (smallest organization in smallest constituency)
 *
 * Row sums = ORGANIZATION_WEIGHTS = [61, 56, 49, 43, 38, 33, 26, 21] = 327 Col sums = [80, 74, 66, 59, 48] = 327
 *
 * Every cell > 0 so every (organization, constituency) pair gets at least one candidate AND one organization-type nomination — every constituency shows the full 8-organization slate in the voter app's filter modal.
 */
export const ORGANIZATION_CONSTITUENCY_MATRIX: ReadonlyArray<ReadonlyArray<number>> = [
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

  if (candidates.length === 0 || constituencies.length === 0 || elections.length === 0 || organizations.length === 0) {
    throw new Error(
      '[dev-seed] nominationsOverride: ctx.refs is empty for candidates / constituencies / elections / organizations. ' +
        'Ensure the pipeline runs in topological order and that the template requests non-zero counts.'
    );
  }

  if (organizations.length !== ORGANIZATION_WEIGHTS.length) {
    throw new Error(
      `[dev-seed] nominationsOverride: expected ${ORGANIZATION_WEIGHTS.length} organizations (matching ORGANIZATION_WEIGHTS), got ${organizations.length}. ` +
        'ORGANIZATION_WEIGHTS in candidates-override.ts and the organizations.fixed[] block in default.ts must stay aligned.'
    );
  }

  if (ORGANIZATION_CONSTITUENCY_MATRIX.length !== ORGANIZATION_WEIGHTS.length) {
    throw new Error(
      `[dev-seed] nominationsOverride: ORGANIZATION_CONSTITUENCY_MATRIX has ${ORGANIZATION_CONSTITUENCY_MATRIX.length} rows but ORGANIZATION_WEIGHTS has ${ORGANIZATION_WEIGHTS.length}. The matrix and weights must agree on organization count.`
    );
  }

  if (constituencies.length !== ORGANIZATION_CONSTITUENCY_MATRIX[0].length) {
    throw new Error(
      `[dev-seed] nominationsOverride: ORGANIZATION_CONSTITUENCY_MATRIX has ${ORGANIZATION_CONSTITUENCY_MATRIX[0].length} columns but ctx.refs.constituencies has ${constituencies.length} entries. The matrix and constituencies.fixed[] must agree on column count.`
    );
  }

  // Validate row sums match ORGANIZATION_WEIGHTS (matrix integrity gate). If a future edit changes the matrix without updating ORGANIZATION_WEIGHTS (or vice versa) the candidate→constituency walk would silently desynchronize from the candidate→ organization walk — fail loudly here instead.
  for (let p = 0; p < ORGANIZATION_CONSTITUENCY_MATRIX.length; p++) {
    const rowSum = ORGANIZATION_CONSTITUENCY_MATRIX[p].reduce((s, x) => s + x, 0);
    if (rowSum !== ORGANIZATION_WEIGHTS[p]) {
      throw new Error(
        `[dev-seed] nominationsOverride: ORGANIZATION_CONSTITUENCY_MATRIX row ${p} sums to ${rowSum} but ORGANIZATION_WEIGHTS[${p}] is ${ORGANIZATION_WEIGHTS[p]}. The matrix and weights must stay aligned.`
      );
    }
  }

  const electionExtId = elections[0].external_id;

  function orgNomExtId(orgIdx: number, constIdx: number): string {
    return `${externalIdPrefix}nom_org_${organizations[orgIdx].external_id}_${constituencies[constIdx].external_id}`;
  }

  const rows: Array<NominationRow> = [];

  // Emit 10 alliance-type nominations FIRST — 2 alliances × 5 constituencies.
  // These have NO parent_nomination per 011-validation-functions.sql:265 (validate_nomination trigger raises if an alliance nom has a parent).
  // External_id is constituency-specific so org-noms in con_03 reference the alliance nom in con_03, not con_01. The alliance entity rows themselves are emitted upstream by `alliancesOverride` in `defaults/alliances-override.ts` (output.alliances → alliances table); the 10 nomination rows go to output.nominations → nominations table.
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

  // Emit org-type nominations: one per (organization × constituency) cell where the matrix has a non-zero count. With the dense matrix, all P × C cells have ≥1 candidate, so all P × C org nominations are emitted.
  // bulk_import resolves parent_nomination external_ids regardless of literal ordering, but emitting parents before children keeps the row sequence self-documenting.
  for (let p = 0; p < ORGANIZATION_CONSTITUENCY_MATRIX.length; p++) {
    for (let c = 0; c < ORGANIZATION_CONSTITUENCY_MATRIX[p].length; c++) {
      if (ORGANIZATION_CONSTITUENCY_MATRIX[p][c] === 0) continue;
      // organizations[p].external_id is the PREFIXED id (e.g.
      // 'seed_org_social') because the per-table generator at OrganizationsGenerator runs before this override and prefixes it.
      // findAllianceForOrganization expects the UNPREFIXED form, so strip the prefix first. If the prefix isn't present, organizationExtIdRaw is unchanged (defensive — should never happen in the default template).
      const organizationExtIdPrefixed = organizations[p].external_id;
      const organizationExtIdRaw = organizationExtIdPrefixed.startsWith(externalIdPrefix)
        ? organizationExtIdPrefixed.slice(externalIdPrefix.length)
        : organizationExtIdPrefixed;
      const allianceKey = findAllianceForOrganization(organizationExtIdRaw); // 'L' | 'R' | undefined
      const constituencyExtId = constituencies[c].external_id;
      rows.push({
        external_id: orgNomExtId(p, c),
        project_id: projectId,
        organization: { external_id: organizationExtIdPrefixed },
        election: { external_id: electionExtId },
        constituency: { external_id: constituencyExtId },
        election_round: 1,
        // Wire alliance parent if this organization belongs to an alliance.
        // Standalone organizations (org_people, org_coast) get no parent and exercise the no-alliance UI path. The alliance nom external_id format MUST be constituency-specific — alliance nom in con_03 is the parent of org-noms in con_03, NOT alliance nom in con_01.
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

  // Emit candidate nominations. Walk per-organization (matching candidates-override's ORGANIZATION_WEIGHTS expansion: candidates 0..ORGANIZATION_WEIGHTS[0]-1 belong to organization 0, etc.); within each organization, distribute across constituencies per the matrix row. Each candidate's parent_nomination references the (organization, constituency) org nomination emitted above.
  let candIdx = 0;
  for (let p = 0; p < ORGANIZATION_CONSTITUENCY_MATRIX.length; p++) {
    for (let c = 0; c < ORGANIZATION_CONSTITUENCY_MATRIX[p].length; c++) {
      const cellCount = ORGANIZATION_CONSTITUENCY_MATRIX[p][c];
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
      `[dev-seed] nominationsOverride: assigned ${candIdx} candidates but ctx.refs.candidates has ${candidates.length}. ORGANIZATION_CONSTITUENCY_MATRIX total (${candIdx}) must equal candidates.count.`
    );
  }

  return rows as unknown as Array<Record<string, unknown>>;
}
