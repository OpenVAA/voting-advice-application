import type {ENTITY_TYPE, EntityData, Id} from '../../../internal';

export interface FactionData extends EntityData<typeof ENTITY_TYPE.Faction> {
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
  //
  // From EntityData<typeof ENTITY_TYPE.Alliance>
  // - answers?: Answers;
  // - type: TType;
}
