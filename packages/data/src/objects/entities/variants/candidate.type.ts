import type { ENTITY_TYPE, EntityData, Id } from '../../../internal';

export interface CandidateData extends EntityData<typeof ENTITY_TYPE.Candidate> {
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
  // From EntityData<typeof ENTITY_TYPE.Alliance>
  // - answers?: Answers;
  // - type: TType;

  /**
   * The given name of the candidate.
   */
  firstName: string;
  /**
   * The surname of the candidate.
   */
  lastName: string;
  /**
   * The `id` of the possible `Organization` the candidate belongs to. Note that this may be different from the `OrganizationNomination.entity` of the associated `CandidateNomination`, although in most cases the organizations are the same.
   * NB. We store the organization membership in the `Candidate`s instead of the `Organization` because the data for all the `Candidate`s may not be loaded at the same time for that of the `Organization`. Also, it’s probably more common to access the `Organization` for `Candidate` than all the `Candidate`s of an `Organization`.
   */
  organizationId?: Id | null;
}
