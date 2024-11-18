import type { Answers, DataObjectData, EntityType } from '../../../internal';

export interface EntityData<TType extends EntityType = EntityType> extends DataObjectData {
  // From HasId
  // - id: Id;
  //
  // From DataObjectData
  // - color?: Colors | null;
  // - image?: Image | null;
  // - name?: string;
  // - shortName?: string;
  // - info?: string;
  // - order?: number;
  // - customData?: object;
  // - subtype?: string;
  // - isGenerated?: boolean;

  /**
   * The entity’s answers to the questions. @defaultValue {}
   */
  answers?: Answers | null;
  /**
   * The type of the entity.
   */
  type: TType;
}
