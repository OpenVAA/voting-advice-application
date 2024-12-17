import type { QuestionAndCategoryBaseData, QuestionCategoryType } from '../../../internal';

export interface QuestionCategoryData extends QuestionAndCategoryBaseData {
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
   * The type of the question category. @defaultValue QUESTION_CATEGORY_TYPE.Default
   */
  type?: QuestionCategoryType | null;
}
