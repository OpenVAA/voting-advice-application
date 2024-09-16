import {type PartyData, type DataAccessor, type DataRoot, Entity} from './internal';

export class Party extends Entity implements DataAccessor<PartyData> {
  constructor(
    public readonly data: PartyData,
    public readonly parent: DataRoot
  ) {
    super(data, parent);
  }
}
