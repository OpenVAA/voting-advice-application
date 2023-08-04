import {MatchingSpace} from '../core/matchingSpace';
import type {MatchableQuestion} from '../questions/matchableQuestion';

/**
 * A utility function to create a subspace for a subset of questions
 * that can be passed to `measureDistance`.
 *
 * @param allQuestions The full set of questions
 * @param subset The subset of questions for which the subspace is
 * created, effectively one where the weights of the dimensions
 * pertaining to the exluded questions are zero. Note that if none
 * of the questions overlap, all of the dimensions of the subspace
 * will have zero length.
 */
export function createSubspace(allQuestions: MatchableQuestion[], subset: MatchableQuestion[]) {
  const dimensionWeights: number[] = [];
  for (const question of allQuestions) {
    const dims = question.normalizedDimensions;
    const included = subset.indexOf(question) > -1;
    dimensionWeights.push(...Array.from({length: dims}, () => (included ? 1 / dims : 0)));
  }
  return new MatchingSpace(dimensionWeights);
}
