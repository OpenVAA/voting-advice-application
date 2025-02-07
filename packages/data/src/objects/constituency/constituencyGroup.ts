import { DataObject } from '../../internal';
import type { Constituency, ConstituencyGroupData, DataAccessor, Id } from '../../internal';

/**
 * A group of `Constituency` objects that the voter can choose from. An `Election` usually has only one such group, but in some cases the voters may be eligible to cast their vote in both a geographical and an ethnic `Constituency`.
 */
export class ConstituencyGroup
  extends DataObject<ConstituencyGroupData>
  implements DataAccessor<ConstituencyGroupData>
{
  //////////////////////////////////////////////////////////////////////////////
  // Property getters
  //////////////////////////////////////////////////////////////////////////////

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

  //////////////////////////////////////////////////////////////////////////////
  // Implied Constituencies
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Returns `true` if this group is implied by the other group, `false` otherwise. This means that instead of selecting a `Constituency` for both this and the other group, selecting one in the other can always be used imply a `Constituency` in this group and that this is true for all of the `Constituency`s in this group.
   * The implication is either direct, i.e., that a `Constituency` is in both groups or via parentage such that the `Constituency` in this group is a parent of a one in the other group.
   * NB. This method only checks for direct implication, e.g, grand parents are not included.
   * @param group - The group to check for implication.
   */
  impliedBy(group: ConstituencyGroup): boolean {
    // Only a group of the same or larger size can imply this.
    if (this.data.constituencyIds.length > group.data.constituencyIds.length) return false;
    // Use ids for matching
    const ownConstituencyIds = this.data.constituencyIds;
    const othersConstituencies = group.constituencies;
    const othersConstituencyIds = group.data.constituencyIds;
    const othersParentIds = group.constituencies
      .map((c) => c.parentConstituency)
      .filter((p) => p != null)
      .map((p) => p.id);
    // Use other to imply this if:
    // 1. every constituency in this is a member of or the parent of some constituency in the other, and
    if (!ownConstituencyIds.every((id) => othersConstituencyIds.includes(id) || othersParentIds.includes(id)))
      return false;
    // 2. every constituency in other is a member of this or has a parent in this
    return othersConstituencies.every(
      (c) =>
        ownConstituencyIds.includes(c.id) ||
        (c.parentConstituency && ownConstituencyIds.includes(c.parentConstituency.id))
    );
  }

  /**
   * Returns an implied (as defined in `impliedBy`) `Constituency` in this group if it exists, `null` otherwise.
   * NB. In contrast to `impliedBy`, this method does include grand parents.
   * @param constituency - The constituency to check for implication, i.e., a member of this group or one this group’s members children.
   */
  getImpliedConstituency(constituency: Constituency): Constituency | null {
    const lineageIds = new Array<Id>();
    let current: Constituency | null = constituency;
    while (current != null) {
      lineageIds.push(current.id);
      current = current.parentConstituency;
    }
    const results = this.constituencies.filter((c) => lineageIds.includes(c.id));
    if (results.length > 1) throw new Error(`Multiple constituencies match the lineage: ${lineageIds.join(', ')}`);
    return results[0] ?? null;
  }
}
