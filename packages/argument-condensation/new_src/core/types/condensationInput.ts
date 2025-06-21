import { CondensationPlan } from './condensation/processDefinition';

/**
 * Represents a single non-empty comment given by a candidate in the VAA. 
 * @param id - Unique identifier
 * @param candidateID - The candidate who wrote the comment
 * @param candidateAnswer - Can be Likert number, categorical number, or categorical string
 * @param text - The actual comment
 */
export interface VAAComment {
  /** Unique identifier for this comment */
  id: string;

  /** The candidate who wrote the comment */
  candidateID: string;

  /** Can be Likert number, categorical number, or categorical string */
  candidateAnswer: number | string;

  /** The actual comment */
  text: string;
}

/**
 * Input parameters for the condensation process.
 * @param runId - Unique identifier for this run
 * @param electionId - Unique identifier for the election
 * @param question - The topic/question these comments relate to
 * @param comments - Array of comments to process
 * @param config - Strategy-specific configuration
 */
export interface CondensationRunInput {
  runId: string;
  electionId: string;
  question: {
    id: string;
    topic: string;
    answerType: string; // TODO: make this more robust
  };
  comments: VAAComment[];
  config: CondensationPlan;
} 