// Core argument type
export type { Argument } from './condensation/argument';

// API types
export type { CondensationAPIOptions, PromptConfig } from './api/apiConfig';
export type { CommentGroup, CommentGroupingOptions } from './api/commentGroup';

// Condensation primitives (operations, their params & processing step interface)
export type { CondensationOperation } from './condensation/operation';
export { CONDENSATION_OPERATIONS as CondensationOperations } from './condensation/operation';
export type { ProcessingStep } from './condensation/processDefinition';
export type {
  GroundingOperationParams,
  IterateMapOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from './condensation/processParams';
export type { CondensationStepResult } from './condensation/processStepResult';

// Condensation inputs & outputs
export type { CondensationRunInput, Comment as VAAComment } from './condensation/condensationInput';
export type { CondensationRunResult } from './condensation/condensationResult';
export { CONDENSATION_TYPE, type CondensationOutputType } from './condensation/condensationType';
export type { SupportedQuestion } from './condensation/supportedQuestion';

// Operation tree structures & helpers
export type { OperationNode, OperationTree } from './base/operationTree';

// Prompt-related types
export type {
  CondensationPrompt,
  GroundingPrompt,
  IterateMapPrompt,
  MapPrompt,
  ReducePrompt,
  RefinePrompt
} from './llm/prompt';
export type { CondensationPromptCall as PromptCall } from './llm/promptInstance';

// LLM response type
export type { ResponseWithArguments } from './llm/responseWithArguments';

// Supported languages (update as needed)
export { SUPPORTED_LANGUAGES, type SupportedLanguage } from './base/supportedLanguages';
