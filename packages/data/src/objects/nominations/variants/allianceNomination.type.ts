import type {
  ENTITY_TYPE,
  Id,
  NestedNomination,
  NominationData,
  PublicOrganizationNominationData,
  WithOptional
} from '../../../internal';

export interface AllianceNominationData extends NominationData<typeof ENTITY_TYPE.Alliance> {
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
   * The `OrganizationNomination`s forming the alliance, provided as nested nomination data. One or more `OrganizationNomination`s must be provided either as nested data here or as explicit ids in `organizationNominationIds`.
   */
  organizations?: Array<NestedNomination<PublicOrganizationNominationData>>;
  /**
   * The `OrganizationNomination`s forming the alliance, by id. Filled automatically from `organizations`, or supplied directly when the organization nominations are provided separately, in which case `entityId` is required. At least one of `organizations` and `organizationNominationIds` must be non-empty.
   */
  organizationNominationIds?: Array<Id>;
}

/**
 * The public data type for an `AllianceNomination`, which excludes properties automatically generated during data provision or initialization.
 */
export type PublicAllianceNominationData = WithOptional<
  AllianceNominationData,
  'id' | 'entityId' | 'organizationNominationIds'
>;
