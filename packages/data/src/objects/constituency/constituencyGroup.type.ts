import type { DataObjectData, Id } from '../../internal';

export interface ConstituencyGroupData extends DataObjectData {
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
   * The ids of the constituencies that belong to this group. Be sure to provide the matching constituency and group data to the data root.
   */
  constituencyIds: Array<Id>;
}
