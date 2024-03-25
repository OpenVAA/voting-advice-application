import {
  type MatchingOptions,
  MatchingAlgorithm,
  MultipleChoiceQuestion,
  DistanceMetric,
  MissingValueDistanceMethod,
  type MatchableQuestionGroup
} from '$voter/vaa-matching';
import {error} from '@sveltejs/kit';

/**
 * Perform the candidate matching. NB. We can't use the stores directly, because they
 * will not be reliably updated when called from within a module.
 * This is a placeholder for demo purposes. In the proper app, all of the
 * objects in the stores will be in a form consumed by the matching algorithm
 * by default.
 * TODO: Write proper implementation.
 */
export function matchCandidates(
  allQuestions: QuestionProps[],
  answeredQuestions: AnswerDict,
  candidates: CandidateProps[]
): RankingProps<CandidateProps>[] {
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

  // Get matches
  const matches = algorithm.match(questions, voter, candidates, matchingOptions);
  return matches;
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
