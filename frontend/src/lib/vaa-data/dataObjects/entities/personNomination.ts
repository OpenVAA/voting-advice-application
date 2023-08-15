/*
 * A wrapper for Persons to place them as candidates in Elections and
 * Constituencies.
 */

import type {Election} from '../election';
import type {EntityType, EntityWrapper} from './entity';
import {Nomination, type NominationData} from './nomination';
import type {OrganizationNomination} from './organizationNomination';
import type {Person} from './person';

export interface PersonNominationData extends NominationData {
  entityType: EntityType.Person;
}

export class PersonNomination extends Nomination implements EntityWrapper<Person> {
  constructor(public data: PersonNominationData, public parent: Election, public entity: Person) {
    super(data, parent, entity);
  }

  /**
   * The the nomination lists this PersonNomination is on.
   * NB. There might be zero, one or more of these.
   */
  get organizationNominations(): OrganizationNomination[] {
    return this.election.nominations.organizations.filter({personNominationIds: this.nominationId});
  }

  /**
   * Is an independent candidate.
   */
  get isIndependent() {
    return !this.organizationId;
  }

  /**
   * Whether the Person belongs to the nominating organization and is only
   * nominated by one.
   */
  get memberOfNominatingOrganization() {
    const noms = this.organizationNominations;
    return (
      this.organization &&
      noms.length === 1 &&
      noms.map((n) => n.entity).includes(this.organization)
    );
  }

  // Wrapper accessors

  get initials() {
    return this.entity.initials;
  }

  get familyName() {
    return this.entity.familyName;
  }

  get givenName() {
    return this.entity.givenName;
  }

  get namePrefix() {
    return this.entity.namePrefix;
  }

  get nameSuffix() {
    return this.entity.nameSuffix;
  }

  get organizationId() {
    return this.entity.organizationId;
  }

  get organization() {
    return this.entity.organization;
  }
}
