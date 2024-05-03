/*
 * Matching utility functions
 *
 * NB. This is a temporary implementation which will be replaced with a proper one when the `vaa-data` model is implemented. The model will allow the passing of its consituent objects directly to the matching algorithm without need for constructing mediating objects, such as `LikertQuestion`s below.
 */
import {error} from '@sveltejs/kit';
import {
  type MatchingOptions,
  MatchingAlgorithm,
  MISSING_VALUE,
  MultipleChoiceQuestion,
  DistanceMetric,
  MissingValueDistanceMethod,
  type MatchableQuestionGroup
} from '$voter/vaa-matching';
import {logDebugError} from '$lib/utils/logger';

/**
 * Run the matching algorithm as an async process.
 * @param allQuestions All of the available questions
 * @param answeredQuestions The question-answer dictionary of the user's answers
 * @param entities The candidates or parties to include in the matching
 * @param options.subMatches Whether to calculate the submatches for categories if there's more than one of them
 * @returns The matching results as entities wrapped in ranking properties
 */
export async function match<E extends EntityProps>(
  allQuestions: QuestionProps[],
  answeredQuestions: AnswerDict,
  entities: E[],
  options: {
    subMatches?: boolean;
  } = {}
): Promise<RankingProps<E>[]> {
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

  // Possibly prepare for submatch calculation
  let matchingOptions: MatchingOptions<QuestionCategoryProps & MatchableQuestionGroup> | undefined =
    undefined;
  if (options.subMatches) {
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
    // If there's only one category, there's no need to create subgroups
    if (categories.length > 1) {
      matchingOptions = {
        questionGroups: categories.map((c) => ({
          ...c,
          matchableQuestions: questions.filter((q) => q.category === c)
        }))
      };
    }
  }

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
export async function matchParties(
  allQuestions: QuestionProps[],
  answeredQuestions: AnswerDict,
  candidates: CandidateProps[],
  parties: PartyProps[],
  options?: Parameters<typeof match>[3] & {
    matchingType?: Omit<AppSettingsGroupMatchingType, 'none'>;
  }
): Promise<RankingProps<PartyProps>[]> {
  const matchingType = options?.matchingType ?? 'median';
  // Save original answers here, if we will be adding computed averages to the answers dictionary.
  // NB. In the full vaa-data model, this will be handled by a getter function
  const originalAnswers = {} as Record<string, AnswerDict>;
  // Calculate average answers for each party for each question
  if (matchingType !== 'answers-only') {
    for (const party of parties) {
      originalAnswers[party.id] = party.answers;
      party.answers = {...party.answers};
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
        // Calculate party answers
        party.answers[qid] = {
          value:
            answers.length === 0
              ? MISSING_VALUE
              : matchingType === 'mean'
                ? mean(answers)
                : matchingType === 'median'
                  ? median(answers)
                  : error(500, `Matching.matchParties: Invalid matching type ${matchingType}.`)
        };
      }
    }
  }
  const res = match(allQuestions, answeredQuestions, parties, options);
  // Restore original answers
  if (Object.keys(originalAnswers).length) {
    for (const party of parties) {
      party.answers = originalAnswers[party.id];
    }
  }
  return res;
}

/**
 * Calculates the mean of a list of numbers.
 */
export function mean(values: number[]) {
  if (values.length === 0) error(500, 'Cannot calculate mean of an empty list.');
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculates the median of a list of numbers.
 * Orig. author jdmdevdotnet: https://stackoverflow.com/questions/45309447/calculating-median-javascript
 */
export function median(values: number[]) {
  if (values.length === 0) error(500, 'Cannot calculate median of an empty list.');
  values = [...values].sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  return values.length % 2 ? values[half] : (values[half - 1] + values[half]) / 2;
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
