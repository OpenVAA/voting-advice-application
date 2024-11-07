import {
  Alliance,
  Candidate,
  type DataAccessor,
  Entity,
  ENTITY_TYPE,
  Faction,
  type OrganizationData,
  removeDuplicates
} from '../../../internal';

/**
 * The `Organization` entity represents an organization, such as a party or a constituency association, taking part in an election either by itself or usually by nominating candidates. In most circumstances, the `Organization` is also associated with one or more `OrganizationNomination`s, which represent the lists of candidates nominated by it in `Election`-`Constituency` pairs.
 */
export class Organization
  extends Entity<typeof ENTITY_TYPE.Organization, OrganizationData>
  implements DataAccessor<OrganizationData>
{
  /**
   * The `Alliance`s that this `Organization` belongs to via `OrganizationNomination`s.
   */
  get alliances(): Array<Alliance> {
    return this.nominations.map((n) => n.allianceNomination?.entity).filter((a) => a != null);
  }

  /**
   * The `Faction`s that this `Organization` has to via `OrganizationNomination`s.
   */
  get factions(): Array<Faction> {
    return removeDuplicates(this.nominations.map((n) => n.factionNominations.map((fn) => fn.entity)).flat());
  }

  /**
   * The member `Candidate`s that belong to the `Organization`. Note that these may be different from `nominatedCandidates`s.
   */
  get memberCandidates(): Array<Candidate> {
    return this.root.candidates?.filter((c) => `${c.data.organizationId}` === `${this.data.id}`) || [];
  }

  /**
   * The `Candidate`s that the `Organization` has nominated. Note that these may be different from `memberCandidates`.
   */
  get nominatedCandidates(): Array<Candidate> {
    return removeDuplicates(this.nominations.map((n) => n.candidateNominations.map((cn) => cn.entity)).flat());
  }
}
