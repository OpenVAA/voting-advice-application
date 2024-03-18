import {
  type HasMatchableAnswers,
  type MatchableAnswer,
  type MatchingOptions,
  MatchingAlgorithm,
  type MatchableQuestion,
  MISSING_VALUE,
  MultipleChoiceQuestion,
  DistanceMetric,
  MissingValueDistanceMethod,
  type MatchableQuestionGroup
} from '$voter/vaa-matching';
import type {VoterAnswers} from '$lib/types';

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
  answeredQuestions: VoterAnswers,
  allCandidates: CandidateProps[]
): RankingProps<CandidateProps>[] {
  // Create the algorithm instance
  const algorithm = new MatchingAlgorithm({
    distanceMetric: DistanceMetric.Manhattan,
    missingValueOptions: {
      missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
    }
  });

  // Convert question data into proper question objects
  const questions: Record<string, LikertQuestion> = {};
  allQuestions.forEach((q) => {
    // TODO: Allow other question types
    if (q.type !== 'singleChoiceOrdinal' || !q.values) return;
    questions[q.id] = new LikertQuestion({
      id: q.id,
      values: q.values.map((o) => ({value: o.key})),
      category: q.category
    });
  });

  // Create voter object
  const voter = new Person(
    '',
    Object.entries(answeredQuestions)
      .filter(([id]) => id in questions)
      .map(([id, value]) => ({question: questions[id], value}))
  );

  // Check that we still have some answers
  if (voter.answers.length === 0) {
    return [];
  }

  // Create candidate objects
  const candidates: Record<string, Person> = {};
  allCandidates.forEach((c) => {
    candidates[c.id] = new Person(
      c.id,
      c.answers
        ? c.answers
            // TODO: Fix this impromptu filter
            .filter((a) => a.answer != null && typeof a.answer === 'number')
            .map((a) => ({question: questions[a.questionId], value: a.answer as number}))
        : []
    );
  });

  // Create answer subgroups
  // We only consider those subgroups that the voter has answered
  const answeredIds = new Set(voter.answers.map((a) => a.question.id));
  const categories = [
    ...new Set(
      Object.values(questions)
        .filter((q) => answeredIds.has(q.id))
        .map((q) => q.category)
        .filter((c) => c != null)
    )
  ] as QuestionCategoryProps[];
  const matchingOptions: MatchingOptions<QuestionCategoryProps & MatchableQuestionGroup> = {
    questionGroups: categories.map((c) => ({
      ...c,
      matchableQuestions: Object.values(questions).filter((q) => q.category === c)
    }))
  };

  // Get matches
  const matches = algorithm.match(voter, Object.values(candidates), matchingOptions);
  matches.sort((a, b) => a.distance - b.distance);
  return matches.map(({score, subMatches, entity}) => ({
    score,
    subMatches,
    entity: allCandidates.find((c) => c.id === (entity as Person).id) as CandidateProps
  }));
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

/**
 * A dummy candidate object for matching.
 */
class Person implements HasMatchableAnswers {
  constructor(
    public readonly id: string,
    public answers: MatchableAnswer[] = []
  ) {}

  getAnswerValue(question: MatchableQuestion) {
    for (const answer of this.answers) {
      if (answer.question === question) return answer.value;
    }
    return MISSING_VALUE;
  }

  get matchableAnswers(): MatchableAnswer[] {
    return this.answers;
  }
}
