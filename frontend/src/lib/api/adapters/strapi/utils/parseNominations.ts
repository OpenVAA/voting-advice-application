import {
  type AnyEntityVariantData,
  type AnyNominationVariantPublicData,
  type CandidateData,
  ENTITY_TYPE,
  type OrganizationData
} from '@openvaa/data';
import { parseCandidate, parseOrganization, parseSingleRelationId } from '../utils';
import type { CustomData } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { StrapiNominationData } from '../strapiData.type';

/**
 * Parse `StrapiNominationData` into proper `AnyNominationVariantPublicData` and `AnyEntityVariantData` objects.
 * @param data - An array of `StrapiNominationData`
 * @param locale - The locale to use for translating or `null` if the default is to be used
 * @returns An array of `AnyNominationVariantPublicData` that can be passed to the `DataRoot`
 */
export function parseNominations(
  data: Array<StrapiNominationData>,
  locale: string | null
): {
  nominations: Array<AnyNominationVariantPublicData>;
  entities: Array<AnyEntityVariantData>;
} {
  const tree: PartialNominationTree = {};
  const candidates = new Map<Id, CandidateData>();
  const organizations = new Map<Id, OrganizationData>();

  for (const {
    documentId,
    electionSymbol,
    candidate,
    constituency,
    election,
    electionRound: _electionRound,
    party,
    unconfirmed
  } of data) {
    // Ensure that the electionRound is valid (and not zero)
    const electionRound = _electionRound || 1;

    // Add unconfirmed status to the custom data object if provided
    const customData: CustomData['Nomination'] | undefined =
      unconfirmed != null ? { unconfirmed: !!unconfirmed } : undefined;

    const [electionId, constituencyId, candidateId, partyId] = [election, constituency, candidate, party].map((d) =>
      parseSingleRelationId(d)
    );

    if (!electionId || !constituencyId || (!candidateId && !partyId))
      throw new Error(`Error parsing Nomination ${documentId}`);

    // 1. Parse data for any related entities

    if (candidateId && !candidates.has(candidateId)) {
      candidates.set(candidateId, parseCandidate(candidate!, locale));
      // Also include possible party the candidate belongs to
      const candParty = candidate!.party;
      if (candParty && !organizations.has(candParty.documentId)) {
        organizations.set(candParty.documentId, parseOrganization(candParty, locale));
      }
    }

    if (partyId && !organizations.has(partyId)) {
      organizations.set(partyId, parseOrganization(party!, locale));
    }

    // 2. Parse data for the `Nomination`

    // Make sure we have a branch to add to
    tree[electionId] ??= {};
    tree[electionId][electionRound] ??= {};
    tree[electionId][electionRound][constituencyId] ??= { organizations: {}, candidates: new Set() };
    const branch = tree[electionId][electionRound][constituencyId];

    if (!partyId) {
      // This is a candidate nomination without a nominating party
      branch.candidates.add({ electionSymbol, entityId: candidateId!, customData });
      continue;
    }

    // This is either a new organization nomination or an added candidate to an existing nomination
    branch.organizations[partyId] ??= {
      entityId: partyId,
      candidates: new Set(),
      customData
    };
    const orgNom = branch.organizations[partyId];
    if (candidateId) {
      // This organization nomination includes a candidate
      orgNom.candidates.add({ electionSymbol, entityId: candidateId! });
    } else {
      // This organization nomination does not include a candidate, so the electionSymbol is for the organization
      orgNom.electionSymbol = electionSymbol;
    }
  }

  return {
    nominations: parsePartialTree(tree),
    entities: [...candidates.values(), ...organizations.values()]
  };
}

/**
 * Parse a `PartialNominationTree` into `AnyNominationVariantPublicData` objects.
 */
function parsePartialTree(tree: PartialNominationTree): Array<AnyNominationVariantPublicData> {
  const nominations = new Array<AnyNominationVariantPublicData>();
  for (const electionId in tree) {
    for (const electionRound in tree[electionId]) {
      for (const constituencyId in tree[electionId][electionRound]) {
        const { organizations, candidates } = tree[electionId][electionRound][constituencyId];
        const base = {
          electionId,
          electionRound: +electionRound,
          constituencyId
        };
        const orgNominations = Object.values(organizations).map(({ candidates: orgCandidates, ...rest }) => ({
          ...rest,
          ...base,
          entityType: ENTITY_TYPE.Organization,
          candidates: [...orgCandidates.values()]
        }));
        const candNominations = [...candidates.values()].map((c) => ({
          ...c,
          ...base,
          entityType: ENTITY_TYPE.Candidate
        }));
        nominations.push(...orgNominations, ...candNominations);
      }
    }
  }
  return nominations;
}

type PartialNominationTree = {
  [electionId: string]: {
    [electionRound: number]: {
      [constituencyId: string]: {
        organizations: {
          [partyId: string]: PartialOrganizationNomination;
        };
        candidates: Set<PartialNomination>;
      };
    };
  };
};

type PartialNomination = {
  electionSymbol?: string | null;
  entityId: Id;
  customData?: CustomData['Nomination'] | null;
};

type PartialOrganizationNomination = PartialNomination & {
  candidates: Set<PartialNomination>;
};
