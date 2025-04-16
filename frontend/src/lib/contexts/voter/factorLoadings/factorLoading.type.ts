import type { DataObjectData, Id } from '@openvaa/data';

export interface FactorLoadingData extends DataObjectData {
  electionId: Id;
  questionFactorLoadings: Array<QuestionFactorLoading>;
  explainedVariancePerFactor: Array<number>;
  totalExplainedVariance: number;
  metadata: FactorLoadingMetadata;
}

export interface QuestionFactorLoading {
  questionId: Id;
  factors: Array<number>;
}

export interface FactorLoadingMetadata {
  timestamp: string;
  numberOfQuestions: number;
  numberOfResponses: number;
  converged: boolean;
}
