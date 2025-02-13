"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processComments = processComments;
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const Condenser_1 = require("./Condenser");
const promises_1 = require("fs/promises");
const llm_1 = require("@openvaa/llm");
const fs_1 = __importDefault(require("fs"));
// Get the package root directory
const packageRoot = path_1.default.resolve(__dirname, '..');
// TODO: Fix .env file location
// Load .env from project root
(0, dotenv_1.config)();
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = 'o1-mini-2024-09-12';
const BATCH_SIZE = 20;
const N_COMMENTS = 100;
async function exportResults(condensedArguments, basePath, formats = ['txt', 'json', 'csv']) {
    // Create results directory if it doesn't exist
    const resultsDir = path_1.default.dirname(basePath);
    await fs_1.default.promises.mkdir(resultsDir, { recursive: true });
    for (const fmt of formats) {
        const filePath = `${basePath}.${fmt}`;
        if (fmt === 'txt') {
            const content = condensedArguments
                .map((arg, i) => `\n                                      *Argumentti ${i + 1}*\n${arg.mainArgument}\n`)
                .join('\n');
            await (0, promises_1.writeFile)(filePath, content, 'utf-8');
        }
        else if (fmt === 'json') {
            const jsonData = condensedArguments.map((arg, i) => ({
                argument_id: i + 1,
                topic: arg.topic,
                main_argument: arg.mainArgument,
                sources: arg.sources,
                source_indices: arg.sourceIndices
            }));
            await (0, promises_1.writeFile)(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
        }
        else if (fmt === 'csv') {
            const header = 'argument_id,topic,main_argument,sources,source_indices\n';
            const rows = condensedArguments.map((arg, i) => [i + 1, arg.topic, arg.mainArgument, arg.sources.join('|'), arg.sourceIndices.join(',')].join(','));
            await (0, promises_1.writeFile)(filePath, header + rows.join('\n'), 'utf-8');
        }
    }
}
async function processComments(comments, topic) {
    const provider = new llm_1.OpenAIProvider({
        apiKey: API_KEY,
        model: MODEL
    });
    const condenser = new Condenser_1.Condenser(provider);
    // Process comments
    console.log('Processing comments...');
    const condensedArguments = await condenser.processComments(comments, topic, N_COMMENTS, BATCH_SIZE);
    // Export to files (optional)
    const basePath = path_1.default.join(packageRoot, 'results', 'processed_arguments');
    await exportResults(condensedArguments, basePath, ['txt', 'json', 'csv']);
    console.log(`Results exported to ${basePath}.{txt,json,csv}`);
    return condensedArguments;
}
// For testing/standalone use
async function main() {
    const DATA_PATH = path_1.default.join(packageRoot, 'data', 'sources', 'kuntavaalit2021.csv');
    const data = await (0, promises_1.readFile)(DATA_PATH, 'utf-8');
    const rows = data.split('\n').map((row) => row.split(','));
    const topic = 'Kuntavero ja pääomatulovero';
    const comments = rows
        .map((row) => row[8]) // q9.explanation_fi column
        .filter((comment) => comment);
    return await processComments(comments, topic);
}
if (require.main === module) {
    main().catch(console.error);
}
