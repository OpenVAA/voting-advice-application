import { Condenser } from './Condenser';
import { Argument } from './types/Argument';
import { LLMProvider } from '@openvaa/llm';
import { LanguageConfig } from './languageOptions/LanguageConfig';
import { CONDENSATION_TYPE, CondensationType } from './types/CondensationType';
import { exportResults } from './utils/fileOperations';

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
async function processComments(
  llmProvider: LLMProvider,
  languageConfig: LanguageConfig,
  comments: string[],
  topic: string,
  batchSize: number = 30,
  condensationType: CondensationType = CONDENSATION_TYPE.GENERAL
): Promise<Argument[]> {
  // Process comments with a Condenser instance
  const condenser = new Condenser(llmProvider, languageConfig);
  return await condenser.processComments(comments, topic, batchSize, condensationType);
}

// Export main functionality
export { processComments };
export { Condenser } from './Condenser';
export { exportResults } from './utils/fileOperations';
// Export types
export type { Argument } from './types/Argument';
export type { LanguageConfig, SupportedLanguage } from './languageOptions/LanguageConfig';
export type { CondensationType } from './types/CondensationType';

// Export language configs
export { finnishConfig } from './languageOptions/finnish';
export { englishConfig } from './languageOptions/english';

// Export errors
export { ArgumentCondensationError, LLMError, ParsingError } from './types/Errors';
