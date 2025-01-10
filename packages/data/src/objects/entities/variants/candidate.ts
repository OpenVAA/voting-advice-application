import { type CandidateData, type DataAccessor, Entity, ENTITY_TYPE, Organization } from '../../../internal';

/**
 * The `Candidate` entity represents a person taking part in an election. In most circumstances, the `Candidate` is also associated with one or sometimes multiple `CandidateNomination`s, which represent the `Candidate` being nominated (either by themself or by an `Organization` or `Faction`) in `Election`-`Constituency` pairs.
 */
export class Candidate
  extends Entity<typeof ENTITY_TYPE.Candidate, CandidateData>
  implements DataAccessor<CandidateData>
{
  /**
   * The given name of the candidate.
   */
  get firstName(): string {
    return this.data.firstName;
  }

  /**
   * The surname of the candidate.
   */
  get lastName(): string {
    return this.data.lastName;
  }

  /**
   * The full name of the candidate. To change the format, set the `format.candidateName` property in the `DataRoot`.
   */
  get name(): string {
    return this.data.name || this.root.formatCandidateName({ object: this });
  }

  /**
   * The possible `Organization` the candidate belongs to. Note that this may be different from the `OrganizationNomination.entity` of the associated `CandidateNomination`, although in most cases the organizations are the same.
   * NB. We store the organization membership in the `Candidate`s instead of the `Organization` because the data for all the `Candidate`s may not be loaded at the same time for that of the `Organization`. Also, it’s probably more common to access the `Organization` for `Candidate` than all the `Candidate`s of an `Organization`.
   */
  get organization(): Organization | null {
    return this.data.organizationId ? this.root.getOrganization(this.data.organizationId) : null;
  }

  /**
   * The short name of the candidate. To change the format, set the `format.candidateName` property in the `DataRoot`.
   */
  get shortName(): string {
    return this.data.shortName || this.root.formatCandidateShortName({ object: this });
  }
}
