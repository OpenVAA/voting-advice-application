// Core argument type
export type { Argument } from './base/argument';

// Condensation primitives (operations, their params & processing step interface)
export type { CondensationOperation } from './condensation/operation';
export { CondensationOperations } from './condensation/operation';
export type { CondensationPlan, ProcessingStep } from './condensation/processDefinition';
export type {
  GroundingOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from './condensation/processParams';
export type { CondensationStepResult } from './condensation/processStepResult';

// Condensation inputs & outputs
export type { CondensationRunInput, VAAComment } from './condensation/condensationInput';
export type { CondensationRunMetrics, CondensationRunResult } from './condensation/condensationResult';
export { CONDENSATION_TYPE, type CondensationOutputType } from './llm/condensationType';

// Operation tree structures & helpers
export type { OperationNode, OperationTree } from './base/operationTree';
export { OperationTreeUtils } from './base/operationTree';

// Prompt-related types
export type { CondensationPrompt, GroundingPrompt, MapPrompt, ReducePrompt, RefinePrompt } from './llm/prompt';
export type { PromptCall } from './llm/promptCall';

// LLM response wrapper
export type { ResponseWithArguments } from './llm/responseWithArguments';
export { ResponseWithArgumentsContract } from './llm/responseWithArguments';

// Other domain types
export type { VAAQuestion } from './base/vaaQuestion';
