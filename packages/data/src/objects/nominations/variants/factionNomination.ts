import {
  CandidateNomination,
  type DataAccessor,
  DataNotFoundError,
  DataProvisionError,
  DataRoot,
  ENTITY_TYPE,
  type FactionNominationData,
  Nomination,
  type OrganizationNomination,
  WithOptional
} from '../../../internal';

/**
 * A nomination for a `Faction`. The nomination must part of an `OrganizationNomination`, i.e., a party list.
 * @param data - The data for the nomination. If it does not contain an explicit `entityId`, a generic `Alliance` `Entity` will be created.
 * @param root - The `DataRoot`.
 */
export class FactionNomination
  extends Nomination<typeof ENTITY_TYPE.Faction, typeof ENTITY_TYPE.Organization, FactionNominationData>
  implements DataAccessor<FactionNominationData, 'candidates'>
{
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * The constructor can be called with data lacking an explicit `Faction` entity’s `entityId` in which case an `Faction` with a non-deterministic, unique `id` will be generated. Also, any  nested `CandidateNomination`s in the data are created during initialization.
   */
  constructor({ data, root }: { data: WithOptional<FactionNominationData, 'id'>; root: DataRoot }) {
    if (!data.candidates?.length)
      throw new DataProvisionError('A FactionNomination must have non-zero CandidateNominations');
    if (!data.parentNominationId || !data.parentNominationType)
      throw new DataProvisionError('A FactionNomination must have parentNominationType and parentNominationId');

    // Create the possible implied entity before calling super(), because entityId will be needed by it for id generation
    if (!data.entityId) {
      const { name, shortName } = data;
      const id = root.createId({ type: 'faction', data });
      root.provideEntityData([
        {
          type: ENTITY_TYPE.Faction,
          isGenerated: true,
          id,
          name,
          shortName
        }
      ]);
      data.entityId = id;
    }

    super({ data, root });

    // Create nested nominations
    const { candidateNominations } = this.root.provideNominationData(
      this.data.candidates.map((d) => ({
        ...d,
        ...this.getInheritableData(),
        entityType: ENTITY_TYPE.Candidate,
        parentNominationType: ENTITY_TYPE.Faction
      }))
    );
    this.data.candidateNominationIds = candidateNominations.map((n) => n.id);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Property and collection getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * The `CandidateNomination`s in the faction nomination.
   */
  get candidateNominations(): Array<CandidateNomination> {
    return this.data.candidateNominationIds?.map((id) => this.root.getCandidateNomination(id)) ?? [];
  }

  /**
   * A utility synonym for `parentNomination`. A `FactionNomination` always belongs to an `OrganizationNomination`.
   */
  get list(): OrganizationNomination {
    const nom = this.parentNomination;
    if (!nom) throw new DataNotFoundError('No parent nomination for FactionNomination');
    return nom;
  }
}
