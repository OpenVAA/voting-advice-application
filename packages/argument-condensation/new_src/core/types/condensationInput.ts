import { CondensationPlan } from './condensation/processDefinition';
import { LLMProvider } from '@openvaa/llm';
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
 * @param llmProvider - LLM provider to use for the condensation process
 * @param model - The model to use for the condensation process
 */
export interface CondensationRunInput {
  runId: string;
  electionId: string;
  question: {
    id: string;
    topic: string;
    answerType: string; // TODO: make this more robust
  };
  model: string;
  llmProvider: LLMProvider;
  comments: VAAComment[];
  config: CondensationPlan;
} 