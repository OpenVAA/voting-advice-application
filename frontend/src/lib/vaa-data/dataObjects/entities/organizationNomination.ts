import type {Id} from '../../data.types';
import type {Election} from '../election';
import type {EntityType} from './entity';
import {Nomination, type NominationData} from './nomination';
import type {Organization} from './organization';

export interface OrganizationNominationData extends NominationData {
  type: EntityType.Organization;
  factionNominationIds?: Id[];
  personNominationIds?: Id[];
}

export class OrganizationNomination extends Nomination {
  constructor(
    public data: OrganizationNominationData,
    public parent: Election,
    public entity: Organization
  ) {
    super(data, parent, entity);
  }

  // Own getters

  get factionNominationIds() {
    return this.data.factionNominationIds ?? [];
  }

  get factionNominations() {
    return this.election.nominations.factions.filter({nominationId: this.factionNominationIds});
  }

  get personNominationIds() {
    return this.data.personNominationIds ?? [];
  }

  get personNominations() {
    return this.election.nominations.persons.filter({nominationId: this.personNominationIds});
  }
}
