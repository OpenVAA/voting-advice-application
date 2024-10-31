import type {
  ENTITY_TYPE,
  NestedNomination,
  NominationData,
  Id,
  WithOptional,
  PublicCandidateNominationData,
  PublicFactionNominationData
} from '../../../internal';

export interface OrganizationNominationData
  extends NominationData<typeof ENTITY_TYPE.Organization, typeof ENTITY_TYPE.Alliance> {
  // From HasId
  // - id: Id;
  //
  // From DataObjectData
  // - color?: Colors | null;
  // - image?: Image | null;
  // - name?: string;
  // - shortName?: string;
  // - info?: string;
  // - order?: number;
  // - customData?: object;
  // - subtype?: string;
  // - isGenerated?: boolean;
  //
  // From NominationData<TEntity extends EntityType = EntityType>
  // - entityType: TEntity;
  // - entityId: Id;
  // - electionId: Id;
  // - constituencyId: Id;
  // - electionSymbol?: string;

  /**
   * The nominated `Organization`s `id` is required.
   */
  entityId: Id;
  /**
   * The possible `Candidate`s being nominated. A list may only contain either `candidates` or `factions` and an error will be thrown if both are provided.
   */
  candidates?: Array<NestedNomination<PublicCandidateNominationData>>;
  /**
   * The ids the possible `CandidateNomination`s on the list. A list may only contain either `candidates` or `factions` and an error will be thrown if both are provided. These will be automatically generated from the `candidates` array.
   */
  candidateNominationIds?: Array<Id>;
  /**
   * The possible `Faction`s being nominated. A list may only contain either `candidates` or `factions` and an error will be thrown if both are provided.
   */
  factions?: Array<NestedNomination<PublicFactionNominationData>>;
  /**
   * The ids the possible `FactionNomination`s on the list. A list may only contain either `candidates` or `factions` and an error will be thrown if both are provided. These will be automatically generated from the `factions` array.
   */
  factionNominationIds?: Array<Id>;
  /**
   * An `OrganizationNomination` may not have specified `name`, we use the `Entity`’s.
   */
  name?: never;
  /**
   * An `OrganizationNomination` may not have specified `shortName`, we use the `Entity`’s.
   */
  shortName?: never;
}

/**
 * The public data type for a `OrganizationNomination`, which excludes properties automatically generated during data provision or initialization.
 */
export type PublicOrganizationNominationData = WithOptional<
  OrganizationNominationData,
  'id' | 'candidateNominationIds' | 'factionNominationIds'
>;
