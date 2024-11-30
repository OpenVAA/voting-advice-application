import {
  AllianceNomination,
  CandidateNomination,
  type Collection,
  ConstituencyGroup,
  type DataAccessor,
  DataObject,
  DataTypeError,
  type ElectionData,
  ensureDate,
  ENTITY_TYPE,
  FactionNomination,
  HasId,
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
  getAllianceNominations({ id }: HasId): Collection<AllianceNomination> {
    return (
      this.root.getNominationsForConstituency({
        type: ENTITY_TYPE.Alliance,
        constituencyId: id,
        electionId: this.id,
        electionRound: this.round
      }) ?? []
    );
  }

  /**
   * Get the `CandidateNomination`s for a specific `Constituency` in this `Election`.
   * @param id - The id of the `Constituency`
   */
  getCandidateNominations({ id }: HasId): Collection<CandidateNomination> {
    return (
      this.root.getNominationsForConstituency({
        type: ENTITY_TYPE.Candidate,
        constituencyId: id,
        electionId: this.id,
        electionRound: this.round
      }) ?? []
    );
  }

  /**
   * Get the `FactionNomination`s for a specific `Constituency` in this `Election`.
   * @param id - The id of the `Constituency`
   */
  getFactionNominations({ id }: HasId): Collection<FactionNomination> {
    return (
      this.root.getNominationsForConstituency({
        type: ENTITY_TYPE.Faction,
        constituencyId: id,
        electionId: this.id,
        electionRound: this.round
      }) ?? []
    );
  }

  /**
   * Get the `OrganizationNomination`s for a specific `Constituency` in this `Election`.
   * @param id - The id of the `Constituency`
   */
  getOrganizationNominations({ id }: HasId): Collection<OrganizationNomination> {
    return (
      this.root.getNominationsForConstituency({
        type: ENTITY_TYPE.Organization,
        constituencyId: id,
        electionId: this.id,
        electionRound: this.round
      }) ?? []
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // Other getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Return the `Constituency` in an array that applies to this `Election`.
   * @throws If more than one `Constituency`s matches the criteria.
   */
  getApplicableConstituency(constituencies: Array<HasId>): HasId | undefined {
    const matches = constituencies.filter(({ id }) =>
      this.constituencyGroups.some((group) => group.data.constituencyIds.includes(id))
    );
    if (matches.length > 1)
      throw new DataTypeError(
        `More than one constituency matches the election: ${matches.map((m) => m.id).join(', ')}`
      );
    return matches[0];
  }
}
