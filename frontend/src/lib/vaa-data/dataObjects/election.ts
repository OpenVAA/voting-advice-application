/*
 * The NamedDataObject class for an election.
 *
 * TO DO: Add election-specific settings to data model here, such as:
 * resultEntities?: EntityType[]
 */

import type {Id} from '../data.types';
import {NamedDataObject, type NamedDataObjectData} from './namedDataObject';
import type {DataRoot} from './dataRoot';
import {DataObjectCollection} from './dataObjectCollection';
import {
  AllianceNomination,
  FactionNomination,
  PersonNomination,
  OrganizationNomination,
  type NominationData,
  EntityType,
  type AllianceNominationData,
  type FactionNominationData,
  type OrganizationNominationData,
  type PersonNominationData,
  Alliance,
  Faction,
  Organization,
  Person,
  Nomination
} from './entities';
import {filterItems} from '../filter';

export interface ElectionData extends NamedDataObjectData {
  /**
   * The name of the Election, not of the whole App
   */
  name: string;
  /**
   * The date after which the election can be treated as past.
   */
  date: Date;
  /**
   * The ids of the ConstituencyCategories or
   * ConstituencyCategoryFragments that the Constituencies used in
   * this election belong to.
   */
  constituencyCategoryIds: Id[];
  /**
   * Set to true if the Election can have multiple rounds.
   */
  multipleRounds?: boolean;
  /**
   * The optional current round of the Election if it has multiple
   * rounds. Defaults to 1.
   */
  round?: number;
}

export class Election extends NamedDataObject {
  // We want to use special keys with Nominations to avoid confusion between the
  // Nomination's own id and that of the wrapped Entity
  nominations = {
    alliances: new DataObjectCollection<AllianceNomination>([]),
    factions: new DataObjectCollection<FactionNomination>([]),
    persons: new DataObjectCollection<PersonNomination>([]),
    organizations: new DataObjectCollection<OrganizationNomination>([])
  };

  constructor(public data: ElectionData, parent: DataRoot) {
    super(data, parent);
  }

  /**
   * Use with caution. Mainly for debugging
   */
  get allNominations() {
    return new DataObjectCollection<Nomination>(
      Object.values(this.nominations)
        .map((n) => n.items)
        .flat()
    );
  }

  get date() {
    return this.data.date;
  }

  get multipleRounds() {
    return this.data.multipleRounds ?? false;
  }

  get round() {
    return this.data.round ?? 1;
  }

  get constituencyCategoryIds() {
    return this.data.constituencyCategoryIds;
  }

  // TO DO: This call maybe takes some unncessary processing. The option would be to
  // update a local list of ConstituencyCategories inside the Election, but then we
  // would have to subscribe to any changes to the root's constituencyCategories
  // object list.
  get constituencyCategories() {
    return this.root.constituencyCategories.filterAsList({id: this.constituencyCategoryIds});
  }

  // TO DO: See above for remarks
  get constituencies() {
    return this.constituencyCategories.mapAsList((cat) => cat.constituencies.items);
  }

  /**
   * A utility method to provide Nomination objects.
   *
   * TO DO: Remove this and provide these as part of constructor
   * data the same way as in ConstituencyCategory.
   *
   * @param data All availale data which are then filtered
   */
  provideNominationData(data: NominationData[]) {
    data = filterItems(data, {electionId: this.id});
    const ents = this.root.entities;
    const _getEnt = (coll: keyof typeof ents, d: NominationData) => {
      const ent = ents[coll].byId(d.entityId);
      if (!ent) {
        throw new Error(`Entity for ${d.entityId} not found!`);
      }
      return ent;
    };
    this.nominations.alliances.extend(
      filterItems(data, {entityType: EntityType.Alliance}).map(
        (d) =>
          new AllianceNomination(
            d as AllianceNominationData,
            this,
            _getEnt('alliances', d) as Alliance
          )
      )
    );
    this.nominations.factions.extend(
      filterItems(data, {entityType: EntityType.Faction}).map(
        (d) =>
          new FactionNomination(d as FactionNominationData, this, _getEnt('factions', d) as Faction)
      )
    );
    this.nominations.organizations.extend(
      filterItems(data, {entityType: EntityType.Organization}).map(
        (d) =>
          new OrganizationNomination(
            d as OrganizationNominationData,
            this,
            _getEnt('organizations', d) as Organization
          )
      )
    );
    this.nominations.persons.extend(
      filterItems(data, {entityType: EntityType.Person}).map(
        (d) =>
          new PersonNomination(d as PersonNominationData, this, _getEnt('persons', d) as Person)
      )
    );
  }
}
