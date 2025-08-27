import { QUESTION_INFO_OPERATION } from '../types/index.js';
/**
 * Determine which prompt template to use based on operations
 */
export function determinePromptKey(operations) {
    if (operations.length === 2) {
        return 'generateBoth';
    }
    else if (operations.includes(QUESTION_INFO_OPERATION.InfoSections)) {
        return 'generateInfoSections';
    }
    else if (operations.includes(QUESTION_INFO_OPERATION.Terms)) {
        return 'generateTerms';
    }
    else {
        throw new Error(`Invalid operations: ${operations.join(', ')}`);
    }
}
