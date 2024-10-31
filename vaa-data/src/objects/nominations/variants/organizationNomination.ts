import {
  type OrganizationNominationData,
  type DataAccessor,
  ENTITY_TYPE,
  type AllianceNomination,
  CandidateNomination,
  FactionNomination,
  DataProvisionError,
  Nomination,
  DataRoot,
  WithOptional,
  CandidateNominationData,
  FactionNominationData
} from '../../../internal';

/**
 * A nomination for an `Organization`, most often a party. The nomination may be contain `CandidateNomination`s, i.e., it’s a party list, or `FactionNomination`s.
 */
export class OrganizationNomination
  extends Nomination<
    typeof ENTITY_TYPE.Organization,
    typeof ENTITY_TYPE.Alliance,
    OrganizationNominationData
  >
  implements DataAccessor<OrganizationNominationData, 'candidates' | 'factions'>
{
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Any nested `CandidateNomination`s or `FactionNomination`s in the data are created during initialization.
   */
  constructor({
    data,
    root
  }: {
    data: WithOptional<OrganizationNominationData, 'id'>;
    root: DataRoot;
  }) {
    super({data, root});

    if (this.data.candidates?.length && this.data.factions?.length)
      throw new DataProvisionError(
        'An OrganizationNomination cannot have both FactionNominations and OrganizationNominations'
      );

    // Create nested candidate or faction nominations
    const complementBase = {
      constituencyId: this.data.constituencyId,
      electionId: this.data.electionId,
      parentNominationId: this.data.id,
      parentNominationType: ENTITY_TYPE.Organization
    };
    if (this.data.candidates?.length) {
      const {candidateNominations} = this.root.provideNominationData(
        this.data.candidates.map(
          (d) =>
            ({
              ...d,
              ...complementBase,
              entityType: ENTITY_TYPE.Candidate
            } as CandidateNominationData)
        )
      );
      this.data.candidateNominationIds = candidateNominations.map((n) => n.id);
    } else if (this.data.factions?.length) {
      const {factionNominations} = this.root.provideNominationData(
        this.data.factions.map(
          (d) =>
            ({
              ...d,
              ...complementBase,
              entityType: ENTITY_TYPE.Faction
            } as FactionNominationData)
        )
      );
      this.data.factionNominationIds = factionNominations.map((n) => n.id);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Property and collection getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * The possible `AllianceNomination` this nomination is part of.
   */
  get allianceNomination(): AllianceNomination | null {
    return this.parentNomination;
  }

  /**
   * The `CandidateNomination`s in this nomination.
   */
  get candidateNominations(): Array<CandidateNomination> {
    return (
      this.data.candidateNominationIds?.map((id) => this.root.getCandidateNomination(id)) ?? []
    );
  }

  /**
   * The `FactionNomination`s in this nomination.
   */
  get factionNominations(): Array<FactionNomination> {
    return this.data.factionNominationIds?.map((id) => this.root.getFactionNomination(id)) ?? [];
  }

  /**
   * Whether this nomination has `CandidateNomination`s.
   */
  get hasCandidates(): boolean {
    return !!this.data.candidateNominationIds?.length;
  }

  /**
   * Whether this nomination has `FactionNomination`s.
   */
  get hasFactions(): boolean {
    return !!this.data.factionNominationIds?.length;
  }
}
