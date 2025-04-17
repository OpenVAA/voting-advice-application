"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processComments = processComments;
const condenser_1 = require("../core/condenser");
const condensationType_1 = require("../core/types/condensationType");
/**
 * Process comments to extract Arguments
 * @param params - Object containing all parameters
 * @param params.llmProvider - Provider for LLM interactions
 * @param params.languageConfig - Language-specific configuration
 * @param params.comments - Array of comments to process (strings)
 * @param params.topic - The topic these comments relate to
 * @param params.batchSize - Number of comments to process per LLM call
 * @param params.condensationType - The point of view of the output Arguments
 * @returns Promise<Argument[]> Array of condensed Arguments
 */
async function processComments({ llmProvider, languageConfig, comments, topic, batchSize = 30, condensationType = condensationType_1.CONDENSATION_TYPE.GENERAL }) {
    // Process comments with a Condenser instance
    const condenser = new condenser_1.Condenser({ llmProvider, languageConfig });
    return await condenser.processComments({ comments, topic, batchSize, condensationType });
}
