/*
 * The class for political organisations, such as parties and
 * consituency associations, which may nominate candidates in
 * an Election. They can also contain factions, which are a
 * peculiarity of the ley de lemas system.
 */

import type {DataRoot} from '../dataRoot';
import {Entity, type EntityData} from './entity';

export type OrganizationData = EntityData;

export class Organization extends Entity {
  /**
   * @param parent The parent of Persons is always the DataRoot even if they belong to an Organization,
   * because membership in one is not required.
   */
  constructor(public data: OrganizationData, public parent: DataRoot) {
    super(data, parent);
  }
}
