import type { ChoiceQuestionData, MultipleChoiceQuestionType } from '../../../internal';

export interface MultipleChoiceQuestionData<TType extends MultipleChoiceQuestionType, TValue = number>
  extends ChoiceQuestionData<TType, TValue> {
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
  //
  // From ChoiceQuestionData<TType, TValue>
  // - choices: Array<Choice<TValue>>;

  /**
   * Whether or not the same choice can be selected multiple times. @defaultValue false
   * NB. `allowDuplicates` is assumed `false` if `ordered` is `true`.
   */
  allowDuplicates?: boolean | null;
  /**
   * Whether or not the answer options can be ordered. @defaultValue false
   */
  ordered?: boolean | null;
}
