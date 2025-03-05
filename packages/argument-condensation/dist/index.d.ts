import { Argument } from './types/Argument';
import { LLMProvider } from '@openvaa/llm';
import { LanguageConfig } from './types/LanguageConfig';
/**
 * Exports condensed arguments to multiple file formats
 * @param condensedArguments - Array of condensed arguments to export
 * @param basePath - Base path for output files (without extension)
 * @param formats - Array of output formats ('txt', 'json', 'csv')
 */
declare function exportResults(condensedArguments: Argument[], basePath: string, formats?: string[]): Promise<void>;
/**
 * Process comments to extract distinct arguments
 * @param llmProvider - Provider for language model interactions
 * @param languageConfig - Language-specific configuration
 * @param comments - Array of text comments to process
 * @param topic - The topic these comments relate to
 * @param batchSize - Number of comments to process in each batch
 * @returns Promise<Argument[]> Array of condensed arguments
 */
declare function processComments(llmProvider: LLMProvider, languageConfig: LanguageConfig, comments: string[], topic: string, batchSize?: number): Promise<Argument[]>;
export { processComments, exportResults };
export { Condenser } from './Condenser';
export type { Argument } from './types/Argument';
export type { LanguageConfig, SupportedLanguage } from './types/LanguageConfig';
export { finnishConfig } from './languageOptions/finnish';
export { englishConfig } from './languageOptions/english';
export { ArgumentCondensationError, LLMError, ParsingError } from './types/Errors';
