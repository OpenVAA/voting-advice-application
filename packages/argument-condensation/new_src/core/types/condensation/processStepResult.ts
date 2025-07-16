import { Argument } from '../argument';
import { PromptCall } from '../promptCall';

/**
 * Result from a single condensation step (map, reduce, iterateMap, refine)
 */
export interface CondensationStepResult {
  arguments: Array<Argument> | Array<Array<Argument>>;
  promptCalls: Array<PromptCall>;
  nodeIds?: Array<string>;
  stepLevelsConsumed?: number; // How many step levels this operation consumed (default 1)
}
