import type { DataObjectData, Id } from '../../internal';

export interface ElectionData extends DataObjectData {
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
   * The ids of the constituency groups the nominations in this election are in. Be sure to provide the matching constituency and group data to the data root.
   */
  constituencyGroupIds: Array<Id>;
  /**
   * The date after which the election can be treated as past, i.e., the end of the voting period.
   */
  date?: string | null;
  /**
   * Set to true if the election can have multiple rounds.
   */
  multipleRounds?: boolean | null;
  /**
   * The optional current round of the election if it has multiple rounds. Defaults to 1.
   */
  round?: number | null;
}
