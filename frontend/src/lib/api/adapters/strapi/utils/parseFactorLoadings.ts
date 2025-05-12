import type { FactorLoadingData } from '$lib/contexts/voter/factorLoadings/factorLoading.type';
import type { StrapiFactorLoadingData } from '../strapiData.type';

export function parseFactorLoadings(data: StrapiFactorLoadingData): FactorLoadingData {
  // Create single factor loading object
  const factorLoading: FactorLoadingData = {
    id: data.documentId, // Use documentId from Strapi
    electionId: data.election?.documentId || '',
    questionFactorLoadings: data.results.questionFactorLoadings,
    explainedVariancePerFactor: data.results.explainedVariancePerFactor,
    totalExplainedVariance: data.results.totalExplainedVariance,
    metadata: data.metadata || {
      timestamp: new Date().toISOString(),
      numberOfQuestions: 0,
      numberOfResponses: 0,
      converged: false
    }
  };

  // Return as array to match DPDataType
  return factorLoading;
}
