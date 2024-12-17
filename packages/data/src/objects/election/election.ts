import {
  AllianceNomination,
  AnyQuestionVariant,
  CandidateNomination,
  type Collection,
  Constituency,
  ConstituencyGroup,
  type DataAccessor,
  DataObject,
  DataTypeError,
  type ElectionData,
  ensureDate,
  ENTITY_TYPE,
  EntityType,
  FactionNomination,
  FilterValue,
  isMissingValue,
  NominationVariant,
  OrganizationNomination,
  QuestionCategoryType
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
   * Returns the single `Constituency` if the election only has a one, `null` otherwise.
   */
  get singleConstituency(): Constituency | null {
    const maybeSingle = this.constituencyGroups[0].singleConstituency;
    return this.data.constituencyGroupIds.length === 1 && maybeSingle ? maybeSingle : null;
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
   * Get the `Nomination`s for a specific `Constituency` in this `Election`.
   * @param entityType - The type of `Entity` to get the nominations for.
   * @param constituency - The `Constituency`
   */
  getNominations<TEntity extends EntityType>(
    type: TEntity,
    constituency: Constituency
  ): Collection<NominationVariant[TEntity]> {
    return (
      this.root.getNominationsForConstituency({
        type,
        constituencyId: constituency.id,
        electionId: this.id,
        electionRound: this.round
      }) ?? []
    );
  }

  /**
   * Get the `AllianceNomination`s for a specific `Constituency` in this `Election`.
   * @param constituency - The `Constituency`
   */
  getAllianceNominations(constituency: Constituency): Collection<AllianceNomination> {
    return this.getNominations(ENTITY_TYPE.Alliance, constituency);
  }

  /**
   * Get the `CandidateNomination`s for a specific `Constituency` in this `Election`.
   * @param constituency - The `Constituency`
   */
  getCandidateNominations(constituency: Constituency): Collection<CandidateNomination> {
    return this.getNominations(ENTITY_TYPE.Candidate, constituency);
  }

  /**
   * Get the `FactionNomination`s for a specific `Constituency` in this `Election`.
   * @param constituency - The `Constituency`
   */
  getFactionNominations(constituency: Constituency): Collection<FactionNomination> {
    return this.getNominations(ENTITY_TYPE.Faction, constituency);
  }

  /**
   * Get the `OrganizationNomination`s for a specific `Constituency` in this `Election`.
   * @param constituency - The `Constituency`
   */
  getOrganizationNominations(constituency: Constituency): Collection<OrganizationNomination> {
    return this.getNominations(ENTITY_TYPE.Organization, constituency);
  }

  /**
   * Get the questions applicable to this `Election` and a `Constituency` it applies to.
   * @param constituency - The `Constituency` the `Question`s apply to.
   * @param type - Optional type of question category to filter for.
   * @param entityType - Optional entity types to filter for.
   */
  getQuestions({
    constituency,
    type,
    entityType
  }: {
    constituency: Constituency;
    type?: QuestionCategoryType;
    entityType?: FilterValue<EntityType>;
  }): Collection<AnyQuestionVariant> {
    return (
      this.root.findQuestions({
        elections: this,
        constituencies: constituency,
        type,
        entityType
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
  getApplicableConstituency(constituencies: Array<Constituency>): Constituency | undefined {
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
