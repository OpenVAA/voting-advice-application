import type {Id, NamedObjectData, SerializableValue} from './internal';

export interface EntityData extends NamedObjectData {
  // From NamedObjectData
  // - order?: number;
  // - id: Id;
  // - name?: string;
  answers?: Answers;
  image?: ImageProps | null;
}

// TODO: Move these types to separate files

export type Answers = Record<Id, Answer>;

export type Answer = {
  openAnswer?: string;
  value: SerializableValue;
};
