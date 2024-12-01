/*
 * Matching utility functions
 *
 * NB. This is a temporary implementation which will be replaced with a proper one when the `@openvaa/data` model is implemented. The model will allow the passing of its consituent objects directly to the matching algorithm without need for constructing mediating objects, such as `LikertQuestion`s below.
 */
import {
  DISTANCE_METRIC,
  type MatchableQuestionGroup,
  MatchingAlgorithm,
  type MatchingOptions,
  MISSING_VALUE_METHOD
} from '@openvaa/matching';
import { error } from '@sveltejs/kit';
import { imputePartyAnswers } from './imputePartyAnswers';
import { LikertQuestion } from './LikertQuestion';
import { extractCategories } from '../questions';

/**
 * Run the matching algorithm as an async process.
 * @param allQuestions All of the available questions
 * @param answeredQuestions The question-answer dictionary of the user's answers
 * @param entities The candidates or parties to include in the matching
 * @param options.subMatches Whether to calculate the submatches for categories if there's more than one of them
 * @returns The matching results as entities wrapped in ranking properties
 */
export async function match<TEntity extends LegacyEntityProps>(
  allQuestions: Array<LegacyQuestionProps>,
  answeredQuestions: LegacyAnswerDict,
  entities: Array<TEntity>,
  options: {
    subMatches?: boolean;
  } = {}
): Promise<Array<RankingProps<TEntity>>> {
  // Create the algorithm instance
  const algorithm = new MatchingAlgorithm({
    distanceMetric: DISTANCE_METRIC.Manhattan,
    missingValueOptions: {
      method: MISSING_VALUE_METHOD.RelativeMaximum
    }
  });

  // Convert question data into proper question objects
  const questions = [] as Array<LikertQuestion>;
  allQuestions.forEach((q) => {
    if (q.category.type !== 'opinion') return;
    if (q.type !== 'singleChoiceOrdinal' || !q.values)
      error(500, `Unsupported opinion question type ${q.type} or question without values: length ${q.values?.length}.`);
    questions.push(
      new LikertQuestion({
        id: q.id,
        values: q.values.map((o) => ({ id: `${o.key}`, value: o.key })),
        category: q.category
      })
    );
  });

  // Create voter object
  const voter = { answers: answeredQuestions };

  // Check that we still have some answers
  if (Object.keys(voter.answers).length === 0) {
    return [];
  }

  // Possibly prepare for submatch calculation
  let matchingOptions: MatchingOptions<LegacyQuestionCategoryProps & MatchableQuestionGroup> | undefined = undefined;
  if (options.subMatches) {
    // Create answer subgroups
    // We only consider those subgroups that the voter has answered
    const answeredIds = new Set(Object.keys(voter.answers));
    const categories = extractCategories(questions.filter((q) => answeredIds.has(q.id)));
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
  return algorithm.match({
    questions,
    reference: voter,
    targets: entities,
    options: matchingOptions
  });
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
  allQuestions: Array<LegacyQuestionProps>,
  answeredQuestions: LegacyAnswerDict,
  candidates: Array<LegacyCandidateProps>,
  parties: Array<LegacyPartyProps>,
  options?: Parameters<typeof match>[3] & {
    matchingType?: Exclude<AppSettingsGroupMatchingType, 'none'>;
  }
): Promise<Array<RankingProps<LegacyPartyProps>>> {
  const matchingType = options?.matchingType ?? 'median';
  // Save original answers here, if we will be adding computed averages to the answers dictionary.
  // NB. In the full @openvaa/data model, this will be handled by a getter function
  const originalAnswers = {} as Record<string, LegacyAnswerDict>;
  // Calculate average answers for each party for each question
  if (matchingType !== 'answersOnly') {
    for (const party of parties) {
      originalAnswers[party.id] = party.answers;
      party.answers = imputePartyAnswers(party, candidates, Object.keys(answeredQuestions), matchingType);
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
