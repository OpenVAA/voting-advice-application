/**
 * Queryable categories - require RAG retrieval + LLM
 */
export const QUERYABLE_CATEGORIES = [
  'eu2024_policy', // Policy positions in 2024 EU election
  'eu2024_process', // EU election voting procedures/dates
  'eu_institution', // EU institutions/electoral system
  'clarification_request', // May need original context to rephrase
  'election_theory', // General electoral/democracy questions
] as const; 

/**
 * LLM-only categories - use LLM without RAG
 */
export const LLM_ONLY_CATEGORIES = [
  'conversational', // Greetings, thanks, chitchat
  'other', // Fallback category for unknown queries
] as const;

/**
 * Canned response categories - return predefined message without LLM
 */
export const CANNED_RESPONSE_CATEGORIES = [
  'meta', // Chatbot capability questions
  'ambiguous', // Unclear queries needing clarification
  'inappropriate', // Unsuitable content
  'eu2024_candidate', // Candidate-specific questions
  'other_election', // Non-EU-2024 elections
  'offtopic', // Unrelated topics
] as const;

/**
 * Non-queryable categories - no RAG retrieval. Can be either canned or LLM-only (no RAG but still uses LLM generation).
 */
export const NON_QUERYABLE_CATEGORIES = [
  ...LLM_ONLY_CATEGORIES,
  ...CANNED_RESPONSE_CATEGORIES,
] as const;

/**
 * Query Category Type Definitions
 *
 * These types define all possible categories for user queries in the chatbot system.
 * Categories are organized into three tiers based on how they should be handled:
 * - Tier 1: Queryable categories (require RAG retrieval + LLM)
 * - Tier 2: LLM-only categories (no RAG retrieval)
 * - Tier 3: Canned response categories (predefined messages)
 */

// ----------------------------------------
// CATEGORY TYPES
// ----------------------------------------

/**
 * Tier 1: Queryable categories - require RAG retrieval + LLM
 * These queries need to search the vector store for relevant context before generating a response
 */
export type QueryableCategory = typeof QUERYABLE_CATEGORIES[number];

/**
 * Tier 2: LLM-only categories - use LLM without RAG
 */
export type LLMOnlyCategory = typeof LLM_ONLY_CATEGORIES[number];

/**
 * Tier 3: Canned response categories - return predefined message without LLM
 * These queries get immediate responses without API calls
 */
export type CannedResponseCategory = typeof CANNED_RESPONSE_CATEGORIES[number];

/**
 * Non-queryable categories - no RAG retrieval. Can be either canned or LLM-only (no RAG but still uses LLM generation).
 */
export type NonQueryableCategory = typeof NON_QUERYABLE_CATEGORIES[number];

/**
 * All possible query categories
 */
export type QueryCategory = QueryableCategory | NonQueryableCategory | LLMOnlyCategory | CannedResponseCategory;

// ----------------------------------------
// RESULT INTERFACE
// ----------------------------------------

/**
 * Result from query categorization
 */
export interface QueryCategorizationResult {
  /**
   * The identified category for the query
   */
  category: QueryCategory;

  /**
   * The reformulated query as a standalone question
   * null for ambiguous, conversational, or inappropriate queries
   */
  rephrased: string | null;
}

/**
 * All categories as a readonly array
 * Used for runtime validation and passing to vector-store
 */
export const ALL_CATEGORY_VALUES: ReadonlyArray<QueryCategory> = [
  ...QUERYABLE_CATEGORIES,
  ...NON_QUERYABLE_CATEGORIES
] as const;

// ----------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------

/**
 * Check if a category requires RAG retrieval
 */
export function isQueryable(category: QueryCategory): boolean {
  return QUERYABLE_CATEGORIES.includes(category as QueryableCategory);
}

/**
 * Check if a category should use a canned response
 */
export function needsCannedResponse(category: QueryCategory): boolean {
  return CANNED_RESPONSE_CATEGORIES.includes(category as CannedResponseCategory);
}
