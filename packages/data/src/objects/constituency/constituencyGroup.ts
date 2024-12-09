import { DataObject } from '../../internal';
import type { Constituency, ConstituencyGroupData, DataAccessor } from '../../internal';

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
   * Returns the single `Constituency` if the group only has a one, `null` otherwise.
   */
  get singleConstituency(): Constituency | null {
    return this.data.constituencyIds.length === 1 ? this.root.getConstituency(this.data.constituencyIds[0]) : null;
  }
}
