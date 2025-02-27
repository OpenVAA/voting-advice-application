import type { AnyQuestionVariant } from '@openvaa/data';

/**
 * Interface for factor analysis results
 */
export interface FactorAnalysisOutput {
  questionFactorLoadings: Array<Array<number>>;
  explainedVariancePerFactor: Array<number>;
  totalExplainedVariance: number;
  communalities: Array<number>;
  converged: boolean;
}

/**
 * QuestionOrderer class interface
 */
export interface IQuestionOrderer {
  getNextQuestions(answeredIds: Array<string>, count: number): Array<AnyQuestionVariant>;
}
