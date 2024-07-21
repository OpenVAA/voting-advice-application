import type {HasId, Id, DataAccessor, CanUpdate, NamedObjectData} from './internal';
import {DataObject} from './internal';

export abstract class NamedObject
  extends DataObject
  implements HasId, DataAccessor<NamedObjectData>
{
  constructor(
    public data: NamedObjectData,
    public parent: CanUpdate
  ) {
    super(data, parent);
  }

  get id(): Id {
    return this.data.id;
  }

  get name(): string {
    return this.data.name ?? '';
  }

  get shortName(): string {
    return this.data.shortName ?? this.name;
  }
}
