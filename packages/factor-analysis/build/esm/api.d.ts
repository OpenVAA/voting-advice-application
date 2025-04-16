import type { CandidateData, FactorAnalysisInput, FactorAnalysisOutput, Question, QuestionDimension } from './api.type';
/**
 * Prepares question and candidate data for factor analysis
 * This function was moved from transformAnswersForAnalysis
 */
export declare function prepareDataForAnalysis(questions: Array<Question>, candidates: Array<CandidateData>): {
    responses: Array<Array<number>>;
    dimensions: Array<QuestionDimension>;
    uniqueQuestionIds: Array<string>;
};
/**
 * Performs factor analysis on questionnaire responses
 */
export declare function analyzeFactors(input: FactorAnalysisInput): FactorAnalysisOutput;
/**
 * Process analysis results for storage
 */
export declare function processAnalysisResults(result: FactorAnalysisOutput, dimensions: Array<QuestionDimension>, uniqueQuestionIds: Array<string>, electionId: number): {
    election: number;
    results: {
        questionFactorLoadings: Array<{
            questionId: string;
            factors: Array<number>;
        }>;
        explainedVariancePerFactor: Array<number>;
        totalExplainedVariance: number;
    };
    metadata: {
        timestamp: string;
        numberOfQuestions: number;
        numberOfDimensions: number;
        numberOfResponses: number;
        converged: boolean;
    };
};
//# sourceMappingURL=api.d.ts.map