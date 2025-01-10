import {
  Candidate,
  type DataAccessor,
  DataNotFoundError,
  Entity,
  ENTITY_TYPE,
  type FactionData,
  Organization,
  removeDuplicates
} from '../../../internal';

/**
 * A subgroup of a party, used in ’ley de lemas’ electoral systems.
 * The `Faction` entity represents the entity behind an `FactionNomination`. `Faction`s need rarely be explicitly created because they are often specific to a particular constituency and defined as part of the `FactionNomination`. In such cases, a generic `Faction` will still be created.
 * A `Faction` can be explicitly created if it provides answers to the questions or if has a unique name, logo or other properties that are shared between multiple `FactionNomination`s belonging to it.
 */
export class Faction extends Entity<typeof ENTITY_TYPE.Faction, FactionData> implements DataAccessor<FactionData> {
  /**
   * The `Candidate`s that belong to the `Faction` are implied by the `Nomination`s belonging to it.
   */
  get candidates(): Array<Candidate> {
    return removeDuplicates(this.nominations.map((n) => n.candidateNominations.map((cn) => cn.entity)).flat());
  }

  /**
   * The name of the `Faction`. @defaultValue '—'
   */
  get name(): string {
    return this.data.name || this.root.formatFactionName({ object: this });
  }

  /**
   * The `Organization` the faction belongs to via a `FactionNomination`.
   * @throws If the `Organization` cannot be found.
   */
  get organization(): Organization {
    const org = this.root.factionNominations?.find((n) => `${n.data.entityId}` === this.id)?.parentNomination?.entity;
    if (!org) throw new DataNotFoundError(`Organization not found for Faction ${this.id}`);
    return org;
  }
}
