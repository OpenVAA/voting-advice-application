import { Condenser } from '../Condenser';
import { Argument } from '../types/argument';
import { LLMProvider } from '@openvaa/llm';
import { LanguageConfig } from '../languageOptions/languageConfig.type';
import { CONDENSATION_TYPE, CondensationType } from '../types/condensationType';

/**
 * Process comments to extract Arguments
 * @param llmProvider - Provider for LLM interactions
 * @param languageConfig - Language-specific configuration
 * @param comments - Array of comments to process (strings)
 * @param topic - The topic these comments relate to
 * @param batchSize - Number of comments to process per LLM call
 * @param condensationType - The point of view of the output Arguments
 * @returns Promise<Argument[]> Array of condensed Arguments
 */
export async function processComments(
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