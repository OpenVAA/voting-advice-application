import { PromptCall } from '../../../core/types/promptCall';
import { CondensationOutputType } from '../../../core/types/condensationType';
import { CondensationPlan } from '../../../core/types/condensation/processDefinition';

/**
 * The base interface for a cached result of a golden dataset condensation run.
 * 
 * @property questionId - The ID of the VAA question
 * @property runId - The ID of the run
 * @property model - The model that was used for this run
 * @property plan - The condensation plan that was used for this run
 * @property promptCalls - The prompt calls made up to this point
 * @property timestamp - The timestamp of when this result was generated
 */
export interface PartialCondensationRunRecord {
  questionId: string;
  runId: string;
  outputType: CondensationOutputType; 
  model: string;
  plan: CondensationPlan; // The plan that was used for this run
  promptCalls: PromptCall[];
  timestamp: string;
}

/**
 * A cached result that includes an evaluation score and details.
 * 
 * @property questionId - The ID of the VAA question
 * @property runId - The ID of the run
 * @property plan - The condensation plan that was used for this run
 * @property promptCalls - The prompt calls made up to this point
 * @property timestamp - The timestamp of when this result was generated
 * @property evaluation - The evaluation score and explanation for this result
 */
export interface FullCondensationRunRecord extends PartialCondensationRunRecord {
  evaluation: {
    score: number;
    explanation: string;
  };
}