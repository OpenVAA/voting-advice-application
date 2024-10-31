import type {Constituency, ConstituencyGroupData, DataAccessor} from '../../internal';
import {DataObject} from '../../internal';

/**
 * A group of `Constituency` objects that the voter can choose from. An `Election` usually has only one such group, but in some cases the voters may be eligible to cast their vote in both a geographical and an ethnic `Constituency`.
 */
export class ConstituencyGroup
  extends DataObject<ConstituencyGroupData>
  implements DataAccessor<ConstituencyGroupData>
{
  /**
   * The constituencies that belong to this group.
   */
  get constituencies(): Array<Constituency> {
    return this.data.constituencyIds.map((id) => this.root.getConstituency(id));
  }

  /**
   * Returns `true` if the groups only has a single constituency.
   */
  get singleConstituency(): boolean {
    return this.data.constituencyIds.length === 1;
  }
}
