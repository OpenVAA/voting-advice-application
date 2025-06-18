import type { CondensationPhase } from '../../../core/types/condensationPhase';
import { PromptCall } from '../../../core/types/promptCall';
import type { PipelineSignature } from '../../../core/types/pipelineSignature';
import { CondensationMethod } from '../../../core/types/condensationMethod';
import { CondensationOutputType } from '../../../core/types/condensationType';
/**
 * The base interface for a cached result of a golden dataset condensation run.
 * 
 * @property questionId - The ID of the VAA question
 * @property runId - The ID of the run
 * @property phase - The phase this result represents (e.g. initialCondensation, mainCondensation, or full)
 * @property pipelineSignature - The ordered list of {phase, promptId} pairs used up to this phase
 * @property promptCalls - The prompt calls made up to this phase
 * @property timestamp - The timestamp of when this result was generated
 */
export interface PartialCondensationRunRecord {
  questionId: string;
  runId: string;
  phase: CondensationPhase;
  method: CondensationMethod;
  outputType: CondensationOutputType; 
  pipelineSignature: PipelineSignature; // ordered list of {phase, promptId}
  promptCalls: PromptCall[];
  timestamp: string;
}

/**
 * A cached result that includes an evaluation score and details.
 * 
 * @property questionId - The ID of the VAA question
 * @property runId - The ID of the run
 * @property phase - The phase this result represents (e.g. initialCondensation, mainCondensation, or full)
 * @property pipelineSignature - The ordered list of {phase, promptId} pairs used up to this phase
 * @property promptCalls - The prompt calls made up to this phase
 * @property timestamp - The timestamp of when this result was generated
 * @property evaluation - The evaluation score and explanation for this result
 */
export interface FullCondensationRunRecord extends PartialCondensationRunRecord {
  evaluation: {
    score: number;
    explanation: string;
  };
}