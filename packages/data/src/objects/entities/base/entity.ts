import {
  type Answer,
  AnswerFormatterParams,
  type Answers,
  type AnswerValue,
  type AnyQuestionVariant,
  ArrayAnswerFormatterOptions,
  Constituency,
  CoreEntity,
  type DataAccessor,
  DataObject,
  Election,
  type EntityData,
  type EntityType,
  type HasAnswers,
  type NominationVariant
} from '../../../internal';

/**
 * The abstract base class for all entities, which may have `Answers` and may be thus be matched against. `Entity`s can also be nominated in `{@link Election | Elections}` (see `{@link Nomination}`).
 */
export abstract class Entity<TType extends EntityType, TData extends EntityData<TType> = EntityData<TType>>
  extends DataObject<TData>
  implements DataAccessor<EntityData<TType>>, CoreEntity, HasAnswers
{
  //////////////////////////////////////////////////////////////////////////////
  // Property getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * The Entity's answers to the questions. @defaultValue {}
   */
  get answers(): Answers {
    return this.data.answers ?? {};
  }

  /**
   * The type of the entity.
   */
  get type(): TType {
    return this.data.type;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Collection getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * All `Question`s that have been answered by this entity.
   */
  get answeredQuestions(): Array<AnyQuestionVariant> {
    return Object.entries(this.answers)
      .filter(([, answer]) => answer?.value != null)
      .map(([id]) => this.root.getQuestion(id));
  }

  /**
   * Get all `Nominations` for this entity.
   */
  get nominations(): Array<NominationVariant[TType]> {
    return this.root.getNominationsForEntity(this) ?? [];
  }

  /**
   * Get all `Nominations` for this entity that match the given `Election` and its current round and `Constituency`.
   * @param election - The `Election` to filter the nominations by.
   * @param constituency - The `Constituency` to filter the nominations by.
   */
  getApplicableNominations({
    election,
    constituency
  }: {
    election: Election;
    constituency: Constituency;
  }): Array<NominationVariant[TType]> {
    return (
      this.root.getNominationsForEntity(this, {
        electionId: election.id,
        electionRound: election.round,
        constituencyId: constituency.id
      }) ?? []
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // Object getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Returns the `Answer` object for the given question with the `value` property assured to be of the correct type for the question type.
   * @param question - The `Question` to get the answer for.
   * @returns The `Answer` object for the given question or `undefined` if the answer is missing or its `value` is invalid for the question type, it returns `undefined`.
   */
  getAnswer<TQuestion extends AnyQuestionVariant>(
    question: TQuestion
  ): Answer<AnswerValue[TQuestion['type']]> | undefined {
    const answer = this.answers?.[question.id];
    return question.ensureAnswer(answer) as Answer<AnswerValue[TQuestion['type']]> | undefined;
  }

  /**
   * A utility for showing the `Answer.value` to a question as a string. The formatting is controlled by the formatters defined in the `DataRoot`.
   * @param question - The `Question` to get the answer for.
   * @param rest - Additional arguments for the `formatAnswer` method.
   * @returns A string.
   */
  getFormattedAnswer<TQuestion extends AnyQuestionVariant>({
    question,
    ...rest
  }: { question: TQuestion } & ArrayAnswerFormatterOptions): string {
    const answer = this.getAnswer(question);
    return this.root.formatAnswer({ question, answer, ...rest } as unknown as AnswerFormatterParams<TQuestion>);
  }
}
