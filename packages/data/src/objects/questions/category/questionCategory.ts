import { order, QUESTION_CATEGORY_TYPE, QuestionAndCategoryBase } from '../../../internal';
import type {
  AnyQuestionVariant,
  Collection,
  DataAccessor,
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
    return this.root.questions?.filter((q) => q.category === this).sort(order) ?? [];
  }
}
