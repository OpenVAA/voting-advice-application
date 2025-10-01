import {
  type AnyEntityVariantData,
  type AnyNominationVariantPublicData,
  type CandidateData,
  ENTITY_TYPE,
  type OrganizationData,
  type PublicAllianceNominationData,
  type PublicCandidateNominationData,
  type PublicOrganizationNominationData
} from '@openvaa/data';
import { logDebugError } from '$lib/utils/logger';
import { parseBasics, parseCandidate, parseOrganization, parseRelationIds, parseSingleRelationId } from '../utils';
import type { CustomData } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { StrapiAllianceData, StrapiNominationData } from '../strapiData.type';

/**
 * Parse `StrapiNominationData` into proper `AnyNominationVariantPublicData` and `AnyEntityVariantData` objects.
 * @param data - An array of `StrapiNominationData`
 * @param locale - The locale to use for translating or `null` if the default is to be used
 * @returns An array of `AnyNominationVariantPublicData` that can be passed to the `DataRoot`
 */
export function parseNominations({
  nominations,
  alliances,
  locale
}: {
  nominations: Array<StrapiNominationData>;
  alliances?: Array<StrapiAllianceData>;
  locale: string | null;
}): {
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
  } of nominations) {
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
    tree[electionId][electionRound][constituencyId] ??= {
      organizations: {},
      alliances: new Set(),
      candidates: new Set()
    };
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

  // 3. Insert alliances into the tree
  if (alliances) {
    for (const alliance of alliances) {
      const partialAlliance = createPartialAllianceNomination(alliance);
      const electionId = parseSingleRelationId(alliance.election);
      const constituencyIds = parseRelationIds(alliance.constituencies);
      if (!electionId || !constituencyIds.length)
        throw new Error(`Error parsing Alliance ${alliance.documentId}. No election or constituencies found.`);
      const election = tree[electionId];
      if (!election)
        throw new Error(`Error parsing Alliance ${alliance.documentId}. Election ${electionId} not found.`);
      // We assume the alliance is valid for all election rounds
      for (const electionRound of Object.values(election)) {
        for (const constituencyId of constituencyIds) {
          const constituency = electionRound[constituencyId];
          if (!constituency)
            throw new Error(
              `Error parsing Alliance ${alliance.documentId}. Consituency ${constituencyId} in Election ${electionId} not found.`
            );
          constituency.alliances.add(partialAlliance);
        }
      }
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
        const { alliances, organizations, candidates } = tree[electionId][electionRound][constituencyId];
        const base = {
          electionId,
          electionRound: +electionRound,
          constituencyId
        };
        // First create organization nominations
        const orgNominations: Array<PublicOrganizationNominationData> = Object.values(organizations).map(
          ({ candidates: orgCandidates, ...rest }) => ({
            ...rest,
            ...base,
            entityType: ENTITY_TYPE.Organization,
            candidates: [...orgCandidates.values()]
          })
        );
        // Then create alliance nominations, splicing organizations belonging to them from orgNominations
        const allianceNominations: Array<PublicAllianceNominationData> = [...alliances.values()]
          .map(({ organizations: allianceOrganizations, ...rest }) => {
            // Temporary fix: filter out missing organizations
            const allies = allianceOrganizations
              .map((id) => {
                const index = orgNominations.findIndex((o) => o.entityId === id);
                if (index < 0) {
                  logDebugError(`Allied organization with id ${id} not found or assigned to multiple Alliances`);
                  return undefined;
                }
                return orgNominations.splice(index, 1)[0];
              })
              .filter((o) => o !== undefined);
            return {
              ...rest,
              ...base,
              entityType: ENTITY_TYPE.Alliance,
              organizations: allies
            };
          })
          .filter((o) => o.organizations.length > 0); // Filter out alliances with no nonmissing organizations
        // Finally, create independent candidate nominations
        const candNominations: Array<PublicCandidateNominationData> = [...candidates.values()].map((c) => ({
          ...c,
          ...base,
          entityType: ENTITY_TYPE.Candidate
        }));
        nominations.push(...allianceNominations, ...orgNominations, ...candNominations);
      }
    }
  }
  return nominations;
}

type PartialNominationTree = {
  [electionId: string]: {
    [electionRound: number]: {
      [constituencyId: string]: {
        alliances: Set<PartialAllianceNomination>;
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

function createPartialAllianceNomination(
  data: StrapiAllianceData,
  locale: string | null = null
): PartialAllianceNomination {
  return {
    ...parseBasics(data, locale),
    organizations: parseRelationIds(data.parties)
  };
}

type PartialAllianceNomination = {
  organizations: Array<Id>;
  name?: string;
  shortName?: string;
};
