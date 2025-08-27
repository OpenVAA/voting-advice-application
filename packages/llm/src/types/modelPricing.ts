/**
 * Model pricing information
 */
export interface ModelPricing {
  /** Cost per 1M input tokens */
  input: number;
  /** Cost per 1M cached input tokens */
  cachedInput: number;
  /** Cost per 1M output tokens */
  output: number;
}
