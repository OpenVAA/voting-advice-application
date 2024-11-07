import { MatchingSpace } from './matchingSpace';
import type { MatchableQuestion } from '@openvaa/core';

/**
 * A utility function to create a subspace for a subset of questions that can be passed to `measureDistance`. The main intended use is in computing submatches for question categories, such as, 'Economy' or 'The Environment'.
 * @param questions The full set of questions
 * @param subset The subset of questions for which the subspace is created, effectively one where the weights of the dimensions pertaining to the exluded questions are zero. Note that if none of the questions overlap, all of the dimensions of the subspace will have zero length.
 */
export function createSubspace({
  questions,
  subset
}: {
  questions: ReadonlyArray<MatchableQuestion>;
  subset: ReadonlyArray<MatchableQuestion>;
}): MatchingSpace {
  const subsetIds = new Set(subset.map((q) => q.id));
  const questionWeights = Object.fromEntries(questions.filter((q) => !subsetIds.has(q.id)).map((q) => [q.id, 0]));
  return MatchingSpace.fromQuestions({
    questions,
    questionWeights
  });
}
