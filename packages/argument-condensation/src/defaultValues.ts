/**
 * Default values and constants for the Argument Condensation package
 *
 * This file centralizes all configuration constants used throughout the package,
 * making them easily accessible and configurable for consumers.
 */

/**
 * Batch processing configuration constants
 */
export const BATCH_PROCESSING = {
  /** Maximum number of comments processed in a single batch during map operations */
  MAX_BATCH_SIZE: 30,

  /** Minimum number of comments processed in a single batch during map operations.
   *  Keeps us from sending single-comment batches to the LLM. Used as the lower limit
   * for batch size reduction, which happens if input comments are too long to be handled
   * in a batch of MAX_BATCH_SIZE. */
  MIN_BATCH_SIZE: 3,

  /** Maximum denominator for reduce operations (how many argument lists to combine) */
  MAX_DENOMINATOR: 6,

  /** Minimum denominator for reduce operations */
  MIN_DENOMINATOR: 2
} as const;

/**
 * Model configuration constants
 */
export const MODEL_DEFAULTS = {
  /** Fallback tokens per minute limit for LLM models (conservative estimate if not configured) */
  TPM_LIMIT: 30000,

  /** Fallback number of parallel batches to process simultaneously (if it isn't configured in the condenser) */
  PARALLEL_BATCHES: 3,

  /** Estimated tokens per LLM call. Used for parallel processing calculations. Doesn't have to be accurate.
   * Heuristical value gotten from typical Finnish VAA comments in batches of 30.
   */
  TOKENS_PER_MAP_CALL_ESTIMATE: 4000,

  /** Default number of validation retries for LLM responses */
  VALIDATION_ATTEMPTS: 3,

  /** Divisor to calculate the number of parallel calls to make (aims for about 1/k tokens of TPM limit, per parallel group) */
  PARALLEL_THROTTLE_DIVISOR: 3
} as const;

/**
 * Comment processing thresholds and limits
 */
export const COMMENT_PROCESSING = {
  /** Minimum number of comments required for meaningful condensation results */
  MIN_COMMENTS_THRESHOLD: 10,

  /** Character to token ratio used for token estimation */
  CHAR_TO_TOKEN_RATIO: 4,

  /** Buffer multiplier for token estimation to account for variability */
  TOKEN_ESTIMATION_BUFFER: 1.3
} as const;

/**
 * All default values grouped together for easy access
 */
export const DEFAULT_VALUES = {
  BATCH_PROCESSING,
  MODEL_DEFAULTS,
  COMMENT_PROCESSING
} as const;
