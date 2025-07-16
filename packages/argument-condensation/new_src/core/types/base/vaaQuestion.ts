import { VAAComment } from '../condensation/condensationInput';

/**
 * Represents a question from the VAA.
 * @param id - The unique identifier for the question
 * @param topic - The topic of the question
 * @param electionId - The unique identifier for the election
 * @param answerType - The type of answer for the question
 * @param comments - The comments for the question
 */
export interface VAAQuestion {
  id: string;
  topic: string;
  electionId: string;
  answerType: string | number;
  comments: Array<VAAComment>;
}
