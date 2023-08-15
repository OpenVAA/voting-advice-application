/*
 * The class for electoral alliances between political organisations,
 * such as parties or constituency associations. Alliances may be
 * election-wide or a specific to constituencies.
 */

// TO DO: NOT YET IMPLEMENTED
// Also add accessors to Organization(Nomination)

import type {Id} from '../../data.types';
import type {DataRoot} from '../dataRoot';
import {Entity, type EntityData} from './entity';

export interface AllianceData extends EntityData {
  organizationIds: Id[];
}

export class Alliance extends Entity {
  constructor(public data: AllianceData, public parent: DataRoot) {
    super(data, parent);
    throw new Error('Not implemented!');
  }
}
