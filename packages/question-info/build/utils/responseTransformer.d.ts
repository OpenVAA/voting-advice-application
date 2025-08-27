import type { BothOperations, InfoSectionsOnly, QuestionInfoOptions, QuestionInfoResult, ResponseWithInfo, TermsOnly } from '../types/index.js';
export declare function transformResponse(response: ResponseWithInfo, question: {
    id: string;
    name: string;
}, options: QuestionInfoOptions, startTime: Date, endTime: Date): QuestionInfoResult;
/**
 * Transform info sections only response
 */
export declare function transformInfoSectionsResponse(response: InfoSectionsOnly, question: {
    id: string;
    name: string;
}, options: QuestionInfoOptions, startTime: Date, endTime: Date): QuestionInfoResult;
/**
 * Transform terms only response
 */
export declare function transformTermsResponse(response: TermsOnly, question: {
    id: string;
    name: string;
}, options: QuestionInfoOptions, startTime: Date, endTime: Date): QuestionInfoResult;
/**
 * Transform both info sections and terms response
 */
export declare function transformBothResponse(response: BothOperations, question: {
    id: string;
    name: string;
}, options: QuestionInfoOptions, startTime: Date, endTime: Date): QuestionInfoResult;
/**
 * Create error result when generation fails
 */
export declare function createErrorResult(question: {
    id: string;
    name: string;
}, options: QuestionInfoOptions, startTime: Date, endTime: Date): QuestionInfoResult;
/**
 * Generate a unique run ID
 */
export declare function generateRunId(): string;
//# sourceMappingURL=responseTransformer.d.ts.map