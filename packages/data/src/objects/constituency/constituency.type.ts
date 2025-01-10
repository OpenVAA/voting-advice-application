import type { DataObjectData, Id } from '../../internal';

export interface ConstituencyData extends DataObjectData {
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
   * Name is required.
   */
  name: string;
  /**
   * An optional list of keywords associated with the constituency, e.g., the names of the municipalities contained within a regional constituency.
   */
  keywords?: Array<string> | null;
  /**
   * The id of a possible root constituency, within which this constituency is nested. This is mainly useful in situation where multiple elections take place on differing levels of a country’s regional hierarchy, such as state-wide, regional and municipal.
   */
  parentId?: Id | null;
}
