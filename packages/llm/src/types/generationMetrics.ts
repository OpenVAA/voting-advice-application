/**
 * An interface that contains metrics that are shared among all LLM calls.
 * Can be used to track the metrics of a single LLM call or multiple LLM calls.
 *
 * @example
 *
 * const metrics: GenerationMetrics = {
 *   duration: 420,
 *   nLlmCalls: 66,
 *   cost: 1.01,
 *   tokensUsed: { inputs: 6700, outputs: 6800, total: 13500 }
 * };
 */
export interface GenerationMetrics {
  /** Duration in seconds */
  duration: number;
  nLlmCalls: number;
  /** Cost in dollars */
  cost: number;
  tokensUsed: {
    inputs: number;
    outputs: number;
    total: number;
  };
}