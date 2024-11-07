import type { ENTITY_TYPE, EntityData } from '../../../internal';

export type AllianceData = EntityData<typeof ENTITY_TYPE.Alliance>;
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
