import {error} from '@sveltejs/kit';
import {MISSING_VALUE} from '$voter/vaa-matching';
import {logDebugError} from '$lib/utils/logger';
import {mean} from './mean';
import {median} from './median';

/**
 * Impute the answers for a party based on its candidates, using the specified `matchingType`. Any pre-existing answers by the party will be preserved.
 * @param party The party to impute the answers for.
 * @param candidates All available candidates, these will be filtered by the party.
 * @param matchingType The heuristic to use for imputing the answer.
 * @param questionIds The ids of the questions to impute the answers for.
 * @returns A dictionary of the answers for the party.
 */
export function imputePartyAnswers(
  party: PartyProps,
  candidates: CandidateProps[],
  questionIds: string[],
  matchingType: Exclude<AppSettingsGroupMatchingType, 'none' | 'answersOnly'>
) {
  // Set existing answers as a base
  const answers: AnswerDict = {...party.answers};

  const partyCands = candidates.filter((c) => c.party?.id === party.id);

  for (const qid of questionIds) {
    // Don't overwrite an explicit answer
    if (answers[qid] != null) continue;
    const answerValues = partyCands.map((c) => c.answers[qid]?.value);
    answers[qid] = {value: imputeGroupAnswer(answerValues, matchingType)};
  }

  return answers;
}

/**
 * Impute the answer for a group of entities using the specified `matchingType`.
 * @param answers The answers for the entities in the group.
 * @param matchingType The heuristic to use for imputing the answer
 * @returns The answer value or `MISSING_VALUE` if there are no valid answers in the group.
 */
export function imputeGroupAnswer(
  answers: AnswerProps['value'][],
  matchingType: Exclude<AppSettingsGroupMatchingType, 'none' | 'answersOnly'>
): AnswerProps['value'] {
  // Filter values
  const values = answers.filter((v) => {
    if (v == null) return false;
    if (typeof v !== 'number') {
      logDebugError(
        `Matching.matchParties: Invalid answer type ${typeof v} (only numbers allowd). Value: ${v}.`
      );
      return false;
    }
    return true;
  }) as number[];

  // No valid values
  if (!values.length) return MISSING_VALUE;

  // Calculate the imputed value
  switch (matchingType) {
    case 'mean':
      return mean(values);
    case 'median':
      return median(values);
    default:
      error(500, `Matching.matchParties: Invalid matching type ${matchingType}.`);
  }
}
