"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsingError = exports.LLMError = exports.ArgumentCondensationError = exports.englishConfig = exports.finnishConfig = exports.Condenser = void 0;
exports.processComments = processComments;
exports.exportResults = exportResults;
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const Condenser_1 = require("./Condenser");
const promises_1 = require("fs/promises");
const fs_1 = __importDefault(require("fs"));
// Load .env from project root
(0, dotenv_1.config)();
// EXPORT FOR TESTING
/**
 * Exports condensed arguments to multiple file formats
 * @param condensedArguments - Array of condensed arguments to export
 * @param basePath - Base path for output files (without extension)
 * @param formats - Array of output formats ('txt', 'json', 'csv')
 */
async function exportResults(condensedArguments, basePath, formats = ['txt', 'json', 'csv']) {
    // Create results directory if it doesn't exist
    const resultsDir = path_1.default.dirname(basePath);
    await fs_1.default.promises.mkdir(resultsDir, { recursive: true });
    for (const fmt of formats) {
        const filePath = `${basePath}.${fmt}`;
        if (fmt === 'txt') {
            // Plain text format with simple formatting
            const content = condensedArguments
                .map((arg, i) => `\n                                      *Argument ${i + 1}*\n${arg.argument}\n`)
                .join('\n');
            await (0, promises_1.writeFile)(filePath, content, 'utf-8');
        }
        else if (fmt === 'json') {
            // Structured JSON format with all argument details
            const jsonData = condensedArguments.map((arg, i) => ({
                argument_id: i + 1,
                topic: arg.topic,
                main_argument: arg.argument,
                sources: arg.sourceComments,
                source_indices: arg.sourceIndices
            }));
            await (0, promises_1.writeFile)(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
        }
        else if (fmt === 'csv') {
            // CSV format for spreadsheet compatibility
            const header = 'argument_id,topic,main_argument,sources,source_indices\n';
            const rows = condensedArguments.map((arg, i) => [i + 1, arg.topic, arg.argument, arg.sourceComments.join('|'), arg.sourceIndices.join(',')].join(','));
            await (0, promises_1.writeFile)(filePath, header + rows.join('\n'), 'utf-8');
        }
    }
}
/**
 * Process comments to extract distinct arguments
 * @param llmProvider - Provider for language model interactions
 * @param languageConfig - Language-specific configuration
 * @param comments - Array of text comments to process
 * @param topic - The topic these comments relate to
 * @param batchSize - Number of comments to process in each batch
 * @returns Promise<Argument[]> Array of condensed arguments
 */
async function processComments(llmProvider, languageConfig, comments, topic, batchSize = 30) {
    const condenser = new Condenser_1.Condenser(llmProvider, languageConfig);
    return await condenser.processComments(comments, topic, batchSize);
}
var Condenser_2 = require("./Condenser");
Object.defineProperty(exports, "Condenser", { enumerable: true, get: function () { return Condenser_2.Condenser; } });
// Export language configs
var finnish_1 = require("./languageOptions/finnish");
Object.defineProperty(exports, "finnishConfig", { enumerable: true, get: function () { return finnish_1.finnishConfig; } });
var english_1 = require("./languageOptions/english");
Object.defineProperty(exports, "englishConfig", { enumerable: true, get: function () { return english_1.englishConfig; } });
// Export errors
var Errors_1 = require("./types/Errors");
Object.defineProperty(exports, "ArgumentCondensationError", { enumerable: true, get: function () { return Errors_1.ArgumentCondensationError; } });
Object.defineProperty(exports, "LLMError", { enumerable: true, get: function () { return Errors_1.LLMError; } });
Object.defineProperty(exports, "ParsingError", { enumerable: true, get: function () { return Errors_1.ParsingError; } });
