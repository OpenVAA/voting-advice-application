import {
  type Answers,
  DataObject,
  type DataAccessor,
  type EntityData,
  type EntityType,
  type Answer,
  isMissingValue,
  type AnswerValue,
  type QuestionVariant,
  type HasAnswers,
  type Image,
  type NominationVariant,
  MultipleChoiceQuestion,
  SingleChoiceQuestion,
  Id,
  QUESTION_TYPE,
  DataTypeError
} from '../../../internal';

/**
 * The abstract base class for all entities, which may have `Answers` and may be thus be matched against. `Entity`s can also be nominated in `{@link Election | Elections}` (see `{@link Nomination}`).
 */
export abstract class Entity<
    TType extends EntityType,
    TData extends EntityData<TType> = EntityData<TType>
  >
  extends DataObject<TData>
  implements DataAccessor<EntityData<TType>>, HasAnswers
{
  /**
   * The Entity's answers to the questions. @defaultValue {}
   */
  get answers(): Answers {
    return this.data.answers ?? {};
  }

  /**
   * Get all the `Nominations` for this entity.
   */
  get nominations(): Array<NominationVariant[TType]> {
    return this.root.getNominationsForEntity(this) ?? [];
  }

  /**
   * The type of the entity.
   */
  get type(): TType {
    return this.data.type;
  }

  /**
   * Returns the `Answer` object for the given question with the `value` property assured to be of the correct type for the question type.
   * @param question - The `Question` to get the answer for.
   * @returns The `Answer` object for the given question or `undefined` if the answer is missing or its `value` is invalid for the question type, it returns `undefined`.
   */
  getAnswer<TQuestion extends QuestionVariant>(
    question: TQuestion
  ): Answer<AnswerValue[TQuestion['type']]> | undefined {
    const answer = this.answers?.[question.id];
    if (!answer) return undefined;
    // AssertValue ensures that the answer value is of the correct type for the question
    const value = question.ensureValue(answer.value) as AnswerValue[TQuestion['type']];
    return isMissingValue(value) ? undefined : {...answer, value};
  }

  /**
   * A utility for showing the `Answer.value` to a question as a formatted string or array of strings. The formatting is controlled by the formatters defined in the `DataRoot`.
   * @param question - The `Question` to get the answer for.
   * @returns A string or an array of strings.
   */
  getFormattedAnswer<TQuestion extends QuestionVariant>(question: TQuestion): string {
    const answer = this.getAnswer(question);
    if (answer == null) return this.root.formatMissingAnswer({question});
    // We use instanceof checks to catch subclasses of choice questions
    if (question instanceof SingleChoiceQuestion)
      // `getAnswer()` ensures that the answer value is not missing and the `Choice` is available
      return this.root.formatTextAnswer({
        question,
        value: question.getChoice((answer as Answer<Id>).value!)!.label
      });
    if (question instanceof MultipleChoiceQuestion)
      // The array may be empty, but that is left for the `multipleText` formatter to handle
      return this.root.formatMultipleTextAnswer({
        question,
        value: (answer as Answer<Array<Id>>).value!.map((id) => question.getChoice(id)!.label)
      });
    // Otherwise the question is of a simple type
    const {type} = question;
    // `getAnswer()` ensures that the answer value is not missing and of the correct type
    const {value} = answer;
    switch (type) {
      case QUESTION_TYPE.Boolean:
        return this.root.formatBooleanAnswer({question, value: value as boolean});
      case QUESTION_TYPE.Date:
        return this.root.formatDateAnswer({question, value: value as Date});
      case QUESTION_TYPE.Image:
        return this.root.formatImageAnswer({question, value: value as Image});
      case QUESTION_TYPE.Number:
        return this.root.formatNumberAnswer({question, value: value as number});
      case QUESTION_TYPE.MultipleText:
        return this.root.formatMultipleTextAnswer({question, value: value as Array<string>});
      case QUESTION_TYPE.Text:
        return this.root.formatTextAnswer({question, value: value as string});
      default:
        throw new DataTypeError(`Unsupported question type: ${type}`);
    }
  }
}
