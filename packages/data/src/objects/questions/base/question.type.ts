import type { Id, QuestionAndCategoryBaseData, QuestionType } from '../../../internal';

export interface QuestionData<TType extends QuestionType = QuestionType> extends QuestionAndCategoryBaseData {
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
  //
  // From QuestionAndCategoryBaseData
  // - info?: string;
  // - electionIds?: FilterValue<Id>;
  // - electionRounds?: FilterValue<number>;
  // - constituencyIds?: FilterValue<Id>;
  // - entityType?: FilterValue<EntityType>;

  /**
   * The type of the question. The type property of `QuestionData` determines the `Question` subclass that it uses.
   */
  type: TType;
  /**
   * Name is required for questions. It is also the text displayed to the user.
   */
  name: string;
  /**
   * The category of the question. Each must belong to one and only one category.
   */
  categoryId: Id;
}
