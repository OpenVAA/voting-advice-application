export * from './types';
export * from './factorAnalysis';
export * from './polychoric/correlation';
export * from './polychoric/matrix';
export * from './utils/statisticalUtils';
export * from './utils/normalDistribution';

export type {
  CategoryInfo,
  PolychoricOptions,
  PolychoricResult,
  FactorAnalysisOptions,
  FactorAnalysisResult
} from './types';
export { analyzeFactors } from './api';
export type { FactorAnalysisInput, FactorAnalysisOutput } from './api.type';
