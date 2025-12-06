import { OBJECT_TYPE, order, QUESTION_CATEGORY_TYPE, QuestionAndCategoryBase } from '../../../internal';
import type {
  AnyQuestionVariant,
  Collection,
  DataAccessor,
  FilterTargets,
  QuestionCategoryData,
  QuestionCategoryType
} from '../../../internal';

/**
 * A collection of questions. All questions must have an associated category but may belong to many categories.
 */
export class QuestionCategory
  extends QuestionAndCategoryBase<QuestionCategoryData>
  implements DataAccessor<QuestionCategoryData>
{
  readonly objectType = OBJECT_TYPE.QuestionCategory;

  /**
   * An arbitrary type for the question category.
   */
  get type(): QuestionCategoryType {
    return this.data.type ?? QUESTION_CATEGORY_TYPE.Default;
  }

  /**
   * Get the questions in this category.
   */
  get questions(): Collection<AnyQuestionVariant> {
    return this.root.questions.filter((q) => q.category.id === this.id).sort(order) ?? [];
  }

  /**
   * Get the questions in this category that match the given filter targets.
   * @param targets - The targets to check for
   * @param options.dontInherit - If set to true, only check the question's own filters, not the category's. Otherwise this will retur an empty collection if the category itself is not applicable.
   */
  getApplicableQuestions(targets: FilterTargets, options?: { dontInherit?: boolean }): Collection<AnyQuestionVariant> {
    if (!options?.dontInherit && !this.appliesTo(targets)) return [];
    return this.questions.filter((q) => q.appliesTo(targets, { dontInherit: true }));
  }
}
