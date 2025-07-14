import { Argument } from './argument';

/**
 * Expected structure for LLM response containing arguments and reasoning
 */
export interface ResponseWithArguments {
  arguments: Array<Argument>;
  reasoning: string;
}