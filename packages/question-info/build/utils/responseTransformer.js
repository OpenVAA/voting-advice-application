export function transformResponse(response, question, options, startTime, endTime) {
    if (isBothOperations(response)) {
        return transformBothResponse(response, question, options, startTime, endTime);
    }
    else if (isInfoSectionsOnly(response)) {
        return transformInfoSectionsResponse(response, question, options, startTime, endTime);
    }
    else if (isTermsOnly(response)) {
        return transformTermsResponse(response, question, options, startTime, endTime);
    }
    else {
        throw new Error('Invalid response for question info generation');
    }
}
/**
 * Transform info sections only response
 */
export function transformInfoSectionsResponse(response, question, options, startTime, endTime) {
    return {
        runId: generateRunId(),
        questionId: question.id,
        questionName: question.name,
        infoSections: response.infoSections,
        terms: undefined,
        metrics: {
            duration: endTime.getTime() - startTime.getTime(),
            nLlmCalls: 1,
            cost: 0,
            tokensUsed: { inputs: 0, outputs: 0, total: 0 }
        },
        success: true,
        metadata: {
            llmModel: options.llmModel,
            language: options.language,
            startTime,
            endTime
        }
    };
}
/**
 * Transform terms only response
 */
export function transformTermsResponse(response, question, options, startTime, endTime) {
    return {
        runId: generateRunId(),
        questionId: question.id,
        questionName: question.name,
        infoSections: undefined,
        terms: response.terms,
        metrics: {
            duration: endTime.getTime() - startTime.getTime(),
            nLlmCalls: 1,
            cost: 0,
            tokensUsed: { inputs: 0, outputs: 0, total: 0 }
        },
        success: true,
        metadata: {
            llmModel: options.llmModel,
            language: options.language,
            startTime,
            endTime
        }
    };
}
/**
 * Transform both info sections and terms response
 */
export function transformBothResponse(response, question, options, startTime, endTime) {
    return {
        runId: generateRunId(),
        questionId: question.id,
        questionName: question.name,
        infoSections: response.infoSections,
        terms: response.terms,
        metrics: {
            duration: endTime.getTime() - startTime.getTime(),
            nLlmCalls: 1,
            cost: 0,
            tokensUsed: { inputs: 0, outputs: 0, total: 0 }
        },
        success: true,
        metadata: {
            llmModel: options.llmModel,
            language: options.language,
            startTime,
            endTime
        }
    };
}
/**
 * Create error result when generation fails
 */
export function createErrorResult(question, options, startTime, endTime) {
    return {
        runId: generateRunId(),
        questionId: question.id,
        questionName: question.name,
        metrics: {
            duration: endTime.getTime() - startTime.getTime(),
            nLlmCalls: 1,
            cost: 0,
            tokensUsed: { inputs: 0, outputs: 0, total: 0 }
        },
        success: false,
        metadata: {
            llmModel: options.llmModel,
            language: options.language,
            startTime,
            endTime
        }
    };
}
/**
 * Generate a unique run ID
 */
export function generateRunId() {
    return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function isInfoSectionsOnly(response) {
    return 'infoSections' in response && !('terms' in response);
}
function isTermsOnly(response) {
    return 'terms' in response && !('infoSections' in response);
}
function isBothOperations(response) {
    return 'infoSections' in response && 'terms' in response;
}
