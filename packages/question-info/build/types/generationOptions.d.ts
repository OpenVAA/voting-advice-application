import type { QuestionInfoSection, TermDefinition } from '@openvaa/app-shared';
import type { CommonLLMParams } from '@openvaa/llm';
/**
 * Available operations for question info generation
 */
export declare const QUESTION_INFO_OPERATION: {
    readonly Terms: "terms";
    readonly InfoSections: "infoSections";
};
export type QuestionInfoOperation = (typeof QUESTION_INFO_OPERATION)[keyof typeof QUESTION_INFO_OPERATION];
/**
 * Options for question info generation
 */
export interface QuestionInfoOptions extends CommonLLMParams {
    /** Which operations to perform. Can contain either or both of the operations */
    operations: Array<QuestionInfoOperation>;
    /** Language of the prompt to use */
    language: string;
    /** Examples to guide generation, preferably with the output examples in JSON format. See example */
    examples?: {
        infoSections?: string;
        terms?: string;
    };
}
export type InfoSectionsOnly = {
    infoSections: Array<QuestionInfoSection>;
};
export type TermsOnly = {
    terms: Array<TermDefinition>;
};
export type BothOperations = {
    infoSections: Array<QuestionInfoSection>;
    terms: Array<TermDefinition>;
};
export type ResponseWithInfo = InfoSectionsOnly | TermsOnly | BothOperations;
//# sourceMappingURL=generationOptions.d.ts.map