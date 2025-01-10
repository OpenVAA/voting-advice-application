import type { ENTITY_TYPE, Id, NominationData, WithOptional } from '../../../internal';

export interface CandidateNominationData
  extends NominationData<typeof ENTITY_TYPE.Candidate, typeof ENTITY_TYPE.Faction | typeof ENTITY_TYPE.Organization> {
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
   * The nominated `Candidate`s `id` is required.
   */
  entityId: Id;
  /**
   * A `CandidateNomination` may not have specified `name`, we use the `Entity`’s.
   */
  name?: never | null;
  /**
   * A `CandidateNomination` may not have specified `shortName`, we use the `Entity`’s.
   */
  shortName?: never | null;
}

/**
 * The public data type for a `CandidateNomination`, which excludes properties automatically generated during data provision or initialization.
 */
export type PublicCandidateNominationData = WithOptional<CandidateNominationData, 'id'>;
