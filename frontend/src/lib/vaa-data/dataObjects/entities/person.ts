/*
 * The class for persons which may or may not be candidates in
 * an Election.
 */

import type {Id} from '../../data.types';
import {createShortName} from '../../utils';
import type {DataRoot} from '../dataRoot';
import {Entity, type EntityData} from './entity';
import type {Organization} from './organization';

export interface PersonNameData {
  familyName: string;
  givenName?: string;
  namePrefix?: string;
  nameSuffix?: string;
  initials?: string;
}

export interface PersonData extends EntityData, PersonNameData {
  imageUrl?: string;
  /**
   * Set this to the Id or the Organization the Person is a member of.
   * Note that for independent candidates, leave this empty, but include
   * the PersonNomination in the OrganizationNomination.personNominations.
   */
  organizationId?: Id;
}

/**
 * The class for persons which may or may not be candidates.
 */
export class Person extends Entity {
  /**
   * @param parent The parent of Persons is always the DataRoot even if they belong to an Organization,
   * because membership in one is not required.
   */
  constructor(public data: PersonData, public parent: DataRoot) {
    super(data, parent);
  }

  // We override this get a nice full name
  get name() {
    return [this.namePrefix, this.givenName, this.familyName, this.nameSuffix].join(' ').trim();
  }

  // We override this, too
  get shortName() {
    return this.data.shortName ? this.data.shortName : this.getShortName();
  }

  get initials() {
    return this.data.initials ? this.data.initials : this.getShortName(true);
  }

  protected getShortName(initialsOnly = false) {
    return createShortName(
      {
        namePrefix: this.namePrefix,
        nameSuffix: this.nameSuffix,
        familyName: this.familyName,
        givenName: this.givenName
      },
      initialsOnly
    );
  }

  get familyName() {
    return this.data.familyName;
  }

  get givenName() {
    return this.data.givenName ?? '';
  }

  get namePrefix() {
    return this.data.namePrefix ?? '';
  }

  get nameSuffix() {
    return this.data.nameSuffix ?? '';
  }

  get organizationId() {
    return this.data.organizationId ?? '';
  }

  // Get the political Organization this Person is a member of
  get organization(): Organization | undefined {
    return this.data.organizationId
      ? this.root.entities.organizations.byId(this.organizationId)
      : undefined;
  }
}
