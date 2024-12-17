import type { QUESTION_TYPE, QuestionData } from '../../../internal';

export interface NumberQuestionData extends QuestionData<typeof QUESTION_TYPE.Number> {
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
  //
  // From QuestionData<TType>
  // - type: TType;
  // - name: string;
  // - categoryId: Id;

  /**
   * Optional formatting options for the `number`.
   */
  format?: Intl.NumberFormatOptions | null;
  /**
   * Optional minimum value for the number question. If both `min` and `max` are provided, the question can be used in matching.
   */
  min?: number | null;
  /**
   * Optional maximum value for the number question. If both `min` and `max` are provided, the question can be used in matching.
   */
  max?: number | null;
}
