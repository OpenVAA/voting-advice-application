/**
 * Model pricing information per million tokens (USD).
 * If using cached input, create a new pricing object with the cached input prices.
 */
export interface ModelPricing {
  input: number;
  output: number;
  cachedInput?: number;
  /** The rate for reasoning tokens. Defaults to `output`, since providers bill reasoning as output. */
  reasoning?: number;
}

/** Input, output, reasoning and total costs. Output contains reasoning costs, and total is input plus output. */
export interface LLMCosts {
  input: number;
  output: number;
  reasoning?: number; // included in the output costs
  total: number;
}
