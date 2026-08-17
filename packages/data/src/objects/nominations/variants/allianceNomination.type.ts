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
   * The `OrganizationNomination`s forming the alliance, provided as nested nomination data. One or more `OrganizationNomination`s must be provided either as nested data here or as explicit ids in `organizationNominationIds` (e.g. by an adapter that already created the org-noms separately and wired the parent edge).
   */
  organizations?: Array<NestedNomination<PublicOrganizationNominationData>>;
  /**
   * The `OrganizationNomination`s forming the alliance, referenced by id. Either populated automatically when `organizations` nested data is provided, or set directly by adapters that reverse-fill parent → children relationships from a flat schema (see `supabaseDataProvider`). One or more must be provided either as nested data in `organizations` or as ids here.
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
