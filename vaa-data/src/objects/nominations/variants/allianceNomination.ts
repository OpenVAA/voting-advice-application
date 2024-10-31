import {
  AllianceNominationData,
  DataAccessor,
  DataNotFoundError,
  ENTITY_TYPE,
  OrganizationNomination,
  DataProvisionError,
  Nomination,
  WithOptional,
  DataRoot
} from '../../../internal';

/**
 * A nomination for an `Alliance` of `Organization`s.
 * NB. An `Organization` should only be included in one `AllianceNomination` per `Election`-`Constituency` pair.
 */
export class AllianceNomination
  extends Nomination<typeof ENTITY_TYPE.Alliance, never, AllianceNominationData>
  implements DataAccessor<AllianceNominationData, 'organizations'>
{
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * The constructor can be called with `data` lacking an explicit `Alliance` entity’s `entityId` in which case an `Alliance` with a non-deterministic, unique `id` will be generated. Also, any nested `OrganizationNomination`s in the data are created during initialization.
   * @param data - The data for the nomination. If it does not contain an explicit `entityId`, a generic `Alliance` `Entity` will be created.
   * @param root - The `DataRoot`.
   */
  constructor({data, root}: {data: WithOptional<AllianceNominationData, 'id'>; root: DataRoot}) {
    super({data, root});

    if (this.data.organizations.length < 2)
      throw new DataProvisionError(
        `An AllianceNomination must have at least two organizations. The data has ${this.data.organizations.length}.`
      );

    // Create implied entity if necessary, `super()` will add the `id`
    if (!this.data.entityId) {
      const {name, shortName} = this.data;
      const id = this.root.createId('alliance');
      this.root.provideEntityData([
        {
          type: ENTITY_TYPE.Alliance,
          isGenerated: true,
          id,
          name,
          shortName
        }
      ]);
      this.data.entityId = id;
    }

    // Create nested nominations
    const {organizationNominations} = this.root.provideNominationData(
      this.data.organizations.map((d) => ({
        ...d,
        entityType: ENTITY_TYPE.Organization,
        constituencyId: this.data.constituencyId,
        electionId: this.data.electionId,
        parentNominationId: this.data.id,
        parentNominationType: ENTITY_TYPE.Alliance
      }))
    );
    this.data.organizationNominationIds = organizationNominations.map((n) => n.id);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Property and collection getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * A utility synonym for `organizationNominations`.
   */
  get lists(): Array<OrganizationNomination> {
    return this.organizationNominations;
  }

  /**
   * The `OrganizationNomination`s forming the alliance.
   */
  get organizationNominations(): Array<OrganizationNomination> {
    if (!this.data.organizationNominationIds?.length)
      throw new DataNotFoundError('No organizations provided.');
    return this.data.organizationNominationIds.map((id) => this.root.getOrganizationNomination(id));
  }
}