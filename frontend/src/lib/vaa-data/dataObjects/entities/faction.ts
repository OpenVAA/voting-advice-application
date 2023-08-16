/*
 * The class for party factions, which are a peculiarity of the ley de
 * lemas system.
 */

// TO DO: NOT YET IMPLEMENTED
// Also add accessors to Person(Nomination)

import type {Id} from '../../data.types';
import type {DataRoot} from '../dataRoot';
import {Entity, type EntityData} from './entity';

export interface FactionData extends EntityData {
  personIds: Id[];
}

export class Faction extends Entity {
  constructor(public data: FactionData, public parent: DataRoot) {
    super(data, parent);
    throw new Error('Not implemented!');
  }
}
