import type { FactorAnalysisOptions } from './factorAnalysis.type';

export interface QuestionData {
  id: string;
  documentId: string;
  type: string;
  choices: Array<{ id: string; label?: string }>;
}

export interface QuestionDimension {
  id: string;
  questionId: string;
  documentId: string;
  choiceIndex?: number;
  answers: Array<number>;
}

export interface CandidateData {
  id: string | number;
  answers?: Record<
    string,
    {
      value: string | number | Array<string>;
      // Replace any with unknown for flexibility but better type safety
      [key: string]: unknown;
    }
  >;
  // Replace any with unknown
  [key: string]: unknown;
}

export interface QuestionType {
  settings?:
    | string
    | {
        type?: string;
        choices?: Array<{ id: string; label?: string }>;
        // Replace any with unknown
        [key: string]: unknown;
      };
  // Replace any with unknown
  [key: string]: unknown;
}

export interface Question {
  id: string | number;
  documentId: string;
  questionType?: QuestionType;
  // Replace any with unknown
  [key: string]: unknown;
}

export interface AnswerData {
  value: string | number | Array<string>;
  // Replace any with unknown
  [key: string]: unknown;
}

export interface FactorAnalysisInput {
  responses: Array<Array<number>>;
  numFactors?: number;
  options?: FactorAnalysisOptions;
}

export interface FactorAnalysisOutput {
  questionFactorLoadings: Array<Array<number>>;
  explainedVariancePerFactor: Array<number>;
  totalExplainedVariance: number;
  communalities: Array<number>;
  converged: boolean;
}
