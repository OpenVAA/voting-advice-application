import type { Choice, ChoiceQuestionType, QuestionData } from '../../../internal';

export interface ChoiceQuestionData<TType extends ChoiceQuestionType = ChoiceQuestionType, TValue = undefined>
  extends QuestionData<TType> {
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
   * The answer choices for this question. Each choice must have a unique id.
   */
  choices: Array<Choice<TValue>>;
}
