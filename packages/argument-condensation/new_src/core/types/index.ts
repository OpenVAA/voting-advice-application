// Core argument type
export type { Argument } from './argument';

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
export type { CondensationRunInput, VAAComment } from './condensationInput';
export type { CondensationRunMetrics, CondensationRunResult } from './condensationResult';
export { CONDENSATION_TYPE, type CondensationOutputType } from './condensationType';

// Operation tree structures & helpers
export type { OperationNode, OperationTree } from './operationTree';
export { OperationTreeUtils } from './operationTree';

// Prompt-related types
export type { CondensationPrompt, GroundingPrompt, MapPrompt, ReducePrompt, RefinePrompt } from './prompt';
export type { PromptCall } from './promptCall';

// LLM response wrapper
export type { ResponseWithArguments } from './llm/responseWithArguments';
export { ResponseWithArgumentsContract } from './llm/responseWithArguments';

// Other domain types
export type { VAAQuestion } from './vaaQuestion';
