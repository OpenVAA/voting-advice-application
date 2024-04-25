/*
 * Matching utility functions
 *
 * NB. This is a temporary implementation which will be replaced with a proper one when the `vaa-data` model is implemented. The model will allow the passing of its consituent objects directly to the matching algorithm without need for constructing mediating objects, such as `LikertQuestion`s below.
 */

import {
  type MatchingOptions,
  MatchingAlgorithm,
  MISSING_VALUE,
  MultipleChoiceQuestion,
  DistanceMetric,
  MissingValueDistanceMethod,
  type MatchableQuestionGroup
} from '$voter/vaa-matching';
import {error} from '@sveltejs/kit';
import {logDebugError} from './logger';

/**
 * Run the matching algorithm.
 * @param allQuestions All of the available questions
 * @param answeredQuestions The question-answer dictionary of the user's answers
 * @param entities The candidates or parties to include in the matching
 * @returns The matching results as entities wrapped in ranking properties
 */
export function match<E extends EntityProps>(
  allQuestions: QuestionProps[],
  answeredQuestions: AnswerDict,
  entities: E[]
): RankingProps<E>[] {
  // Create the algorithm instance
  const algorithm = new MatchingAlgorithm({
    distanceMetric: DistanceMetric.Manhattan,
    missingValueOptions: {
      missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
    }
  });

  // Convert question data into proper question objects
  const questions = [] as LikertQuestion[];
  allQuestions.forEach((q) => {
    if (q.category.type !== 'opinion') return;
    if (q.type !== 'singleChoiceOrdinal' || !q.values)
      error(
        500,
        `Unsupported opinion question type ${q.type} or question without values: length ${q.values?.length}.`
      );
    questions.push(
      new LikertQuestion({
        id: q.id,
        values: q.values.map((o) => ({value: o.key})),
        category: q.category
      })
    );
  });

  // Create voter object
  const voter = {answers: answeredQuestions};

  // Check that we still have some answers
  if (Object.keys(voter.answers).length === 0) {
    return [];
  }

  // Create answer subgroups
  // We only consider those subgroups that the voter has answered
  const answeredIds = new Set(Object.keys(voter.answers));
  const categories = [
    ...new Set(
      questions
        .filter((q) => answeredIds.has(q.id))
        .map((q) => q.category)
        .filter((c) => c != null)
    )
  ] as QuestionCategoryProps[];
  const matchingOptions: MatchingOptions<QuestionCategoryProps & MatchableQuestionGroup> = {
    questionGroups: categories.map((c) => ({
      ...c,
      matchableQuestions: questions.filter((q) => q.category === c)
    }))
  };

  // Perform the matching
  return algorithm.match(questions, voter, entities, matchingOptions);
}

/**
 * Performs a naïve party match based on the mean of their candidates' answers.
 * NB. This will not overwrite any existing party answers.
 * NB. The current implementation will only consider single-choice questions.
 * @param allQuestions All of the available questions
 * @param answeredQuestions The question-answer dictionary of the user's answers
 * @param candidates The candidates to include in the matching
 * @param parties The parties to include in the matching
 * @returns The matching results as entities wrapped in ranking properties
 */
export function matchParties(
  allQuestions: QuestionProps[],
  answeredQuestions: AnswerDict,
  candidates: CandidateProps[],
  parties: PartyProps[]
): RankingProps<PartyProps>[] {
  // Calculate average answers for each party for each question
  for (const party of parties) {
    if (!party.answers) party.answers = {};
    const partyCands = candidates.filter((c) => c.party?.id === party.id);
    for (const qid of Object.keys(answeredQuestions)) {
      if (party.answers[qid] != null) continue;
      const answers = partyCands
        .map((c) => c.answers[qid]?.value)
        .filter((v) => {
          if (v == null) return false;
          if (typeof v !== 'number') {
            logDebugError(
              `Matching.matchParties: Invalid answer type ${typeof v} (only numbers allowd). Value: ${v}.`
            );
            return false;
          }
          return true;
        }) as number[];
      // Calculate average answer
      party.answers[qid] = {
        value: answers.length ? answers.reduce((a, b) => a + b, 0) / answers.length : MISSING_VALUE
      };
    }
  }
  return match(allQuestions, answeredQuestions, parties);
}

/**
 * Options for a dummy question object for matching.
 */
interface LikertQuestionOptions {
  id: ConstructorParameters<typeof MultipleChoiceQuestion>[0];
  values: ConstructorParameters<typeof MultipleChoiceQuestion>[1];
  category?: QuestionCategoryProps;
}

/**
 * A dummy question object for matching.
 */
class LikertQuestion extends MultipleChoiceQuestion {
  public readonly category: QuestionCategoryProps | undefined;
  constructor({id, values, category}: LikertQuestionOptions) {
    super(id, values);
    this.category = category;
  }
}
