import type {
  ENTITY_TYPE,
  Id,
  NestedNomination,
  NominationData,
  PublicCandidateNominationData,
  WithOptional
} from '../../../internal';

export interface FactionNominationData
  extends NominationData<typeof ENTITY_TYPE.Faction, typeof ENTITY_TYPE.Organization> {
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
   * The `Candidate`s being nominated.
   */
  candidates: Array<NestedNomination<PublicCandidateNominationData>>;
  /**
   * The ids of the `CandidateNomination`s being nominated. These will be automatically generated from the `candidates` array.
   */
  candidateNominationIds?: Array<Id> | null;
  /**
   * The `OrganizationNomination` id this nomination is part of, is mandatory. If the data is provided as part of `OrganizationNominationData`, this `id` will be automatically added.
   */
  parentNominationId: Id;
  /**
   * The `EntityType` is mandatory.
   * NB. This may seem redundant, but the `Nomination` constructor will need this for `id` generation.
   */
  parentNominationType: typeof ENTITY_TYPE.Organization;
}

/**
 * The public data type for a `FactionNomination`, which excludes properties automatically generated during data provision or initialization.
 */
export type PublicFactionNominationData = WithOptional<
  FactionNominationData,
  'id' | 'entityId' | 'candidateNominationIds'
>;
