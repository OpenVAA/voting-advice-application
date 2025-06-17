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
export interface CondensationSessionConfig {
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
export interface MapReduceConfig extends CondensationSessionConfig {
  // If changes to the base config are needed, add them here.
}

/**
 * Input parameters for the condensation process.
 * @param sessionId - Unique identifier for this session
 * @param comments - Array of comments to process
 * @param topic - The topic/question these comments relate to
 * @param config - Strategy-specific configuration
 */
export interface CondensationSessionInput {
  /** Unique identifier for this session */
  sessionId: string;

  /** Array of comments to process */
  comments: VAAComment[];
  
  /** The topic/question these comments relate to */
  topic: string;
  
  /** Strategy-specific configuration */
  config: CondensationSessionConfig;
} 