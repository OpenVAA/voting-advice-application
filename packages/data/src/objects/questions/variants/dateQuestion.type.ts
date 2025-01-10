import type { QUESTION_TYPE, QuestionData } from '../../../internal';

export interface DateQuestionData extends QuestionData<typeof QUESTION_TYPE.Date> {
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
   * Optional formatting options for the `Date`.
   */
  format?: Intl.DateTimeFormatOptions | null;
  /**
   * Optional minimum date value for the question as a date string. If both `min` and `max` are provided, the question can be used in matching.
   * Preferably use the ISO 8601 format: 2019-11-14T00:55:31.820Z
   */
  min?: string | null;
  /**
   * Optional maximum date value for the number question as a date string. If both `min` and `max` are provided, the question can be used in matching.
   * Preferably use the ISO 8601 format: 2019-11-14T00:55:31.820Z
   */
  max?: string | null;
}
