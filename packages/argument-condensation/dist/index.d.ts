import { Argument } from './types/Argument';
import { LLMProvider } from '@openvaa/llm';
import { LanguageConfig } from './languageOptions/LanguageConfig';
import { CondensationType } from './types/CondensationType';
/**
 * Exports condensed Arguments to multiple file formats
 * @param condensedArguments - Array of condensed Arguments to export
 * @param basePath - Base path for output files (without extension)
 * @param formats - Array of output formats ('txt', 'json', 'csv')
 */
declare function exportResults(condensedArguments: Argument[], basePath: string, formats?: string[]): Promise<void>;
/**
 * Process comments to extract distinct Arguments
 * @param llmProvider - Provider for language model interactions
 * @param languageConfig - Language-specific configuration
 * @param comments - Array of text comments to process
 * @param topic - The topic these comments relate to
 * @param batchSize - Number of comments to process in each batch
 * @param condensationType - The point of view of the output Arguments
 * @returns Promise<Argument[]> Array of condensed Arguments
 */
declare function processComments(llmProvider: LLMProvider, languageConfig: LanguageConfig, comments: string[], topic: string, batchSize?: number, condensationType?: CondensationType): Promise<Argument[]>;
export { processComments, exportResults };
export { Condenser } from './Condenser';
export type { Argument } from './types/Argument';
export type { LanguageConfig, SupportedLanguage } from './languageOptions/LanguageConfig';
export { CondensationType } from './types/CondensationType';
export { finnishConfig } from './languageOptions/finnish';
export { englishConfig } from './languageOptions/english';
export { ArgumentCondensationError, LLMError, ParsingError } from './types/Errors';
