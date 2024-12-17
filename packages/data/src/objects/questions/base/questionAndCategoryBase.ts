import { DataObject, match } from '../../../internal';
import type {
  Constituency,
  DataAccessor,
  Election,
  EntityType,
  FilterTargets,
  FilterValue,
  QuestionAndCategoryBaseData
} from '../../../internal';

/**
 * An abstract base class for both `Question`s and `QuestionCategory`s. Provides the filtering functionality, which allows restricting either types to specific elections, election rounds, constituencies or entity types.
 */
export class QuestionAndCategoryBase<TData extends QuestionAndCategoryBaseData>
  extends DataObject<TData>
  implements DataAccessor<QuestionAndCategoryBaseData>
{
  /**
   * An optional filter value that contains the numbers of the election rounds for which this question or category should only be shown.
   */
  get electionRounds(): FilterValue<number> | null {
    return this.data.electionRounds ?? null;
  }

  /**
   * An optional filter value that contains the entity types for which this question or category should only be shown.
   */
  get entityType(): FilterValue<EntityType> | null {
    return this.data.entityType ?? null;
  }

  /**
   * An optional filter value that contains the elections for which this question or category should only be shown.
   */
  get elections(): Array<Election> {
    return this.data.electionIds ? [this.data.electionIds].flat().map((id) => this.root.getElection(id)) : [];
  }

  /**
   * An optional filter value that contains the constituencies for which this question or category should only be shown.
   */
  get constituencies(): Array<Constituency> {
    return this.data.constituencyIds
      ? [this.data.constituencyIds].flat().map((id) => this.root.getConstituency(id))
      : [];
  }

  /**
   * Check if the question or category applies to the given filter targets.
   * @param targets - The targets to check for
   * @returns True if the question or category applies
   */
  appliesTo(targets: FilterTargets): boolean {
    const { elections, electionRounds, entityType, constituencies } = targets;
    if (elections && !match({ filter: this.data.electionIds, target: [elections].flat().map((e) => e.id) }))
      return false;
    if (electionRounds && !match({ filter: this.data.electionRounds, target: electionRounds })) return false;
    if (entityType && !match({ filter: this.data.entityType, target: entityType })) return false;
    if (
      constituencies &&
      !match({
        filter: this.data.constituencyIds,
        target: [constituencies].flat().map((c) => c.id)
      })
    )
      return false;
    return true;
  }
}
