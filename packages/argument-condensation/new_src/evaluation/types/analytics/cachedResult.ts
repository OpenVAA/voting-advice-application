import type { CondensationPhase } from '../../../core/types/condensationPhase';
import { PromptCall } from '../../../core/types/promptCall';
import type { PipelineSignature } from '../../../core/types/pipelineSignature';

/**
 * The base interface for a cached result of a golden dataset condensation run.
 * 
 * @property questionId - The ID of the VAA question
 * @property phase - The phase this result represents (e.g. initialCondensation, mainCondensation, or full)
 * @property pipelineSignature - The ordered list of {phase, promptId} pairs used up to this phase
 * @property promptCalls - The prompt calls made up to this phase
 * @property timestamp - The timestamp of when this result was generated
 */
export interface BaseCachedResult {
  questionId: string;
  phase: CondensationPhase;
  pipelineSignature: PipelineSignature; // ordered list of {phase, promptId}
  promptCalls: PromptCall[];
  timestamp: string;
}

/**
 * A cached result that includes an evaluation score and details.
 * 
 * 
 * @property evaluation - The evaluation score and explanation for this result
 */
export interface FinalCachedResult extends BaseCachedResult {
  evaluation: {
    score: number;
    explanation: string;
  };
}