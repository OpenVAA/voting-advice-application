import {
  AllianceNomination,
  CandidateNomination,
  type Collection,
  ConstituencyGroup,
  type DataAccessor,
  DataObject,
  type ElectionData,
  ensureDate,
  ENTITY_TYPE,
  FactionNomination,
  type Id,
  isMissingValue,
  OrganizationNomination
} from '../../internal';

/**
 * Represents an election of which there may be multiple simultaneous ones. The `Entity`s nominated for an `Election` are divided into `Constituency`s which form `ConstituencyGroup`s. An `Election` must have at least one of these even in the case of elections where there is only one, e.g. a state-wide, constituency (see also the `singleConstituency` getter).
 */
export class Election extends DataObject<ElectionData> implements DataAccessor<ElectionData> {
  //////////////////////////////////////////////////////////////////////////////
  // Property getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * The date after which the election can be treated as past, i.e., the end of the voting period. @defaultValue null
   */
  get date(): Date | null {
    if (!this.data.date) return null;
    const date = ensureDate(this.data.date);
    return isMissingValue(date) ? null : date;
  }

  /**
   * Set to true if the election can have multiple rounds. @defaultValue false
   */
  get multipleRounds(): boolean {
    return this.data.multipleRounds ?? false;
  }

  /**
   * The optional current round of the election if it has multiple rounds. @defaultValue 1
   */
  get round(): number {
    return this.data.round ?? 1;
  }

  /**
   * Returns `true` if the election only has a single constituency.
   */
  get singleConstituency(): boolean {
    return this.data.constituencyGroupIds.length === 1 && this.constituencyGroups[0].singleConstituency;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Collection getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * The constituency groups the nominations in this election are in.
   */
  get constituencyGroups(): Collection<ConstituencyGroup> {
    return this.data.constituencyGroupIds.map((id) => this.root.getConstituencyGroup(id));
  }

  /**
   * Get the `AllianceNomination`s for a specific `Constituency` in this `Election`.
   * @param id - The id of the `Constituency`
   */
  getAllianceNominations({ id }: { id: Id }): Collection<AllianceNomination> {
    return (
      this.root.getNominationsForConstituency({
        type: ENTITY_TYPE.Alliance,
        constituencyId: id,
        electionId: this.id
      }) ?? []
    );
  }

  /**
   * Get the `CandidateNomination`s for a specific `Constituency` in this `Election`.
   * @param id - The id of the `Constituency`
   */
  getCandidateNominations({ id }: { id: Id }): Collection<CandidateNomination> {
    return (
      this.root.getNominationsForConstituency({
        type: ENTITY_TYPE.Candidate,
        constituencyId: id,
        electionId: this.id
      }) ?? []
    );
  }

  /**
   * Get the `FactionNomination`s for a specific `Constituency` in this `Election`.
   * @param id - The id of the `Constituency`
   */
  getFactionNominations({ id }: { id: Id }): Collection<FactionNomination> {
    return (
      this.root.getNominationsForConstituency({
        type: ENTITY_TYPE.Faction,
        constituencyId: id,
        electionId: this.id
      }) ?? []
    );
  }

  /**
   * Get the `OrganizationNomination`s for a specific `Constituency` in this `Election`.
   * @param id - The id of the `Constituency`
   */
  getOrganizationNominations({ id }: { id: Id }): Collection<OrganizationNomination> {
    return (
      this.root.getNominationsForConstituency({
        type: ENTITY_TYPE.Organization,
        constituencyId: id,
        electionId: this.id
      }) ?? []
    );
  }
}
