import {
  AllianceNomination,
  CandidateNomination,
  ENTITY_TYPE,
  EntityType,
  FactionNomination,
  type Id,
  OrganizationNomination,
  PublicAllianceNominationData,
  PublicCandidateNominationData,
  PublicFactionNominationData,
  PublicOrganizationNominationData
} from '../../../internal';

/**
 * Nomination variants
 * This file contains type and class mappings for all concrete nomination types, i.e. those that are not abstract base classes.
 * NB. Make sure to update the types below whenever implemeting new nomination variants. The code below could most likely be refactored to get rid of some redundancy.
 */

/**
 * A map of the concrete Nomination constructors by their Nomination type.
 */
export type NominationVariantConstructor = {
  [ENTITY_TYPE.Candidate]: typeof CandidateNomination;
  [ENTITY_TYPE.Faction]: typeof FactionNomination;
  [ENTITY_TYPE.Organization]: typeof OrganizationNomination;
  [ENTITY_TYPE.Alliance]: typeof AllianceNomination;
};

/**
 * A map of the concrete Nomination instances by their Nomination type.
 */
export type NominationVariant = {
  [KType in EntityType]: InstanceType<NominationVariantConstructor[KType]>;
};

/**
 * Any concrete Nomination instance.
 */
export type AnyNominationVariant = NominationVariant[keyof NominationVariant];

/**
 * A map of the concrete Nomination constructors’ data arguments by their Nomination type.
 */
export type NominationVariantData = {
  [KType in EntityType]: ConstructorParameters<NominationVariantConstructor[KType]>[0]['data'];
};

/**
 * Any concrete Nomination constructors’ data argument type.
 */
export type AnyNominationVariantData = NominationVariantData[keyof NominationVariantData];

/**
 * A map of the concrete Nominations’ public data by their Nomination type.
 */
export type NominationVariantPublicData = {
  [ENTITY_TYPE.Candidate]: PublicCandidateNominationData;
  [ENTITY_TYPE.Faction]: PublicFactionNominationData;
  [ENTITY_TYPE.Organization]: PublicOrganizationNominationData;
  [ENTITY_TYPE.Alliance]: PublicAllianceNominationData;
};

/**
 * Any concrete Nominations’ public data.
 */
export type AnyNominationVariantPublicData = NominationVariantPublicData[keyof NominationVariantPublicData];

/**
 * An alternative data structure for `NominationData` with the `electionId` and `constituencyId` specified hierarchically as keys.
 * Use the `parseNominationTree` util to convert these to a canonical array.
 */
export type NominationVariantTree = {
  [electionId: Id]: {
    [constituencyId: Id]: Array<
      | WithoutElAndCoId<typeof ENTITY_TYPE.Alliance>
      | WithoutElAndCoId<typeof ENTITY_TYPE.Candidate>
      | WithoutElAndCoId<typeof ENTITY_TYPE.Faction>
      | WithoutElAndCoId<typeof ENTITY_TYPE.Organization>
    >;
  };
};

type WithoutElAndCoId<TType extends EntityType> = Omit<
  NominationVariantPublicData[TType],
  'electionId' | 'constituencyId'
>;

/**
 * Parse a `NominationVariantTree` into an array of `NominationVariantPublicData`.
 */
export function parseNominationTree(tree: NominationVariantTree): Array<AnyNominationVariantPublicData> {
  const nominations = new Array<AnyNominationVariantPublicData>();
  for (const electionId in tree) {
    for (const constituencyId in tree[electionId]) {
      nominations.push(
        ...tree[electionId][constituencyId].map((n) => ({
          ...n,
          electionId,
          constituencyId
        }))
      );
    }
  }
  return nominations;
}
