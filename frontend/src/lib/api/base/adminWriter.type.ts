import type { DataApiActionResult } from './actionResult.type';
import type { AdapterType } from './adapterType.type';
import type { DWReturnType } from './dataWriter.type';

/**
 * The `AdminWriter` interface defines the API call for performing admin actions.
 */
export interface AdminWriter<TType extends AdapterType = 'universal'> {
  /**
   * Generate question information.
   * @param data - The generate options.
   * @returns A `Promise` resolving to a `Response`.
   * @throws Error on failure.
   */
  generateQuestionInfo: (data: GenerateQuestionInfoOptionsData) => DWReturnType<DataApiActionResult, TType>;

  /**
   * Compute factor loadings for candidate and party answers.
   * @param options - Optional election IDs to compute factors for. If omitted, computes for all elections.
   * @returns A `Promise` resolving to a `Response`.
   * @throws Error on failure.
   */
  computeFactorLoadings: (options?: ComputeFactorLoadingsOptions) => DWReturnType<DataApiActionResult, TType>;
}

/**
 * The options for generating question information.
 */
export type GenerateQuestionInfoOptionsData = {
  /**
   *  The question IDs to be generated. If not provided, all questions are generated.
   */
  questionIds?: Array<string>;
};

/**
 * The options for computing factor loadings.
 */
export type ComputeFactorLoadingsOptions = {
  /**
   * The election IDs to compute factor loadings for. If not provided, computes for all elections.
   */
  electionIds?: Array<string>;
};
