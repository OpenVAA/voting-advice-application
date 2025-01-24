import { parseOrganization } from './parseOrganization';
import { parseSingleRelationId } from './parseRelationIds';
import type { Id } from '@openvaa/core';
import type { OrganizationData } from '@openvaa/data';
import type { PartialCandidateNomination, PartialCandidateNominationData } from '$lib/api/base/dataWriter.type';
import type { StrapiNominationData } from '../strapiData.type';

/**
 * Parse the temporary `PartialCandidateNominationData` from the provided `StrapiNominationData` array.
 * TODO: Use proper `Nomination` data and objects.
 */
export function parsePartialNominations(
  data: Array<StrapiNominationData>,
  locale: string | null
): PartialCandidateNominationData {
  const partialNominations = new Array<PartialCandidateNomination>();
  const organizations = new Map<Id, OrganizationData>();

  for (const { documentId, constituency, election, electionRound, electionSymbol, party, unconfirmed } of data) {
    const [electionId, constituencyId, partyId] = [election, constituency, party].map((d) => parseSingleRelationId(d));

    if (!electionId || !constituencyId) throw new Error(`Error parsing Partial Nomination ${documentId}`);

    if (partyId && !organizations.has(partyId)) {
      organizations.set(partyId, parseOrganization(party!, locale));
    }

    partialNominations.push({
      electionRound: electionRound || 1,
      electionSymbol: electionSymbol ?? '',
      unconfirmed: !!unconfirmed,
      parentOrganizationId: partyId,
      electionId,
      constituencyId
    });
  }

  return {
    entities: [...organizations.values()],
    partialNominations
  };
}
