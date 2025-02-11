export * from './factorAnalysis';
export * from './polychoric/correlation';
export * from './polychoric/matrix';
export * from './types';
export * from './utils/normalDistribution';
export * from './utils/statisticalUtils';

// Export types from factorAnalysis.type.ts
export type {
  FactorAnalysisOptions,
  FactorAnalysisResult
} from './factorAnalysis.type';

// Other existing types if any
export type {
  CategoryInfo,
  PolychoricOptions,
  PolychoricResult
} from './types';

// Export the API functions
export {
  analyzeFactors,
  prepareDataForAnalysis,
  processAnalysisResults
} from './api';

// Export the API types
export type {
  AnswerData,
  CandidateData,
  FactorAnalysisInput,
  FactorAnalysisOutput,
  Question,
  QuestionData,
  QuestionDimension
} from './api.type';
