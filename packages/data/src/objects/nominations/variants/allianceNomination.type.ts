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
   * The `OrganizationNomination`s forming the alliance. One or more must be provided either as nested nominations or explicit ids.
   */
  organizations: Array<NestedNomination<PublicOrganizationNominationData>>;
  /**
   * The `OrganizationNomination`s forming the alliance. These will be automatically generated from the `organizations` array. One or more must be provided either as nested nominations or explicit ids.
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
