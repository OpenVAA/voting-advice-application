import { order, QUESTION_CATEGORY_TYPE, QuestionAndCategoryBase } from '../../../internal';
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
   */
  getApplicableQuestions(targets: FilterTargets): Collection<AnyQuestionVariant> {
    return this.questions.filter((q) => q.appliesTo(targets));
  }
}
