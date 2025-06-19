import { CondensationOutputType } from './condensationType';
import { CondensationPrompt } from './prompt';

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
 * Base interface that all strategy configs must implement.
 * @param batchSize - Number of comments to process per batch
 * @param nOutputArgs - Maximum number of arguments to extract
 * @param language - Language code (e.g., 'en', 'fi')
 * @param condensationType - Type of condensation to perform (supporting, opposing, etc.)
 * @param initialCondensationPrompt - The prompt for the initial condensation
 * @param mainCondensationPrompt - The prompt for the main condensation
 * @param argumentImprovementPrompt - The prompt for the argument improvement
 */
export interface CondensationRunConfig {
  batchSize: number;
  nOutputArgs: number;
  language: string;
  condensationType: CondensationOutputType;
  initialCondensationPrompt: CondensationPrompt;
  mainCondensationPrompt: CondensationPrompt;
  argumentImprovementPrompt: CondensationPrompt;
}

/**
 * Configuration for MapReduce condensation strategy.
 * @param batchSize - Number of comments to process per batch
 * @param nOutputArgs - Number of arguments to extract
 * @param language - Language code (e.g., 'en', 'fi')
 * @param condensationType - Type of condensation to perform (supporting, opposing, etc.)
 */
export interface MapReduceConfig extends CondensationRunConfig {
  // If changes to the base config are needed, add them here.
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
  config: CondensationRunConfig;
} 