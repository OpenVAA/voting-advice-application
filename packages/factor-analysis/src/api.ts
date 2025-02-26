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
    // Check that we have at least some valid responses
    const validCount = questionResponses.filter(
      (r) => typeof r === 'number' && !Number.isNaN(r)
    ).length;
    if (validCount === 0) {
      throw new Error('No valid responses for question');
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
