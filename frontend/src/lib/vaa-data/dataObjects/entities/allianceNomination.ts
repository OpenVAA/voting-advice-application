// TO DO: NOT YET IMPLEMENTED
// Also add accessors to Organization(Nomination)

import type {Id} from '../../data.types';
import type {Election} from '../election';
import type {Alliance} from './alliance';
import type {EntityType} from './entity';
import {Nomination, type NominationData} from './nomination';

export interface AllianceNominationData extends NominationData {
  entityType: EntityType.Alliance;
  organizationNominationIds: Id[];
}

export class AllianceNomination extends Nomination {
  constructor(
    public data: AllianceNominationData,
    public parent: Election,
    public entity: Alliance
  ) {
    super(data, parent, entity);
    throw new Error('Not implemented!');
  }
}
