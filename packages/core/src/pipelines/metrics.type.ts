/**
 * Base interface for all pipeline metrics
 * Provides common timing and cost tracking across all processing stages
 */
export interface PipelineMetrics {
  /** Processing duration in milliseconds */
  processingTimeMs: number;
  /** Cost breakdown for this operation */
  costs: CostBreakdown;
}

/**
 * Cost breakdown for an operation
 * Used across modules for tracking input/output/total costs
 */
export interface CostBreakdown {
  /** Total cost */
  total: number;
  /** Cost for input tokens/data */
  input?: number;
  /** Cost for output tokens/data */
  output?: number;
}
