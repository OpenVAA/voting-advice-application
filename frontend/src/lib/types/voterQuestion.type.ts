import type {QuestionProps} from '$lib/components/questions/Question.type';
import type {MatchableValue, MatchingSpaceCoordinate} from '$lib/vaa-matching';

/**
 * The interface used by both the Question component and the matching algorithm.
 */
export interface VoterQuestion extends QuestionProps {
  id: string;
  normalizedDimensions?: number;
  normalizeValue(value: MatchableValue): MatchingSpaceCoordinate;
}
