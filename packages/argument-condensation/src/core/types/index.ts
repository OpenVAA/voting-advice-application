// Core argument type
export type { Argument } from './base/argument';

// API types
export type { CommentGroup } from './api/commentGroup';

// Condensation primitives (operations, their params & processing step interface)
export type { CondensationOperation } from './condensation/operation';
export { CondensationOperations } from './condensation/operation';
export type { ProcessingStep } from './condensation/processDefinition';
export type {
  GroundingOperationParams,
  MapOperationParams,
  ReduceOperationParams,
  RefineOperationParams
} from './condensation/processParams';
export type { CondensationStepResult } from './condensation/processStepResult';

// Condensation inputs & outputs
export type { SupportedQuestion } from './base/supportedQuestion';
export type { CondensationRunInput, VAAComment } from './condensation/condensationInput';
export type { CondensationRunMetrics, CondensationRunResult } from './condensation/condensationResult';
export { CONDENSATION_TYPE, type CondensationOutputType } from './condensation/condensationType';

// Operation tree structures & helpers
export type { OperationNode, OperationTree } from './base/operationTree';

// Prompt-related types
export type { CondensationPrompt, GroundingPrompt, MapPrompt, ReducePrompt, RefinePrompt } from './llm/prompt';
export type { CondensationPromptCall as PromptCall } from './llm/promptInstance';

// LLM response type
export type { ResponseWithArguments } from './llm/responseWithArguments';

// LLM latency, token & pricing types (re-exported from @openvaa/llm for convenience)
export type { ModelPricing } from '@openvaa/llm';
export type { TokenUsage } from '@openvaa/llm';
export type { LatencyMeasurement } from '@openvaa/llm';
