import {
  type Answers,
  NamedObject,
  type DataAccessor,
  type DataRoot,
  type EntityData
} from './internal';

export abstract class Entity extends NamedObject implements DataAccessor<EntityData> {
  constructor(
    public readonly data: EntityData,
    public readonly parent: DataRoot
  ) {
    super(data, parent);
  }

  get answers(): Answers {
    return this.data.answers ?? {};
  }

  get image(): ImageProps | null {
    return this.data.image ?? null;
  }
}
