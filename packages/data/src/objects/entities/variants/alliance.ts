import {
  type AllianceData,
  type DataAccessor,
  Entity,
  ENTITY_TYPE,
  Organization,
  removeDuplicates
} from '../../../internal';

/**
 * The `Alliance` entity represents the entity behind an `AllianceNomination`. `Alliance`s need rarely be explicitly created because they are often specific to a particular constituency and defined as part of the `AllianceNomination`. In such cases, a generic `Alliance` will still be created.
 * An `Alliance` can be explicitly created if it provides answers to the questions or if has a unique name, logo or other properties that are shared between multiple `AllianceNomination`s belonging to it.
 */
export class Alliance extends Entity<typeof ENTITY_TYPE.Alliance, AllianceData> implements DataAccessor<AllianceData> {
  /**
   * The `Organization`s that belong to the `Alliance` are implied by the `Nomination`s belonging to it.
   */
  get organizations(): Array<Organization> {
    return removeDuplicates(this.nominations.map((n) => n.organizationNominations.map((on) => on.entity)).flat());
  }

  /**
   * The name of the `Alliance`. @defaultValue Combination of the member `Organization`s’ names.
   */
  get name(): string {
    return this.data.name || this.root.formatAllianceName({ object: this });
  }

  /**
   * The short name of the `Alliance`. @defaultValue Combination of the member `Organization`s’ short names.
   */
  get shortName(): string {
    return this.data.shortName || this.root.formatAllianceShortName({ object: this });
  }
}
