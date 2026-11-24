import {
  DataObject,
  DataTypeError,
  DEFAULT_NOMINATION_SHAPE,
  ensureDate,
  ENTITY_TYPE,
  isMissingValue,
  OBJECT_TYPE
} from '../../internal';
import type {
  AllianceNomination,
  AnyQuestionVariant,
  CandidateNomination,
  Collection,
  Constituency,
  ConstituencyGroup,
  DataAccessor,
  ElectionData,
  EntityType,
  FactionNomination,
  FilterValue,
  Id,
  NominationShape,
  NominationVariant,
  OrganizationNomination,
  QuestionCategoryType
} from '../../internal';

/**
 * Represents an election of which there may be multiple simultaneous ones. The `Entity`s nominated for an `Election` are divided into `Constituency`s which form `ConstituencyGroup`s. An `Election` must have at least one of these even in the case of elections where there is only one, e.g. a state-wide, constituency (see also the `singleConstituency` getter).
 */
export class Election extends DataObject<ElectionData> implements DataAccessor<ElectionData> {
  readonly objectType = OBJECT_TYPE.Election;

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
   * The nomination shape of the election: which entity types it admits as nominees and which parent each may name. Ask `isNominableInShape` and `allowedParentTypes` with it. @defaultValue `DEFAULT_NOMINATION_SHAPE`, i.e., `organization_list_and_independents`
   */
  get nominationShape(): NominationShape {
    return this.data.nominationShape ?? DEFAULT_NOMINATION_SHAPE;
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
   * The `Constituency`s in an array that are in one of this `Election`'s `ConstituencyGroup`s. Several may match, e.g., a municipality and its parent region for an election whose groups include both regions and municipalities.
   * @param constituencies - The `Constituency`s to choose from.
   * @returns Every match, in the order given. Empty when none matches.
   */
  getApplicableConstituencies(constituencies: Array<Constituency>): Array<Constituency> {
    const groups = this.constituencyGroups;
    return constituencies.filter(({ id }) => groups.some((group) => group.data.constituencyIds.includes(id)));
  }

  /**
   * Whether this `Election` is held in one or more of the `Constituency`s given, i.e., whether one of them is in one of its `ConstituencyGroup`s (see `getApplicableConstituencies`).
   * @param constituencies - The `Constituency`s to check.
   * @returns `true` when any of them applies to this `Election`.
   */
  isHeldIn(constituencies: Array<Constituency>): boolean {
    return this.getApplicableConstituencies(constituencies).length > 0;
  }

  /**
   * Return the `Constituency` in an array that applies to this `Election`.
   * @throws If more than one `Constituency`s matches the criteria. Use `getApplicableConstituencies` or `getMostSpecificConstituency` when several may.
   */
  getApplicableConstituency(constituencies: Array<Constituency>): Constituency | undefined {
    const matches = this.getApplicableConstituencies(constituencies);
    if (matches.length > 1)
      throw new DataTypeError(
        `More than one constituency matches the election: ${matches.map((m) => m.id).join(', ')}`
      );
    return matches[0];
  }

  /**
   * The one `Constituency` of an array this `Election` resolves to when several of them apply to it (see `getApplicableConstituencies`). A match that is an ancestor of another match is passed over, so a municipality is chosen over its parent region. Among the rest, the one whose `ConstituencyGroup` has the fewest `Constituency`s is chosen, and the first of them in the order given when several groups are of that size. Never throws.
   * @param constituencies - The `Constituency`s to choose from.
   * @returns The `Constituency`, or `undefined` when none of those given applies to this `Election`.
   */
  getMostSpecificConstituency(constituencies: Array<Constituency>): Constituency | undefined {
    const matches = this.getApplicableConstituencies(constituencies);
    const parentIds = new Map(this.root.constituencies.map((c) => [c.id, c.data.parentId]));
    const leaves = matches.filter(
      (candidate) => !matches.some((other) => isAncestorOf({ ancestorId: candidate.id, descendant: other, parentIds }))
    );
    const groups = this.constituencyGroups;
    let best: { constituency: Constituency; groupSize: number } | undefined;
    for (const constituency of leaves) {
      const group = groups.find((g) => g.data.constituencyIds.includes(constituency.id));
      const groupSize = group?.data.constituencyIds.length ?? Infinity;
      if (!best || groupSize < best.groupSize) best = { constituency, groupSize };
    }
    return best?.constituency;
  }

  /**
   * The `Constituency` of this `Election` that a `Constituency` is or lies in: the `Constituency` itself when one of this `Election`'s `ConstituencyGroup`s holds it, and otherwise the first one a group implies (see `ConstituencyGroup.getImpliedConstituency`), so a municipality implies its region for an election held by region. A group that holds several of the `Constituency`'s lineage implies none. Never throws.
   * @param constituency - The `Constituency` to find this `Election`'s `Constituency` for.
   * @returns The `Constituency`, or `undefined` when none of this `Election`'s groups implies one.
   */
  getImpliedConstituency(constituency: Constituency): Constituency | undefined {
    const applicable = this.getApplicableConstituencies([constituency])[0];
    if (applicable) return applicable;
    for (const group of this.constituencyGroups) {
      const implied = impliedByGroup(group, constituency);
      if (implied) return implied;
    }
    return undefined;
  }
}

/**
 * The `Constituency` a `ConstituencyGroup` implies for a `Constituency`, or `undefined` when it implies none, including when it holds several of the `Constituency`'s lineage.
 */
function impliedByGroup(group: ConstituencyGroup, constituency: Constituency): Constituency | undefined {
  try {
    return group.getImpliedConstituency(constituency) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Whether the `Constituency` with `ancestorId` is a parent, grandparent or further ancestor of `descendant`, following the parent ids the root holds.
 */
function isAncestorOf({
  ancestorId,
  descendant,
  parentIds
}: {
  ancestorId: Id;
  descendant: Constituency;
  parentIds: Map<Id, Id | null | undefined>;
}): boolean {
  const seen = new Set<Id>();
  let parentId = descendant.data.parentId;
  while (parentId && !seen.has(parentId)) {
    if (parentId === ancestorId) return true;
    seen.add(parentId);
    parentId = parentIds.get(parentId);
  }
  return false;
}
