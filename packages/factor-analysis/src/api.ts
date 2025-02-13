import { FactorAnalysis } from './factorAnalysis';
import { computePolychoricMatrix } from './polychoric/matrix';
import type { FactorAnalysisInput, FactorAnalysisOutput } from './api.type';

/**
 * Performs factor analysis on questionnaire responses
 * @param input Response matrix and options
 * @returns Factor analysis results with question-factor mappings
 */
export function analyzeFactors(
  input: FactorAnalysisInput
): FactorAnalysisOutput {
  // Validate input
  if (!input.responses?.length) {
    throw new Error('Empty response matrix');
  }

  for (const questionResponses of input.responses) {
    if (!questionResponses?.length) {
      throw new Error('Empty response array');
    }
    for (const response of questionResponses) {
      // TODO: add more sophisticated handling of missing values. Most likely some kind of mixture of pair-wise imputation and median filling
      if (typeof response !== 'number' || Number.isNaN(response)) {
        throw new Error('Invalid response value');
      }
    }
  }

  // Compute polychoric correlation matrix
  const correlationMatrix = computePolychoricMatrix(input.responses);

  // Perform factor analysis
  const { loadings, explained, totalVariance, communalities, converged } =
    FactorAnalysis.compute({
      correlationMatrix,
      numFactors: input.numFactors,
      options: input.options
    });

  // Transform the loadings matrix to be [questions × factors]
  const questionFactorLoadings = loadings[0].map((_, questionIndex) =>
    loadings.map((factor) => factor[questionIndex])
  );

  return {
    questionFactorLoadings,
    explainedVariancePerFactor: explained,
    totalExplainedVariance: totalVariance,
    communalities: communalities,
    converged: converged
  };
}
