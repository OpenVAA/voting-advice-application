import type { AllianceNomination } from '@openvaa/data';

/**
 * Compute the "X candidates across N parties" summary numbers for an `AllianceNomination`.
 * - `numParties`     = `alliance.organizationNominations.length` (count of member parties).
 * - `numCandidates`  = sum of `candidateNominations.length` across the alliance's member organization-nominations.
 *
 * Used by:
 * - `EntityCard.svelte` (list variant) to render the summary line below the alliance name.
 * - `EntityDetails.svelte` (drawer header) to render the same line for context-continuity (per Phase 69 D-04).
 *
 * The shared helper avoids drift between the two render sites.
 */
export function getAllianceSummary(allianceNom: AllianceNomination): {
  numCandidates: number;
  numParties: number;
} {
  const orgNoms = allianceNom.organizationNominations;
  return {
    numParties: orgNoms.length,
    numCandidates: orgNoms.reduce((sum, org) => sum + org.candidateNominations.length, 0)
  };
}
