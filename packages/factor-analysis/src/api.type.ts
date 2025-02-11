import type { FactorAnalysisOptions } from './factorAnalysis.type';

export interface FactorAnalysisInput {
  /** Matrix of responses (inner array = all responses to a question) */
  responses: Array<Array<number>>;
  /** Optional number of factors (auto-determined if not specified) */
  numFactors?: number;
  /** Configuration options for the analysis */
  options?: FactorAnalysisOptions;
}

export interface FactorAnalysisOutput {
  /** [questions × factors] matrix */
  questionFactorLoadings: Array<Array<number>>;
  /** Percentage variance explained by each factor */
  explainedVariancePerFactor: Array<number>;
  /** Total variance explained by all factors */
  totalExplainedVariance: number;
  /** Communality values for each question */
  communalities: Array<number>;
  /** Whether the algorithm converged */
  converged: boolean;
}
