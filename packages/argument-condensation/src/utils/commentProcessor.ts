import { LLMProvider } from '@openvaa/llm';
import { Condenser } from '../core/condenser';
import { Argument } from '../core/types/argument';
import { CONDENSATION_TYPE, CondensationType } from '../core/types/condensationType';
import { LanguageConfig } from '../languageOptions/languageConfig.type';

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
export async function processComments({
  llmProvider,
  languageConfig,
  comments,
  topic,
  batchSize = 30,
  condensationType = CONDENSATION_TYPE.GENERAL
}: {
  llmProvider: LLMProvider;
  languageConfig: LanguageConfig;
  comments: Array<string>;
  topic: string;
  batchSize?: number;
  condensationType?: CondensationType;
}): Promise<Array<Argument>> {
  // Process comments with a Condenser instance
  const condenser = new Condenser({ llmProvider, languageConfig });
  return await condenser.processComments({ comments, topic, batchSize, condensationType });
}
