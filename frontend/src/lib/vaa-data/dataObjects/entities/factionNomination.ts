// TO DO: NOT YET IMPLEMENTED
// Also add accessors to Person(Nomination)

import type {Id} from '../../data.types';
import type {Election} from '../election';
import type {EntityType} from './entity';
import type {Faction} from './faction';
import {Nomination, type NominationData} from './nomination';

export interface FactionNominationData extends NominationData {
  entityType: EntityType.Faction;
  personNominationIds?: Id[];
}

export class FactionNomination extends Nomination {
  constructor(public data: FactionNominationData, public parent: Election, public entity: Faction) {
    super(data, parent, entity);
    throw new Error('Not implemented!');
  }
}
