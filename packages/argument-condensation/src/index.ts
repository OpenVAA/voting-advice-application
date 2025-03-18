import { config } from 'dotenv';
import path from 'path';
import { Condenser } from './Condenser';
import { writeFile } from 'fs/promises';
import { Argument } from './types/Argument';
import { LLMProvider } from '@openvaa/llm';
import fs from 'fs';
import { LanguageConfig } from './languageOptions/LanguageConfig';
import { CondensationType } from './types/CondensationType';

// Load .env from project root
config();

/**
 * Exports condensed Arguments to multiple file formats
 * @param condensedArguments - Array of condensed Arguments to export
 * @param basePath - Base path for output files (without extension)
 * @param formats - Array of output formats ('txt', 'json', 'csv')
 */
async function exportResults(
  condensedArguments: Argument[],
  basePath: string,
  formats: string[] = ['txt', 'json', 'csv']
) {
  // Create results directory if it doesn't exist
  const resultsDir = path.dirname(basePath);
  await fs.promises.mkdir(resultsDir, { recursive: true });

  for (const fmt of formats) {
    const filePath = `${basePath}.${fmt}`;

    if (fmt === 'txt') {
      // Plain text format with simple formatting
      const content = condensedArguments
        .map((arg, i) => `\n                                      *Argument ${i + 1}*\n${arg.argument}\n`)
        .join('\n');
      await writeFile(filePath, content, 'utf-8');
    } else if (fmt === 'json') {
      // Structured JSON format with all Argument details
      const jsonData = condensedArguments.map((arg, i) => ({
        argument_id: i + 1,
        topic: arg.topic,
        main_argument: arg.argument,
      }));
      await writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    } else if (fmt === 'csv') {
      // CSV format for spreadsheet compatibility
      const header = 'argument_id,topic,main_argument\n';
      const rows = condensedArguments.map((arg, i) =>
        [i + 1, arg.topic, arg.argument].join(',')
      );
      await writeFile(filePath, header + rows.join('\n'), 'utf-8');
    }
  }
}

/**
 * Process comments to extract distinct Arguments
 * @param llmProvider - Provider for language model interactions
 * @param languageConfig - Language-specific configuration
 * @param comments - Array of text comments to process
 * @param topic - The topic these comments relate to
 * @param batchSize - Number of comments to process in each batch
 * @returns Promise<Argument[]> Array of condensed Arguments
 */
async function processComments(
  llmProvider: LLMProvider,
  languageConfig: LanguageConfig,
  comments: string[], 
  topic: string,
  batchSize: number = 30,
  condensationType: CondensationType = CondensationType.GENERAL
): Promise<Argument[]> {
  // Process comments with a Condenser instance
  const condenser = new Condenser(llmProvider, languageConfig);
  return await condenser.processComments(comments, topic, batchSize, condensationType);
}

// Export main functionality
export { processComments, exportResults };
export { Condenser } from './Condenser';

// Export types
export type { Argument } from './types/Argument';
export type { LanguageConfig, SupportedLanguage } from './languageOptions/LanguageConfig';

// Export language configs
export { finnishConfig } from './languageOptions/finnish';
export { englishConfig } from './languageOptions/english';

// Export errors
export {
  ArgumentCondensationError,
  LLMError,
  ParsingError
} from './types/Errors';
