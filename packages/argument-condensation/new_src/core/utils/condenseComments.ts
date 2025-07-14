import { LLMProvider } from '@openvaa/llm';
import { createCondensationPlan } from './createCondensationPlan';
import { filterCommentsByLikert } from './filterCommentsByLikert';
import { Condenser } from '../condenser';
import { PromptRegistry } from '../prompts/promptRegistry';
import { CondensationRunInput, CondensationRunResult } from '../types';
import { VAAComment } from '../types/condensationInput';
import { CONDENSATION_TYPE, CondensationOutputType } from '../types/condensationType';
import { MapPrompt, ReducePrompt } from '../types/prompt';

/**
 * Condense comments into arguments using the new condensation system.
 * This is a standalone utility function that can be called from outside the package.
 *
 * @param params - Object containing all parameters
 * @param params.comments - Array of comments to process
 * @param params.topic - The topic/question these comments relate to
 * @param params.condensationType - The type of condensation (pros/cons)
 * @param params.mapPromptId - The ID of the map prompt
 * @param params.reducePromptId - The ID of the reduce prompt
 * @param params.iterationPromptId - The ID of the iteration prompt
 * @param params.runId - Unique identifier for this run
 * @param params.electionId - Unique identifier for the election
 * @param params.questionId - Unique identifier for the question
 * @param params.nOutputArgs - Number of arguments to output
 * @param params.language - Language for the condensation
 * @param params.likertLimits - Array of integers representing max comments per Likert value (index 0 = Likert 1, etc.)
 * @returns Promise<CondensationRunResult> Complete condensation result
 */
export async function condenseComments({
  llmProvider,
  comments,
  topic,
  condensationType = CONDENSATION_TYPE.LIKERT.PROS,
  mapPromptId,
  reducePromptId,
  iterationPromptId,
  runId = `condensation_${Date.now()}`,
  electionId = 'default-election',
  questionId = 'default-question',
  model = 'gpt-4o',
  nOutputArgs = 3,
  language = 'fi',
  likertLimits = [0, 0, 0, 150, 300] // Default: skip Likert 1-3, max 150 for Likert 4, max 300 for Likert 5
}: {
  llmProvider: LLMProvider;
  comments: Array<VAAComment>;
  topic: string;
  condensationType: CondensationOutputType;
  mapPromptId: string;
  reducePromptId: string;
  iterationPromptId: string;
  runId?: string;
  electionId?: string;
  questionId?: string;
  model?: string;
  nOutputArgs?: number;
  language?: string;
  likertLimits?: Array<number>;
}): Promise<CondensationRunResult> {
  // Initialize the prompt registry
  const promptRegistry = new PromptRegistry();
  await promptRegistry.loadPrompts();

  // Get the prompts for the condensation pipeline
  const mapPrompt = promptRegistry.getPrompt(mapPromptId) as MapPrompt;
  const reducePrompt = promptRegistry.getPrompt(reducePromptId) as ReducePrompt;
  const iterationPrompt = promptRegistry.getPrompt(iterationPromptId) as MapPrompt;

  if (!mapPrompt || !reducePrompt || !iterationPrompt) {
    throw new Error(
      `Required prompts not found in registry. Available prompts: ${promptRegistry
        .listPrompts()
        .map((p) => p.promptId)
        .join(', ')}`
    );
  }

  // Filter comments based on Likert limits
  const filteredComments = filterCommentsByLikert(comments, likertLimits);

  // Create the condensation configuration
  const config = createCondensationPlan({
    mapPrompt,
    reducePrompt,
    iterationPrompt,
    condensationType,
    nOutputArgs,
    language
  });

  // Create the condensation input
  const input: CondensationRunInput = {
    runId,
    electionId,
    question: {
      id: questionId,
      topic,
      answerType: 'likert-5'
    },
    model,
    comments: filteredComments,
    config,
    llmProvider
  };

  // Create and run the condenser
  const condenser = new Condenser(input);
  const result = await condenser.run();

  return result;
}
