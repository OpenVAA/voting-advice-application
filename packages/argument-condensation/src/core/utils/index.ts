// Validation utilities
export * from './condensation/normalizeArgumentLists';
export { validatePlan } from './condensation/planValidation';
export * from './condensation/validateInputTokenCount';

// Progress tracking utilities
export { calculateStepWeights } from './condensation/calculateLLMCallCounts';

// Prompt utilities
// createPromptInstance was removed; PromptCall creation is now inline at call sites.
export { setPromptVars } from '@openvaa/llm-refactor';

// Create batches
export { createBatches } from './condensation/createBatches';

// Cost calculation and latency tracking
export { LatencyTracker } from '@openvaa/llm-refactor';

// Get and group comments
export { getAndSliceComments } from './condensation/getAndSliceComments';

// Create condensation steps
export { createCondensationSteps } from './condensation/defineCondensationSteps';

// Get parallelization factor
export { getParallelFactor } from './condensation/getParallelFactor';

// Check if question is supported
export { isSupportedQuestion } from './condensation/isSupportedQuestion';
