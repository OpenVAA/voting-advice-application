import { QUESTION_INFO_OPERATION } from '../types/index.js';
/**
 * Determine which prompt template to use based on operations
 */
export declare function determinePromptKey(operations: Array<(typeof QUESTION_INFO_OPERATION)[keyof typeof QUESTION_INFO_OPERATION]>): string;
//# sourceMappingURL=determinePrompt.d.ts.map